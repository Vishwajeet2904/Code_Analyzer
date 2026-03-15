import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  GitBranch,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  ChevronDown,
  Code2,
  Shield,
} from "lucide-react";

const scans = [
  {
    id: "s001",
    repo: "api-service",
    branch: "main",
    lang: "Node.js",
    score: 94,
    critical: 0,
    high: 1,
    medium: 1,
    low: 0,
    issues: 2,
    duration: "12s",
    timestamp: "2026-03-14 14:32",
    status: "pass",
    commit: "a3f2d91",
  },
  {
    id: "s002",
    repo: "auth-module",
    branch: "feat/oauth",
    lang: "TypeScript",
    score: 71,
    critical: 1,
    high: 2,
    medium: 3,
    low: 2,
    issues: 8,
    duration: "18s",
    timestamp: "2026-03-14 13:15",
    status: "warn",
    commit: "b7e1c44",
  },
  {
    id: "s003",
    repo: "payments-api",
    branch: "main",
    lang: "Python",
    score: 88,
    critical: 0,
    high: 2,
    medium: 2,
    low: 0,
    issues: 4,
    duration: "22s",
    timestamp: "2026-03-14 11:04",
    status: "pass",
    commit: "d4a8f23",
  },
  {
    id: "s004",
    repo: "user-service",
    branch: "fix/xss-patch",
    lang: "Java",
    score: 56,
    critical: 3,
    high: 5,
    medium: 4,
    low: 3,
    issues: 15,
    duration: "34s",
    timestamp: "2026-03-14 09:30",
    status: "fail",
    commit: "c1b9d87",
  },
  {
    id: "s005",
    repo: "frontend-app",
    branch: "dev",
    lang: "React",
    score: 82,
    critical: 0,
    high: 2,
    medium: 3,
    low: 1,
    issues: 6,
    duration: "15s",
    timestamp: "2026-03-13 17:45",
    status: "pass",
    commit: "e8c3a56",
  },
  {
    id: "s006",
    repo: "ml-pipeline",
    branch: "main",
    lang: "Python",
    score: 79,
    critical: 0,
    high: 3,
    medium: 2,
    low: 4,
    issues: 9,
    duration: "28s",
    timestamp: "2026-03-13 14:22",
    status: "warn",
    commit: "f2d7b10",
  },
  {
    id: "s007",
    repo: "data-processor",
    branch: "refactor/v2",
    lang: "Go",
    score: 91,
    critical: 0,
    high: 0,
    medium: 2,
    low: 3,
    issues: 5,
    duration: "9s",
    timestamp: "2026-03-13 10:11",
    status: "pass",
    commit: "a9e4c78",
  },
  {
    id: "s008",
    repo: "admin-panel",
    branch: "feature/rbac",
    lang: "TypeScript",
    score: 63,
    critical: 2,
    high: 4,
    medium: 5,
    low: 2,
    issues: 13,
    duration: "24s",
    timestamp: "2026-03-12 16:50",
    status: "fail",
    commit: "b3f1a92",
  },
];

const statusConfig = {
  pass: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: CheckCircle, label: "Passed" },
  warn: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle, label: "Warning" },
  fail: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle, label: "Failed" },
};

export function ProjectHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pass" | "warn" | "fail">("all");
  const [scanHistory, setScanHistory] = useState(scans);

  useEffect(() => {
    const fetchHistory = () => {
      const token = localStorage.getItem("codeguardian_token") || "";
      fetch('http://localhost:5000/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) setScanHistory(data);
        })
        .catch(() => {});
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = scanHistory.filter((s) => {
    const matchSearch =
      s.repo.toLowerCase().includes(search.toLowerCase()) ||
      s.branch.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const handleExportCSV = () => {
    const headers = ["ID", "Repository", "Branch", "Language", "Score", "Issues", "Critical", "High", "Medium", "Low", "Duration", "Timestamp", "Status", "Commit"];
    const rows = filtered.map(s => [
      s.id, s.repo, s.branch, s.lang, s.score,
      s.issues, s.critical ?? 0, s.high ?? 0, s.medium ?? 0, s.low ?? 0,
      s.duration, s.timestamp, s.status, s.commit
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-history-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Scan History
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            {scanHistory.length} total scans · Showing last 30 days
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#9ca3af",
            fontWeight: 500,
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scans", val: scanHistory.length, color: "#6366f1" },
          {
            label: "Passed",
            val: scanHistory.filter((s) => s.status === "pass").length,
            color: "#22c55e",
          },
          {
            label: "Warnings",
            val: scanHistory.filter((s) => s.status === "warn").length,
            color: "#f59e0b",
          },
          {
            label: "Failed",
            val: scanHistory.filter((s) => s.status === "fail").length,
            color: "#ef4444",
          },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{
              background: "rgba(13,13,35,0.8)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ fontSize: "30px", fontWeight: 800, color, letterSpacing: "-1px" }}>
              {val}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="relative flex-1 max-w-xs"
        >
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repos, branches…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f9fafb",
            }}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pass", "warn", "fail"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
              style={{
                background: filter === f ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: filter === f ? "#a5b4fc" : "#6b7280",
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(13,13,35,0.8)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Repository", "Branch", "Language", "Score", "Issues", "Duration", "Time", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3"
                    style={{
                      fontSize: "11px",
                      color: "#4b5563",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((scan) => {
                const { color, bg, icon: StatusIcon, label } = statusConfig[scan.status as keyof typeof statusConfig];
                return (
                  <tr
                    key={scan.id}
                    className="transition-colors hover:bg-white/3 cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onClick={() => navigate("/app/review")}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                          style={{
                            background: "rgba(99,102,241,0.15)",
                            color: "#a5b4fc",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
                          }}
                        >
                          {scan.lang.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>
                            {scan.repo}
                          </div>
                          <div style={{ fontSize: "11px", color: "#4b5563", fontFamily: "'JetBrains Mono', monospace" }}>
                            #{scan.commit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}
                      >
                        <GitBranch size={10} />
                        {scan.branch}
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: "13px", color: "#9ca3af" }}>
                      {scan.lang}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.08)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${scan.score}%`,
                              background:
                                scan.score >= 80
                                  ? "#22c55e"
                                  : scan.score >= 65
                                  ? "#f59e0b"
                                  : "#ef4444",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color:
                              scan.score >= 80
                                ? "#22c55e"
                                : scan.score >= 65
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        >
                          {scan.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {scan.critical > 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", fontWeight: 700 }}
                          >
                            {scan.critical}C
                          </span>
                        )}
                        {scan.high > 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(249,115,22,0.2)", color: "#fdba74", fontWeight: 700 }}
                          >
                            {scan.high}H
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{scan.issues} total</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1" style={{ color: "#6b7280" }}>
                        <Clock size={12} />
                        <span style={{ fontSize: "12px" }}>{scan.duration}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {scan.timestamp}
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full w-fit"
                        style={{ background: bg, color }}
                      >
                        <StatusIcon size={11} />
                        <span style={{ fontWeight: 600 }}>{label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{
                          background: "rgba(99,102,241,0.15)",
                          color: "#a5b4fc",
                          border: "1px solid rgba(99,102,241,0.2)",
                          fontWeight: 500,
                        }}
                        onClick={(e) => { e.stopPropagation(); navigate("/app/review"); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
