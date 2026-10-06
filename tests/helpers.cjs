"use strict";
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const net = require("node:net");
const vm = require("node:vm");
const { spawn, execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const FRONT = ["index.html", "app.js", "styles.css", "assets/wordflow-mark.svg"];
const OWNED = [...FRONT, "file-extractors.mjs", "lib/read-proxy.mjs", "404.html", "LICENSE", "THIRD_PARTY_NOTICES.md", "api/read"];
const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");
function cleanEnv(extra = {}) {
  const env = {};
  for (const key of ["PATH", "Path", "SystemRoot", "WINDIR", "USERPROFILE", "TEMP", "TMP", "APPDATA", "LOCALAPPDATA", "ComSpec", "PATHEXT", "NODE_OPTIONS"]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return { ...env, ...extra };
}
function functionText(source, name) {
  const match = new RegExp("^(?:async )?function " + name + "\\([^)]*\\) \\{[\\s\\S]*?^\\}", "m").exec(source);
  assert(match, "missing function " + name);
  return match[0];
}
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer(); s.once("error", reject);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}
async function start(repo, options = {}) {
  const port = options.port || await freePort();
  const guard = path.join(__dirname, "network_guard.cjs");
  const extra = { PORT: String(port), WORDFLOW_NETWORK_LOG: options.networkLog || path.join(os.tmpdir(), "wordflow-test-network.jsonl") };
  if (options.host !== undefined) extra.HOST = options.host;
  const args = ["-r", guard];
  if (options.preload) args.push("-r", options.preload);
  args.push(path.join(repo, "server.js"));
  const child = spawn(process.execPath, args, { cwd: repo, env: cleanEnv(extra), stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  const s = { child, stdout: "", stderr: "", repo, port };
  child.stdout.on("data", c => { s.stdout += c; }); child.stderr.on("data", c => { s.stderr += c; });
  await new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const m = /(?:MarcDeck \/ )?WordFlow: http:\/\/localhost:(\d+) \(host (\S+), bound ([^)]+)\)/.exec(s.stdout);
      if (m) { clearInterval(interval); clearTimeout(timer); s.port = Number(m[1]); s.host = m[2]; s.bound = m[3]; assert(/^127\.|^::1$|^::ffff:127\./i.test(s.bound)); resolve(); }
    }, 20);
    const timer = setTimeout(() => { clearInterval(interval); child.kill(); reject(new Error("Startup timeout")); }, 15000);
    child.once("exit", code => { clearInterval(interval); clearTimeout(timer); reject(new Error("Server exited " + code + ": " + s.stderr)); });
  });
  return s;
}
async function stop(s) {
  if (!s || s.child.exitCode !== null) return;
  await new Promise(resolve => { s.child.once("exit", resolve); s.child.kill(); });
}
function request(port, method, target, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method, path: target, headers }, res => {
      const chunks = []; res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
    }); req.setTimeout(15000, () => req.destroy(new Error("Request timeout"))); req.on("error", reject); req.end(body);
  });
}
function multipart(filename, contentType, content) {
  const boundary = "----WordFlowSyntheticBoundary20261005";
  return { headers: { "content-type": "multipart/form-data; boundary=" + boundary }, body: Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`), Buffer.from(content), Buffer.from(`\r\n--${boundary}--\r\n`)]) };
}
module.exports = { FRONT, OWNED, sha, cleanEnv, functionText, freePort, start, stop, request, multipart, execFileSync, assert };
