const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "a4ee82001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
});

async function sendOtpEmail(toEmail, userName, otp) {
  await transporter.sendMail({
    from: '"CodeGuardian AI" <sanketsingh8053@gmail.com>',
    to: toEmail,
    subject: `${otp} - Your CodeGuardian Verification Code`,
    html: `
    <div style="background:#050510;padding:32px;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.07);">
      <h1 style="color:#f9fafb;margin:0 0 4px;font-size:20px;">🛡️ CodeGuardian AI</h1>
      <p style="color:#6b7280;margin:0 0 20px;font-size:13px;">Email Verification</p>
      <p style="color:#d1d5db;font-size:15px;">Hi <strong>${userName}</strong>, your verification code is:</p>
      <div style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
        <span style="font-size:36px;font-weight:800;color:#a5b4fc;letter-spacing:12px;">${otp}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
    </div>`,
  });
}

async function sendCriticalAlertEmail(toEmail, userName, issues, repo) {
  const criticalIssues = issues.filter((i) => i.severity === "critical");
  if (!criticalIssues.length) return;

  const issueRows = criticalIssues
    .map((i) => `<tr>
      <td style="padding:10px;border-bottom:1px solid #2a2a4a;color:#f9fafb;">${i.title}</td>
      <td style="padding:10px;color:#ef4444;font-weight:700;">CRITICAL</td>
      <td style="padding:10px;color:#9ca3af;">Line ${i.line}</td>
    </tr>`).join("");

  await transporter.sendMail({
    from: '"CodeGuardian AI" <sanketsingh8053@gmail.com>',
    to: toEmail,
    subject: `🚨 [CodeGuardian] ${criticalIssues.length} Critical Issue(s) in ${repo}`,
    html: `
    <div style="background:#050510;padding:32px;font-family:'Inter',sans-serif;max-width:600px;margin:0 auto;border-radius:16px;">
      <h1 style="color:#f9fafb;font-size:20px;">🛡️ CodeGuardian Alert</h1>
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="color:#fca5a5;margin:0;">⚠️ <strong>${criticalIssues.length} critical issue(s)</strong> found in <strong>${repo}</strong></p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;">Issue</th>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;">Severity</th>
          <th style="padding:10px;text-align:left;color:#6b7280;font-size:12px;">Location</th>
        </tr></thead>
        <tbody>${issueRows}</tbody>
      </table>
    </div>`,
  });
}

module.exports = { sendOtpEmail, sendCriticalAlertEmail };
