/*
  🎓 NEXT.JS API PROXY — app/api/interview/route.ts

  Instead of calling the Python FastAPI backend directly from the browser,
  we route through this Next.js API endpoint. This pattern is called a
  "Backend For Frontend" (BFF).

  Benefits:
    1. CORS stays simple — browser only talks to localhost:3001
    2. We can add auth checks here later without touching the Python code
    3. We can add rate limiting, logging, and error normalisation in one place

  This route handles two actions via a query parameter:
    POST /api/interview?action=start    → proxies to FastAPI /interview/start
    POST /api/interview?action=respond  → proxies to FastAPI /interview/respond
*/

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (!action || !["start", "respond"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use ?action=start or ?action=respond" },
      { status: 400 }
    );
  }

  const body = await request.json();

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/interview/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // 30-second timeout — LLM calls can be slow
      signal: AbortSignal.timeout(30_000),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.detail || "Backend error" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ 
        error: "Request timed out",
        message: err.message,
        stack: err.stack
      }, { status: 504 });
    }
    console.error("[proxy /api/interview] Error:", err);
    return NextResponse.json({ 
      error: "Failed to reach AI backend",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 502 });
  }
}
