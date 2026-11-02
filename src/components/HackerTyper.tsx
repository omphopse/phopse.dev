import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Code2, Keyboard, Pause, Play, RotateCcw, ShieldCheck, Trophy } from 'lucide-react'
import { calculateRank, calculateScore, difficulties, missionEvents, missions, type GameDifficulty, type GameMission, type MissionId } from '../lib/hackerTyper'

const keywords = new Set(['public','private','protected','static','final','class','return','if','else','try','catch','new','var','true','false','null','void'])
const tokenPattern = /(\/\/[^\n]*|--[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:public|private|protected|static|final|class|return|if|else|try|catch|new|var|true|false|null|void)\b|\b\d+\b)/g
function highlight(line: string) {
  return line.split(tokenPattern).filter(Boolean).map((token, index) => {
    const type = token.startsWith('//') || token.startsWith('--') ? 'comment'
      : token.startsWith('"') || token.startsWith("'") ? 'string'
        : /^\d+$/.test(token) ? 'number' : keywords.has(token) ? 'keyword' : 'plain'
    tokenPattern.lastIndex = 0
    return <span className={`hack-token ${type}`} key={`${index}-${token}`}>{token}</span>
  })
}

type Phase = 'setup' | 'running' | 'paused' | 'success' | 'failed'
export default function HackerTyper() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [missionId, setMissionId] = useState<MissionId>('api-breach')
  const [difficulty, setDifficulty] = useState<GameDifficulty>('Normal')
  const [revealed, setRevealed] = useState(0)
  const [keys, setKeys] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(difficulties.Normal.seconds)
  const [events, setEvents] = useState<string[]>([])
  const editor = useRef<HTMLDivElement>(null)
  const timeRef = useRef(secondsLeft)
  const progressRef = useRef(0)
  const mission = missions.find(item => item.id === missionId) ?? missions[0]
  const setting = difficulties[difficulty]
  const percent = Math.min(100, Math.floor((revealed / mission.code.length) * 100))
  const revealedText = useMemo(() => mission.code.slice(0, revealed), [mission.code, revealed])
  const outcome = phase === 'success' || phase === 'failed'
  const timeUsed = setting.seconds - secondsLeft
  const rank = calculateRank(percent, phase === 'success', secondsLeft, setting.seconds)
  const score = calculateScore(percent, phase === 'success', secondsLeft)

  useEffect(() => {
    if (phase !== 'running') return
    const timer = window.setInterval(() => {
      const next = Math.max(0, timeRef.current - 1)
      timeRef.current = next
      setSecondsLeft(next)
      if (next === 0) setPhase(current => current === 'running' ? 'failed' : current)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase])
  useEffect(() => {
    if (phase === 'running') editor.current?.focus()
  }, [phase])
  useEffect(() => {
    if (editor.current) editor.current.scrollTop = editor.current.scrollHeight
  }, [revealedText])

  function start() {
    const nextSetting = difficulties[difficulty]
    progressRef.current = 0
    timeRef.current = nextSetting.seconds
    setRevealed(0)
    setKeys(0)
    setSecondsLeft(nextSetting.seconds)
    setEvents([])
    setPhase('running')
  }
  function chooseAnother() {
    progressRef.current = 0
    setRevealed(0)
    setKeys(0)
    setSecondsLeft(setting.seconds)
    timeRef.current = setting.seconds
    setEvents([])
    setPhase('setup')
  }
  function advance() {
    if (phase !== 'running') return
    const before = progressRef.current
    const next = Math.min(mission.code.length, before + setting.charsPerKey)
    progressRef.current = next
    setRevealed(next)
    setKeys(value => value + 1)
    const beforePercent = Math.floor(before / mission.code.length * 100)
    const nextPercent = Math.floor(next / mission.code.length * 100)
    const crossed = missionEvents.filter(event => event.at > beforePercent && event.at <= nextPercent).map(event => event.message)
    if (crossed.length) setEvents(previous => [...previous, ...crossed])
    if (next >= mission.code.length) setPhase('success')
  }
  function onEditorKey(event: KeyboardEvent<HTMLDivElement>) {
    if (phase !== 'running' || event.repeat || event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target
    if (target instanceof Element && target.closest('button,input,textarea,select,[contenteditable="true"]')) return
    const eligible = event.key === 'Enter' || event.key === ' ' || /^[\p{L}\p{N}\p{P}]$/u.test(event.key)
    if (!eligible) return
    event.preventDefault()
    advance()
  }
  function formatTime(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }
  function setMission(id: MissionId) {
    setMissionId(id)
    progressRef.current = 0
    setRevealed(0)
    setKeys(0)
    setEvents([])
  }
  const codeRows = revealedText.split('\n')
  const selectMission = missions.find(item => item.id === missionId) as GameMission

  return <section className="hacker-typer-app" aria-label="Hacker Typer game">
    <header className="hacker-game-head">
      <div className="hacker-game-title"><span className="hacker-title-icon"><Code2 size={17}/></span><div><h2>Hacker Typer</h2><p>hacker.exe · fictional security simulation</p></div></div>
      <div className="hacker-head-meta"><span className={`hack-status ${phase}`}>{phase === 'running' ? 'MISSION LIVE' : phase === 'paused' ? 'PAUSED' : phase === 'success' ? 'COMPLETE' : phase === 'failed' ? 'TIME UP' : 'READY'}</span><span>{difficulty}</span></div>
      {phase === 'running' || phase === 'paused' ? <div className="hacker-game-controls"><button type="button" onClick={() => setPhase(phase === 'running' ? 'paused' : 'running')} aria-label={phase === 'running' ? 'Pause mission' : 'Resume mission'}>{phase === 'running' ? <Pause size={15}/> : <Play size={15}/>}<span>{phase === 'running' ? 'Pause' : 'Resume'}</span></button><button type="button" onClick={start} aria-label="Restart mission"><RotateCcw size={15}/><span>Restart</span></button></div> : null}
    </header>

    {phase === 'setup' && <div className="hacker-setup">
      <div className="hacker-setup-intro"><span className="hack-label"><ShieldCheck size={14}/> SAFE SIMULATION · NO NETWORK ACCESS</span><h3>Type your way through a fictional mission.</h3><p>Press keys to reveal a prewritten code sample. This game does not run commands or connect to systems.</p></div>
      <fieldset className="hack-mission-picker"><legend>Choose a mission</legend>{missions.map(item => <button type="button" key={item.id} className={item.id === missionId ? 'selected' : ''} onClick={() => setMission(item.id)}><span><b>{item.name}</b><small>{item.theme}</small><small>{item.objective}</small></span>{item.id === missionId && <Check size={17}/>}</button>)}</fieldset>
      <fieldset className="hack-difficulty-picker"><legend>Difficulty</legend>{(Object.keys(difficulties) as GameDifficulty[]).map(level => <button type="button" key={level} className={difficulty === level ? 'selected' : ''} onClick={() => setDifficulty(level)}><b>{level}</b><small>{difficulties[level].description}</small></button>)}</fieldset>
      <div className="hack-setup-bottom"><p>Each key reveals up to {setting.charsPerKey} characters. Finish before the timer reaches zero.</p><button type="button" className="hack-primary" onClick={start}><Play size={15} fill="currentColor"/> Start mission</button></div>
    </div>}

    {(phase === 'running' || phase === 'paused') && <>
      <div className="hacker-mission-strip"><div><b>{mission.name}</b><span>{mission.objective}</span></div><span className="hack-simulation-tag">SIMULATED · FICTIONAL</span></div>
      <div className={`hack-editor-wrap ${phase === 'paused' ? 'is-paused' : ''}`}>
        <div className="hack-editor-toolbar"><span><i/> simulated-source.java</span><span>{phase === 'paused' ? 'PAUSED' : 'READ ONLY · KEY TO REVEAL'}</span></div>
        <div ref={editor} className="hack-editor" tabIndex={phase === 'running' ? 0 : -1} role="application" aria-label="Code reveal area. Press a letter, number, punctuation, Space or Enter to reveal code." onKeyDown={onEditorKey} onClick={() => phase === 'running' && editor.current?.focus()}>
          {phase === 'paused' ? <div className="hack-pause-overlay"><Pause size={21}/><b>Mission paused</b><span>Resume to continue the simulation.</span></div> : null}
          <div className="hack-code"><div className="hack-line-numbers" aria-hidden="true">{codeRows.map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}</div><pre aria-label={`${percent}% of code revealed`}>{codeRows.map((line, index) => <span className="hack-code-row" key={`${index}-${line}`}>{highlight(line)}{index === codeRows.length - 1 && phase === 'running' && <i className="hack-cursor"/>}{index < codeRows.length - 1 ? '\n' : ''}</span>)}</pre></div>
          {phase === 'running' && <button type="button" className="hack-tap-control" onClick={advance}><Keyboard size={16}/> Tap to type</button>}
        </div>
        <div className="hack-event-feed" aria-live="polite">{events.length ? events.slice(-2).map((event, index) => <span key={`${event}-${index}`}><Check size={12}/>{event}</span>) : <span className="quiet-event">Awaiting keystrokes · fictional code only</span>}</div>
      </div>
    </>}

    {outcome && <div className="hack-result" role="status"><div className={`hack-result-mark ${phase}`}><Trophy size={24}/></div><span className="hack-label">{phase === 'success' ? 'MISSION COMPLETE' : 'MISSION FAILED'}</span><h3>{phase === 'success' ? 'BUGS ELIMINATED. SHIP IT.' : 'The timer ran out.'}</h3><div className="hack-result-stats"><span><small>Score</small><b>{score}</b></span><span><small>Time used</small><b>{formatTime(timeUsed)}</b></span><span><small>Progress</small><b>{percent}%</b></span><span><small>Rank</small><b>{rank}</b></span></div><p>Score = progress points (1 per %) + 500 completion points + 10 points per second remaining. Ranks: Root Access = finish with at least 75% of the timer left; Code Runner = other finishes; Debugger = 60%+ progress at timeout; Script Kiddie = below 60%.</p><div className="hack-result-actions"><button className="hack-primary" type="button" onClick={start}><RotateCcw size={15}/> {phase === 'success' ? 'Replay mission' : 'Retry mission'}</button><button className="hack-secondary" type="button" onClick={chooseAnother}>Choose another mission</button></div></div>}

    <footer className="hacker-game-footer"><span><Keyboard size={13}/> Keys <b>{keys}</b></span><span>Progress <b>{percent}%</b><i className="hack-progress-track"><i style={{ width: `${percent}%` }}/></i></span><span>Timer <b>{formatTime(secondsLeft)}</b></span><span>Rank <b>{outcome ? rank : '—'}</b></span><span>Status <b>{phase === 'setup' ? 'Ready' : phase === 'running' ? 'Live' : phase === 'paused' ? 'Paused' : phase === 'success' ? 'Complete' : 'Failed'}</b></span></footer>
    <span className="sr-only">Selected mission: {selectMission.name}</span>
  </section>
}






