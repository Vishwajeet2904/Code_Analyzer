const mongoose = require("mongoose");

const customRuleSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    description: String,
    severity: { type: String, enum: ["critical", "high", "medium", "low"] },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    github: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: "" },
      avatar: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    gitlab: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: "" },
    },
    slack: {
      connected: { type: Boolean, default: false },
      webhook: { type: String, default: "" },
    },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    notifications: { type: Boolean, default: true },
    prComments: { type: Boolean, default: false },
    autoFix: { type: Boolean, default: false },
    emailAlerts: { type: Boolean, default: true },
    customRules: [customRuleSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
