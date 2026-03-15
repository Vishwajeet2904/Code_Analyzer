const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are CodeGuardian AI, an expert code security and quality analyzer.
Analyze the provided code and return a JSON response with this exact structure:
{
  "qualityScore": <number 0-100>,
  "summary": "<one line summary>",
  "issues": [
    {
      "id": "<unique string>",
      "type": "security" | "bug" | "performance" | "code_smell",
      "severity": "critical" | "high" | "medium" | "low",
      "title": "<issue title>",
      "description": "<what the issue is>",
      "line": "<line number or range e.g. 5 or 5-8>",
      "fix": "<how to fix it>",
      "refactoredCode": "<fixed code snippet>"
    }
  ],
  "securityScore": <number 0-100>,
  "highlights": [
    { "line": <number>, "severity": "critical"|"high"|"medium"|"low", "message": "<short label>" }
  ]
}

STRICT ANALYSIS RULES:
1. You MUST NOT flag execute(query, params) or cursor.execute(..., params) as SQL Injection. That is literally parameterized querying.
2. You MUST NOT flag process.env.VAR or os.environ.get('VAR') as Magic Strings or Hardcoded Secrets. They are secure environmental variables.
3. You MUST NOT complain about Resource Leaks if conn.close() exists in the code natively.
4. If the code is properly using safe methods (like parameter binding, environment variables, division-by-zero checks), you MUST return an empty issues array "[]" and qualityScore of 100. DO NOT invent false-positive minor complaints.

Return ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON.`;

function safeStr(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") {
    return val.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\r/g, "");
  }
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

function sanitizeResult(result) {
  if (!result) return result;
  if (result.summary) result.summary = safeStr(result.summary);
  if (Array.isArray(result.issues)) {
    result.issues = result.issues.map((issue) => ({
      ...issue,
      title: safeStr(issue.title),
      description: safeStr(issue.description),
      fix: safeStr(issue.fix),
      refactoredCode: safeStr(issue.refactoredCode),
      type: safeStr(issue.type),
      severity: safeStr(issue.severity),
      line: safeStr(issue.line),
    }));
  }
  return result;
}

// Try models in order — fallback if rate limited
const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];

async function groqComplete(messages, temperature = 0.2, jsonMode = true) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const opts = { model, messages, temperature };
      if (jsonMode) opts.response_format = { type: "json_object" };
      const completion = await groq.chat.completions.create(opts);
      return completion.choices[0].message.content;
    } catch (err) {
      if (err?.status === 429) { lastErr = err; continue; }
      throw err;
    }
  }
  throw lastErr;
}

function detectIndentation(code) {
  const lines = code.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      const ws = match[1];
      if (ws.includes("\t")) return { type: "tab", char: "\t", size: 1 };
      return { type: "space", char: " ", size: ws.length };
    }
  }
  return { type: "space", char: " ", size: 2 };
}

function extractCodeBlock(text) {
  const str = text.trim();
  const match = str.match(/```[a-zA-Z0-9+#|-]*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  
  if (str.startsWith("```") && str.endsWith("```")) {
    const lines = str.split("\n");
    if (lines.length > 2) {
      return lines.slice(1, -1).join("\n").trim();
    }
  }
  return str;
}

function reindentCode(code, targetIndent) {
  const lines = code.split("\n");
  let srcSize = 2, srcChar = " ";
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      const ws = match[1];
      if (ws.includes("\t")) { srcChar = "\t"; srcSize = 1; break; }
      srcSize = ws.length; srcChar = " "; break;
    }
  }
  if (srcChar === targetIndent.char && srcSize === targetIndent.size) return code;
  return lines.map(line => {
    const match = line.match(/^(\s*)(.*)/);
    if (!match) return line;
    const [, ws, rest] = match;
    if (!ws) return line;
    const level = srcChar === "\t"
      ? (ws.match(/\t/g) || []).length
      : Math.round(ws.length / srcSize);
    return targetIndent.char.repeat(level * targetIndent.size) + rest;
  }).join("\n");
}

