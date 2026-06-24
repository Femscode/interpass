"""
🎓 FASTAPI APPLICATION — main.py

FastAPI is a modern Python web framework with:
  - Automatic request/response validation via Pydantic models
  - Auto-generated API docs at /docs (Swagger UI) — visit it after starting!
  - Async support with Python's async/await
  - Type hints everywhere — no guessing what a function expects

Our API has two core endpoints:

  POST /interview/start
    → Creates a new LangGraph thread for a session
    → Runs the graph until the first interrupt (first question ready)
    → Returns the opening question

  POST /interview/respond
    → Resumes the graph with the user's answer
    → Runs until the next interrupt (next question) or END (feedback)
    → Returns the next question or the final feedback

This is the "Human-in-the-Loop" pattern:
  start → [AI asks] → interrupt → [user answers] → resume → [AI asks] → interrupt → ...
"""

import os
import json
import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
from langchain_core.messages import AIMessage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("interpass_backend")

# Load .env file BEFORE importing anything that uses env vars
load_dotenv()

from graph.interview_graph import interview_graph
from db.sqlite_store import get_session, update_session_status, save_message, get_messages, init_db


# Lifespan context manager for startup/shutdown tasks
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database schema
    logger.info("Initializing database on startup...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.exception("Failed to initialize database schema")
    yield
    # Shutdown (nothing to clean up here)
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic request/response models
# These define what JSON shape the API accepts and returns.
# FastAPI validates incoming requests against these — wrong shape = 422 error.
# ─────────────────────────────────────────────────────────────────────────────

class StartInterviewRequest(BaseModel):
    session_id: str
    max_questions: int = 5   # default to 5 questions if not specified


class RespondRequest(BaseModel):
    session_id: str
    answer: str


class InterviewResponse(BaseModel):
    session_id: str
    message: str           # The AI's question or feedback text
    is_complete: bool
    question_number: int | None = None
    total_questions: int | None = None


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="InterPass API",
    description="AI-powered interview simulation backend powered by LangGraph",
    version="1.0.0",
    lifespan=lifespan,
)

