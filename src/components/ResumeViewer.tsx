import { useEffect, useRef, useState } from 'react'
import { Download, ExternalLink, Minus, Plus } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './resumeViewer.css'

export default function ResumeViewer({ url }: { url?: string }) {
  const scroll = useRef<HTMLDivElement>(null)
  const pages = useRef<HTMLDivElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy>()
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState(false)
  const [rendering, setRendering] = useState(true)
  const [width, setWidth] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!url) return
    let active = true
    let destroy: (() => void) | undefined
    void import('pdfjs-dist').then(async ({ getDocument, GlobalWorkerOptions }) => {
      if (!active) return
      GlobalWorkerOptions.workerSrc = workerUrl
      const task = getDocument({ url, isEvalSupported: false })
      destroy = () => { void task.destroy().catch(() => undefined) }
      const document = await task.promise
      if (active) setPdf(document)
    }).catch(() => { if (active) setError(true) })
    return () => { active = false; destroy?.() }
  }, [url, retry])

  useEffect(() => {
    const viewport = scroll.current
    if (!viewport) return
    const measure = () => setWidth(Math.max(1, viewport.clientWidth - 24))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = pages.current
    if (!pdf || !width || !container) return
    let active = true
    let cancel: (() => void) | undefined
    setRendering(true)
    const rendered = document.createDocumentFragment()
    void (async () => {
      for (let number = 1; number <= pdf.numPages; number++) {
        const sheet = await pdf.getPage(number)
        if (!active) return
        const original = sheet.getViewport({ scale: 1 })
        const viewport = sheet.getViewport({ scale: width / original.width * zoom / 100 })
        const density = Math.min(devicePixelRatio || 1, 2)
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width * density)
        canvas.height = Math.ceil(viewport.height * density)
        canvas.style.width = viewport.width + 'px'
        canvas.style.height = viewport.height + 'px'
        canvas.setAttribute('role', 'img')
        canvas.setAttribute('aria-label', 'Resume page ' + number)
        const canvasContext = canvas.getContext('2d')
        if (!canvasContext) throw new Error('Canvas unavailable')
        const task = sheet.render({ canvasContext, viewport, transform: [density, 0, 0, density, 0, 0] })
        cancel = () => task.cancel()
        await task.promise
        rendered.append(canvas)
      }
      if (active) {
        container.replaceChildren(rendered)
        updatePage()
        setRendering(false)
      }
    })().catch(() => { if (active) setError(true) })
    return () => { active = false; cancel?.() }
  }, [pdf, width, zoom])

  function updatePage() {
    const viewport = scroll.current
    if (!viewport || !pages.current) return
    const middle = viewport.getBoundingClientRect().top + viewport.clientHeight / 2
    const index = Array.from(pages.current.children).findIndex(canvas => canvas.getBoundingClientRect().bottom >= middle)
    setPage(index < 0 ? Math.max(1, pages.current.children.length) : index + 1)
  }

  return <section className="resume-viewer" aria-label="Resume viewer">
    <header className="resume-toolbar">
      <strong>Om Phopse — Resume</strong>
      <div className="resume-tools" role="group" aria-label="Document controls">
        <span aria-live="polite">{pdf && !error ? 'Page ' + page + ' of ' + pdf.numPages : 'PDF'}</span>
        <button aria-label="Zoom out" disabled={!pdf || error || zoom <= 75} onClick={() => setZoom(zoom - 25)}><Minus size={14} /></button>
        <span>{zoom}%</span>
        <button aria-label="Zoom in" disabled={!pdf || error || zoom >= 200} onClick={() => setZoom(zoom + 25)}><Plus size={14} /></button>
        <button disabled={!pdf || error} onClick={() => setZoom(100)}>Fit width</button>
      </div>
      {url && <div className="resume-tools" role="group" aria-label="File actions">
        <a href={url} download><Download size={14} /> Download Resume</a>
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open PDF in new tab" title="Open PDF in new tab"><ExternalLink size={14} /></a>
      </div>}
    </header>
    <div ref={scroll} className="resume-document" tabIndex={0} aria-label="Resume pages" onScroll={updatePage}>
      {(!url || error) ? <div className="resume-message" role="status">
        <p>{url ? 'The resume could not be displayed.' : 'The resume is unavailable.'}</p>
        {url && <button onClick={() => {
          setError(false)
          setPdf(undefined)
          setRendering(true)
          setRetry(retry + 1)
        }}>Retry</button>}
      </div> : rendering && <p className="resume-message" role="status">Rendering resume…</p>}
      <div ref={pages} className="resume-pages" hidden={error} />
    </div>
  </section>
}
