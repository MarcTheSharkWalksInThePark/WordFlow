"use strict";

// Adapted from MarcDeck master 11092e1 tests/server_exposure.test.js.
// All 32 applicable RULING 59 checks retained. Only WordFlow front-end references remain.
// Every child uses a test-only network guard before bind/connect; unsafe mutants never bind.
// The former LAN probe uses local listener inventory. Dummy environment files exist only in
// temporary fixture roots. No real environment file or user document is read.

const assert = require("assert");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const http = require("http");
const vm = require("vm");
const { spawn, execFileSync } = require("child_process");

const REPO = process.env.WORDFLOW_TEST_REPO || path.join(__dirname, "..");
const { cleanEnv } = require("./helpers.cjs");
const SERVER_SOURCE = fs.readFileSync(path.join(REPO, "server.js"), "utf8");
const DUMMY_SECRET = "SERVER_EXPOSURE_DUMMY=not-a-secret-fixture-value";
const ORDINARY_CONTENT = "an ordinary listed fixture file\n";
const STARTUP_RE = /WordFlow: http:\/\/localhost:(\d+) \(host (\S+), bound ([^)]+)\)/;
const LISTED_BY_MISTAKE = [".env.local", ".gitignore", "assets/.hidden.txt", ".ENV.local"];
// Names that merely contain "env": the guard must not refuse them when listed (Codex X3, X4).
const ORDINARY_LISTED = ["report.env.local", "envelope.txt"];
const BS = "\\";

let passed = 0;
let skipped = 0;
const checks = [];
function check(label, fn) {
  checks.push({ label, fn });
}

// The front-end files: the WordFlow document plus every local src/href they carry.
function frontEndReferences() {
  const refs = [];
  for (const doc of ["index.html"]) {
    const lines = fs.readFileSync(path.join(REPO, doc), "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        const ref = match[1];
        if (/^[a-z]+:|^\/\/|^#/i.test(ref)) continue;
        refs.push({ doc, line: index + 1, ref: ref.replace(/^\.?\//, "") });
      }
    });
  }
  return refs;
}

function frontEndFiles() {
  return [...new Set(["index.html", ...frontEndReferences().map((r) => r.ref)])];
}

function makeFixtureRoot(serverText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "server-exposure-"));
  fs.writeFileSync(path.join(dir, "server.js"), serverText);
  // W2 adds one shared platform-neutral proxy import; copy it into synthetic roots.
  fs.mkdirSync(path.join(dir, "lib"));
  fs.copyFileSync(path.join(REPO, "lib/read-proxy.mjs"), path.join(dir, "lib/read-proxy.mjs"));
  for (const file of frontEndFiles()) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(REPO, file), path.join(dir, file));
  }
  // Dummy secrets and ordinary non-front-end files. None of these is the repo's real file.
  fs.writeFileSync(path.join(dir, ".env.local"), `${DUMMY_SECRET}\n`);
  fs.writeFileSync(path.join(dir, ".env"), `${DUMMY_SECRET}\n`);
  fs.writeFileSync(path.join(dir, ".gitignore"), `${DUMMY_SECRET}\n`);
  fs.writeFileSync(path.join(dir, "assets", ".hidden.txt"), `${DUMMY_SECRET}\n`);
  fs.writeFileSync(path.join(dir, "package.json"), `{"fixture": "${DUMMY_SECRET}"}\n`);
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "DECISIONS.md"), `${DUMMY_SECRET}\n`);
  for (const name of ORDINARY_LISTED) fs.writeFileSync(path.join(dir, name), ORDINARY_CONTENT);
  return dir;
}

function listedByMistakeSource() {
  const anchor = "const STATIC_FILES = new Set([";
  assert.strictEqual(SERVER_SOURCE.split(anchor).length - 1, 1, `server.js must contain exactly one "${anchor}"`);
  const injected = [...LISTED_BY_MISTAKE, ...ORDINARY_LISTED].map((f) => JSON.stringify(f)).join(", ");
  return SERVER_SOURCE.replace(anchor, `${anchor}\n  ${injected},`);
}

