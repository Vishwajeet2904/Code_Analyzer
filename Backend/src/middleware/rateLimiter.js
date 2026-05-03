const rateLimit = require("express-rate-limit");

// General API limiter — 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Auth limiter — 10 attempts per 15 minutes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes." },
  skipSuccessfulRequests: true, // only count failed attempts
});

// AI analysis limiter — 20 requests per minute (expensive operation)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI analysis rate limit reached. Please wait a moment." },
});

// OTP limiter — 3 OTP requests per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Please wait 10 minutes." },
});

module.exports = { generalLimiter, authLimiter, aiLimiter, otpLimiter };
