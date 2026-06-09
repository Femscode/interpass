/*
  🎓 CLIENT COMPONENT
  This file handles the session configuration setup page.
*/
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ExperienceLevel = "junior" | "mid" | "senior" | "staff";
type InterviewType = "technical" | "behavioral" | "hr" | "system_design";

interface SetupFormData {
  company: string;
  role: string;
  level: ExperienceLevel;
  interviewType: InterviewType;
}

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "junior",  label: "Junior",  desc: "0–2 years experience" },
  { value: "mid",     label: "Mid-Level", desc: "2–5 years experience" },
  { value: "senior",  label: "Senior",  desc: "5–10 years experience" },
  { value: "staff",   label: "Staff / Principal", desc: "10+ years, leadership" },
];

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string; icon: string }[] = [
  { value: "technical",     label: "Technical",     desc: "Coding, algorithms, CS fundamentals", icon: "⌨️" },
  { value: "behavioral",    label: "Behavioral",    desc: "STAR method, past experiences",        icon: "🧠" },
  { value: "system_design", label: "System Design", desc: "Architecture, scalability, trade-offs", icon: "🏗️" },
  { value: "hr",            label: "HR / Culture",  desc: "Fit, motivations, soft skills",         icon: "🤝" },
];

const TIMEFRAMES = [
  { value: 1,  label: "1 Min",  desc: "1 critical question", questions: 1 },
  { value: 5,  label: "5 Min",  desc: "3 questions",         questions: 3 },
  { value: 10, label: "10 Min", desc: "5 questions",         questions: 5 },
];

const POPULAR_COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft",
  "Netflix", "Stripe", "Airbnb", "Uber", "Spotify",
];

