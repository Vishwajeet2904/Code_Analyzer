/**
 * GitHub Service
 * Uses GitHub API via fetch (no extra dependency needed).
 * Set GITHUB_TOKEN in .env for authenticated requests (higher rate limits + private repos).
 */

const GITHUB_API = "https://api.github.com";

function getHeaders() {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "CodeGuardian-AI",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// ─── POST PR COMMENT ─────────────────────────────────────────────────────────

async function postPRComment(repo, issues, prNumber) {
  if (!repo || repo === "untitled") {
    console.log("PR Bot: Skipping — no repo name provided.");
    return false;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.log("PR Bot: GITHUB_TOKEN not set — logging comment instead.");
    _logComment(repo, issues);
    return false;
  }

  if (!prNumber) {
    console.log("PR Bot: No PR number provided — logging comment.");
    _logComment(repo, issues);
    return false;
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    console.log("PR Bot: repo must be in 'owner/repo' format.");
    return false;
  }

  const body = _buildComment(issues);

  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }
    );

    if (response.ok) {
      console.log(`✅ PR comment posted on ${repo}#${prNumber}`);
      return true;
    }

    const err = await response.json();
    console.error("GitHub PR comment failed:", err.message);
    return false;
  } catch (err) {
    console.error("GitHub API error:", err.message);
    return false;
  }
}

// ─── FETCH FILE FROM GITHUB ───────────────────────────────────────────────────

async function fetchFileContent(owner, repo, path, ref = "main") {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      { headers: getHeaders() }
    );

    if (response.status === 404) return { error: "File not found" };
    if (response.status === 403) return { error: "Rate limit exceeded or private repo" };
    if (!response.ok) return { error: `GitHub API error: ${response.status}` };

    const data = await response.json();
    if (data.encoding === "base64") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return { content, sha: data.sha, size: data.size };
    }
    return { error: "Unsupported encoding" };
  } catch (err) {
    return { error: err.message };
  }
}

// ─── GET REPO INFO ────────────────────────────────────────────────────────────

async function getRepoInfo(owner, repo) {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ─── LIST REPO FILES ──────────────────────────────────────────────────────────

async function listRepoFiles(owner, repo, path = "", ref = "main") {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];
    const items = await response.json();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function _buildComment(issues) {
  const sevEmoji = { critical: "🔴", high: "🟠", medium: "🟡", low: "🟢" };
  const header = `### 🛡️ CodeGuardian AI — Security Review\n\nAI detected **${issues.length} issue(s)** in this PR.\n`;

  const issueLines = issues
    .slice(0, 20) // cap at 20 to avoid huge comments
    .map(
      (i) =>
        `${sevEmoji[i.severity] || "⚪"} **[${(i.severity || "low").toUpperCase()}] ${i.title}** *(Line ${i.line})*\n> ${i.description}\n> 💡 *Fix:* ${i.fix}`
    )
    .join("\n\n");

  return `${header}\n${issueLines}\n\n---\n*Powered by [CodeGuardian AI](https://codeguardian.ai)*`;
}

function _logComment(repo, issues) {
  console.log(`\n─── SIMULATED PR COMMENT [${repo}] ───`);
  console.log(_buildComment(issues));
  console.log(`─── END ───\n`);
}

module.exports = { postPRComment, fetchFileContent, getRepoInfo, listRepoFiles };
