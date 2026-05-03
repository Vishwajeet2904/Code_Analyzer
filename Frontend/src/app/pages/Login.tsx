import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Github, Chrome, Mail, Lock, Eye, EyeOff, ArrowLeft, Zap } from "lucide-react";

const API = "http://localhost:5000";

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup") {
      try {
        const res = await fetch(`${API}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "An error occurred");
        } else {
          setPendingEmail(email);
          setOtpStep(true);
        }
      } catch {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "An error occurred");
      } else {
        localStorage.setItem("codeguardian_token", data.token);
        localStorage.setItem("codeguardian_user", JSON.stringify(data.user));
        navigate("/app");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
      } else {
        localStorage.setItem("codeguardian_token", data.token);
        localStorage.setItem("codeguardian_user", JSON.stringify(data.user));
        navigate("/app");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    const res = await fetch(`${API}/api/auth/oauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const data = await res.json();
    localStorage.setItem("codeguardian_token", data.token);
    localStorage.setItem("codeguardian_user", JSON.stringify(data.user));
    navigate("/app");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#050510", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#6366f1" }} />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: "#22d3ee" }} />

      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "#6b7280" }}
      >
        <ArrowLeft size={16} />
        Back to Home
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
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            {otpStep ? "Verify your email" : mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div className="rounded-2xl p-7" style={{ background: "rgba(13,13,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 0 80px rgba(99,102,241,0.1)" }}>

          {/* Mode toggle - hide on OTP step */}
          {!otpStep && (
            <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.05)" }}>
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className="flex-1 py-2 rounded-lg text-sm transition-all"
                  style={{
                    background: mode === m ? "linear-gradient(135deg, #6366f1, #22d3ee)" : "transparent",
                    color: mode === m ? "white" : "#6b7280",
                    fontWeight: mode === m ? 600 : 400,
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* OTP Verification Screen */}
          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div style={{ fontSize: "48px" }}>📧</div>
                <p style={{ color: "#f9fafb", fontWeight: 600, fontSize: "15px", marginTop: "8px" }}>Check your email</p>
                <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px" }}>
                  We sent a 6-digit code to
                </p>
                <p style={{ color: "#22d3ee", fontSize: "13px", fontWeight: 600 }}>{pendingEmail}</p>
              </div>

              <div>
                <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all text-center mt-1.5"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f9fafb",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "10px",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              {error && <div className="text-red-400 text-sm text-center">{error}</div>}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                  fontWeight: 700,
                  opacity: otp.length !== 6 ? 0.5 : 1,
                  cursor: otp.length !== 6 ? "not-allowed" : "pointer",
                }}
              >
                <Zap size={15} />
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtp(""); setError(""); }}
                className="w-full text-sm py-2"
                style={{ color: "#6b7280" }}
              >
                ← Back to signup
              </button>
            </form>
          ) : (
            <>
              {/* Social auth — Demo mode */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: "11px", color: "#4b5563" }}>Quick access</span>
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", fontSize: "10px", fontWeight: 700 }}>DEMO</span>
                </div>
                <button
                  onClick={() => handleOAuth("GitHub")}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb", fontWeight: 500 }}
                >
                  <Github size={18} />
                  Demo Login via GitHub
                </button>
                <button
                  onClick={() => handleOAuth("Google")}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb", fontWeight: 500 }}
                >
                  <Chrome size={18} />
                  Demo Login via Google
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: "12px", color: "#4b5563" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Full Name</label>
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Kumar"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                        onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Email</label>
                  <div className="relative mt-1.5">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f9fafb" }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 500 }}>Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                        style={{ fontSize: "12px", color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#4b5563" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
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
                </div>

                {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 active:scale-95 mt-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)", fontWeight: 700, boxShadow: "0 0 30px rgba(99,102,241,0.3)" }}
                >
                  <Zap size={15} />
                  {loading
                    ? (mode === "signup" ? "Sending OTP..." : "Processing...")
                    : (mode === "login" ? "Sign In to Dashboard" : "Send Verification Code")}
                </button>
              </form>

              <p className="text-center mt-5" style={{ fontSize: "13px", color: "#6b7280" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                  style={{ color: "#22d3ee", fontWeight: 600 }}
                >
                  {mode === "login" ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center mt-5" style={{ fontSize: "12px", color: "#4b5563" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
