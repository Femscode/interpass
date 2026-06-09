import { notFound, redirect } from "next/navigation";
import { getSession, getMessages } from "@/lib/db";
import ReportDashboard from "./ReportDashboard";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return { title: "Report Not Found" };
  return {
    title: `Evaluation Report | ${session.role} at ${session.company}`,
    description: `Detailed AI performance feedback for ${session.role}`,
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) notFound();

  // If the interview is not completed, redirect them to the active interview page
  if (session.status !== "completed") {
    redirect(`/interview/${sessionId}`);
  }

  const messages = await getMessages(sessionId);

  // Parse out the feedback from messages
  const lastAIMessage = [...messages].reverse().find(m => m.role === "assistant");
  const rawFeedback = lastAIMessage?.content || "";

  // Structure session data for the client
  const clientSession = {
    id: session.id,
    company: session.company,
    role: session.role,
    level: session.level,
    interview_type: session.interview_type,
    status: session.status,
  };

  // Convert messages to client friendly format
  const clientMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
    created_at: m.created_at,
  }));

  return (
    <ReportDashboard
      session={clientSession}
      messages={clientMessages}
      rawFeedback={rawFeedback}
    />
  );
}