// A top-level function declaration from server.js's own source, evaluated alone in a VM context, so
// pure helpers are tested as written (and as mutated) without starting a server.
function serverFunctionSource(name) {
  const match = new RegExp(`^function ${name}\\([^)]*\\) \\{[\\s\\S]*?^\\}`, "m").exec(SERVER_SOURCE);
  assert(match, `server.js has no top-level function ${name}`);
  return match[0];
}

// context: extra globals for the VM. The part 6b check passes a configured `startPort` that differs
// from the bound port it asks about, so a helper that consulted the configured port would answer wrongly.
function serverHelpers(context = {}) {
  const names = ["isLoopbackHost", "startupWarning", "isAllowedHostHeader", "serverOptions"];
  const source = names.map(serverFunctionSource).join("\n");
  return vm.runInNewContext(`${source}\n({ ${names.join(", ")} });`, { ...context });
}

// Part 6a: server.js's own top-level `const checkHostHeader = ...;` line, evaluated for a listen host
// that HOST set. No server is bound, so non-loopback hosts are covered without a non-loopback bind.
function hostCheckDecision(listenHost) {
  const match = /^const checkHostHeader = [^\r\n]*;$/m.exec(SERVER_SOURCE);
  assert(match, "server.js has no top-level checkHostHeader declaration");
  const source = `${serverFunctionSource("isLoopbackHost")}\n${match[0]}\ncheckHostHeader;`;
  return vm.runInNewContext(source, { listenHost, process: { env: { HOST: listenHost } } });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function isLoopbackAddress(address) {
  return /^127\.|^::1$|^::ffff:127\./i.test(address);
}

// The check-off path without a non-loopback bind: this preload rewrites a listen on TEST_NET_HOST
// (192.0.2.1, a documentation-only address, RFC 5737) to 127.0.0.1 before the kernel sees it. The
// server still believes HOST names a non-loopback address, so its Host check is off and it warns.
const TEST_NET_HOST = "192.0.2.1";
const LISTEN_REDIRECT = [
  "\"use strict\";",
  "const net = require(\"net\");",
  "const listen = net.Server.prototype.listen;",
  "net.Server.prototype.listen = function (...args) {",
  `  if (args[1] === ${JSON.stringify(TEST_NET_HOST)}) args[1] = "127.0.0.1";`,
  "  return listen.apply(this, args);",
  "};",
  ""
].join("\n");

async function startServer(dir, hostEnv, port, preload) {
  const env = cleanEnv({ PORT: String(port || (await freePort())), WORDFLOW_NETWORK_LOG: path.join(dir, "network.jsonl") });
  for (const key of ["HOST", "OPENAI_API_KEY", "OPENAI_MODEL"]) delete env[key];
  if (hostEnv !== undefined) env.HOST = hostEnv;
  const args = ["-r", path.join(__dirname, "network_guard.cjs"), ...(preload ? ["-r", preload] : []), path.join(dir, "server.js")];
  const child = spawn(process.execPath, args, { cwd: dir, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  const out = { stdout: "", stderr: "" };
  child.stdout.on("data", (chunk) => { out.stdout += chunk; });
  child.stderr.on("data", (chunk) => { out.stderr += chunk; });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not start: ${out.stdout}${out.stderr}`)), 20000);
    const poll = setInterval(() => {
      if (STARTUP_RE.test(out.stdout)) {
        clearTimeout(timer);
        clearInterval(poll);
        setTimeout(resolve, 100); // let a start-up warning written right after the line arrive
      }
    }, 25);
    child.once("exit", (code) => {
      clearTimeout(timer);
      clearInterval(poll);
      reject(new Error(`server exited ${code} before starting: ${out.stdout}${out.stderr}`));
    });
  });
  const [, boundPort, host, bound] = STARTUP_RE.exec(out.stdout);
  if (!isLoopbackAddress(bound)) child.kill(); // only a mutant gets here; never leave it listening
  return { child, out, port: Number(boundPort), host, bound, dir };
}

function stopServer(server) {
  if (server && server.child && server.child.exitCode === null) server.child.kill();
}

// A raw request, so the exact bytes of the request target and of Host reach the server unaltered.
// host: undefined sends "127.0.0.1:<port>", the bound port; null sends no Host header at all.
// hostLines: complete header lines sent instead, e.g. two Host fields (B3), names in any case.
function rawRequest(port, target, { method = "GET", host, version = "1.1", hostLines } = {}) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    const chunks = [];
    socket.setTimeout(10000, () => socket.destroy(new Error(`timeout on ${method} ${target}`)));
    socket.on("data", (chunk) => chunks.push(chunk));
    socket.on("error", reject);
    socket.on("end", () => {
      const raw = Buffer.concat(chunks);
      const split = raw.indexOf("\r\n\r\n");
      const head = raw.slice(0, split).toString("latin1");
      let body = raw.slice(split + 4);
      if (/^transfer-encoding:\s*chunked/im.test(head)) body = dechunk(body);
      const status = /^HTTP\/1\.[01] (\d{3})/.exec(head);
      assert(status, `no status line for ${method} ${target}: ${JSON.stringify(head)}`);
      resolve({ status: Number(status[1]), head, body });
    });
    const lines = [`${method} ${target} HTTP/${version}`];
    if (hostLines) lines.push(...hostLines);
    else if (host !== null) lines.push(`Host: ${host === undefined ? `127.0.0.1:${port}` : host}`);
    lines.push("Connection: close");
    if (method === "POST") lines.push("Content-Length: 0");
    socket.write(`${lines.join("\r\n")}\r\n\r\n`, "latin1");
  });
}

function rawGet(port, target) {
  return rawRequest(port, target);
}

function dechunk(buffer) {
  const parts = [];
  let offset = 0;
  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf("\r\n", offset);
    const size = parseInt(buffer.slice(offset, lineEnd).toString("latin1"), 16);
    if (!size) break;
    parts.push(buffer.slice(lineEnd + 2, lineEnd + 2 + size));
    offset = lineEnd + 2 + size + 2;
  }
  return Buffer.concat(parts);
}

function request(port, method, target, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method, path: target, headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

async function expectStatus(server, target, status, options = {}) {
  const res = await rawRequest(server.port, target, options);
  const hostNote = options.hostLines ? ` (${JSON.stringify(options.hostLines)})` : options.host !== undefined ? ` (Host ${JSON.stringify(options.host)})` : "";
  const label = `${options.method || "GET"} ${target}${hostNote}`;
  assert.strictEqual(res.status, status, `${label} returned ${res.status}, expected ${status}`);
  assert(!res.body.toString("latin1").includes("not-a-secret-fixture-value"), `${label} leaked fixture content`);
  return res;
}

async function expectRefused(server, target, options) {
  return expectStatus(server, target, 404, options);
}

async function expectServed(server, target, file, options) {
  const res = await expectStatus(server, target, 200, options);
  assert(res.body.equals(fs.readFileSync(path.join(REPO, file))), `${target} is not byte-identical to ${file}`);
}

const QUIRKS = [
  "/.env.local",
  "/.ENV.local",
  "/.Env.Local",
  "/.env.local.",
  "/.env.local%20",
  "/.env.local::$DATA",
  "/%2Eenv.local",
  "/%2e%65nv.local",
  "/%252Eenv.local",
  "/assets/../.env.local",
  "/assets/..%2F.env.local",
  `/assets${BS}..${BS}.env.local`,
  "/.env",
  "/.gitignore",
  "/assets/.hidden.txt",
  "/assets%2F.hidden.txt",
  "/assets%5C.hidden.txt",
  "/%2e%2e/%2e%2e/Windows/win.ini"
];

const METHODS = ["GET", "HEAD", "POST"];

const servers = {};

check("front-end references are derived from the WordFlow document, and none is a directory or wildcard", async () => {
  const refs = frontEndReferences();
  assert(refs.length >= 4, `expected the documents' script, style and icon references, found ${refs.length}`);
  for (const r of refs) {
    assert(fs.statSync(path.join(REPO, r.ref)).isFile(), `${r.doc}:${r.line} references ${r.ref}, which is not a file`);
  }
});

check("part 1: without HOST the start-up line names host 127.0.0.1 and the bound address is loopback", async () => {
  const s = servers.default;
  assert.strictEqual(s.host, "127.0.0.1");
  assert.strictEqual(s.bound, "127.0.0.1", `bound to ${s.bound}`);
  assert(!/WARNING/.test(s.out.stdout + s.out.stderr), "no warning is expected for a loopback bind");
});

check("part 1: listener inventory has no non-loopback bind (no LAN connection attempted)", async () => {
  const s = servers.default;
  assert.strictEqual(s.bound, "127.0.0.1");
  if (process.platform === "win32") {
    const rows = execFileSync("netstat.exe", ["-ano", "-p", "tcp"], { encoding: "utf8", windowsHide: true }).split(/\r?\n/).map(line => line.trim().split(/\s+/));
    const owned = rows.filter(row => row[0] === "TCP" && row.at(-1) === String(s.child.pid) && row[1].endsWith(":" + s.port));
    assert(owned.length > 0, "netstat must identify the server listener");
    assert(owned.every(row => row[1] === "127.0.0.1:" + s.port), "non-loopback listener found");
  }
});

check("part 1 (F1): isLoopbackHost admits 127.0.0.0/8, ::1, IPv4-mapped 127.0.0.0/8 and localhost, and nothing else", async () => {
  const { isLoopbackHost } = serverHelpers();
  for (const host of ["127.0.0.1", "127.255.3.9", "::1", "::ffff:127.0.0.1", "::FFFF:127.9.8.7", "localhost", "LocalHost"]) {
    assert.strictEqual(isLoopbackHost(host), true, `${host} is loopback`);
  }
  for (const host of ["0.0.0.0", "::", "192.168.1.20", "10.0.0.5", "128.0.0.1", "1127.0.0.1", "::2", "::ffff:192.168.1.20", "::ffff:0.0.0.0", "evil.localhost", "localhost.example", ""]) {
    assert.strictEqual(isLoopbackHost(host), false, `${JSON.stringify(host)} is not loopback`);
  }
});

check("parts 1 and 6 (F2): the start-up warning names a non-loopback HOST and says the Host check is off; loopback gets none", async () => {
  const { startupWarning } = serverHelpers();
  for (const host of ["0.0.0.0", "::", "192.168.1.20"]) {
    const warning = startupWarning(host);
    assert(typeof warning === "string" && warning.startsWith(`WARNING: HOST=${host} `), `no warning naming ${host}: ${warning}`);
    assert(/Host header check is off/.test(warning), `the warning for ${host} does not say the Host check is off: ${warning}`);
  }
  for (const host of ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]) {
    assert.strictEqual(startupWarning(host), null, `unexpected warning for ${host}`);
  }
});

check("part 1: an explicit loopback HOST logs no warning", async () => {
  const s = servers.hostLoopback;
  assert.strictEqual(s.bound, "127.0.0.1");
  assert(!/WARNING/.test(s.out.stdout + s.out.stderr), "unexpected warning for HOST=127.0.0.1");
});

check("part 1 (F1): HOST=::ffff:127.0.0.1 opts in, is named in the start-up line, binds mapped loopback, and logs no warning", async () => {
  const s = servers.hostMapped;
  assert.strictEqual(s.host, "::ffff:127.0.0.1");
  assert.strictEqual(s.bound, "::ffff:127.0.0.1", `bound to ${s.bound}`);
  assert(!/WARNING/.test(s.out.stdout + s.out.stderr), `unexpected warning for a mapped-loopback HOST: ${s.out.stderr}`);
});

check("parts 2 and 4: every front-end file the documents load, and the WordFlow document, return 200 byte-identical", async () => {
  await expectServed(servers.default, "/", "index.html");
  for (const file of frontEndFiles()) await expectServed(servers.default, `/${file}`, file);
});

check("part 4: /.env.local and every Windows quirk, encoding and traversal form return 404 without leaking", async () => {
  for (const target of QUIRKS) await expectRefused(servers.default, target);
});

check("part 2: ordinary files that are not on the list return 404", async () => {
  for (const target of ["/package.json", "/docs/DECISIONS.md", "/server.js", "/marcdeck_pptx.js", "/tools/recipe_bridge.js"]) {
    await expectRefused(servers.default, target);
  }
});

check("part 2: matching is exact and case-sensitive", async () => {
  for (const target of ["/APP.JS", "/App.js", "/INDEX.HTML", "/Styles.css", "/ASSETS/wordflow-mark.svg", "/app.js.", "/app.js%20", "/app.js::$DATA", "/app.js/"]) {
    await expectRefused(servers.default, target);
  }
});

check("part 2: the path is percent-decoded once before matching", async () => {
  await expectServed(servers.default, "/app%2Ejs", "app.js");
  await expectServed(servers.default, "/assets%2Fwordflow-mark.svg", "assets/wordflow-mark.svg");
  await expectRefused(servers.default, "/app%252Ejs");
});

check("part 2: the path is normalised (backslashes) before matching", async () => {
  await expectServed(servers.default, "/assets%5Cwordflow-mark.svg", "assets/wordflow-mark.svg");
});

check("part 3 (F5): the guard runs before normalisation, so an encoded '..' to a listed file returns 404", async () => {
  for (const target of ["/assets%5C..%5Capp.js", "/assets%2F..%2Fapp.js", "/assets%5C..%5Cindex.html"]) {
    await expectRefused(servers.default, target);
  }
});

check("part 3: dotfiles and .env* are refused even when listed (the list holds them by mistake here)", async () => {
  if (servers.listedByMistakeError) throw servers.listedByMistakeError;
  const s = servers.listedByMistake;
  await expectServed(s, "/app.js", "app.js");
  for (const target of ["/.env.local", "/.gitignore", "/assets/.hidden.txt", "/assets%5C.hidden.txt", "/.ENV.local", "/%2Eenv.local"]) {
    await expectRefused(s, target);
  }
});

check("part 3 (F3, F4): listed names that only contain 'env' are served: the guard refuses dot segments and .env*, nothing more", async () => {
  if (servers.listedByMistakeError) throw servers.listedByMistakeError;
  const s = servers.listedByMistake;
  for (const name of ORDINARY_LISTED) {
    const res = await expectStatus(s, `/${name}`, 200);
    assert.strictEqual(res.body.toString("utf8"), ORDINARY_CONTENT, `/${name} did not serve the listed fixture`);
  }
});

check("B2: network-path targets (//x, /\\x) return 404 for GET, HEAD and POST, on static and API routes", async () => {
  const s = servers.default;
  for (const target of ["//.env.local", "//index.html", `/${BS}.env.local`, `/${BS}index.html`, "//app.js", `/${BS}app.js`]) {
    for (const method of METHODS) await expectRefused(s, target, { method });
  }
  for (const target of ["//api/read", "//localhost/api/read", `//127.0.0.1:${s.port}/api/read`, "//x/api/extract-file", `/${BS}x/api/read`]) {
    for (const method of METHODS) await expectRefused(s, target, { method });
  }
});

check("B2: absolute-form targets keep returning 404", async () => {
  const s = servers.default;
  for (const target of [`http://127.0.0.1:${s.port}/index.html`, `http://127.0.0.1:${s.port}/.env.local`, `http://127.0.0.1:${s.port}/api/read`]) {
    for (const method of METHODS) await expectRefused(s, target, { method });
  }
});

check("B2: a target starting with a backslash never reaches routing (Node's parser refuses it with 400)", async () => {
  for (const method of METHODS) await expectStatus(servers.default, `${BS}index.html`, 400, { method });
});

check("part 6: each loopback name at the bound port is accepted, in any case", async () => {
  const s = servers.default;
  for (const host of [`localhost:${s.port}`, `127.0.0.1:${s.port}`, `[::1]:${s.port}`, `LOCALHOST:${s.port}`, `LocalHost:${s.port}`]) {
    await expectServed(s, "/", "index.html", { host });
  }
  const api = await rawRequest(s.port, "/api/read", { host: `localhost:${s.port}` });
  assert.strictEqual(api.status, 400, "/api/read with a loopback Host did not reach the route");
});

check("part 6: a foreign Host is refused with 403 on a static route and on an API route", async () => {
  const s = servers.default;
  for (const host of ["evil.example", `evil.example:${s.port}`, `evil.localhost:${s.port}`, `notlocalhost:${s.port}`, `localhost.evil.example:${s.port}`, `127.0.0.2:${s.port}`, `[::ffff:127.0.0.1]:${s.port}`, `0.0.0.0:${s.port}`, ""]) {
    for (const target of ["/", "/app.js", "/api/read", "/api/extract-file"]) {
      for (const method of METHODS) await expectStatus(s, target, 403, { method, host });
    }
  }
});

check("part 6: a wrong port, or no port, is refused with 403", async () => {
  const s = servers.default;
  for (const host of [`localhost:${s.port + 1}`, `127.0.0.1:${s.port + 1}`, `[::1]:${s.port + 1}`, "localhost", "127.0.0.1", "[::1]", `localhost:0${s.port}`]) {
    await expectStatus(s, "/", 403, { host });
    await expectStatus(s, "/api/read", 403, { host });
  }
});

check("part 6: a missing Host is refused with 403, over HTTP/1.1 and HTTP/1.0", async () => {
  const s = servers.default;
  for (const version of ["1.1", "1.0"]) {
    for (const target of ["/", "/api/read"]) await expectStatus(s, target, 403, { host: null, version });
  }
});

check("part 6: the check uses the port actually bound, not the configured PORT", async () => {
  if (servers.retriedError) throw servers.retriedError;
  const s = servers.retried;
  const banners = s.out.stdout.split(/\r?\n/).filter((line) => STARTUP_RE.test(line));
  assert.strictEqual(banners.length, 1, `expected one start-up line after the port retry: ${JSON.stringify(banners)}`);
  assert.notStrictEqual(s.port, s.configuredPort, "the start-up line names the occupied configured port, not the bound one");
  await expectServed(s, "/", "index.html", { host: `127.0.0.1:${s.port}` });
  await expectStatus(s, "/", 403, { host: `127.0.0.1:${s.configuredPort}` });
});

check("part 6a: a loopback HOST (127.0.0.1, ::ffff:127.0.0.1) keeps the Host check on, with no warning", async () => {
  for (const s of [servers.hostLoopback, servers.hostMapped]) {
    assert(!/WARNING/.test(s.out.stdout + s.out.stderr), `unexpected warning for HOST=${s.host}`);
    for (const target of ["/", "/api/read"]) {
      await expectStatus(s, target, 403, { host: "evil.example" });
      await expectStatus(s, target, 403, { host: `evil.example:${s.port}` });
      await expectStatus(s, target, 403, { host: null });
      await expectStatus(s, target, 403, { host: null, version: "1.0" });
    }
    await expectServed(s, "/", "index.html", { host: `127.0.0.1:${s.port}` });
  }
});

check("part 6a: the on/off decision, from server.js's own line, is on for loopback listen hosts and off only for non-loopback ones", async () => {
  for (const host of ["127.0.0.1", "127.3.4.5", "::1", "::ffff:127.0.0.1", "localhost"]) {
    assert.strictEqual(hostCheckDecision(host), true, `the Host check must stay on for HOST=${host}`);
  }
  for (const host of ["0.0.0.0", "::", "192.168.1.20"]) {
    assert.strictEqual(hostCheckDecision(host), false, `the Host check must be off for HOST=${host}`);
  }
});

check("part 6b: portless loopback names are accepted only when the BOUND port is 80 (pure helper; nothing binds port 80)", async () => {
  // Configured 8080 but bound 80: portless names are accepted.
  const boundEighty = serverHelpers({ startPort: 8080 }).isAllowedHostHeader;
  for (const host of ["localhost", "127.0.0.1", "[::1]", "localhost:80", "127.0.0.1:80", "[::1]:80"]) {
    assert.strictEqual(boundEighty(host, 80), true, `${host} on bound port 80 must be accepted`);
  }
  for (const host of ["evil.example", "localhost:8080", "evil.localhost", "localhost:81", ""]) {
    assert.strictEqual(boundEighty(host, 80), false, `${JSON.stringify(host)} on bound port 80 must be refused`);
  }
  // Configured 80 but bound 8081 (a retry): the port is required.
  const boundOther = serverHelpers({ startPort: 80 }).isAllowedHostHeader;
  for (const host of ["localhost", "127.0.0.1", "[::1]", "localhost:80"]) {
    assert.strictEqual(boundOther(host, 8081), false, `${host} on bound port 8081 must be refused`);
  }
  assert.strictEqual(boundOther("localhost:8081", 8081), true, "localhost:8081 on bound port 8081 must be accepted");
  for (const port of [443, 8080]) assert.strictEqual(boundOther("localhost", port), false, `portless localhost on port ${port}`);
});

// B3: two Host field lines, in each order and in mixed name case.
function duplicateHostCases(port) {
  const allowed = `localhost:${port}`, other = `127.0.0.1:${port}`, foreign = `evil.example:${port}`;
  return [
    ["allowed then foreign", [`Host: ${allowed}`, `Host: ${foreign}`]],
    ["foreign then allowed", [`Host: ${foreign}`, `Host: ${allowed}`]],
    ["two allowed values", [`Host: ${allowed}`, `Host: ${other}`]],
    ["the same allowed value twice, names in different case", [`Host: ${allowed}`, `HOST: ${allowed}`]]
  ];
}

check("B3: two Host field lines are refused with 400 on a static and an API route, for GET, HEAD and POST", async () => {
  for (const s of [servers.default, servers.hostLoopback]) {
    for (const [, hostLines] of duplicateHostCases(s.port)) {
      for (const target of ["/", "/index.html", "/api/read", "/api/read?url=http%3A%2F%2Fevil.example%2F"]) {
        for (const method of METHODS) await expectStatus(s, target, 400, { method, hostLines });
      }
    }
  }
});

check("F7 (N4): targets that make URL parsing throw are refused by B2 first, with 404", async () => {
  for (const target of ["//[", "http://[", `/${BS}[`, "//evil.example:bad/"]) {
    for (const method of METHODS) await expectRefused(servers.default, target, { method });
  }
});

check("F8 (N6): Node's requireHostHeader is on whenever the Host check is off, and off while it is on", async () => {
  const { serverOptions } = serverHelpers();
  for (const host of ["0.0.0.0", "::", "192.168.1.20", TEST_NET_HOST]) {
    const decision = hostCheckDecision(host);
    assert.strictEqual(decision, false, `the Host check must be off for HOST=${host}`);
    assert.strictEqual(serverOptions(decision).requireHostHeader, true, `requireHostHeader must be on for HOST=${host}`);
  }
  for (const host of ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]) {
    assert.strictEqual(serverOptions(hostCheckDecision(host)).requireHostHeader, false, `requireHostHeader must be off for HOST=${host}`);
  }
  // Wiring (textual): the server is created with exactly these options.
  assert.strictEqual(SERVER_SOURCE.split("http.createServer(serverOptions(checkHostHeader), ").length - 1, 1,
    "server.js must create its server with serverOptions(checkHostHeader)");
});

