import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Send, Bot, User, Loader2, FileText, Paperclip } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function ChatArea({ currentSessionId, summaryMessage, onUpload, onJumpToPage }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const scrollRef = useRef(null)
  
  // Streaming buffer refs
  const streamBufferRef = useRef('')
  const streamStateRef = useRef({ isStreaming: false, currentMessageId: null })

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
  }, [messages, isLoading, isSummaryLoading])

  // Typewriter effect interval
  useEffect(() => {
    const interval = setInterval(() => {
        if (streamStateRef.current.isStreaming && streamBufferRef.current.length > 0) {
            const chunk = streamBufferRef.current.slice(0, 3) // Take small chunk
            streamBufferRef.current = streamBufferRef.current.slice(3)
            
            setMessages(prev => prev.map(msg => 
                msg.id === streamStateRef.current.currentMessageId 
                    ? { ...msg, content: msg.content + chunk }
                    : msg
            ))
        }
    }, 30) // 30ms for smooth typing

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
    if (!input.trim() || !currentSessionId || isLoading) return

    const userMessage = { role: 'user', content: input, id: Date.now().toString() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Initial placeholder for AI message
    const aiMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '', 
        id: aiMessageId,
        citations: []
    }])

    // Reset buffer
    streamBufferRef.current = ''
    streamStateRef.current = { isStreaming: true, currentMessageId: aiMessageId }

    await api.askStream(currentSessionId, input, {
        onToken: (token) => {
            // Push to buffer instead of direct update
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
            // Wait for buffer to drain before stopping loading
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

  // Unified render
  return (
    <div className="flex flex-col h-full bg-background relative">
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="space-y-6 max-w-3xl mx-auto pb-4 h-full">
          
          {/* Welcome Screen - Show when no session and not loading */}
          {!currentSessionId && !isSessionLoading && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[50vh]">
              <div className="relative mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 shadow-lg shadow-primary/5">
                    <FileText className="h-12 w-12 text-primary/60" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/80 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Welcome to PDF Chatbot</h3>
              <p className="max-w-md text-sm leading-relaxed mb-6">
                Upload a PDF document and start an AI-powered conversation. Ask questions, get summaries, and explore your documents interactively.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Use the 📎 button below to upload a PDF</span>
              </div>
            </div>
          )}

          {/* Loading Loader */}
          {isSessionLoading && (
             <div className="flex h-full items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className="h-9 w-9 mt-0.5 border-2 shadow-sm">
                <AvatarFallback className={msg.role === 'ai' ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                  {msg.role === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 rounded-tr-sm" 
                    : "bg-muted/50 text-foreground border border-border/50 shadow-sm rounded-tl-sm"
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
                                     <code className="bg-background/50 px-1 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>
                                 ) : (
                                     <pre className="bg-background/50 p-2 rounded-md overflow-x-auto my-2"><code className="font-mono text-xs" {...props}>{children}</code></pre>
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
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/50 hover:bg-background text-[10px] shadow-sm border border-transparent hover:border-border transition-all cursor-pointer"
                                    title={cite.text}
                                  >
                                      <FileText className="h-3 w-3 opacity-70" />
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
          
          {/* Typing/Summary Indicators */}
          {(isLoading || isSummaryLoading) && (
            <div className="flex gap-4">
               <Avatar className="h-8 w-8 mt-1 border">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 rounded-lg px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                        <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce"></div>
                    </div>
                    {isSummaryLoading && <span className="text-xs text-muted-foreground ml-2">Generating summary...</span>}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/95 backdrop-blur border-t sticky bottom-0 z-10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
          <label className="cursor-pointer">
            <input 
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
            <div className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors" title="Upload PDF">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
          </label>
          <div className="relative flex-1">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentSessionId ? "Ask a question about your PDF..." : "Upload a PDF to start chatting..."}
              className="pr-12 py-6"
              disabled={isLoading || !currentSessionId}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1.5 top-1.5 h-9 w-9"
              disabled={!input.trim() || isLoading || !currentSessionId}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
        <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">
                AI can make mistakes. Please verify important information.
            </p>
        </div>
      </div>
    </div>
  )
}
