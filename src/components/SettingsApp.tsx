import { useState, type ChangeEvent } from 'react'
import { Check, Image as ImageIcon, Pause, Play, RotateCcw, Settings2, Sparkles, SunMoon, Upload, Monitor as WindowIcon } from 'lucide-react'
import { accentColorForTheme, accentForeground, accentPresets, resolveAppearance, wallpaperBackground, wallpaperOptions, type OsPreferences, type WallpaperId } from '../lib/osPreferences'
import { CIRCUIT_PATH_D } from '../lib/circuitSimulation'

type SettingsSection = 'appearance' | 'accent' | 'wallpaper' | 'windows' | 'reset'
type Props = {
  preferences: OsPreferences
  effectiveAppearance: 'light' | 'dark'
  customWallpaper: string | null
  onChange: (update: Partial<OsPreferences>) => void
  onCustomWallpaper: (url: string | null) => void
  onReset: () => void
  circuitPaused: boolean
  onToggleCircuitPause: () => void
  onResetCircuit: () => void
}
const settingsSections: { id: SettingsSection; label: string; icon: typeof SunMoon }[] = [
  { id: 'appearance', label: 'Appearance', icon: SunMoon },
  { id: 'accent', label: 'Accent Color', icon: Sparkles },
  { id: 'wallpaper', label: 'Wallpaper', icon: ImageIcon },
  { id: 'windows', label: 'Window Style', icon: WindowIcon },
  { id: 'reset', label: 'Reset Settings', icon: RotateCcw },
]
const uploadLimit = 3 * 1024 * 1024

