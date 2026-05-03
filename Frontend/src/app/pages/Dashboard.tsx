import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Shield,
  Code2,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Zap,
  GitBranch,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileCode,
} from "lucide-react";

const qualityTrendData = [
  { month: "Sep", score: 62, security: 45 },
  { month: "Oct", score: 68, security: 52 },
  { month: "Nov", score: 71, security: 60 },
  { month: "Dec", score: 75, security: 65 },
  { month: "Jan", score: 82, security: 74 },
  { month: "Feb", score: 88, security: 83 },
  { month: "Mar", score: 94, security: 91 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: "rgba(13,13,35,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "12px",
          color: "#e5e7eb",
        }}
      >
        <div style={{ color: "#9ca3af", marginBottom: "4px" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<{
    overview: { totalScans: string; vulnerabilitiesFound: string; resolvedIssues: string; qualityScore: string };
    qualityTrend: any[];
    recentScans: any[];
    projects: any[];
    lastScanTime: string | null;
  }>({
    overview: {
      totalScans: "0",
      vulnerabilitiesFound: "0",
      resolvedIssues: "0",
      qualityScore: "0/100",
    },
    qualityTrend: qualityTrendData,
    recentScans: [],
    projects: [],
    lastScanTime: null,
  });
  const [lastUpdated, setLastUpdated] = useState<string>("Never");

  const fetchDashboard = () => {
    const token = localStorage.getItem("codeguardian_token") || "";
    fetch('http://localhost:5000/api/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.overview) return;
        setDashboardData({
          overview: {
            totalScans: data.overview.totalScans.toLocaleString(),
            vulnerabilitiesFound: data.overview.vulnerabilitiesFound.toString(),
            resolvedIssues: data.overview.resolvedIssues.toLocaleString(),
            qualityScore: data.overview.qualityScore + "/100"
          },
          qualityTrend: data.qualityTrend || qualityTrendData,
          recentScans: data.recentScans || recentScans,
          projects: data.projects || projects,
          lastScanTime: data.lastScanTime,
        });
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboard();
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Overview Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            {dashboardData.lastScanTime
              ? `Last scan: ${new Date(dashboardData.lastScanTime).toLocaleTimeString()} · Live updates every 5s`
              : `Live updates every 5s · Last refreshed: ${lastUpdated}`}
          </p>
        </div>
        <button
          onClick={() => navigate("/app/review")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #6366f1, #22d3ee)",
            fontWeight: 600,
            boxShadow: "0 0 20px rgba(99,102,241,0.3)",
          }}
        >
          <Zap size={15} />
          Quick Scan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Scans",
            value: dashboardData.overview.totalScans,
            change: "+12%",
            up: true,
            icon: FileCode,
            color: "#6366f1",
            bg: "rgba(99,102,241,0.1)",
          },
          {
            label: "Vulnerabilities",
            value: dashboardData.overview.vulnerabilitiesFound,
            change: "-28%",
            up: false,
            icon: Shield,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.1)",
          },
          {
            label: "Resolved Issues",
            value: dashboardData.overview.resolvedIssues,
            change: "+34%",
            up: true,
            icon: CheckCircle,
            color: "#22c55e",
            bg: "rgba(34,197,94,0.1)",
          },
          {
            label: "Quality Score",
            value: dashboardData.overview.qualityScore,
            change: "+8pts",
            up: true,
            icon: TrendingUp,
            color: "#22d3ee",
            bg: "rgba(34,211,238,0.1)",
          },
        ].map(({ label, value, change, up, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{
              background: "rgba(13,13,35,0.8)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${color}30` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <div
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                style={{
                  background: up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: up ? "#22c55e" : "#ef4444",
                }}
              >
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {change}
              </div>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
              {value}
            </div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quality & Security Trend */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>
                Code Quality Trend
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Last 7 months</div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ background: "#6366f1" }} />
                <span style={{ color: "#9ca3af" }}>Quality</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded" style={{ background: "#22d3ee" }} />
                <span style={{ color: "#9ca3af" }}>Security</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashboardData.qualityTrend}>
              <defs>
                <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSecurity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} domain={[40, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" name="Quality" stroke="#6366f1" fill="url(#colorQuality)" strokeWidth={2} />
              <Area type="monotone" dataKey="security" name="Security" stroke="#22d3ee" fill="url(#colorSecurity)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Scans + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Scans */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>Recent Code Reviews</div>
            <button
              onClick={() => navigate("/app/history")}
              style={{ fontSize: "13px", color: "#6366f1", fontWeight: 500 }}
            >
              View all →
            </button>
          </div>
          {dashboardData.recentScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Code2 size={32} style={{ color: "#1e1e3f" }} />
              <p style={{ fontSize: "13px", color: "#4b5563", textAlign: "center" }}>
                No scans yet. Run your first AI code review!
              </p>
              <button
                onClick={() => navigate("/app/review")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 600 }}
              >
                <Zap size={13} /> Quick Scan
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardData.recentScans.map(({ repo, branch, score, issues, time, status, lang }, idx) => (
                <div
                  key={`${repo}-${branch}-${idx}`}
                  className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/5 cursor-pointer"
                  onClick={() => navigate("/app/review")}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
                  >
                    {lang.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#f9fafb" }}>{repo}</span>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#6b7280" }}
                      >
                        <GitBranch size={10} />
                        {branch}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{lang}</span>
                      <span style={{ fontSize: "12px", color: "#4b5563" }}>·</span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>{issues} issues</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="text-sm px-3 py-1 rounded-lg"
                      style={{
                        fontWeight: 700,
                        color: score >= 80 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444",
                        background: score >= 80 ? "rgba(34,197,94,0.1)" : score >= 65 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                      }}
                    >
                      {score}
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: status === "pass" ? "#22c55e" : status === "warn" ? "#f59e0b" : "#ef4444" }}
                    />
                    <span style={{ fontSize: "12px", color: "#4b5563" }}>{time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Health */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", marginBottom: "16px" }}>
            Project Health
          </div>
          <div className="space-y-3">
            {dashboardData.projects.map(({ name, score, issues, color }) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "13px", color: "#d1d5db", fontWeight: 500 }}>{name}</span>
                  <span style={{ fontSize: "12px", color, fontWeight: 700 }}>{score}</span>
                </div>
                <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{ width: `${score}%`, background: color }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "2px" }}>
                  {issues} issues
                </div>
              </div>
            ))}
          </div>

          {/* AI Insight */}
          <div
            className="mt-5 p-3 rounded-xl"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={13} style={{ color: "#a5b4fc" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#a5b4fc" }}>AI Insight</span>
            </div>
            <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6 }}>
              {dashboardData.projects.length > 0
                ? (() => {
                    const worst = [...dashboardData.projects].sort((a, b) => a.score - b.score)[0];
                    return worst
                      ? `${worst.name} has ${worst.issues} unresolved issue${worst.issues !== 1 ? "s" : ""}. Fixing it could raise your overall score by ~${Math.min(18, Math.round((100 - worst.score) * 0.3))} points.`
                      : "All projects are looking healthy. Keep shipping secure code!";
                  })()
                : "Run your first scan to get personalized AI insights about your codebase."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
