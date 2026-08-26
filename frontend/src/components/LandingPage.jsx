import { useState, useEffect, useRef } from 'react'
import {
  FileText, MessageSquare, BookOpen, Brain, ClipboardList, History,
  Upload, HelpCircle, GraduationCap, ArrowRight, Sparkles, ChevronRight,
  Zap, Shield, BrainCircuit,
} from 'lucide-react'

const features = [
  { icon: MessageSquare, title: 'AI-Powered Chat', description: 'Ask any question about your PDF and get instant, accurate answers with source citations.', gradient: 'from-violet-500 to-purple-500', bgGradient: 'from-violet-500/20 to-purple-500/20' },
  { icon: BookOpen, title: 'Smart Summaries', description: 'Generate bullet-point, short, or detailed summaries of your entire document in seconds.', gradient: 'from-blue-500 to-cyan-500', bgGradient: 'from-blue-500/20 to-cyan-500/20' },
  { icon: Brain, title: 'AI Flashcards', description: 'Auto-generate flashcards from your PDF for efficient studying and memorisation.', gradient: 'from-emerald-500 to-teal-500', bgGradient: 'from-emerald-500/20 to-teal-500/20' },
  { icon: ClipboardList, title: 'Interactive Quizzes', description: 'Test your understanding with AI-generated multiple-choice quizzes at any difficulty.', gradient: 'from-amber-500 to-orange-500', bgGradient: 'from-amber-500/20 to-orange-500/20' },
  { icon: FileText, title: 'PDF Viewer', description: 'View your PDF side-by-side with the chat, with page-jump links from AI answers.', gradient: 'from-rose-500 to-pink-500', bgGradient: 'from-rose-500/20 to-pink-500/20' },
  { icon: History, title: 'Session History', description: 'All your conversations are saved. Pick up exactly where you left off, anytime.', gradient: 'from-indigo-500 to-blue-500', bgGradient: 'from-indigo-500/20 to-violet-500/20' },
]

const steps = [
  { icon: Upload, step: '01', title: 'Upload Your PDF', description: 'Drag-and-drop or browse to upload any PDF document.' },
  { icon: HelpCircle, step: '02', title: 'Ask Questions', description: 'Chat with AI about the content — it reads the whole document for you.' },
  { icon: GraduationCap, step: '03', title: 'Learn & Retain', description: 'Use summaries, flashcards, and quizzes to master the material.' },
]

