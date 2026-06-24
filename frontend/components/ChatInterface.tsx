"use client";

/*
  🎓 THE CHAT INTERFACE — components/ChatInterface.tsx

  This file implements Phase 3 (Text Mode) and Phase 4 (Voice Mode) of the InterPass app.

  STATE MACHINE (React side):
    "idle"       → session just loaded, waiting to start
    "loading"    → waiting for AI response (spinner shown)
    "waiting"    → AI question displayed, waiting for user response
    "complete"   → interview ended, feedback shown
    "error"      → connection error

  VOICE MODE FEATURES:
    - Text-To-Speech (TTS): Speaks AI questions aloud using window.speechSynthesis.
    - Speech-To-Text (STT): Automatically starts browser-native microphone recognition
      immediately after the question finishes reading.
    - Live Transcription Preview: Shows what the candidate is saying in real-time.
    - Manual Submission: The candidate reviews their transcript and clicks "Submit" to send.
    - Custom Controls: Adjust speaking rate, choose system voices, and mute/unmute AI.
*/

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "waiting" | "complete" | "error";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  company: string;
  role: string;
  level: string;
  interview_type: string;
  status: string;
}

interface ChatInterfaceProps {
  session: Session;
  maxQuestions?: number;
  initialMode?: "text" | "voice";
  initialMessages?: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-500))" }}
      >
        AI
      </div>
      <div className="glass-card px-4 py-3 flex items-center gap-1.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-[var(--color-brand-400)]"
            style={{ animation: `pulse 1.2s ease-in-out ${delay}ms infinite` }}
          />
        ))}
        <span className="text-xs text-[var(--color-text-muted)] ml-1">Thinking...</span>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onReplay?: (text: string) => void;
}

