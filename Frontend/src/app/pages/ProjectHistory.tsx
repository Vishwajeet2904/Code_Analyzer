import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Download,
  Trash2,
  Zap,
  RefreshCw,
  DatabaseZap,
  X,
  Shield,
  Bug,
  Gauge,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react";

import { API_BASE as API } from "../lib/api";

const statusConfig = {
  pass: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: CheckCircle, label: "Passed" },
  warn: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle, label: "Warning" },
  fail: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle, label: "Failed" },
};

const sevStyle: Record<string, { color: string; bg: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  low:      { color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
};

const typeIcon: Record<string, any> = {
  security: Shield,
  bug: Bug,
  performance: Gauge,
  code_smell: Sparkles,
};

type Scan = {
  id: string;
  repo: string;
  branch: string;
  lang: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: number;
  duration: string;
  timestamp: string;
  timeAgo?: string;
  status: "pass" | "warn" | "fail";
  commit: string;
};

type ScanDetail = {
  id: string;
  repo: string;
  branch: string;
  language: string;
  score: number;
  securityScore: number;
  issues: number;
  status: string;
  summary: string;
  createdAt?: string;
  time?: string;
  fullResult?: {
    qualityScore: number;
    securityScore: number;
    summary: string;
    issues: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      line: string;
      fix: string;
      refactoredCode?: string;
    }>;
  };
};