check(`check off (HOST=${TEST_NET_HOST}, listen redirected to 127.0.0.1): warning printed; foreign Host admitted; Node's 400 for HTTP/1.1 without Host; B3 still 400`, async () => {
  if (servers.checkOffError) throw servers.checkOffError;
  const s = servers.checkOff;
  assert.strictEqual(s.host, TEST_NET_HOST);
  assert.strictEqual(s.bound, "127.0.0.1", `the redirect did not hold: bound ${s.bound}`);
  assert(s.out.stderr.includes(`WARNING: HOST=${TEST_NET_HOST} `) && /Host header check is off/.test(s.out.stderr), `no check-off warning: ${s.out.stderr}`);
  await expectServed(s, "/", "index.html", { host: "evil.example" });
  for (const target of ["/", "/api/read"]) {
    await expectStatus(s, target, 400, { host: null });
    for (const [, hostLines] of duplicateHostCases(s.port)) await expectStatus(s, target, 400, { hostLines });
  }
});

check("W2 routes: /api/read still routes and removed upload endpoint is refused", async () => {
  const missing = await request(servers.default.port, "GET", "/api/read");
  assert.strictEqual(missing.status, 400);
  assert.deepStrictEqual(JSON.parse(missing.body), { error: "Missing URL" });
  const boundary = "----serverexposure";
  const form = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="probe.txt"\r\nContent-Type: text/plain\r\n\r\nHello.\r\n--${boundary}--\r\n`;
  const extracted = await request(servers.default.port, "POST", "/api/extract-file", form, { "content-type": `multipart/form-data; boundary=${boundary}` });
  assert.strictEqual(extracted.status, 404, extracted.body);
  assert.strictEqual(extracted.body, "Not found");
});

// A loopback listener on the configured port, so the server under test retries on the next one.
function occupyPort() {
  return new Promise((resolve, reject) => {
    const blocker = net.createServer();
    blocker.once("error", reject);
    blocker.listen(0, "127.0.0.1", () => resolve(blocker));
  });
}

(async () => {
  const roots = [];
  let blocker;
  try {
    const plain = makeFixtureRoot(SERVER_SOURCE);
    roots.push(plain);
    servers.default = await startServer(plain);
    try {
      const mistaken = makeFixtureRoot(listedByMistakeSource());
      roots.push(mistaken);
      servers.listedByMistake = await startServer(mistaken);
    } catch (error) {
      servers.listedByMistakeError = error; // reported by the part 3 checks, which cannot run without it
    }
    servers.hostLoopback = await startServer(plain, "127.0.0.1");
    servers.hostMapped = await startServer(plain, "::ffff:127.0.0.1");
    try {
      const preload = path.join(plain, "listen-redirect.cjs");
      fs.writeFileSync(preload, LISTEN_REDIRECT);
      servers.checkOff = await startServer(plain, TEST_NET_HOST, undefined, preload);
    } catch (error) {
      servers.checkOffError = error; // reported by the check-off checks
    }
    try {
      blocker = await occupyPort();
      const configuredPort = blocker.address().port;
      servers.retried = await startServer(plain, undefined, configuredPort);
      servers.retried.configuredPort = configuredPort;
    } catch (error) {
      servers.retriedError = error; // reported by the bound-port check
    }
    for (const { label, fn } of checks) {
      try {
        const result = await fn();
        if (result !== "skip") {
          passed += 1;
          console.log(`  ok  ${label}`);
        }
      } catch (error) {
        console.error(`  FAIL  ${label}`);
        console.error(`        ${error && error.message}`);
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error(`  FAIL  setup: ${error && error.message}`);
    process.exitCode = 1;
  } finally {
    Object.values(servers).forEach(stopServer);
    if (blocker) blocker.close();
    await new Promise((resolve) => setTimeout(resolve, 300));
    for (const dir of roots) fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n${passed} checks passed${skipped ? `, ${skipped} skipped` : ""}.`);
})();
