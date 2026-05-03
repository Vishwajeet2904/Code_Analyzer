import { useNavigate } from "react-router";
import {
  Shield,
  Zap,
  Code2,
  GitPullRequest,
  BarChart3,
  Lock,
  AlertTriangle,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  Globe,
  TrendingUp,
  Terminal,
} from "lucide-react";

const codeSnippet = [
  { ln: 1, code: `const getUserData = async (userId) => {`, type: "normal" },
  { ln: 2, code: `  const query = "SELECT * FROM users`, type: "vulnerable", issue: "SQL Injection" },
  { ln: 3, code: `    WHERE id = " + userId;`, type: "vulnerable", issue: "SQL Injection" },
  { ln: 4, code: `  const result = await db.query(query);`, type: "warning", issue: "Unvalidated Input" },
  { ln: 5, code: `  return result.rows[0];`, type: "normal" },
  { ln: 6, code: `};`, type: "normal" },
  { ln: 7, code: ``, type: "normal" },
  { ln: 8, code: `app.post('/login', async (req, res) => {`, type: "normal" },
  { ln: 9, code: `  const { user, pass } = req.body;`, type: "normal" },
  { ln: 10, code: `  const token = jwt.sign({user}, 'secret');`, type: "warning", issue: "Weak Secret" },
  { ln: 11, code: `  res.json({ token });`, type: "normal" },
  { ln: 12, code: `});`, type: "normal" },
];

