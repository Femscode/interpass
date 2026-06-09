"""
🎓 PYTHON SQLite STORE — db/sqlite_store.py

Both Next.js (JavaScript) and FastAPI (Python) need to read/write sessions.
They share the SAME SQLite file on disk.

This is possible because SQLite supports concurrent readers, and since
our Next.js server only writes when creating a session (brief), while
FastAPI writes during the interview, there's no meaningful conflict.

🎓 In production with multiple server replicas, you'd use PostgreSQL
which has a proper network-accessible connection model.

We use Python's built-in `sqlite3` module — no extra installation needed.
"""

import sqlite3
import os
from pathlib import Path

# The SQLite file is one level up from the backend directory
# This is the SAME file that Next.js reads/writes
DB_PATH = Path(__file__).parent.parent.parent / "frontend" / "interpass.db"


def get_connection() -> sqlite3.Connection:
    """
    Opens a connection to the shared SQLite database.
    row_factory = sqlite3.Row lets us access columns by name (row["id"])
    instead of index (row[0]) — much more readable.
    """
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def get_session(session_id: str) -> dict | None:
    """Fetch a session by ID. Returns None if not found."""
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def update_session_status(session_id: str, status: str) -> None:
    """Update a session's status field."""
    import time
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?",
            (status, int(time.time() * 1000), session_id),
        )
        conn.commit()
    finally:
        conn.close()


def save_message(session_id: str, role: str, content: str) -> None:
    """
    Persist a single message to the messages table.
    Called after each AI question and each user answer so the
    full transcript is available for the feedback page.
    """
    import time
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (session_id, role, content, int(time.time() * 1000)),
        )
        conn.commit()
    finally:
        conn.close()


def get_messages(session_id: str) -> list[dict]:
    """Fetch all messages for a session, oldest first."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