export default function LandingPage({ onNavigate }) {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const [scrolled, setScrolled] = useState(false)
  const [visibleSections, setVisibleSections] = useState({})
  const [counters, setCounters] = useState({ pdfs: 0, qs: 0, acc: 0 })
  const featuresRef = useRef(null)
  const statsRef = useRef(null)
  const howRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    const handleMouse = (e) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouse)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    if (featuresRef.current) observer.observe(featuresRef.current)
    if (statsRef.current) observer.observe(statsRef.current)
    if (howRef.current) observer.observe(howRef.current)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouse)
      observer.disconnect()
    }
  }, [])

  // Animated counters
  useEffect(() => {
    if (visibleSections['stats']) {
      const interval = setInterval(() => {
        setCounters(prev => ({
          pdfs: Math.min(prev.pdfs + 50, 1000),
          qs: Math.min(prev.qs + 2000, 50000),
          acc: Math.min(prev.acc + 1, 99),
        }))
      }, 30)
      return () => clearInterval(interval)
    }
  }, [visibleSections])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes hero-gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .text-gradient-animated {
          background-size: 200% 200%;
          animation: hero-gradient-x 5s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes hero-float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-hero-float { animation: hero-float 6s ease-in-out infinite; }
        @keyframes hero-pulse-glow {
          0%, 100% { box-shadow: 0 0 20px hsl(var(--primary) / 0.3); }
          50% { box-shadow: 0 0 50px hsl(var(--primary) / 0.5), 0 0 80px hsl(280 70% 60% / 0.2); }
        }
        .animate-hero-pulse-glow { animation: hero-pulse-glow 3s infinite; }
        .glass-card {
          background: hsl(var(--card) / 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid hsl(var(--border) / 0.5);
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-lg' : 'bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">MindVault</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="rounded-xl px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center pt-16 overflow-hidden">
        {/* Animated dot background with parallax */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at center, hsl(var(--primary)) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            transform: `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * -30}px)`,
            transition: 'transform 0.15s ease-out',
          }}
        />

        {/* Gradient blobs with parallax */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/[0.08] blur-[120px]"
            style={{ transform: `translate(${(mousePos.x - 0.5) * 20}px, ${(mousePos.y - 0.5) * 20}px)` }}
          />
          <div
            className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/[0.08] blur-[120px]"
            style={{ transform: `translate(${(mousePos.x - 0.5) * -20}px, ${(mousePos.y - 0.5) * -20}px)` }}
          />
          <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-blue-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
          {/* Left — Text */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm animate-landing-fade-up">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by AI &amp; RAG Technology
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl animate-landing-fade-up" style={{ animationDelay: '0.1s' }}>
              Chat With Your{' '}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-blue-400 text-gradient-animated inline-block">
                PDF Documents
              </span>
            </h1>

            <p className="mx-auto lg:mx-0 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl animate-landing-fade-up" style={{ animationDelay: '0.2s' }}>
              Upload any PDF and instantly ask questions, generate summaries, create flashcards, and take quizzes — all powered by cutting-edge AI.
            </p>

            <div className="flex flex-col items-center lg:items-start gap-4 sm:flex-row animate-landing-fade-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => onNavigate('register')}
                className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all animate-hero-pulse-glow"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-8 py-3.5 text-base font-medium backdrop-blur-sm hover:bg-card hover:border-border transition-all"
              >
                Sign In
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground animate-landing-fade-up" style={{ animationDelay: '0.45s' }}>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Instant AI Answers</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-emerald-400" /> Secure &amp; Private</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet-400" /> No Credit Card Required</span>
            </div>
          </div>

          {/* Right — Floating 3D Mockup */}
          <div className="hidden lg:flex items-center justify-center">
            <div
              className="animate-hero-float w-full max-w-md"
              style={{
                transform: `perspective(1000px) rotateX(${(mousePos.y - 0.5) * -8}deg) rotateY(${(mousePos.x - 0.5) * 8}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
            >
              <div className="glass-card rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground ml-3 flex-1 text-center">Research_Paper.pdf</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border/50">
                      <span className="text-[10px] font-bold text-secondary-foreground">You</span>
                    </div>
                    <div className="bg-primary/10 rounded-2xl rounded-tl-sm p-3 text-sm text-foreground">
                      Can you summarize the main findings?
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-card rounded-2xl rounded-tl-sm p-3 text-sm border border-border/50">
                      <p className="mb-2 text-foreground">Based on the document, the main findings are:</p>
                      <ul className="space-y-1 text-muted-foreground text-xs list-disc list-inside">
                        <li>AI improves extraction speed by 400%</li>
                        <li>Accuracy increased to 99.2% in tests</li>
                        <li>Manual review time reduced by 75%</li>
                      </ul>
                      <div className="flex gap-1.5 mt-3 pt-2 border-t border-border/30">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">📄 Page 3</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">📄 Page 7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="relative py-28 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Master Your PDFs
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              A complete AI toolkit that transforms how you read, study, and learn from documents.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 ${visibleSections['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${0.08 * i}s` }}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.bgGradient} group-hover:shadow-lg transition-shadow duration-300`}>
                  <f.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="how-it-works" ref={howRef} className="relative py-28 px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Three simple steps from upload to mastery.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className={`relative text-center transition-all duration-700 ${visibleSections['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${0.15 * i}s` }}
              >
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] border-t border-dashed border-border/50" />
                )}
                <div className="mx-auto mb-5 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-28 w-28 rounded-full bg-primary/5 animate-pulse" />
                  </div>
                  <div className="relative flex h-24 w-24 mx-auto items-center justify-center rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm">
                    <s.icon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <span className="mb-2 inline-block text-xs font-bold tracking-widest text-primary/60 uppercase">
                  Step {s.step}
                </span>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Section ──────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="py-20 px-6 border-y border-border/30">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className={`transition-all duration-700 ${visibleSections['stats'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent mb-3">
                {counters.pdfs}{counters.pdfs === 1000 ? '+' : ''}
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">PDFs Analyzed</div>
            </div>
            <div className={`transition-all duration-700 delay-100 ${visibleSections['stats'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mb-3">
                {counters.qs >= 50000 ? '50K+' : counters.qs.toLocaleString()}
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Questions Answered</div>
            </div>
            <div className={`transition-all duration-700 delay-200 ${visibleSections['stats'] ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent mb-3">
                {counters.acc}%
              </div>
              <div className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-accent/[0.05]" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[120px] animate-hero-float pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-hero-float pointer-events-none" style={{ animationDelay: '3s' }} />

        <div className="mx-auto max-w-3xl text-center relative z-10">
          <div className="rounded-3xl border border-border/40 bg-card/50 p-12 backdrop-blur-sm">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to Get Started?
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground mb-8">
              Join and start chatting with your PDFs today. No credit card required.
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all animate-hero-pulse-glow"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-8" />
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">MindVault</span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} MindVault. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
