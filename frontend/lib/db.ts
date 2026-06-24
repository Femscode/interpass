/*
  🎓 STATELESS DATABASE LAYER WRAPPER — lib/db.ts

  This file acts as a wrapper around the FastAPI backend session and message endpoints.
  Since Vercel is serverless and read-only, all database read and write operations
  are forwarded to the FastAPI backend (via process.env.BACKEND_URL).
*/

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  company: string;
  role: string;
  level: string;
  interview_type: string;
  status: "pending" | "active" | "completed";
  created_at: number;
  updated_at: number;
  max_questions: number;
}

export interface Message {
  id: number;
  session_id: string;
  role: "assistant" | "user";
  content: string;
  created_at: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function createSession(data: {
  company: string;
  role: string;
  level: string;
  interviewType: string;
  maxQuestions?: number;
}): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: data.company,
      role: data.role,
      level: data.level,
      interview_type: data.interviewType,
      max_questions: data.maxQuestions ?? 5,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create session on backend");
  }

  const result = await res.json();
  return result.sessionId;
}

export async function getSession(id: string): Promise<Session | null> {
  const res = await fetch(`${BACKEND_URL}/sessions/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to fetch session ${id} from backend`);
  }
  return await res.json();
}

export async function getAllSessions(): Promise<Session[]> {
  const res = await fetch(`${BACKEND_URL}/sessions`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch sessions from backend");
  }
  const result = await res.json();
  return result.sessions;
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${BACKEND_URL}/interview/${sessionId}/messages`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to fetch messages for session ${sessionId}`);
  }
  const result = await res.json();
  return result.messages;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || `Failed to delete session ${sessionId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE STUBS
// ─────────────────────────────────────────────────────────────────────────────
export async function addMessage(data: {
  sessionId: string;
  role: "assistant" | "user";
  content: string;
}): Promise<void> {}

export async function completeSession(sessionId: string): Promise<void> {}
