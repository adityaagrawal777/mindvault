import warnings
import os
import uuid
import shutil
import traceback
import json
import re
from datetime import datetime

# Suppress warnings for clean output
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pdf_loader import load_pdf
from text_splitter import split_documents
from embeddings import create_vector_store
from llm import load_llm
from qa_chain import create_qa_chain
import database as db
from auth import hash_password, verify_password, create_token, get_current_user

# ── App Setup ────────────────────────────────────────────────
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

# ── Initialize Database ─────────────────────────────────────
db.init_db()

# ── In-Memory Runtime Store (QA chains only) ────────────────
# Only holds runtime objects that can't be persisted (LLM chains).
# All metadata + messages are in SQLite via the database module.
sessions: dict = {}  # session_id -> { "chain": qa_chain }


# ── Request / Response Models ───────────────────────────────
class AskRequest(BaseModel):
    session_id: str
    question: str



class Message(BaseModel):
    role: str
    content: str
    id: str
    citations: list[dict] = []


class AskResponse(BaseModel):
    session_id: str
    question: str
    answer: str
    citations: list[dict] = []


class UploadResponse(BaseModel):
    session_id: str
    message: str
    filename: str


class SummaryResponse(BaseModel):
    session_id: str
    summary: str


class FlashcardItem(BaseModel):
    question: str
    answer: str


class FlashcardResponse(BaseModel):
    session_id: str
    flashcards: list[FlashcardItem]


class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct: int  # index of correct option (0-3)


class QuizResponse(BaseModel):
    session_id: str
    questions: list[QuizQuestion]


class SessionInfo(BaseModel):
    session_id: str
    filename: str
    created_at: str
    message_count: int = 0
    is_active: bool = False  # True when QA chain is loaded in memory


class AuthRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


# ── Auth Endpoints ────────────────────────────────────────

@app.post("/auth/register", response_model=AuthResponse)
def register(req: AuthRequest):
    """Register a new user."""
    if not req.username or len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if not req.password or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Check if username already exists
    existing = db.get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken.")

    user_id = str(uuid.uuid4())
    hashed = hash_password(req.password)
    user = db.create_user(user_id, req.username, hashed)
    token = create_token(user_id, req.username)

    return AuthResponse(token=token, user={"id": user["id"], "username": user["username"]})


