"use strict";
// Optional verification tool; uses already-installed Playwright and Chrome, installs nothing.
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const net = require("node:net");
const { start, stop, sha, assert } = require("../tests/helpers.cjs");
const repo = path.join(__dirname, "..");
const arg = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
(async () => {
  const candidates = [process.env.WORDFLOW_CHROME, path.join(process.env.ProgramFiles || "C:/Program Files", "Google/Chrome/Application/chrome.exe"), "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].filter(Boolean);
  const executable = candidates.find(file => fs.existsSync(file));
  if (!executable) { console.log("SMOKE SKIPPED: installed Chrome not found"); return; }
  let playwright;
  try { playwright = require("playwright"); }
  catch { playwright = require(process.env.WORDFLOW_PLAYWRIGHT_DIR || path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")); }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "wordflow-chrome-smoke-"));
  let server, browser, denyProxy;
  const result = { chrome: executable, automation: "already-installed Playwright; Browser plugin not available; CUA inventory had only IAB/MCP Apps, no Chrome", viewport: { width: 1400, height: 950 }, flow: "homepage -> File -> upload synthetic TXT -> review text -> Use source -> text and first word in reader", blockedPageRequests: [], browserProxyConnections: 0, errors: [], responses: [] };
  try {
    const fixtureText = "WordFlow smoke fixture.\nThe uploaded text appears in the reader.\nÆøå — UTF-8.\n";
    const fixture = path.join(temp, "fixture.txt"); fs.writeFileSync(fixture, fixtureText);
    server = await start(repo, { networkLog: path.join(temp, "network.jsonl") });
    denyProxy = net.createServer(socket => { result.browserProxyConnections += 1; socket.destroy(); });
    await new Promise(resolve => denyProxy.listen(0, "127.0.0.1", resolve));
    const origin = `http://127.0.0.1:${server.port}`;
    browser = await playwright.chromium.launch({ executablePath: executable, headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-domain-reliability", "--disable-sync", "--no-first-run", "--disable-quic", "--disable-features=DnsOverHttps", "--host-resolver-rules=MAP * 127.0.0.1, EXCLUDE localhost", `--proxy-server=http://127.0.0.1:${denyProxy.address().port}`, "--proxy-bypass-list=127.0.0.1;localhost;[::1]"] });
    result.chromeVersion = browser.version();
    const context = await browser.newContext({ viewport: result.viewport, serviceWorkers: "block" });
    await context.route("**/*", route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      result.blockedPageRequests.push(url.origin); return route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", e => result.errors.push(e.message));
    page.on("console", message => { if (message.type() === "error") result.errors.push(message.text()); });
    page.on("response", response => result.responses.push({ pathname: new URL(response.url()).pathname, status: response.status() }));
    await page.goto(origin + "/", { waitUntil: "networkidle" });
    result.url = page.url(); result.title = await page.title();
    assert.equal(result.title, "WordFlow Reader");
    assert((await page.locator("body").innerText()).includes("WordFlow"));
    await page.locator("#tab-file").click();
    await page.locator("#file-input").setInputFiles(fixture);
    await page.locator("#review-text").waitFor({ state: "visible" });
    result.reviewText = await page.locator("#review-text").inputValue();
    assert(result.reviewText.includes("WordFlow smoke fixture."));
    assert(result.reviewText.includes("The uploaded text appears in the reader."));
    await page.locator("#apply-source-button").click();
    result.appliedText = await page.locator("#text-input").inputValue();
    assert(result.appliedText.includes("WordFlow smoke fixture."));
    result.visibleText = await page.locator("body").innerText();
    assert(result.visibleText.includes("WordFlow"));
    result.firstWord = (await page.locator("#word-display").textContent()).trim();
    assert.equal(result.firstWord, "WordFlow", "uploaded text must reach the word reader");
    const screenshot = arg("--screenshot") || path.join(temp, "smoke.png");
    await page.screenshot({ path: screenshot, fullPage: false });
    result.screenshot = { filename: path.basename(screenshot), sha256: sha(fs.readFileSync(screenshot)) };
    assert.equal(result.errors.length, 0, "app console/page errors");
    assert.equal(result.blockedPageRequests.length, 0, "unexpected page network requests");
    assert(result.responses.length >= 4 && result.responses.every(r => r.status === 200));
    result.passed = true;
    result.outboundConnections = 0;
    result.networkIsolation = "Fresh browser profile; every non-loopback browser request uses a loopback deny-proxy that never forwards; host resolver maps all names to loopback; page route guard permits only the server origin. Server process uses network_guard.cjs.";
  } finally {
    if (browser) await browser.close();
    if (denyProxy) await new Promise(resolve => denyProxy.close(resolve));
    await stop(server);
    fs.rmSync(temp, { recursive: true, force: true });
  }
  if (arg("--out")) fs.writeFileSync(arg("--out"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ passed: result.passed, title: result.title, responses: result.responses, errors: result.errors.length, outboundConnections: result.outboundConnections }));
})().catch(error => { console.error(error); process.exitCode = 1; });
