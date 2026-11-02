import { useEffect, useRef, useState } from 'react'
import { Disc3, ListMusic, Mic2, Music2, Pause, Play, SkipBack, SkipForward, Trash2, Volume2, VolumeX } from 'lucide-react'

const MAX_TRACKS = 10
const DATABASE_NAME = 'phopse-portfolio-music'
const STORE_NAME = 'tracks'
type SavedTrack = { id: string; name: string; fileName: string; blob: Blob; addedAt: number }
type Track = SavedTrack & { url: string }

function openLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Persistent browser storage is unavailable.'))
      return
    }
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open the music library.'))
  })
}

async function getSavedTracks(): Promise<SavedTrack[]> {
  const database = await openLibrary()
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => { database.close(); resolve((request.result as SavedTrack[]).sort((a, b) => a.addedAt - b.addedAt)) }
    request.onerror = () => { database.close(); reject(request.error ?? new Error('Could not load saved songs.')) }
  })
}

async function saveTracks(tracks: SavedTrack[]): Promise<void> {
  const database = await openLibrary()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    tracks.forEach(track => store.put(track))
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not save songs.')) }
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Song storage was interrupted.')) }
  })
}

async function deleteSavedTrack(id: string): Promise<void> {
  const database = await openLibrary()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => { database.close(); resolve() }
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not remove this song.')) }
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Removing the song was interrupted.')) }
  })
}

function makeTrack(saved: SavedTrack): Track {
  return { ...saved, url: URL.createObjectURL(saved.blob) }
}

