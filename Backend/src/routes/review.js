const express = require("express");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/auth");
const { analyzeCode, getFixSuggestion, fixAllIssues } = require("../services/aiService");
const { sendCriticalAlertEmail } = require("../services/emailService");
const { postPRComment } = require("../services/githubService");
const { scans, users, settings } = require("../store");

const router = express.Router();

// Analyze code with AI
router.post("/analyze", authMiddleware, async (req, res) => {
  const { code, language, repo = "untitled", branch = "main" } = req.body;

  if (!code || !language) return res.status(400).json({ error: "code and language are required" });
  if (code.length > 10000) return res.status(400).json({ error: "Code too long (max 10,000 chars)" });

  try {
    const userSettings = settings[req.user.id] || {};
    const customRules = userSettings.customRules || [];
    const result = await analyzeCode(code, language, customRules);

    // Save scan to history
    const scan = {
      id: uuidv4(),
      userId: req.user.id,
      repo,
      branch,
      language,
      score: result.qualityScore,
      securityScore: result.securityScore,
      issues: result.issues.length,
      status: result.qualityScore >= 80 ? "pass" : result.qualityScore >= 65 ? "warn" : "fail",
      time: new Date().toISOString(),
      summary: result.summary,
      fullResult: result,
    };
    scans.unshift(scan);

    // Send email alert if critical issues found
    const hasCritical = result.issues.some((i) => i.severity === "critical");
    if (hasCritical && process.env.EMAIL_USER) {
      const user = users.find((u) => u.id === req.user.id);
      if (user?.email) {
        sendCriticalAlertEmail(user.email, user.name, result.issues, repo).catch((err) =>
          console.error("Email alert failed:", err.message)
        );
      }
    }

    // Post PR comment if setting is on
    let prCommentPosted = false;
    if (userSettings.prComments && result.issues.length > 0) {
      prCommentPosted = await postPRComment(repo, result.issues);
    }

    res.json({ scanId: scan.id, prCommentPosted, ...result });
  } catch (err) {
    console.error("AI analysis error:", err.message);
    res.status(500).json({ error: "AI analysis failed: " + err.message });
  }
});

// Get fix suggestion for a specific issue
router.post("/fix", authMiddleware, async (req, res) => {
  const { code, issue, language } = req.body;

  if (!code || !issue || !language) return res.status(400).json({ error: "code, issue, and language are required" });

  try {
    const userSettings = settings[req.user.id] || {};
    const customRules = userSettings.customRules || [];
    const fix = await getFixSuggestion(code, issue, language, customRules);
    res.json(fix);
  } catch (err) {
    console.error("Fix suggestion error:", err.message);
    res.status(500).json({ error: "Fix suggestion failed" });
  }
});

// Fix all issues at once
router.post("/fix-all", authMiddleware, async (req, res) => {
  const { code, issues, language } = req.body;
  if (!code || !issues || !language) return res.status(400).json({ error: "code, issues, and language are required" });
  if (!Array.isArray(issues) || issues.length === 0) return res.status(400).json({ error: "issues must be a non-empty array" });

  try {
    const userSettings = settings[req.user.id] || {};
    const customRules = userSettings.customRules || [];
    const result = await fixAllIssues(code, issues, language, customRules);
    res.json(result);
  } catch (err) {
    console.error("Fix all error:", err.message);
    res.status(500).json({ error: "Fix all failed: " + err.message });
  }
});

module.exports = router;
