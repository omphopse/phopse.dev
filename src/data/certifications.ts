export type Certification = {
  name: string
  organization: string
  duration: string
  status: 'Completed'
  completedLabel: string
  subjects: string[]
}

export const certifications: Certification[] = [
  {
    name: 'Information Technology Excellence Program (ITEP)',
    organization: 'Infobeans Foundation',
    duration: 'August 2025 – August 2026',
    status: 'Completed',
    completedLabel: 'Completed · Aug 2026',
    subjects: ['Java', 'Spring Boot', 'REST APIs', 'MongoDB', 'Hibernate', 'ReactJS', 'Object-Oriented Programming', 'Backend Development'],
  },
]