const features = [
  {
    icon: Shield,
    color: "#ef4444",
    label: "Security Scanning",
    desc: "Detect SQL injection, XSS, CSRF, and 200+ vulnerability patterns automatically.",
  },
  {
    icon: Code2,
    color: "#6366f1",
    label: "Code Quality Analysis",
    desc: "Identify code smells, complexity issues, and technical debt in real time.",
  },
  {
    icon: Sparkles,
    color: "#22d3ee",
    label: "AI Refactoring",
    desc: "Get instant, production-ready fix suggestions powered by advanced AI models.",
  },
  {
    icon: GitPullRequest,
    color: "#a855f7",
    label: "PR Bot Integration",
    desc: "Automatic code review comments on every GitHub/GitLab pull request.",
  },
  {
    icon: BarChart3,
    color: "#22c55e",
    label: "Developer Analytics",
    desc: "Track quality trends, security debt evolution, and team performance over time.",
  },
  {
    icon: Globe,
    color: "#f59e0b",
    label: "Multi-Language Support",
    desc: "JavaScript, Python, Go, Java, TypeScript, Rust, and 40+ more languages.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO @ Finova",
    avatar: "SC",
    color: "#6366f1",
    text: "CodeGuardian caught a critical SQL injection vulnerability hours before our production deploy. It saved us from a potential data breach.",
    stars: 5,
  },
  {
    name: "Marcus Webb",
    role: "Lead Engineer @ ByteStack",
    avatar: "MW",
    color: "#22d3ee",
    text: "The AI fix suggestions are incredibly accurate. Our code quality score went from 63 to 94 in just two sprints.",
    stars: 5,
  },
  {
    name: "Priya Nair",
    role: "Security Architect @ CloudSafe",
    avatar: "PN",
    color: "#a855f7",
    text: "Best security analysis tool I've used. The context-aware explanations help junior devs actually understand why something is a vulnerability.",
    stars: 5,
  },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#050510", fontFamily: "'Inter', sans-serif", color: "white" }}>
      {/* Navbar */}
      <nav
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4"
        style={{
          background: "rgba(5,5,16,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
          >
            <Shield size={18} className="text-white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.3px" }}>
            CodeGuardian <span style={{ color: "#22d3ee" }}>AI</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Security", "Pricing", "Docs"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm transition-colors"
              style={{ color: "#9ca3af" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-4 py-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: "#9ca3af" }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="text-sm px-5 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 600 }}
          >
            Start Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 lg:px-12 overflow-hidden">
        {/* Background glow effects */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "#6366f1" }}
        />
        <div
          className="absolute top-40 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: "#22d3ee" }}
        />

        <div className="max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#a5b4fc",
              }}
            >
              <Sparkles size={12} />
              <span style={{ fontWeight: 600 }}>Powered by Groq LLaMA 3.3 · 200+ Vulnerability Patterns</span>
            </div>
          </div>

          <div className="text-center mb-16">
            <h1
              className="mb-6"
              style={{
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-2px",
                background: "linear-gradient(135deg, #fff 40%, #22d3ee 70%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Code Quality &<br />Security Reviewer
            </h1>
            <p
              className="max-w-2xl mx-auto mb-10"
              style={{ fontSize: "18px", color: "#9ca3af", lineHeight: 1.7 }}
            >
              Detect vulnerabilities, improve code quality, and ship secure software faster with AI.
              Like Grammarly, but for your source code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/app")}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "0 0 40px rgba(99,102,241,0.4)",
                }}
              >
                <Zap size={18} />
                Start Review — It's Free
              </button>
              <button
                onClick={() => navigate("/app")}
                className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all hover:bg-white/10"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#e5e7eb",
                }}
              >
                Try Demo
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 mt-10">
              {[
                { label: "50K+", sub: "Developers" },
                { label: "2.4M+", sub: "Issues Fixed" },
                { label: "99.7%", sub: "Accuracy" },
              ].map(({ label, sub }) => (
                <div key={sub} className="text-center">
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#22d3ee" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual: Code Editor + AI Panel */}
          <div className="flex flex-col lg:flex-row gap-4 max-w-5xl mx-auto">
            {/* Code Editor */}
            <div
              className="flex-1 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,13,35,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 0 80px rgba(99,102,241,0.15)",
              }}
            >
              {/* Editor title bar */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
              >
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-xs" style={{ color: "#6b7280", fontFamily: "'JetBrains Mono', monospace" }}>
                  auth.js — CodeGuardian AI
                </span>
              </div>
              <div className="p-4">
                {codeSnippet.map(({ ln, code, type, issue }) => (
                  <div
                    key={ln}
                    className="flex items-start gap-3 py-0.5 rounded px-2 group relative"
                    style={{
                      background:
                        type === "vulnerable"
                          ? "rgba(239,68,68,0.12)"
                          : type === "warning"
                          ? "rgba(245,158,11,0.08)"
                          : "transparent",
                      borderLeft: type === "vulnerable" ? "2px solid rgba(239,68,68,0.6)" : type === "warning" ? "2px solid rgba(245,158,11,0.5)" : "2px solid transparent",
                    }}
                  >
                    <span
                      className="select-none shrink-0"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: "#374151",
                        width: "20px",
                        textAlign: "right",
                      }}
                    >
                      {ln}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px",
                        color:
                          type === "vulnerable"
                            ? "#fca5a5"
                            : type === "warning"
                            ? "#fcd34d"
                            : "#c4c9d4",
                        flex: 1,
                      }}
                    >
                      {code}
                    </span>
                    {issue && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: type === "vulnerable" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)",
                          color: type === "vulnerable" ? "#fca5a5" : "#fcd34d",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {issue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Suggestions Panel */}
            <div
              className="lg:w-72 rounded-2xl flex flex-col gap-3 p-4"
              style={{
                background: "rgba(13,13,35,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} style={{ color: "#22d3ee" }} />
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#e5e7eb" }}>
                  AI Analysis
                </span>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                >
                  3 Critical
                </span>
              </div>

              {[
                {
                  sev: "CRITICAL",
                  color: "#ef4444",
                  bg: "rgba(239,68,68,0.1)",
                  title: "SQL Injection",
                  lines: "Lines 2-3",
                  fix: "Use parameterized queries",
                },
                {
                  sev: "HIGH",
                  color: "#f97316",
                  bg: "rgba(249,115,22,0.1)",
                  title: "Weak JWT Secret",
                  lines: "Line 10",
                  fix: "Use env variable with 256-bit key",
                },
                {
                  sev: "MEDIUM",
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)",
                  title: "Missing Input Validation",
                  lines: "Line 4",
                  fix: "Sanitize and validate userId",
                },
              ].map(({ sev, color, bg, title, lines, fix }) => (
                <div
                  key={title}
                  className="rounded-xl p-3"
                  style={{ background: bg, border: `1px solid ${color}30` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: `${color}20`, color, fontWeight: 700, fontSize: "10px" }}
                    >
                      {sev}
                    </span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>{lines}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb" }}>{title}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                    💡 {fix}
                  </div>
                </div>
              ))}

              <button
                onClick={() => navigate("/app/review")}
                className="mt-2 w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  fontWeight: 600,
                }}
              >
                <Zap size={14} />
                Apply All Fixes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                color: "#f9fafb",
              }}
            >
              Everything you need to ship{" "}
              <span style={{ color: "#22d3ee" }}>secure code</span>
            </h2>
            <p style={{ fontSize: "16px", color: "#6b7280", marginTop: "12px" }}>
              From vulnerability detection to AI-powered fixes — all in one platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, color, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl p-6 transition-all hover:translate-y-[-2px] hover:shadow-lg"
                style={{
                  background: "rgba(13,13,35,0.7)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f9fafb", marginBottom: "8px" }}>
                  {label}
                </h3>
                <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Winning Features Highlight */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6"
              style={{
                background: "rgba(168,85,247,0.15)",
                border: "1px solid rgba(168,85,247,0.4)",
                color: "#d8b4fe",
              }}
            >
              <TrendingUp size={12} />
              LEVEL 3 — WINNING FEATURES
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                color: "#f9fafb",
              }}
            >
              Features that make us{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #a855f7, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                10x better
              </span>
            </h2>
          </div>

          {/* Technical Debt Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(13,13,35,0.9)",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={18} style={{ color: "#a855f7" }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f9fafb" }}>
                  Technical Debt Calculator
                </span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Technical Debt", val: "47 hours", color: "#ef4444" },
                  { label: "Cost Now", val: "$4,700", color: "#f97316" },
                  { label: "Cost in 6 months", val: "$28,000", color: "#ef4444" },
                ].map(({ label, val, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>{label}</span>
                    <span style={{ fontSize: "18px", fontWeight: 700, color }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub PR Bot Preview */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(13,13,35,0.9)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <GitPullRequest size={18} style={{ color: "#22d3ee" }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f9fafb" }}>
                  GitHub PR Bot
                </span>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 700, color: "white" }}
                  >
                    CG
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>CodeGuardian AI</span>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}
                  >
                    bot
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: "⚠️", text: "Security issue detected in auth.js (line 23)", color: "#fca5a5" },
                    { icon: "💡", text: "Performance suggestion: cache db results", color: "#fcd34d" },
                    { icon: "✅", text: "Code quality score: 92/100", color: "#86efac" },
                  ].map(({ icon, text, color }) => (
                    <div
                      key={text}
                      className="flex items-start gap-2 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <span>{icon}</span>
                      <span style={{ fontSize: "12px", color }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-center mb-14"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#f9fafb", letterSpacing: "-1px" }}
          >
            Trusted by developers worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(({ name, role, avatar, color, text, stars }) => (
              <div
                key={name}
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(13,13,35,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={14} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                  ))}
                </div>
                <p style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.7, marginBottom: "16px" }}>
                  "{text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ background: color, fontWeight: 700 }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#f9fafb" }}>{name}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <div
              className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
              style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
            />
            <h2
              className="relative mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#f9fafb", letterSpacing: "-1px" }}
            >
              Ready to secure your code?
            </h2>
            <p className="relative mb-8" style={{ fontSize: "16px", color: "#9ca3af" }}>
              Start for free. No credit card required. Analyze your first repo in minutes.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-8 py-4 rounded-xl text-white transition-all hover:opacity-90 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  fontWeight: 700,
                  fontSize: "15px",
                  boxShadow: "0 0 40px rgba(99,102,241,0.5)",
                }}
              >
                <Zap size={18} />
                Start Free Review
              </button>
              <button
                onClick={() => navigate("/app")}
                className="flex items-center gap-2 px-8 py-4 rounded-xl transition-all hover:bg-white/10"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontWeight: 600,
                  fontSize: "15px",
                  color: "#e5e7eb",
                }}
              >
                View Dashboard Demo
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 lg:px-12 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "#22d3ee" }} />
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              © 2026 CodeGuardian AI. Built for hackathon demo.
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Security", "Status"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ fontSize: "13px", color: "#6b7280" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
