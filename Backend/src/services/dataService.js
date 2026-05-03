/**
 * Data Service — Unified layer for MongoDB + in-memory fallback
 * If MongoDB is connected, uses DB. Otherwise falls back to in-memory store.
 */

const { isDBConnected } = require("../config/database");
const UserModel = require("../models/User");
const ScanModel = require("../models/Scan");
const SettingsModel = require("../models/Settings");
const { users: memUsers, scans: memScans, settings: memSettings } = require("../store");
const { v4: uuidv4 } = require("uuid");

// ─── USER OPERATIONS ────────────────────────────────────────────────────────

async function findUserByEmail(email) {
  if (isDBConnected()) {
    const dbUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (dbUser) return dbUser;
    // Fall back to in-memory demo user if not found in DB
    return memUsers.find((u) => u.email === email) || null;
  }
  return memUsers.find((u) => u.email === email) || null;
}

async function findUserById(id) {
  if (isDBConnected()) {
    // Try MongoDB first
    try {
      const dbUser = await UserModel.findById(id);
      if (dbUser) return dbUser;
    } catch {
      // id might be a non-ObjectId (demo user) — fall through
    }
    // Fall back to in-memory
    return memUsers.find((u) => u.id === id) || null;
  }
  return memUsers.find((u) => u.id === id) || null;
}

async function createUser({ name, email, password, avatar, plan = "Free" }) {
  if (isDBConnected()) {
    const user = new UserModel({ name, email, password, avatar, plan, isVerified: true });
    await user.save();
    return user;
  }
  const user = { id: uuidv4(), name, email, password, avatar, plan };
  memUsers.push(user);
  return user;
}

async function updateUser(id, updates) {
  if (isDBConnected()) {
    return await UserModel.findByIdAndUpdate(id, updates, { new: true });
  }
  const user = memUsers.find((u) => u.id === id);
  if (user) Object.assign(user, updates);
  return user;
}

async function saveRefreshToken(userId, hashedToken) {
  if (isDBConnected()) {
    await UserModel.findByIdAndUpdate(userId, {
      $push: { refreshTokens: hashedToken },
    });
  }
  // In-memory: skip (stateless for demo)
}

async function removeRefreshToken(userId, hashedToken) {
  if (isDBConnected()) {
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: hashedToken },
    });
  }
}

async function setPasswordResetToken(userId, token, expires) {
  if (isDBConnected()) {
    await UserModel.findByIdAndUpdate(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }
}

async function findUserByResetToken(token) {
  if (isDBConnected()) {
    return await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }
  return null;
}

// ─── SCAN OPERATIONS ────────────────────────────────────────────────────────

async function createScan({ userId, repo, branch, language, score, securityScore, issues, status, summary, fullResult }) {
  if (isDBConnected()) {
    // Only use MongoDB if userId is a valid ObjectId
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const scan = new ScanModel({ userId, repo, branch, language, score, securityScore, issues, status, summary, fullResult });
      await scan.save();
      return scan;
    }
  }
  // In-memory fallback (also used for demo user with string ID)
  const scan = {
    id: uuidv4(),
    userId,
    repo,
    branch,
    language,
    score,
    securityScore,
    issues,
    status,
    summary,
    fullResult,
    time: new Date().toISOString(),
  };
  memScans.unshift(scan);
  return scan;
}

async function getUserScans(userId, { page = 1, limit = 20, status, language } = {}) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    const query = { userId };
    if (status) query.status = status;
    if (language) query.language = new RegExp(language, "i");

    const total = await ScanModel.countDocuments(query);
    const scans = await ScanModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return { scans: scans.map(normalizeScan), total };
  }

  let userScans = memScans.filter((s) => s.userId === userId);
  if (status) userScans = userScans.filter((s) => s.status === status);
  if (language) userScans = userScans.filter((s) => s.language.toLowerCase() === language.toLowerCase());

  const total = userScans.length;
  const paginated = userScans.slice((page - 1) * limit, (page - 1) * limit + Number(limit));
  return { scans: paginated, total };
}

async function getScanById(scanId, userId) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(scanId)) {
    const scan = await ScanModel.findOne({ _id: scanId, userId }).lean();
    return scan ? normalizeScan(scan) : null;
  }
  return memScans.find((s) => s.id === scanId && s.userId === userId) || null;
}

async function deleteScan(scanId, userId) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(scanId)) {
    const result = await ScanModel.deleteOne({ _id: scanId, userId });
    return result.deletedCount > 0;
  }
  const idx = memScans.findIndex((s) => s.id === scanId && s.userId === userId);
  if (idx === -1) return false;
  memScans.splice(idx, 1);
  return true;
}

async function getAllUserScans(userId) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    const scans = await ScanModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return scans.map(normalizeScan);
  }
  return memScans.filter((s) => s.userId === userId);
}

// ─── SETTINGS OPERATIONS ────────────────────────────────────────────────────

async function getUserSettings(userId) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    let settings = await SettingsModel.findOne({ userId }).lean();
    if (!settings) {
      const created = await SettingsModel.create({ userId });
      return created.toObject();
    }
    return settings;
  }
  return memSettings[userId] || {
    github: { connected: false, username: "" },
    gitlab: { connected: false, username: "" },
    slack: { connected: false, webhook: "" },
    theme: "dark",
    notifications: true,
  };
}

async function updateUserSettings(userId, updates) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    const settings = await SettingsModel.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    ).lean();
    return settings;
  }
  memSettings[userId] = { ...(memSettings[userId] || {}), ...updates };
  return memSettings[userId];
}

async function saveCustomRules(userId, customRules) {
  const mongoose = require("mongoose");
  if (isDBConnected() && mongoose.Types.ObjectId.isValid(userId)) {
    return await SettingsModel.findOneAndUpdate(
      { userId },
      { $set: { customRules } },
      { new: true, upsert: true }
    ).lean();
  }
  if (!memSettings[userId]) memSettings[userId] = {};
  memSettings[userId].customRules = customRules;
  return memSettings[userId];
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function normalizeScan(scan) {
  return {
    ...scan,
    id: scan._id ? scan._id.toString() : scan.id,
    userId: scan.userId ? scan.userId.toString() : scan.userId,
    time: scan.createdAt ? scan.createdAt.toISOString() : scan.time,
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  saveRefreshToken,
  removeRefreshToken,
  setPasswordResetToken,
  findUserByResetToken,
  createScan,
  getUserScans,
  getScanById,
  deleteScan,
  getAllUserScans,
  getUserSettings,
  updateUserSettings,
  saveCustomRules,
};
