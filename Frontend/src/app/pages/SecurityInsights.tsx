import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { Shield, AlertTriangle, TrendingDown, FileText } from "lucide-react";
const severityData = [
  { name: "Critical", value: 8, color: "#ef4444" },
  { name: "High", value: 23, color: "#f97316" },
  { name: "Medium", value: 41, color: "#f59e0b" },
  { name: "Low", value: 71, color: "#22c55e" },
];

const trendData = [
  { month: "Sep", critical: 18, high: 42, medium: 68, low: 90 },
  { month: "Oct", critical: 15, high: 38, medium: 62, low: 85 },
  { month: "Nov", critical: 14, high: 35, medium: 58, low: 81 },
  { month: "Dec", critical: 12, high: 30, medium: 52, low: 78 },
  { month: "Jan", critical: 10, high: 27, medium: 46, low: 74 },
  { month: "Feb", critical: 9, high: 25, medium: 43, low: 72 },
  { month: "Mar", critical: 8, high: 23, medium: 41, low: 71 },
];

const radarData = [
  { subject: "Injection", A: 85 },
  { subject: "Auth", A: 62 },
  { subject: "Exposure", A: 78 },
  { subject: "XSS", A: 90 },
  { subject: "CSRF", A: 55 },
  { subject: "Config", A: 70 },
];

// Heatmap data: 7x8 grid of vulnerability hotspots
const heatmapData = [
  ["auth.js", 9, 2, 5, 1, 0, 3, 0, 7],
  ["api.js", 0, 4, 8, 0, 2, 0, 1, 3],
  ["db.js", 6, 0, 0, 3, 7, 0, 4, 0],
  ["user.js", 1, 5, 0, 8, 0, 2, 0, 5],
  ["payment.js", 3, 0, 1, 0, 4, 6, 0, 2],
  ["config.js", 8, 1, 0, 2, 0, 5, 3, 0],
  ["routes.js", 0, 6, 3, 0, 1, 0, 7, 4],
];

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const vulnList = [
  { id: "CVE-2024-0021", name: "SQL Injection", file: "auth.js", sev: "CRITICAL", color: "#ef4444", cvss: "9.8" },
  { id: "CVE-2024-0047", name: "Broken Auth", file: "user.js", sev: "CRITICAL", color: "#ef4444", cvss: "9.1" },
  { id: "CVE-2024-0133", name: "Hardcoded Secret", file: "config.js", sev: "HIGH", color: "#f97316", cvss: "7.5" },
  { id: "CVE-2024-0201", name: "XSS Reflected", file: "routes.js", sev: "HIGH", color: "#f97316", cvss: "7.2" },
  { id: "CVE-2024-0288", name: "Missing CSRF", file: "api.js", sev: "MEDIUM", color: "#f59e0b", cvss: "5.4" },
  { id: "CVE-2024-0312", name: "Info Disclosure", file: "payment.js", sev: "LOW", color: "#22c55e", cvss: "3.1" },
];

function getHeatColor(val: number) {
  if (val === 0) return "rgba(255,255,255,0.03)";
  if (val <= 2) return "rgba(34,197,94,0.25)";
  if (val <= 4) return "rgba(245,158,11,0.3)";
  if (val <= 6) return "rgba(249,115,22,0.4)";
  return "rgba(239,68,68,0.5)";
}

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
          <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  }
  return null;
};