@app.post("/auth/login", response_model=AuthResponse)
def login(req: AuthRequest):
    """Login with username and password."""
    user = db.get_user_by_username(req.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_token(user["id"], user["username"])
    return AuthResponse(token=token, user={"id": user["id"], "username": user["username"]})


@app.get("/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current logged-in user."""
    return current_user


# ── Endpoints ────────────────────────────────────────────
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "active_sessions": len(sessions)}


@app.get("/sessions", response_model=list[SessionInfo])
def list_sessions(current_user: dict = Depends(get_current_user)):
    """List all sessions for the current user (persisted in database)."""
    db_sessions = db.list_all_sessions(user_id=current_user["user_id"])
    return [
        SessionInfo(
            session_id=s["id"],
            filename=s["filename"],
            created_at=s["created_at"],
            message_count=s["message_count"],
            is_active=s["id"] in sessions,
        )
        for s in db_sessions
    ]


@app.get("/session/{session_id}/messages", response_model=list[Message])
def get_session_messages(session_id: str):
    """Get the chat history for a session (from database)."""
    if not db.session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")
    
    return db.get_messages(session_id)


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a PDF, process it, and return a session ID for Q&A."""

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Save uploaded file to persistent storage (data/pdfs/)
    session_id = str(uuid.uuid4())
    pdf_filename = f"{session_id}.pdf"
    pdf_path = os.path.join(db.PDF_DIR, pdf_filename)

    try:
        content = await file.read()
        with open(pdf_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    try:
        # Pipeline: load → split → embed → chain
        print(f"[UPLOAD] Loading PDF: {pdf_path}")
        docs = load_pdf(pdf_path)
        print(f"[UPLOAD] Loaded {len(docs)} pages, splitting...")
        chunks = split_documents(docs)
        print(f"[UPLOAD] Split into {len(chunks)} chunks, creating embeddings...")
        vectorstore = create_vector_store(chunks)
        print(f"[UPLOAD] Embeddings created, loading LLM...")
        llm = load_llm()
        print(f"[UPLOAD] LLM loaded, creating QA chain...")
        qa_chain = create_qa_chain(llm, vectorstore)
        print(f"[UPLOAD] QA chain created successfully!")

        # Store chain in memory (runtime only)
        sessions[session_id] = {"chain": qa_chain}

        # Persist session metadata to database
        db.create_session(session_id, file.filename, pdf_path, user_id=current_user["user_id"])

        return UploadResponse(
            session_id=session_id,
            message="PDF uploaded and processed successfully.",
            filename=file.filename,
        )
    except Exception as e:
        print(f"[UPLOAD ERROR] {e}")
        traceback.print_exc()
        # Clean up PDF file only on error
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")


@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    """Ask a question about a previously uploaded PDF."""

    if request.session_id not in sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found or inactive. Please upload a PDF first.",
        )

    qa_chain = sessions[request.session_id]["chain"]

    try:
        result = qa_chain.invoke(request.question)
        answer = result["answer"]
        context_docs = result["context"]

        # Extract unique citations
        seen_pages = set()
        citations = []
        for doc in context_docs:
            page = doc.metadata.get("page", 0) + 1  # Convert to 1-indexed
            if page not in seen_pages:
                seen_pages.add(page)
                citations.append({
                    "page": page,
                    "text": doc.page_content[:100] + "..." # Snippet
                })
        
        # Sort citations by page number
        citations.sort(key=lambda x: x["page"])

        # Save messages to database
        user_msg_id = str(int(datetime.now().timestamp() * 1000))
        ai_msg_id = str(int(datetime.now().timestamp() * 1000) + 1)
        db.save_message(request.session_id, "user", request.question, user_msg_id)
        db.save_message(request.session_id, "ai", answer, ai_msg_id, citations)

        return AskResponse(
            session_id=request.session_id,
            question=request.question,
            answer=answer,
            citations=citations,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {e}")


@app.post("/ask_stream")
async def ask_question_stream(request: AskRequest):
    """Stream the answer to a question using Server-Sent Events (SSE)."""

    if request.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found or inactive. Please upload a PDF to start chatting.")

    qa_chain = sessions[request.session_id]["chain"]

    async def event_generator():
        # 1. Yield sources event first
        # 2. Yield token events
        full_answer = ""
        citations = []
        
        try:
            # We use the chain's stream method
            # Because we used RunnableParallel, chunks will be dicts like:
            # {'context': [...], 'question': '...'} (early)
            # {'answer': '...'} (streaming)
            
            # Actually, standard LCEL stream might behave differently depending on the chain structure.
            # Our chain is: setup_and_retrieval.assign(answer=answer_chain)
            # The 'answer' key is the one that might stream if the LLM is streaming.
            
            # Let's inspect what comes out.
            # Usually, .stream() on a chain with parallel components yields the final dict progressively.
            # But the 'answer' key's value will be the one receiving tokens.
            
            # Simple approach: Invoke context retrieval first, then stream the answer generation.
            # But to keep the chain intact, let's just use .stream().
            
            # Wait, .stream() on a RunnableParallel creates a generator that yields updates.
            # Let's try to grab citations from the first chunk that has 'context'.
            
            async for chunk in qa_chain.astream(request.question):
                # Check for context (documents)
                if "context" in chunk and not citations:
                    print(f"[STREAM] Found context in chunk")
                    context_docs = chunk["context"]
                    seen_pages = set()
                    for doc in context_docs:
                        page = doc.metadata.get("page", 0) + 1
                        if page not in seen_pages:
                            seen_pages.add(page)
                            citations.append({
                                "page": page,
                                "text": doc.page_content[:100] + "..."
                            })
                    citations.sort(key=lambda x: x["page"])
                    
                    # Yield sources event
                    yield f"event: sources\ndata: {json.dumps(citations)}\n\n"

                # Check for answer tokens
                if "answer" in chunk:
                    token = chunk["answer"]
                    full_answer += token
                    # Yield token event (sanitize newlines)
                    clean_token = json.dumps(token)
                    yield f"event: token\ndata: {clean_token}\n\n"

            # Save to database
            print(f"[STREAM] Completed. Answer length: {len(full_answer)}")
            user_msg_id = str(int(datetime.now().timestamp() * 1000))
            ai_msg_id = str(int(datetime.now().timestamp() * 1000) + 1)
            db.save_message(request.session_id, "user", request.question, user_msg_id)
            db.save_message(request.session_id, "ai", full_answer, ai_msg_id, citations)
            
            yield f"event: done\ndata: [DONE]\n\n"
            
        except Exception as e:
            print(f"Streaming error: {e}")
            traceback.print_exc()
            yield f"event: error\ndata: {json.dumps(str(e))}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/summary/{session_id}", response_model=SummaryResponse)
async def get_summary(session_id: str, summary_type: str = "detailed"):
    """Get a summary of the uploaded PDF. 
    
    Query params:
        summary_type: 'bullets' | 'detailed' | 'short' (default: 'detailed')
    """

    if session_id not in sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a PDF first.",
        )

    # Choose prompt based on summary type
    prompts = {
        "bullets": (
            "Summarize this document as a concise list of bullet points. "
            "Each bullet should capture one key idea or fact. "
            "Use markdown bullet format (- item)."
        ),
        "detailed": (
            "Give a comprehensive, detailed summary of this document. "
            "Cover all major topics, arguments, and conclusions. "
            "Use well-structured paragraphs with markdown headings where appropriate."
        ),
        "short": (
            "Give a brief 2-3 sentence summary of this document. "
            "Capture only the most essential point and purpose of the document."
        ),
    }

    prompt = prompts.get(summary_type, prompts["detailed"])
    qa_chain = sessions[session_id]["chain"]

    try:
        result = qa_chain.invoke(prompt)
        # qa_chain now returns a dict {answer: ..., context: ...}
        summary = result["answer"]
        return SummaryResponse(session_id=session_id, summary=summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {e}")


@app.get("/flashcards/{session_id}", response_model=FlashcardResponse)
async def get_flashcards(session_id: str, count: int = 10):
    """Generate AI flashcards from the uploaded PDF.
    
    Query params:
        count: Number of flashcards to generate (default: 10, range: 1-30)
    """

    if session_id not in sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a PDF first.",
        )

    # Clamp count to reasonable range
    count = max(1, min(30, count))

    prompt = (
        f"Generate exactly {count} flashcards from this document for study purposes. "
        "Each flashcard should have a clear question and a concise answer. "
        "Focus on key concepts, definitions, important facts, and relationships. "
        "Return ONLY a valid JSON array with no extra text, in this exact format:\n"
        '[{"question": "What is X?", "answer": "X is..."}, ...]'
    )

    qa_chain = sessions[session_id]["chain"]

    try:
        result = qa_chain.invoke(prompt)
        raw = result["answer"]
        # Strip markdown code fences if present
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        flashcards = json.loads(cleaned)

        # Validate structure
        if not isinstance(flashcards, list):
            raise ValueError("Expected a JSON array")

        items = [
            FlashcardItem(question=fc["question"], answer=fc["answer"])
            for fc in flashcards
            if isinstance(fc, dict) and "question" in fc and "answer" in fc
        ]

        if not items:
            raise ValueError("No valid flashcards generated")

        return FlashcardResponse(session_id=session_id, flashcards=items)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse flashcards JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating flashcards: {e}")


@app.get("/quiz/{session_id}", response_model=QuizResponse)
async def get_quiz(session_id: str, difficulty: str = "medium", count: int = 10):
    """Generate a multiple-choice quiz from the uploaded PDF.
    
    Query params:
        difficulty: 'easy' | 'medium' | 'hard' (default: 'medium')
        count: Number of questions (default: 10, range: 5-20)
    """

    if session_id not in sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a PDF first.",
        )

    # Clamp count
    count = max(5, min(20, count))

    # Difficulty-specific instructions
    difficulty_instructions = {
        "easy": (
            "Make the questions straightforward and focus on basic recall of key facts, "
            "definitions, and simple concepts directly stated in the document. "
            "The wrong options should be clearly distinguishable from the correct answer."
        ),
        "medium": (
            "Make the questions test understanding and comprehension. "
            "Include questions that require connecting ideas from different parts of the document. "
            "The wrong options should be plausible but clearly incorrect upon careful reading."
        ),
        "hard": (
            "Make the questions challenging, requiring deep analysis, inference, and critical thinking. "
            "Include questions about implications, comparisons, and nuanced details. "
            "The wrong options should be very plausible and require careful reasoning to eliminate."
        ),
    }

    diff_instruction = difficulty_instructions.get(difficulty, difficulty_instructions["medium"])

    prompt = (
        f"Generate exactly {count} multiple-choice quiz questions from this document. "
        "Each question should have 4 options (A, B, C, D) with exactly one correct answer. "
        f"{diff_instruction} "
        "Return ONLY a valid JSON array with no extra text, in this exact format:\n"
        '[{"question": "What is...?", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": 0}]\n'
        "The 'correct' field is the zero-based index (0-3) of the correct option."
    )

    qa_chain = sessions[session_id]["chain"]

    try:
        result = qa_chain.invoke(prompt)
        raw = result["answer"]
        # Strip markdown code fences if present
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        questions = json.loads(cleaned)

        # Validate structure
        if not isinstance(questions, list):
            raise ValueError("Expected a JSON array")

        items = []
        for q in questions:
            if not isinstance(q, dict):
                continue
            if "question" not in q or "options" not in q or "correct" not in q:
                continue
            if not isinstance(q["options"], list) or len(q["options"]) != 4:
                continue
            correct_idx = int(q["correct"])
            if correct_idx < 0 or correct_idx > 3:
                correct_idx = 0
            items.append(QuizQuestion(
                question=q["question"],
                options=q["options"],
                correct=correct_idx,
            ))

        if not items:
            raise ValueError("No valid quiz questions generated")

        return QuizResponse(session_id=session_id, questions=items)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse quiz JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {e}")


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and free its resources."""

    if not db.session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found.")

    # Clean up the stored PDF file
    pdf_path = db.get_pdf_path(session_id)
    if pdf_path and os.path.exists(pdf_path):
        os.unlink(pdf_path)

    # Delete from database (cascades to messages)
    db.delete_session_db(session_id)

    # Remove from in-memory store if present
    sessions.pop(session_id, None)

    return {"message": "Session deleted successfully.", "session_id": session_id}


@app.get("/pdf/{session_id}")
async def get_pdf(session_id: str):
    """Serve the uploaded PDF file for viewing."""

    session = db.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    pdf_path = session.get("pdf_path")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found.")

    filename = session.get("filename", "document.pdf")
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=filename,
    )
