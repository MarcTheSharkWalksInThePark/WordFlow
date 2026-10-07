"use strict";
// Final-word long token: Play after finish (branch) vs ordinary finished restart (master).
const L = require("./lib.cjs");
const st = (p) => p.evaluate(() => ({ index: state.index, playing: state.playing, finished: state.finished, countdown: state.countdownActive, marker: els.wordDisplay.dataset.longTextPaused ?? null, note: !els.longTextNote?.hidden, summary: !els.finishSummary.hidden, shown: els.wordDisplay.textContent.slice(0, 8) }));
(async () => {
  const s = await L.servers(); const browser = await L.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    for (const [name, origin, tok] of [["branch-long", s.branch, L.token("W", 2000)], ["branch-short", s.branch, "Short"], ["master-long", s.master, L.token("W", 2000)]]) {
      const p = await ctx.newPage(); await p.goto(origin, { waitUntil: "networkidle" });
      await L.prepare(p, tok, { index: 0, tail: "" }); await p.evaluate(() => { state.wpm = 900; startReading(); });
      await p.waitForTimeout(1500); const a = await st(p);
      await p.locator("#play-button").click(); await p.waitForTimeout(400); const b = await st(p);
      await p.locator("#play-button").click(); await p.waitForTimeout(400); const c = await st(p);
      await p.waitForTimeout(2200); const d = await st(p);
      console.log(name, "\n  after reading", JSON.stringify(a), "\n  Play#1", JSON.stringify(b), "\n  Play#2", JSON.stringify(c), "\n  +2.2s", JSON.stringify(d));
      if (name === "branch-long") await p.locator(".reader-frame").screenshot({ path: L.path.join(L.SP, "ev", "extra", "final-word-play2-390.png") });
      await p.evaluate(() => pause()); await p.close();
    }
  } finally { await browser.close(); await s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