function WallpaperSwatch({ id, background }: { id: string; background: string }) {
  return <span className={`settings-wallpaper-swatch ${id === 'solid' ? 'solid-swatch' : ''} ${id==='circuit-run'?'circuit-swatch':''}`} style={{ background }} aria-hidden="true">{id==='circuit-run'&&<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice"><path d={CIRCUIT_PATH_D} fill="none" stroke="#E3DCD2" strokeWidth="98"/><path d={CIRCUIT_PATH_D} fill="none" stroke="#292d2d" strokeWidth="84"/><circle cx="410" cy="170" r="9" fill="#CC8B65"/><circle cx="700" cy="455" r="9" fill="#FAF8F4"/></svg>}</span>
}

export default function SettingsApp({ preferences, effectiveAppearance, customWallpaper, onChange, onCustomWallpaper, onReset, circuitPaused, onToggleCircuitPause, onResetCircuit }: Props) {
  const [section, setSection] = useState<SettingsSection>('appearance')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const currentWallpaper = wallpaperBackground(preferences, customWallpaper)
  const accentName = accentPresets.find(preset => preset.color === preferences.accentColor)?.name ?? 'Custom color'
  const appearance = resolveAppearance(preferences.appearance, effectiveAppearance === 'dark')
  const displayAccent = accentColorForTheme(preferences.accentColor, appearance === 'dark')

  async function uploadWallpaper(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    setUploadError('')
    setUploadMessage('')
    if (!file) return
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      setUploadError('Choose a PNG, JPEG, or WebP image.')
      return
    }
    if (file.size > uploadLimit) {
      setUploadError('The image must be 3 MB or smaller.')
      return
    }
    const url = URL.createObjectURL(file)
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => reject(new Error('This image could not be opened.'))
        image.src = url
      })
      if (dimensions.width < 128 || dimensions.height < 128 || dimensions.width > 8192 || dimensions.height > 8192 || dimensions.width * dimensions.height > 25_000_000) {
        URL.revokeObjectURL(url)
        setUploadError('Use an image between 128 × 128 and 8192 × 8192 pixels (up to 25 megapixels).')
        return
      }
      onCustomWallpaper(url)
      onChange({ wallpaperId: 'custom' })
      setUploadMessage(`${file.name} is previewing for this session only. It stays on this device and is not uploaded or stored in settings.`)
    } catch {
      URL.revokeObjectURL(url)
      setUploadError('This image could not be read. Try a different PNG, JPEG, or WebP file.')
    }
  }

  function selectWallpaper(id: WallpaperId) {
    onChange({ wallpaperId: id })
    if (id !== 'custom') {
      onCustomWallpaper(null)
      setUploadMessage('')
      setUploadError('')
    }
  }

  return <section className={`os-settings ${appearance}`} aria-label="Developer OS settings">
    <header className="settings-heading"><span className="settings-heading-icon"><Settings2 size={19}/></span><div><h2>Settings</h2><p>Personalize your workspace · changes save automatically</p></div><span className="settings-saved"><Check size={12}/> Saved</span></header>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Personalization settings">{settingsSections.map(item => { const Icon = item.icon; return <button type="button" key={item.id} className={section === item.id ? 'selected' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}><Icon size={15}/><span>{item.label}</span></button> })}</nav>
      <div className="settings-content">
        {section === 'appearance' && <div className="settings-pane"><span className="settings-eyebrow">PERSONALIZATION</span><h3>Appearance</h3><p className="settings-description">Choose how the desktop, app windows, and controls appear.</p><fieldset className="settings-mode-options"><legend>Appearance mode</legend>{(['light', 'dark', 'system'] as const).map(mode => <label key={mode} className={preferences.appearance === mode ? 'selected' : ''}><input type="radio" name="appearance" value={mode} checked={preferences.appearance === mode} onChange={() => onChange({ appearance: mode })}/><span><b>{mode[0].toUpperCase() + mode.slice(1)}</b><small>{mode === 'system' ? `Follows this device · currently ${effectiveAppearance}` : mode === 'light' ? 'Warm, light app surfaces' : 'Deep, low-light app surfaces'}</small></span>{preferences.appearance === mode && <Check size={15}/>}</label>)}</fieldset></div>}

        {section === 'accent' && <div className="settings-pane"><span className="settings-eyebrow">PERSONALIZATION</span><h3>Accent Color</h3><p className="settings-description">The accent highlights selected apps, controls, and focus states.</p><div className="settings-accent-grid" role="radiogroup" aria-label="Accent color presets">{accentPresets.map(preset => <button type="button" key={preset.color} role="radio" aria-checked={preferences.accentColor === preset.color} aria-label={`${preset.name}, ${preset.color}`} className={preferences.accentColor === preset.color ? 'selected' : ''} onClick={() => onChange({ accentColor: preset.color })}><span className="accent-swatch" style={{ backgroundColor: preset.color }}><Check size={13}/></span><span><b>{preset.name}</b><small>{preset.color}</small></span></button>)}</div><label className="custom-accent"><span><b>Custom color</b><small>Choose a validated hex color</small></span><input type="color" aria-label="Choose a custom accent color" value={preferences.accentColor} onChange={event => { if (/^#[0-9a-f]{6}$/i.test(event.target.value)) onChange({ accentColor: event.target.value.toUpperCase() }) }}/></label><p className="settings-current-accent">Selected: <span className="accent-swatch-small" style={{ backgroundColor: preferences.accentColor }}/>{accentName} · {preferences.accentColor}</p></div>}

        {section === 'wallpaper' && <div className="settings-pane"><span className="settings-eyebrow">PERSONALIZATION</span><h3>Wallpaper</h3><p className="settings-description">Choose a built-in background, a solid color, or a local image.</p><div className="settings-wallpaper-grid" role="radiogroup" aria-label="Wallpaper choices">{wallpaperOptions.map(option => <button type="button" key={option.id} role="radio" aria-checked={preferences.wallpaperId === option.id} className={preferences.wallpaperId === option.id ? 'selected' : ''} onClick={() => selectWallpaper(option.id)}><WallpaperSwatch id={option.id} background={option.id === 'solid' ? preferences.solidWallpaperColor : option.background}/><span>{option.name}</span>{preferences.wallpaperId === option.id && <Check size={13}/>}</button>)}{customWallpaper && <button type="button" role="radio" aria-checked={preferences.wallpaperId === 'custom'} className={preferences.wallpaperId === 'custom' ? 'selected' : ''} onClick={() => onChange({ wallpaperId: 'custom' })}><WallpaperSwatch id="custom" background={`url("${customWallpaper}") center / cover`}/><span>Custom image</span>{preferences.wallpaperId === 'custom' && <Check size={13}/>}</button>}</div>
          {preferences.wallpaperId==='circuit-run'&&<div className="settings-circuit-controls"><div className="settings-circuit-caption"><b>SIMULATED RACE</b><small>Imola, Italy · local car simulation, not live timing</small></div><label className="settings-toggle"><span><b>Animate Imola Circuit</b><small>Automatically pauses for reduced-motion preference</small></span><input type="checkbox" checked={preferences.circuitAnimated} onChange={event=>onChange({circuitAnimated:event.target.checked})}/></label><div className="settings-circuit-buttons"><button type="button" onClick={onToggleCircuitPause}>{circuitPaused?<Play size={13}/>:<Pause size={13}/>} {circuitPaused?'Resume race':'Pause race'}</button><button type="button" onClick={onResetCircuit}><RotateCcw size={13}/> Reset race</button></div><label className="settings-circuit-select">Cars<select aria-label="Number of racing cars" value={preferences.circuitCarCount} onChange={event=>onChange({circuitCarCount:Number(event.target.value)})}>{[4,6,8,10].map(count=><option value={count} key={count}>{count} cars</option>)}</select></label><label className="settings-circuit-select">Quality<select aria-label="Circuit wallpaper quality" value={preferences.circuitQuality} onChange={event=>onChange({circuitQuality:event.target.value as OsPreferences['circuitQuality']})}><option value="low">Low · 30 FPS cap</option><option value="balanced">Balanced · 45 FPS cap</option><option value="high">High · 60 FPS cap</option></select></label></div>}
          {preferences.wallpaperId === 'solid' && <label className="settings-inline-control"><span><b>Solid color</b><small>{preferences.solidWallpaperColor}</small></span><input type="color" aria-label="Choose solid wallpaper color" value={preferences.solidWallpaperColor} onChange={event => { if (/^#[0-9a-f]{6}$/i.test(event.target.value)) onChange({ solidWallpaperColor: event.target.value.toUpperCase() }) }}/></label>}
          <label className="settings-upload"><span className="settings-upload-icon"><Upload size={16}/></span><span><b>Choose an image</b><small>PNG, JPEG, or WebP · up to 3 MB · 128 px–8192 px</small></span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload a wallpaper image" onChange={event => void uploadWallpaper(event)}/></label>
          {preferences.wallpaperId === 'custom' && customWallpaper && <button type="button" className="settings-remove-wallpaper" onClick={() => { onCustomWallpaper(null); onChange({ wallpaperId: 'forest-calm' }); setUploadMessage(''); setUploadError('') }}>Remove custom wallpaper</button>}
          <fieldset className="settings-wallpaper-options"><legend>Display</legend><label>Image position<select value={preferences.wallpaperPosition} onChange={event => onChange({ wallpaperPosition: event.target.value as OsPreferences['wallpaperPosition'] })}><option value="cover">Cover / Fill</option><option value="center">Center</option></select></label><label className="settings-toggle"><span><b>Dim the wallpaper</b><small>Improves icon contrast</small></span><input type="checkbox" checked={preferences.dimWallpaper} onChange={event => onChange({ dimWallpaper: event.target.checked })}/></label></fieldset>
          {uploadError && <p className="settings-error" role="alert">{uploadError}</p>}{uploadMessage && <p className="settings-success" role="status">{uploadMessage}</p>}
          <div className="settings-wallpaper-live" aria-label="Current wallpaper preview"><div style={{ background: currentWallpaper, backgroundSize: preferences.wallpaperPosition === 'cover' ? 'cover' : 'auto', backgroundPosition: 'center' }}/><span>Current: {preferences.wallpaperId === 'custom' ? 'Custom image' : wallpaperOptions.find(option => option.id === preferences.wallpaperId)?.name}</span></div>
        </div>}

        {section === 'windows' && <div className="settings-pane"><span className="settings-eyebrow">PERSONALIZATION</span><h3>Window Style</h3><p className="settings-description">Small changes to app window shape and translucency.</p><fieldset className="settings-mode-options"><legend>Corner shape</legend>{([{ id: 'rounded', label: 'Rounded', description: 'Default soft corners' }, { id: 'sharp', label: 'Sharper', description: 'Compact square corners' }] as const).map(option => <label key={option.id} className={preferences.windowStyle === option.id ? 'selected' : ''}><input type="radio" name="window-style" checked={preferences.windowStyle === option.id} onChange={() => onChange({ windowStyle: option.id })}/><span><b>{option.label}</b><small>{option.description}</small></span>{preferences.windowStyle === option.id && <Check size={15}/>}</label>)}</fieldset><label className="settings-toggle settings-transparency"><span><b>Subtle transparency</b><small>Keep windows nearly opaque for readability.</small></span><input type="checkbox" checked={preferences.windowTransparency} onChange={event => onChange({ windowTransparency: event.target.checked })}/></label></div>}

        {section === 'reset' && <div className="settings-pane"><span className="settings-eyebrow">PERSONALIZATION</span><h3>Reset Settings</h3><p className="settings-description">Preferences are saved automatically in this browser. Restoring defaults resets the appearance, accent, wallpaper, and window style.</p><div className="settings-reset-card"><RotateCcw size={21}/><div><b>Restore default preferences</b><small>Light mode · Forest Green · Circuit Run · Rounded windows</small></div></div><button type="button" className="settings-reset-button" onClick={onReset}><RotateCcw size={14}/> Restore defaults</button><p className="settings-description">Custom wallpaper images only live for this page session and are removed when you reset settings or leave the page.</p></div>}
      </div>
      <aside className={`settings-preview ${appearance}`} aria-label="Live personalization preview"><div className="settings-preview-head"><b>Live preview</b><span>Saved automatically</span></div><div className="settings-preview-desktop" style={{ background: currentWallpaper, backgroundSize: preferences.wallpaperPosition === 'cover' ? 'cover' : 'auto' }}>{preferences.wallpaperId==='circuit-run'&&<svg className="settings-preview-circuit" viewBox="0 0 1000 600" aria-hidden="true"><path d={CIRCUIT_PATH_D} fill="none" stroke="#E3DCD2" strokeWidth="100"/><path d={CIRCUIT_PATH_D} fill="none" stroke="#292d2d" strokeWidth="84"/><path d="M270 170h30m40 0h30m40 0h30" stroke="#FAF8F4" strokeWidth="4" strokeDasharray="12 7"/></svg>}<div className="settings-preview-bar"><span>phopse.dev</span><i/></div><div className="settings-preview-window" style={{ borderRadius: preferences.windowStyle === 'sharp' ? 4 : 9, backgroundColor: appearance === 'dark' ? (preferences.windowTransparency ? 'rgba(23,34,29,.88)' : '#17221D') : (preferences.windowTransparency ? 'rgba(250,248,244,.88)' : '#FAF8F4') }}><span className="preview-window-title" style={{ background: appearance === 'dark' ? '#202D27' : '#E3DCD2' }}><i/> Sample window</span><div className="preview-window-body"><small>{appearance[0].toUpperCase() + appearance.slice(1)} appearance · {preferences.windowStyle} windows</small><button type="button" style={{ background: displayAccent, color: accentForeground(displayAccent) }}>Accent button</button></div></div><div className="settings-preview-taskbar" style={{ background: appearance === 'dark' ? '#100C0D' : '#FAF8F4' }}><i style={{ background: displayAccent }}/><span/><span/></div></div><div className="settings-preview-meta"><span><i style={{ background: displayAccent }}/>{accentName}</span><span>{preferences.accentColor}</span></div></aside>
    </div>
  </section>
}

