"use strict";
// Revalidate the unchanged reader without overwriting historical parity evidence.
const fs = require("node:fs"), path = require("node:path"), { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../../../.."), out = path.join(root, "docs/verification/results/post-review");
const files = ["browser-parity.json", "static-smoke.json", "static-reader-1400.png", "static-reader-390.png", "static-quota-1400.png", "static-quota-390.png"];
const originals = new Map(files.map(file => [file, fs.readFileSync(path.join(out, file))]));
const evidence = path.join(__dirname, "baseline-parity");
fs.mkdirSync(evidence, { recursive: true });
try {
  const run = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "parity"], { cwd: root, shell: process.platform === "win32", encoding: "utf8", windowsHide: true });
  const redact = text => text.replaceAll(root, "<repo>").replaceAll(require("node:os").homedir(), "<home>");
  fs.writeFileSync(path.join(evidence, "run.txt"), redact((run.stdout || "") + (run.stderr || "")));
  console.log(run.stdout); if (run.stderr) console.error(run.stderr);
  if (run.status !== 0) throw new Error("Baseline npm run parity failed");
  for (const file of files) fs.copyFileSync(path.join(out, file), path.join(evidence, file));
} finally {
  for (const [file, bytes] of originals) fs.writeFileSync(path.join(out, file), bytes);
}
