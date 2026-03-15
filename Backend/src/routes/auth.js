const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { users } = require("../store");
const { sendOtpEmail } = require("../services/emailService");

const router = express.Router();

// Temporary store for pending registrations { email -> { name, hashedPassword, otp, expiresAt } }
const pendingUsers = {};

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// Email/password login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan } });
});

// Register - Step 1: send OTP
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

  if (users.find((u) => u.email === email)) return res.status(409).json({ error: "Email already exists" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = await bcrypt.hash(password, 10);

  pendingUsers[email] = {
    name,
    hashedPassword: hashed,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  };

  try {
    await sendOtpEmail(email, name, otp);
    res.json({ message: "OTP sent to your email", email });
  } catch (err) {
    delete pendingUsers[email];
    console.error("OTP email error:", err);
    res.status(500).json({ error: "Failed to send OTP: " + err.message });
  }
});

// Register - Step 2: verify OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const pending = pendingUsers[email];
  if (!pending) return res.status(400).json({ error: "No pending registration for this email" });
  if (Date.now() > pending.expiresAt) {
    delete pendingUsers[email];
    return res.status(400).json({ error: "OTP expired. Please register again." });
  }
  if (pending.otp !== otp.trim()) return res.status(400).json({ error: "Invalid OTP" });

  const user = {
    id: uuidv4(),
    name: pending.name,
    email,
    password: pending.hashedPassword,
    avatar: pending.name.slice(0, 2).toUpperCase(),
    plan: "Free",
  };
  users.push(user);
  delete pendingUsers[email];

  res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan } });
});

// OAuth simulation (GitHub / Google) — for demo
router.post("/oauth", (req, res) => {
  const { provider } = req.body;
  const user = users[0]; // demo user
  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan },
    message: `Logged in with ${provider}`,
  });
});

module.exports = router;