# Global exception handler for any unexpected/uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all uncaught exceptions, logs the full stack trace to the server logs,
    and returns a structured 500 error response.
    """
    logger.exception("Unhandled error processing request to %s: %s", request.url.path, str(exc))
    
    # Check if debug mode is active to decide if traceback is returned in the response
    is_debug = os.getenv("DEBUG", "false").lower() == "true"
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal Server Error: {type(exc).__name__} - {str(exc)}",
            "error_type": type(exc).__name__,
            "message": str(exc),
            "traceback": traceback.format_exc() if is_debug else None
        }
    )

# Exception handler for HTTPException to log API warnings
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Catches all raised HTTPExceptions, logs details as a warning, and returns standard response.
    """
    logger.warning("HTTPException at %s: status_code=%d, detail=%s", request.url.path, exc.status_code, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# CORS — allows our Next.js frontend (localhost:3001) to call this API
# Without this, the browser blocks cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3001"),
        "http://localhost:3000",  # fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_last_ai_message(graph_state: dict) -> str:
    """
    After running the graph, pull out the most recent AI message.
    The graph state contains a 'messages' list of LangChain message objects.
    """
    messages = graph_state.get("messages", [])
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            return msg.content
    return ""


def _run_graph_until_interrupt(config: dict, input_data: dict | None = None) -> dict:
    """
    Runs the graph forward, collecting all events until it either:
      a) Hits an interrupt() call → pauses and returns current state
      b) Reaches END → returns final state

    We use .stream() instead of .invoke() so we can detect interrupt events.
    Each event in the stream is a dict describing what just happened.

    Returns the final graph state after the run.
    """
    events = []

    # stream() yields one event dict per node execution
    stream = interview_graph.stream(
        input_data,
        config=config,
        stream_mode="values",   # "values" = yield full state after each node
    )

    for state_snapshot in stream:
        events.append(state_snapshot)

    # The last event is the state right before the interrupt or at END
    return events[-1] if events else {}


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 1: Start interview
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/interview/start", response_model=InterviewResponse)
async def start_interview(request: StartInterviewRequest):
    """
    Initialises a new interview session and returns the first question.

    Flow:
      1. Load session config from SQLite (created by Next.js /api/sessions)
      2. Build the initial LangGraph state from session data
      3. Run the graph → it executes initialize_interview → hits interrupt at await_answer
      4. Return the AI's opening message
    """
    logger.info("Starting interview session %s", request.session_id)
    
    # Load session from the shared SQLite DB
    try:
        session = get_session(request.session_id)
    except Exception as e:
        logger.exception("Failed to load session %s from SQLite database", request.session_id)
        raise HTTPException(
            status_code=500,
            detail=f"Database error while loading session: {str(e)}"
        )

    if not session:
        logger.warning("Session %s not found in SQLite database", request.session_id)
        raise HTTPException(status_code=404, detail=f"Session {request.session_id} not found")

    # The thread_id is how LangGraph's checkpointer identifies THIS session's state.
    # Using the session_id as thread_id means each interview is independent.
    config = {"configurable": {"thread_id": request.session_id}}

    # Read from DB if present, otherwise fallback to request
    db_max_questions = session.get("max_questions") or request.max_questions

    # Build the initial state — this is what LangGraph receives as input
    initial_state = {
        "messages": [],
        "session_id": request.session_id,
        "company": session["company"],
        "role": session["role"],
        "level": session["level"],
        "interview_type": session["interview_type"],
        "question_count": 0,
        "max_questions": db_max_questions,
        "current_question": "",
        "last_answer": "",
        "is_complete": False,
        "feedback": "",
    }

    try:
        # Run graph until first interrupt (after initialize_interview generates the opening)
        logger.info("Executing LangGraph initial run for session %s", request.session_id)
        final_state = _run_graph_until_interrupt(config, initial_state)

        opening_message = final_state.get("current_question", "")
        if not opening_message:
            opening_message = _extract_last_ai_message(final_state)

        # Save to SQLite and update status
        update_session_status(request.session_id, "active")
        save_message(request.session_id, "assistant", opening_message)
        
        logger.info("Successfully started interview session %s", request.session_id)

        return InterviewResponse(
            session_id=request.session_id,
            message=opening_message,
            is_complete=False,
            question_number=1,
            total_questions=db_max_questions,
        )

    except Exception as e:
        logger.exception("Graph run failed during initialize_interview for session %s", request.session_id)
        raise HTTPException(status_code=500, detail=f"Graph error during initialization: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINT 2: Submit an answer
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/interview/respond", response_model=InterviewResponse)
async def respond_to_interview(request: RespondRequest):
    """
    Resumes the graph with the user's answer and returns the next question (or feedback).

    Flow:
      1. Load the current graph state via the checkpointer (it was saved at the interrupt)
      2. Inject the user's answer via update_state()
      3. Resume the graph → process_answer runs → conditional edge decides
      4. If "continue": graph hits interrupt again at await_answer → return next question
      5. If "end": graph runs generate_feedback → reaches END → return feedback
    """
    logger.info("Processing user response for session %s", request.session_id)
    config = {"configurable": {"thread_id": request.session_id}}

    try:
        # Check current graph state from checkpointer
        current_state = interview_graph.get_state(config)
    except Exception as e:
        logger.exception("Failed to check state checkpointer for session %s", request.session_id)
        raise HTTPException(
            status_code=500,
            detail=f"Checkpointer error: {str(e)}"
        )

    if not current_state or not current_state.values:
        logger.warning("Active session %s state not found in checkpointer", request.session_id)
        raise HTTPException(
            status_code=400,
            detail="No active interview session found. Did you call /interview/start first?"
        )

    # Save user's answer to SQLite transcript
    try:
        save_message(request.session_id, "user", request.answer)
    except Exception as e:
        logger.exception("Failed to save user message to database for session %s", request.session_id)
        raise HTTPException(
            status_code=500,
            detail=f"Database error while saving message: {str(e)}"
        )

    try:
        # 🎓 THIS IS THE KEY STEP: resume the interrupted graph
        # update_state() injects data at the interrupt point.
        # The `as_node` parameter tells LangGraph which node is "responding" —
        # this determines where execution resumes from.
        logger.info("Resuming LangGraph execution for session %s", request.session_id)
        interview_graph.update_state(
            config,
            {"last_answer": request.answer},
            as_node="await_answer",
        )

        # Now resume the graph — it will run process_answer, then either:
        #   - Hit interrupt at await_answer again (more questions)
        #   - Run generate_feedback and reach END
        final_state = _run_graph_until_interrupt(config, None)

        is_complete = final_state.get("is_complete", False)
        question_count = final_state.get("question_count", 0)
        max_questions = final_state.get("max_questions", 5)

        if is_complete:
            # Interview finished — return feedback
            ai_message = _extract_last_ai_message(final_state)
            save_message(request.session_id, "assistant", ai_message)
            update_session_status(request.session_id, "completed")
            
            logger.info("Interview session %s completed. Returning feedback.", request.session_id)

            return InterviewResponse(
                session_id=request.session_id,
                message=ai_message,
                is_complete=True,
            )
        else:
            # Next question ready
            next_question = final_state.get("current_question", "")
            if not next_question:
                next_question = _extract_last_ai_message(final_state)

            save_message(request.session_id, "assistant", next_question)
            
            logger.info("Interview session %s continued. Returning question %d/%d.", 
                        request.session_id, question_count, max_questions)

            return InterviewResponse(
                session_id=request.session_id,
                message=next_question,
                is_complete=False,
                question_number=question_count,
                total_questions=max_questions,
            )

    except Exception as e:
        logger.exception("Graph run failed during resume for session %s", request.session_id)
        raise HTTPException(status_code=500, detail=f"Graph error during execution: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/interview/{session_id}/messages")
async def get_interview_messages(session_id: str):
    """Returns the full message transcript for a session."""
    messages = get_messages(session_id)
    return {"session_id": session_id, "messages": messages}


@app.get("/health")
async def health_check():
    """Simple health check — visit this to confirm the server is running."""
    return {"status": "ok", "service": "InterPass API"}


# ─────────────────────────────────────────────────────────────────────────────
# Entry point — run with: uv run main.py
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    print(f"""
╔══════════════════════════════════════════════════════╗
║              InterPass API starting...               ║
╠══════════════════════════════════════════════════════╣
║  API:      http://localhost:{port}                    ║
║  Docs:     http://localhost:{port}/docs               ║
║  Health:   http://localhost:{port}/health             ║
╚══════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,   # auto-reload on file changes during development
    )
