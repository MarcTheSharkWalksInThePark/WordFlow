"use strict";
// CC hand mutations of the two W6 predicates. Not registered in the runner; restored after each.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), { spawnSync } = require("node:child_process");
const SP = __dirname, BR = path.join(SP, "wf-review"), APP = path.join(BR, "app.js"), OUT = path.join(SP, "ev", "mutants"); fs.mkdirSync(OUT, { recursive: true });
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const B = "return fontSize <= 10 && wordWidth > frameWidth;", S = "return wrapped && wordHeight > frameHeight;";
const MUTANTS = [
  ["B1 floor <= -> <", B, "return fontSize < 10 && wordWidth > frameWidth;"],
  ["B2 width > -> >=", B, "return fontSize <= 10 && wordWidth >= frameWidth;"],
  ["B3 remove floor condition", B, "return wordWidth > frameWidth;"],
  ["B4 swap width operands", B, "return fontSize <= 10 && frameWidth > wordWidth;"],
  ["B5 swap floor operands", B, "return 10 <= fontSize && wordWidth > frameWidth;"],
  ["S1 height > -> >=", S, "return wrapped && wordHeight >= frameHeight;"],
  ["S2 remove wrapped condition", S, "return wordHeight > frameHeight;"],
  ["S3 swap height operands", S, "return wrapped && frameHeight > wordHeight;"]
];
const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: BR, encoding: "utf8", windowsHide: true, timeout: 600000 });
  const text = (r.stdout || "") + (r.stderr || "");
  return { label, status: r.status, fails: [...new Set(text.split(/\r?\n/).filter((l) => /^\s*FAIL\b|Error: .*: |AssertionError|F1 /.test(l)).map((l) => l.trim().slice(0, 240)))].slice(0, 8), tail: text.trim().split(/\r?\n/).slice(-3) };
};
const original = fs.readFileSync(APP); const before = sha(original); const rows = [];
try {
  for (const [id, find, replace] of MUTANTS) {
    const text = original.toString("utf8"); if (text.split(find).length !== 2) throw new Error("anchor not unique: " + id);
    fs.writeFileSync(APP, Buffer.from(text.replace(find, replace), "utf8")); const mutated = sha(fs.readFileSync(APP));
    const node = ["tests/regression.cjs", "tests/proxy.test.mjs", "tests/server_exposure.test.js", "tests/post-review.test.cjs"].map((f) => run([f], f));
    const smoke = run(["tools/static_smoke.cjs", "--out-dir", path.join(OUT, id.split(" ")[0])], "static_smoke");
    fs.writeFileSync(APP, original); const restored = sha(fs.readFileSync(APP));
    const row = { id, find, replace, before, mutated, restored, node, smoke,
      nodeRed: node.filter((n) => n.status !== 0).map((n) => n.label + ": " + n.fails.join(" | ")), smokeRed: smoke.status !== 0 ? smoke.fails.join(" | ") : null };
    row.verdict = row.nodeRed.length || row.smokeRed ? "KILLED" : "SURVIVED"; rows.push(row);
    console.log(id, row.verdict, "| node:", row.nodeRed.join(" ; ") || "all green", "| smoke:", row.smokeRed || "green", "| sha", mutated.slice(0, 12), "restored==before", restored === before);
    fs.writeFileSync(path.join(OUT, "mutants.json"), JSON.stringify({ before, rows }, null, 1));
  }
} finally { fs.writeFileSync(APP, original); console.log("final app.js sha", sha(fs.readFileSync(APP)), "before", before); }
