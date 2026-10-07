"use strict";
// Extra edge checks: final-word Play, re-render scroll reset, hidden-tab playback, wide-frame threshold.
const L = require("./lib.cjs");
const out = L.path.join(L.SP, "ev", "extra"); L.fs.mkdirSync(out, { recursive: true });
const st = (page) => page.evaluate(() => ({ index: state.index, playing: state.playing, finished: state.finished, countdown: state.countdownActive, marker: els.wordDisplay.dataset.longTextPaused ?? null,
  scrolling: els.wordDisplay.classList.contains("scrolling-long-word"), note: !els.longTextNote.hidden, summary: !els.finishSummary.hidden, scrollTop: els.wordDisplay.scrollTop, visibility: document.visibilityState }));
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const R = {};
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(s.branch, { waitUntil: "networkidle" });
    const W = L.token("W", 2000);
    // 1. Long token as the final word: auto-pause, then Play.
    await L.prepare(page, W, { index: 0, tail: "" }); await page.evaluate(() => startReading()); await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1");
    R.final_autoPaused = await st(page); await page.locator("#play-button").click(); await page.waitForTimeout(400); await L.settle(page); R.final_afterPlay = await st(page);
    await page.locator(".reader-frame").screenshot({ path: L.path.join(out, "final-word-after-play-390.png") });
    // 2. Re-render while reading the scrolled token: WPM change, context toggle, word-size click.
    const resets = {};
    for (const [label, act] of [["wpm faster button", () => page.locator("#faster-button").click()], ["context toggle", () => page.locator("#context-toggle").click()], ["word size Large click", () => page.locator('.segment[data-size="large"]').click()], ["copy button", () => page.locator("#copy-word-button").click()]]) {
      await L.prepare(page, W); await page.evaluate(() => { els.wordDisplay.scrollTop = 300; }); await act(); await L.settle(page); await L.settle(page); resets[label] = (await st(page)).scrollTop;
    }
    R.rerender_scrollTop_from_300 = resets;
    // 3. Playback while the tab is hidden: does the long token still pause?
    await L.prepare(page, W, { index: 0 }); const other = await ctx.newPage(); await other.goto("about:blank");
    await page.evaluate(() => startReading()); await other.bringToFront(); R.hidden_visibility = await page.evaluate(() => document.visibilityState);
    await page.waitForTimeout(3500); R.hidden_after3500ms = await st(page); await page.bringToFront(); await page.waitForTimeout(300); R.hidden_backInFront = await st(page); await page.evaluate(() => pause()); await other.close();
    R.errors = errors; await ctx.close();
    // 4. Wide frames: smallest viewport width at which the real 45-character word stops being fitted (normal and focus mode), branch and master.
    R.wide = {};
    for (const [name, origin] of [["branch", s.branch], ["master", s.master]]) for (const focusMode of [false, true]) {
      const c = await browser.newContext({ viewport: { width: 1400, height: 950 } }); const p = await c.newPage(); await p.goto(origin, { waitUntil: "networkidle" });
      const fitted = async (w, tok) => { await p.setViewportSize({ width: w, height: 950 }); await L.prepare(p, tok, { focusMode }); return p.evaluate(() => ({ cls: els.wordDisplay.className, font: getComputedStyle(els.wordDisplay).fontSize, frameW: els.wordDisplay.closest(".reader-frame").clientWidth, overflow: els.wordDisplay.closest(".reader-frame").scrollWidth > els.wordDisplay.closest(".reader-frame").clientWidth })); };
      let lo = 800, hi = 3000; // lo: fitted/no overflow, hi: overflow
      for (const tok of [L.REAL]) { if ((await fitted(lo, tok)).overflow) { R.wide[name + (focusMode ? "-focus" : "-normal")] = { note: "overflow already at 800" }; continue; }
        if (!(await fitted(hi, tok)).overflow) { R.wide[name + (focusMode ? "-focus" : "-normal")] = { note: "no overflow up to 3000" }; continue; }
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((await fitted(mid, tok)).overflow) hi = mid; else lo = mid; }
        R.wide[name + (focusMode ? "-focus" : "-normal")] = { lastOkViewport: lo, firstOverflowViewport: hi, atLastOk: await fitted(lo, tok), atFirstOverflow: await fitted(hi, tok), W2000atFirst: await fitted(hi, W) };
      }
      await c.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "extra.json"), JSON.stringify(R, null, 1));
  for (const [k, v] of Object.entries(R)) console.log(k, JSON.stringify(v));
})().catch((e) => { console.error(e); process.exit(1); });
