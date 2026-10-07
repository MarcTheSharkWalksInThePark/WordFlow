"use strict";
// After a resize, does a token that is fully visible on master keep master's font, rectangle, classes and text?
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  try {
    for (const word of ["Understanding", "Kommune", "Hello"]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const res = {};
      for (const [name, url] of [["master", s.master], ["branch", s.branch]]) {
        const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" }); await L.prepare(p, word);
        const a = await L.measure(p); await p.setViewportSize({ width: 1920, height: 1080 }); await L.settle(p); await L.settle(p); const b = await L.measure(p);
        await p.setViewportSize({ width: 390, height: 844 });
        res[name] = { at390: [a.font, a.classes], at1920: { font: b.font, classes: b.classes, word: b.word, text: b.text, visible: b.fullyInside } }; await p.close();
      }
      rows.push({ word, ...res, sameFontRect: res.master.at1920.font === res.branch.at1920.font && JSON.stringify(res.master.at1920.word) === JSON.stringify(res.branch.at1920.word), sameClasses: res.master.at1920.classes === res.branch.at1920.classes });
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(L.OUT, "resizeclass.json"), JSON.stringify(rows, null, 1));
  for (const r of rows) console.log(r.word, "390:", r.master.at390.join(" "), "| 1920 master", r.master.at1920.font, JSON.stringify(r.master.at1920.classes), "visible", r.master.at1920.visible, "| branch", r.branch.at1920.font, JSON.stringify(r.branch.at1920.classes), "| font+rect equal", r.sameFontRect, "classes equal", r.sameClasses);
})().catch((e) => { console.error(e); process.exit(1); });
