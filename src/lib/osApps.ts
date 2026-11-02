import { Activity, AtSign, BriefcaseBusiness, Code2, FileText, FolderKanban, Gamepad2, HardDrive, Mail, Monitor, Music2, Search, Settings2, Sparkles, Terminal as TerminalIcon, Timer } from 'lucide-react'

export type AppId = 'settings'|'about'|'projects'|'terminal'|'hacker-typer'|'skills'|'resume'|'career'|'ideas'|'contact'|'secret'|'file-explorer'|'global-search'|'activity-monitor'|'focus-timer'|'music-player'
export const apps:{id:AppId;label:string;icon:typeof Code2;searchDescription:string;searchKeywords:string[]}[]=[
  {id:'file-explorer',label:'File Explorer',icon:HardDrive,searchDescription:'Browse verified portfolio files and project details',searchKeywords:['files','folders','documents']},
  {id:'global-search',label:'Global Search',icon:Search,searchDescription:'Find portfolio projects, skills, pages and applications',searchKeywords:['search','spotlight','find']},
  {id:'activity-monitor',label:'Activity Monitor',icon:Activity,searchDescription:'View this OS session and illustrative system activity',searchKeywords:['monitor','system','CPU','memory','uptime']},
  {id:'focus-timer',label:'Focus Timer',icon:Timer,searchDescription:'Focus and break countdown timer',searchKeywords:['pomodoro','timer','focus','break']},
  {id:'music-player',label:'Music Player',icon:Music2,searchDescription:'Play audio you provide and are allowed to use',searchKeywords:['music','audio','playlist','player']},
  {id:'settings',label:'Settings',icon:Settings2,searchDescription:'Personalize the Developer OS',searchKeywords:['appearance','theme','wallpaper','personalization']},
  {id:'about',label:'About',icon:AtSign,searchDescription:'Portfolio introduction and background',searchKeywords:['profile','about','home']},
  {id:'projects',label:'Projects',icon:FolderKanban,searchDescription:'Open the software project showcase',searchKeywords:['portfolio','work','software']},
  {id:'terminal',label:'Terminal',icon:TerminalIcon,searchDescription:'Command-line portfolio explorer',searchKeywords:['CLI','commands','shell']},
  {id:'hacker-typer',label:'Hacker Typer',icon:Gamepad2,searchDescription:'Interactive typing game',searchKeywords:['game','typing']},
  {id:'skills',label:'System',icon:Monitor,searchDescription:'Technology skills and system snapshot',searchKeywords:['skills','technology','stack','backend']},
  {id:'resume',label:'Resume',icon:FileText,searchDescription:'Open resume information and the available resume action',searchKeywords:['CV','hire','download']},
  {id:'career',label:'Career',icon:BriefcaseBusiness,searchDescription:'Experience, education and certification overview',searchKeywords:['experience','work','education','certifications']},
  {id:'ideas',label:'Idea Lab',icon:Sparkles,searchDescription:'Product experiments and builder journey',searchKeywords:['ideas','ProjectMart','RoomLinks']},
  {id:'contact',label:'Contact',icon:Mail,searchDescription:'Public email address and professional links',searchKeywords:['email','hire','connect']},
  {id:'secret',label:'README',icon:Code2,searchDescription:'Portfolio easter egg',searchKeywords:['secret'],},
]