function MessageBubble({ message, onReplay }: MessageBubbleProps) {
  const isAI = message.role === "assistant";

  return (
    <div className={`flex items-start gap-4.5 ${isAI ? "" : "flex-row-reverse"} animate-fade-up`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border-2 border-slate-900 shadow-[2px_2px_0px_rgba(9,13,22,0.15)] uppercase tracking-wider font-display ${
          isAI ? "text-slate-950" : "text-white"
        }`}
        style={{
          background: isAI ? "var(--color-brand-500)" : "var(--color-surface-subtle)",
        }}
      >
        {isAI ? "AI" : "YOU"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[76%] px-5 py-4 text-sm leading-relaxed font-mono ${
          isAI
            ? "glass-card border-l-4 border-l-[var(--color-brand-500)] border-t border-r border-b border-[var(--color-surface-border)] text-[var(--color-text-primary)] rounded-lg shadow-[3px_3px_0px_rgba(9,13,22,0.1)]"
            : "bg-slate-950 text-white border-2 border-slate-950 shadow-[3px_3px_0px_rgba(9,13,22,0.15)] rounded-lg"
        }`}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 whitespace-pre-wrap">
            {message.content}
          </div>
          {isAI && onReplay && (
            <button
              onClick={() => onReplay(message.content)}
              className="mt-0.5 p-1.5 hover:bg-[var(--color-surface-subtle)]/20 rounded transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-brand-500)] shrink-0 border border-transparent hover:border-[var(--color-surface-border)]"
              title="Read aloud"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  content: string;
  onRestart?: () => void;
  isRestarting?: boolean;
}

function FeedbackCard({ content, onRestart, isRestarting }: FeedbackCardProps) {
  return (
    <div className="glass-card p-6 border border-[var(--color-accent-500)] border-opacity-30 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-success)] to-[var(--color-brand-500)]" />
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">📋</span>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] font-display">Interview Feedback</h3>
        <span
          className="ml-auto text-xs px-2 py-1 rounded border font-semibold uppercase tracking-wider"
          style={{ borderColor: "var(--color-success)", color: "var(--color-success)", background: "rgba(0,255,102,0.05)" }}
        >
          ✓ Complete
        </span>
      </div>
      <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap font-[var(--font-sans)] mb-6">
        {content}
      </div>
      {onRestart && (
        <div className="border-t border-[var(--color-surface-border)] pt-4 flex justify-between items-center gap-4">
          <p className="text-xs text-[var(--color-text-muted)] max-w-md">
            Review completed. Clear session database records to restart practice.
          </p>
          <button
            onClick={onRestart}
            disabled={isRestarting}
            className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
          >
            {isRestarting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Clearing...
              </>
            ) : (
              <>🔄 Restart Interview</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ChatInterface component
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInterface({ session, maxQuestions = 5, initialMode = "text", initialMessages }: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState("");
  const [isRestarting, setIsRestarting] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Mode state
  const [mode, setMode] = useState<"text" | "voice">(initialMode);

  // Speech settings
  const [isMuted, setIsMuted] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);

  // Refs to avoid stale state in async Web Speech API callbacks
  const isMutedRef = useRef(isMuted);
  const modeRef = useRef(mode);
  const statusRef = useRef(status);
  const speechSpeedRef = useRef(speechSpeed);
  const selectedVoiceNameRef = useRef(selectedVoiceName);
  const voicesRef = useRef(voices);

  // Sync refs to avoid closures issues
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { speechSpeedRef.current = speechSpeed; }, [speechSpeed]);
  useEffect(() => { selectedVoiceNameRef.current = selectedVoiceName; }, [selectedVoiceName]);
  useEffect(() => { voicesRef.current = voices; }, [voices]);

  // Ref to the bottom of the message list — we scroll here after each new message
  const bottomRef = useRef<HTMLDivElement>(null);
  // Ref to the textarea — we auto-focus it when it's the user's turn
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Web API engine references
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // Auto-focus textarea when it's the user's turn to answer in text mode
  useEffect(() => {
    if (status === "waiting" && mode === "text") {
      textareaRef.current?.focus();
    }
  }, [status, mode]);

  // Fetch available TTS system voices on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }

      if (window.speechSynthesis) {
        const updateVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          setVoices(availableVoices);
          // Auto-select a high-quality English voice
          const defaultVoice = availableVoices.find(
            (v) =>
              v.lang.startsWith("en-US") &&
              (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
          ) || availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0];
          if (defaultVoice) {
            setSelectedVoiceName(defaultVoice.name);
          }
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    // Load existing messages or start a new session
    if (initialMessages && initialMessages.length > 0) {
      const formattedMessages: Message[] = initialMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at || Date.now()),
      }));

      if (session.status === "completed") {
        router.push(`/interview/${session.id}/report`);
        return;
      } else {
        setMessages(formattedMessages);
        const aiMessageCount = formattedMessages.filter(m => m.role === "assistant").length;
        setQuestionNumber(Math.max(aiMessageCount, 1));
        setStatus("waiting");
      }
    } else {
      startInterview();
    }

    // Cleanup synthesized voice on unmount
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SPEECH SYSTEMS
  // ─────────────────────────────────────────────────────────────────────────────

  const speakText = (text: string, forceMuteOverride?: boolean) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();
    stopListening();

    const muted = forceMuteOverride !== undefined ? forceMuteOverride : isMutedRef.current;
    if (muted || modeRef.current !== "voice") {
      // If we are in voice mode but muted, open the mic immediately
      if (modeRef.current === "voice" && statusRef.current === "waiting") {
        startListening();
      }
      return;
    }

    // Clean markdown structures from transcript before reading
    const cleanText = text
      .replace(/##/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/[-+]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    synthesisRef.current = utterance;
    utterance.rate = speechSpeedRef.current;

    // Bind chosen voice
    if (selectedVoiceNameRef.current && voicesRef.current.length > 0) {
      const selected = voicesRef.current.find((v) => v.name === selectedVoiceNameRef.current);
      if (selected) utterance.voice = selected;
    }

    // Auto-listen as soon as the reading completes
    utterance.onend = () => {
      if (modeRef.current === "voice" && statusRef.current === "waiting") {
        startListening();
      }
    };

    utterance.onerror = (e) => {
      console.error("TTS error:", e);
      if (modeRef.current === "voice" && statusRef.current === "waiting") {
        startListening();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setMicError(null);

    // Stop existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscriptAtStart = answer;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalSpeech = "";

      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSpeech += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalSpeech) {
        setAnswer((prev) => {
          const base = finalTranscriptAtStart.trim();
          const spoken = finalSpeech.trim();
          return base ? `${base} ${spoken}` : spoken;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error("STT Error:", event.error);
      if (event.error === "not-allowed") {
        setMicError("Microphone permission denied. Allow mic access to speak.");
      } else {
        setMicError(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start SpeechRecognition:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleModeChange = (newMode: "text" | "voice") => {
    setMode(newMode);
    if (newMode === "text") {
      // Cancel vocal synthesis and recording
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    } else {
      // Trigger question reading
      const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAI && status === "waiting") {
        speakText(lastAI.content);
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // If we are waiting, start mic right away since AI isn't reading
      if (status === "waiting" && mode === "voice") {
        startListening();
      }
    } else {
      const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
      if (lastAI && status === "waiting") {
        speakText(lastAI.content, false);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE INTERVIEW OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  async function startInterview() {
    setStatus("loading");

    try {
      const res = await fetch("/api/interview?action=start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          max_questions: maxQuestions,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to start interview");

      setMessages([{ role: "assistant", content: data.message, timestamp: new Date() }]);
      setQuestionNumber(data.question_number ?? 1);
      setStatus("waiting");

      // Auto-read question if voice mode is active
      if (modeRef.current === "voice") {
        speakText(data.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not connect to AI backend.");
      setStatus("error");
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || status !== "waiting") return;

    const userAnswer = answer.trim();
    setAnswer("");
    stopListening();

    // Optimistically push human message
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userAnswer, timestamp: new Date() },
    ]);
    setStatus("loading");

    try {
      const res = await fetch("/api/interview?action=respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          answer: userAnswer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit answer");

      if (data.is_complete) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message.split("\n")[0], timestamp: new Date() },
        ]);
        setStatus("complete");

        // Read feedback/farewell message
        if (modeRef.current === "voice") {
          speakText(data.message.split("\n")[0]);
        }

        // Redirect to report dashboard after a small delay
        setTimeout(() => {
          router.push(`/interview/${session.id}/report`);
        }, 2500);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, timestamp: new Date() },
        ]);
        setQuestionNumber(data.question_number ?? questionNumber + 1);
        setStatus("waiting");

        // Read question
        if (modeRef.current === "voice") {
          speakText(data.message);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function handleRestart() {
    setIsRestarting(true);
    try {
      await fetch(`/api/sessions?sessionId=${session.id}`, {
        method: "DELETE",
      });
      router.push("/setup");
    } catch (err) {
      console.error("Failed to clear session on restart:", err);
      router.push("/setup");
    } finally {
      setIsRestarting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submitAnswer();
    }
  }

  const levelLabels: Record<string, string> = {
    junior: "Junior", mid: "Mid-Level", senior: "Senior", staff: "Staff"
  };
  const typeLabels: Record<string, string> = {
    technical: "Technical", behavioral: "Behavioral", hr: "HR", system_design: "System Design"
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Dynamic Voice animations block injected inline for maximum portability */}
      <style jsx global>{`
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .wave-bar {
          animation: soundwave 1.2s ease-in-out infinite;
        }
        .wave-bar:nth-child(1) { animation-delay: 0.1s; }
        .wave-bar:nth-child(2) { animation-delay: 0.3s; }
        .wave-bar:nth-child(3) { animation-delay: 0.5s; }
        .wave-bar:nth-child(4) { animation-delay: 0.2s; }
        .wave-bar:nth-child(5) { animation-delay: 0.4s; }

        @keyframes sonar {
          0% { transform: scale(0.95); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .sonar-ring {
          animation: sonar 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="shrink-0 glass-card rounded-none border-x-0 border-t-0 px-4 sm:px-6 pb-3 sm:pb-4 pt-14 sm:pt-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] leading-tight">
              {session.role}
              <span className="text-[var(--color-text-muted)] font-normal"> at </span>
              {session.company}
            </h1>
            <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-0.5">
              {levelLabels[session.level]} · {typeLabels[session.interview_type]} Interview
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            {/* Mode Switcher */}
            {status !== "complete" && status !== "error" && (
              <div className="flex bg-[var(--color-surface-subtle)] p-0.5 rounded-lg border border-[var(--color-surface-border)] shrink-0">
                <button
                  onClick={() => handleModeChange("text")}
                  className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    mode === "text"
                      ? "bg-[var(--color-brand-600)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-brand-500)]"
                  }`}
                >
                  ⌨️ Text
                </button>
                <button
                  onClick={() => handleModeChange("voice")}
                  className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    mode === "voice"
                      ? "bg-[var(--color-brand-600)] text-white shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-brand-500)]"
                  }`}
                >
                  🎙️ Voice
                </button>
              </div>
            )}

            {/* Progress indicator */}
            {status !== "complete" && status !== "error" && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <p className="text-[9px] sm:text-xs text-[var(--color-text-muted)] leading-none">Question</p>
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                    {questionNumber} <span className="text-[var(--color-text-muted)] font-normal">/ {maxQuestions}</span>
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-16 sm:w-24 h-1.5 bg-[var(--color-surface-subtle)] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(questionNumber / maxQuestions) * 100}%`,
                      background: "linear-gradient(90deg, var(--color-brand-500), var(--color-accent-500))",
                    }}
                  />
                </div>
              </div>
            )}

            {status === "complete" && (
              <span
                className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border font-semibold"
                style={{ borderColor: "var(--color-success)", color: "var(--color-success)" }}
              >
                ✓ Complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── MESSAGE LIST: TEXT OR COMPLETED MODE ── */}
      {(mode === "text" || status === "complete") && (
        <div className="flex-1 overflow-y-auto px-6 py-6 relative grid-bg">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Initial loading state */}
            {status === "idle" && (
              <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-3">
                  <div
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center animate-pulse-slow"
                    style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-accent-500))" }}
                  >
                    <span className="text-white text-xl">🎯</span>
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm font-medium">Preparing your interview...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="glass-card p-5 border-[var(--color-danger)] border-opacity-50" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
                <p className="text-red-400 font-semibold mb-1">⚠️ Connection Error</p>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">{errorMessage}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Make sure the Python backend is running on port 8000.
                </p>
                <button onClick={startInterview} className="btn-primary text-sm mt-4 py-2">
                  Retry
                </button>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                onReplay={mode === "voice" ? (text) => speakText(text) : undefined}
              />
            ))}

            {/* AI typing indicator */}
            {status === "loading" && <TypingIndicator />}

            {/* Feedback card */}
            {status === "complete" && feedbackContent && (
              <FeedbackCard content={feedbackContent} />
            )}

            {/* Invisible scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── IMMERSIVE VOICE STUDIO VIEW ── */}
      {mode === "voice" && status !== "complete" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 p-4 sm:p-6 overflow-y-auto md:overflow-hidden max-w-6xl w-full mx-auto animate-fade-up">
          {/* Left panel: Animated Avatar & Live Question */}
          <div className="flex-none md:flex-1 flex flex-col items-center justify-center glass-card p-5 sm:p-8 text-center space-y-4 sm:space-y-6 relative overflow-hidden border border-[var(--color-surface-border)] shadow-md w-full">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-accent-400)]" />
            
            {/* Holographic Interactive Orb */}
            <div className="relative w-36 h-36 md:w-48 md:h-48 flex items-center justify-center">
              {/* Sonar pulses for listening */}
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 md:w-40 md:h-40 rounded-full bg-[var(--color-brand-400)] opacity-20 animate-ping" />
                  <div className="absolute w-36 h-36 md:w-48 md:h-48 rounded-full bg-[var(--color-accent-400)] opacity-10 sonar-ring" />
                </>
              )}
              
              {/* Dynamic visual orb container */}
              <div 
                className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 shadow-xl ${
                  status === "loading"
                    ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin"
                    : isListening
                    ? "bg-gradient-to-tr from-emerald-400 via-teal-500 to-cyan-600 shadow-[0_0_40px_rgba(0,216,255,0.45)]"
                    : "bg-gradient-to-tr from-[var(--color-brand-500)] via-[var(--color-brand-600)] to-[var(--color-accent-500)]"
                }`}
                style={{
                  animation: status === "loading" ? "spin 6s linear infinite" : "float 4s ease-in-out infinite"
                }}
              >
                {/* SVG/CSS avatar icon or face mesh */}
                <div className="absolute inset-2 bg-[var(--color-surface-raised)] rounded-full flex items-center justify-center border border-[var(--color-surface-border)] shadow-inner">
                  <div className="relative w-full h-full flex items-center justify-center">
                    
                    {/* Glowing center orb */}
                    <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full transition-all duration-500 ${
                      status === "loading"
                        ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] scale-90 animate-pulse"
                        : isListening
                        ? "bg-[var(--color-success)] shadow-[0_0_15px_rgba(0,255,102,0.8)] scale-115"
                        : "bg-[var(--color-brand-500)] shadow-[0_0_15px_rgba(0,216,255,0.8)]"
                    }`} />
                    
                    {/* Floating virtual orbits */}
                    <div className="absolute border border-dashed border-[var(--color-brand-500)]/30 rounded-full w-16 h-16 md:w-24 md:h-24 animate-[spin_12s_linear_infinite]" />
                    <div className="absolute border border-dotted border-[var(--color-success)]/30 rounded-full w-20 h-20 md:w-28 md:h-28 animate-[spin_20s_linear_infinite_reverse]" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]/50 text-[10px] sm:text-xs font-mono font-semibold shadow-sm">
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                status === "loading"
                  ? "bg-purple-500 animate-pulse"
                  : isListening
                  ? "bg-[var(--color-success)] animate-ping"
                  : "bg-emerald-500"
              }`} />
              {status === "loading" ? "AI is thinking..." : isListening ? "Microphone active — speaking" : "AI Interviewer (Idle)"}
            </div>

            {/* AI Question display */}
            <div className="w-full max-w-xl space-y-1 sm:space-y-2">
              <h3 className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)] font-display">[ Current Question ]</h3>
              <p className="text-sm sm:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed font-display px-2 sm:px-4">
                {lastAssistantMessage?.content || "Getting ready..."}
              </p>
            </div>
          </div>

          {/* Right panel: Response Draft, Speech controls */}
          <div className="w-full md:w-[450px] flex flex-col gap-4 shrink-0">
            
            {/* Draft response area */}
            <div className="glass-card p-6 flex-1 flex flex-col justify-between space-y-4 border border-[var(--color-surface-border)] shadow-md">
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] font-display">[ Your Response ]</h3>
                  
                  {/* Replay voice button */}
                  <button
                    onClick={() => {
                      if (lastAssistantMessage) speakText(lastAssistantMessage.content);
                    }}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-brand-500)] flex items-center gap-1 transition-colors font-mono font-bold"
                    title="Replay the question"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                    Replay Question
                  </button>
                </div>
                
                <textarea
                  id="voice-answer-input"
                  value={answer + (interimTranscript ? (answer ? " " : "") + interimTranscript : "")}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (isListening) stopListening();
                  }}
                  placeholder="Start speaking, your transcribed speech will appear here. Or type your response..."
                  className="form-input flex-1 min-h-[180px] text-sm resize-none focus:ring-2 focus:ring-brand-500 bg-[var(--color-surface-raised)]/50 border-[var(--color-surface-border)]"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                {/* Micro toggle */}
                <button
                  onClick={toggleMicrophone}
                  disabled={status === "loading" || !speechSupported}
                  className={`flex-1 btn-ghost py-3 text-sm justify-center font-bold border-2 ${
                    isListening
                      ? "border-[var(--color-danger)] text-[var(--color-danger)] bg-red-500/10 hover:bg-red-500/20"
                      : "border-[var(--color-surface-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]/15"
                  }`}
                >
                  {isListening ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)] animate-pulse mr-1" />
                      Pause Mic
                    </>
                  ) : (
                    <>🎙️ Speak Answer</>
                  )}
                </button>
                
                {/* Submit button */}
                <button
                  onClick={submitAnswer}
                  disabled={status === "loading" || !(answer.trim() || interimTranscript.trim())}
                  className="flex-1 btn-primary py-3 text-sm justify-center font-bold"
                >
                  {status === "loading" ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Submit Response</>
                  )}
                </button>
              </div>

              {micError && (
                <p className="text-xs text-[var(--color-danger)] font-semibold text-center mt-2">
                  ⚠️ {micError}
                </p>
              )}
            </div>

            {/* Voice Settings card */}
            <div className="glass-card p-5 space-y-4 border border-[var(--color-surface-border)] shadow-md">
              <h4 className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-muted)] border-b border-[var(--color-surface-border)] pb-2">
                Voice Settings
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-[var(--color-text-secondary)]">
                {/* Mute toggle */}
                <div className="flex flex-col gap-1.5 font-mono">
                  <span>Audio Playback:</span>
                  <button
                    onClick={toggleMute}
                    className={`px-3 py-2 rounded border text-left transition-all font-bold flex items-center gap-1.5 text-xs ${
                      isMuted 
                        ? "border-[var(--color-warning)] bg-[var(--color-warning)]/10 text-[var(--color-text-primary)]"
                        : "border-[var(--color-surface-border)] bg-[var(--color-surface-raised)]/50 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-subtle)]/20"
                    }`}
                  >
                    {isMuted ? "🔇 Muted" : "🔊 Audio On"}
                  </button>
                </div>

                {/* Speed toggle */}
                <div className="flex flex-col gap-1.5 font-mono">
                  <span>Speaking Speed:</span>
                  <select
                    value={speechSpeed}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    className="form-select text-xs py-2 bg-[var(--color-surface-raised)]/50 border-[var(--color-surface-border)] text-[var(--color-text-primary)]"
                  >
                    <option value="0.8">0.8x (Slow)</option>
                    <option value="0.9">0.9x</option>
                    <option value="1.0">1.0x (Normal)</option>
                    <option value="1.1">1.1x</option>
                    <option value="1.2">1.2x (Fast)</option>
                  </select>
                </div>
              </div>

              {/* Voice selector */}
              {voices.length > 0 && (
                <div className="flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)] font-mono">
                  <span>AI Voice Engine:</span>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => setSelectedVoiceName(e.target.value)}
                    className="form-select text-xs py-2 bg-[var(--color-surface-raised)]/50 border-[var(--color-surface-border)] text-[var(--color-text-primary)] w-full truncate"
                  >
                    {voices
                      .filter((v) => v.lang.startsWith("en"))
                      .map((v) => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── INPUT AREA: TEXT MODE ── */}
      {mode === "text" && (status === "waiting" || status === "loading") && (
        <div className="shrink-0 glass-card rounded-none border-x-0 border-b-0 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="answer-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={status === "loading"}
                placeholder="Type your answer... (⌘+Enter to submit)"
                rows={3}
                className="form-input resize-none pr-24 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-surface-raised)]/50 border-[var(--color-surface-border)]"
                style={{ paddingBottom: "1rem" }}
              />
              <button
                onClick={submitAnswer}
                disabled={status === "loading" || !answer.trim()}
                id="submit-answer-btn"
                className="absolute right-3 bottom-3 btn-primary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                {status === "loading" ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send</>
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Answer naturally. The AI will ask follow-up questions based on your response.
            </p>
          </div>
        </div>
      )}

      {/* ── POST-INTERVIEW ACTIONS ── */}
      {status === "complete" && (
        <div className="shrink-0 glass-card rounded-none border-x-0 border-b-0 px-6 py-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 font-mono">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              Compiling evaluation report... Redirecting shortly.
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className="btn-primary text-xs py-2 px-4"
              >
                {isRestarting ? "Clearing..." : "🔄 Restart Interview"}
              </button>
              <a href="/" className="btn-ghost text-xs py-2 px-4">
                [ Back to Home ]
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
