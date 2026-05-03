const { z } = require("zod");

/**
 * Validation middleware factory using Zod schemas
 * Usage: router.post("/route", validate(schema), handler)
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // replace with sanitized/coerced data
      next();
    } catch (err) {
      if (err.errors) {
        const errors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res.status(400).json({ error: "Validation failed", errors });
      }
      return res.status(400).json({ error: "Invalid request body" });
    }
  };
}

// ─── SCHEMAS ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(1, "Password required").max(128),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name too short").max(100).trim(),
  email: z.string().email("Invalid email").max(255).toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

const verifyOtpSchema = z.object({
  email: z.string().email().max(255),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

const analyzeSchema = z.object({
  code: z.string().min(1, "Code is required").max(15000, "Code too long (max 15,000 chars)"),
  language: z.string().min(1).max(50),
  repo: z.string().max(200).optional().default("untitled"),
  branch: z.string().max(200).optional().default("main"),
});

const fixSchema = z.object({
  code: z.string().min(1).max(15000),
  issue: z.object({
    id: z.string().optional(),
    title: z.string().max(500),
    description: z.string().max(2000),
    severity: z.enum(["critical", "high", "medium", "low"]),
    line: z.union([z.string(), z.number()]).optional(),
  }),
  language: z.string().min(1).max(50),
});

const fixAllSchema = z.object({
  code: z.string().min(1).max(15000),
  issues: z.array(z.object({
    id: z.string().optional(),
    title: z.string().max(500),
    description: z.string().max(2000),
    severity: z.enum(["critical", "high", "medium", "low"]),
    line: z.union([z.string(), z.number()]).optional(),
  })).min(1, "At least one issue required").max(50),
  language: z.string().min(1).max(50),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  currentPassword: z.string().max(128).optional(),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

module.exports = {
  validate,
  loginSchema,
  registerSchema,
  verifyOtpSchema,
  analyzeSchema,
  fixSchema,
  fixAllSchema,
  profileUpdateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
