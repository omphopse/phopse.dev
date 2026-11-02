import { projects } from '../data/projects'
import { experience } from '../data/experience'
import { skillGroups } from '../data/skills'
import { education } from '../data/education'
import { certifications } from '../data/certifications'
import { builder } from '../data/experience'
import { apps } from './osApps'

export type SearchAction = { type:'project'; id:string }|{type:'app'; id:string}|{type:'page'; id:string}|{type:'resume'}
export type SearchResult = { title:string; category:'PROJECTS'|'EXPERIENCE'|'SKILLS'|'PAGES'|'APPLICATIONS'; description:string; keywords:string[]; action:SearchAction }
export const searchIndex:SearchResult[] = [
  ...projects.map(item=>({title:item.name,category:'PROJECTS' as const,description:item.summary,keywords:[item.kind,...item.tech,item.status,item.problem],action:{type:'project' as const,id:item.id}})),
  ...builder.filter(item=>item.name.toLowerCase().includes('projectmart')).map(item=>({title:'ProjectMart',category:'PROJECTS' as const,description:item.text,keywords:[item.name,item.tag,item.stats??'',item.note],action:{type:'app' as const,id:'ideas'}})),
  ...experience.map(item=>({title:item.organization,category:'EXPERIENCE' as const,description:`${item.title} · ${item.duration}`,keywords:[item.title,...(item.technologies??[]),...item.responsibilities],action:{type:'page' as const,id:'experience'}})),
  ...skillGroups.flatMap(group=>group.items.map(skill=>({title:skill,category:'SKILLS' as const,description:group.name,keywords:[group.name,skill],action:{type:'page' as const,id:'skills'}}))),
  ...education.map(item=>({title:item.shortLabel,category:'PAGES' as const,description:`${item.degree} · ${item.institution}`,keywords:[item.degree,item.institution,item.status,item.graduation],action:{type:'page' as const,id:'education'}})),
  ...certifications.map(item=>({title:item.name,category:'PAGES' as const,description:item.organization,keywords:[item.organization,...item.subjects,'ITEP'],action:{type:'page' as const,id:'certifications'}})),
  ...[
    ['Home','Portfolio home and introduction',['portfolio','about','main']],['Projects','Selected software projects',['work','builds']],['Experience','Professional experience and roles',['work','career','jobs']],['Skills','Technology skills and tools',['technology','stack','backend']],['Education','Education history',['study','degree','MCA','BBA']],['Certifications','Completed technical certification',['certificate','ITEP']],['Resume','Open the resume app',['CV','hire','download']],['Contact','Professional contact options',['hire','connect']],
  ].map(([title,description,keywords])=>({title:String(title),category:'PAGES' as const,description:String(description),keywords:keywords as string[],action:(title==='Resume'?{type:'resume' as const}:{type:'page' as const,id:String(title).toLowerCase()})})),
  ...apps.filter(item=>item.id!=='secret').map(item=>({title:item.label,category:'APPLICATIONS' as const,description:item.searchDescription,keywords:item.searchKeywords,action:{type:'app' as const,id:item.id}})),
]
const synonyms:Record<string,string[]>={api:['rest','marketplace','backend'],backend:['java','spring','api'],java:['spring boot','backend','algopilot','api marketplace'],work:['experience','career'],cv:['resume'],hire:['contact','resume'],settings:['personalization','appearance'],
}
export function searchPortfolio(query:string,limit=18):SearchResult[]{
  const normalized=query.toLowerCase().trim();if(!normalized)return[]
  const terms=normalized.split(/\s+/).filter(Boolean), expanded=[...terms,...terms.flatMap(term=>synonyms[term]??[])];
  return searchIndex.map((result,index)=>{const title=result.title.toLowerCase(),text=`${result.description} ${result.category} ${result.keywords.join(' ')}`.toLowerCase(),fullText=`${title} ${text}`;let score=0;if(title===normalized)score+=100;if(title.startsWith(normalized))score+=55;if(title.includes(normalized))score+=35;for(const term of expanded){if(title.includes(term))score+=12;if(text.includes(term))score+=4}if(terms.length>1&&terms.every(term=>fullText.includes(term)||synonyms[term]?.some(alias=>fullText.includes(alias))))score+=15;const allTermsMatch=terms.every(term=>fullText.includes(term)||synonyms[term]?.some(alias=>fullText.includes(alias)));return{result,index,score,allTermsMatch}}).filter(item=>item.score>0&&item.allTermsMatch).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit).map(item=>item.result)
}
