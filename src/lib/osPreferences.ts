export type AppearanceMode = 'light' | 'dark' | 'system'
export type WallpaperId = 'circuit-run' | 'forest-calm' | 'soft-terracotta' | 'sage-garden' | 'midnight-forest' | 'warm-minimal' | 'solid' | 'custom'
export type CircuitQuality = 'low' | 'balanced' | 'high'
export type OsPreferences = {
  version: 1
  appearance: AppearanceMode
  accentColor: string
  wallpaperId: WallpaperId
  solidWallpaperColor: string
  wallpaperPosition: 'cover' | 'center'
  dimWallpaper: boolean
  windowStyle: 'rounded' | 'sharp'
  windowTransparency: boolean
  circuitAnimated: boolean
  circuitQuality: CircuitQuality
  circuitCarCount: number
}
export const OS_PREFERENCES_KEY = 'phopse-os-preferences'
export const defaultOsPreferences: OsPreferences = {
  version: 1, appearance: 'light', accentColor: '#013328', wallpaperId: 'circuit-run',
  solidWallpaperColor: '#013328', wallpaperPosition: 'cover', dimWallpaper: true,
  windowStyle: 'rounded', windowTransparency: false, circuitAnimated: true, circuitQuality: 'balanced', circuitCarCount: 8,
}
export const accentPresets = [
  { name: 'Forest Green', color: '#013328' },
  { name: 'Terracotta', color: '#CC8B65' },
  { name: 'Sage Green', color: '#73977B' },
  { name: 'Dusty Blue', color: '#6D8FA3' },
  { name: 'Lavender', color: '#9A83B8' },
  { name: 'Soft Rose', color: '#C27F87' },
] as const
export const wallpaperOptions: { id: Exclude<WallpaperId, 'custom'>; name: string; background: string }[] = [
  { id: 'circuit-run', name: 'Imola · Circuit Run', background: 'radial-gradient(ellipse at 50% 50%, #214f3b, #10382e)' },
  { id: 'forest-calm', name: 'Forest Calm', background: 'radial-gradient(ellipse at 82% 16%, rgba(204,139,101,.26), transparent 34%), radial-gradient(ellipse at 12% 88%, rgba(227,220,210,.12), transparent 38%), #013328' },
  { id: 'soft-terracotta', name: 'Soft Terracotta', background: 'radial-gradient(ellipse at 80% 18%, rgba(255,249,240,.7), transparent 36%), radial-gradient(ellipse at 12% 92%, rgba(141,76,47,.18), transparent 40%), #CC8B65' },
  { id: 'sage-garden', name: 'Sage Garden', background: 'radial-gradient(ellipse at 78% 20%, rgba(250,248,244,.7), transparent 34%), radial-gradient(ellipse at 14% 88%, rgba(1,51,40,.22), transparent 42%), #78977F' },
  { id: 'midnight-forest', name: 'Midnight Forest', background: 'radial-gradient(ellipse at 80% 15%, rgba(109,143,163,.22), transparent 32%), radial-gradient(ellipse at 14% 90%, rgba(204,139,101,.12), transparent 36%), #100C0D' },
  { id: 'warm-minimal', name: 'Warm Minimal', background: 'radial-gradient(ellipse at 86% 12%, rgba(204,139,101,.3), transparent 33%), linear-gradient(145deg, #FAF8F4, #E3DCD2)' },
  { id: 'solid', name: 'Solid Color', background: '#013328' },
]
const appearances = new Set<AppearanceMode>(['light', 'dark', 'system'])
const wallpaperIds = new Set<WallpaperId>(['circuit-run', 'forest-calm', 'soft-terracotta', 'sage-garden', 'midnight-forest', 'warm-minimal', 'solid', 'custom'])
const hexColor = /^#[0-9a-f]{6}$/i
const cornerStyles = new Set(['rounded', 'sharp'])

