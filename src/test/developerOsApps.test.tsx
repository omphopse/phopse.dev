import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import App from '../App'
import FileExplorer from '../components/FileExplorer'
import GlobalSearch from '../components/GlobalSearch'
import FocusTimer from '../components/FocusTimer'
import ActivityMonitor from '../components/ActivityMonitor'
import MusicPlayer from '../components/MusicPlayer'
import { searchPortfolio } from '../lib/globalSearch'
const nativeCreateObjectURL=window.URL.createObjectURL,nativeRevokeObjectURL=window.URL.revokeObjectURL

describe('Developer OS applications',()=>{
  beforeEach(()=>localStorage.clear())
  afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();if(nativeCreateObjectURL)Object.defineProperty(window.URL,'createObjectURL',{configurable:true,value:nativeCreateObjectURL});else Reflect.deleteProperty(window.URL,'createObjectURL');if(nativeRevokeObjectURL)Object.defineProperty(window.URL,'revokeObjectURL',{configurable:true,value:nativeRevokeObjectURL});else Reflect.deleteProperty(window.URL,'revokeObjectURL')})

  it('registers and launches each of the five new OS applications',()=>{
    render(<App />)
    fireEvent.click(screen.getAllByRole('button',{name:/Enter Developer OS/i})[0])
    expect(document.querySelectorAll('.desktop-icon')).toHaveLength(document.querySelectorAll('.desktop-icons .desktop-icon').length)
    expect([...document.querySelectorAll<HTMLElement>('.desktop-icon')].every(icon=>icon.classList.length===1&&icon.dataset.app)).toBe(true)
    for(const [app,label] of [['File Explorer','Portfolio File Explorer'],['Global Search','Global Search'],['Activity Monitor','Activity Monitor'],['Focus Timer','Focus Timer'],['Music Player','Music Player']]){
      fireEvent.doubleClick(screen.getByRole('button',{name:`Open ${app}`}))
      expect(screen.getByRole(app==='Global Search'?'dialog':'region',{name:label})).toBeInTheDocument()
    }
  })

  it('navigates the simulated folders and opens project details without exposing real files',()=>{
    const onProject=vi.fn(),onResume=vi.fn(),onContact=vi.fn(),onOpenApp=vi.fn()
    render(<FileExplorer onProject={onProject} onResume={onResume} onContact={onContact} onOpenApp={onOpenApp}/>)
    const projects=screen.getByRole('listitem',{name:'Projects, folder'})
    fireEvent.doubleClick(projects)
    fireEvent.doubleClick(screen.getByRole('listitem',{name:/AlgoPilot, file/}))
    expect(onProject).toHaveBeenCalledWith(expect.objectContaining({id:'algopilot'}))
    expect(screen.queryByText(/C:\\Windows|Users\\/i)).not.toBeInTheDocument()
  })

  it('matches and ranks local portfolio search results with explicit synonyms',()=>{
    expect(searchPortfolio('API')[0]).toMatchObject({title:'API Marketplace',category:'PROJECTS'})
    expect(searchPortfolio('java').some(result=>result.category==='SKILLS')).toBe(true)
    expect(searchPortfolio('work').some(result=>result.title==='Elsa AI Ltd.')).toBe(true)
    expect(searchPortfolio('hire').some(result=>result.title==='Resume')).toBe(true)
    expect(searchPortfolio('private secret')).toHaveLength(0)
  })

  it('supports keyboard search selection and a no-results state',()=>{
    const onSelect=vi.fn(),onClose=vi.fn()
    render(<GlobalSearch onSelect={onSelect} onClose={onClose}/>)
    const input=screen.getByRole('textbox',{name:'Search portfolio'})
    fireEvent.change(input,{target:{value:'AlgoPilot'}})
    fireEvent.keyDown(window,{key:'Enter'})
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({title:'AlgoPilot',action:{type:'project',id:'algopilot'}}))
    fireEvent.change(input,{target:{value:'nothing matches this'}})
    expect(screen.getByText(/No results for/)).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates search selections to existing project details and registered apps',()=>{
    render(<App />)
    fireEvent.click(screen.getAllByRole('button',{name:/Enter Developer OS/i})[0])
    const trigger=screen.getByRole('button',{name:'Search portfolio and apps'})
    fireEvent.click(trigger)
    const input=screen.getByRole('textbox',{name:'Search portfolio'})
    fireEvent.change(input,{target:{value:'API Marketplace'}})
    fireEvent.keyDown(window,{key:'Enter'})
    expect(screen.getByRole('dialog',{name:'API Marketplace'})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Close case study'}))
    fireEvent.click(trigger)
    fireEvent.change(screen.getByRole('textbox',{name:'Search portfolio'}),{target:{value:'Focus Timer'}})
    fireEvent.keyDown(window,{key:'Enter'})
    expect(screen.getByRole('region',{name:'Focus Timer'})).toBeInTheDocument()
  })

  it('keeps Focus Timer accurate across pauses and persists a paused timer',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-27T12:00:00Z'))
    const view=render(<FocusTimer />)
    fireEvent.change(screen.getByLabelText('Custom duration'),{target:{value:'1'}})
    fireEvent.click(screen.getByRole('button',{name:'Set'}))
    fireEvent.click(screen.getByRole('button',{name:'Start'}))
    act(()=>vi.advanceTimersByTime(30000))
    expect(screen.getByText('00:30')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Pause'}))
    act(()=>vi.advanceTimersByTime(30000))
    expect(screen.getByText('00:30')).toBeInTheDocument()
    expect(localStorage.getItem('phopse-focus-timer-v1')).toContain('"running":false')
    view.unmount()
    render(<FocusTimer />)
    expect(screen.getByText('00:30')).toBeInTheDocument()
  })

  it('labels monitor metrics simulated and exposes the actual open apps',()=>{
    render(<ActivityMonitor openApps={['Settings','Activity Monitor']} activeApp="Activity Monitor" uptimeSince={Date.now()-65000} active={false}/>)
    expect(screen.getByText('SIMULATED ACTIVITY')).toBeInTheDocument()
    expect(screen.getByText(/not device hardware readings/)).toBeInTheDocument()
    expect(screen.getByText('00:01:05')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getAllByText('Activity Monitor')).toHaveLength(3)
  })

  it('shows an empty music playlist and never starts audio automatically',()=>{
    render(<MusicPlayer />)
    expect(screen.getByText('Your playlist is empty')).toBeInTheDocument()
    expect(screen.getByText(/No audio files are bundled/)).toBeInTheDocument()
    const audio=document.querySelector('audio')
    expect(audio?.paused).toBe(true)
    expect(within(screen.getByLabelText('Music Player')).getByLabelText('Add local audio files')).toBeInTheDocument()
  })

  it('plays only user-selected audio after a click and exposes playback errors',async()=>{
    const createObjectURL=vi.fn(()=> 'blob:provided-audio'),revokeObjectURL=vi.fn()
    Object.defineProperty(window.URL,'createObjectURL',{configurable:true,value:createObjectURL})
    Object.defineProperty(window.URL,'revokeObjectURL',{configurable:true,value:revokeObjectURL})
    const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue()
    const view=render(<MusicPlayer />)
    fireEvent.change(screen.getByLabelText('Add local audio files'),{target:{files:[new File(['audio'],'original-demo.mp3',{type:'audio/mpeg'})]}})
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(play).not.toHaveBeenCalled()
    await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Play'}));await Promise.resolve()})
    expect(play).toHaveBeenCalledOnce()
    fireEvent.error(document.querySelector('audio')!)
    expect(await screen.findByRole('alert')).toHaveTextContent(/missing or unsupported/)
    view.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:provided-audio')
  })

  it('opens the universal search with Ctrl+K and Escape leaves the OS open',()=>{
    render(<App />)
    fireEvent.click(screen.getAllByRole('button',{name:/Enter Developer OS/i})[0])
    fireEvent.keyDown(window,{key:'k',ctrlKey:true})
    expect(screen.getByRole('dialog',{name:'Global Search'})).toBeInTheDocument()
    fireEvent.keyDown(window,{key:'Escape'})
    expect(screen.queryByRole('dialog',{name:'Global Search'})).not.toBeInTheDocument()
    expect(screen.getByText('Personal workspace')).toBeInTheDocument()
  })

  it('does not hijack Ctrl+K from an editor and returns focus after closing search',async()=>{
    render(<App />)
    fireEvent.click(screen.getAllByRole('button',{name:/Enter Developer OS/i})[0])
    const editor=document.createElement('input');document.body.append(editor);editor.focus()
    fireEvent.keyDown(editor,{key:'k',ctrlKey:true})
    expect(screen.queryByRole('dialog',{name:'Global Search'})).not.toBeInTheDocument()
    editor.remove()
    const trigger=screen.getByRole('button',{name:'Search portfolio and apps'});trigger.focus();fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button',{name:'Close search'}))
    await waitFor(()=>expect(trigger).toHaveFocus())
  })

  it('opens applications from the mobile app grid',async()=>{
    const original=window.matchMedia
    window.matchMedia=((query:string)=>({matches:query.includes('max-width'),media:query,onchange:null,addListener:vi.fn(),removeListener:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn(),dispatchEvent:vi.fn(()=>true)})) as typeof window.matchMedia
    render(<App />)
    fireEvent.click(screen.getAllByRole('button',{name:/Enter Developer OS/i})[0])
    const appButton=await screen.findByRole('button',{name:'Focus Timer'})
    fireEvent.click(appButton)
    expect(await screen.findByRole('region',{name:'Focus Timer'})).toBeInTheDocument()
    window.matchMedia=original
  })
})

