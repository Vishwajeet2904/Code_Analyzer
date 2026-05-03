import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { API_BASE as API } from "../lib/api";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSent(true);
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

      <button
        onClick={() => navigate("/login")}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "#6b7280" }}
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}>
            <Shield size={24} className="text-white" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>
            CodeGuardian <span style={{ color: "#22d3ee" }}>AI</span>
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>Reset your password</p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "rgba(13,13,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 80px rgba(99,102,241,0.1)" }}>
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle size={48} className="mx-auto" style={{ color: "#22c55e" }} />
              <h2 style={{ color: "#f9fafb", fontWeight: 700, fontSize: "18px" }}>Check your inbox</h2>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                If <strong style={{ color: "#22d3ee" }}>{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <p style={{ color: "#6b7280", fontSize: "13px" }}>The link expires in 1 hour.</p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", color: "white" }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Email Address</label>
                <div className="relative mt-1.5">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  opacity: !email ? 0.5 : 1,
                  cursor: !email ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
