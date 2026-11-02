import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const encoder = new TextEncoder()
const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
})
const hash = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  const allowedOrigin = Deno.env.get('CONTACT_ALLOWED_ORIGIN') ?? ''
  const origin = req.headers.get('origin') ?? ''
  const headers = corsHeaders(allowedOrigin)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  if (!allowedOrigin) return json({ error: 'Contact delivery is not configured.' }, 503)
  if (origin !== allowedOrigin) return json({ error: 'Origin not allowed.' }, 403)
  const length = Number(req.headers.get('content-length') ?? 0)
  if (length > 10_000) return json({ error: 'Request too large.' }, 413)
  const apiKey = Deno.env.get('RESEND_API_KEY'), to = Deno.env.get('CONTACT_TO_EMAIL'), from = Deno.env.get('CONTACT_FROM_EMAIL')
  if (!apiKey || !to || !from) return json({ error: 'Contact delivery is not configured.' }, 503)
  const forwarded = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ipHash = await hash(forwarded)
  const bucket = Math.floor(Date.now() / 60_000)
  const key = `contact-rate:${bucket}:${ipHash}`
  const existingRates = (globalThis as typeof globalThis & { __rate?: Map<string, number> }).__rate
  if (existingRates) for (const oldKey of existingRates.keys()) if (!oldKey.startsWith(`contact-rate:${bucket}:`)) existingRates.delete(oldKey)
  const current = Number(existingRates?.get(key) ?? 0)
  // Best-effort per-isolate limit: for distributed enforcement configure Supabase's gateway/WAF rate limits.
  const rates = (globalThis as typeof globalThis & { __rate?: Map<string, number> }).__rate ?? new Map<string, number>()
  rates.set(key, current + 1); (globalThis as typeof globalThis & { __rate?: Map<string, number> }).__rate = rates
  if (current >= 5) return json({ error: 'Too many requests. Please try again in a minute.' }, 429)
  let data: unknown
  try {
    const reader = req.body?.getReader()
    if (!reader) return json({ error: 'Invalid JSON body.' }, 400)
    const chunks: Uint8Array[] = []; let total = 0
    while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > 10_000) { await reader.cancel(); return json({ error: 'Request too large.' }, 413) } chunks.push(value) }
    const bytes = new Uint8Array(total); let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    data = JSON.parse(new TextDecoder().decode(bytes))
  } catch { return json({ error: 'Invalid JSON body.' }, 400) }
  if (!data || typeof data !== 'object') return json({ error: 'Invalid request.' }, 400)
  const { name, email, subject, message, website } = data as Record<string, unknown>
  if (typeof website === 'string' && website.trim()) return json({ ok: true })
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 80 || /[\r\n]/.test(name)) return json({ error: 'Please provide a valid name.' }, 400)
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please provide a valid email.' }, 400)
  if (typeof subject !== 'string' || subject.trim().length < 2 || subject.length > 120 || /[\r\n]/.test(subject)) return json({ error: 'Please provide a valid subject.' }, 400)
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 4000) return json({ error: 'Message must be between 10 and 4,000 characters.' }, 400)
  const resend = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], reply_to: email, subject: `[Portfolio] ${subject.trim()}`, text: `From: ${name.trim()} <${email}>\n\n${message.trim()}` }),
  })
  if (!resend.ok) { console.error('Resend delivery failed', resend.status); return json({ error: 'Message could not be delivered. Please try again later.' }, 502) }
  return json({ ok: true })
})
