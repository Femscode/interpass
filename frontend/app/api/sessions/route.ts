/*
  🎓 NEXT.JS API ROUTE — app/api/sessions/route.ts

  In the App Router, API routes live in special `route.ts` files inside `app/api/`.
  They export named functions for each HTTP method: GET, POST, PUT, DELETE, etc.

  This is a SERVER-ONLY file — it NEVER runs in the browser.
  It can safely access databases, environment variables, secrets, etc.

  URL: /api/sessions
    POST → create a new session
    GET  → list all sessions (for history display)
    DELETE → delete a session
*/

import { NextRequest, NextResponse } from "next/server";
import { createSession, getAllSessions, deleteSession } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// Called by the SetupForm when user clicks "Start Interview Session"
// ────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();

    // Validate required fields — never trust client input
    const { company, role, level, interviewType, maxQuestions } = body;

    if (!company || typeof company !== "string" || company.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 } // 400 Bad Request = client sent invalid data
      );
    }

    if (!role || typeof role !== "string" || role.trim().length === 0) {
      return NextResponse.json(
        { error: "Job role is required" },
        { status: 400 }
      );
    }

    const validLevels = ["junior", "mid", "senior", "staff"];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: "Invalid experience level" },
        { status: 400 }
      );
    }

    const validTypes = ["technical", "behavioral", "hr", "system_design"];
    if (!validTypes.includes(interviewType)) {
      return NextResponse.json(
        { error: "Invalid interview type" },
        { status: 400 }
      );
    }

    // Create the session in SQLite
    const sessionId = await createSession({
      company: company.trim(),
      role: role.trim(),
      level,
      interviewType,
      maxQuestions: maxQuestions ? parseInt(maxQuestions, 10) : 5,
    });

    // 201 Created — the resource was successfully created
    return NextResponse.json({ sessionId }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/sessions] Error:", error);

    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/sessions
// Returns all sessions for the history display (will use on landing page later)
// ────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const sessions = await getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[GET /api/sessions] Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/sessions
// Deletes a session and its associated messages to clean up the DB
// ────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[DELETE /api/sessions] Error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
