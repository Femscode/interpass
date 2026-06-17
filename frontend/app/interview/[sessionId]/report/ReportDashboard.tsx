"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Session {
  id: string;
  company: string;
  role: string;
  level: string;
  interview_type: string;
  status: string;
}

interface Message {
  role: "assistant" | "user";
  content: string;
  created_at: number;
}

interface ReportDashboardProps {
  session: Session;
  messages: Message[];
  rawFeedback: string;
}

// Custom radial gauge component for scores
function ScoreCircle({ score, label, max = 10 }: { score: number; label: string; max?: number }) {
  const radius = 35;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / max) * circumference;

  // Determine indicator colors based on actual honest strict scores
  let strokeColor = "var(--color-brand-500)"; // Cyan default
  if (score < 5) strokeColor = "var(--color-danger)"; // Strict failing red
  else if (score < 7.5) strokeColor = "var(--color-warning)"; // Strict warning yellow/orange
  else strokeColor = "var(--color-success)"; // Good phosphor green

  return (
    <div className="flex flex-col items-center p-5 bg-[var(--color-surface-raised)]/60 border border-[var(--color-surface-border)] rounded-lg shadow-sm text-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="var(--color-surface-border)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
            className="origin-center"
            style={{ transform: "scale(1.3)" }}
          />
          {/* Progress circle */}
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transform: "scale(1.3)" }}
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
            className="origin-center transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-xl font-black text-[var(--color-text-primary)] font-display">
          {score.toFixed(1)}
        </span>
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mt-3 font-display">
        {label}
      </span>
    </div>
  );
}

