import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Code2,
  Shield,
  History,
  Settings,
  Zap,
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { to: "/app", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/app/review", icon: Code2, label: "Code Review" },
  { to: "/app/security", icon: Shield, label: "Security" },
  { to: "/app/history", icon: History, label: "History" },
  { to: "/app/settings", icon: Settings, label: "Settings" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("codeguardian_user") || "{}");
  const displayName = storedUser.name || "Demo User";
  const displayAvatar = storedUser.avatar || "DU";
  const displayPlan = storedUser.plan || "Free";

  const token = localStorage.getItem("codeguardian_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("codeguardian_token");
    localStorage.removeItem("codeguardian_user");
    navigate("/");
  };

  if (!token) return null;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#050510", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-64 border-r transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "rgba(10, 10, 30, 0.95)",
          borderColor: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
          >
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white" style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.3px" }}>
              CodeGuardian
            </div>
            <div style={{ fontSize: "11px", color: "#22d3ee", fontWeight: 500 }}>AI</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(34,211,238,0.1))",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    style={{ color: isActive ? "#22d3ee" : undefined }}
                  />
                  <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="ml-auto"
                      style={{ color: "#6366f1" }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Scan CTA */}
        <div className="px-3 pb-4">
          <button
            onClick={() => navigate("/app/review")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #6366f1, #22d3ee)",
              fontWeight: 600,
            }}
          >
            <Zap size={15} />
            Quick Scan
          </button>
        </div>

        {/* User */}
        <div
          className="flex items-center gap-3 px-4 py-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", fontWeight: 700 }}
          >
            {displayAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm truncate" style={{ fontWeight: 500 }}>
              {displayName}
            </div>
            <div className="text-xs truncate" style={{ color: "#6b7280" }}>
              {displayPlan} Plan
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            background: "rgba(10, 10, 30, 0.8)",
            borderColor: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
          }}
        >
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#22c55e",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              AI Engine Active
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bell size={18} />
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ background: "#f97316" }}
              />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", fontWeight: 700 }}
            >
              {displayAvatar}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#050510" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
