import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Shield, Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { API_BASE as API } from "../lib/api";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
    }
  }, [token]);

  const passwordStrength = () => {
    if (password.length === 0) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: "Weak", color: "#ef4444" };
    if (score === 2) return { label: "Fair", color: "#f59e0b" };
    if (score === 3) return { label: "Good", color: "#22d3ee" };
    return { label: "Strong", color: "#22c55e" };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#050510", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#6366f1" }} />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: "#22d3ee" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}>
            <Shield size={24} className="text-white" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            CodeGuardian <span style={{ color: "#22d3ee" }}>AI</span>
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Set new password</p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "rgba(13,13,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 80px rgba(99,102,241,0.1)" }}>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle size={48} className="mx-auto" style={{ color: "#22c55e" }} />
              <h2 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "18px" }}>Password Reset!</h2>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                Your password has been updated. Redirecting to login...
              </p>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <XCircle size={48} className="mx-auto" style={{ color: "#ef4444" }} />
              <h2 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "18px" }}>Invalid Link</h2>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>This reset link is invalid or has expired.</p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", color: "white" }}
              >
                Request New Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>New Password</label>
                <div className="relative mt-1.5">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "#4b5563" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {strength && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: strength.label === "Weak" ? "25%" : strength.label === "Fair" ? "50%" : strength.label === "Good" ? "75%" : "100%",
                          background: strength.color,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "11px", color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Confirm Password</label>
                <div className="relative mt-1.5">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${confirm && confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                      color: "#f9fafb",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = confirm && confirm !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)")}
                  />
                </div>
                {confirm && confirm !== password && (
                  <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>Passwords do not match</p>
                )}
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !password || password !== confirm}
                className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  opacity: !password || password !== confirm ? 0.5 : 1,
                  cursor: !password || password !== confirm ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