// ── Scan Detail Modal ────────────────────────────────────────────────────────
function ScanDetailModal({ scanId, onClose }: { scanId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("codeguardian_token") || "";
    fetch(`${API}/api/history/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDetail(data);
      })
      .catch(() => setError("Failed to load scan details"))
      .finally(() => setLoading(false));
  }, [scanId]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const issues = detail?.fullResult?.issues || [];
  const scannedAt = detail?.createdAt || detail?.time
    ? new Date(detail!.createdAt || detail!.time!).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Slide-over panel */}
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{
          width: "min(600px, 100vw)",
          background: "#0a0a1e",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
          animation: "slideIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(13,13,35,0.95)" }}>
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <Code2 size={16} style={{ color: "#6366f1", flexShrink: 0 }} />
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", wordBreak: "break-all" }}>
                {detail?.repo || "Loading…"}
              </h2>
            </div>
            {detail && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                  <GitBranch size={10} /> {detail.branch}
                </span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{detail.language}</span>
                <span style={{ fontSize: "12px", color: "#4b5563" }}>·</span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{scannedAt}</span>
              </div>
            )}
          </div>
          <button onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-white/10 flex-shrink-0"
            style={{ color: "#6b7280" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
              <p style={{ fontSize: "13px", color: "#6b7280" }}>Loading scan details…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl p-4 text-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Quality Score", value: `${detail.score}/100`,
                    color: detail.score >= 80 ? "#22c55e" : detail.score >= 65 ? "#f59e0b" : "#ef4444" },
                  { label: "Security Score", value: `${detail.securityScore || detail.score}/100`,
                    color: (detail.securityScore || detail.score) >= 80 ? "#22c55e" : "#f59e0b" },
                  { label: "Issues Found", value: String(issues.length),
                    color: issues.length === 0 ? "#22c55e" : issues.length <= 3 ? "#f59e0b" : "#ef4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: "20px", fontWeight: 800, color, letterSpacing: "-0.5px" }}>{value}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {detail.fullResult?.summary && (
                <div className="rounded-xl p-4"
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} style={{ color: "#a5b4fc" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#a5b4fc" }}>AI Summary</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#d1d5db", lineHeight: 1.6 }}>
                    {detail.fullResult.summary}
                  </p>
                </div>
              )}

              {/* Issues */}
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f9fafb", marginBottom: "10px" }}>
                  {issues.length === 0 ? "✅ No Issues Found" : `Issues (${issues.length})`}
                </div>

                {issues.length === 0 ? (
                  <div className="rounded-xl p-6 flex flex-col items-center gap-2"
                    style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle size={28} style={{ color: "#22c55e" }} />
                    <p style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>Clean code — no vulnerabilities detected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {issues.map((issue, idx) => {
                      const sev = (issue.severity || "low").toLowerCase();
                      const style = sevStyle[sev] || sevStyle.low;
                      const IssueIcon = typeIcon[issue.type] || Shield;
                      const isExpanded = expandedIssue === (issue.id || String(idx));
                      return (
                        <div key={issue.id || idx} className="rounded-xl overflow-hidden"
                          style={{ border: `1px solid ${isExpanded ? style.color + "50" : "rgba(255,255,255,0.07)"}`,
                            background: isExpanded ? style.bg : "rgba(255,255,255,0.03)" }}>
                          {/* Issue header */}
                          <button
                            className="w-full flex items-center gap-3 p-3 text-left"
                            onClick={() => setExpandedIssue(isExpanded ? null : (issue.id || String(idx)))}>
                            <span className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                              style={{ background: style.bg, color: style.color, fontWeight: 700, border: `1px solid ${style.color}40` }}>
                              {sev.toUpperCase()}
                            </span>
                            <IssueIcon size={13} style={{ color: style.color, flexShrink: 0 }} />
                            <div className="flex-1 min-w-0">
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>{issue.title}</div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                Line {issue.line || "—"} · {issue.type?.replace("_", " ")}
                              </div>
                            </div>
                            {isExpanded
                              ? <ChevronUp size={14} style={{ color: "#4b5563", flexShrink: 0 }} />
                              : <ChevronDown size={14} style={{ color: "#4b5563", flexShrink: 0 }} />}
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 border-t"
                              style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                              <div className="pt-3">
                                <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.7 }}>
                                  {issue.description}
                                </p>
                              </div>
                              {issue.fix && (
                                <div className="rounded-lg p-3"
                                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e",
                                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                                    💡 Suggested Fix
                                  </div>
                                  <p style={{ fontSize: "12px", color: "#86efac", lineHeight: 1.6 }}>{issue.fix}</p>
                                </div>
                              )}
                              {issue.refactoredCode && (
                                <div className="rounded-lg p-3"
                                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280",
                                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                                    Fixed Code
                                  </div>
                                  <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                                    color: "#a5b4fc", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                                    {issue.refactoredCode}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(13,13,35,0.95)" }}>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function ProjectHistory() {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pass" | "warn" | "fail">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`${API}/api/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) { navigate("/login"); return; }
        throw new Error("Failed to fetch");
      }

      const data = await res.json();
      // API returns { scans: [...], total } or just an array
      const list: Scan[] = Array.isArray(data) ? data : (data.scans || []);
      setScanHistory(list);
      setTotal(Array.isArray(data) ? list.length : (data.total || list.length));
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, navigate]);

  // Initial load + re-fetch when filter changes
  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  // Poll every 10 seconds for new scans
  useEffect(() => {
    const interval = setInterval(() => fetchHistory(true), 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this scan from history?")) return;
    setDeletingId(id);
    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      await fetch(`${API}/api/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setScanHistory((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Failed to delete scan");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID","Repository","Branch","Language","Score","Issues","Critical","High","Medium","Low","Duration","Timestamp","Status","Commit"];
    const rows = filtered.map((s) => [
      s.id, s.repo, s.branch, s.lang, s.score,
      s.issues, s.critical ?? 0, s.high ?? 0, s.medium ?? 0, s.low ?? 0,
      s.duration, s.timestamp, s.status, s.commit,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = scanHistory.filter((s) => {
    const matchSearch =
      s.repo?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  // ─── LOADING STATE ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb" }}>Scan History</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>Loading from database…</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="rounded-2xl p-4 animate-pulse"
              style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)", height: "80px" }} />
          ))}
        </div>
        <div className="rounded-2xl p-8 flex flex-col items-center gap-3"
          style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Fetching scan history…</p>
        </div>
      </div>
    );
  }

  // ─── EMPTY STATE ──────────────────────────────────────────────────────────
  if (!loading && scanHistory.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb" }}>Scan History</h1>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>No scans yet</p>
          </div>
        </div>
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <DatabaseZap size={48} style={{ color: "#1e1e4f" }} />
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f9fafb" }}>No scan history yet</h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "6px", maxWidth: "360px" }}>
              Run your first AI code review and the results will appear here automatically.
            </p>
          </div>
          <button
            onClick={() => navigate("/app/review")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
          >
            <Zap size={15} />
            Run First Scan
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Scan History
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            {total} total scan{total !== 1 ? "s" : ""} · Live from database
            {refreshing && <span style={{ color: "#6366f1" }}> · Refreshing…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchHistory(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a5b4fc" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontWeight: 500 }}
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scans", val: scanHistory.length, color: "#6366f1" },
          { label: "Passed", val: scanHistory.filter((s) => s.status === "pass").length, color: "#22c55e" },
          { label: "Warnings", val: scanHistory.filter((s) => s.status === "warn").length, color: "#f59e0b" },
          { label: "Failed", val: scanHistory.filter((s) => s.status === "fail").length, color: "#ef4444" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: "30px", fontWeight: 800, color, letterSpacing: "-1px" }}>{val}</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repos, branches…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pass", "warn", "fail"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
              style={{
                background: filter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: filter === f ? "#a5b4fc" : "#6b7280",
                fontWeight: filter === f ? 600 : 400,
              }}>
              {f === "all" ? "All" : f === "pass" ? "Pass" : f === "warn" ? "Warn" : "Fail"}
            </button>
          ))}
        </div>
      </div>

      {/* No results after filter */}
      {filtered.length === 0 && (
        <div className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>No scans match your search or filter.</p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(13,13,35,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Repository", "Branch", "Language", "Score", "Issues", "Duration", "Time", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3"
                      style={{ fontSize: "11px", color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((scan) => {
                  const cfg = statusConfig[scan.status] || statusConfig.pass;
                  const { color, bg, icon: StatusIcon, label } = cfg;
                  const isDeleting = deletingId === scan.id;
                  return (
                    <tr key={scan.id}
                      className="transition-colors hover:bg-white/3 cursor-pointer"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: isDeleting ? 0.4 : 1 }}
                      onClick={() => setSelectedScanId(scan.id)}>

                      {/* Repository */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                            {(scan.lang || "??").slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>{scan.repo}</div>
                            <div style={{ fontSize: "11px", color: "#4b5563", fontFamily: "'JetBrains Mono', monospace" }}>
                              #{scan.commit}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                          <GitBranch size={10} />
                          {scan.branch}
                        </div>
                      </td>

                      {/* Language */}
                      <td className="px-5 py-3.5" style={{ fontSize: "13px", color: "#9ca3af" }}>
                        {scan.lang}
                      </td>

                      {/* Score */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${scan.score}%`, background: scan.score >= 80 ? "#22c55e" : scan.score >= 65 ? "#f59e0b" : "#ef4444" }} />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: scan.score >= 80 ? "#22c55e" : scan.score >= 65 ? "#f59e0b" : "#ef4444" }}>
                            {scan.score}
                          </span>
                        </div>
                      </td>

                      {/* Issues */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {(scan.critical ?? 0) > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 700 }}>
                              {scan.critical}C
                            </span>
                          )}
                          {(scan.high ?? 0) > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(249,115,22,0.2)", color: "#fdba74", fontWeight: 700 }}>
                              {scan.high}H
                            </span>
                          )}
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>{scan.issues} total</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1" style={{ color: "#6b7280" }}>
                          <Clock size={12} />
                          <span style={{ fontSize: "12px" }}>{scan.duration}</span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-3.5" style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                        <div>{scan.timestamp}</div>
                        {scan.timeAgo && (
                          <div style={{ fontSize: "11px", color: "#4b5563" }}>{scan.timeAgo}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit"
                          style={{ background: bg, color }}>
                          <StatusIcon size={11} />
                          <span style={{ fontWeight: 600 }}>{label}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                            style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", fontWeight: 500 }}
                            onClick={(e) => { e.stopPropagation(); setSelectedScanId(scan.id); }}>
                            View
                          </button>
                          <button
                            className="p-1.5 rounded-lg transition-all hover:opacity-80"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                            onClick={(e) => handleDelete(e, scan.id)}
                            disabled={isDeleting}
                            title="Delete scan">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scan Detail Modal */}
      {selectedScanId && (
        <ScanDetailModal
          scanId={selectedScanId}
          onClose={() => setSelectedScanId(null)}
        />
      )}
    </div>
  );
}
