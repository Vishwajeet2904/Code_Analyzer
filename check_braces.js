const fs = require('fs');
const content = fs.readFileSync('d:/Desktop/Hackathon/Frontend/src/app/pages/Dashboard.tsx', 'utf8');

let braces = 0;
let curlies = 0;
let parens = 0;
let inString = null;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inString) {
        if (char === inString && content[i-1] !== '\\') inString = null;
        continue;
    }
    if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
    }
    if (char === '{') curlies++;
    if (char === '}') curlies--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') braces++;
    if (char === ']') braces--;
}

console.log({ braces, curlies, parens });
