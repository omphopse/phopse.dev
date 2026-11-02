import { profile } from '../data/profile'
import { projects, type Project } from '../data/projects'
import { experience } from '../data/experience'
import { certifications } from '../data/certifications'
import { education } from '../data/education'
import { skillGroups } from '../data/skills'
import { builder } from '../data/experience'

const configured = import.meta.env as ImportMetaEnv & { VITE_PORTFOLIO_EMAIL?: string; VITE_PORTFOLIO_PHONE?: string }
export const contactDetails = {
  email: configured.VITE_PORTFOLIO_EMAIL?.trim() || '',
  phone: configured.VITE_PORTFOLIO_PHONE?.trim() || '',
  linkedin: profile.links.linkedin,
  github: profile.links.github,
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '')
export function getProjectBySlug(slug: string): Project | undefined {
  const value = normalize(slug)
  const aliases: Record<string, string> = { apimarketplace: 'api-marketplace', algopilot: 'algopilot', allin1loans: 'allin1loans', roomlinks: 'roomlinks' }
  const id = aliases[value] ?? slug.toLowerCase()
  return projects.find(project => project.id === id || normalize(project.name) === value)
}

const contactText = () => [
  `Email: ${contactDetails.email || '[configure VITE_PORTFOLIO_EMAIL]'}`,
  `Phone: ${contactDetails.phone || '[configure VITE_PORTFOLIO_PHONE]'}`,
  `LinkedIn: ${contactDetails.linkedin}`,
  `GitHub: ${contactDetails.github}`,
].join('\n')

const projectText = (project: Project) => [
  `${project.name} · ${project.kind}`,
  project.summary,
  `Technology: ${project.tech.join(', ')}`,
  `Role: ${project.role}`,
  `Contribution: ${project.contribution}`,
  `Key work: ${project.features.slice(0, 5).join('; ')}`,
  `Decisions: ${project.decisions.slice(0, 2).join('; ')}`,
  `Status: ${project.status}`,
  project.source ? `GitHub: ${project.source}` : '',
  project.demo ? `Live: ${project.demo}` : '',
  project.linksNote ?? '',
].filter(Boolean).join('\n')

const projectMart = builder.find(item => normalize(item.name) === 'projectmartonline')!
const projectMartText = [
  `${projectMart.name} · ${projectMart.tag}`,
  projectMart.text,
  `Historical note: ${projectMart.note}`,
].join('\n')

const timelineItems = [
  ...experience.map(item => ({ date: item.duration.split('–').at(-1)?.trim() ?? item.duration, text: `${item.duration} · ${item.title} — ${item.organization}` })),
  ...education.map(item => ({ date: item.graduation, text: `${item.graduation} · ${item.degree} — ${item.institution} (${item.status})` })),
  ...certifications.map(item => ({ date: item.completedLabel, text: `${item.completedLabel} · ${item.name} — ${item.organization}` })),
]
const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }
const timelineStamp = (date: string) => {
  const year = Number(date.match(/20\d{2}/)?.[0] ?? 0)
  const month = months[date.match(/[A-Za-z]{3}/)?.[0]?.toLowerCase() ?? ''] ?? 12
  return year * 12 + month
}
const journey = timelineItems.sort((a, b) => timelineStamp(b.date) - timelineStamp(a.date)).map(item => item.text)
const stack = [
  `Backend: ${skillGroups.find(group => group.name === 'Backend')?.items.filter(item => item !== 'SQL').join(', ')}`,
  `Databases: ${skillGroups.find(group => group.name === 'Databases')?.items.join(', ')}`,
  `Messaging: Kafka`,
  `Tools: Git, Maven, Docker, Postman, Swagger / OpenAPI, Redis`,
  `Languages: Java, PHP, JavaScript, Python, C, C++, SQL`,
  `Fundamentals: Object-oriented programming (OOP)`,
].join('\n')

const help = `NAVIGATION
  help                 Show commands and examples
  about                Short introduction
  profile              Summary, location, and career focus
  projects             List portfolio projects
  open <project>       Open a project case study

CAREER
  experience           Professional experience
  certifications       Completed certifications
  education            Education history
  journey              Combined dated career and study timeline
  resume               Resume availability

DEVELOPER
  skills               Existing skill groups
  stack                Skills by engineering category
  ls                   List simulated portfolio files
  cat <path>           Read a safe portfolio resource
  inspect <project>    Detailed project snapshot
  git log              Curated portfolio milestones (not commit history)
  clear                Clear terminal output

CONTACT
  contact              Show configured contact links
  sudo hire-me         Playful recruiter greeting (alias: sudo hire-om)

Examples: cat about · cat projects/api-marketplace · open algopilot · inspect projectmart`

