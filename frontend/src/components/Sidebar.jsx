import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { cn } from "@/lib/utils"
import { MessageSquare, Trash2, PanelLeftClose, FileText, Loader2, List, AlignLeft, Zap, Layers, HelpCircle, CloudOff } from "lucide-react"
import { api } from "@/lib/api"

export default function Sidebar({ 
  currentSessionId, 
  setCurrentSessionId, 
  onGetSummary,
  onGenerateFlashcards,
  onStartQuiz,
  onCollapse,
  isMobile = false, 
  isOpen = false, 
  onClose 
}) {
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    loadSessions()
  }, [currentSessionId])

  const loadSessions = async () => {
    try {
      const data = await api.getSessions()
      setSessions(data)
    } catch (error) {
      console.error("Failed to load sessions", error)
    }
  }



  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    try {
      await api.deleteSession(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
      }
    } catch (error) {
      console.error("Failed to delete session", error)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4 min-w-64">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Chats</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onCollapse?.()}>
            <PanelLeftClose className="h-4 w-4" />
            <span className="sr-only">Collapse Sidebar</span>
        </Button>
      </div>
      


      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-1">
          {sessions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p>No sessions yet</p>
                <p className="text-xs mt-1 opacity-70">Upload a PDF to start</p>
            </div>
          ) : (
             sessions.map((session) => (
                <div
                    key={session.id}
                    className={cn(
                        "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all cursor-pointer",
                        currentSessionId === session.id 
                          ? "bg-primary/10 font-medium text-primary border border-primary/20 shadow-sm" 
                          : "text-muted-foreground hover:bg-muted/60 border border-transparent"
                    )}
                    onClick={() => {
                        setCurrentSessionId(session.id)
                        if (isMobile && onClose) onClose()
                    }}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{session.name}</span>
                        {!session.isActive && (
                            <span className="flex items-center gap-1 shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                                <CloudOff className="h-2.5 w-2.5" />
                                Inactive
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                    >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
             ))
          )}
        </div>
      </ScrollArea>
      
      {/* Active Session Card (if selected) */}
      {currentSessionId && (() => {
          const currentSession = sessions.find(s => s.id === currentSessionId)
          const isActive = currentSession?.isActive !== false
          return (
          <div className="mt-auto p-4 border-t bg-gradient-to-t from-muted/30 to-transparent space-y-3">
             <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm",
                    isActive 
                        ? "bg-gradient-to-br from-primary/15 to-primary/5 text-primary"
                        : "bg-gradient-to-br from-muted/30 to-muted/10 text-muted-foreground"
                )}>
                    <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold">
                        {currentSession?.name || 'Active Session'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {isActive ? (
                            <><span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Ready to chat</>
                        ) : (
                            <><CloudOff className="h-3 w-3 text-amber-500" /> <span className="text-amber-500">Inactive — re-upload PDF to chat</span></>
                        )}
                    </p>
                </div>
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Summarize</p>
                <div className="grid grid-cols-3 gap-1.5">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-7 gap-1"
                        disabled={!isActive}
                        onClick={(e) => { e.stopPropagation(); onGetSummary?.('bullets'); }}
                    >
                        <List className="h-3 w-3" />
                        Bullets
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-7 gap-1"
                        disabled={!isActive}
                        onClick={(e) => { e.stopPropagation(); onGetSummary?.('detailed'); }}
                    >
                        <AlignLeft className="h-3 w-3" />
                        Detailed
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] h-7 gap-1"
                        disabled={!isActive}
                        onClick={(e) => { e.stopPropagation(); onGetSummary?.('short'); }}
                    >
                        <Zap className="h-3 w-3" />
                        Short
                    </Button>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 gap-1.5"
                    disabled={!isActive}
                    onClick={(e) => { e.stopPropagation(); onGenerateFlashcards?.(); }}
                >
                    <Layers className="h-3.5 w-3.5" />
                    Generate Flashcards
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 gap-1.5"
                    disabled={!isActive}
                    onClick={(e) => { e.stopPropagation(); onStartQuiz?.(); }}
                >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Quiz Mode
                </Button>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full text-xs h-8"
                    onClick={(e) => handleDeleteSession(e, currentSessionId)}
                >
                    End Session
                </Button>
             </div>
          </div>
          )
      })()}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-[300px]">
            <SheetHeader className="px-4 py-4 border-b">
                <SheetTitle>PDF Chatbot</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-65px)]">
                <SidebarContent />
            </div>
        </SheetContent>
      </Sheet>
    )
  }

  return <SidebarContent />
}