export default function SetupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<SetupFormData>({
    company: "",
    role: "",
    level: "mid",
    interviewType: "technical",
  });
  const [preferredMode, setPreferredMode] = useState<"text" | "voice">("text");
  const [timeframe, setTimeframe] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof SetupFormData>(key: K, value: SetupFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.company.trim() || !formData.role.trim()) {
      setError("Please fill in the company and role fields.");
      return;
    }

    setIsLoading(true);

    const mappedQuestions = TIMEFRAMES.find((t) => t.value === timeframe)?.questions || 3;

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxQuestions: mappedQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      const { sessionId } = await res.json();
      router.push(`/interview/${sessionId}?mode=${preferredMode}&questions=${mappedQuestions}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      {/* Background spotlights */}
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" aria-hidden="true" />
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-20 blur-[120px]"
        style={{ background: "radial-gradient(ellipse at top right, rgba(6,182,212,0.12) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-900 bg-slate-950 shadow-sm" />
          <span className="text-lg font-black text-slate-950 tracking-tight font-display">InterPass</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-slate-900 hover:text-slate-950 transition-colors uppercase tracking-wider">
          [ Back to home ]
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-6 py-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 w-full">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-black tracking-tight mb-3 text-slate-950 font-display">
                Configure Your <span className="border-b-4 border-slate-950">Interview</span>
              </h1>
              <p className="text-slate-900 font-bold text-sm">
                Set your target role and preferences. The more specific you are, the more realistic your session will be.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* ── COMPANY + ROLE ── */}
              <div className="glass-card p-6 space-y-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 font-display">
                  [ Target Role ]
                </h2>

                {/* Company input */}
                <div>
                  <label htmlFor="company" className="form-label font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">
                    Company <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="company"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Google, Stripe, Acme Corp..."
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    required
                    autoFocus
                  />
                  {/* Quick-fill chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {POPULAR_COMPANIES.map((co) => (
                      <button
                        key={co}
                        type="button"
                        onClick={() => updateField("company", co)}
                        className={`px-3 py-1.5 text-xs rounded-md border-2 transition-all font-bold ${
                          formData.company === co
                            ? "border-slate-900 bg-slate-950 text-white shadow-[2px_2px_0px_rgba(9,13,22,1)]"
                            : "border-slate-900/30 bg-[var(--color-surface-raised)] text-slate-900 hover:border-slate-900 hover:text-slate-950"
                        }`}
                      >
                        {co}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role input */}
                <div>
                  <label htmlFor="role" className="form-label font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">
                    Job Role <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Software Engineer, Product Manager..."
                    value={formData.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* ── EXPERIENCE LEVEL ── */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 font-display">
                  [ Experience Level ]
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      id={`level-${lvl.value}`}
                      onClick={() => updateField("level", lvl.value)}
                      className={`p-4 rounded-md border-2 border-slate-900 text-left transition-all ${
                        formData.level === lvl.value
                          ? "bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] translate-x-[-2px] translate-y-[-2px]"
                          : "bg-[var(--color-surface-overlay)] text-slate-900 hover:bg-slate-100 border-slate-900/50"
                      }`}
                    >
                      <p className={`text-sm font-bold uppercase tracking-wider font-display ${formData.level === lvl.value ? "text-white" : "text-slate-950"}`}>{lvl.label}</p>
                      <p className={`text-xs mt-1 font-bold ${formData.level === lvl.value ? "text-slate-400" : "text-slate-600"}`}>{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── INTERVIEW TYPE ── */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 font-display">
                  [ Interview Type ]
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {INTERVIEW_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      id={`type-${type.value}`}
                      onClick={() => updateField("interviewType", type.value)}
                      className={`p-4 rounded-md border-2 border-slate-900 text-left transition-all flex items-start gap-3 ${
                        formData.interviewType === type.value
                          ? "bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] translate-x-[-2px] translate-y-[-2px]"
                          : "bg-[var(--color-surface-overlay)] text-slate-900 hover:bg-slate-100 border-slate-900/50"
                      }`}
                    >
                      <span className="text-2xl shrink-0">{type.icon}</span>
                      <div>
                        <p className={`text-sm font-bold uppercase tracking-wider font-display ${formData.interviewType === type.value ? "text-white" : "text-slate-950"}`}>{type.label}</p>
                        <p className={`text-xs mt-1 font-bold ${formData.interviewType === type.value ? "text-slate-400" : "text-slate-600"}`}>{type.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── INTERACTION MODE ── */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 font-display">
                  [ Preferred Mode ]
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredMode("text")}
                    className={`p-4 rounded-md border-2 border-slate-900 text-left transition-all flex items-start gap-3 ${
                      preferredMode === "text"
                        ? "bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-[var(--color-surface-overlay)] text-slate-900 hover:bg-slate-100 border-slate-900/50"
                    }`}
                  >
                    <span className="text-2xl shrink-0">⌨️</span>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wider font-display ${preferredMode === "text" ? "text-white" : "text-slate-950"}`}>Text Mode</p>
                      <p className={`text-xs mt-1 font-bold ${preferredMode === "text" ? "text-slate-400" : "text-slate-600"}`}>{`Type answers, read questions`}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredMode("voice")}
                    className={`p-4 rounded-md border-2 border-slate-900 text-left transition-all flex items-start gap-3 ${
                      preferredMode === "voice"
                        ? "bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-[var(--color-surface-overlay)] text-slate-900 hover:bg-slate-100 border-slate-900/50"
                    }`}
                  >
                    <span className="text-2xl shrink-0">🎙️</span>
                    <div>
                      <p className={`text-sm font-bold uppercase tracking-wider font-display ${preferredMode === "voice" ? "text-white" : "text-slate-950"}`}>Voice Mode</p>
                      <p className={`text-xs mt-1 font-bold ${preferredMode === "voice" ? "text-slate-400" : "text-slate-600"}`}>{`Speak answers, hear questions`}</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── TIMEFRAME ── */}
              <div className="glass-card p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 font-display">
                  [ Interview Timeframe ]
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      type="button"
                      onClick={() => setTimeframe(tf.value)}
                      className={`p-4 rounded-md border-2 border-slate-900 text-left transition-all ${
                        timeframe === tf.value
                          ? "bg-slate-950 text-white shadow-[3px_3px_0px_rgba(9,13,22,1)] translate-x-[-2px] translate-y-[-2px]"
                          : "bg-[var(--color-surface-overlay)] text-slate-900 hover:bg-slate-100 border-slate-900/50"
                      }`}
                    >
                      <p className={`text-sm font-bold uppercase tracking-wider font-display ${timeframe === tf.value ? "text-white" : "text-slate-950"}`}>{tf.label}</p>
                      <p className={`text-xs mt-1 font-bold ${timeframe === tf.value ? "text-slate-400" : "text-slate-600"}`}>{tf.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 rounded-md border-2 border-[var(--color-danger)] bg-red-50 text-sm text-red-700 font-bold">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating session...
                  </>
                ) : (
                  <>
                    Start Interview Session
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Telemetry HUD */}
          <div className="lg:col-span-5 hidden lg:block sticky top-8">
            <div className="relative w-full bg-slate-950 text-[#00ff66] font-mono p-8 border-2 border-slate-900 rounded-xl shadow-[8px_8px_0px_rgba(9,13,22,1)] min-h-[580px] flex flex-col justify-between overflow-hidden">
              <div className="scanlines-overlay" />
              
              {/* Header Info */}
              <div>
                <div className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center text-xs">
                  <span>[ YOUR SESSION CONFIGURATION ]</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="space-y-6 text-left">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Target Company</span>
                    <span className="text-xl font-bold uppercase text-white">{formData.company || "[ Empty ]"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Job Position</span>
                    <span className="text-xl font-bold uppercase text-white">{formData.role || "[ Empty ]"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Experience Level</span>
                      <span className="text-sm font-bold uppercase text-[#00d8ff]">{formData.level}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Focus Theme</span>
                      <span className="text-sm font-bold uppercase text-[#ffb000]">{formData.interviewType}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Practice Mode</span>
                    <span className="text-sm font-bold uppercase text-white border-b-2 border-dashed border-[#00ff66] pb-0.5">{preferredMode === "voice" ? "🎙️ Voice Practice" : "⌨️ Text Chat"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Session Timeframe</span>
                    <span className="text-sm font-bold uppercase text-[#00ff66]">{timeframe} Min ({TIMEFRAMES.find(t => t.value === timeframe)?.questions} Qs)</span>
                  </div>
                </div>
              </div>

              {/* Graphic animation core */}
              <div className="my-8 flex justify-center items-center">
                <svg className="w-24 h-24 origin-center animate-spin" style={{ animationDuration: '8s' }} viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#334155" strokeWidth="1" strokeDasharray="5 5" fill="none" />
                  <circle cx="50" cy="50" r="35" stroke="#00ff66" strokeWidth="1.5" strokeDasharray="15 35" fill="none" />
                  <circle cx="50" cy="50" r="25" stroke="#00d8ff" strokeWidth="2" strokeDasharray="40 10" fill="none" />
                  <circle cx="50" cy="50" r="15" stroke="#ffb000" strokeWidth="1" fill="none" />
                </svg>
              </div>

              {/* Console status footer */}
              <div className="border-t border-slate-800 pt-4 text-[10px] space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>System Engine</span>
                  <span>Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Assistant</span>
                  <span>Online</span>
                </div>
                <div className="flex justify-between">
                  <span>Local database</span>
                  <span>Connected</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
