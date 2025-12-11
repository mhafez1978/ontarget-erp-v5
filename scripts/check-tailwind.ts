#!/usr/bin/env node
/* eslint-disable */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const IGNORES = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  ".turbo",
  "out",
  "scripts",
];

type Pattern = { re: RegExp; msg: string };

const patterns: Pattern[] = [
  {
    re: /\bbg-gradient-to-/,
    msg: "Use bg-linear-to-* instead of bg-gradient-to-*",
  },
  {
    re: /_rgba\(/,
    msg: "Use rgba(...) inside bracket classes (no leading underscore)",
  },
  {
    re: /rotate-\[var\(/,
    msg: "Use rotate-(--var) instead of rotate-[var(--var)]",
  },
  { re: /from-\[var\(/, msg: "Use from-(--var) instead of from-[var(--var)]" },
  { re: /via-\[var\(/, msg: "Use via-(--var) instead of via-[var(--var)]" },
];

type MatchResult = { file: string; match: string; msg: string };

const matches: MatchResult[] = [];

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (IGNORES.includes(e.name)) continue;
    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (!full.match(/\.(js|jsx|ts|tsx|mjs|cjs|css|tsx|tsx?|html)$/)) continue;
    const content = fs.readFileSync(full, "utf8");
    patterns.forEach((p) => {
      const m = content.match(p.re);
      if (m) {
        matches.push({
          file: full.replace(`${ROOT}/`, ""),
          match: m[0],
          msg: p.msg,
        });
      }
    });
  }
}

walk(ROOT);

if (matches.length > 0) {
  console.error(
    "\nTailwind pattern checks failed — found disallowed patterns:"
  );
  matches.forEach((m) => {
    console.error(` - ${m.file}: ${m.match} -> ${m.msg}`);
  });
  console.error(
    "\nRun `npm run lint:tailwind` locally and fix the occurrences or update the check script if needed."
  );
  process.exit(1);
}

console.log("Tailwind pattern scan passed — no disallowed patterns found.");
process.exit(0);
