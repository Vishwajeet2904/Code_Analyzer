require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./src/config/database");

const authRoutes = require("./src/routes/auth");
const dashboardRoutes = require("./src/routes/dashboard");
const reviewRoutes = require("./src/routes/review");
const historyRoutes = require("./src/routes/history");
const settingsRoutes = require("./src/routes/settings");
const securityRoutes = require("./src/routes/security");
const { generalLimiter } = require("./src/middleware/rateLimiter");

const app = express();

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins for demo deployment
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// ─── LOGGING ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── GLOBAL RATE LIMIT ───────────────────────────────────────────────────────
app.use("/api/", generalLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/analyze", reviewRoutes);       // alias for frontend compatibility
app.use("/api/history", historyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/security", securityRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const { isDBConnected } = require("./src/config/database");
  res.json({
    status: "ok",
    db: isDBConnected() ? "mongodb" : "in-memory",
    env: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()) + "s",
  });
});

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);

  // CORS error
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: err.message });
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  // Try to connect to MongoDB (non-blocking — falls back to memory)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🛡️  CodeGuardian API running on port ${PORT}`);
    console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
    console.log(`   Docs: http://localhost:${PORT}/api/health\n`);
  });
}

start();
