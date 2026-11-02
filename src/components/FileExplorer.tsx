import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Award, BriefcaseBusiness, ChevronRight, FileText, Folder, FolderKanban, GraduationCap, LayoutGrid, List, Search, Send, Wrench } from 'lucide-react'
import { projects, type Project } from '../data/projects'
import { builder, experience } from '../data/experience'
import { skillGroups } from '../data/skills'
import { education } from '../data/education'
import { certifications } from '../data/certifications'
import { profile } from '../data/profile'

type FolderName = 'Home'|'Projects'|'Experience'|'Skills'|'Education'|'Certifications'|'Resume'|'Contact'
type Entry = { name: string; type: 'folder'|'file'; kind: FolderName; detail: string; appId?:string; projectId?:string }
const rootEntries: Entry[] = [
  { name:'Projects',type:'folder',kind:'Projects',detail:`${projects.length} project files` }, { name:'Experience',type:'folder',kind:'Experience',detail:`${experience.length} roles` },
  { name:'Skills',type:'folder',kind:'Skills',detail:`${skillGroups.length} skill groups` }, { name:'Education',type:'folder',kind:'Education',detail:`${education.length} records` },
  { name:'Certifications',type:'folder',kind:'Certifications',detail:`${certifications.length} certification` }, { name:'Resume.pdf',type:'file',kind:'Resume',detail:'Resume document' }, { name:'Contact.txt',type:'file',kind:'Contact',detail:'Contact card' },
]
export default function FileExplorer({ onProject, onResume, onContact, onOpenApp }: { onProject:(project:Project)=>void; onResume:()=>void; onContact:()=>void; onOpenApp:(id:string)=>void }) {
  const [path,setPath]=useState<FolderName[]>(['Home']), [history,setHistory]=useState<FolderName[][]>([['Home']]), [historyIndex,setHistoryIndex]=useState(0), [query,setQuery]=useState(''), [view,setView]=useState<'grid'|'list'>('grid'), [sort,setSort]=useState<'name'|'type'>('name'), [selected,setSelected]=useState<string|null>(null)
  const folder=path.at(-1)??'Home'
  const entries=useMemo<Entry[]>(()=>{
    if(folder==='Home')return rootEntries
    if(folder==='Projects')return [...projects.map(item=>({name:item.name,type:'file' as const,kind:'Projects' as const,detail:item.kind,projectId:item.id})),...builder.filter(item=>item.name.toLowerCase().includes('projectmart')).map(item=>({name:'ProjectMart',type:'file' as const,kind:'Projects' as const,detail:`${item.tag} · ${item.text}`,appId:'ideas'}))]
    if(folder==='Experience')return experience.map(item=>({name:`${item.title} · ${item.organization}`,type:'file',kind:'Experience',detail:item.duration}))
    if(folder==='Skills')return skillGroups.map(item=>({name:item.name,type:'file',kind:'Skills',detail:item.items.join(' · ')}))
    if(folder==='Education')return education.map(item=>({name:item.degree,type:'file',kind:'Education',detail:`${item.institution} · ${item.status}`}))
    if(folder==='Certifications')return certifications.map(item=>({name:item.name,type:'file',kind:'Certifications',detail:item.organization}))
    if(folder==='Resume')return [{name:'Resume.pdf',type:'file',kind:'Resume',detail:profile.links.resume?'Open or download resume':'Resume PDF is not configured yet'}]
    return [{name:'Contact.txt',type:'file',kind:'Contact',detail:'Professional contact links'}]
  },[folder])
  const visible=entries.filter(entry=>`${entry.name} ${entry.detail}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):a.type.localeCompare(b.type)||a.name.localeCompare(b.name))
  function navigate(next:FolderName[]){setPath(next);setHistory(prev=>[...prev.slice(0,historyIndex+1),next]);setHistoryIndex(i=>i+1);setSelected(null);setQuery('')}
  function activate(entry:Entry){if(entry.type==='folder'){navigate([...path,entry.kind]);return} if(entry.kind==='Projects'){const project=projects.find(item=>item.id===entry.projectId)||projects.find(item=>item.name===entry.name);if(project)onProject(project);else if(entry.appId)onOpenApp(entry.appId)} else if(entry.kind==='Resume')onResume();else if(entry.kind==='Contact')onContact();else if(entry.kind==='Experience'||entry.kind==='Certifications'||entry.kind==='Education')onOpenApp('career');else if(entry.kind==='Skills')onOpenApp('skills')}
  function back(){if(historyIndex>0){setHistoryIndex(i=>i-1);setPath(history[historyIndex-1]);setSelected(null)}}
  function forward(){if(historyIndex<history.length-1){setHistoryIndex(i=>i+1);setPath(history[historyIndex+1]);setSelected(null)}}
  return <section className="file-explorer" aria-label="Portfolio File Explorer"><header className="explorer-toolbar"><div className="explorer-history"><button aria-label="Back" disabled={!historyIndex} onClick={back}><ArrowLeft size={15}/></button><button aria-label="Forward" disabled={historyIndex>=history.length-1} onClick={forward}><ArrowRight size={15}/></button></div><nav className="explorer-breadcrumb" aria-label="Folder path">{path.map((part,index)=><span key={`${part}-${index}`}><button onClick={()=>navigate(path.slice(0,index+1))}>{part}</button>{index<path.length-1&&<ChevronRight size={12}/>}</span>)}</nav><label className="explorer-search"><Search size={14}/><input aria-label="Search files" placeholder="Search this folder" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="explorer-view"><button aria-label="Grid view" aria-pressed={view==='grid'} onClick={()=>setView('grid')}><LayoutGrid size={14}/></button><button aria-label="List view" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={14}/></button></div></header><div className="explorer-tools"><span>{visible.length} items</span><label>Sort <select aria-label="Sort items" value={sort} onChange={e=>setSort(e.target.value as 'name'|'type')}><option value="name">Name</option><option value="type">Type</option></select></label></div>{visible.length===0?<div className="explorer-empty"><Search size={21}/><b>No matching items</b><span>Try another name or folder.</span></div>:<div className={`explorer-items ${view}`} role="list">{visible.map(entry=>{const EntryIcon=entry.type==='folder'?Folder:entry.kind==='Projects'?FolderKanban:entry.kind==='Experience'?BriefcaseBusiness:entry.kind==='Skills'?Wrench:entry.kind==='Education'?GraduationCap:entry.kind==='Certifications'?Award:FileText;return <button key={entry.name} role="listitem" className={`explorer-entry ${selected===entry.name?'selected':''}`} onClick={()=>setSelected(entry.name)} onDoubleClick={()=>activate(entry)} onKeyDown={e=>e.key==='Enter'&&activate(entry)} aria-label={`${entry.name}, ${entry.type}`}><span className={`explorer-file-icon ${entry.type}`}><EntryIcon size={18}/></span><span className="explorer-entry-text"><b>{entry.name}</b><small>{entry.detail}</small></span></button>})}</div>}<footer className="explorer-status">Simulated portfolio files · <Send size={12}/> Double-click an item to open</footer></section>
}
