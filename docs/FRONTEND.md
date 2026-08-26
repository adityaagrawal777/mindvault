# 🎨 Frontend Stack — Detailed Breakdown

> The frontend is a single-page React application built with Vite, styled with TailwindCSS, and enhanced with Radix UI primitives and Framer Motion animations.

---

## Table of Contents

- [React 19](#-react-19)
- [Vite 7](#-vite-7)
- [TailwindCSS 4](#-tailwindcss-4)
- [Radix UI](#-radix-ui)
- [Framer Motion](#-framer-motion)
- [Lucide React](#-lucide-react)
- [Axios](#-axios)
- [react-pdf](#-react-pdf)
- [react-markdown](#-react-markdown)
- [Component Architecture](#-component-architecture)
- [State Management](#-state-management)
- [API Communication](#-api-communication)

---

## ⚛️ React 19

**Role**: Core UI framework

React is the foundation of the entire frontend. The project uses **React 19** with functional components and hooks exclusively — no class components.

### Key hooks used across the project

| Hook | Where Used | Purpose |
|---|---|---|
| `useState` | Every component | Local component state (messages, inputs, loading flags) |
| `useEffect` | `App.jsx`, `AuthContext.jsx` | Side effects (API calls on mount, token sync) |
| `useCallback` | `AuthContext.jsx` | Memoized auth functions (login, register, logout) |
| `useContext` | Everywhere via `useAuth()` | Access authentication state globally |
| `createContext` | `AuthContext.jsx` | Provide auth state to entire component tree |

### Why React 19?

- **Automatic batching** — multiple state updates in event handlers are batched into a single re-render
- **Improved Suspense** — better async UI patterns
- **Hooks-first API** — cleaner code with no class boilerplate

---

## ⚡ Vite 7

**Role**: Build tool and dev server

Vite replaces Webpack/CRA as the development toolchain. It provides near-instant hot module replacement (HMR) and fast production builds.

### Configuration (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",  // Import paths like @/components/ChatArea
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
```

### Key features used

| Feature | Purpose |
|---|---|
| **Dev proxy** | Routes `/api/*` requests to FastAPI backend at `:8000`, avoiding CORS issues |
| **Path aliases** | `@/` maps to `src/` for clean imports |
| **Plugin system** | `@vitejs/plugin-react` for JSX/Fast Refresh, `@tailwindcss/vite` for CSS |
| **HMR** | Instant UI updates without full page reload during development |

---

## 🎨 TailwindCSS 4

**Role**: Utility-first CSS framework

TailwindCSS powers all styling across the project. Version 4 introduces a Vite-native plugin (`@tailwindcss/vite`) that replaces the PostCSS approach.

### How it's integrated

1. **Vite plugin** — `@tailwindcss/vite` in `vite.config.js`
2. **Config file** — `tailwind.config.js` for theme customization
3. **Global CSS** — `index.css` (11KB) contains CSS custom properties, base styles, and component-level rules

### What it handles

- Dark mode color scheme (CSS variables for `--background`, `--foreground`, etc.)
- Responsive layouts
- Component-level utility classes (buttons, cards, inputs)
- Glassmorphism effects, gradients, and shadows

---

## 🧩 Radix UI

**Role**: Accessible, unstyled UI primitives

Radix provides the behavioral/accessibility layer for complex UI elements. The project uses these Radix packages:

| Package | Component | Used For |
|---|---|---|
| `@radix-ui/react-avatar` | `Avatar` | User avatar display in header |
| `@radix-ui/react-dialog` | `Dialog` | Modal dialogs |
| `@radix-ui/react-progress` | `Progress` | Upload progress bars, quiz progress |
| `@radix-ui/react-scroll-area` | `ScrollArea` | Scrollable chat area, sidebar session list |
| `@radix-ui/react-separator` | `Separator` | Visual dividers between sections |
| `@radix-ui/react-slot` | `Slot` | Polymorphic component composition in `Button` |

### Why Radix?

- **Accessible by default** — handles keyboard navigation, ARIA attributes, focus management
- **Unstyled** — styled with Tailwind, no design conflicts
- **Composable** — small, focused primitives that compose into complex UIs

### UI Primitives (`components/ui/`)

These are thin wrappers around Radix components with TailwindCSS styling applied:

| File | Wraps |
|---|---|
| `avatar.jsx` | `@radix-ui/react-avatar` |
| `button.jsx` | Native `<button>` with `class-variance-authority` variants |
| `input.jsx` | Native `<input>` with Tailwind styling |
| `progress.jsx` | `@radix-ui/react-progress` |
| `scroll-area.jsx` | `@radix-ui/react-scroll-area` |
| `separator.jsx` | `@radix-ui/react-separator` |
| `sheet.jsx` | `@radix-ui/react-dialog` (slide-out panel) |

---

## 🎬 Framer Motion

**Role**: Animation library

Framer Motion provides declarative animations throughout the UI.

### Where it's used

| Component | Animation |
|---|---|
| `ChatArea.jsx` | Message entrance animations (slide-in, fade), typing indicator |
| `LandingPage.jsx` | Hero section animations, staggered feature reveals |
| `FlashcardViewer.jsx` | Card flip animations, swipe transitions |
| `QuizViewer.jsx` | Question transitions, answer reveal animations |
| `Sidebar.jsx` | Session list item entrance animations |

### Example pattern

```jsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {messages.map(msg => (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {msg.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## 🎯 Lucide React

**Role**: Icon library

Lucide provides the icon set used across the entire UI. It's a fork of Feather Icons with a larger collection.

### Examples of icons used

- `Upload`, `FileText`, `Send` — Chat and file actions
- `Trash2`, `X`, `ChevronDown` — UI controls
- `Brain`, `Sparkles` — AI/feature branding
- `LogIn`, `LogOut`, `User` — Authentication

---

## 📡 Axios

**Role**: HTTP client for API communication

Axios handles all REST API calls to the backend. It's configured with interceptors for authentication.

### Interceptor setup (`lib/api.js`)

```javascript
// Request interceptor — auto-attach JWT token
axios.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

// Response interceptor — auto-logout on 401
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and reload
            localStorage.removeItem('auth_token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);
```

### Why Axios over Fetch?

- **Interceptors** — centralized auth header injection and error handling
- **Automatic JSON** — request/response bodies are auto-serialized
- **Better error handling** — rejects on non-2xx status codes

> **Note**: The streaming endpoint (`/ask_stream`) uses the native **Fetch API** instead of Axios because Axios doesn't support SSE/ReadableStream natively.

---

## 📄 react-pdf

**Role**: In-app PDF viewer

The `react-pdf` library renders uploaded PDF pages directly in the browser using PDF.js under the hood.

### Used in

- `PdfViewer.jsx` — Renders the uploaded PDF alongside the chat, with page navigation controls

---

## 📝 react-markdown

**Role**: Markdown rendering

AI responses often contain markdown formatting (headings, lists, code blocks, bold text). `react-markdown` parses and renders these into proper HTML.

### Used in

- `ChatArea.jsx` — Renders AI message content as formatted markdown instead of plain text

---

## 🏛️ Component Architecture

```
App.jsx (Main Controller)
├── AuthPage.jsx          # Shown when not logged in
├── LandingPage.jsx       # Shown when logged in, no active session
├── Header.jsx            # Always visible — user info, logout
├── Sidebar.jsx           # Left panel — upload, session list
│   └── Session items     # Click to resume, delete to remove
├── ChatArea.jsx          # Center — message list + input
│   ├── Message bubbles   # User (right) vs AI (left)
│   ├── Typing indicator  # Animated dots during streaming
│   └── Input bar         # Text input + send button
├── PdfViewer.jsx         # Right panel — PDF page viewer
├── FlashcardViewer.jsx   # Modal — AI flashcard study
└── QuizViewer.jsx        # Modal — AI quiz with scoring
```

### Data flow

```
User Action → Component Event Handler → api.js function → Backend
                                                              ↓
UI Update ← State Update ← Response Processing ← API Response
```

---

## 🗃️ State Management

The project uses **React Context + local state** (no Redux/Zustand):

### Global State (AuthContext)

| State | Type | Purpose |
|---|---|---|
| `user` | `object \| null` | Current logged-in user (`{id, username}`) |
| `token` | `string \| null` | JWT token, synced to `localStorage` |
| `loading` | `boolean` | True while verifying token on app load |

### Local State (App.jsx)

| State | Purpose |
|---|---|
| `sessionId` | Current active chat session |
| `messages` | Array of chat messages in current session |
| `file` | Currently uploaded PDF file info |
| `sessions` | List of all user sessions from backend |

---

## 🔌 API Communication

All API calls go through `lib/api.js`, which exports a single `api` object:

| Method | Endpoint | Description |
|---|---|---|
| `api.upload(file)` | `POST /upload` | Upload PDF, returns session ID |
| `api.ask(sessionId, question)` | `POST /ask` | Ask question, returns full answer |
| `api.askStream(sessionId, question, callbacks)` | `POST /ask_stream` | Stream answer via SSE |
| `api.getSummary(sessionId, type)` | `GET /summary/:id` | Generate document summary |
| `api.getSessions()` | `GET /sessions` | List all user sessions |
| `api.getMessages(sessionId)` | `GET /session/:id/messages` | Fetch chat history |
| `api.deleteSession(sessionId)` | `DELETE /session/:id` | Delete session + data |
| `api.getFlashcards(sessionId, count)` | `GET /flashcards/:id` | Generate AI flashcards |
| `api.getQuiz(sessionId, difficulty, count)` | `GET /quiz/:id` | Generate AI quiz |
| `api.login(username, password)` | `POST /auth/login` | User login |
| `api.register(username, password)` | `POST /auth/register` | User registration |
| `api.getMe()` | `GET /auth/me` | Verify current token |

### Streaming (SSE) Flow

```
Frontend                           Backend
   │                                  │
   │  POST /ask_stream {question}     │
   │────────────────────────────────>│
   │                                  │
   │  event: sources                  │  ← Citation data
   │<────────────────────────────────│
   │                                  │
   │  event: token "The"              │  ← Answer tokens
   │<────────────────────────────────│  ← (one by one)
   │  event: token " document"        │
   │<────────────────────────────────│
   │  event: token " says..."         │
   │<────────────────────────────────│
   │                                  │
   │  event: done                     │  ← Stream complete
   │<────────────────────────────────│
```
