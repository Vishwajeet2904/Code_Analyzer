/**
 * Simulated GitHub Service for Hackathon Demo
 * In a real-world app, this would use @octokit/rest and a GitHub App Token
 */

async function postPRComment(repo, issues) {
  if (!repo || repo === "untitled") {
    console.log("PR Bot: Skipping comment - Repo name not provided or untitled.");
    return false;
  }

  const commentHeader = `### 🛡️ CodeGuardian AI Security Review\nAI has detected **${issues.length} issues** in this PR.`;
  const commentBody = issues.map(issue => 
    `- **[${issue.severity.toUpperCase()}] ${issue.title}** (Line ${issue.line})\n  > ${issue.description}\n  > *Suggested Fix:* ${issue.fix}`
  ).join('\n\n');

  const fullComment = `${commentHeader}\n\n${commentBody}\n\n---\n*Sent by [CodeGuardian AI](https://codeguardian.ai)*`;

  // Simulation: Log to console. In reality, this would be a POST to /repos/:owner/:repo/issues/:number/comments
  console.log(`\n--- SIMULATED GITHUB PR COMMENT FOR ${repo} ---`);
  console.log(fullComment);
  console.log(`--- END SIMULATION ---\n`);

  return true;
}

module.exports = { postPRComment };
