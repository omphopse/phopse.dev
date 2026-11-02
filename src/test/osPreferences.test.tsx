import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import {
  accentForeground,
  defaultOsPreferences,
  loadOsPreferences,
  OS_PREFERENCES_KEY,
  resolveAppearance,
  saveOsPreferences,
  wallpaperOptions,
} from '../lib/osPreferences'

describe('Developer OS preferences', () => {
  beforeEach(() => localStorage.clear())

  it('loads defaults and safely recovers from corrupt or unsupported stored data', () => {
    expect(loadOsPreferences()).toEqual(defaultOsPreferences)
    localStorage.setItem(OS_PREFERENCES_KEY, '{broken')
    expect(loadOsPreferences()).toEqual(defaultOsPreferences)
    localStorage.setItem(OS_PREFERENCES_KEY, JSON.stringify({ version: 9, appearance: 'dark' }))
    expect(loadOsPreferences()).toEqual(defaultOsPreferences)
  })

  it('persists validated preferences and excludes session-only custom wallpaper data', () => {
    const preferences = { ...defaultOsPreferences, appearance: 'dark' as const, accentColor: '#cc8b65', wallpaperId: 'custom' as const }
    expect(saveOsPreferences(preferences)).toBe(true)
    expect(loadOsPreferences()).toEqual({ ...preferences, wallpaperId: 'circuit-run', accentColor: '#CC8B65' })
    expect(localStorage.getItem(OS_PREFERENCES_KEY)).not.toContain('data:image')
  })

  it('provides the wallpaper catalog, resolves system appearance, and selects readable accent text', () => {
    expect(defaultOsPreferences.wallpaperId).toBe('circuit-run')
    expect(wallpaperOptions).toHaveLength(7)
    expect(resolveAppearance('system', true)).toBe('dark')
    expect(resolveAppearance('system', false)).toBe('light')
    expect(accentForeground('#CC8B65')).toBe('#100C0D')
    expect(accentForeground('#013328')).toBe('#FAF8F4')
  })

  it('opens Settings, applies changes to the OS, and saves them automatically', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /Enter Developer OS/i })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
    fireEvent.click(screen.getByRole('button', { name: /^Settings$/ }))

    const settings = screen.getByRole('region', { name: 'Developer OS settings' })
    expect(within(settings).getByRole('navigation', { name: 'Personalization settings' })).toBeInTheDocument()
    fireEvent.click(within(settings).getByRole('radio', { name: /^Dark/ }))
    expect(settings).toHaveClass('dark')

    fireEvent.click(within(settings).getByRole('button', { name: 'Accent Color' }))
    fireEvent.click(within(settings).getByRole('radio', { name: /Terracotta/ }))
    expect(localStorage.getItem(OS_PREFERENCES_KEY)).toContain('CC8B65')
    expect(document.querySelector('.os-screen')).toHaveStyle({ '--os-accent': '#CC8B65' })
  })

  it('exposes local circuit simulation controls and persists selected quality and car count', () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /Enter Developer OS/i })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
    fireEvent.click(screen.getByRole('button', { name: /^Settings$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Wallpaper' }))
    const settings = screen.getByRole('region', { name: 'Developer OS settings' })
    expect(within(settings).getByText('SIMULATED RACE')).toBeInTheDocument()
    expect(within(settings).getByText(/Imola, Italy · local car simulation, not live timing/)).toBeInTheDocument()
    fireEvent.change(within(settings).getByLabelText('Number of racing cars'), { target: { value: '10' } })
    fireEvent.change(within(settings).getByLabelText('Circuit wallpaper quality'), { target: { value: 'high' } })
    expect(localStorage.getItem(OS_PREFERENCES_KEY)).toContain('"circuitCarCount":10')
    expect(localStorage.getItem(OS_PREFERENCES_KEY)).toContain('"circuitQuality":"high"')
    fireEvent.click(within(settings).getByRole('button', { name: /Pause race/ }))
    expect(within(settings).getByRole('button', { name: /Resume race/ })).toBeInTheDocument()
  })
})



