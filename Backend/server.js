require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth");
const dashboardRoutes = require("./src/routes/dashboard");
const reviewRoutes = require("./src/routes/review");
const historyRoutes = require("./src/routes/history");
const settingsRoutes = require("./src/routes/settings");
const securityRoutes = require("./src/routes/security");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/analyze", reviewRoutes); // alias for frontend compatibility
app.use("/api/history", historyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/security", securityRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CodeGuardian API running on port ${PORT}`));