async function analyzeCode(code, language) {
  const content = await groqComplete([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Language: ${language}\n\nCode:\n${code}` },
  ]);
  return sanitizeResult(JSON.parse(content));
}

async function getFixSuggestion(code, issue, language) {
  const indent = detectIndentation(code);

  // Step 1: get metadata as JSON (no code inside)
  const metaContent = await groqComplete([
    { role: "system", content: "You are a security expert. Return ONLY valid JSON, no code snippets inside the JSON values." },
    {
      role: "user",
      content: `For this ${language} issue, provide explanation only (NO code).
Issue: ${issue.title} (${issue.severity})
Description: ${issue.description}

Return JSON:
{
  "explanation": "<why this is a problem — 1-2 sentences>",
  "attackVector": "<how a hacker exploits this — specific>",
  "impact": "<what damage this causes>",
  "prevention": "<best practice to prevent this>"
}`,
    },
  ], 0.2, true);

  const meta = JSON.parse(metaContent);

  // Step 2: get fixed code as plain text (no json_object mode)
  const codeContent = await groqComplete([
    {
      role: "system",
      content: `You are an expert ${language} security engineer. Return ONLY the fixed source code — no explanations, no markdown, no code fences, no JSON. Just the raw code.`,
    },
    {
      role: "user",
      content: `Fix the following issue in this ${language} code. Return the COMPLETE file with every line preserved.

Issue to fix: [${issue.severity?.toUpperCase()}] ${issue.title} — ${issue.description}

SPECIFIC FIX RULES:
- Hardcoded credentials/secrets/API keys → replace with environment variable (getenv() in C/C++, os.environ.get() in Python, process.env in JS)
- Buffer overflow (char array + cin/scanf) → replace with std::string or use safe input method
- Memory leak → add delete/free or use smart pointers, set pointer to nullptr after delete
- Division by zero → throw std::invalid_argument exception, NOT silent return 0
- SQL injection → MUST use parameterized statements (e.g. (?, ?) or $1), NEVER string concatenation. For Node.js/pg/mysql, pass variables as an array.
- Null pointer → add null check before use

Original code:
${code}

Rules:
- MUST return the COMPLETE code, every single line. DO NOT USE "// ... rest of code". DO NOT TRUNCATE.
- Fix the specific issue above properly — not a workaround
- Add inline comment on fixed line: // Fixed: ${issue.title}
- Use ${indent.type === "tab" ? "tabs" : `${indent.size} spaces`} for indentation
- The code must compile and run correctly after the fix
- Do NOT remove any function, variable, or block from the original code
- Return ONLY the raw code, nothing else`,
    },
  ], 0.1, false);

  const pureCode = extractCodeBlock(codeContent);
  const fixedCode = reindentCode(pureCode, indent);

  return {
    explanation: safeStr(meta.explanation),
    attackVector: safeStr(meta.attackVector),
    impact: safeStr(meta.impact),
    prevention: safeStr(meta.prevention),
    refactoredCode: fixedCode,
    beforeCode: safeStr(issue.description),
    afterCode: fixedCode,
  };
}

async function fixAllIssues(code, issues, language) {
  const indent = detectIndentation(code);
  const issueList = issues.map((iss, i) =>
    `${i + 1}. [${iss.severity?.toUpperCase()}] ${iss.title} (Line ${iss.line}): ${iss.description}`
  ).join("\n");

  // Step 1: get fixed code as plain text
  const fixedCode = await groqComplete([
    {
      role: "system",
      content: `You are an expert ${language} security engineer. Your job is to return a FULLY FIXED, production-ready version of the code.
You MUST fix every single issue listed — no exceptions. Every hardcoded secret, every buffer overflow, every memory leak, every unsafe pattern MUST be fixed.
Return ONLY raw source code. No markdown, no code fences, no explanations, no JSON. Just the fixed code.`,
    },
    {
      role: "user",
      content: `You MUST fix ALL of the following security and quality issues in this ${language} code.
Do NOT skip any issue. Every single one must be properly resolved.

ISSUES TO FIX (fix every one):
${issueList}

SPECIFIC FIX RULES PER ISSUE TYPE:
- Hardcoded credentials/secrets/API keys → replace with environment variable: getenv("VAR_NAME") in C/C++, os.environ.get() in Python, process.env.VAR in JS
- Buffer overflow (char array + cin/scanf) → replace char array with std::string or use cin with width limit
- Memory leak → add delete/free, or use smart pointers (unique_ptr)
- Division by zero → throw exception or return error code, NOT silent return 0
- SQL injection → MUST use parameterized queries (e.g. ? or $1 or arrays), NEVER string concatenation.
- Null pointer dereference → add null checks before dereferencing
- Use after free → set pointer to nullptr after delete
- Integer overflow → use bounds checking or larger types

ORIGINAL CODE:
${code}

MANDATORY RULES:
- MUST return the COMPLETE file — every single line of the original must be present. DO NOT TRUNCATE.
- DO NOT use comments like "// ... rest of code" or "// unchanged".
- Do NOT remove, truncate, or omit any function, variable, or block from the original
- Fix ALL issues listed above — do not skip even one
- Add a short inline comment on each fixed line: // Fixed: <issue name>
- Use ${indent.type === "tab" ? "tabs" : `${indent.size} spaces`} for indentation
- The returned code must compile and run without errors
- Return ONLY the raw code, nothing else`,
    },
  ], 0.1, false);

  // Step 2: get fix summary as JSON
  const summaryContent = await groqComplete([
    { role: "system", content: "Return ONLY valid JSON." },
    {
      role: "user",
      content: `For these ${language} issues that were fixed, return a summary.
Issues: ${issueList}

Return JSON:
{
  "fixSummary": [
    { "issue": "<issue title>", "fix": "<one line: what was changed>" }
  ]
}`,
    },
  ], 0.1, true);

  const { fixSummary = [] } = JSON.parse(summaryContent);
  const pureCode = extractCodeBlock(fixedCode);
  const cleaned = reindentCode(pureCode, indent);

  return {
    fixedCode: cleaned,
    fixSummary: fixSummary.map((s) => ({
      issue: safeStr(s.issue),
      fix: safeStr(s.fix),
    })),
  };
}

module.exports = { analyzeCode, getFixSuggestion, fixAllIssues };
