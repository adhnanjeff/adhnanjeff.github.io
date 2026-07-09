#!/usr/bin/env node
/**
 * Regenerates content/changelog.generated.json from git history.
 * Runs as `prebuild`/`predev`. If git is unavailable (building from a
 * tarball, no .git dir), the existing JSON is left untouched so the
 * build never breaks.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "content", "changelog.generated.json");

// %x1f (unit sep) / %x1e (record sep) cannot appear in commit subjects,
// so parsing is safe no matter what a subject contains.
let raw;
try {
  raw = execFileSync(
    "git",
    ["log", "--no-merges", "--date=short", "--format=%h%x1f%ad%x1f%s%x1e"],
    { cwd: root, encoding: "utf8" },
  );
} catch (err) {
  console.warn(`[changelog] git log failed, keeping existing file: ${err.message}`);
  process.exit(0);
}

const commits = raw
  .split("\x1e")
  .map((rec) => rec.trim())
  .filter(Boolean)
  .map((rec) => {
    const [hash, date, subject] = rec.split("\x1f");
    return { hash, date, subject };
  })
  .filter((c) => c.hash && c.date && c.subject);

writeFileSync(
  outFile,
  JSON.stringify({ generatedAt: new Date().toISOString(), commits }, null, 2) + "\n",
);
console.log(`[changelog] wrote ${commits.length} commits to content/changelog.generated.json`);
