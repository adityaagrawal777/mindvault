import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { 
  Send, Bot, User, Loader2, FileText, Paperclip, Upload, 
  BookOpen, Layers, HelpCircle, Sparkles, CheckCircle2, Cpu
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function ChatArea({ 
  currentSessionId, 
  summaryMessage, 
  onUpload, 
  onJumpToPage, 
  isUploading = false, 
  uploadingFile = null 
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(15)
  const [uploadStage, setUploadStage] = useState(0)

  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)
  
  // Streaming buffer refs
  const streamBufferRef = useRef('')
  const streamStateRef = useRef({ isStreaming: false, currentMessageId: null })

  // Processing stage progression effect during PDF upload
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(15)
      setUploadStage(0)

      const timer1 = setTimeout(() => {
        setUploadProgress(42)
        setUploadStage(1)
      }, 2500)

      const timer2 = setTimeout(() => {
        setUploadProgress(72)
        setUploadStage(2)
      }, 5500)

      const timer3 = setTimeout(() => {
        setUploadProgress(93)
        setUploadStage(3)
      }, 9000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [isUploading])

  // Handle incoming summary messages from App.jsx
  useEffect(() => {
    if (!summaryMessage) return
    if (summaryMessage.loading) {
      setIsSummaryLoading(true)
    } else {
      setIsSummaryLoading(false)
      setMessages(prev => [...prev, summaryMessage])
    }
  }, [summaryMessage])

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId)
    } else {
      setMessages([])
    }
  }, [currentSessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isLoading, isSummaryLoading, isUploading])

  // Typewriter effect interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (streamStateRef.current.isStreaming && streamBufferRef.current.length > 0) {
        const chunk = streamBufferRef.current.slice(0, 3)
        streamBufferRef.current = streamBufferRef.current.slice(3)
        
        setMessages(prev => prev.map(msg => 
          msg.id === streamStateRef.current.currentMessageId 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ))
      }
    }, 30)

    return () => clearInterval(interval)
  }, [])

  const loadSessionMessages = async (sessionId) => {
    setIsSessionLoading(true)
    try {
      const history = await api.getMessages(sessionId)
      setMessages(history)
    } catch (error) {
      console.error("Failed to load messages", error)
    } finally {
      setIsSessionLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !currentSessionId || isLoading || isUploading) return

    const userMessage = { role: 'user', content: input, id: Date.now().toString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const aiMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { 
      role: 'ai', 
      content: '', 
      id: aiMessageId,
      citations: []
    }])

    streamBufferRef.current = ''
    streamStateRef.current = { isStreaming: true, currentMessageId: aiMessageId }

    await api.askStream(currentSessionId, input, {
      onToken: (token) => {
        streamBufferRef.current += token
      },
      onSources: (sources) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, citations: sources }
            : msg
        ))
      },
      onComplete: () => {
        const checkDrain = setInterval(() => {
          if (streamBufferRef.current.length === 0) {
            setIsLoading(false)
            streamStateRef.current.isStreaming = false
            clearInterval(checkDrain)
          }
        }, 100)
      },
      onError: (error) => {
        console.error("Stream error", error)
        const errorMsg = error.message || "Stream interrupted."
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: msg.content + `\n\n**Error:** ${errorMsg}`, isError: true }
            : msg
        ))
        setIsLoading(false)
        streamStateRef.current.isStreaming = false
      }
    })
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isUploading) setIsDragOver(true)
  }, [isUploading])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (isUploading) return
    const files = e.dataTransfer?.files
    if (files?.[0]?.name?.toLowerCase().endsWith('.pdf')) {
      onUpload?.(files[0])
    }
  }, [onUpload, isUploading])

  const suggestions = [
    { icon: BookOpen, label: 'Summarize my PDF', description: 'Get a quick overview', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { icon: Layers, label: 'Generate flashcards', description: 'Study key concepts', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-400' },
    { icon: HelpCircle, label: 'Quiz me on this', description: 'Test your knowledge', color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
  ]

  const processingStages = [
    { label: 'Reading PDF pages & extracting text content' },
    { label: 'Splitting text into semantic document chunks' },
    { label: 'Generating vector embeddings with FAISS' },
    { label: 'Initializing Llama 3.3 70B AI QA chain' },
  ]

  return (
    <div className="flex flex-col h-full bg-background relative">
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="space-y-6 max-w-3xl mx-auto pb-4 h-full">
          
          {/* ── Processing / Uploading Screen ──────────────────────────── */}
          {isUploading && (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] animate-slide-up-fade">
              {/* Floating Glowing Ring & Spinner */}
              <div className="relative mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 shadow-2xl shadow-primary/20 relative overflow-hidden animate-pulse">
                  <Cpu className="h-12 w-12 text-primary animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                </div>
              </div>

              {/* Heading */}
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                Processing &amp; Indexing Document...
              </h3>
              <p className="max-w-md text-sm text-muted-foreground mb-8">
                Our RAG pipeline is analyzing your PDF, generating embeddings, and building your AI assistant.
              </p>

              {/* File Info Banner */}
              <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-md mb-6 flex items-center gap-3.5 shadow-sm text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {uploadingFile?.name || 'Document.pdf'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {uploadingFile?.size ? `${(uploadingFile.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF File'}
                  </p>
                </div>
                <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 animate-pulse">
                  {uploadProgress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-muted/60 h-2.5 rounded-full overflow-hidden mb-6 p-0.5 border border-border/40">
                <div 
                  className="bg-gradient-to-r from-primary via-accent to-primary h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Stage Checklist */}
              <div className="w-full max-w-md space-y-2.5 text-left bg-card/40 border border-border/40 rounded-2xl p-4 backdrop-blur-sm">
                {processingStages.map((stg, i) => {
                  const isDone = uploadStage > i
                  const isCurrent = uploadStage === i
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                        isDone ? "bg-emerald-500/20 text-emerald-500" :
                        isCurrent ? "bg-primary/20 text-primary animate-pulse" :
                        "bg-muted/40 text-muted-foreground/40"
                      )}>
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                         isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                         <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </div>
                      <span className={cn(
                        "transition-colors duration-300 font-medium",
                        isDone ? "text-foreground/70 opacity-80" :
                        isCurrent ? "text-foreground font-semibold" :
                        "text-muted-foreground/50"
                      )}>
                        {stg.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Reassurance note */}
              <p className="text-[11px] text-muted-foreground/70 mt-6 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary/70" />
                <span>Large or detailed PDFs may take 10-15 seconds. Thank you for waiting!</span>
              </p>
            </div>
          )}

          {/* ── Welcome Screen ──────────────────────────────── */}
          {!isUploading && !currentSessionId && !isSessionLoading && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center min-h-[60vh]">
              {/* Floating icon */}
              <div className="relative mb-8 animate-float-gentle">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 shadow-xl shadow-primary/10 animate-glow-pulse">
                  <FileText className="h-12 w-12 text-primary/70" />
                </div>
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>

              {/* Gradient heading */}
              <h3 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
                Welcome to MindVault
              </h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground mb-8">
                Upload a PDF and start an AI-powered conversation. Ask questions, get summaries, and explore your documents interactively.
              </p>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-full max-w-md rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-300 group",
                  isDragOver 
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/20 scale-[1.02]"
                    : "border-border/60 hover:border-primary/50 hover:bg-primary/[0.02] animate-border-glow"
                )}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onUpload?.(e.target.files[0])
                      e.target.value = ''
                    }
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                    isDragOver 
                      ? "bg-primary/20 scale-110" 
                      : "bg-muted/60 group-hover:bg-primary/10"
                  )}>
                    <Upload className={cn(
                      "h-7 w-7 transition-colors duration-300",
                      isDragOver ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isDragOver ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <div
                    key={s.label}
                    className="group rounded-xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-default"
                    style={{ animationDelay: `${0.1 * i}s` }}
                  >
                    <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${s.color}`}>
                      <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Session Spinner */}
          {!isUploading && isSessionLoading && (
             <div className="flex h-full items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}

          {/* ── Messages ────────────────────────────────────── */}
          {!isUploading && messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4 animate-slide-up-fade",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className={cn(
                "h-9 w-9 mt-0.5 shadow-md ring-2",
                msg.role === 'ai' 
                  ? "ring-primary/20" 
                  : "ring-secondary"
              )}>
                <AvatarFallback className={cn(
                  msg.role === 'ai' 
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
                    : "bg-gradient-to-br from-secondary to-muted text-secondary-foreground"
                )}>
                  {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/15 rounded-tr-sm" 
                    : "bg-card/80 text-foreground border border-border/50 shadow-md rounded-tl-sm backdrop-blur-sm"
                )}
              >
                 {msg.role === 'ai' ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                       <ReactMarkdown
                         components={{
                             p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                             ul: (props) => <ul className="list-disc pl-4 mb-2" {...props} />,
                             ol: (props) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                             li: (props) => <li className="mb-1" {...props} />,
                             code: ({children, ...props}) => {
                                 const isInline = !props.className;
                                 return isInline ? (
                                     <code className="bg-background/50 px-1.5 py-0.5 rounded-md font-mono text-xs border border-border/30" {...props}>{children}</code>
                                 ) : (
                                     <pre className="bg-background/50 p-3 rounded-xl overflow-x-auto my-2 border border-border/30"><code className="font-mono text-xs" {...props}>{children}</code></pre>
                                 )
                             }
                         }}
                       >
                         {msg.content}
                       </ReactMarkdown>
                       {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                              <span className="text-xs font-semibold opacity-70">Sources:</span>
                              {msg.citations.map((cite, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => onJumpToPage?.(cite.page)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/5 hover:bg-primary/10 text-[10px] font-medium shadow-sm border border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                                    title={cite.text}
                                  >
                                      <FileText className="h-3 w-3 opacity-70 group-hover:text-primary transition-colors" />
                                      Page {cite.page}
                                  </button>
                              ))}
                          </div>
                      )}
                     </div>
                 ) : (
                     <p className="whitespace-pre-wrap">{msg.content}</p>
                 )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {!isUploading && (isLoading || isSummaryLoading) && (
            <div className="flex gap-4 animate-slide-up-fade">
               <Avatar className="h-9 w-9 mt-0.5 shadow-md ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card/80 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50 shadow-md backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="flex space-x-1.5">
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                    </div>
                    {isSummaryLoading && <span className="text-xs text-muted-foreground ml-2">Generating summary...</span>}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* ── Input Bar ──────────────────────────────────────── */}
      <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
          <label className={cn("cursor-pointer", isUploading && "cursor-not-allowed opacity-50")}>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              disabled={isUploading}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onUpload?.(e.target.files[0])
                  e.target.value = ''
                }
              }}
            />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-primary/10 transition-all group" title="Upload PDF">
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 text-primary animate-spin" />
              ) : (
                <Paperclip className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
          </label>
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isUploading 
                  ? `Processing ${uploadingFile?.name || 'PDF'}...` 
                  : currentSessionId 
                  ? "Ask a question about your PDF..." 
                  : "Upload a PDF to start chatting..."
              }
              className="pr-12 py-6 rounded-xl bg-card/60 backdrop-blur-sm border-border/50 focus:border-primary/40 focus:shadow-lg focus:shadow-primary/5 transition-all"
              disabled={isLoading || isUploading || !currentSessionId}
            />
            <Button 
              type="submit" 
              size="icon" 
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg transition-all",
                input.trim() && !isLoading && !isUploading && currentSessionId
                  ? "bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 animate-glow-pulse"
                  : ""
              )}
              disabled={!input.trim() || isLoading || isUploading || !currentSessionId}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground/60">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
