const express = require("express");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/auth");
const { validate, profileUpdateSchema } = require("../middleware/validate");
const { getUserSettings, updateUserSettings, saveCustomRules, findUserById, updateUser } = require("../services/dataService");

const router = express.Router();

// GET /api/settings
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [userSettings, user] = await Promise.all([
      getUserSettings(req.user.id),
      findUserById(req.user.id),
    ]);

    res.json({
      ...userSettings,
      profile: {
        name: user?.name,
        email: user?.email,
        avatar: user?.avatar,
        plan: user?.plan,
      },
    });
  } catch (err) {
    console.error("Settings GET error:", err.message);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PUT /api/settings
router.put("/", authMiddleware, async (req, res) => {
  try {
    // Whitelist allowed settings fields
    const allowed = ["theme", "notifications", "prComments", "autoFix", "emailAlerts"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await updateUserSettings(req.user.id, updates);
    res.json({ message: "Settings saved", settings: updated });
  } catch (err) {
    console.error("Settings PUT error:", err.message);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// POST /api/settings/github/connect
router.post("/github/connect", authMiddleware, async (req, res) => {
  const username = req.body.username?.trim();
  if (!username) return res.status(400).json({ error: "GitHub username required" });

  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        "User-Agent": "CodeGuardian-App",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
      },
    });

    if (response.status === 404) return res.status(404).json({ error: "GitHub user not found" });
    if (response.status === 403) return res.status(429).json({ error: "GitHub API rate limit reached. Try again later." });
    if (!response.ok) return res.status(400).json({ error: "Could not verify GitHub user" });

    const ghUser = await response.json();
    await updateUserSettings(req.user.id, {
      github: {
        connected: true,
        username: ghUser.login,
        avatar: ghUser.avatar_url,
        name: ghUser.name || ghUser.login,
      },
    });

    res.json({
      message: "GitHub connected successfully",
      github: { connected: true, username: ghUser.login, avatar: ghUser.avatar_url, name: ghUser.name },
    });
  } catch (err) {
    console.error("GitHub connect error:", err.message);
    res.status(500).json({ error: "Failed to connect GitHub" });
  }
});

// POST /api/settings/gitlab/connect
router.post("/gitlab/connect", authMiddleware, async (req, res) => {
  const username = req.body.username?.trim();
  if (!username) return res.status(400).json({ error: "GitLab username required" });

  try {
    await updateUserSettings(req.user.id, {
      gitlab: { connected: true, username },
    });
    res.json({ message: "GitLab connected", gitlab: { connected: true, username } });
  } catch (err) {
    res.status(500).json({ error: "Failed to connect GitLab" });
  }
});

// POST /api/settings/slack/connect
router.post("/slack/connect", authMiddleware, async (req, res) => {
  const webhook = req.body.webhook?.trim();
  if (!webhook) return res.status(400).json({ error: "Slack webhook URL required" });
  if (!webhook.startsWith("https://hooks.slack.com/")) {
    return res.status(400).json({ error: "Invalid Slack webhook URL" });
  }

  try {
    await updateUserSettings(req.user.id, {
      slack: { connected: true, webhook },
    });
    res.json({ message: "Slack connected successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to connect Slack" });
  }
});

// POST /api/settings/rules — save custom rules
router.post("/rules", authMiddleware, async (req, res) => {
  const { customRules } = req.body;
  if (!Array.isArray(customRules)) return res.status(400).json({ error: "customRules must be an array" });

  try {
    await saveCustomRules(req.user.id, customRules);
    res.json({ message: "Custom rules saved", count: customRules.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to save rules" });
  }
});

// GET /api/settings/rules
router.get("/rules", authMiddleware, async (req, res) => {
  try {
    const settings = await getUserSettings(req.user.id);
    res.json({ customRules: settings?.customRules || [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rules" });
  }
});

// PUT /api/settings/profile
router.put("/profile", authMiddleware, validate(profileUpdateSchema), async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;

  try {
    const user = await findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updates = {};

    if (name) {
      updates.name = name;
      updates.avatar = name.slice(0, 2).toUpperCase();
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "Current password required" });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
      updates.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await updateUser(req.user.id, updates);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updated._id ? updated._id.toString() : updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        plan: updated.plan,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