export default function MusicPlayer() {
  const audio = useRef<HTMLAudioElement>(null)
  const urls = useRef<string[]>([])
  const [tracks, setTracks] = useState<Track[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(0)
  const [volume, setVolume] = useState(0.72)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const track = tracks.find(item => item.id === selectedId)
  const index = Math.max(0, tracks.findIndex(item => item.id === selectedId))

  useEffect(() => {
    let active = true
    const audioElement = audio.current
    void getSavedTracks().then(saved => {
      if (!active) return
      const restored = saved.slice(0, MAX_TRACKS).map(makeTrack)
      urls.current.push(...restored.map(item => item.url))
      setTracks(restored)
      setSelectedId(restored[0]?.id ?? '')
    }).catch(() => {
      if (active) setError('Could not access this browser’s music storage. Check available site storage and try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => {
      active = false
      audioElement?.pause()
      urls.current.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (audio.current) { audio.current.volume = volume; audio.current.muted = muted }
  }, [volume, muted])

  async function toggle() {
    const element = audio.current
    if (!element || !track) return
    if (playing) { element.pause(); setPlaying(false); return }
    try { await element.play(); setPlaying(true); setError('') }
    catch { setPlaying(false); setError('This audio file could not be played by the browser.') }
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    setError('')
    const available = MAX_TRACKS - tracks.length
    const candidates = Array.from(files).filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i.test(file.name))
    const added = candidates.slice(0, available).map(file => ({
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, blob: file, addedAt: Date.now(),
    }))
    if (!candidates.length) { setError('Choose supported audio files such as MP3, M4A, WAV, or OGG.'); return }
    if (!added.length) { setError('Your playlist already has 10 songs. Remove a song before adding another.'); return }
    try {
      await saveTracks(added)
      const newTracks = added.map(makeTrack)
      urls.current.push(...newTracks.map(item => item.url))
      setTracks(current => [...current, ...newTracks])
      setSelectedId(current => current || newTracks[0].id)
      if (candidates.length > available) setError(`Added ${added.length} songs. The playlist limit is 10; the extra files were not added.`)
    } catch {
      setError('The browser could not save these songs. Check available storage and try again.')
    }
  }

  async function removeTrack(id: string) {
    const removed = tracks.find(item => item.id === id)
    if (!removed) return
    try {
      await deleteSavedTrack(id)
      if (selectedId === id) { audio.current?.pause(); setPlaying(false); setTime(0); setDuration(0) }
      const remaining = tracks.filter(item => item.id !== id)
      setTracks(remaining)
      if (selectedId === id) setSelectedId(remaining[Math.min(index, remaining.length - 1)]?.id ?? '')
      URL.revokeObjectURL(removed.url)
      urls.current = urls.current.filter(url => url !== removed.url)
      setError('')
    } catch { setError('Could not remove this song from browser storage. Try again.') }
  }

  function select(next: number) {
    if (!tracks.length) return
    setSelectedId(tracks[(next + tracks.length) % tracks.length].id)
    setTime(0); setDuration(0); setPlaying(false); setError('')
  }

  function format(value: number) { return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` }

  return <section className="music-player" aria-label="Music Player">
    <header className="music-heading"><span><Music2 size={18}/></span><div><b>Music Player</b><small>Up to 10 songs · plays only on request</small></div><span className="music-status">{playing ? 'PLAYING' : loading ? 'LOADING' : 'READY'}</span></header>
    <p className="music-policy">Your playlist is saved in this browser on this device. It works on the hosted site too; songs are not shared with other visitors.</p>
    <audio ref={audio} src={track?.url} preload="metadata" onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onEnded={() => select(index + 1)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { if (track) setError('This audio file is missing or unsupported. Choose another file.') }}/>
    {track ? <>
      <div className="music-artwork"><Disc3 size={52}/><span className={playing ? 'spinning' : ''}><Music2 size={21}/></span></div>
      <div className="music-now-playing"><b>{track.name}</b><small>{track.fileName}</small></div>
      <div className="music-seek"><span>{format(time)}</span><input aria-label="Seek track" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(time, duration || 0)} onChange={event => { const value = Number(event.target.value); if (audio.current) audio.current.currentTime = value; setTime(value) }}/><span>{duration ? format(duration) : '--:--'}</span></div>
      <div className="music-controls"><button aria-label="Previous track" onClick={() => select(index - 1)}><SkipBack size={17}/></button><button className="music-play" aria-label={playing ? 'Pause' : 'Play'} onClick={() => void toggle()}>{playing ? <Pause size={19}/> : <Play size={19}/>}</button><button aria-label="Next track" onClick={() => select(index + 1)}><SkipForward size={17}/></button></div>
      <div className="music-volume"><button aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(value => !value)}>{muted || volume === 0 ? <VolumeX size={15}/> : <Volume2 size={15}/>}</button><input type="range" min="0" max="1" step="0.01" aria-label="Volume" value={volume} onChange={event => setVolume(Number(event.target.value))}/><span>{index + 1} / {tracks.length}</span></div>
      <div className="music-playlist"><h3><ListMusic size={14}/> Playlist <span>{tracks.length} / {MAX_TRACKS}</span></h3>{tracks.map((item, i) => <div className={`music-track-row${selectedId === item.id ? ' selected' : ''}`} key={item.id}><button className="music-track-select" onClick={() => select(i)}><span>{String(i + 1).padStart(2, '0')}</span><b>{item.name}</b><small>{selectedId === item.id && playing ? 'Playing' : 'Saved'}</small></button><button className="music-track-remove" aria-label={`Remove ${item.name}`} title={`Remove ${item.name}`} onClick={() => void removeTrack(item.id)}><Trash2 size={13}/></button></div>)}</div>
    </> : <div className="music-empty"><span><Disc3 size={34}/></span><b>{loading ? 'Loading your playlist…' : 'Your playlist is empty'}</b><p>{loading ? 'Checking this browser for saved songs.' : 'Choose up to 10 audio files. They stay saved in this browser and are available again when you return to this site.'}</p></div>}
    <label className={`music-add${tracks.length >= MAX_TRACKS ? ' disabled' : ''}`}><Mic2 size={15}/><span>{tracks.length >= MAX_TRACKS ? 'Playlist full · remove a song to add more' : `Add songs · ${tracks.length} of ${MAX_TRACKS}`}</span><input type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.opus,.flac,.webm" multiple aria-label="Add local audio files" disabled={loading || tracks.length >= MAX_TRACKS} onChange={event => { void addFiles(event.currentTarget.files); event.currentTarget.value = '' }}/></label>
    {error && <p className="music-error" role="alert">{error}</p>}
  </section>
}
