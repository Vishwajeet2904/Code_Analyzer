const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOtpEmail, sendPasswordResetEmail } = require("../services/emailService");
const {
  findUserByEmail,
  createUser,
  updateUser,
  saveRefreshToken,
  removeRefreshToken,
  setPasswordResetToken,
  findUserByResetToken,
} = require("../services/dataService");
const { validate, loginSchema, registerSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } = require("../middleware/validate");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Temporary store for pending registrations { email -> { name, hashedPassword, otp, expiresAt } }
const pendingUsers = {};

// ─── TOKEN HELPERS ───────────────────────────────────────────────────────────

function signAccessToken(user) {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    { id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // short-lived access token
  );
}

function signRefreshToken(user) {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    { id, type: "refresh" },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "30d" }
  );
}

function safeUser(user) {
  if (user.toSafeObject) return user.toSafeObject();
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    plan: user.plan,
  };
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Store hashed refresh token
    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await saveRefreshToken(user._id || user.id, hashedRefresh);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── REGISTER (Step 1: Send OTP) ─────────────────────────────────────────────

router.post("/register", otpLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 12);

    pendingUsers[email] = {
      name,
      hashedPassword: hashed,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    console.log(`\n🔑 OTP for ${email}: ${otp}\n`);

    let emailSent = false;
    try {
      await sendOtpEmail(email, name, otp);
      emailSent = true;
    } catch (emailErr) {
      console.warn("Email failed:", emailErr.message);
    }

    res.json({
      message: emailSent ? "OTP sent to your email" : "OTP generated",
      email,
      ...(!emailSent && { demoOtp: otp }),
    });
  } catch (err) {
    delete pendingUsers[email];
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── VERIFY OTP (Step 2: Complete Registration) ───────────────────────────────

router.post("/verify-otp", validate(verifyOtpSchema), async (req, res) => {
  const { email, otp } = req.body;

  const pending = pendingUsers[email];
  if (!pending) return res.status(400).json({ error: "No pending registration for this email" });
  if (Date.now() > pending.expiresAt) {
    delete pendingUsers[email];
    return res.status(400).json({ error: "OTP expired. Please register again." });
  }
  if (pending.otp !== otp.trim()) return res.status(400).json({ error: "Invalid OTP" });

  try {
    const avatar = pending.name.slice(0, 2).toUpperCase();
    const user = await createUser({
      name: pending.name,
      email,
      password: pending.hashedPassword,
      avatar,
      plan: "Free",
    });
    delete pendingUsers[email];

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const hashedRefresh = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await saveRefreshToken(user._id || user.id, hashedRefresh);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: accessToken, user: safeUser(user) });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
    );

    if (decoded.type !== "refresh") return res.status(401).json({ error: "Invalid token type" });

    // Verify token is in DB (rotation check)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const { findUserById } = require("../services/dataService");
    const user = await findUserById(decoded.id);

    if (!user) return res.status(401).json({ error: "User not found" });

    // Issue new access token
    const newAccessToken = signAccessToken(user);
    res.json({ token: newAccessToken });
  } catch (err) {
    res.clearCookie("refreshToken");
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

router.post("/logout", authMiddleware, async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await removeRefreshToken(req.user.id, hashedToken).catch(() => {});
  }

  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await setPasswordResetToken(user._id || user.id, hashedToken, expires);
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

router.post("/reset-password", validate(resetPasswordSchema), async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await findUserByResetToken(hashedToken);

    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await updateUser(user._id || user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ─── OAUTH (Demo) ─────────────────────────────────────────────────────────────

router.post("/oauth", async (req, res) => {
  const { provider } = req.body;
  if (!provider) return res.status(400).json({ error: "Provider required" });

  try {
    // Demo: use first user or create a demo user
    const { users: memUsers } = require("../store");
    const user = memUsers[0];
    if (!user) return res.status(500).json({ error: "No demo user available" });

    const accessToken = signAccessToken(user);
    res.json({
      token: accessToken,
      user: safeUser(user),
      message: `Demo login with ${provider}`,
    });
  } catch (err) {
    res.status(500).json({ error: "OAuth failed" });
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { findUserById } = require("../services/dataService");
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
