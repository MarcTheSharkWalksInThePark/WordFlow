"use strict";
// Landscape 844x390: where are the frame, scroll area, note and Play control, on the branch and on master?
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const res = {};
  try {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
    for (const [name, url] of [["master", s.master], ["branch", s.branch]]) {
      const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" });
      for (const tok of ["Hello", "W".repeat(10000)]) {
        await L.prepare(p, tok, { index: 1 }); // static arrival; the note depends on the scroll state, not on how it was reached
        const g = await p.evaluate(() => { const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.top * 100) / 100, Math.round(b.bottom * 100) / 100]; };
          return { scrollY, vh: innerHeight, docH: document.documentElement.scrollHeight, frame: r(els.wordDisplay.closest(".reader-frame")), word: r(els.wordDisplay), play: r(document.querySelector("#play-button")),
            note: els.longTextNote && !els.longTextNote.hidden ? r(els.longTextNote) : null, playing: state.playing }; });
        // Can frame (incl. note) and Play be visible at once?
        g.frameAndPlayFit = (g.play[1] - g.frame[0]) <= g.vh; g.frameFits = (g.frame[1] - g.frame[0]) <= g.vh;
        res[name + " " + tok.slice(0, 5)] = g; await p.evaluate(() => pause());
      }
      await p.locator(".reader-frame").screenshot({ path: L.path.join(L.OUT, `landscape-${name}-frame.png`) });
      await p.screenshot({ path: L.path.join(L.OUT, `landscape-${name}-viewport.png`) });
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(L.OUT, "landscape.json"), JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
