const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");
const { settings, users } = require("../store");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const userSettings = settings[req.user.id] || {
    github: { connected: false, username: "" },
    gitlab: { connected: false, username: "" },
    slack: { connected: false, webhook: "" },
    theme: "dark",
    notifications: true,
  };
  const user = users.find((u) => u.id === req.user.id);
  res.json({ ...userSettings, profile: { name: user?.name, email: user?.email, avatar: user?.avatar, plan: user?.plan } });
});

router.put("/", authMiddleware, (req, res) => {
  settings[req.user.id] = { ...(settings[req.user.id] || {}), ...req.body };
  res.json({ message: "Settings saved", settings: settings[req.user.id] });
});

// Connect GitHub (demo)
router.post("/github/connect", authMiddleware, async (req, res) => {
  const username = req.body.username?.trim();
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { "User-Agent": "CodeGuardian-App" }
    });
    if (response.status === 404) return res.status(404).json({ error: "GitHub user not found" });
    if (!response.ok) return res.status(400).json({ error: "Could not verify GitHub user" });

    const ghUser = await response.json();
    if (!settings[req.user.id]) settings[req.user.id] = {};
    settings[req.user.id].github = { connected: true, username: ghUser.login, avatar: ghUser.avatar_url, name: ghUser.name };
    res.json({ message: "GitHub connected", github: settings[req.user.id].github });
  } catch {
    res.status(500).json({ error: "Failed to verify GitHub user" });
  }
});

// Connect GitLab (demo)
router.post("/gitlab/connect", authMiddleware, (req, res) => {
  if (!settings[req.user.id]) settings[req.user.id] = {};
  settings[req.user.id].gitlab = { connected: true, username: req.body.username || "demo-user" };
  res.json({ message: "GitLab connected", gitlab: settings[req.user.id].gitlab });
});

// Connect Slack (demo)
router.post("/slack/connect", authMiddleware, (req, res) => {
  if (!settings[req.user.id]) settings[req.user.id] = {};
  settings[req.user.id].slack = { connected: true, webhook: req.body.webhook || "https://hooks.slack.com/demo" };
  res.json({ message: "Slack connected" });
});

// Save custom rules
router.post("/rules", authMiddleware, (req, res) => {
  if (!settings[req.user.id]) settings[req.user.id] = {};
  settings[req.user.id].customRules = req.body.customRules;
  res.json({ message: "Rules saved" });
});

router.get("/rules", authMiddleware, (req, res) => {
  const userSettings = settings[req.user.id] || {};
  res.json({ customRules: userSettings.customRules || [] });
});

// Update profile
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (name) {
    user.name = name;
    user.avatar = name.slice(0, 2).toUpperCase();
  }

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "Current password required" });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  res.json({ message: "Profile updated", user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, plan: user.plan } });
});

module.exports = router;
