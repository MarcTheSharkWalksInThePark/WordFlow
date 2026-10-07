"use strict";
// Resize 1400 -> 390 -> 1400 on W2000 and W10000: scrollTop restore and state clearing.
const L = require("./lib.cjs");
const st = (page) => page.evaluate(() => { const d = els.wordDisplay; return { vw: innerWidth, index: state.index, playing: state.playing, wrapped: d.classList.contains("wrapped-long-word"), scrolling: d.classList.contains("scrolling-long-word"),
  frameClass: d.closest(".reader-frame").classList.contains("scrolling-long-text"), scrollTop: d.scrollTop, max: d.scrollHeight - d.clientHeight, note: !els.longTextNote.hidden, tabindex: d.getAttribute("tabindex"), role: d.getAttribute("role"),
  marker: d.dataset.longTextPaused ?? null, active: document.activeElement === document.body ? "body" : document.activeElement.id, textLen: d.textContent.length }; });
const BIG = { width: 1400, height: 950 }, SMALL = { width: 390, height: 844 };
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const R = {};
  try {
    const ctx = await browser.newContext({ viewport: BIG }); const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(s.branch, { waitUntil: "networkidle" });
    for (const n of [2000, 10000]) {
      const seq = []; const step = async (label) => { await L.settle(page); await L.settle(page); seq.push({ label, ...(await st(page)) }); };
      await page.setViewportSize(BIG); await L.prepare(page, L.token("W", n)); await step("1400 manual arrival");
      if ((await st(page)).scrolling) { await page.evaluate(() => { els.wordDisplay.scrollTop = 500; }); await step("1400 set scrollTop 500"); }
      await page.setViewportSize(SMALL); await step("-> 390");
      await page.evaluate(() => { els.wordDisplay.focus(); els.wordDisplay.scrollTop = 300; }); await step("390 focus region, set scrollTop 300");
      await page.setViewportSize(BIG); await step("-> 1400");
      await page.setViewportSize(SMALL); await step("-> 390 again");
      R["manual W" + n] = seq;
      // Auto-paused at 390, then widen and narrow, then Play.
      const seq2 = []; const step2 = async (label) => { await L.settle(page); await L.settle(page); seq2.push({ label, ...(await st(page)) }); };
      await page.setViewportSize(SMALL); await L.prepare(page, L.token("W", n), { index: 0 }); await page.evaluate(() => startReading());
      await page.waitForFunction(() => state.index === 1); await page.waitForTimeout(200); await step2("390 auto-paused");
      await page.evaluate(() => { els.wordDisplay.scrollTop = 200; }); await step2("390 set scrollTop 200");
      await page.setViewportSize(BIG); await step2("-> 1400");
      await page.setViewportSize(SMALL); await step2("-> 390");
      await page.locator("#play-button").click(); await page.waitForTimeout(2400); await step2("Play pressed, +2.4 s");
      await page.evaluate(() => pause());
      R["autopaused W" + n] = seq2;
    }
    R.errors = errors;
  } finally { await browser.close(); await s.close(); }
  L.fs.mkdirSync(L.path.join(L.SP, "ev"), { recursive: true }); L.fs.writeFileSync(L.path.join(L.SP, "ev", "resize.json"), JSON.stringify(R, null, 1));
  for (const [k, v] of Object.entries(R)) { console.log(k); if (Array.isArray(v)) for (const x of v) console.log("  ", JSON.stringify(x)); else console.log("  ", JSON.stringify(v)); }
})().catch((e) => { console.error(e); process.exit(1); });
