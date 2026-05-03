import { useState, useEffect, useRef } from "react";
import {
  Github,
  Gitlab,
  Bell,
  User,
  Shield,
  Key,
  Sun,
  Moon,
  CheckCircle,
  Plus,
  ExternalLink,
  Zap,
  AlertTriangle,
  Code2,
  Settings as SettingsIcon,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { API_BASE } from "../lib/api";

const customRules = [
  { id: 1, name: "No console.log in production", severity: "MEDIUM", active: true },
  { id: 2, name: "API routes must include rate limiting", severity: "HIGH", active: true },
  { id: 3, name: "All functions must have JSDoc comments", severity: "LOW", active: false },
  { id: 4, name: "No hardcoded credentials", severity: "CRITICAL", active: true },
  { id: 5, name: "Minimum password length: 12 chars", severity: "HIGH", active: true },
];

const severityColors: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
};

export function Settings() {
  const [darkMode, setDarkMode] = useState(() => {
    // Read from localStorage, default to dark
    return localStorage.getItem("cg_theme") !== "light";
  });

  const toggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem("cg_theme", val ? "dark" : "light");
    if (val) {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.style.filter = "";
      document.body.style.background = "#050510";
      document.body.style.color = "#f9fafb";
    } else {
      document.documentElement.classList.add("light-mode");
      // Soft light theme — just brighten backgrounds
      document.body.style.background = "#f0f2f8";
      document.body.style.color = "#0f0f1a";
      document.documentElement.style.filter = "";
    }
  };

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("cg_theme");
    if (saved === "light") {
      toggleDarkMode(false);
    }
  }, []);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoFix, setAutoFix] = useState(false);
  const [prComments, setPrComments] = useState(true);
  const [rules, setRules] = useState(customRules);
  const [newRule, setNewRule] = useState("");
  const [newRuleSev, setNewRuleSev] = useState("MEDIUM");
  const [activeSection, setActiveSection] = useState("rules");


  const rulesRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    rules: rulesRef,
    notifications: notificationsRef,
    profile: profileRef,
    api: apiRef,
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const storedUser = JSON.parse(localStorage.getItem("codeguardian_user") || "{}");
  const displayName = storedUser.name || "Demo User";
  const displayEmail = storedUser.email || "demo@codeguardian.ai";
  const displayAvatar = storedUser.avatar || "DU";
  const displayPlan = storedUser.plan || "Free";

  const token = localStorage.getItem("codeguardian_token") || "";

  useEffect(() => {
    fetch('${API_BASE}/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.customRules) setRules(data.customRules);
        if (data.theme) toggleDarkMode(data.theme === "dark");
        if (data.notifications !== undefined) setEmailAlerts(data.notifications);
        if (data.autoFix !== undefined) setAutoFix(data.autoFix);
        if (data.prComments !== undefined) setPrComments(data.prComments);
      })
      .catch(() => {});
  }, []);

  const saveSettings = async (updates: any) => {
    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      await fetch('${API_BASE}/api/settings', {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  const toggleRule = async (id: number) => {
    const updatedRules = rules.map((r) => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updatedRules);

    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      await fetch('${API_BASE}/api/settings/rules', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customRules: updatedRules })
      });
    } catch (e) {
      console.error("Failed to save rules to backend", e);
    }
  };

  const deleteRule = async (id: number) => {
    const updatedRules = rules.filter((r) => r.id !== id);
    setRules(updatedRules);

    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      await fetch('${API_BASE}/api/settings/rules', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customRules: updatedRules })
      });
    } catch (e) {
      console.error("Failed to save rules to backend", e);
    }
  };

  const addRule = async () => {
    if (!newRule.trim()) return;
    const addedRow = { id: Date.now(), name: newRule.trim(), severity: newRuleSev, active: true };
    const updatedRules = [...rules, addedRow];
    setRules(updatedRules);
    setNewRule("");

    const token = localStorage.getItem("codeguardian_token") || "";
    try {
      await fetch('${API_BASE}/api/settings/rules', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customRules: updatedRules })
      });
    } catch (e) {
      console.error("Failed to save rules to backend", e);
    }
  };

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCurrentPass, setEditCurrentPass] = useState("");
  const [editNewPass, setEditNewPass] = useState("");
  const [editMsg, setEditMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const openEditProfile = () => {
    setEditName(displayName);
    setEditCurrentPass("");
    setEditNewPass("");
    setEditMsg(null);
    setEditProfileOpen(true);
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg(null);
    try {
      const body: Record<string, string> = {};
      if (editName.trim() && editName !== displayName) body.name = editName.trim();
      if (editNewPass) { body.currentPassword = editCurrentPass; body.newPassword = editNewPass; }
      if (!Object.keys(body).length) { setEditMsg({ type: "error", text: "No changes made" }); setEditLoading(false); return; }

      const res = await fetch("${API_BASE}/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditMsg({ type: "error", text: data.error || "Update failed" });
      } else {
        localStorage.setItem("codeguardian_user", JSON.stringify({ ...data.user, plan: data.user.plan || "Free" }));
        setEditMsg({ type: "success", text: "Profile updated successfully" });
        setTimeout(() => setEditProfileOpen(false), 1000);
      }
    } catch {
      setEditMsg({ type: "error", text: "Failed to connect to server" });
    } finally {
      setEditLoading(false);
    }
  };

  const sections = [
    { id: "rules", label: "Custom Rules", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <>
    <div className="flex h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Settings sidebar */}
      <div
        className="hidden md:flex flex-col w-52 border-r p-4 gap-1"
        style={{
          background: "rgba(10,10,25,0.5)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left"
            style={{
              background: activeSection === id ? "rgba(99,102,241,0.15)" : "transparent",
              border: activeSection === id ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
              color: activeSection === id ? "#a5b4fc" : "#6b7280",
              fontWeight: activeSection === id ? 600 : 400,
            }}
          >
            <Icon size={15} style={{ color: activeSection === id ? "#6366f1" : undefined }} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            Settings
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "2px" }}>
            Manage integrations, rules, and preferences
          </p>
        </div>

        {/* Custom Rule Engine */}
        <div
          ref={sectionRefs.rules}
          className="rounded-2xl"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: "#a855f7" }} />
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>
                Custom Rule Engine
              </span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}
              >
                {rules.filter((r) => r.active).length} active rules
              </span>
            </div>
          </div>

          {/* Add rule */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(168,85,247,0.04)" }}
          >
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRule()}
              placeholder="Define a new rule, e.g. No eval() in production…"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f9fafb",
              }}
            />
            <select
              value={newRuleSev}
              onChange={(e) => setNewRuleSev(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: severityColors[newRuleSev] || "#9ca3af",
                fontWeight: 600,
              }}
            >
              {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={addRule}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Add Rule
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {rules.map(({ id, name, severity, active }) => (
              <div key={id} className="flex items-center gap-4 px-6 py-4">
                {/* Toggle */}
                <button
                  onClick={() => toggleRule(id)}
                  className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: active ? "calc(100% - 18px)" : "2px" }}
                  />
                </button>

                <span
                  style={{
                    flex: 1,
                    color: active ? "#f9fafb" : "#4b5563",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  {name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: `${severityColors[severity]}15`,
                    color: severityColors[severity],
                    fontWeight: 700,
                  }}
                >
                  {severity}
                </span>
                <button
                  onClick={() => deleteRule(id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div
          ref={sectionRefs.notifications}
          className="rounded-2xl"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>Preferences</div>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {[
              {
                label: "Dark Mode",
                desc: "Enable dark developer theme",
                icon: darkMode ? Moon : Sun,
                iconColor: "#6366f1",
                val: darkMode,
                set: toggleDarkMode,
              },
              {
                label: "Email Alerts",
                desc: "Receive email for critical vulnerabilities",
                icon: Bell,
                iconColor: "#22d3ee",
                val: emailAlerts,
                set: setEmailAlerts,
              },
              {
                label: "Auto-Apply AI Fixes",
                desc: "Automatically apply low-risk AI suggestions",
                icon: Zap,
                iconColor: "#a855f7",
                val: autoFix,
                set: setAutoFix,
              },
              {
                label: "PR Bot Comments",
                desc: "Post AI review comments on pull requests",
                icon: AlertTriangle,
                iconColor: "#f59e0b",
                val: prComments,
                set: setPrComments,
              },
            ].map(({ label, desc, icon: Icon, iconColor, val, set }) => (
              <div key={label} className="flex items-center gap-4 px-6 py-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${iconColor}15` }}
                >
                  <Icon size={16} style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#f9fafb" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>{desc}</div>
                </div>
                <button
                  onClick={() => {
                    const newVal = !val;
                    set(newVal);
                    const keyMap: any = {
                      "Dark Mode": "theme",
                      "Email Alerts": "notifications",
                      "Auto-Apply AI Fixes": "autoFix",
                      "PR Bot Comments": "prComments"
                    };
                    if (keyMap[label]) {
                      saveSettings({ [keyMap[label]]: label === "Dark Mode" ? (newVal ? "dark" : "light") : newVal });
                    }
                  }}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{
                    background: val
                      ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: val ? "calc(100% - 18px)" : "2px" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div
          ref={sectionRefs.profile}
          className="rounded-2xl"
          style={{
            background: "rgba(13,13,35,0.8)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f9fafb" }}>Profile</div>
          </div>
          <div className="px-6 py-5 flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", fontWeight: 800 }}
            >
              {displayAvatar}
            </div>
            <div className="flex-1">
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#f9fafb" }}>{displayName}</div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>{displayEmail}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.15))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    color: "#a5b4fc",
                    fontWeight: 600,
                  }}
                >
                  {displayPlan} Plan
                </span>
              </div>
            </div>
            <button
              onClick={openEditProfile}
              className="text-sm px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#a5b4fc",
                fontWeight: 600,
              }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Profile Modal */}
    {editProfileOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "rgba(13,13,35,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#f9fafb" }}>Edit Profile</h2>
            <button onClick={() => setEditProfileOpen(false)} style={{ color: "#6b7280", fontSize: "20px" }}>✕</button>
          </div>

          <form onSubmit={handleEditProfile} className="space-y-4">
            <div>
              <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mt-1.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
              />
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>Change Password (optional)</p>
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Current Password</label>
                  <input
                    type="password"
                    value={editCurrentPass}
                    onChange={(e) => setEditCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none mt-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>New Password</label>
                  <input
                    type="password"
                    value={editNewPass}
                    onChange={(e) => setEditNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none mt-1.5"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                  />
                </div>
              </div>
            </div>

            {editMsg && (
              <div style={{ color: editMsg.type === "success" ? "#22c55e" : "#ef4444", fontSize: "13px", textAlign: "center" }}>
                {editMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditProfileOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}>
                Cancel
              </button>
              <button type="submit" disabled={editLoading}
                className="flex-1 py-3 rounded-xl text-sm text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 600 }}>
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
