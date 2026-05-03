const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    id: String,
    type: { type: String, enum: ["security", "bug", "performance", "code_smell"] },
    severity: { type: String, enum: ["critical", "high", "medium", "low"] },
    title: String,
    description: String,
    line: String,
    fix: String,
    refactoredCode: String,
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repo: { type: String, default: "untitled" },
    branch: { type: String, default: "main" },
    language: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    securityScore: { type: Number, min: 0, max: 100 },
    issues: { type: Number, default: 0 },
    status: { type: String, enum: ["pass", "warn", "fail"], default: "pass" },
    summary: String,
    fullResult: {
      qualityScore: Number,
      securityScore: Number,
      summary: String,
      issues: [issueSchema],
      highlights: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index for faster queries
scanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