function validatePreferences(value: unknown): OsPreferences {
  if (!value || typeof value !== 'object') return { ...defaultOsPreferences }
  const saved = value as Partial<OsPreferences> & { version?: unknown }
  if (saved.version !== 1) return { ...defaultOsPreferences }
  return {
    version: 1,
    appearance: appearances.has(saved.appearance as AppearanceMode) ? saved.appearance as AppearanceMode : defaultOsPreferences.appearance,
    accentColor: typeof saved.accentColor === 'string' && hexColor.test(saved.accentColor) ? saved.accentColor.toUpperCase() : defaultOsPreferences.accentColor,
    wallpaperId: wallpaperIds.has(saved.wallpaperId as WallpaperId) && saved.wallpaperId !== 'custom' ? saved.wallpaperId as WallpaperId : defaultOsPreferences.wallpaperId,
    solidWallpaperColor: typeof saved.solidWallpaperColor === 'string' && hexColor.test(saved.solidWallpaperColor) ? saved.solidWallpaperColor.toUpperCase() : defaultOsPreferences.solidWallpaperColor,
    wallpaperPosition: saved.wallpaperPosition === 'center' ? 'center' : 'cover',
    dimWallpaper: typeof saved.dimWallpaper === 'boolean' ? saved.dimWallpaper : defaultOsPreferences.dimWallpaper,
    windowStyle: cornerStyles.has(saved.windowStyle ?? '') ? saved.windowStyle as OsPreferences['windowStyle'] : defaultOsPreferences.windowStyle,
    windowTransparency: typeof saved.windowTransparency === 'boolean' ? saved.windowTransparency : defaultOsPreferences.windowTransparency,
    circuitAnimated: typeof saved.circuitAnimated === 'boolean' ? saved.circuitAnimated : defaultOsPreferences.circuitAnimated,
    circuitQuality: saved.circuitQuality === 'low' || saved.circuitQuality === 'high' || saved.circuitQuality === 'balanced' ? saved.circuitQuality : defaultOsPreferences.circuitQuality,
    circuitCarCount: typeof saved.circuitCarCount === 'number' && Number.isInteger(saved.circuitCarCount) ? Math.max(4, Math.min(10, saved.circuitCarCount)) : defaultOsPreferences.circuitCarCount,
  }
}

export function loadOsPreferences(): OsPreferences {
  try {
    if (typeof window === 'undefined') return { ...defaultOsPreferences }
    const raw = window.localStorage.getItem(OS_PREFERENCES_KEY)
    return raw ? validatePreferences(JSON.parse(raw)) : { ...defaultOsPreferences }
  } catch {
    return { ...defaultOsPreferences }
  }
}

export function saveOsPreferences(preferences: OsPreferences): boolean {
  try {
    if (typeof window === 'undefined') return false
    const safe = validatePreferences(preferences)
    window.localStorage.setItem(OS_PREFERENCES_KEY, JSON.stringify(safe))
    return true
  } catch {
    return false
  }
}

export function resolveAppearance(mode: AppearanceMode, systemDark: boolean) {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
}

export function accentColorForTheme(color: string, isDark: boolean) {
  // Forest Green is intentionally deep in light mode, but disappears against
  // the dark OS surfaces. Keep the saved preset while using a readable tint.
  return isDark && color.toUpperCase() === '#013328' ? '#75BA9A' : color
}

export function accentForeground(color: string) {
  if (!hexColor.test(color)) return '#FAF8F4'
  const values = color.slice(1).match(/.{2}/g)!.map(channel => parseInt(channel, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  const luminance = .2126 * values[0] + .7152 * values[1] + .0722 * values[2]
  return luminance > .179 ? '#100C0D' : '#FAF8F4'
}

export function wallpaperBackground(preferences: OsPreferences, customWallpaper?: string | null) {
  if (preferences.wallpaperId === 'custom' && customWallpaper) return `url("${customWallpaper}")`
  if (preferences.wallpaperId === 'solid') return preferences.solidWallpaperColor
  return wallpaperOptions.find(option => option.id === preferences.wallpaperId)?.background ?? wallpaperOptions[0].background
}

export function getOsThemeTokens(preferences: OsPreferences, isDark: boolean) {
  const accent = accentColorForTheme(preferences.accentColor, isDark)
  return {
    '--os-bg': isDark ? '#100C0D' : '#013328',
    '--os-surface': isDark ? '#17221D' : '#FAF8F4',
    '--os-surface-elevated': isDark ? '#202D27' : '#E3DCD2',
    '--os-surface-card': isDark ? '#1D2A24' : '#FFFFFF',
    '--os-text': isDark ? '#FAF8F4' : '#100C0D',
    '--os-text-secondary': isDark ? '#D2DAD4' : '#514C46',
    '--os-border': isDark ? '#405047' : '#DED7CD',
    '--os-accent': accent,
    '--os-accent-foreground': accentForeground(accent),
    '--os-taskbar-bg': isDark ? 'rgba(16,12,13,.94)' : 'rgba(250,248,244,.95)',
    '--os-window-bg': preferences.windowTransparency
      ? (isDark ? 'rgba(23,34,29,.88)' : 'rgba(250,248,244,.88)')
      : (isDark ? '#17221D' : '#FAF8F4'),
    '--os-window-radius': preferences.windowStyle === 'sharp' ? '4px' : '11px',
    '--os-wallpaper-overlay': preferences.dimWallpaper ? (isDark ? 'rgba(16,12,13,.2)' : 'rgba(1,51,40,.13)') : 'transparent',
  }
}
