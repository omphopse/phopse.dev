import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { calculateRank, calculateScore, difficulties, missionEvents, missions } from '../lib/hackerTyper'

function launchHackerTyper() {
  localStorage.clear()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
  fireEvent.click(screen.getByRole('button', { name: 'Hacker Typer' }))
}

describe('Hacker Typer game rules', () => {
  it('keeps every mission finishable at a steady two key presses per second', () => {
    for (const mission of missions) {
      for (const config of Object.values(difficulties)) {
        const keyPresses = Math.ceil(mission.code.length / config.charsPerKey)
        expect(keyPresses).toBeLessThanOrEqual(config.seconds * 2)
      }
    }
  })

  it('awards scores and ranks using the displayed progression rules', () => {
    expect(calculateScore(100, true, 10)).toBe(700)
    expect(calculateScore(60, false, 0)).toBe(60)
    expect(calculateRank(100, true, 24, 30)).toBe('Root Access')
    expect(calculateRank(100, true, 22, 30)).toBe('Code Runner')
    expect(calculateRank(60, false, 0, 30)).toBe('Debugger')
    expect(calculateRank(59, false, 0, 30)).toBe('Script Kiddie')
  })

  it('defines the fictional mission checkpoints at fixed progress thresholds', () => {
    expect(missionEvents.map(event => event.at)).toEqual([20, 45, 70, 90, 100])
    expect(missions.map(mission => mission.id)).toEqual(['api-breach', 'firewall-override', 'zero-day'])
    expect(difficulties.Casual.seconds).toBe(30)
    expect(difficulties.Normal.seconds).toBe(60)
    expect(difficulties.Speedrun.seconds).toBe(90)
  })
})

describe('Hacker Typer OS app', () => {
  it('launches, pauses, restarts, completes, closes, and reopens as an OS window', () => {
    launchHackerTyper()
    expect(screen.getByText('hacker.exe · fictional security simulation')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start mission' }))
    const editor = screen.getByRole('application', { name: /Code reveal area/ })
    const code = () => document.querySelector('.hack-code pre')?.textContent ?? ''
    const initial = code()
    fireEvent.keyDown(editor, { key: 'r', ctrlKey: true })
    fireEvent.keyDown(editor, { key: 'a', repeat: true })
    expect(code()).toBe(initial)
    fireEvent.keyDown(editor, { key: 'a' })
    expect(code().length).toBeGreaterThan(initial.length)
    fireEvent.click(screen.getByRole('button', { name: 'Pause mission' }))
    const paused = code()
    fireEvent.keyDown(editor, { key: 'b' })
    expect(code()).toBe(paused)
    fireEvent.click(screen.getByRole('button', { name: 'Resume mission' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restart mission' }))
    expect(code()).toBe('')
    const tap = screen.getByRole('button', { name: /Tap to type/, hidden: true })
    for (let count = 0; count < Math.ceil(missions[0].code.length / difficulties.Normal.charsPerKey); count++) fireEvent.click(tap)
    expect(screen.getByText('MISSION COMPLETE')).toBeInTheDocument()
    expect(screen.getByText('BUGS ELIMINATED. SHIP IT.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close Hacker Typer' }))
    expect(screen.queryByText('hacker.exe · fictional security simulation')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hacker Typer' }))
    expect(screen.getByText('hacker.exe · fictional security simulation')).toBeInTheDocument()
  })
  it('pauses and expires the timer without leaving an interval running', () => {
    vi.useFakeTimers()
    try {
      launchHackerTyper()
      fireEvent.click(screen.getByRole('button', { name: 'Start mission' }))
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      act(() => vi.advanceTimersByTime(5_000))
      expect(screen.getByText('00:55')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Pause mission' }))
      act(() => vi.advanceTimersByTime(60_000))
      expect(screen.getByText('Paused')).toBeInTheDocument()
      expect(screen.queryByText('MISSION FAILED')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Resume mission' }))
      act(() => vi.advanceTimersByTime(55_000))
      expect(screen.getByText('MISSION FAILED')).toBeInTheDocument()
      expect(vi.getTimerCount()).toBe(0)
      fireEvent.click(screen.getByRole('button', { name: 'Retry mission' }))
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      fireEvent.click(screen.getByRole('button', { name: 'Close Hacker Typer' }))
      expect(screen.queryByText('hacker.exe · fictional security simulation')).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(1_000))
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})







