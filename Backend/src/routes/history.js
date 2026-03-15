const express = require("express");
const authMiddleware = require("../middleware/auth");
const { scans } = require("../store");

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const { page = 1, limit = 20, status, language } = req.query;

  let userScans = scans.filter((s) => s.userId === req.user.id);

  if (status) userScans = userScans.filter((s) => s.status === status);
  if (language) userScans = userScans.filter((s) => s.language.toLowerCase() === language.toLowerCase());

  const total = userScans.length;
  const start = (page - 1) * limit;
  const paginated = userScans.slice(start, start + Number(limit));

  // Map to frontend-expected format
  const formatted = paginated.map((s, i) => ({
    id: s.id,
    repo: s.repo,
    branch: s.branch,
    lang: s.language,
    score: s.score,
    critical: s.fullResult?.issues?.filter(x => x.severity === "critical").length ?? Math.floor(s.issues * 0.1),
    high: s.fullResult?.issues?.filter(x => x.severity === "high").length ?? Math.floor(s.issues * 0.25),
    medium: s.fullResult?.issues?.filter(x => x.severity === "medium").length ?? Math.floor(s.issues * 0.4),
    low: s.fullResult?.issues?.filter(x => x.severity === "low").length ?? Math.floor(s.issues * 0.25),
    issues: s.issues,
    duration: `${Math.floor(Math.random() * 25) + 8}s`,
    timestamp: new Date(s.time).toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
    status: s.status,
    commit: s.id.slice(-7),
  }));

  res.json(formatted);
});

router.get("/:id", authMiddleware, (req, res) => {
  const scan = scans.find((s) => s.id === req.params.id && s.userId === req.user.id);
  if (!scan) return res.status(404).json({ error: "Scan not found" });
  res.json(scan);
});

router.delete("/:id", authMiddleware, (req, res) => {
  const idx = scans.findIndex((s) => s.id === req.params.id && s.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Scan not found" });
  scans.splice(idx, 1);
  res.json({ message: "Deleted" });
});

module.exports = router;
