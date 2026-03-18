import {
  FileText,
  MessageSquare,
  BookOpen,
  Brain,
  ClipboardList,
  History,
  Upload,
  HelpCircle,
  GraduationCap,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Zap,
  Shield,
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Ask any question about your PDF and get instant, accurate answers with source citations.',
    color: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-400',
  },
  {
    icon: BookOpen,
    title: 'Smart Summaries',
    description: 'Generate bullet-point, short, or detailed summaries of your entire document in seconds.',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'AI Flashcards',
    description: 'Auto-generate flashcards from your PDF for efficient studying and memorisation.',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: ClipboardList,
    title: 'Interactive Quizzes',
    description: 'Test your understanding with AI-generated multiple-choice quizzes at any difficulty.',
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: FileText,
    title: 'PDF Viewer',
    description: 'View your PDF side-by-side with the chat, with page-jump links from AI answers.',
    color: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: History,
    title: 'Session History',
    description: 'All your conversations are saved. Pick up exactly where you left off, anytime.',
    color: 'from-indigo-500/20 to-violet-500/20',
    iconColor: 'text-indigo-400',
  },
]

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Upload Your PDF',
    description: 'Drag-and-drop or browse to upload any PDF document.',
  },
  {
    icon: HelpCircle,
    step: '02',
    title: 'Ask Questions',
    description: 'Chat with AI about the content — it reads the whole document for you.',
  },
  {
    icon: GraduationCap,
    step: '03',
    title: 'Learn & Retain',
    description: 'Use summaries, flashcards, and quizzes to master the material.',
  },
]

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">PDF Chatbot</span>
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
      <section className="relative flex min-h-screen items-center justify-center pt-16 overflow-hidden">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[100px] animate-landing-float" />
          <div
            className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-violet-500/[0.06] blur-[100px] animate-landing-float"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-blue-500/[0.05] blur-[80px] animate-landing-float"
            style={{ animationDelay: '4s' }}
          />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm animate-landing-fade-up">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by AI &amp; RAG Technology
          </div>

          {/* Headline */}
          <h1
            className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl animate-landing-fade-up"
            style={{ animationDelay: '0.1s' }}
          >
            Chat With Your{' '}
            <span className="bg-gradient-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent">
              PDF Documents
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl animate-landing-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
            Upload any PDF and instantly ask questions, generate summaries, create flashcards,
            and take quizzes — all powered by cutting-edge AI.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-landing-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              onClick={() => onNavigate('register')}
              className="group flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-8 py-3.5 text-base font-medium backdrop-blur-sm hover:bg-card hover:border-border transition-all"
            >
              Sign In
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Trust indicators */}
          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground animate-landing-fade-up"
            style={{ animationDelay: '0.45s' }}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> Instant AI Answers
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Secure &amp; Private
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> No Credit Card Required
            </span>
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────── */}
      <section className="relative py-28 px-6">
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
                className="group relative rounded-2xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm hover:border-border/80 hover:bg-card/80 transition-all duration-300 animate-landing-fade-up"
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color}`}
                >
                  <f.icon className={`h-5 w-5 ${f.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="relative py-28 px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Three simple steps from upload to mastery.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="relative text-center animate-landing-fade-up"
                style={{ animationDelay: `${0.12 * i}s` }}
              >
                {/* Connector line (only between cards) */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-12 left-[60%] w-[80%] border-t border-dashed border-border/50" />
                )}
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl border border-border/40 bg-card/60 backdrop-blur-sm">
                  <s.icon className="h-10 w-10 text-primary" />
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

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="relative py-28 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-border/40 bg-card/50 p-12 backdrop-blur-sm">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to Get Started?
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground mb-8">
              Join and start chatting with your PDFs today. No credit card required.
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-10 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 transition-all"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>PDF Chatbot</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PDF Chatbot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
