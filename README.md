# 🧠 MindVault — PDF Chatbot

> An AI-powered document assistant that lets you upload PDFs and have intelligent conversations about their content using Retrieval-Augmented Generation (RAG).

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload** | Drag-and-drop PDF upload with automatic text extraction |
| 💬 **AI Chat** | Ask natural-language questions and get accurate, cited answers |
| 🔄 **Streaming Responses** | Real-time token-by-token answer streaming via SSE |
| 📝 **Document Summaries** | Generate bullet-point, detailed, or short summaries on demand |
| 🃏 **Flashcard Generator** | AI-generated study flashcards from document content |
| 🧪 **Quiz Mode** | Auto-generated multiple-choice quizzes (easy / medium / hard) |
| 📖 **In-App PDF Viewer** | View the uploaded PDF alongside the chat |
| 📚 **Session History** | Persistent chat history saved in SQLite — resume any session |
| 🔐 **User Authentication** | JWT-based login/register with bcrypt password hashing |
| 🌗 **Dark Mode UI** | Polished dark-themed interface with smooth animations |

---

## 🏗️ Architecture

The application follows a **3-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND — React + Vite (:5173)                    │
│  Components: ChatArea, Sidebar, AuthPage, FlashcardViewer,      │
│              QuizViewer, PdfViewer, LandingPage, Header          │
│  State: AuthContext, Axios interceptors, localStorage            │
└────────────────────────────┬────────────────────────────────────┘
                             │  /api/* proxy
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND — FastAPI + Python (:8000)                  │
│  Modules: api.py, auth.py, database.py, pdf_loader.py,          │
│           text_splitter.py, embeddings.py, llm.py, qa_chain.py   │
└───────┬──────────────┬──────────────┬───────────────────────────┘
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │  SQLite  │   │  FAISS   │   │  Groq    │
   │ Database │   │ Vectors  │   │  LLM API │
   └─────────┘   └──────────┘   └──────────┘
```

---

## 🛠️ Tech Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 7, TailwindCSS 4 | UI framework, build tool, styling |
| **UI Components** | Radix UI, Lucide React, Framer Motion | Accessible primitives, icons, animations |
| **API Client** | Axios, Fetch API (SSE) | HTTP requests, streaming responses |
| **Proxy** | Express 5, http-proxy-middleware | API gateway between frontend and backend |
| **Backend Framework** | FastAPI, Uvicorn | Python async web framework, ASGI server |
| **AI / LLM** | LangChain, Groq API (Compound) | RAG orchestration, LLM inference |
| **Embeddings** | HuggingFace sentence-transformers | Text → vector conversion |
| **Vector Store** | FAISS (faiss-cpu) | Similarity search on document embeddings |
| **PDF Processing** | PyPDF (via LangChain PyPDFLoader) | Text extraction from PDF files |
| **Database** | SQLite 3 | Persistent session, message, and user storage |
| **Authentication** | PyJWT, bcrypt | JWT tokens, password hashing |
| **Environment** | python-dotenv | Loads `.env` variables |

> 📖 **Detailed breakdowns** of each layer are available in the [`docs/`](docs/) directory — see links below.

---

## 📚 Detailed Documentation

| Document | Covers |
|---|---|
| [Frontend Stack](docs/FRONTEND.md) | React, Vite, TailwindCSS, Radix UI, Framer Motion, component architecture |
| [Backend Stack](docs/BACKEND.md) | FastAPI, Uvicorn, REST API endpoints, authentication, database layer |
| [AI & RAG Pipeline](docs/AI_RAG_PIPELINE.md) | LangChain, Groq LLM, embeddings, FAISS, text splitting, QA chain |

---

## 🚀 Setup & Running

### Prerequisites

- **Node.js** v18+
- **Python** v3.10+
- **Groq API Key** — get one free at [console.groq.com](https://console.groq.com)

### 1. Clone & Configure

```powershell
git clone https://github.com/adityaagrawal777/mindvault.git
cd mindvault
```

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_secret_key_here
```

### 2. Install Dependencies

**Backend (Python):**

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend (Node.js):**

```powershell
cd frontend
npm install
```

### 3. Run the Application

Open **two terminals**:

**Terminal 1 — Backend:**

```powershell
cd d:\pdf_chatbot
venv\Scripts\activate
uvicorn api:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```powershell
cd d:\pdf_chatbot\frontend
npm run dev
```

### 4. Open in Browser

Navigate to **[http://localhost:5173](http://localhost:5173)**

---

## 📁 Project Structure

```
pdf_chatbot/
├── api.py                  # FastAPI app — all REST endpoints
├── auth.py                 # JWT + bcrypt authentication
├── database.py             # SQLite operations (sessions, messages, users)
├── pdf_loader.py           # PDF text extraction + cleaning
├── text_splitter.py        # Document chunking (1500 chars, 300 overlap)
├── embeddings.py           # HuggingFace embeddings + FAISS vector store
├── llm.py                  # Groq LLM initialization
├── qa_chain.py             # LangChain LCEL RAG chain with MMR retrieval
├── main.py                 # CLI mode entry point
├── requirements.txt        # Python dependencies
├── .env                    # API keys (not committed)
├── data/
│   ├── chatbot.db          # SQLite database (auto-created)
│   └── pdfs/               # Uploaded PDF storage
├── frontend/
│   ├── server.js           # Express proxy server
│   ├── vite.config.js      # Vite config with proxy
│   ├── package.json        # Node.js dependencies
│   └── src/
│       ├── App.jsx         # Main app controller
│       ├── main.jsx        # React entry point
│       ├── index.css       # Global styles
│       ├── lib/
│       │   └── api.js      # API client (Axios + SSE streaming)
│       ├── contexts/
│       │   └── AuthContext.jsx  # Authentication state provider
│       └── components/
│           ├── ChatArea.jsx         # Chat interface with streaming
│           ├── Sidebar.jsx          # Session list + PDF upload
│           ├── AuthPage.jsx         # Login / Register page
│           ├── LandingPage.jsx      # Landing / hero page
│           ├── Header.jsx           # Top navigation bar
│           ├── PdfViewer.jsx        # In-app PDF viewer
│           ├── FlashcardViewer.jsx  # AI flashcard UI
│           ├── QuizViewer.jsx       # AI quiz UI
│           └── ui/                  # Radix-based UI primitives
└── docs/
    ├── FRONTEND.md          # Detailed frontend documentation
    ├── BACKEND.md           # Detailed backend documentation
    └── AI_RAG_PIPELINE.md   # Detailed AI/RAG documentation
```

---

## 📜 License

This project is for personal/educational use.
