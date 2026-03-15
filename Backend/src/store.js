// In-memory store — perfect for hackathon demo
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

const scans = [
  {
    id: "scan-1",
    userId: "demo-user-1",
    repo: "api-service",
    branch: "main",
    language: "Node.js",
    score: 94,
    securityScore: 91,
    issues: 2,
    status: "pass",
    time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "scan-2",
    userId: "demo-user-1",
    repo: "auth-module",
    branch: "feat/oauth",
    language: "TypeScript",
    score: 71,
    securityScore: 65,
    issues: 8,
    status: "warn",
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "scan-3",
    userId: "demo-user-1",
    repo: "payments-api",
    branch: "main",
    language: "Python",
    score: 88,
    securityScore: 85,
    issues: 4,
    status: "pass",
    time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "scan-4",
    userId: "demo-user-1",
    repo: "user-service",
    branch: "fix/xss",
    language: "Java",
    score: 56,
    securityScore: 48,
    issues: 15,
    status: "fail",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "scan-5",
    userId: "demo-user-1",
    repo: "frontend-app",
    branch: "dev",
    language: "React",
    score: 82,
    securityScore: 79,
    issues: 6,
    status: "pass",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

const settings = {
  "demo-user-1": {
    github: { connected: true, username: "demo-user" },
    gitlab: { connected: false, username: "" },
    slack: { connected: false, webhook: "" },
    theme: "dark",
    notifications: true,
  },
};

module.exports = { users, scans, settings };
