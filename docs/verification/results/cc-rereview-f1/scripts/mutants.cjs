"use strict";
// CC hand mutations of the two W6 predicates (B1-B5, S1-S3), unchanged transforms from the first review.
// Phase A (required): the four Node suites and the full Chrome smoke as committed.
// Phase B (informational): the Chrome smoke with only its in-browser predicate-call checks removed,
// to see which mutants the rendered-layout checks alone detect. Every file is restored and hashed.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), { spawnSync } = require("node:child_process");
const SP = path.resolve(__dirname, ".."), CL = path.join(SP, "wf-mut"), APP = path.join(CL, "app.js"), SMOKE = path.join(CL, "tools", "static_smoke.cjs");
const OUT = path.join(SP, "ev", "mutants"); fs.mkdirSync(OUT, { recursive: true });
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const B = "return fontSize <= 10 && wordWidth > frameWidth;", S = "return wrapped && wordHeight > frameHeight;";
const PRED = 'await require("../tests/reader-round2.cjs").browserPredicateChecks(page,verify);';
const MUTANTS = [
  ["B1", B, "return fontSize < 10 && wordWidth > frameWidth;"],
  ["B2", B, "return fontSize <= 10 && wordWidth >= frameWidth;"],
  ["B3", B, "return wordWidth > frameWidth;"],
  ["B4", B, "return fontSize <= 10 && frameWidth > wordWidth;"],
  ["B5", B, "return 10 <= fontSize && wordWidth > frameWidth;"],
  ["S1", S, "return wrapped && wordHeight >= frameHeight;"],
  ["S2", S, "return wordHeight > frameHeight;"],
  ["S3", S, "return wrapped && frameHeight > wordHeight;"]
];
const run = (args, label) => {
  const t = Date.now(); const r = spawnSync(process.execPath, args, { cwd: CL, encoding: "utf8", windowsHide: true, timeout: 900000 });
  const text = (r.stdout || "") + (r.stderr || "");
  const first = text.split(/\r?\n/).find((l) => /^Error: |^\s*not ok|FAIL/.test(l)) || null;
  return { label, status: r.status, secs: Math.round((Date.now() - t) / 1000), firstFailure: first && first.trim().slice(0, 200), tail: text.trim().split(/\r?\n/).slice(-2) };
};
const appOrig = fs.readFileSync(APP), smokeOrig = fs.readFileSync(SMOKE);
const appBefore = sha(appOrig), smokeBefore = sha(smokeOrig); const rows = [];
const phaseB = process.argv.includes("--phase-b");
try {
  for (const [id, find, replace] of MUTANTS) {
    const text = appOrig.toString("utf8"); if (text.split(find).length !== 2) throw new Error("anchor not unique: " + id);
    fs.writeFileSync(APP, Buffer.from(text.replace(find, replace), "utf8")); const mutated = sha(fs.readFileSync(APP));
    const row = { id, find, replace, before: appBefore, mutated };
    if (!phaseB) {
      row.node = ["tests/regression.cjs", "tests/proxy.test.mjs", "tests/server_exposure.test.js", "tests/post-review.test.cjs"].map((f) => run([f], f));
      row.mutatedAfterNode = sha(fs.readFileSync(APP));
      row.chrome = run(["tools/static_smoke.cjs", "--out-dir", path.join(OUT, id)], "static_smoke");
      row.mutatedAfterChrome = sha(fs.readFileSync(APP));
      row.nodeVerdict = row.node.some((n) => n.status !== 0) ? "KILLED" : "SURVIVED";
      row.chromeVerdict = row.chrome.status !== 0 ? "KILLED" : "SURVIVED";
    } else {
      const st = smokeOrig.toString("utf8"); if (st.split(PRED).length !== 2) throw new Error("predicate line not unique");
      fs.writeFileSync(SMOKE, Buffer.from(st.replace(PRED, ""), "utf8"));
      row.chromeNoPredicates = run(["tools/static_smoke.cjs", "--out-dir", path.join(OUT, id + "-nopred")], "static_smoke without predicate calls");
      fs.writeFileSync(SMOKE, smokeOrig); row.smokeRestored = sha(fs.readFileSync(SMOKE)) === smokeBefore;
      row.renderedVerdict = row.chromeNoPredicates.status !== 0 ? "KILLED" : "SURVIVED";
    }
    fs.writeFileSync(APP, appOrig); row.restored = sha(fs.readFileSync(APP));
    rows.push(row);
    console.log(id, phaseB ? `rendered-only ${row.renderedVerdict} (${row.chromeNoPredicates.firstFailure})` : `node ${row.nodeVerdict} (${row.node.map((n) => n.firstFailure).filter(Boolean)[0]}) chrome ${row.chromeVerdict} (${row.chrome.firstFailure})`,
      "mutated", mutated, "restored==before", row.restored === appBefore);
    fs.writeFileSync(path.join(OUT, phaseB ? "mutants-phaseB.json" : "mutants.json"), JSON.stringify({ appBefore, smokeBefore, rows }, null, 1));
  }
} finally {
  fs.writeFileSync(APP, appOrig); fs.writeFileSync(SMOKE, smokeOrig);
  console.log("final app.js", sha(fs.readFileSync(APP)), "== before", sha(fs.readFileSync(APP)) === appBefore, "| smoke", sha(fs.readFileSync(SMOKE)) === smokeBefore);
}
