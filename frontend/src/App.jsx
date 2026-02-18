import { useState, useCallback, useRef } from 'react'
import { ThemeProvider } from "./components/theme-provider"
import { Header } from "./components/Header"
import Sidebar from "./components/Sidebar"
import ChatArea from "./components/ChatArea"
import FlashcardViewer from "./components/FlashcardViewer"
import QuizViewer from "./components/QuizViewer"
import PdfViewer from "./components/PdfViewer"
import AuthPage from "./components/AuthPage"
import { useAuth } from "./contexts/AuthContext"
import { api } from "./lib/api"
import { Loader2 } from "lucide-react"

function App() {
  const { user, loading: authLoading, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [summaryMessage, setSummaryMessage] = useState(null)
  const [flashcards, setFlashcards] = useState(null)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [quizQuestions, setQuizQuestions] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfPosition, setPdfPosition] = useState('left') // 'left' | 'right'
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(50) // percentage
  const containerRef = useRef(null)
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let pct
      if (pdfPosition === 'left') {
        pct = ((e.clientX - rect.left) / rect.width) * 100
      } else {
        pct = ((rect.right - e.clientX) / rect.width) * 100
      }
      setPdfWidth(Math.max(20, Math.min(70, pct)))
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [pdfPosition])

  const handleGetSummary = async (summaryType) => {
    if (!currentSessionId) return
    setSummaryMessage({ loading: true, type: summaryType })
    try {
      const data = await api.getSummary(currentSessionId, summaryType)
      const typeLabels = { bullets: '📋 Bullet Points', detailed: '📝 Detailed Summary', short: '⚡ Short Summary' }
      const label = typeLabels[summaryType] || 'Summary'
      setSummaryMessage({
        role: 'ai',
        content: `**${label}**\n\n${data.summary}`,
        id: Date.now().toString(),
        loading: false,
      })
    } catch (error) {
      console.error("Summary failed", error)
      const status = error?.response?.status
      const detail = error?.response?.data?.detail || ''
      let errorMsg = "**Error:** Failed to generate summary. Please try again."
      if (status === 404) {
        errorMsg = "**Session Expired:** The server was restarted and your session was lost. Please **upload the PDF again** to start a new session."
      } else if (detail) {
        errorMsg = `**Error:** ${detail}`
      }
      setSummaryMessage({
        role: 'ai',
        content: errorMsg,
        id: Date.now().toString(),
        isError: true,
        loading: false,
      })
    }
  }

  const handleUpload = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are accepted.')
      return
    }
    try {
      const data = await api.upload(file)
      setCurrentSessionId(data.session_id)
      setPdfPage(1)
      setShowPdfViewer(true)
      setIsDesktopSidebarOpen(true)
    } catch (error) {
      console.error('Upload failed', error)
      const msg = error?.response?.data?.detail || error.message || 'Upload failed'
      alert(`Upload failed: ${msg}`)
    }
  }

  const handleGenerateFlashcards = () => {
    if (!currentSessionId) return
    // Open the FlashcardViewer in setup mode (it will handle count selection & API calls)
    setFlashcards(null)
    setShowFlashcards(true)
  }

  const handleStartQuiz = () => {
    if (!currentSessionId) return
    // Open QuizViewer in setup mode (it handles difficulty selection & API calls)
    setQuizQuestions(null)
    setShowQuiz(true)
  }

  const jumpToPage = (page) => {
    if (!showPdfViewer) setShowPdfViewer(true)
    setPdfPage(page)
  }

  // Auth loading spinner
  if (authLoading) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ThemeProvider>
    )
  }

  // Not authenticated — show login page
  if (!user) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthPage />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen flex-col bg-background font-sans antialiased text-foreground overflow-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          onDesktopSidebarToggle={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onPdfToggle={() => setShowPdfViewer(!showPdfViewer)}
          showPdfViewer={showPdfViewer}
          hasSession={!!currentSessionId}
          user={user}
          onLogout={logout}
        />
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar */}
          <aside className={`hidden md:flex md:flex-col border-r bg-muted/40 transition-all duration-300 overflow-hidden ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0 md:border-r-0'}`}>
             <Sidebar 
                currentSessionId={currentSessionId} 
                setCurrentSessionId={setCurrentSessionId}
                onGetSummary={handleGetSummary}
                onGenerateFlashcards={handleGenerateFlashcards}
                onStartQuiz={handleStartQuiz}
                onCollapse={() => setIsDesktopSidebarOpen(false)}
                isMobile={false}
             />
          </aside>

          {/* Mobile Sidebar */}
          <Sidebar 
            currentSessionId={currentSessionId} 
            setCurrentSessionId={setCurrentSessionId}
            onGetSummary={handleGetSummary}
            onGenerateFlashcards={handleGenerateFlashcards}
            onStartQuiz={handleStartQuiz}
            isMobile={true}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* PDF Viewer Pane (left position) */}
          {showPdfViewer && currentSessionId && pdfPosition === 'left' && (
            <div className="hidden md:flex" style={{ width: `${pdfWidth}%` }}>
              <PdfViewer 
                sessionId={currentSessionId} 
                onSwapPosition={() => setPdfPosition('right')} 
                position="left" 
                pageNumber={pdfPage}
              />
            </div>
          )}

          {/* Resize Handle */}
          {showPdfViewer && currentSessionId && (
            <div
              onMouseDown={handleMouseDown}
              className="hidden md:flex w-1 cursor-col-resize items-center justify-center hover:bg-primary/20 active:bg-primary/30 transition-colors group relative z-10"
              title="Drag to resize"
            >
              <div className="h-8 w-0.5 rounded-full bg-border group-hover:bg-primary/50 transition-colors" />
            </div>
          )}

          <main className="flex-1 flex flex-col w-full min-w-0">
            <ChatArea 
                currentSessionId={currentSessionId} 
                summaryMessage={summaryMessage} 
                onUpload={handleUpload}
                onJumpToPage={jumpToPage}
            />
          </main>

          {/* PDF Viewer Pane (right position) */}
          {showPdfViewer && currentSessionId && pdfPosition === 'right' && (
            <div className="hidden md:flex" style={{ width: `${pdfWidth}%` }}>
              <PdfViewer 
                sessionId={currentSessionId} 
                onSwapPosition={() => setPdfPosition('left')} 
                position="right"
                pageNumber={pdfPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Flashcard Viewer Overlay */}
      {showFlashcards && (
        <FlashcardViewer 
          flashcards={flashcards}
          sessionId={currentSessionId}
          onClose={() => setShowFlashcards(false)} 
        />
      )}

      {/* Quiz Viewer Overlay */}
      {showQuiz && (
        <QuizViewer
          questions={quizQuestions}
          sessionId={currentSessionId}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </ThemeProvider>
  )
}

export default App