export function runCommand(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const [first = '', ...args] = trimmed.split(/\s+/)
  const command = first.toLowerCase()
  const argument = args.join(' ').trim()
  switch (command) {
    case 'help': return help
    case 'about': return `${profile.name} — ${profile.role}. Based in ${profile.location}.`
    case 'profile': return `${profile.summary}\nLocation: ${profile.location}\nCareer focus: backend engineering, APIs, automation, and practical software products.`
    case 'projects': return projects.map(project => `• ${project.name} — ${project.summary}`).join('\n')
    case 'skills': return skillGroups.map(group => `${group.name}: ${group.items.join(', ')}`).join('\n')
    case 'stack': return stack
    case 'experience': return experience.map(item => `${item.title} · ${item.organization}${item.employmentType ? ` · ${item.employmentType}` : ''} (${item.duration})`).join('\n')
    case 'certifications': return certifications.map(item => `${item.name} · ${item.organization} — ${item.status} (${item.duration})`).join('\n')
    case 'education': return education.map(item => `${item.degree} · ${item.institution} — ${item.status} (${item.graduation})`).join('\n')
    case 'journey': return journey.join('\n')
    case 'git': return args[0]?.toLowerCase() === 'log'
      ? `PORTFOLIO MILESTONES · curated timeline, not Git commit history\n${journey.join('\n')}`
      : 'Usage: git log (shows curated portfolio milestones, not actual commits).'
    case 'resume': return profile.links.resume ? `Resume: ${profile.links.resume}` : 'Resume PDF is not configured yet. Check the Resume app for current resume information.'
    case 'contact': return contactText()
    case 'clear': return ''
    case 'sudo': return !argument ? 'Usage: sudo hire-me · playful recruiter greeting (alias: sudo hire-om).' : ['hire-me', 'hire-om'].includes(argument.toLowerCase()) ? ['Permission request received.', 'Recruiter access granted.', '', 'Interested in building something together?', '__HIRE_ACTIONS__'].join('\n') : 'This simulated terminal only supports sudo hire-me (or its alias sudo hire-om). It does not grant system privileges.'
    case 'ls': return ['projects/', 'experience/', 'skills/', 'certifications/', 'education/', 'resume.pdf', 'contact.txt'].join('\n')
    case 'cat': {
      if (!argument) return 'Usage: cat <path> · try cat about or cat projects/api-marketplace.'
      const path = argument.replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase()
      if (path === 'about' || path === 'about.md') return `${profile.name} — ${profile.role}.\n${profile.summary}\nLocation: ${profile.location}`
      if (path === 'contact.txt' || path === 'contact') return contactText()
      if (path === 'skills' || path === 'skills.json') return stack
      if (path === 'experience' || path === 'experience/') return runCommand('experience')
      if (path === 'certifications' || path === 'certifications/') return runCommand('certifications')
      if (path === 'education' || path === 'education/') return runCommand('education')
      if (path === 'resume.pdf') return runCommand('resume')
      const projectPath = path.match(/^projects\/([^/]+)$/)
      if (projectPath) {
        if (normalize(projectPath[1]) === 'projectmart' || normalize(projectPath[1]) === 'projectmartonline') return projectMartText
        const project = getProjectBySlug(projectPath[1])
        return project ? projectText(project) : `I couldn't find “${projectPath[1]}” in the simulated portfolio filesystem. Try ls to see available entries.`
      }
      return `I couldn't find “${argument}” in the simulated portfolio filesystem. Try ls to see available entries.`
    }
    case 'open': {
      if (!argument) return 'Usage: open <project> · examples: open algopilot, open api-marketplace.'
      const project = getProjectBySlug(argument)
      return project ? `Opening ${project.name} case study…` : `I couldn't find project “${argument}”. Try projects to see available case studies.`
    }
    case 'inspect': {
      if (!argument) return 'Usage: inspect <project> · examples: inspect api-marketplace, inspect projectmart.'
      if (normalize(argument) === 'projectmart' || normalize(argument) === 'projectmartonline') return projectMartText
      const project = getProjectBySlug(argument)
      return project ? projectText(project) : `I couldn't find project “${argument}”. Try projects to see supported projects.`
    }
    case 'matrix': return 'Wake up, builder. The code is a metaphor. (No matrix was harmed.)'
    default: return `Command not found: “${trimmed}”. Type help to see available commands.`
  }
}


