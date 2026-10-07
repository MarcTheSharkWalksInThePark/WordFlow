"use strict";
// Focus mode on a wide viewport: is the long token fitted at all (branch and master)?
const L = require("./lib.cjs");
const out = L.path.join(L.SP, "ev", "focus"); L.fs.mkdirSync(out, { recursive: true });
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  try {
    for (const viewport of [{ width: 1400, height: 950 }, { width: 1024, height: 768 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport });
      for (const [name, origin] of [["branch", s.branch], ["master", s.master]]) {
        const page = await ctx.newPage(); await page.goto(origin, { waitUntil: "networkidle" });
        for (const tok of ["Hello", L.REAL, L.token("W", 135), L.token("W", 2000), L.token("W", 10000)]) {
          await L.prepare(page, tok, { focusMode: true });
          const m = await L.measure(page);
          const extra = await page.evaluate(() => { const d = els.wordDisplay, f = d.closest(".reader-frame"); return { dScrollW: d.scrollWidth, dClientW: d.clientWidth, maxWidthCss: getComputedStyle(d).maxWidth, contentW: (() => { const r = document.createRange(); r.selectNodeContents(d); return r.getBoundingClientRect().width; })(), frameW: f.clientWidth, fit90: f.clientWidth * 0.9 }; });
          const file = `focus-${viewport.width}-${name}-${tok.length}.png`;
          if (tok.length >= 45) await page.locator(".reader-frame").screenshot({ path: L.path.join(out, file) });
          rows.push({ viewport: viewport.width, build: name, len: tok.length, font: m.font, classes: m.classes, wordW: m.word.w, wordH: m.word.h, ...extra, frameScrollW: m.frame.scrollW, frameClientW: m.frame.clientW, shot: tok.length >= 45 ? file : null });
        }
        await page.close();
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "focus.json"), JSON.stringify(rows, null, 1));
  for (const r of rows) console.log(r.viewport, r.build, r.len, r.font, r.classes, "rectW", r.wordW, "contentW", r.contentW.toFixed(1), "frameW", r.frameW, "90%", r.fit90.toFixed(1), "maxW", r.maxWidthCss, "frame scrollW", r.frameScrollW);
})().catch((e) => { console.error(e); process.exit(1); });
