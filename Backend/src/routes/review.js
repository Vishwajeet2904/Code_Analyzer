const express = require("express");
const authMiddleware = require("../middleware/auth");
const { validate, analyzeSchema, fixSchema, fixAllSchema } = require("../middleware/validate");
const { aiLimiter } = require("../middleware/rateLimiter");
const { analyzeCode, getFixSuggestion, fixAllIssues } = require("../services/aiService");
const { sendCriticalAlertEmail } = require("../services/emailService");
const { postPRComment } = require("../services/githubService");
const { createScan, getUserSettings, findUserById } = require("../services/dataService");

const router = express.Router();

// ─── ANALYZE CODE ─────────────────────────────────────────────────────────────

router.post("/analyze", authMiddleware, aiLimiter, validate(analyzeSchema), async (req, res) => {
  const { code, language, repo, branch } = req.body;

  try {
    const userSettings = await getUserSettings(req.user.id);
    const customRules = userSettings?.customRules || [];

    const result = await analyzeCode(code, language, customRules);

    // Save scan to DB / memory
    const scan = await createScan({
      userId: req.user.id,
      repo,
      branch,
      language,
      score: result.qualityScore,
      securityScore: result.securityScore,
      issues: result.issues.length,
      status: result.qualityScore >= 80 ? "pass" : result.qualityScore >= 65 ? "warn" : "fail",
      summary: result.summary,
      fullResult: result,
    });

    // Send critical alert email (non-blocking)
    const hasCritical = result.issues.some((i) => i.severity === "critical");
    if (hasCritical && userSettings?.emailAlerts !== false) {
      findUserById(req.user.id)
        .then((user) => {
          if (user?.email) {
            sendCriticalAlertEmail(user.email, user.name, result.issues, repo).catch((err) =>
              console.error("Email alert failed:", err.message)
            );
          }
        })
        .catch(() => {});
    }

    // Post PR comment if enabled
    let prCommentPosted = false;
    if (userSettings?.prComments && result.issues.length > 0) {
      prCommentPosted = await postPRComment(repo, result.issues).catch(() => false);
    }

    const scanId = scan._id ? scan._id.toString() : scan.id;
    res.json({ scanId, prCommentPosted, ...result });
  } catch (err) {
    console.error("AI analysis error:", err.message);
    res.status(500).json({ error: "AI analysis failed: " + err.message });
  }
});

// ─── GET FIX FOR SINGLE ISSUE ─────────────────────────────────────────────────

router.post("/fix", authMiddleware, aiLimiter, validate(fixSchema), async (req, res) => {
  const { code, issue, language } = req.body;

  try {
    const userSettings = await getUserSettings(req.user.id);
    const customRules = userSettings?.customRules || [];
    const fix = await getFixSuggestion(code, issue, language, customRules);
    res.json(fix);
  } catch (err) {
    console.error("Fix suggestion error:", err.message);
    res.status(500).json({ error: "Fix suggestion failed" });
  }
});

// ─── FIX ALL ISSUES ───────────────────────────────────────────────────────────

router.post("/fix-all", authMiddleware, aiLimiter, validate(fixAllSchema), async (req, res) => {
  const { code, issues, language } = req.body;

  try {
    const userSettings = await getUserSettings(req.user.id);
    const customRules = userSettings?.customRules || [];
    const result = await fixAllIssues(code, issues, language, customRules);
    res.json(result);
  } catch (err) {
    console.error("Fix all error:", err.message);
    res.status(500).json({ error: "Fix all failed: " + err.message });
  }
});

module.exports = router;
