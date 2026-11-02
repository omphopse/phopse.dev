import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from '../App'
import { runCommand } from '../lib/terminal'

describe('visitor terminal', () => {
  it('uses a command whitelist and handles unknown input safely', () => {
    expect(runCommand('help')).toContain('open <project>')
    expect(runCommand('whoami')).toContain('Type help')
    expect(runCommand('date')).toContain('Type help')
    expect(runCommand('coffee')).toContain('Type help')
    expect(runCommand('sudo hire-me')).toContain('Recruiter access granted')
    expect(runCommand('rm -rf /')).toContain('Command not found')
    expect(runCommand('sudo hire-om')).toContain('Recruiter access granted')
    expect(runCommand('certifications')).toContain('Completed')
    expect(runCommand('certifications')).not.toContain('Present')
    expect(runCommand('ls')).toContain('contact.txt')
    expect(runCommand('cat projects/algopilot')).toContain('AlgoPilot')
    expect(runCommand('cat projects/api-marketplace')).toContain('API Marketplace')
    expect(runCommand('inspect projectmart')).toContain('Projectmart.online')
    expect(runCommand('stack')).toContain('Messaging: Kafka')
    expect(runCommand('git log')).toContain('not Git commit history')
    expect(runCommand('open')).toContain('Usage: open <project>')
    expect(runCommand('cat ../../.env')).toContain("couldn't find")
    expect(runCommand('education')).toContain('Ahmednagar College')
    expect(runCommand('contact')).toContain('VITE_PORTFOLIO_EMAIL')
    expect(runCommand('contact')).toContain('https://github.com/omphopse')
    expect(runCommand('sudo nonsense')).toContain('does not grant system privileges')
    expect(runCommand('cat projects/unknown')).toContain("couldn't find")
  })
})

describe('professional portfolio', () => {
  it('renders navigation and opens a project case study', () => {
    localStorage.clear()
    localStorage.setItem('phopse-mode', 'professional')
    render(<App />)
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('Explore case study')[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('AlgoPilot')
  })
  it('opens and closes the Developer OS', () => {
    localStorage.clear()
    localStorage.setItem('phopse-mode', 'professional')
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /Enter Developer OS/i })[0])
    expect(screen.getByText('Personal workspace')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Exit OS/i }))
    expect(screen.getAllByRole('heading', { name: /I build software/i })).toHaveLength(1)
  })
  it('opens the simulated terminal and runs a safe command', () => {
    localStorage.clear()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
    fireEvent.click(screen.getByRole('button', { name: 'Terminal' }))
    const input = screen.getByRole('textbox', { name: 'Terminal command' })
    fireEvent.change(input, { target: { value: 'stack' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/Backend: Java/)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'open algopilot' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByRole('dialog')).toHaveTextContent('AlgoPilot')
    fireEvent.click(screen.getByRole('button', { name: 'Close case study' }))
    fireEvent.click(screen.getByRole('button', { name: 'Minimize Terminal' }))
    expect(screen.queryByRole('textbox', { name: 'Terminal command' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Focus Terminal' }))
    expect(screen.getByRole('textbox', { name: 'Terminal command' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close Terminal' }))
    expect(screen.queryByRole('textbox', { name: 'Terminal command' })).not.toBeInTheDocument()
  })
  it('reports invalid contact input without pretending to send', () => {
    localStorage.clear()
    localStorage.setItem('phopse-mode', 'professional')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }))
    expect(screen.getByRole('status')).toHaveTextContent('Check the fields')
  })
  it('keeps work, certifications, and education in separate reverse-chronological sections', () => {
    localStorage.clear()
    localStorage.setItem('phopse-mode', 'professional')
    render(<App />)
    const work = document.getElementById('experience')!
    const certs = document.getElementById('certifications')!
    const studies = document.getElementById('education')!
    const workText = work.textContent ?? '', certText = certs.textContent ?? '', educationText = studies.textContent ?? ''
    expect(workText).toContain('AI Content Creator Intern')
    expect(workText.indexOf('Elsa AI Ltd.')).toBeLessThan(workText.indexOf('Kanak Digifex'))
    expect(workText.indexOf('Kanak Digifex')).toBeLessThan(workText.indexOf('Disha Computers Institute'))
    expect(work.querySelectorAll('.timeline-item')).toHaveLength(3)
    expect(workText).not.toContain('Information Technology Excellence Program')
    expect(certText).toContain('Completed · Aug 2026')
    expect(certText).not.toMatch(/Present|Pursuing|In Progress/)
    expect(certs.querySelectorAll('.certification-card')).toHaveLength(1)
    expect(educationText.indexOf('Master of Computer Applications')).toBeLessThan(educationText.indexOf('Bachelor of Business Administration'))
    expect(studies.querySelectorAll('.education-card')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Certifications' })).toHaveAttribute('href', '#certifications')
    expect(screen.getByRole('link', { name: 'Education' })).toHaveAttribute('href', '#education')
  })
  it('shows the same completed program and distinct career sections in Developer OS', () => {
    localStorage.clear()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Open app launcher' }))
    fireEvent.click(screen.getByRole('button', { name: 'Career' }))
    expect(document.querySelector('.os-career')?.textContent).toContain('Elsa AI Ltd.')
    expect(screen.getByText('Completed · Aug 2026')).toBeInTheDocument()
    expect(screen.getByText('Ahmednagar College')).toBeInTheDocument()
  })

  it('opens the Developer OS by default and lets visitors exit to the portfolio', () => {
    localStorage.clear()
    render(<App />)
    expect(screen.getByText('Personal workspace')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Exit OS/i }))
    expect(screen.getAllByRole('heading', { name: /I build software/i })).toHaveLength(1)
  })
})







