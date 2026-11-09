"use strict";
// W7.13 delta probe (CC). Usage: node delta.cjs <cloneDir> <outDir>
// Serves the clone's server; baselines (feab295, 2a37644) route index.html/app.js/styles.css/svg from git.
const fs = require("node:fs"), path = require("node:path"), { execFileSync } = require("node:child_process");
const [CLONE, OUT] = process.argv.slice(2).map(p => path.resolve(p));
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true });
const { start, stop } = require(path.join(CLONE, "tests/helpers.cjs"));
const { launch } = require(path.join(CLONE, "tests/browser-helper.cjs"));
const FILES = ["index.html", "app.js", "styles.css", "assets/wordflow-mark.svg"];
const SHAS = { cand: null, feab295: "feab2951cb8239eba625775b912a7b9a0429ac34", base: "2a376445ceb1b98a1b4c943cf8834e77e0578120" };
const blobsAt = sha => Object.fromEntries(FILES.map(f => ["/" + f, execFileSync("git", ["show", sha + ":" + f], { cwd: CLONE })]));
async function openAt(context, origin, sha) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  if (sha) {
    const blobs = blobsAt(sha);
    await page.route("**/*", async route => {
      const u = new URL(route.request().url()), key = u.pathname === "/" ? "/index.html" : u.pathname;
      if (u.origin === origin && blobs[key]) return route.fulfill({ response: await route.fetch(), body: blobs[key] });
      return route.continue();
    });
  }
  await page.goto(origin, { waitUntil: "networkidle" });
  page.__errors = errors;
  return page;
}
const settle = async page => { await page.evaluate(() => document.fonts.ready); for (let i = 0; i < 3; i++) await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };
async function loadSample(page) {
  await page.locator("#sample-button").click(); await page.locator("#apply-source-button").click(); await page.locator("#review-back-button").click();
  await page.evaluate(() => { seekTo(2); window.scrollTo(0, 0); });
}
async function setFocus(page, focus) {
  if (await page.evaluate(() => state.focusMode) !== focus) await page.locator("#focus-mode-button").click();
  await page.evaluate(() => window.scrollTo(0, 0)); await settle(page);
  const on = await page.evaluate(() => [state.focusMode, document.body.classList.contains("focus-mode")]);
  if (on[0] !== focus || on[1] !== focus) throw new Error("focus not applied");
}
const bounds = page => page.evaluate(() => {
  const vw = innerWidth;
  const r = s => { const e = document.querySelector(s); if (!e) return { s, missing: true, left: 0, right: 0, width: 1 }; const b = e.getBoundingClientRect(); return { s, left: +b.left.toFixed(2), right: +b.right.toFixed(2), width: +b.width.toFixed(2) }; };
  const els3 = [r(".reader-heading"), r("#reader-fullscreen"), r(".reader-frame")];
  // any visible element sticking out to the right or left of the viewport
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const b = e.getBoundingClientRect(); if (!b.width || !b.height) continue;
    if (b.right > vw + 0.5 || b.left < -0.5) out.push((e.id ? "#" + e.id : e.tagName.toLowerCase() + "." + [...e.classList].join(".")) + " " + b.left.toFixed(1) + ".." + b.right.toFixed(1));
  }
  const hd = document.querySelector(".reader-heading");
  const headingClip = hd ? [...hd.querySelectorAll("*")].filter(e => { const b = e.getBoundingClientRect(), h = hd.getBoundingClientRect(); return b.width && (b.right > h.right + 0.5 || b.left < h.left - 0.5 || e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== "visible"); }).map(e => e.id || e.className || e.tagName) : [];
  return { vw, headingClip, scrollWidth: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, els: els3, outside: out.slice(0, 12), outsideCount: out.length };
});
async function prepare(page, token, size) {
  await page.evaluate(({ token, size }) => {
    pause(); switchTab("paste"); hideSourceReview(); state.focusLetter = true; state.contextWords = true;
    state.wpm = 100; state.smartPacing = false; state.sentencePause = false; state.commaPause = false; state.paragraphPause = false;
    loadText("Lead " + token + " Tail End.", "Reader fixture", "Reader fixture"); setWordSize(size); seekTo(1); window.scrollTo(0, 0);
  }, { token, size });
  await settle(page);
}
const geom = page => page.evaluate(() => {
  const d = els.wordDisplay, f = d.closest(".reader-frame"), fr = f.getBoundingClientRect();
  const w = d.getBoundingClientRect(), p = els.previousContext.getBoundingClientRect(), n = els.nextContext.getBoundingClientRect();
  return { frameW: fr.width, frameH: fr.height, font: getComputedStyle(d).fontSize, top: w.top - p.bottom, bottom: n.top - w.bottom, scrollWidth: document.documentElement.scrollWidth, vw: innerWidth };
});
(async () => {
  const server = await start(CLONE), origin = "http://127.0.0.1:" + server.port, browser = await launch();
  const res = { chrome: browser.version(), overflow: [], spot: [], scan: [], w712: [], wordSizes: [], shots: [] };
  try {
    // 1. Gate widths + spot checks, three SHAs, both themes, normal + focus, sample loaded at index 2.
    const widths = [[310, 844], [320, 844], [340, 844], [360, 844], [375, 844], [390, 844], [768, 1024], [1400, 950], [1920, 1080]];
    for (const scheme of ["dark", "light"]) for (const [k, sha] of Object.entries(SHAS)) {
      const ctx = await browser.newContext({ viewport: { width: 430, height: 844 }, colorScheme: scheme });
      const page = await openAt(ctx, origin, sha); await loadSample(page);
      for (const [w, h] of widths) for (const focus of [false, true]) {
        await page.setViewportSize({ width: w, height: h }); await setFocus(page, focus);
        const b = await bounds(page);
        const contained = b.els.every(e => e.width > 0 && e.left >= 0 && e.right <= w) && !b.headingClip.length;
        res.overflow.push({ scheme, sha: k, w, h, focus, scrollWidth: b.scrollWidth, ok: b.scrollWidth <= w && contained, contained, headingClip: b.headingClip, els: b.els, outsideCount: b.outsideCount, outside: b.outside });
      }
      await setFocus(page, false);
      // 300..430 scan (normal)
      const over = [];
      for (let w = 300; w <= 430; w += 5) { await page.setViewportSize({ width: w, height: 844 }); await settle(page); const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > w) over.push(w + ":" + sw); }
      res.scan.push({ scheme, sha: k, over });
      // 320x844 screenshots (candidate only): normal viewport + full page, focus viewport
      if (k === "cand" || k === "base") {
        await page.setViewportSize({ width: 320, height: 844 }); await setFocus(page, false);
        for (const [name, full] of [["normal", false], ["normal-full", true]]) { const f = path.join(OUT, "shots", "320-" + scheme + "-" + k + "-" + name + ".png"); await page.screenshot({ path: f, fullPage: full }); res.shots.push(f); }
        if (k === "cand") { await setFocus(page, true); const f = path.join(OUT, "shots", "320-" + scheme + "-cand-focus.png"); await page.screenshot({ path: f }); res.shots.push(f); await setFocus(page, false); }
      }
      if (page.__errors.length) res.errors = (res.errors || []).concat(page.__errors.map(e => k + ": " + e));
      await ctx.close();
    }
    // 2. W7.12 gates and word sizes: candidate vs 2a37644, "Hello" fixture, three sizes.
    for (const scheme of ["dark", "light"]) {
      const pages = {};
      for (const k of ["cand", "base"]) { const ctx = await browser.newContext({ viewport: { width: 1400, height: 950 }, colorScheme: scheme }); pages[k] = { ctx, page: await openAt(ctx, origin, SHAS[k]) }; }
      for (const [w, h] of [[390, 844], [768, 1024], [1400, 950], [1920, 1080]]) for (const focus of [false, true]) for (const size of ["large", "comfortable", "compact"]) {
        const row = { scheme, w, h, focus, size };
        for (const k of ["cand", "base"]) { const p = pages[k].page; await p.setViewportSize({ width: w, height: h }); await prepare(p, "Hello", size); await setFocus(p, focus); row[k] = await geom(p); }
        res.w712.push(row);
      }
      for (const k of ["cand", "base"]) await pages[k].ctx.close();
    }
  } finally { await browser.close(); await stop(server); }
  fs.writeFileSync(path.join(OUT, "delta.json"), JSON.stringify(res, null, 1) + "\n");
  // summary
  const lines = ["chrome " + res.chrome];
  for (const r of res.overflow) lines.push([r.sha, r.scheme, r.w + "x" + r.h, r.focus ? "focus" : "normal", "sw=" + r.scrollWidth, r.ok ? "OK" : "OVERFLOW", "outside=" + r.outsideCount, r.outside.slice(0, 3).join(" | ")].join(" "));
  for (const s of res.scan) lines.push("scan " + s.sha + " " + s.scheme + ": " + (s.over.join(" ") || "none"));
  let gate = true;
  for (const r of res.w712) {
    const c = r.cand, b = r.base, clr = Math.min(c.top, c.bottom), same = c.font === b.font;
    let g = clr >= 8 && same;
    if (r.w === 1400 && r.h === 950 && !r.focus) g = g && c.frameW >= 575.7 && c.frameH >= 595.65;
    gate = gate && g;
    lines.push(["w712", r.scheme, r.w + "x" + r.h, r.focus ? "focus" : "normal", r.size, "frame " + c.frameW.toFixed(2) + "x" + c.frameH.toFixed(2), "base " + b.frameW.toFixed(2) + "x" + b.frameH.toFixed(2), "font " + c.font + "/" + b.font, "clr " + clr.toFixed(2), "sw " + c.scrollWidth + "/" + c.vw, g ? "PASS" : "FAIL"].join(" "));
  }
  lines.push("W7.12 gates all pass: " + gate, "page errors: " + JSON.stringify(res.errors || []));
  fs.writeFileSync(path.join(OUT, "delta.txt"), lines.join("\n") + "\n");
  console.log(lines.filter(l => /OVERFLOW|scan|FAIL|gates|errors|chrome/.test(l)).join("\n"));
})().catch(e => { console.error(e); process.exitCode = 1; });
