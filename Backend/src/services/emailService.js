const nodemailer = require("nodemailer");

// Gmail only
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"CodeGuardian AI" <${process.env.GMAIL_USER || "noreply@codeguardian.ai"}>`;

// ─── OTP EMAIL ───────────────────────────────────────────────────────────────

async function sendOtpEmail(toEmail, userName, otp) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `${otp} — Your CodeGuardian Verification Code`,
    html: `
    <div style="background:#050510;padding:32px;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
      <h1 style="color:#f9fafb;margin:0 0 4px;font-size:20px;">🛡️ CodeGuardian AI</h1>
      <p style="color:#6b7280;margin:0 0 20px;font-size:13px;">Email Verification</p>
      <p style="color:#d1d5db;font-size:15px;">Hi <strong>${userName}</strong>, your verification code is:</p>
      <div style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
        <span style="font-size:36px;font-weight:800;color:#a5b4fc;letter-spacing:12px;">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:20px 0;" />
      <p style="color:#4b5563;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}

// ─── PASSWORD RESET EMAIL ────────────────────────────────────────────────────

async function sendPasswordResetEmail(toEmail, userName, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: "Reset your CodeGuardian password",
    html: `
    <div style="background:#050510;padding:32px;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
      <h1 style="color:#f9fafb;margin:0 0 4px;font-size:20px;">🛡️ CodeGuardian AI</h1>
      <p style="color:#6b7280;margin:0 0 20px;font-size:13px;">Password Reset</p>
      <p style="color:#d1d5db;font-size:15px;">Hi <strong>${userName}</strong>,</p>
      <p style="color:#9ca3af;font-size:14px;">We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:20px 0;" />
      <p style="color:#4b5563;font-size:12px;">Or copy this link: <a href="${resetUrl}" style="color:#818cf8;">${resetUrl}</a></p>
    </div>`,
  });
}

// ─── CRITICAL ALERT EMAIL ────────────────────────────────────────────────────

async function sendCriticalAlertEmail(toEmail, userName, issues, repo) {
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  if (!criticalIssues.length) return;

  const issueRows = criticalIssues
    .map(
      (i) => `<tr>
      <td style="padding:10px;border-bottom:1px solid #1f2937;color:#f9fafb;">${i.title}</td>
      <td style="padding:10px;border-bottom:1px solid #1f2937;color:#ef4444;font-weight:700;">CRITICAL</td>
      <td style="padding:10px;border-bottom:1px solid #1f2937;color:#9ca3af;">Line ${i.line}</td>
    </tr>`
    )
    .join("");

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `🚨 [CodeGuardian] ${criticalIssues.length} Critical Issue(s) in ${repo}`,
    html: `
    <div style="background:#050510;padding:32px;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
      <h1 style="color:#f9fafb;font-size:20px;">🛡️ CodeGuardian Alert</h1>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#fca5a5;margin:0;">⚠️ <strong>${criticalIssues.length} critical issue(s)</strong> found in <strong>${repo}</strong></p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;border-bottom:1px solid #1f2937;">Issue</th>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;border-bottom:1px solid #1f2937;">Severity</th>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;border-bottom:1px solid #1f2937;">Location</th>
        </tr></thead>
        <tbody>${issueRows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">Log in to CodeGuardian to view full details and apply fixes.</p>
    </div>`,
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail, sendCriticalAlertEmail };
