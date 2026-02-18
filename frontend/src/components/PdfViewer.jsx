import { useState, useCallback, useEffect, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from "./ui/button"
import { ZoomIn, ZoomOut, FileText, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function PdfViewer({ sessionId, onSwapPosition, position = 'left', pageNumber }) {
  const [numPages, setNumPages] = useState(null)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pdfUrl = `/api/pdf/${sessionId}`

  const containerRef = useRef(null)

  // Auto-scroll when pageNumber changes
  const scrollToPage = useCallback((page) => {
    console.log(`Advancing to page ${page}, total pages: ${numPages}`)
    if (page && numPages && page <= numPages) {
        const attemptScroll = () => {
          const pageElement = document.getElementById(`pdf-page-${page}`)
          console.log(`Looking for element pdf-page-${page}:`, pageElement)
          if (pageElement) {
              pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
        
        attemptScroll()
        // Retry in case of render delay
        setTimeout(attemptScroll, 100)
        setTimeout(attemptScroll, 500)
    }
  }, [numPages])

  useEffect(() => {
    scrollToPage(pageNumber)
  }, [pageNumber, scrollToPage])

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
    // Scroll to page if provided initially
    if (pageNumber) {
        setTimeout(() => scrollToPage(pageNumber), 500)
    }
  }, [pageNumber, scrollToPage])

  // Auto-scroll when pageNumber changes


  const onDocumentLoadError = useCallback((err) => {
    console.error('PDF load error:', err)
    setError('Failed to load PDF')
    setLoading(false)
  }, [])

  const zoomIn = () => setScale(s => Math.min(s + 0.2, 2.5))
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.4))
  const zoomReset = () => setScale(1.0)

  return (
    <div className={`flex flex-col h-full w-full bg-muted/30 ${position === 'left' ? 'border-r' : 'border-l'}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card/50 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold truncate max-w-[120px]">PDF Viewer</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button 
            onClick={zoomReset}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded cursor-pointer"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSwapPosition} title={`Move to ${position === 'left' ? 'right' : 'left'}`}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {numPages && (
          <span className="text-[10px] text-muted-foreground">
            {numPages} pages
          </span>
        )}
      </div>

      {/* PDF Pages */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="flex items-center justify-center h-full p-4 text-center">
            <div className="space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 gap-4 min-w-0">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-40">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading PDF...</span>
                  </div>
                </div>
              }
            >
              {numPages && Array.from({ length: numPages }, (_, i) => (
                <div key={i} id={`pdf-page-${i + 1}`} className="shadow-md rounded-sm overflow-hidden mb-2 relative bg-background">
                  <Page
                    pageNumber={i + 1}
                    scale={scale}
                    width={containerRef.current ? Math.min(containerRef.current.clientWidth - 48, 800) : 600}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="h-[800px] w-[600px] bg-muted animate-pulse rounded" />
                    }
                  />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {i + 1}
                  </div>
                </div>
              ))}
            </Document>

          </div>
        )}
      </div>
    </div>
  )
}
