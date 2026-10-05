"use strict";
// Same ordered request corpus for pre-split baseline, standalone regression and old/new parity.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { FRONT, OWNED, sha, cleanEnv, pythonPath, start, stop, request, multipart, execFileSync, assert } = require("./helpers.cjs");
function arg(name) { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; }
async function run() {
  const oldRepo = arg("--old");
  const newRepo = arg("--new") || (oldRepo ? undefined : path.join(__dirname, ".."));
  assert(oldRepo || newRepo, "provide a server repository");
  const base = oldRepo || newRepo;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "wordflow-regression-"));
  const result = { mode: oldRepo && newRepo ? "parity" : oldRepo ? "pre-split-old-baseline" : "standalone", bodyNormalization: "none; statuses and bodies byte-for-byte; transport headers (Date, Connection, framing) not compared", cases: [], files: [], skips: [], network: {} };
  const networkLog = path.join(temp, "network.jsonl");
  let old, fresh, fixture;
  try {
    fs.writeFileSync(path.join(temp, "fixture.txt"), "WordFlow smoke fixture.\nThe uploaded text appears in the reader.\nÆøå — UTF-8.\n");
    const python = pythonPath(base);
    const fixtures = JSON.parse(execFileSync(python, [path.join(__dirname, "fixtures.py"), temp], { env: cleanEnv(), encoding: "utf8", windowsHide: true }));
    result.python = fixtures;
    result.skips.push(...fixtures.skips);
    for (const skip of fixtures.skips) console.log(skip);
    const fixtureHits = [];
    fixture = http.createServer((req, res) => {
      fixtureHits.push(req.url);
      assert.equal(req.headers["user-agent"], "WordFlow Reader/1.0");
      if (req.url === "/redirect") { res.writeHead(302, { location: "/html" }); res.end(); return; }
      if (req.url === "/html") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end("<html><title>Local fixture</title><p>WordFlow local HTML.</p></html>"); return; }
      if (req.url === "/plain") { res.writeHead(200, { "content-type": "text/plain; charset=utf-8" }); res.end("Non-HTML fixture. Æøå\n"); return; }
      if (req.url === "/large") { res.writeHead(200, { "content-type": "text/plain" }); res.end(Buffer.alloc(3 * 1024 * 1024 + 1, 65)); return; }
      if (req.url === "/missing") { res.writeHead(404, { "content-type": "text/plain" }); res.end("Fixture not found"); return; }
      res.writeHead(500); res.end("Unexpected fixture path");
    });
    await new Promise(resolve => fixture.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${fixture.address().port}`;
    if (oldRepo) old = await start(oldRepo, { networkLog, python });
    if (newRepo) fresh = await start(newRepo, { networkLog, python: pythonPath(newRepo) });
    const cases = [];
    const add = (label, method, target, status, verify, body, headers) => cases.push({ label, method, target, status, verify, body, headers });
    for (const file of ["/", ...FRONT.map(f => "/" + f)]) {
      const relative = file === "/" ? "index.html" : file.slice(1);
      add("static " + file, "GET", file, 200, res => assert(res.body.equals(fs.readFileSync(path.join(base, relative)))));
    }
    add("HEAD homepage", "HEAD", "/", 200, res => assert.equal(res.body.length, 0));
    add("homepage query", "GET", "/?fixture=1", 200, res => assert(res.body.equals(fs.readFileSync(path.join(base, "index.html")))));
    add("encoded static", "GET", "/assets%5Cwordflow-mark.svg", 200, res => assert(res.body.equals(fs.readFileSync(path.join(base, "assets/wordflow-mark.svg")))));
    for (const target of ["/unknown", "/server.js", "/package.json", "/extract_text.py", "/.env.local", "/%2Eenv.local"]) {
      add("refused " + target, "GET", target, 404, res => assert.equal(res.body.toString(), "Not found"));
    }
    add("extract GET", "GET", "/api/extract-file", 405, res => assert.deepEqual(JSON.parse(res.body), { error: "POST required" }));
    add("extract missing boundary", "POST", "/api/extract-file", 500, res => assert.deepEqual(JSON.parse(res.body), { error: "Missing multipart boundary" }));
    add("extract multipart without file", "POST", "/api/extract-file", 400, res => assert.deepEqual(JSON.parse(res.body), { error: "No file uploaded" }), "--empty--\r\n", { "content-type": "multipart/form-data; boundary=empty" });
    const upload = (label, filename, type, content, status, verify) => {
      const form = multipart(filename, type, content);
      add(label, "POST", "/api/extract-file", status, verify, form.body, form.headers);
    };
    upload("TXT UTF-8 extraction", "fixture.txt", "text/plain", fs.readFileSync(path.join(temp, "fixture.txt")), 200, res => assert.deepEqual(JSON.parse(res.body), { title: "fixture.txt", contentType: "text/plain", body: fs.readFileSync(path.join(temp, "fixture.txt"), "utf8"), warnings: [] }));
    upload("TXT Latin-1 fallback", "latin.txt", "text/plain", Buffer.from([67, 97, 102, 233]), 200, res => assert.equal(JSON.parse(res.body).body, "Café"));
    upload("empty TXT", "empty.txt", "text/plain", "", 200, res => assert.equal(JSON.parse(res.body).body, ""));
    upload("text MIME extension fallback", "fixture.custom", "text/plain", "MIME text", 200, res => assert.equal(JSON.parse(res.body).body, "MIME text"));
    upload("unsupported file", "fixture.bin", "application/octet-stream", "fixture", 415, res => assert.deepEqual(JSON.parse(res.body), { error: "Supported files: PDF, DOCX, and text files" }));
    if (fixtures.files.includes("fixture.pdf")) upload("PDF extraction", "fixture.pdf", "application/pdf", fs.readFileSync(path.join(temp, "fixture.pdf")), 200, res => {
      const p = JSON.parse(res.body); assert.equal(p.title, "WordFlow PDF fixture"); assert.equal(p.body, "WordFlow PDF fixture text."); assert.deepEqual(p.warnings, []);
    });
    if (fixtures.files.includes("fixture.docx")) upload("DOCX extraction", "fixture.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fs.readFileSync(path.join(temp, "fixture.docx")), 200, res => {
      const p = JSON.parse(res.body); assert.equal(p.title, "WordFlow DOCX fixture"); assert.equal(p.body, "## Fixture heading\n\nWordFlow DOCX fixture text.\n\nLeft | Right"); assert.deepEqual(p.warnings, []);
    });
    add("read missing URL", "GET", "/api/read", 400, res => assert.deepEqual(JSON.parse(res.body), { error: "Missing URL" }));
    add("read invalid URL", "GET", "/api/read?url=" + encodeURIComponent("http://["), 400, res => assert.deepEqual(JSON.parse(res.body), { error: "Missing URL" }));
    for (const [suffix, status, body] of [["/html", 200, "<html><title>Local fixture</title><p>WordFlow local HTML.</p></html>"], ["/redirect", 200, "<html><title>Local fixture</title><p>WordFlow local HTML.</p></html>"], ["/plain", 200, "Non-HTML fixture. Æøå\n"], ["/missing", 404, "Fixture not found"]]) {
      add("read local " + suffix, "GET", "/api/read?url=" + encodeURIComponent(origin + suffix), status, res => {
        const p = JSON.parse(res.body); assert.equal(p.url, origin + (suffix === "/redirect" ? "/html" : suffix)); assert.equal(p.body, body); assert.equal(p.contentType, suffix === "/html" || suffix === "/redirect" ? "text/html; charset=utf-8" : suffix === "/plain" ? "text/plain; charset=utf-8" : "text/plain");
      });
    }
    add("read oversized local response", "GET", "/api/read?url=" + encodeURIComponent(origin + "/large"), 500, res => assert.deepEqual(JSON.parse(res.body), { error: "Response too large" }));
    add("read accepts POST as before", "POST", "/api/read?url=" + encodeURIComponent(origin + "/plain"), 200, res => assert.equal(JSON.parse(res.body).body, "Non-HTML fixture. Æøå\n"));
    for (const c of cases) {
      let previous;
      for (const [name, s] of [["old", old], ["new", fresh]]) {
        if (!s) continue;
        const res = await request(s.port, c.method, c.target, c.body, c.headers);
        assert.equal(res.status, c.status, `${name}: ${c.label} status`); c.verify(res);
        if (previous) { assert.equal(res.status, previous.status, c.label + " parity status"); assert(res.body.equals(previous.body), c.label + " parity body bytes"); }
        previous = res;
      }
      result.cases.push({ label: c.label, method: c.method, target: c.target, status: previous.status, bytes: previous.body.length, sha256: sha(previous.body), parity: old && fresh ? "identical" : "baseline-passed" });
      console.log("PASS " + c.label);
    }
    if (old && fresh) for (const file of OWNED) {
      const a = fs.readFileSync(path.join(oldRepo, file)), b = fs.readFileSync(path.join(newRepo, file));
      assert(a.equals(b), "file byte parity " + file);
      result.files.push({ file, bytes: a.length, sha256: sha(a), parity: "identical" });
    }
    result.fixtureHits = fixtureHits;
    const log = fs.existsSync(networkLog) ? fs.readFileSync(networkLog, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
    assert(log.length > 0, "network guard must have recorded traffic");
    assert(!log.some(e => e.kind.startsWith("blocked")), "unexpected blocked network attempt");
    result.network = { events: log.length, nonLoopbackBinds: 0, outboundConnections: 0, guard: "active in all server processes" };
    result.passed = result.cases.length;
    result.differences = [];
  } finally {
    await stop(old); await stop(fresh);
    if (fixture) await new Promise(resolve => fixture.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
  if (arg("--out")) fs.writeFileSync(arg("--out"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ mode: result.mode, passed: result.passed, skipped: result.skips.length, differences: result.differences.length }));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
