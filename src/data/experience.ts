export type Experience = {
  title: string
  organization: string
  employmentType?: string
  duration: string
  responsibilities: string[]
  technologies?: string[]
}

export const experience: Experience[] = [
  {
    title: 'AI Content Creator Intern', organization: 'Elsa AI Ltd.', employmentType: 'Internship', duration: 'June 2026 – September 2026',
    responsibilities: [
      "Managed the founder's Twitter/X content and engagement, creating posts and replies around Crypto X AI, tokenisation, stablecoins, and product-related topics.",
      'Researched technology trends and monitored content performance to identify opportunities for organic reach.',
    ],
  },
  {
    title: 'Web Development Intern', organization: 'Kanak Digifex', employmentType: 'Internship', duration: 'April 2024 – September 2024',
    responsibilities: [
      'Developed and maintained web applications using PHP, JavaScript, and MySQL based on client requirements and functional specifications.',
      'Troubleshot defects across existing application code and databases while maintaining expected application functionality.',
    ],
    technologies: ['PHP', 'JavaScript', 'MySQL'],
  },
  {
    title: 'Teaching Assistant', organization: 'Disha Computers Institute', duration: 'October 2022 – February 2024',
    responsibilities: ['Taught C, C++, Java, and Python to 120+ students through practical coding sessions, exercises, and structured problem-solving activities.'],
    technologies: ['C', 'C++', 'Java', 'Python'],
  },
]
export const builder = [
  { name: 'Projectmart.online', tag: 'Student venture · historical', text: 'Co-founded with Aayan and worked on the venture for approximately two years. The platform offered student project solutions and related assistance.', stats: 'Approx. ₹1.2 lakh cumulative revenue · nearly 100 project sales', note: 'Historical approximate figures; not audited. Original site inactive and no source repository currently known.' },
  { name: 'Roomlinks', tag: 'Marketplace experiment · Pune', text: 'Explored a no-brokerage rental marketplace through local property-owner outreach, Instagram marketing and tenant discovery.', note: 'Historical project. Earlier audience and listing counts are intentionally omitted because they may be outdated.' },
]
