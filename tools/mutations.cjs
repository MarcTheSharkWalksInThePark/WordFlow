"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { OWNED, sha, cleanEnv, assert } = require("../tests/helpers.cjs");
const repo = path.join(__dirname, "..");
const original = fs.readFileSync(path.join(repo, "server.js"));
const before = sha(original);
const specification = JSON.parse(fs.readFileSync(path.join(__dirname, "r59.spec.json"), "utf8"));
function suite(root, target = "server_exposure.test.js") {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(repo, "tests", target)], { cwd: repo, env: cleanEnv({ WORDFLOW_TEST_REPO: root }), stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "", stderr = "", timedOut = false;
    child.stdout.on("data", c => { stdout += c; }); child.stderr.on("data", c => { stderr += c; });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 60000);
    child.on("error", error => { clearTimeout(timer); resolve({ error: error.message, stdout, stderr }); });
    child.on("exit", (code, signal) => { clearTimeout(timer); resolve({ code, signal, timedOut, stdout, stderr }); });
  });
}
(async () => {
  const result = { suite: "node tests/server_exposure.test.js and node tests/proxy.test.mjs", sourceSpecs: [...new Set(specification.mutations.map(m => m.sourceSpec))], originalSha256: before, rows: [], reanchoring: "none; all 46 R59 transforms unchanged; original Y11/Y12 historical re-anchoring retained; six new W2 proxy transforms", equivalence: "M9: every string matched by /^\\.env/i starts with a literal dot and therefore satisfies startsWith('.'). The regex disjunct is a subset of the dot-prefix disjunct for every string. isRefusedStaticPath is byte-identical to source master, so the original proof still applies." };
  const baseline = await suite(repo);
  assert.equal(baseline.code, 0, "mutation baseline must pass");
  assert(!baseline.timedOut && !baseline.error);
  assert(/32 checks passed/.test(baseline.stdout));
  result.baseline = baseline;
  result.proxyBaseline = await suite(repo, "proxy.test.mjs");
  assert.equal(result.proxyBaseline.code, 0, "proxy baseline");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "wordflow-mutations-"));
  try {
    for (const file of OWNED) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.copyFileSync(path.join(repo, file), path.join(root, file)); }
    for (const m of specification.mutations) {
      assert.equal(sha(fs.readFileSync(path.join(repo, "server.js"))), before, "real server changed");
      const originalFile = fs.readFileSync(path.join(repo, m.file));
      const sourceSha = sha(originalFile);
      const text = originalFile.toString("utf8");
      assert.equal(text.split(m.transform.find).length - 1, 1, "exact unique anchor " + m.id);
      const mutated = Buffer.from(text.replace(m.transform.find, m.transform.replace));
      const file = path.join(root, m.file);
      fs.writeFileSync(file, originalFile);
      const row = { ...m, beforeSha256: sha(fs.readFileSync(file)), mutatedSha256: sha(mutated) };
      let run;
      try { fs.writeFileSync(file, mutated); run = await suite(root, m.suite === "proxy" ? "proxy.test.mjs" : "server_exposure.test.js"); }
      finally { fs.writeFileSync(file, originalFile); row.restoredSha256 = sha(fs.readFileSync(file)); assert.equal(row.restoredSha256, sourceSha); }
      // Evidence is public: retain diagnostics but replace machine-specific path prefixes.
      for (const field of ["stdout","stderr"]) if (run[field]) run[field] = run[field]
        .replaceAll(root, "<scratch>").replaceAll(repo, "<repo>")
        .replaceAll(repo.replaceAll("\\", "/"), "<repo>")
        .replaceAll(os.tmpdir(), "<temp>").replaceAll(os.tmpdir().replaceAll("\\", "/"), "<temp>");
      row.run = run;
      row.verdict = run.error || run.timedOut || run.code === null ? "ERROR" : run.code === 0 ? "SURVIVED" : "KILLED";
      row.failingChecks = (run.stderr || "").split(/\r?\n/).filter(line => /FAIL|TEST_REFUSED_NON_LOOPBACK_BIND/.test(line));
      row.safetyWitness = /TEST_REFUSED_NON_LOOPBACK_BIND/.test(run.stderr || "") ? "Attempted unsafe bind rejected by test preload before kernel listen; deterministic setup failure, no non-loopback socket created." : null;
      assert(row.verdict !== "KILLED" || row.failingChecks.length > 0, "non-semantic suite failure " + m.id);
      row.expected = m.expect === "survived" ? "SURVIVED" : "KILLED";
      result.rows.push(row);
      console.log(`${m.id}: ${row.verdict}${row.safetyWitness ? " (unsafe bind refused before listen)" : ""}`);
    }
  } finally {
    assert.equal(sha(fs.readFileSync(path.join(repo, "server.js"))), before);
    fs.rmSync(root, { recursive: true, force: true });
  }
  result.killed = result.rows.filter(r => r.verdict === "KILLED").length;
  result.equivalent = result.rows.filter(r => r.id.startsWith("M9-") && r.verdict === "SURVIVED").length;
  result.unexpected = result.rows.filter(r => r.verdict !== r.expected).length;
  result.errors = result.rows.filter(r => r.verdict === "ERROR").length;
  const i = process.argv.indexOf("--out");
  if (i >= 0) fs.writeFileSync(process.argv[i + 1], JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ total: result.rows.length, killed: result.killed, equivalent: result.equivalent, unexpected: result.unexpected, errors: result.errors }));
  if (result.unexpected || result.errors) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
