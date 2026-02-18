"""
SQLite database module for persistent session, message, and user storage.

Tables:
  - users: user accounts (id, username, password_hash, created_at)
  - sessions: session metadata (id, user_id, filename, created_at, pdf_path)
  - messages: chat history (id, session_id, role, content, citations, created_at)
"""

import sqlite3
import json
import os
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(DB_DIR, "chatbot.db")
PDF_DIR = os.path.join(DB_DIR, "pdfs")


def _get_conn() -> sqlite3.Connection:
    """Get a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent read performance
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize the database and create tables if they don't exist."""
    os.makedirs(DB_DIR, exist_ok=True)
    os.makedirs(PDF_DIR, exist_ok=True)

    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                filename TEXT NOT NULL,
                created_at TEXT NOT NULL,
                pdf_path TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations_json TEXT DEFAULT '[]',
                msg_id TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_messages_session
                ON messages(session_id);
        """)

        # Migration: add user_id column if missing (for existing databases)
        # Must run BEFORE creating index on user_id
        try:
            conn.execute("SELECT user_id FROM sessions LIMIT 1")
        except sqlite3.OperationalError:
            conn.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT")
            print("[DB] Migrated: added user_id column to sessions")

        # Create index on user_id (after migration ensures column exists)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")


        conn.commit()
    finally:
        conn.close()

    print(f"[DB] Database initialized at {DB_PATH}")


# ── Session Operations ──────────────────────────────────────


def create_session(session_id: str, filename: str, pdf_path: str, user_id: str = None) -> dict:
    """Insert a new session row."""
    created_at = datetime.now().isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO sessions (id, user_id, filename, created_at, pdf_path) VALUES (?, ?, ?, ?, ?)",
            (session_id, user_id, filename, created_at, pdf_path),
        )
        conn.commit()
    finally:
        conn.close()
    return {"id": session_id, "filename": filename, "created_at": created_at, "pdf_path": pdf_path}


def get_session(session_id: str) -> dict | None:
    """Get a session by ID. Returns None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        conn.close()


def list_all_sessions(user_id: str = None) -> list[dict]:
    """List sessions with message counts, optionally filtered by user_id."""
    conn = _get_conn()
    try:
        if user_id:
            rows = conn.execute("""
                SELECT s.id, s.filename, s.created_at, s.pdf_path,
                       COUNT(m.id) as message_count
                FROM sessions s
                LEFT JOIN messages m ON s.id = m.session_id
                WHERE s.user_id = ?
                GROUP BY s.id
                ORDER BY s.created_at DESC
            """, (user_id,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT s.id, s.filename, s.created_at, s.pdf_path,
                       COUNT(m.id) as message_count
                FROM sessions s
                LEFT JOIN messages m ON s.id = m.session_id
                GROUP BY s.id
                ORDER BY s.created_at DESC
            """).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def session_exists(session_id: str) -> bool:
    """Check if a session exists in the database."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT 1 FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return row is not None
    finally:
        conn.close()


def delete_session_db(session_id: str) -> bool:
    """Delete a session and its messages. Returns True if deleted."""
    conn = _get_conn()
    try:
        cursor = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ── Message Operations ──────────────────────────────────────


def save_message(session_id: str, role: str, content: str, msg_id: str, citations: list = None):
    """Save a chat message to the database."""
    citations_json = json.dumps(citations or [])
    created_at = datetime.now().isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, citations_json, msg_id, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (session_id, role, content, citations_json, msg_id, created_at),
        )
        conn.commit()
    finally:
        conn.close()


def get_messages(session_id: str) -> list[dict]:
    """Get all messages for a session, ordered by creation time."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT role, content, msg_id, citations_json FROM messages "
            "WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        ).fetchall()
        results = []
        for r in rows:
            msg = {
                "role": r["role"],
                "content": r["content"],
                "id": r["msg_id"] or "",
                "citations": json.loads(r["citations_json"]) if r["citations_json"] else [],
            }
            results.append(msg)
        return results
    finally:
        conn.close()


def get_pdf_path(session_id: str) -> str | None:
    """Get the PDF file path for a session."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT pdf_path FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return row["pdf_path"] if row else None
    finally:
        conn.close()


# ── User Operations ─────────────────────────────────────────


def create_user(user_id: str, username: str, password_hash: str) -> dict:
    """Insert a new user row."""
    created_at = datetime.now().isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (user_id, username, password_hash, created_at),
        )
        conn.commit()
    finally:
        conn.close()
    return {"id": user_id, "username": username, "created_at": created_at}


def get_user_by_username(username: str) -> dict | None:
    """Get a user by username. Returns None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> dict | None:
    """Get a user by ID. Returns None if not found."""
    conn = _get_conn()
    try:
        row = conn.execute("SELECT id, username, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
