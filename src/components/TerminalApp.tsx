import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowUpRight, Copy } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { getProjectBySlug, runCommand } from '../lib/terminal'
import type { Project } from '../data/projects'

type Props = { onCase: (project: Project) => void; onExit: () => void }
const projectSlugs = projects.map(project => project.id)
const completions = ['help', 'about', 'profile', 'projects', 'open ', 'skills', 'stack', 'experience', 'certifications', 'education', 'journey', 'resume', 'contact', 'ls', 'cat ', 'inspect ', 'git log', 'clear', 'sudo hire-me', ...projectSlugs]

function linkedText(text: string): ReactNode[] {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) => part.startsWith('http')
    ? <a key={index} href={part.replace(/[),.;]+$/, '')} target="_blank" rel="noopener noreferrer">{part}<ArrowUpRight size={11}/></a>
    : part)
}

export default function TerminalApp({ onCase, onExit }: Props) {
  const [lines, setLines] = useState<string[]>(['phopse.dev simulated portfolio CLI · type help to explore.'])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [notice, setNotice] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const output = useRef<HTMLDivElement>(null)
  useEffect(() => { field.current?.focus() }, [])
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight }, [lines, notice])

  async function copyValue(value: string, label: string) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setNotice(`${label} copied to clipboard.`)
    } catch {
      setNotice(`Clipboard access isn't available here. Select the ${label.toLowerCase()} from the contact output to copy it.`)
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const command = input.trim()
    if (command.length > 120) {
      setLines(previous => [...previous, `$ ${command.slice(0, 40)}…`, 'Input is too long (120 character limit).'])
      setInput('')
      return
    }
    if (!command) {
      setLines(previous => [...previous, '$', 'Tip: type help to see what you can explore.'])
      return
    }
    const result = runCommand(command)
    if (command.toLowerCase() === 'clear') {
      setLines([])
      setNotice('')
      setHistory(previous => [command, ...previous].slice(0, 40))
      setHistoryIndex(-1)
      setInput('')
      field.current?.focus()
      return
    }
    const openMatch = command.match(/^open\s+(.+)$/i)
    if (openMatch) {
      const project = getProjectBySlug(openMatch[1])
      if (project) onCase(project)
    }
    setLines(previous => [...previous, `$ ${command}`, ...(result ? result.split('\n') : [])])
    setNotice('')
    setHistory(previous => [command, ...previous].slice(0, 40))
    setHistoryIndex(-1)
    setInput('')
    field.current?.focus()
  }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault()
      const next = Math.min(historyIndex + 1, history.length - 1)
      setHistoryIndex(next)
      setInput(history[next] ?? '')
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = Math.max(historyIndex - 1, -1)
      setHistoryIndex(next)
      setInput(next < 0 ? '' : history[next] ?? '')
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const value = input.toLowerCase()
      const candidates = value.startsWith('open ')
        ? projectSlugs.map(slug => `open ${slug}`)
        : value.startsWith('cat projects/')
          ? projectSlugs.map(slug => `cat projects/${slug}`)
          : completions
      const match = candidates.find(candidate => candidate.startsWith(value))
      if (match) setInput(match)
    }
  }
  function renderLine(line: string, index: number) {
    if (line === '__HIRE_ACTIONS__') return <div className="terminal-actions" key={`hire-${index}`}>
      {profile.links.resume
        ? <a href={profile.links.resume} target="_blank" rel="noopener noreferrer">View Resume <ArrowUpRight size={12}/></a>
        : <span className="terminal-action-disabled" title="Resume link is not configured">View Resume · not configured</span>}
      <a href="#contact" onClick={event => { event.preventDefault(); onExit(); window.setTimeout(() => { window.location.hash = '#contact' }, 0) }}>Contact Me <ArrowUpRight size={12}/></a>
    </div>
    const contact = line.match(/^(Email|Phone): (.*)$/)
    if (contact) {
      const [, label, value] = contact
      const configured = !value.startsWith('[configure ')
      const href = label === 'Email' ? `mailto:${value}` : `tel:${value.replace(/[^+\d]/g, '')}`
      return <div key={`contact-${index}`} className="terminal-contact-line"><span>{label}: </span>{configured ? <a href={href}>{value}</a> : <span>{value}</span>}<button type="button" disabled={!configured} aria-label={`Copy ${label.toLowerCase()}`} title={configured ? `Copy ${label.toLowerCase()}` : `Configure VITE_PORTFOLIO_${label.toUpperCase()} first`} onClick={() => void copyValue(value, label)}><Copy size={12}/> copy</button></div>
    }
    return <div key={`${index}-${line}`} className={line.startsWith('$') ? 'command-line' : 'terminal-result-line'}>{linkedText(line)}</div>
  }

  return <div className="terminal" onClick={() => field.current?.focus()}>
    <div className="terminal-banner"><span className="term-light"/> Portfolio CLI <span>guest session</span></div>
    <div ref={output} className="terminal-output" aria-live="polite">{lines.map(renderLine)}{notice && <div className="terminal-notice" role="status">{notice}</div>}</div>
    <form className="terminal-prompt" onSubmit={submit}><label htmlFor="terminal-command">visitor@phopse.dev:~$</label><input id="terminal-command" ref={field} aria-label="Terminal command" value={input} maxLength={200} onChange={event => setInput(event.target.value)} onKeyDown={keyDown} autoComplete="off" autoCapitalize="none" spellCheck={false} enterKeyHint="go" /></form>
    <div className="terminal-foot">Enter runs · ↑ ↓ history · Tab completes · type help for commands</div>
  </div>
}

