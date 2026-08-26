# ⚙️ Backend Stack — Detailed Breakdown

> The backend is a Python FastAPI application that handles PDF processing, user authentication, session management, and serves as the REST API for the frontend.

---

## Table of Contents

- [FastAPI](#-fastapi)
- [Uvicorn](#-uvicorn)
- [REST API Endpoints](#-rest-api-endpoints)
- [Authentication (PyJWT + bcrypt)](#-authentication-pyjwt--bcrypt)
- [Database (SQLite)](#-database-sqlite)
- [PDF Processing (PyPDF)](#-pdf-processing-pypdf)
- [Environment Management (python-dotenv)](#-environment-management-python-dotenv)
- [Module Architecture](#-module-architecture)

---

## 🚀 FastAPI

**Role**: Web framework for building the REST API

FastAPI is an async Python web framework that provides automatic request validation, OpenAPI docs, and dependency injection.

### Why FastAPI?

| Feature | Benefit in this project |
|---|---|
| **Async support** | Non-blocking PDF upload + LLM inference |
| **Pydantic models** | Auto-validates request/response schemas |
| **Dependency injection** | `Depends(get_current_user)` for auth on protected routes |
| **Auto-generated docs** | Swagger UI at `/docs` for testing endpoints |
| **CORS middleware** | Built-in cross-origin support |

### App setup (`api.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PDF Chatbot API",
    description="Upload a PDF and ask questions about its content using AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Request/Response Models

FastAPI uses **Pydantic** models for type-safe request validation and response serialization:

| Model | Purpose |
|---|---|
| `AskRequest` | Validates `{session_id, question}` on `/ask` |
| `AskResponse` | Returns `{session_id, question, answer, citations}` |
| `UploadResponse` | Returns `{session_id, message, filename}` |
| `SummaryResponse` | Returns `{session_id, summary}` |
| `FlashcardItem` / `FlashcardResponse` | Flashcard Q&A pairs |
| `QuizQuestion` / `QuizResponse` | Quiz MCQ with options + correct index |
| `AuthRequest` / `AuthResponse` | Login/register `{username, password}` → `{token, user}` |
| `SessionInfo` | Session metadata for listing |
| `Message` | Chat message with role, content, citations |

---

## 🏃 Uvicorn

**Role**: ASGI server that runs FastAPI

Uvicorn is an ultra-fast ASGI server built on `uvloop` and `httptools`.

### Running the backend

```powershell
uvicorn api:app --reload --port 8000
```

| Flag | Purpose |
|---|---|
| `api:app` | Module `api.py`, variable `app` (the FastAPI instance) |
| `--reload` | Auto-restart on file changes (development only) |
| `--port 8000` | Listen on port 8000 |

### Production considerations

For production, you would use:

```powershell
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 📡 REST API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Create a new user account |
| `POST` | `/auth/login` | ❌ | Login and receive JWT token |
| `GET` | `/auth/me` | ✅ | Verify token, get current user info |

### Core Functionality

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | ❌ | Health check — returns active session count |
| `POST` | `/upload` | ✅ | Upload PDF → process → return session ID |
| `POST` | `/ask` | ❌ | Ask a question (full response) |
| `POST` | `/ask_stream` | ❌ | Ask a question (SSE streaming response) |
| `GET` | `/summary/{session_id}` | ❌ | Generate document summary |
| `GET` | `/flashcards/{session_id}` | ❌ | Generate AI flashcards |
| `GET` | `/quiz/{session_id}` | ❌ | Generate multiple-choice quiz |

### Session Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/sessions` | ✅ | List all sessions for current user |
| `GET` | `/session/{id}/messages` | ❌ | Retrieve chat history for a session |
| `DELETE` | `/session/{id}` | ❌ | Delete session, messages, and PDF file |
| `GET` | `/pdf/{id}` | ❌ | Serve the uploaded PDF file |

### Upload Flow (Step by Step)

```
POST /upload (with PDF file)
    │
    ├── 1. Validate file is .pdf
    ├── 2. Generate UUID session_id
    ├── 3. Save PDF to data/pdfs/{session_id}.pdf
    ├── 4. Extract text (pdf_loader.py)
    ├── 5. Split into chunks (text_splitter.py)
    ├── 6. Create embeddings + FAISS index (embeddings.py)
    ├── 7. Initialize Groq LLM (llm.py)
    ├── 8. Build QA chain (qa_chain.py)
    ├── 9. Store chain in memory: sessions[id] = {chain, vectorstore, llm}
    ├── 10. Save metadata to SQLite (database.py)
    │
    └── Return: { session_id, filename, message }
```

### Streaming Response (SSE)

The `/ask_stream` endpoint uses **Server-Sent Events** for real-time responses:

```python
@app.post("/ask_stream")
async def ask_question_stream(request: AskRequest):
    async def event_generator():
        async for chunk in qa_chain.astream(question):
            if "context" in chunk:
                yield f"event: sources\ndata: {json.dumps(citations)}\n\n"
            if "answer" in chunk:
                yield f"event: token\ndata: {json.dumps(token)}\n\n"
        yield f"event: done\ndata: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Event types**:

| Event | Data | When |
|---|---|---|
| `sources` | JSON array of `{page, text}` citations | Once, after retrieval |
| `token` | JSON string (partial answer text) | Per token, during generation |
| `done` | `[DONE]` | After full answer is generated |
| `error` | JSON string (error message) | On failure |

---

## 🔐 Authentication (PyJWT + bcrypt)

**Role**: Secure user accounts with hashed passwords and stateless JWT tokens

### Password Hashing (bcrypt)

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
```

- **bcrypt** is a one-way hash with built-in salt — even identical passwords produce different hashes
- Cost factor is auto-managed by `gensalt()` (default rounds: 12)

### JWT Tokens (PyJWT)

```python
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72  # 3 days

def create_token(user_id, username):
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=72),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
```

### Auth Flow

```
Register/Login → Server creates JWT → Client stores in localStorage
                                            │
Every API request → Axios interceptor adds "Authorization: Bearer <token>"
                                            │
Protected endpoint → Depends(get_current_user) → Decode + validate JWT
                                            │
                                    ┌───────┴───────┐
                                    │ Valid          │ Invalid/Expired
                                    │ → Continue    │ → 401 Unauthorized
                                    └───────────────┘
```

### FastAPI Dependency Injection

Protected routes use `Depends(get_current_user)`:

```python
@app.post("/upload")
async def upload_pdf(file: UploadFile, current_user: dict = Depends(get_current_user)):
    # current_user = {"user_id": "...", "username": "..."}
    # Only executes if JWT is valid
```

---

## 🗃️ Database (SQLite)

**Role**: Persistent storage for users, sessions, and chat messages

### Why SQLite?

- **Zero configuration** — no separate database server needed
- **File-based** — single `data/chatbot.db` file
- **Perfect for single-user/small-team** use cases
- **WAL mode** enabled for better concurrent read performance

### Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    filename TEXT NOT NULL,
    created_at TEXT NOT NULL,
    pdf_path TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,          -- 'user' or 'ai'
    content TEXT NOT NULL,
    citations_json TEXT DEFAULT '[]',
    msg_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

### Key design decisions

| Decision | Rationale |
|---|---|
| **CASCADE deletes** | Deleting a session auto-deletes its messages |
| **WAL journal mode** | Allows concurrent reads while writing |
| **Foreign keys ON** | Enforces referential integrity |
| **JSON citations** | Stored as serialized JSON string in `citations_json` |
| **Auto-migration** | `init_db()` adds missing columns for backward compatibility |

### Database Operations (`database.py`)

| Function | Description |
|---|---|
| `init_db()` | Creates tables + indexes, runs migrations |
| `create_session()` | Insert new session row |
| `get_session()` | Fetch session by ID |
| `list_all_sessions(user_id)` | List sessions with message counts, filtered by user |
| `session_exists()` | Check if session ID exists |
| `delete_session_db()` | Delete session (cascades to messages) |
| `save_message()` | Insert a chat message with citations |
| `get_messages()` | Fetch ordered chat history for a session |
| `get_pdf_path()` | Get stored PDF file path for a session |
| `create_user()` | Register a new user |
| `get_user_by_username()` | Lookup user for login |
| `get_user_by_id()` | Lookup user by ID |

---

## 📄 PDF Processing (PyPDF)

**Role**: Extract text from uploaded PDF files

### How it works (`pdf_loader.py`)

```
PDF File → PyPDFLoader → Raw pages → clean_text() → Filtered documents
```

### Text cleaning pipeline

The `clean_text()` function fixes common PDF extraction artifacts:

| Step | What it fixes | Regex |
|---|---|---|
| 1 | Hyphenated word splits (`compre-\nhensive` → `comprehensive`) | `(\w+)-\s*\n\s*(\w+)` |
| 2 | Mid-paragraph line breaks → spaces | `(?<!\n)\n(?!\n)` |
| 3 | Multiple spaces → single space | `{2,}` |
| 4 | 3+ newlines → paragraph break | `\n{3,}` |
| 5 | Standalone page numbers | `\n\s*\d+\s*\n` |
| 6 | Leading/trailing whitespace | `.strip()` |

### Quality filtering

Pages with fewer than 50 characters after cleaning are discarded (likely blank pages, cover pages, etc.).

---

## 🌱 Environment Management (python-dotenv)

**Role**: Load secrets from `.env` file into `os.environ`

### `.env` file structure

```env
GROQ_API_KEY=gsk_your_api_key_here
JWT_SECRET=your-secret-key-here
```

### Usage

```python
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
jwt_secret = os.getenv("JWT_SECRET", "fallback-default-key")
```

### Security notes

- `.env` is listed in `.gitignore` — never committed to version control
- `JWT_SECRET` has a hardcoded fallback for development only

---

## 🏛️ Module Architecture

```
api.py ─────────────────────────── FastAPI app + all endpoints
  │
  ├── auth.py ──────────────────── JWT + bcrypt authentication
  │     └── Uses: pyjwt, bcrypt, python-dotenv
  │
  ├── database.py ──────────────── SQLite CRUD operations
  │     └── Uses: sqlite3 (stdlib), json
  │
  ├── pdf_loader.py ────────────── PDF text extraction + cleaning
  │     └── Uses: langchain PyPDFLoader, regex
  │
  ├── text_splitter.py ─────────── Document chunking
  │     └── Uses: langchain RecursiveCharacterTextSplitter
  │
  ├── embeddings.py ────────────── Vector store creation
  │     └── Uses: HuggingFace embeddings, FAISS
  │
  ├── llm.py ───────────────────── Groq LLM initialization
  │     └── Uses: langchain-groq, python-dotenv
  │
  └── qa_chain.py ──────────────── RAG chain construction
        └── Uses: langchain LCEL, RunnableParallel
```

### In-memory vs. persistent storage

| Data | Storage | Lifetime |
|---|---|---|
| QA chains, vectorstores, LLM instances | Python `dict` (in-memory) | Until server restarts |
| Session metadata, chat history, users | SQLite database | Permanent |
| Uploaded PDFs | File system (`data/pdfs/`) | Until session deleted |
