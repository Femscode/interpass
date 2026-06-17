/*
  🎓 INTERVIEW PAGE — app/interview/[sessionId]/page.tsx

  This page is a SERVER COMPONENT that:
    1. Reads the session from SQLite (server-side — safe and fast)
    2. Validates the session exists (shows 404 if not)
    3. Renders the layout shell + passes session data to ChatInterface

  Why split it this way?
    - The SERVER COMPONENT handles data fetching (no client JS needed for this)
    - The CLIENT COMPONENT (ChatInterface) handles all interactivity
    - This is the "server shell + client island" pattern in Next.js

  The interview page takes up the full screen — no scroll, no nav bar.
  It's designed to feel immersive, like a real video call interface.
*/

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession, getMessages } from "@/lib/db";
import ChatInterface from "@/components/ChatInterface";

interface PageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ questions?: string; mode?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) return { title: "Session Not Found" };

  return {
    title: `${session.role} at ${session.company}`,
    description: `AI-powered ${session.interview_type} interview practice session`,
  };
}

export default async function InterviewPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { questions, mode } = await searchParams;

  const session = await getSession(sessionId);
  if (!session) notFound();

  // Load existing messages for session history restoration
  const messages = await getMessages(sessionId);

  const maxQuestions = Math.min(
    Math.max(parseInt(questions ?? "5", 10) || 5, 1),
    10  // cap at 10 questions max
  );

  // Transform DB row to what ChatInterface needs
  // (snake_case DB fields → camelCase-friendly object)
  const sessionForClient = {
    id: session.id,
    company: session.company,
    role: session.role,
    level: session.level,
    interview_type: session.interview_type,
    status: session.status,
  };

  return (
    <div className="h-screen bg-[var(--color-surface-base)] flex flex-col">
      {/* Minimal top bar — just a logo + exit link */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity"
        >
          <img src="/logo.svg" alt="Logo" className="w-6 h-6 object-contain rounded border border-slate-900 bg-slate-950 shadow-sm" />
          <span className="text-sm font-bold text-[var(--color-text-primary)]">InterPass</span>
        </Link>

        <Link
          href="/setup"
          className="pointer-events-auto text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-600)] transition-colors"
        >
          Exit interview
        </Link>
      </div>

      {/*
        ChatInterface is a CLIENT COMPONENT rendered inside this SERVER COMPONENT.
        We pass all data as props — the client component never touches the DB directly.
        This is the correct "data down, events up" pattern in React.
      */}
      <ChatInterface
        session={sessionForClient}
        maxQuestions={maxQuestions}
        initialMode={mode === "voice" ? "voice" : "text"}
        initialMessages={messages}
      />
    </div>
  );
}