export function SecurityInsights() {
  const [data, setData] = useState({
    severityData: severityData,
    trendData: trendData,
    radarData: radarData,
    heatmapData: heatmapData,
    vulnList: vulnList
  });

  const handleExportPDF = () => {
    import("jspdf").then((module) => {
      const jsPDF = module.default || module.jsPDF;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      let y = 0;

      // Dark header bar
      doc.setFillColor(13, 13, 35);
      doc.rect(0, 0, W, 28, "F");
      doc.setFontSize(18);
      doc.setTextColor(249, 250, 251);
      doc.setFont("helvetica", "bold");
      doc.text("CodeGuardian AI", 14, 12);
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text("Security Insights Report", 14, 20);
      doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 20, { align: "right" });
      y = 36;

      // Severity summary cards
      const sevColors: Record<string, [number,number,number]> = {
        Critical: [239, 68, 68],
        High: [249, 115, 22],
        Medium: [245, 158, 11],
        Low: [34, 197, 94],
      };
      const cardW = (W - 28 - 9) / 4;
      data.severityData.forEach(({ name, value }, i) => {
        const x = 14 + i * (cardW + 3);
        const [r, g, b] = sevColors[name] || [99, 102, 241];
        doc.setFillColor(20, 20, 45);
        doc.roundedRect(x, y, cardW, 22, 3, 3, "F");
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(r, g, b);
        doc.text(String(value), x + cardW / 2, y + 12, { align: "center" });
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "normal");
        doc.text(name, x + cardW / 2, y + 19, { align: "center" });
      });
      y += 30;

      // Section: Active Vulnerabilities
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 250, 251);
      doc.text("Active Vulnerabilities", 14, y);
      y += 6;

      // Table header
      doc.setFillColor(20, 20, 45);
      doc.rect(14, y, W - 28, 8, "F");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "bold");
      ["CVE ID", "Vulnerability", "File", "Severity", "CVSS"].forEach((h, i) => {
        const xs = [16, 52, 110, 145, 175];
        doc.text(h, xs[i], y + 5.5);
      });
      y += 9;

      // Table rows
      data.vulnList.forEach(({ id, name: vname, file, sev, cvss }, i) => {
        if (i % 2 === 0) { doc.setFillColor(15, 15, 30); doc.rect(14, y, W - 28, 8, "F"); }
        const [r, g, b] = sevColors[sev.charAt(0) + sev.slice(1).toLowerCase()] || [99, 102, 241];
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); doc.text(id, 16, y + 5.5);
        doc.setTextColor(249, 250, 251); doc.text(vname, 52, y + 5.5);
        doc.setTextColor(165, 180, 252); doc.text(file, 110, y + 5.5);
        doc.setTextColor(r, g, b); doc.setFont("helvetica", "bold"); doc.text(sev, 145, y + 5.5);
        doc.setTextColor(r, g, b); doc.text(cvss, 175, y + 5.5);
        y += 9;
      });
      y += 8;

      // Section: OWASP Attack Surface
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(249, 250, 251);
      doc.text("OWASP Attack Surface", 14, y);
      y += 8;
      data.radarData.forEach(({ subject, A }) => {
        doc.setFillColor(20, 20, 45);
        doc.rect(14, y, W - 28, 7, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(209, 213, 219);
        doc.text(subject, 18, y + 5);
        const barW = ((W - 28 - 60) * A) / 100;
        const scoreColor: [number,number,number] = A >= 75 ? [34,197,94] : A >= 50 ? [245,158,11] : [239,68,68];
        doc.setFillColor(...scoreColor);
        doc.roundedRect(70, y + 1.5, barW, 4, 1, 1, "F");
        doc.setTextColor(...scoreColor);
        doc.setFont("helvetica", "bold");
        doc.text(`${A}%`, W - 18, y + 5, { align: "right" });
        y += 9;
      });

      // Footer
      doc.setFillColor(13, 13, 35);
      doc.rect(0, 287, W, 10, "F");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "normal");
      doc.text("CodeGuardian AI — Confidential Security Report", W / 2, 293, { align: "center" });

      doc.save(`security-report-${new Date().toISOString().slice(0,10)}.pdf`);
    });
  };

  useEffect(() => {
    const fetchSecurity = () => {
      const token = localStorage.getItem("codeguardian_token") || "";
      fetch('http://localhost:5000/api/security', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(fetchedData => {
          if (fetchedData && fetchedData.severityData) setData(fetchedData);
        })
        .catch(() => {});
    };
    fetchSecurity();
    const interval = setInterval(fetchSecurity, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Security Insights
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            Real-time vulnerability analysis across all repositories
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
          style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            fontWeight: 600,
          }}
        >
          <FileText size={14} />
          Export PDF Report
        </button>
      </div>

      {/* Security Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.severityData.map(({ name, value, color }) => (
          <div
            key={name}
            className="rounded-2xl p-5"
            style={{
              background: "rgba(13,13,35,0.8)",
              border: `1px solid ${color}25`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              <span style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {name}
              </span>
            </div>
            <div style={{ fontSize: "36px", fontWeight: 800, color, letterSpacing: "-1px" }}>{value}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>vulnerabilities</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Severity Distribution Pie */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", marginBottom: "16px" }}>
            Severity Distribution
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.severityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.severityData.map(({ name, color }) => (
                  <Cell key={name} fill={color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{
                  background: "#0d0d23",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "#e5e7eb",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.severityData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{name}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color, marginLeft: "auto" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Trend */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>Security Trends</div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>Vulnerability count over time</div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
            >
              <TrendingDown size={12} />
              -56% since Sep
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.trendData}>
              <defs>
                {[
                  { id: "critical", color: "#ef4444" },
                  { id: "high", color: "#f97316" },
                  { id: "medium", color: "#f59e0b" },
                  { id: "low", color: "#22c55e" },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" fill="url(#grad-critical)" strokeWidth={2} />
              <Area type="monotone" dataKey="high" name="High" stroke="#f97316" fill="url(#grad-high)" strokeWidth={2} />
              <Area type="monotone" dataKey="medium" name="Medium" stroke="#f59e0b" fill="url(#grad-medium)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="low" name="Low" stroke="#22c55e" fill="url(#grad-low)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attack Risk Heatmap */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", marginBottom: "16px" }}>
            Attack Risk Heatmap
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "3px" }}>
              <thead>
                <tr>
                  <td style={{ fontSize: "11px", color: "#4b5563", paddingRight: "8px", width: "80px" }} />
                  {weeks.map((w) => (
                    <td
                      key={w}
                      className="text-center"
                      style={{ fontSize: "10px", color: "#4b5563", paddingBottom: "4px" }}
                    >
                      {w}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.heatmapData.map(([file, ...vals], i) => (
                  <tr key={i}>
                    <td
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        paddingRight: "8px",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file}
                    </td>
                    {(vals as number[]).map((val, j) => (
                      <td key={j}>
                        <div
                          className="rounded transition-all hover:scale-110 cursor-pointer"
                          style={{
                            width: "30px",
                            height: "26px",
                            background: getHeatColor(val),
                            border: val > 5 ? "1px solid rgba(239,68,68,0.3)" : "none",
                          }}
                          title={`${file} ${weeks[j]}: ${val} issues`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-4">
              <span style={{ fontSize: "11px", color: "#4b5563" }}>Risk:</span>
              {[
                { label: "None", color: "rgba(255,255,255,0.03)" },
                { label: "Low", color: "rgba(34,197,94,0.25)" },
                { label: "Med", color: "rgba(245,158,11,0.3)" },
                { label: "High", color: "rgba(249,115,22,0.4)" },
                { label: "Critical", color: "rgba(239,68,68,0.5)" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ background: color, border: "1px solid rgba(255,255,255,0.08)" }} />
                  <span style={{ fontSize: "10px", color: "#6b7280" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vulnerability Radar */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb", marginBottom: "4px" }}>
            OWASP Attack Surface
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
            Higher = more protected
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data.radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vulnerability Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(13,13,35,0.8)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>
            Active Vulnerabilities
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["CVE ID", "Vulnerability", "File", "Severity", "CVSS", "Action"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3"
                    style={{ fontSize: "11px", color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.vulnList.map(({ id, name, file, sev, color, cvss }) => (
                <tr
                  key={id}
                  className="transition-colors hover:bg-white/3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td className="px-5 py-3">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#6b7280" }}>
                      {id}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ fontSize: "13px", fontWeight: 600, color: "#f9fafb" }}>
                    {name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {file}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: `${color}20`, color, fontWeight: 700 }}
                    >
                      {sev}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ fontSize: "13px", fontWeight: 700, color }}>
                    {cvss}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      Fix with AI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
