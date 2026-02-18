import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from "./ui/button"
import { X, ChevronLeft, ChevronRight, Shuffle, RotateCcw, Check, XIcon, Layers, Edit3, Plus, Trash2, Save, Loader2, Sparkles, Zap, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// ── Count Selector Screen ────────────────────────────────────
function CountSelector({ onSelect, onClose, isLoading }) {
  const [selected, setSelected] = useState(10)
  const counts = [5, 10, 15, 20]

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fc-scale-in">
        {/* Close */}
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 mb-5 shadow-lg shadow-violet-500/10 animate-fc-float">
            <Layers className="h-10 w-10 text-violet-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Generate Flashcards
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">Choose how many cards to create from your document</p>
        </div>

        {/* Count Options */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {counts.map(count => (
            <button
              key={count}
              onClick={() => setSelected(count)}
              className={cn(
                "relative flex flex-col items-center justify-center py-5 px-3 rounded-2xl border-2 transition-all duration-300 group",
                selected === count
                  ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20 scale-105"
                  : "border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5 hover:scale-[1.02]"
              )}
            >
              <span className={cn(
                "text-3xl font-bold transition-colors",
                selected === count ? "text-violet-400" : "text-foreground/70 group-hover:text-foreground"
              )}>{count}</span>
              <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">cards</span>
              {selected === count && (
                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center animate-fc-scale-in">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => onSelect(selected)}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating {selected} cards...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Generate {selected} Flashcards
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── Edit Modal ───────────────────────────────────────────────
function EditCardModal({ card, onSave, onCancel }) {
  const [question, setQuestion] = useState(card.question)
  const [answer, setAnswer] = useState(card.answer)
  const qRef = useRef(null)

  useEffect(() => { qRef.current?.focus() }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-lg bg-card border border-border/50 rounded-3xl p-6 shadow-2xl animate-fc-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-violet-400" /> Edit Card
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Question</label>
            <textarea
              ref={qRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[80px]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Answer</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[100px]"
              rows={4}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={() => onSave({ question: question.trim(), answer: answer.trim() })}
            disabled={!question.trim() || !answer.trim()}
            className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-500"
          >
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Add Card Modal ───────────────────────────────────────────
function AddCardModal({ onAdd, onCancel }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const qRef = useRef(null)

  useEffect(() => { qRef.current?.focus() }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="w-full max-w-lg bg-card border border-border/50 rounded-3xl p-6 shadow-2xl animate-fc-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-400" /> Add New Card
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Question</label>
            <textarea
              ref={qRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Enter your question..."
              className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[80px]"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Answer</label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Enter the answer..."
              className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[100px]"
              rows={4}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>
          <Button
            onClick={() => onAdd({ question: question.trim(), answer: answer.trim() })}
            disabled={!question.trim() || !answer.trim()}
            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Card
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Confetti Effect ──────────────────────────────────────────
function Confetti() {
  const colors = ['#8b5cf6', '#a855f7', '#d946ef', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
  return (
    <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-fc-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            opacity: 0.8 + Math.random() * 0.2,
          }}
        />
      ))}
    </div>
  )
}

// ── Progress Ring (SVG) ──────────────────────────────────────
function ProgressRing({ progress, size = 48, strokeWidth = 3 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGrad)" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Card Gradients ───────────────────────────────────────────
const CARD_GRADIENTS = [
  'from-violet-500/8 via-purple-500/5 to-fuchsia-500/8',
  'from-blue-500/8 via-indigo-500/5 to-violet-500/8',
  'from-cyan-500/8 via-blue-500/5 to-indigo-500/8',
  'from-teal-500/8 via-cyan-500/5 to-blue-500/8',
  'from-emerald-500/8 via-teal-500/5 to-cyan-500/8',
  'from-fuchsia-500/8 via-pink-500/5 to-rose-500/8',
]

const BORDER_COLORS = [
  'border-violet-500/25',
  'border-blue-500/25',
  'border-cyan-500/25',
  'border-teal-500/25',
  'border-emerald-500/25',
  'border-fuchsia-500/25',
]

// ══════════════════════════════════════════════════════════════
// ── MAIN FlashcardViewer Component ───────────────────────────
// ══════════════════════════════════════════════════════════════
export default function FlashcardViewer({ flashcards: initialFlashcards, sessionId, onClose }) {
  // Phase: 'setup' | 'studying' | 'results'
  const [phase, setPhase] = useState(initialFlashcards ? 'studying' : 'setup')
  const [cards, setCards] = useState(initialFlashcards || [])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [scores, setScores] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [slideDirection, setSlideDirection] = useState(null) // 'left' | 'right'
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Modals
  const [editingCard, setEditingCard] = useState(null) // index
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // index

  const total = cards.length
  const current = cards[currentIndex]
  const knownCount = Object.values(scores).filter(v => v === 'know').length
  const answeredCount = Object.keys(scores).length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const gradientIdx = currentIndex % CARD_GRADIENTS.length

  // ── Count Selection Handler ──────────────────────────────
  const handleCountSelect = async (count) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getFlashcards(sessionId, count)
      setCards(data.flashcards)
      setCurrentIndex(0)
      setScores({})
      setStreak(0)
      setMaxStreak(0)
      setPhase('studying')
    } catch (err) {
      console.error("Flashcard generation failed", err)
      const detail = err?.response?.data?.detail || err.message || "Failed to generate flashcards"
      setError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Keyboard Navigation ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'studying') return
    const handleKeyDown = (e) => {
      if (editingCard !== null || showAddModal) return
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setIsFlipped(f => !f) }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentIndex, total, editingCard, showAddModal])

  // ── Navigation ───────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setSlideDirection('left')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setSlideDirection(null)
      }, 200)
    }
  }, [currentIndex, total])

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSlideDirection('right')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(i => i - 1)
        setSlideDirection(null)
      }, 200)
    }
  }, [currentIndex])

  // ── Actions ──────────────────────────────────────────────
  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setScores({})
    setStreak(0)
    setMaxStreak(0)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setScores({})
    setStreak(0)
    setMaxStreak(0)
    setPhase('studying')
    setShowConfetti(false)
  }

  const handleScore = (type) => {
    setScores(prev => ({ ...prev, [currentIndex]: type }))

    if (type === 'know') {
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > maxStreak) setMaxStreak(newStreak)
    } else {
      setStreak(0)
    }

    if (currentIndex < total - 1) {
      setSlideDirection('left')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setSlideDirection(null)
      }, 250)
    } else {
      setTimeout(() => {
        setShowConfetti(true)
        setPhase('results')
      }, 400)
    }
  }

  // ── Card Editing ─────────────────────────────────────────
  const handleSaveEdit = (updatedCard) => {
    setCards(prev => prev.map((c, i) => i === editingCard ? { ...c, ...updatedCard, edited: true } : c))
    setEditingCard(null)
  }

  const handleAddCard = (newCard) => {
    setCards(prev => [...prev, { ...newCard, isNew: true }])
    setShowAddModal(false)
  }

  const handleDeleteCard = (index) => {
    if (total <= 1) return
    const newCards = cards.filter((_, i) => i !== index)
    setCards(newCards)
    // Adjust scores
    const newScores = {}
    Object.entries(scores).forEach(([k, v]) => {
      const ki = parseInt(k)
      if (ki < index) newScores[ki] = v
      else if (ki > index) newScores[ki - 1] = v
    })
    setScores(newScores)
    // Adjust current index
    if (currentIndex >= newCards.length) setCurrentIndex(Math.max(0, newCards.length - 1))
    else if (currentIndex > index) setCurrentIndex(i => i - 1)
    setDeleteConfirm(null)
  }

  // ── SETUP PHASE ──────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <>
        <CountSelector
          onSelect={handleCountSelect}
          onClose={onClose}
          isLoading={isLoading}
        />
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-2xl text-sm font-medium shadow-lg animate-fc-slide-up">
            {error}
          </div>
        )}
      </>
    )
  }

  // ── RESULTS PHASE ────────────────────────────────────────
  if (phase === 'results') {
    const finalKnown = Object.values(scores).filter(v => v === 'know').length
    const pct = Math.round((finalKnown / total) * 100)
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : pct >= 40 ? '💪' : '📚'

    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
        {showConfetti && <Confetti />}
        <div className="w-full max-w-md text-center space-y-6 animate-fc-scale-in">
          {/* Trophy */}
          <div className="relative inline-block">
            <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 shadow-lg shadow-violet-500/10">
              <span className="text-5xl">{emoji}</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              {pct}%
            </div>
          </div>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Study Complete!
          </h2>

          <div className="space-y-3">
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">{finalKnown}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Known</div>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{total - finalKnown}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Review</div>
              </div>
              <div className="h-12 w-px bg-border/50" />
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">{maxStreak}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Streak</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={handleReset} className="gap-2 rounded-xl hover:scale-105 transition-transform">
              <RotateCcw className="h-4 w-4" /> Try Again
            </Button>
            <Button variant="outline" onClick={handleShuffle} className="gap-2 rounded-xl hover:scale-105 transition-transform">
              <Shuffle className="h-4 w-4" /> Shuffle
            </Button>
            <Button variant="outline" onClick={() => { setPhase('setup'); setShowConfetti(false) }} className="gap-2 rounded-xl hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" /> New Set
            </Button>
            <Button onClick={onClose} className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 hover:scale-105 transition-transform">
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── STUDYING PHASE ───────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-4">
          {/* Progress Ring + Counter */}
          <div className="relative">
            <ProgressRing progress={progress} size={44} strokeWidth={3} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold">{currentIndex + 1}</span>
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-400" />
              Flashcards
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {currentIndex + 1} of {total} · {answeredCount} answered
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Streak Badge */}
          {streak >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-fc-scale-in">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-400">{streak}🔥</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs h-8 rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShuffle} className="gap-1.5 text-xs h-8 rounded-xl">
            <Shuffle className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-xs h-8 rounded-xl">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Gradient Progress Bar ─────────────────────────── */}
      <div className="w-full h-1 bg-muted/20">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Card Area ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Card with 3D Spring Flip */}
          <div
            className={cn(
              "relative cursor-pointer transition-all duration-300",
              slideDirection === 'left' && "animate-fc-slide-left",
              slideDirection === 'right' && "animate-fc-slide-right"
            )}
            style={{ perspective: '1200px', height: '340px' }}
            onClick={() => setIsFlipped(f => !f)}
          >
            <div
              className="absolute inset-0 transition-transform duration-[600ms]"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Front (Question) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl border-2 bg-gradient-to-br shadow-2xl flex flex-col items-center justify-center p-8 text-center",
                  CARD_GRADIENTS[gradientIdx],
                  BORDER_COLORS[gradientIdx],
                  "backdrop-blur-sm"
                )}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Card actions */}
                <div className="absolute top-3 right-3 flex gap-1" onClick={e => e.stopPropagation()}>
                  {current?.edited && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 mr-1">edited</span>
                  )}
                  {current?.isNew && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mr-1">custom</span>
                  )}
                  <button
                    onClick={() => setEditingCard(currentIndex)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="Edit card"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                  {total > 1 && (
                    <button
                      onClick={() => setDeleteConfirm(currentIndex)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-400" />
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/70 mb-5">
                  Question {currentIndex + 1}
                </span>
                <p className="text-xl font-semibold leading-relaxed max-h-[180px] overflow-y-auto">{current?.question}</p>
                <span className="text-[11px] text-muted-foreground/60 mt-6 flex items-center gap-1.5">
                  <span className="inline-block h-1 w-1 rounded-full bg-violet-400/50 animate-pulse" />
                  Click or press Space to flip
                </span>
              </div>

              {/* Back (Answer) */}
              <div
                className={cn(
                  "absolute inset-0 rounded-3xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-teal-500/5 to-cyan-500/8 shadow-2xl flex flex-col items-center justify-center p-8 text-center",
                  "backdrop-blur-sm"
                )}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {/* Card actions (back) */}
                <div className="absolute top-3 right-3 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingCard(currentIndex)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="Edit card"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/70 mb-5">Answer</span>
                <p className="text-lg leading-relaxed max-h-[200px] overflow-y-auto">{current?.answer}</p>
              </div>
            </div>
          </div>

          {/* Score indicator for current card */}
          {scores[currentIndex] && (
            <div className={cn(
              "text-center mt-3 text-xs font-semibold animate-fc-scale-in",
              scores[currentIndex] === 'know' ? 'text-emerald-400' : 'text-red-400'
            )}>
              {scores[currentIndex] === 'know' ? '✓ Known' : '✗ Review needed'}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Controls ───────────────────────────────── */}
      <div className="px-6 pb-6 pt-2">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Know / Don't Know */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2 rounded-2xl border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 active:scale-95"
              onClick={() => handleScore('dontknow')}
            >
              <XIcon className="h-4 w-4" /> Don't Know
            </Button>
            <Button
              className="flex-1 h-12 gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95"
              onClick={() => handleScore('know')}
            >
              <Check className="h-4 w-4" /> Know It
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl hover:scale-105 transition-transform"
              onClick={goToPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-1 max-w-[200px] flex-wrap justify-center">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setIsFlipped(false); setCurrentIndex(i) }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 hover:scale-110",
                    i === currentIndex ? "w-6 bg-gradient-to-r from-violet-500 to-fuchsia-500" : "w-2",
                    i !== currentIndex && scores[i] === 'know' && "bg-emerald-500",
                    i !== currentIndex && scores[i] === 'dontknow' && "bg-red-400",
                    i !== currentIndex && !scores[i] && "bg-muted-foreground/20"
                  )}
                  title={`Card ${i + 1}`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-xl hover:scale-105 transition-transform"
              onClick={goToNext}
              disabled={currentIndex === total - 1}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Score summary + keyboard hints */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground/70">
            <span>
              Score: <span className="font-semibold text-emerald-400">{knownCount}</span> / {answeredCount}
              {answeredCount > 0 && (
                <span className="ml-1">({Math.round((knownCount / answeredCount) * 100)}%)</span>
              )}
            </span>
            <span className="hidden md:inline opacity-50">
              ← → Navigate · Space Flip · Esc Close
            </span>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────── */}
      {editingCard !== null && (
        <EditCardModal
          card={cards[editingCard]}
          onSave={handleSaveEdit}
          onCancel={() => setEditingCard(null)}
        />
      )}

      {showAddModal && (
        <AddCardModal
          onAdd={handleAddCard}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card border border-border/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-fc-scale-in" onClick={e => e.stopPropagation()}>
            <Trash2 className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">Delete Card?</h3>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl">Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteCard(deleteConfirm)} className="flex-1 rounded-xl">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
