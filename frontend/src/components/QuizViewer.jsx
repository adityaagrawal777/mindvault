import { useState, useEffect } from 'react'
import { Button } from "./ui/button"
import { X, ChevronRight, RotateCcw, Trophy, CheckCircle2, XCircle, HelpCircle, Loader2, Sparkles, Zap, Target, Brain, BookOpen, GraduationCap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// ── Difficulty Config ────────────────────────────────────────
const DIFFICULTIES = [
  {
    key: 'easy',
    label: 'Easy',
    icon: BookOpen,
    description: 'Basic recall & definitions',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    shadow: 'shadow-emerald-500/20',
    emoji: '🌱',
  },
  {
    key: 'medium',
    label: 'Medium',
    icon: Brain,
    description: 'Understanding & connections',
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    shadow: 'shadow-amber-500/20',
    emoji: '⚡',
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: Target,
    description: 'Analysis & critical thinking',
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    shadow: 'shadow-red-500/20',
    emoji: '🔥',
  },
]

const QUESTION_COUNTS = [5, 10, 15]

// ── Confetti Effect ──────────────────────────────────────────
function QuizConfetti() {
  const colors = ['#f59e0b', '#f97316', '#ef4444', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899']
  return (
    <div className="fixed inset-0 pointer-events-none z-[70] overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
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

// ── Progress Ring ────────────────────────────────────────────
function QuizProgressRing({ progress, size = 48, strokeWidth = 3, color = '#f59e0b' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  )
}

// ── Setup Screen ─────────────────────────────────────────────
function QuizSetup({ onStart, onClose, isLoading, error }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')
  const [selectedCount, setSelectedCount] = useState(10)

  const activeDiff = DIFFICULTIES.find(d => d.key === selectedDifficulty)

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fc-scale-in">
        {/* Close */}
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 mb-5 shadow-lg shadow-amber-500/10 animate-fc-float">
            <GraduationCap className="h-10 w-10 text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            Quiz Mode
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">Test your knowledge of the document</p>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 text-center">Choose Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map(diff => {
              const Icon = diff.icon
              const isActive = selectedDifficulty === diff.key
              return (
                <button
                  key={diff.key}
                  onClick={() => setSelectedDifficulty(diff.key)}
                  className={cn(
                    "relative flex flex-col items-center justify-center py-5 px-3 rounded-2xl border-2 transition-all duration-300 group",
                    isActive
                      ? `${diff.border} ${diff.bg} shadow-lg ${diff.shadow} scale-105`
                      : "border-border/50 hover:border-border hover:bg-muted/30 hover:scale-[1.02]"
                  )}
                >
                  <span className="text-2xl mb-2">{diff.emoji}</span>
                  <Icon className={cn("h-5 w-5 mb-1.5 transition-colors", isActive ? diff.text : "text-muted-foreground group-hover:text-foreground")} />
                  <span className={cn("text-sm font-bold transition-colors", isActive ? diff.text : "text-foreground/80")}>{diff.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">{diff.description}</span>
                  {isActive && (
                    <div className={cn("absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center animate-fc-scale-in", `bg-${diff.color}-500`)}>
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question Count */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 text-center">Number of Questions</p>
          <div className="flex justify-center gap-3">
            {QUESTION_COUNTS.map(count => (
              <button
                key={count}
                onClick={() => setSelectedCount(count)}
                className={cn(
                  "h-14 w-14 rounded-2xl border-2 text-lg font-bold transition-all duration-300",
                  selectedCount === count
                    ? `${activeDiff.border} ${activeDiff.bg} ${activeDiff.text} shadow-lg ${activeDiff.shadow} scale-110`
                    : "border-border/50 text-foreground/60 hover:border-border hover:scale-105"
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(selectedDifficulty, selectedCount)}
          disabled={isLoading}
          className={cn(
            "w-full h-14 rounded-2xl text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
            `bg-gradient-to-r ${activeDiff.gradient} ${activeDiff.shadow} hover:shadow-xl`
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating {selectedCount} questions...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Start {activeDiff.label} Quiz
            </span>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="mt-4 text-center text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ── MAIN QuizViewer Component ────────────────────────────────
// ══════════════════════════════════════════════════════════════
export default function QuizViewer({ questions: initialQuestions, sessionId, onClose }) {
  const [phase, setPhase] = useState(initialQuestions ? 'quizzing' : 'setup')
  const [questions, setQuestions] = useState(initialQuestions || [])
  const [difficulty, setDifficulty] = useState('medium')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [slideAnim, setSlideAnim] = useState(null)
  const [optionAnim, setOptionAnim] = useState(false)

  const total = questions.length
  const current = questions[currentIndex]
  const correctCount = Object.entries(answers).filter(
    ([idx, ans]) => questions[parseInt(idx)]?.correct === ans
  ).length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const activeDiff = DIFFICULTIES.find(d => d.key === difficulty)

  const optionLabels = ['A', 'B', 'C', 'D']

  // ── Setup Handler ────────────────────────────────────────
  const handleStart = async (diff, count) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getQuiz(sessionId, diff, count)
      setQuestions(data.questions)
      setDifficulty(diff)
      setCurrentIndex(0)
      setSelectedOption(null)
      setIsAnswered(false)
      setAnswers({})
      setStreak(0)
      setMaxStreak(0)
      setPhase('quizzing')
    } catch (err) {
      console.error("Quiz generation failed", err)
      const detail = err?.response?.data?.detail || err.message || "Failed to generate quiz"
      setError(detail)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Keyboard ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'quizzing') return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (!isAnswered) {
        if (e.key === '1' || e.key === 'a') handleSelect(0)
        if (e.key === '2' || e.key === 'b') handleSelect(1)
        if (e.key === '3' || e.key === 'c') handleSelect(2)
        if (e.key === '4' || e.key === 'd') handleSelect(3)
      }
      if (isAnswered && (e.key === 'Enter' || e.key === 'ArrowRight')) handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, currentIndex, isAnswered, selectedOption])

  // ── Actions ──────────────────────────────────────────────
  const handleSelect = (optionIndex) => {
    if (isAnswered) return
    setSelectedOption(optionIndex)
    setIsAnswered(true)
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }))
    setOptionAnim(true)
    setTimeout(() => setOptionAnim(false), 600)

    // Streak
    const isCorrect = questions[currentIndex]?.correct === optionIndex
    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > maxStreak) setMaxStreak(newStreak)
    } else {
      setStreak(0)
    }
  }

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setSlideAnim('out')
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
        setSelectedOption(null)
        setIsAnswered(false)
        setSlideAnim('in')
        setTimeout(() => setSlideAnim(null), 300)
      }, 200)
    } else {
      setShowConfetti(true)
      setPhase('results')
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setAnswers({})
    setStreak(0)
    setMaxStreak(0)
    setShowConfetti(false)
    setPhase('quizzing')
  }

  // ── SETUP PHASE ──────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <QuizSetup
        onStart={handleStart}
        onClose={onClose}
        isLoading={isLoading}
        error={error}
      />
    )
  }

  // ── RESULTS PHASE ────────────────────────────────────────
  if (phase === 'results') {
    const pct = Math.round((correctCount / total) * 100)
    const grade = pct >= 90 ? { text: 'Outstanding!', emoji: '🏆', color: 'text-amber-400' }
      : pct >= 70 ? { text: 'Great Job!', emoji: '⭐', color: 'text-emerald-400' }
      : pct >= 50 ? { text: 'Good Effort!', emoji: '💪', color: 'text-blue-400' }
      : { text: 'Keep Studying!', emoji: '📚', color: 'text-violet-400' }

    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
        {showConfetti && pct >= 50 && <QuizConfetti />}
        <div className="w-full max-w-lg text-center space-y-6 animate-fc-scale-in">
          {/* Trophy */}
          <div className="relative inline-block">
            <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 shadow-lg shadow-amber-500/10">
              <span className="text-5xl">{grade.emoji}</span>
            </div>
            <div className={cn("absolute -top-2 -right-2 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg", `bg-gradient-to-r ${activeDiff.gradient}`)}>
              {activeDiff.label}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Quiz Complete!
            </h2>
            <p className={cn("text-lg font-semibold mt-1", grade.color)}>{grade.text}</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400">{pct}%</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
            </div>
            <div className="h-14 w-px bg-border/50" />
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400">{correctCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Correct</div>
            </div>
            <div className="h-14 w-px bg-border/50" />
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400">{total - correctCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wrong</div>
            </div>
            <div className="h-14 w-px bg-border/50" />
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-400">{maxStreak}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</div>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-1000", `bg-gradient-to-r ${activeDiff.gradient}`)}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Question Review */}
          <div className="text-left space-y-2 max-h-52 overflow-y-auto pr-1">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct
              return (
                <div key={i} className={cn(
                  "flex items-start gap-3 text-sm p-3 rounded-xl border transition-colors",
                  isCorrect ? "bg-emerald-500/5 border-emerald-500/15" : "bg-red-500/5 border-red-500/15"
                )}>
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold mt-0.5",
                    isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{q.question}</p>
                    {!isCorrect && (
                      <p className="text-[11px] text-emerald-400/80 mt-1">
                        ✓ {q.options[q.correct]}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={handleRestart} className="gap-2 rounded-xl hover:scale-105 transition-transform">
              <RotateCcw className="h-4 w-4" /> Retry
            </Button>
            <Button variant="outline" onClick={() => { setShowConfetti(false); setPhase('setup') }} className="gap-2 rounded-xl hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4" /> New Quiz
            </Button>
            <Button onClick={onClose} className={cn("gap-2 rounded-xl hover:scale-105 transition-transform", `bg-gradient-to-r ${activeDiff.gradient}`)}>
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZZING PHASE ───────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative">
            <QuizProgressRing progress={progress} size={44} strokeWidth={3} color={activeDiff.key === 'easy' ? '#10b981' : activeDiff.key === 'hard' ? '#ef4444' : '#f59e0b'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold">{currentIndex + 1}</span>
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <HelpCircle className={cn("h-4 w-4", activeDiff.text)} />
              Quiz Mode
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider", activeDiff.bg, activeDiff.text, activeDiff.border, "border")}>
                {activeDiff.label}
              </span>
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Question {currentIndex + 1} of {total} · {correctCount}/{Object.keys(answers).length} correct
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Streak */}
          {streak >= 2 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 animate-fc-scale-in">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-400">{streak}🔥</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Progress Bar ──────────────────────────────────── */}
      <div className="w-full h-1 bg-muted/20">
        <div
          className={cn("h-full transition-all duration-500 ease-out", `bg-gradient-to-r ${activeDiff.gradient}`)}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Question Area ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className={cn(
          "w-full max-w-2xl space-y-8",
          slideAnim === 'out' && "animate-fc-slide-left",
          slideAnim === 'in' && "animate-quiz-slide-in"
        )}>
          {/* Question Card */}
          <div className="text-center space-y-4">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
              activeDiff.bg, activeDiff.text, activeDiff.border, "border"
            )}>
              <HelpCircle className="h-3 w-3" />
              Question {currentIndex + 1}
            </span>
            <h3 className="text-xl md:text-2xl font-semibold leading-relaxed px-4">
              {current?.question}
            </h3>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {current?.options.map((option, i) => {
              const isSelected = selectedOption === i
              const isCorrect = current.correct === i
              const showCorrect = isAnswered && isCorrect
              const showWrong = isAnswered && isSelected && !isCorrect

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group",
                    !isAnswered && "hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.01] cursor-pointer active:scale-[0.99]",
                    !isAnswered && !isSelected && "border-border/40 bg-card/50 backdrop-blur-sm",
                    showCorrect && "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15 scale-[1.01]",
                    showWrong && "border-red-400 bg-red-400/10 shadow-lg shadow-red-500/15",
                    isAnswered && !showCorrect && !showWrong && "border-border/20 opacity-40",
                    optionAnim && showCorrect && "animate-quiz-correct",
                    optionAnim && showWrong && "animate-quiz-wrong",
                  )}
                >
                  {/* Option label */}
                  <span className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300",
                    !isAnswered && "bg-muted/50 group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-amber-500/20",
                    showCorrect && "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30",
                    showWrong && "bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md shadow-red-500/30",
                    isAnswered && !showCorrect && !showWrong && "bg-muted/30",
                  )}>
                    {optionLabels[i]}
                  </span>
                  <span className="text-sm md:text-base flex-1 font-medium">{option}</span>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
                  {showWrong && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Feedback + Next */}
          {isAnswered && (
            <div className="flex items-center justify-between pt-2 animate-fc-scale-in">
              <div className={cn(
                "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl",
                selectedOption === current.correct
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              )}>
                {selectedOption === current.correct ? (
                  <><CheckCircle2 className="h-4 w-4" /> Correct!</>
                ) : (
                  <><XCircle className="h-4 w-4" /> Answer: {current.options[current.correct]}</>
                )}
              </div>
              <Button
                onClick={handleNext}
                className={cn(
                  "gap-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95",
                  `bg-gradient-to-r ${activeDiff.gradient} ${activeDiff.shadow}`
                )}
              >
                {currentIndex < total - 1 ? (
                  <>Next <ArrowRight className="h-4 w-4" /></>
                ) : (
                  <>Results <Trophy className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Dot Progress ───────────────────────────── */}
      <div className="px-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-1.5 mb-2">
            {questions.map((_, i) => {
              const answered = answers[i] !== undefined
              const correct = answered && questions[i].correct === answers[i]
              return (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === currentIndex ? `w-8 bg-gradient-to-r ${activeDiff.gradient}` : "w-2",
                    i !== currentIndex && answered && correct && "bg-emerald-500",
                    i !== currentIndex && answered && !correct && "bg-red-400",
                    i !== currentIndex && !answered && "bg-muted-foreground/20",
                  )}
                />
              )
            })}
          </div>
          <div className="text-center text-[11px] text-muted-foreground/50 hidden md:block">
            1-4 or A-D to answer · Enter/→ for next · Esc to close
          </div>
        </div>
      </div>
    </div>
  )
}
