// In-memory store — used as fallback when MongoDB is not connected
const users = [
  {
    id: "demo-user-1",
    name: "Demo User",
    email: "demo@codeguardian.ai",
    // password: "demo123"
    password: "$2a$10$PYGin.KSebsqzAlqwkI7au2AhwYS6nVughxgH0ZcVjKbE98fXIMxO",
    avatar: "DU",
    plan: "Pro",
  },
];

// No hardcoded scans — all scans come from real user activity
const scans = [];

const settings = {
  "demo-user-1": {
    github: { connected: false, username: "" },
    gitlab: { connected: false, username: "" },
    slack: { connected: false, webhook: "" },
    theme: "dark",
    notifications: true,
  },
};

module.exports = { users, scans, settings };