export default function ReportDashboard({ session, messages, rawFeedback }: ReportDashboardProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [checkedResources, setCheckedResources] = useState<Record<number, boolean>>({});

  // 1. Parsing Markdown contents
  const sections = {
    overall: "",
    strengths: [] as string[],
    improvements: [] as string[],
    resources: [] as { topic: string; why: string; resource: string }[],
    recommendations: [] as string[],
    scores: {
      communication: 0,
      technical: 0,
      problemSolving: 0,
      readiness: 0,
    }
  };

  const parts = rawFeedback.split(/^##\s+/m);
  parts.forEach(part => {
    const lines = part.trim().split("\n");
    const heading = lines[0].trim().toLowerCase();
    const content = lines.slice(1).join("\n").trim();

    if (heading.includes("impression")) {
      sections.overall = content;
    } else if (heading.includes("strengths")) {
      sections.strengths = content
        .split("\n")
        .map(l => l.replace(/^[-*+]\s+/, "").trim())
        .filter(l => l.length > 0);
    } else if (heading.includes("areas for improvement") || heading.includes("improvement")) {
      if (!heading.includes("topics")) {
        sections.improvements = content
          .split("\n")
          .map(l => l.replace(/^[-*+]\s+/, "").trim())
          .filter(l => l.length > 0);
      }
    } else if (heading.includes("topics to improve") || heading.includes("resources")) {
      content.split("\n").forEach(line => {
        const cleanLine = line.replace(/^[-*+]\s+/, "").trim();
        if (!cleanLine) return;
        
        const topicMatch = cleanLine.match(/^\*\*(.*?)\*\*:(.*)/);
        if (topicMatch) {
          const topic = topicMatch[1].trim();
          const rest = topicMatch[2].trim();
          
          let why = rest;
          let resource = "";
          const resSplitIndex = rest.toLowerCase().indexOf("recommended resource:");
          if (resSplitIndex >= 0) {
            why = rest.slice(0, resSplitIndex).trim();
            resource = rest.slice(resSplitIndex + "recommended resource:".length).trim();
          }
          sections.resources.push({ topic, why, resource });
        } else {
          sections.resources.push({ topic: "General Study", why: cleanLine, resource: "Official Documentation" });
        }
      });
    } else if (heading.includes("recommendations")) {
      sections.recommendations = content
        .split("\n")
        .map(l => l.replace(/^[-*+]\s+/, "").trim())
        .filter(l => l.length > 0);
    } else if (heading.includes("score")) {
      content.split("\n").forEach(line => {
        const [key, val] = line.split(":");
        if (key && val) {
          const scoreNum = parseFloat(val.trim().split("/")[0]) || 0;
          const k = key.trim().toLowerCase();
          if (k.includes("communication")) sections.scores.communication = scoreNum;
          else if (k.includes("technical") || k.includes("depth")) sections.scores.technical = scoreNum;
          else if (k.includes("problem")) sections.scores.problemSolving = scoreNum;
          else if (k.includes("readiness")) sections.scores.readiness = scoreNum;
        }
      });
    }
  });

  // Fallback overall score calculation
  const totalScore = sections.scores.readiness || (
    (sections.scores.communication + sections.scores.technical + sections.scores.problemSolving) / 3
  ) || 0.0;

  // Hiring status determination based on STRICT grading
  let statusText = "REJECT / NO PASS";
  let statusColor = "var(--color-danger)";
  if (totalScore >= 7.5) {
    statusText = "STRONG PASS / HIRE";
    statusColor = "var(--color-success)";
  } else if (totalScore >= 5.5) {
    statusText = "HOLD / MIXED RESULTS";
    statusColor = "var(--color-warning)";
  }

  // Clear Database Session & Restart
  async function handleRestart() {
    setIsRestarting(true);
    try {
      await fetch(`/api/sessions?sessionId=${session.id}`, {
        method: "DELETE",
      });
      router.push("/setup");
    } catch (err) {
      console.error("Failed to clear session:", err);
      router.push("/setup");
    } finally {
      setIsRestarting(false);
    }
  }

  const levelLabels: Record<string, string> = {
    junior: "Junior", mid: "Mid-Level", senior: "Senior", staff: "Staff"
  };
  const typeLabels: Record<string, string> = {
    technical: "Technical", behavioral: "Behavioral", hr: "HR", system_design: "System Design"
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="scanlines-overlay" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-5xl mx-auto w-full border-b border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]/35 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-900 bg-slate-950 shadow-sm" />
          <span className="text-lg font-black tracking-tight font-display">InterPass</span>
        </Link>
        <span className="text-xs font-mono font-black uppercase tracking-widest text-[var(--color-text-muted)]">
          [ SESSION_REPORT_GENERATED ]
        </span>
      </nav>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-10 animate-fade-up">
        {/* Header HUD profile summary */}
        <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black uppercase text-[var(--color-text-muted)] tracking-widest">[ Profile Metadata ]</span>
            <h1 className="text-2xl font-black uppercase tracking-tight font-display">{session.role}</h1>
            <p className="text-sm font-mono text-[var(--color-text-secondary)] font-bold">
              {session.company} · {levelLabels[session.level]} · {typeLabels[session.interview_type]} Session
            </p>
          </div>

          {/* Glowing Pass/Hold/Fail status block */}
          <div className="p-4 rounded border-2 border-slate-900 bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] flex items-center gap-3">
            <span className="w-3 h-3 rounded-full animate-ping shrink-0" style={{ backgroundColor: statusColor }} />
            <div className="font-mono">
              <p className="text-[9px] uppercase tracking-widest text-slate-500">Evaluation Outcome</p>
              <p className="text-sm font-bold tracking-wide" style={{ color: statusColor }}>{statusText}</p>
            </div>
          </div>
        </div>

        {/* Scores Gauges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreCircle score={sections.scores.communication || 0} label="Communication" />
          <ScoreCircle score={sections.scores.technical || 0} label="Technical Depth" />
          <ScoreCircle score={sections.scores.problemSolving || 0} label="Problem-Solving" />
          <ScoreCircle score={totalScore} label="Overall Readiness" />
        </div>

        {/* Evaluation Analysis Rows */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Main Panels (Overall & Details) */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Overall Summary Impression */}
            <div className="glass-card p-8 space-y-4 relative overflow-hidden border-t-4 border-t-[var(--color-brand-500)] shadow-md">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] border-b border-[var(--color-surface-border)] pb-2 font-display">
                [ Overall Assessment ]
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)] font-mono whitespace-pre-wrap">
                {sections.overall || "No overall impression was compiled. Standard model completion values failed."}
              </p>
            </div>

            {/* Strengths & Improvements grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Strengths Card */}
              <div className="glass-card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-success)] border-b border-[var(--color-surface-border)] pb-2 font-display">
                  ✓ Core Strengths
                </h3>
                {sections.strengths.length > 0 ? (
                  <ul className="space-y-3 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed text-left">
                    {sections.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--color-success)] shrink-0 font-bold font-mono">[✓]</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">No specific strengths recorded.</p>
                )}
              </div>

              {/* Improvements Card */}
              <div className="glass-card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-danger)] border-b border-[var(--color-surface-border)] pb-2 font-display">
                  ⚠️ Critique & Gaps
                </h3>
                {sections.improvements.length > 0 ? (
                  <ul className="space-y-3 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed text-left">
                    {sections.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--color-danger)] shrink-0 font-bold font-mono">[!]</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">No critical improvements recorded.</p>
                )}
              </div>

            </div>

            {/* Action Recommendations */}
            <div className="glass-card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-md">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] border-b border-[var(--color-surface-border)] pb-2 font-display">
                [ Actionable Recommendations ]
              </h2>
              {sections.recommendations.length > 0 ? (
                <ul className="space-y-3 font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed text-left">
                  {sections.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-slate-950 text-white flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] font-mono">No key recommendations provided.</p>
              )}
            </div>
          </div>

          {/* Right Study Checklist Sidebar (Topics & Resources) */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass-card p-6 space-y-4 border-2 border-slate-900 bg-[var(--color-surface-raised)]/80 shadow-[4px_4px_0px_rgba(9,13,22,1)]">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-950 border-b-2 border-slate-950 pb-2 font-display flex items-center justify-between">
                <span>[ Target Study List ]</span>
                <span className="text-[9px] font-mono bg-slate-950 text-[#00ff66] px-1.5 py-0.5 rounded">Checklist</span>
              </h2>
              
              <p className="text-[11px] font-mono text-[var(--color-text-secondary)] leading-relaxed font-bold">
                Check off topics as you study them to practice for your next interview round.
              </p>

              {sections.resources.length > 0 ? (
                <div className="space-y-4 pt-2">
                  {sections.resources.map((item, i) => {
                    const isChecked = !!checkedResources[i];
                    return (
                      <div 
                        key={i} 
                        onClick={() => setCheckedResources(p => ({ ...p, [i]: !p[i] }))}
                        className={`p-3.5 border rounded cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked 
                            ? "border-[var(--color-success)] bg-green-500/5 opacity-70"
                            : "border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]/40 hover:border-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by outer div click
                          className="mt-0.5 accent-[var(--color-success)] cursor-pointer"
                        />
                        <div className="space-y-1 font-mono text-xs">
                          <span className={`block font-bold text-[var(--color-text-primary)] ${isChecked ? "line-through text-slate-500" : ""}`}>
                            {item.topic}
                          </span>
                          <span className="block text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                            {item.why}
                          </span>
                          {item.resource && (
                            <span className="inline-block text-[10px] text-[var(--color-brand-700)] font-bold bg-[var(--color-brand-100)]/80 px-2 py-0.5 rounded mt-1.5">
                              📚 {item.resource}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] font-mono">No target study list generated.</p>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible conversation transcript log */}
        <div className="glass-card p-6 border border-[var(--color-surface-border)] shadow-md">
          <button
            onClick={() => setShowTranscript(t => !t)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] font-display"
          >
            <span>[ Expand Conversation Transcript Terminal ]</span>
            <span>{showTranscript ? "▲ Collapse" : "▼ Expand"}</span>
          </button>

          {showTranscript && (
            <div className="mt-6 border-t border-[var(--color-surface-border)] pt-6 space-y-4 max-h-[500px] overflow-y-auto font-mono text-xs bg-slate-950 text-slate-300 p-5 rounded-md shadow-inner relative">
              <div className="scanlines-overlay" />
              <div className="text-[10px] border-b border-slate-800 pb-2 mb-4 text-slate-500 uppercase flex justify-between">
                <span>Log File: transcript.log</span>
                <span>Console active</span>
              </div>
              
              {messages.map((msg, idx) => (
                <div key={idx} className="space-y-1.5 border-b border-slate-900/50 pb-3">
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase">
                    <span>Sender: {msg.role === "assistant" ? "AI INTERVIEWER" : "CANDIDATE"}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className={msg.role === "assistant" ? "text-[#00d8ff]" : "text-white"}>
                    {msg.content.startsWith("Thank you for completing") ? "Thank you for completing the interview session!" : msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear Data & Reset Actions */}
        <div className="glass-card p-6 border border-[var(--color-surface-border)] shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] font-display">[ Session Cleanup Actions ]</h4>
              <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                Restarting the session deletes all active and completed SQL session rows to keep the database size minimal.
              </p>
            </div>
            
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className="btn-primary py-2.5 px-6 font-mono text-sm"
              >
                {isRestarting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 inline-block" />
                    Clearing...
                  </>
                ) : (
                  <>🔄 Restart Practice</>
                )}
              </button>
              <a href="/" className="btn-ghost py-2.5 px-6 font-mono text-sm">
                [ Go to Home ]
              </a>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
