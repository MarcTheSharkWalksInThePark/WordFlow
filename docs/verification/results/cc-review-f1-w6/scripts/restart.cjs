"use strict";
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await p.goto(s.branch, { waitUntil: "networkidle" });
    await L.prepare(p, L.token("W", 2000), { index: 0, tail: "" }); await p.evaluate(() => { state.wpm = 900; startReading(); }); await p.waitForTimeout(1500);
    await p.locator("#play-button").click(); await p.waitForTimeout(300);
    const before = await p.evaluate(() => ({ finished: state.finished, marker: els.wordDisplay.dataset.longTextPaused ?? null }));
    await p.locator("#finish-restart-button, #restart-button").first().click(); await L.settle(p);
    const after = await p.evaluate(() => ({ index: state.index, finished: state.finished, marker: els.wordDisplay.dataset.longTextPaused ?? null }));
    await p.locator("#play-button").click(); await p.waitForTimeout(300);
    console.log(JSON.stringify({ before, afterRestart: after, playAfterRestart: await p.evaluate(() => ({ countdown: state.countdownActive, index: state.index })) }));
  } finally { await browser.close(); await s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
