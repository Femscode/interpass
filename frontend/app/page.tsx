/*
  🎓 SERVER COMPONENT (no "use client" at top)
*/

import Link from "next/link";

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CyberInterviewerHud() {
  return (
    <div className="relative w-full max-w-[560px] aspect-[1.3] rounded-xl border-4 border-slate-900 bg-slate-950 p-4 shadow-[10px_10px_0px_rgba(9,13,22,1)] overflow-hidden flex flex-col justify-between" style={{ animation: "float 6s ease-in-out infinite" }}>
      {/* Scanline / CRT overlay */}
      <div className="scanlines-overlay" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-brand-500) 1.5px, transparent 1.5px)", backgroundSize: "20px 20px" }} />

      {/* Cyber screen header */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          {/* Mock Window Controls */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-500)] opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] opacity-80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)] opacity-80" />
          </div>
          <span className="text-[10px] font-mono font-black text-slate-400 tracking-wider ml-1 uppercase">[ INTERVIEW_HUD // ACTIVE ]</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-red-500/30 rounded bg-red-950/20 text-[9px] font-mono font-black text-red-500 tracking-widest uppercase animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          REC 🔴 00:03:42
        </div>
      </div>

      {/* Grid Panel Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
        {/* Left 2 Cols: AI Interviewer Host Screen */}
        <div className="md:col-span-2 border border-slate-850 rounded p-3 bg-slate-900/40 flex flex-col justify-between relative overflow-hidden">
          {/* Scanner Line Sweep */}
          <div className="absolute left-0 right-0 h-[1.5px] bg-[var(--color-brand-500)]/30 opacity-70 pointer-events-none"
            style={{ animation: "scanner-sweep 4s linear infinite" }} />

          <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>FEED_ID: AI_INTERVIEWER</span>
            <span>FPS: 60.00</span>
          </div>

          {/* AI Host Holographic Graphic */}
          <div className="py-2 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Rotating outer ring */}
              <div
                className="absolute inset-0 border border-dashed border-slate-850 rounded-full"
                style={{ animation: "orbit-clockwise 20s linear infinite" }}
              />
              {/* Concentric rotating middle ring */}
              <div
                className="absolute inset-2 border border-slate-700 rounded-full border-t-[var(--color-brand-500)] border-b-[var(--color-brand-500)] animate-spin"
                style={{ animationDuration: "12s" }}
              />
              {/* Spinning inner scanner target */}
              <div
                className="absolute inset-4 border border-[var(--color-success)]/40 rounded-full border-l-transparent border-r-transparent"
                style={{ animation: "orbit-counter 3s linear infinite" }}
              />
              {/* Core light and sonar pulses */}
              <div className="absolute inset-7 border border-slate-800 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-[var(--color-brand-500)] flex items-center justify-center shadow-[0_0_12px_rgba(0,216,255,0.4)] animate-pulse">
                  <div className="w-2.5 h-2.5 bg-[var(--color-brand-500)] rounded-full animate-ping" />
                </div>
              </div>
            </div>

            {/* Holographic speech wave display below AI Host */}
            <div className="w-full max-w-[180px] mt-2 opacity-80">
              <svg viewBox="0 0 200 40" className="w-full h-7">
                <path
                  d="M 0,20 Q 15,5 30,20 T 60,20 T 90,20 T 120,20 T 150,20 T 180,20 T 200,20"
                  fill="none"
                  stroke="var(--color-brand-500)"
                  strokeWidth="2"
                  style={{
                    animation: "waveform-pulse 1.8s ease-in-out infinite",
                    transformOrigin: "center",
                  }}
                />
                <path
                  d="M 0,20 Q 15,35 30,20 T 60,20 T 90,20 T 120,20 T 150,20 T 180,20 T 200,20"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="1.2"
                  opacity="0.4"
                  style={{
                    animation: "waveform-pulse 2.3s ease-in-out infinite reverse",
                    transformOrigin: "center",
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Interviewer Speech Text Bubble */}
          <div className="border border-slate-850 rounded bg-slate-950 p-2 text-[10px] font-mono text-slate-300 leading-normal min-h-[46px]">
            <span className="text-[var(--color-brand-500)] font-black">AI_INTERVIEWER // </span>
            <span className="relative">
              Describe a scenario where you had to debug a complex race condition in production. What steps did you take?
              <span className="inline-block w-1.5 h-3 bg-[var(--color-brand-500)] ml-1 align-middle" style={{ animation: "cursor-blink 1s steps(2, start) infinite" }} />
            </span>
          </div>
        </div>

        {/* Right 1 Col: Candidate Speech telemetry & Audio bars */}
        <div className="border border-slate-850 rounded p-3 bg-slate-900/40 flex flex-col justify-between">
          <div className="text-[9px] font-mono text-slate-500 flex justify-between">
            <span>USER_AUDIO: MIC_01</span>
            <span className="text-[var(--color-success)] animate-pulse">STREAMING</span>
          </div>

          {/* Candidate Speech Spectrum (8 bars bouncing) */}
          <div className="flex items-end justify-center gap-1.5 h-16 px-2 py-1.5 border border-slate-850 rounded bg-slate-950/80 my-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const heightPercent = [35, 75, 45, 90, 60, 80, 50, 95][i];
              const delay = `${i * 0.08}s`;
              return (
                <div
                  key={i}
                  className="w-2 bg-[var(--color-success)] rounded-t shadow-[0_0_8px_var(--color-success)]"
                  style={{
                    height: `${heightPercent}%`,
                    animation: `spectral-bounce 1s ease-in-out infinite alternate`,
                    animationDelay: delay,
                  }}
                />
              );
            })}
          </div>

          {/* Telemetry Stats List */}
          <div className="space-y-1.5 font-mono text-[9px] border-t border-slate-850 pt-2 text-slate-400">
            <div className="flex justify-between">
              <span>PACE_RATE:</span>
              <span className="text-white font-bold">134 WPM</span>
            </div>
            <div className="flex justify-between">
              <span>VOCAB_DEPTH:</span>
              <span className="text-[var(--color-brand-500)] font-bold">EXCELLENT</span>
            </div>
            <div className="flex justify-between">
              <span>CONFIDENCE:</span>
              <span className="text-[var(--color-success)] font-bold">OPTIMAL</span>
            </div>
            <div className="flex justify-between border-t border-slate-850/50 pt-1 mt-1 text-[8px] text-slate-500">
              <span>ENGINE:</span>
              <span className="text-slate-400 font-bold">WHISPER_LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Console System Status Footer bar */}
      <div className="relative z-10 border-t border-slate-850 pt-2 mt-2 flex justify-between items-center text-[8px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          <span>DB_LINK: SQLITE_ACTIVE</span>
        </div>
        <span>BITRATE: 48.0 KHZ</span>
        <span>VER: v1.3.0</span>
      </div>

      {/* Local keyframes style injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes orbit-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(0.7) translateY(0); }
          50% { transform: scaleY(1.3) translateY(-1px); }
        }
        @keyframes spectral-bounce {
          0% { height: 10%; }
          100% { height: 85%; }
        }
        @keyframes scanner-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}} />
    </div>
  );
}

const steps = [
  { number: "[01]", title: "Select Company & Role", desc: "Define company, role, seniority, and interview focus." },
  { number: "[02]", title: "Immersive Interaction", desc: "Speak answers verbally or type. The AI interviewer responds dynamically." },
  { number: "[03]", title: "Live Transcripts", desc: "Review real-time speech transcripts and interact seamlessly." },
  { number: "[04]", title: "Deep Evaluation", desc: "Get granular, constructive feedback on your performance." },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden min-h-screen bg-[var(--color-surface-base)] selection:bg-slate-900 selection:text-white">
      {/* Ambient, subtle elegant backdrops */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full pointer-events-none opacity-[0.08] blur-[120px]" style={{ background: "radial-gradient(circle, var(--color-accent-400) 0%, transparent 80%)" }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.08] blur-[120px]" style={{ background: "radial-gradient(circle, var(--color-success) 0%, transparent 80%)" }} />

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain rounded-lg border-2 border-slate-900 bg-slate-950 shadow-md" />
          <span className="text-2xl font-black text-slate-950 tracking-tight font-display">InterPass</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#how-it-works" className="text-sm font-bold text-slate-900 hover:text-slate-950 transition-colors uppercase tracking-wider">[ How it works ]</a>
          <Link href="/setup" className="btn-primary text-sm font-bold">
            Start Practice
          </Link>
        </div>

        <Link href="/setup" className="md:hidden btn-primary text-sm font-bold">
          Start
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-32 px-6 md:px-12 max-w-[1400px] mx-auto font-mono">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Hero text */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-md border-2 border-slate-900 bg-[var(--color-surface-raised)] shadow-[3px_3px_0px_rgba(9,13,22,1)] text-xs font-bold text-slate-900 animate-fade-up">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              An Open Source AI Powered Interview System
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[75px] font-black tracking-tighter leading-[0.95] text-slate-950 animate-fade-up animation-delay-100 font-display">
              Master the <br />
              <span className="text-slate-950 border-b-4 border-slate-950 pb-2 inline-block">Interview.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-900 leading-relaxed max-w-xl font-bold animate-fade-up animation-delay-200">
              [ Stop guessing. Experience hyper-realistic, adaptive mock interviews engineered for top tech roles. ]
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-6 w-full sm:w-auto animate-fade-up animation-delay-300">
              <Link href="/setup" className="w-full sm:w-auto btn-primary text-lg px-10 py-5 justify-center">
                Launch Studio <ArrowRightIcon />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto btn-ghost text-lg px-8 py-5 justify-center">
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero graphic */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-fade-up animation-delay-200">
            <CyberInterviewerHud />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-32 px-6 md:px-12 bg-[var(--color-surface-raised)] border-t-2 border-slate-900 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto">
          {/* Grid background on this section too */}
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

          <div className="text-center mb-24 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-6 font-display">
              Simplicity Meets <span className="border-b-4 border-slate-950">Power</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="bg-[var(--color-surface-base)] p-10 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_rgba(9,13,22,1)] hover:-translate-y-1.5 hover:shadow-[6px_6px_0px_rgba(9,13,22,1)] hover:border-[var(--color-brand-500)] transition-all duration-200 group relative overflow-hidden"
              >
                {/* Huge background number */}
                <div className="absolute -right-6 -top-10 text-[130px] font-black text-slate-900/5 group-hover:text-cyan-500/5 transition-colors duration-300 pointer-events-none select-none z-0 font-display">
                  {step.number}
                </div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-lg mb-8 group-hover:bg-[var(--color-accent-400)] group-hover:text-slate-950 border-2 border-slate-950 transition-all duration-200 font-display">
                    {step.number.replace("[", "").replace("]", "")}
                  </div>
                  <h3 className="text-xl font-black text-slate-950 mb-4 group-hover:text-slate-800 transition-colors uppercase tracking-wider font-display">
                    {step.title}
                  </h3>
                  <p className="text-slate-900 font-bold leading-relaxed text-sm">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODALITIES SECTION ── */}
      <section id="modalities" className="relative z-10 py-32 px-6 md:px-12 bg-[var(--color-surface-base)] border-t-2 border-slate-900">
        <div className="max-w-[1400px] mx-auto font-mono">
          {/* Grid Background */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          <div className="text-center mb-24 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-6 font-display">
              Choose how to <span className="border-b-4 border-slate-950">practice</span>
            </h2>
            <p className="text-slate-900 font-bold text-sm max-w-xl mx-auto uppercase">
              [ practice in text, speech, or video ]
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Text Mode */}
            <div className="glass-card p-10 flex flex-col justify-between hover:translate-y-[-4px] hover:border-[var(--color-brand-500)] transition-all">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-lg bg-slate-950 text-[var(--color-accent-500)] flex items-center justify-center border-2 border-slate-900">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M6 8h4M6 12h8M6 16h5" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold border border-slate-900 px-2 py-0.5 rounded bg-slate-900/5 text-slate-800">[ INPUT: KEYBOARD ]</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 mb-4 font-display">Text Practice</h3>
                <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6 font-sans">
                  Practice by typing your answers. Take your time to write clear, structured descriptions and refine your answers at your own pace.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-xs font-mono font-black text-[var(--color-accent-600)] tracking-widest uppercase">
                  [ Active ]
                </div>
                <Link href="/setup?mode=text" className="inline-flex items-center justify-between text-xs font-mono font-black text-slate-950 border border-slate-900 rounded bg-slate-900/5 hover:bg-slate-950 hover:text-white transition-all px-3 py-1.5 uppercase">
                  <span>[ LAUNCH TEXT MODE ]</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Speech Mode */}
            <div className="glass-card p-10 flex flex-col justify-between hover:translate-y-[-4px] hover:border-[var(--color-success)] transition-all">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-lg bg-slate-950 text-[var(--color-success)] flex items-center justify-center border-2 border-slate-900">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold border border-[var(--color-success)] px-2 py-0.5 rounded bg-[var(--color-success)]/10 text-emerald-950">[ INPUT: AUDIO_LINK ]</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 mb-4 font-display">Speech Practice</h3>
                <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6 font-sans">
                  Practice verbally. The AI interviewer reads the questions aloud, and you respond using your microphone with instant text transcriptions.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-xs font-mono font-black text-[var(--color-success)] tracking-widest uppercase">
                  [ Active ]
                </div>
                <Link href="/setup?mode=speech" className="inline-flex items-center justify-between text-xs font-mono font-black text-slate-950 border border-slate-900 rounded bg-slate-900/5 hover:bg-slate-950 hover:text-white transition-all px-3 py-1.5 uppercase">
                  <span>[ LAUNCH SPEECH MODE ]</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Video Mode */}
            <div className="glass-card p-10 flex flex-col justify-between opacity-75 hover:translate-y-[-4px] transition-transform">
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-lg bg-slate-900 text-slate-500 flex items-center justify-center border-2 border-slate-800">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold border border-[var(--color-warning)] px-2 py-0.5 rounded bg-[var(--color-warning)]/10 text-amber-950">[ INPUT: CAMERA_STREAM ]</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950 mb-4 font-display">Video Practice</h3>
                <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6 font-sans">
                  Simulate real face-to-face interviews. Turn on your camera to monitor eye contact, screen positioning, and body language while you present.
                </p>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="text-xs font-mono font-black text-[var(--color-warning)] tracking-widest uppercase">
                  [ Coming Soon ]
                </div>
                <div className="inline-flex items-center justify-between text-xs font-mono font-black text-slate-500 border border-slate-300 rounded bg-slate-100/50 px-3 py-1.5 uppercase cursor-not-allowed select-none">
                  <span>[ VIDEO SYSTEM STANDBY ]</span>
                  <span>🔒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIAGNOSTICS & RESOURCES SECTION ── */}
      <section id="diagnostics" className="relative z-10 py-32 px-6 md:px-12 bg-[var(--color-surface-raised)] border-t-2 border-slate-900">
        <div className="max-w-[1400px] mx-auto animate-fade-up">
          {/* Grid Background */}
          <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
            {/* Left side text */}
            <div className="w-full lg:w-1/2 space-y-6 text-left font-mono">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 font-display">
                Detailed <span className="border-b-4 border-slate-950">Reports</span> <br /> & Resources
              </h2>
              <p className="text-slate-900 font-bold text-base leading-relaxed font-sans">
                InterPass evaluates your answers for correctness and communication style. The AI identifies specific areas where you struggled and shares target study resources—like documentation, guides, and reference code—to help you get ready for real interviews.
              </p>
              <div className="pt-4">
                <Link href="/setup" className="btn-primary">
                  Try Practice Studio
                </Link>
              </div>
            </div>

            {/* Right side graphic simulating report folder */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-[480px] bg-slate-950 text-[#00ff66] font-mono border-2 border-slate-900 rounded-md shadow-[8px_8px_0px_rgba(9,13,22,1)] overflow-hidden flex flex-col">
                <div className="scanlines-overlay" />

                {/* Window Title Bar */}
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500/80" />
                      <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                      <span className="w-2 h-2 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-slate-400 font-bold ml-1 uppercase">[ CANDIDATE_REPORT_CONSOLE ]</span>
                  </div>
                  <span className="text-[9px] text-slate-500">[ SYSTEM // REPORT ]</span>
                </div>

                {/* Simulated Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-900/50 text-[10px] text-slate-400">
                  <span className="px-4 py-1.5 border-r border-slate-800 bg-slate-950 text-[var(--color-brand-500)] font-bold">[01. SCORE]</span>
                  <span className="px-4 py-1.5 border-r border-slate-800 hover:text-white transition-colors cursor-pointer">[02. STRENGTHS]</span>
                  <span className="px-4 py-1.5 border-r border-slate-800 hover:text-white transition-colors cursor-pointer">[03. STUDY]</span>
                </div>

                {/* Tab Content Body */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-bold block">OVERALL READINESS:</span>
                      <span className="text-slate-400 text-[10px]">EVALUATION ACCURACY: 99.4%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[var(--color-brand-500)] font-display">88%</span>
                      <span className="text-slate-500 text-[9px] block">[ GRADE: B+ ]</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded overflow-hidden border border-slate-800">
                    <div className="bg-[var(--color-brand-500)] h-full w-[88%] shadow-[0_0_8px_var(--color-brand-500)]" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="border-t border-slate-850 pt-2.5">
                      <span className="text-white font-bold block uppercase">[ WEAKNESS_ANALYSIS ]</span>
                      <p className="mt-1 text-slate-300 leading-relaxed text-[11px] font-sans">
                        ↳ Candidate struggled with distributed database sharding mechanisms and consensus protocols under network partitions.
                      </p>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5 text-[#00d8ff]">
                      <span className="text-white font-bold block uppercase">[ REQUISITE_STUDY ]</span>
                      <p className="mt-1 text-slate-300 leading-relaxed text-[11px] font-sans">
                        ↳ Chapter 5 (Replication) & Chapter 6 (Partitioning) of <span className="underline italic text-white">Designing Data-Intensive Applications</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-850 pt-2.5 text-[#ffb000]">
                      <span className="text-white font-bold block uppercase">[ ACTION_PLAN_RESOURCES ]</span>
                      <ul className="mt-1.5 space-y-1 text-slate-400 text-left text-[11px] font-sans">
                        <li className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-[var(--color-success)] font-mono font-bold">✓</span> Raft Consensus protocol specifications & diagrams
                        </li>
                        <li className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-[var(--color-success)] font-mono font-bold">✓</span> Hands-on Go/Rust consensus sample models
                        </li>
                        <li className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-[var(--color-success)] font-mono font-bold">✓</span> PostgreSQL logical replication reference docs
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SYSTEM ARCHITECTURE & OPEN SOURCE ── */}
      <section id="architecture" className="relative z-10 py-32 px-6 md:px-12 bg-[var(--color-surface-base)] border-t-2 border-slate-900">
        <div className="max-w-[1400px] mx-auto">
          {/* Grid Background */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          <div className="text-center mb-20 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 mb-6 font-display">
              System <span className="border-b-4 border-slate-950">Architecture</span>
            </h2>
            <p className="text-slate-900 font-bold text-sm max-w-xl mx-auto uppercase">
              [ Built with modern stable tech ]
            </p>
          </div>

          {/* Architecture stack details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 mb-20">
            {/* Next.js Module */}
            <div className="bg-[var(--color-surface-raised)] border-2 border-slate-900 p-8 rounded-lg shadow-[4px_4px_0px_rgba(9,13,22,1)] hover:-translate-y-1 hover:border-[var(--color-brand-500)] hover:shadow-[6px_6px_0px_rgba(9,13,22,1)] transition-all">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <h3 className="text-xl font-black text-slate-950 font-display">Next.js</h3>
                </div>
                <span className="text-[8px] font-mono border border-slate-900 px-1.5 py-0.5 bg-slate-900/5 rounded">[ V15_APP_ROUTER ]</span>
              </div>
              <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6">
                Next.js builds a fast, clean interface with smooth page loads and page-load optimizations.
              </p>
              <div className="border border-slate-900/20 bg-slate-900/5 rounded p-2.5 text-[9px] font-mono text-slate-800">
                <div className="flex justify-between border-b border-slate-900/10 pb-1 mb-1">
                  <span>SERVER: Compiles UI Layouts</span>
                  <span className="text-[var(--color-success)] font-bold">● ONLINE</span>
                </div>
                <div>CLIENT: Interactive Microphone & Speech Stream</div>
              </div>
            </div>

            {/* FastAPI Module */}
            <div className="bg-[var(--color-surface-raised)] border-2 border-slate-900 p-8 rounded-lg shadow-[4px_4px_0px_rgba(9,13,22,1)] hover:-translate-y-1 hover:border-[var(--color-success)] hover:shadow-[6px_6px_0px_rgba(9,13,22,1)] transition-all font-sans">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐍</span>
                  <h3 className="text-xl font-black text-slate-950 font-display">FastAPI</h3>
                </div>
                <span className="text-[8px] font-mono border border-slate-900 px-1.5 py-0.5 bg-slate-900/5 rounded text-slate-900 font-bold">[ ASYNC_CORE ]</span>
              </div>
              <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6">
                FastAPI powers our fast Python backend, delivering instant responses and quick calculations.
              </p>
              <div className="border border-slate-900/20 bg-slate-900/5 rounded p-2.5 text-[9px] font-mono text-slate-800">
                <div className="flex justify-between border-b border-slate-900/10 pb-1 mb-1">
                  <span>ENDPOINT: /api/interview</span>
                  <span className="text-[var(--color-brand-500)] font-bold">● ACTIVE</span>
                </div>
                <div>STREAMING: Real-time text & score generation</div>
              </div>
            </div>

            {/* LangGraph Module */}
            <div className="bg-[var(--color-surface-raised)] border-2 border-slate-900 p-8 rounded-lg shadow-[4px_4px_0px_rgba(9,13,22,1)] hover:-translate-y-1 hover:border-[var(--color-warning)] hover:shadow-[6px_6px_0px_rgba(9,13,22,1)] transition-all font-sans">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🕸️</span>
                  <h3 className="text-xl font-black text-slate-950 font-display">LangGraph</h3>
                </div>
                <span className="text-[8px] font-mono border border-slate-900 px-1.5 py-0.5 bg-slate-900/5 rounded text-slate-900 font-bold">[ STATE_FLOW ]</span>
              </div>
              <p className="text-slate-900 font-bold text-sm leading-relaxed mb-6">
                LangGraph handles the conversational state, letting the AI ask natural, custom follow-up questions.
              </p>
              <div className="border border-slate-900/20 bg-slate-900/5 rounded p-2.5 text-[9px] font-mono text-slate-800">
                <div className="flex justify-between border-b border-slate-900/10 pb-1 mb-1">
                  <span>GRAPH NODE: Interview Session</span>
                  <span className="text-[var(--color-success)] font-bold">● READY</span>
                </div>
                <div>STATE: Persistent candidate discussion context</div>
              </div>
            </div>
          </div>

          {/* Open source invite */}
          <div className="glass-card p-12 text-center max-w-3xl mx-auto relative overflow-hidden z-10 border-2 border-slate-900">
            <h3 className="text-3xl font-black text-slate-950 mb-4 font-display">Join the Open Source Community</h3>
            <p className="text-slate-900 font-bold text-sm leading-relaxed mb-8">
              InterPass is built completely in the open. We invite developers, designers, and creators to help improve our system, suggest updates, and contribute on GitHub.
            </p>
            <a
              href="https://github.com/Femscode/interpass.git"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary py-4 px-10"
            >
              [ VIEW PROJECT ON GITHUB ]
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[var(--color-surface-raised)] py-12 px-6 md:px-12 border-t-2 border-slate-900">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-900 bg-slate-950 shadow-sm" />
            <span className="text-lg font-bold text-slate-950 tracking-tight font-display">InterPass</span>
          </div>
          <p className="text-sm font-bold text-slate-900">
            [ Engineered for excellence ]
          </p>
        </div>
      </footer>
    </main>
  );
}
