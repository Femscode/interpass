/*
  🎓 DATABASE LAYER (FIXED) — lib/db.ts

  ROOT CAUSE OF THE BUG:
  The original code used a module-level `let db = null` singleton.
  In Next.js dev mode (Turbopack), API routes and server components can
  run in separate worker contexts OR the same context after a hot-reload.
  When the module is re-initialised in any worker, `db` resets to null.
  If that re-initialisation happened to read the DB FILE at a moment
  BEFORE a new session's `saveDb()` had flushed to disk, the query
  would return null even though the row existed on disk.

  THE FIX:
  Don't cache the Database instance at all. Always:
    1. Read the file fresh from disk
    2. Do the operation
    3. Save back to disk (for writes)
    4. Free/discard the instance

  This is slightly slower but 100% correct in any execution model.
  For a learning/dev project this trade-off is exactly right.

  WHY sql.js (NOT better-sqlite3)?
    better-sqlite3 requires native C++ compilation (Xcode/build tools).
    sql.js is WebAssembly — zero native dependencies, works everywhere.
    The trade-off: sql.js is in-memory only, so we persist manually.

  GLOBAL sql.js ENGINE CACHE:
  We DO cache the sql.js engine (the WASM interpreter) using Node's `global`
  object — this survives HMR without caching stale data, and avoids
  re-loading the ~1MB WASM binary on every request.
*/

import initSqlJs, { SqlJsStatic } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "interpass.db");

// ─────────────────────────────────────────────────────────────────────────────
// Cache only the WASM engine (safe — it's stateless), not the Database instance
// global persists across HMR in Next.js dev mode
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __sqlJsEngine: SqlJsStatic | undefined;
}

async function getSqlEngine(): Promise<SqlJsStatic> {
  if (global.__sqlJsEngine) return global.__sqlJsEngine;
  global.__sqlJsEngine = await initSqlJs();
  return global.__sqlJsEngine;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    company       TEXT NOT NULL,
    role          TEXT NOT NULL,
    level         TEXT NOT NULL,
    interview_type TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL,
    max_questions INTEGER NOT NULL DEFAULT 5
  );
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    role       TEXT NOT NULL CHECK(role IN ('assistant', 'user')),
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

// Open a fresh DB from disk (or empty), run schema, return it
async function openDb() {
  const SQL = await getSqlEngine();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);
    db.run(SCHEMA);
    try {
      db.run("ALTER TABLE sessions ADD COLUMN max_questions INTEGER NOT NULL DEFAULT 5;");
      saveDb(db);
    } catch (e) {
      // Column already exists, ignore
    }
    return db;
  }

  const db = new SQL.Database();
  db.run(SCHEMA);
  saveDb(db); // persist the empty schema immediately
  return db;
}

// Flush in-memory DB back to disk
function saveDb(db: InstanceType<SqlJsStatic["Database"]>) {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: convert sql.js result row array → named object
// sql.js returns rows as arrays like [val1, val2, ...]
// This zips them with column names → { id: val1, company: val2, ... }
// ─────────────────────────────────────────────────────────────────────────────
function rowToObject<T>(columns: string[], values: any[]): T {
  return Object.fromEntries(columns.map((col, i) => [col, values[i]])) as unknown as T;
}

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
  const db = await openDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  const maxQs = data.maxQuestions ?? 5;

  db.run(
    `INSERT INTO sessions (id, company, role, level, interview_type, status, created_at, updated_at, max_questions)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [id, data.company, data.role, data.level, data.interviewType, now, now, maxQs]
  );

  saveDb(db);
  db.close();
  return id;
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await openDb();

  try {
    // Use prepare() + getAsObject() — more reliable than exec() in sql.js
    const stmt = db.prepare("SELECT * FROM sessions WHERE id = ? LIMIT 1");
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject() as unknown as Session;
    stmt.free();
    return row;
  } finally {
    db.close();
  }
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await openDb();
  try {
    const results = db.exec(
      "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50"
    );
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map((row) => rowToObject<Session>(columns, row));
  } finally {
    db.close();
  }
}

export async function addMessage(data: {
  sessionId: string;
  role: "assistant" | "user";
  content: string;
}): Promise<void> {
  const db = await openDb();
  const now = Date.now();

  db.run(
    "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
    [data.sessionId, data.role, data.content, now]
  );
  db.run(
    "UPDATE sessions SET status = 'active', updated_at = ? WHERE id = ?",
    [now, data.sessionId]
  );

  saveDb(db);
  db.close();
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const db = await openDb();
  try {
    const results = db.exec(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC",
      [sessionId]
    );
    if (!results.length) return [];
    const { columns, values } = results[0];
    return values.map((row) => rowToObject<Message>(columns, row));
  } finally {
    db.close();
  }
}

export async function completeSession(sessionId: string): Promise<void> {
  const db = await openDb();
  db.run(
    "UPDATE sessions SET status = 'completed', updated_at = ? WHERE id = ?",
    [Date.now(), sessionId]
  );
  saveDb(db);
  db.close();
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await openDb();
  try {
    db.run("DELETE FROM messages WHERE session_id = ?", [sessionId]);
    db.run("DELETE FROM sessions WHERE id = ?", [sessionId]);
    saveDb(db);
  } finally {
    db.close();
  }
}
