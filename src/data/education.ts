export type Education = {
  degree: string
  shortLabel: string
  institution: string
  status: 'Pursuing' | 'Completed'
  graduation: string
}

export const education: Education[] = [
  { degree: 'Master of Computer Applications (MCA)', shortLabel: 'MCA', institution: 'Institute of Management Studies', status: 'Pursuing', graduation: 'Expected 2027' },
  { degree: 'Bachelor of Business Administration (Computer Applications) — BBA (CA)', shortLabel: 'BBA (CA)', institution: 'Ahmednagar College', status: 'Completed', graduation: '2025' },
]
