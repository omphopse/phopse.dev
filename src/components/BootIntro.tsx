import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { createBootCircuit } from '../lib/bootCircuit'
import { startEngine } from '../lib/bootEngine'
import './bootIntro.css'

const sessionKey = 'phopse-boot-seen'
const muteKey = 'phopse-boot-muted'
const cinematicDuration = 9000
const reducedDuration = 380
const fadeDuration = 1000

export default function BootIntro() {
  const [visible, setVisible] = useState(() => {
    try { return sessionStorage.getItem(sessionKey) !== '1' } catch { return true }
  })
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [sound, setSound] = useState<'pending' | 'playing' | 'blocked' | 'muted'>(() => {
    try { if (sessionStorage.getItem(muteKey) === '1') return 'muted' } catch { /* Storage is optional. */ }
    return 'blocked'
  })
  const dialog = useRef<HTMLDialogElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<ReturnType<typeof startEngine> | null>(null)
  const started = useRef(0)
  const duration = reduced ? reducedDuration : cinematicDuration

  useEffect(() => {
    const overlay = dialog.current
    if (!visible || !overlay) return

    let frame = 0
    const finish = () => {
      cancelAnimationFrame(frame)
      engine.current?.stop()
      engine.current = null
      overlay.close()
      setVisible(false)
    }
    const onVisibility = () => { if (document.hidden) finish() }
    const onKey = (event: KeyboardEvent) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      }
    }

    if (document.hidden) {
      finish()
      return
    }

    try { sessionStorage.setItem(sessionKey, '1') } catch { /* Storage is optional. */ }
    try {
      const draw = canvas.current && createBootCircuit(canvas.current)
      overlay.showModal()
      started.current = performance.now()
      if (draw) {
        draw(0)
        const render = (now: number) => {
          try {
            draw(Math.max(0, now - started.current))
            frame = requestAnimationFrame(render)
          } catch {
            finish()
          }
        }
        frame = requestAnimationFrame(render)
      }
    } catch {
      finish()
      return
    }

    if (!reduced) {
      let muted = false
      try { muted = sessionStorage.getItem(muteKey) === '1' } catch { /* Storage is optional. */ }
      if (!muted) {
        // A suspended context may never resolve without a gesture.
        const attempt = beginSound()
        const blocked = window.setTimeout(() => {
          if (engine.current === attempt) setSound(current => current === 'pending' ? 'blocked' : current)
        }, 250)
        overlay.addEventListener('close', () => window.clearTimeout(blocked), { once: true })
      }
    }
    const timeout = window.setTimeout(finish, duration)
    document.addEventListener('visibilitychange', onVisibility)
    overlay.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisibility)
      overlay.removeEventListener('keydown', onKey)
      overlay.close()
      engine.current?.stop()
      engine.current = null
    }
  }, [duration, reduced, visible])

  function beginSound() {
    engine.current?.stop()
    const attempt = startEngine(() => performance.now() - started.current)
    engine.current = attempt
    setSound(attempt ? 'pending' : 'blocked')
    void attempt?.ready.then(playing => {
      if (engine.current === attempt) setSound(playing ? 'playing' : 'blocked')
    })
    return attempt
  }

  function toggleSound() {
    const mute = sound === 'playing'
    try { sessionStorage.setItem(muteKey, mute ? '1' : '0') } catch { /* Storage is optional. */ }
    if (mute) {
      engine.current?.stop()
      engine.current = null
      setSound('muted')
    } else {
      beginSound()
    }
  }
  if (!visible) return null

  const timing = {
    '--boot-fade-at': `${reduced ? 0 : duration - fadeDuration}ms`,
    '--boot-fade': `${reduced ? reducedDuration : fadeDuration}ms`,
  } as CSSProperties

  return <dialog ref={dialog} className={reduced ? 'boot-intro boot-reduced' : 'boot-intro'}
    aria-label="DEV OS startup" style={timing}>
    {!reduced && <canvas className="boot-circuit" ref={canvas} aria-hidden="true" />}
    <div className="boot-brand" aria-hidden="true"><small>DEV OS</small><strong>phopse.dev</strong></div>
    {!reduced && <div className="boot-controls">
      <button type="button" className="boot-sound" onClick={toggleSound}>
        {sound === 'playing' ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
        {sound === 'playing' ? 'Mute Sound' : sound === 'muted' ? 'Unmute Sound' : 'Enable Sound'}
      </button>
      <button type="button" onClick={() => setVisible(false)}>Skip Intro</button>
    </div>}
  </dialog>
}

