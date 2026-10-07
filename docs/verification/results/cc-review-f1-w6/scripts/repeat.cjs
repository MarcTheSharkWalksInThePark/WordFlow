"use strict";
// Repeatability of frame screenshots: branch vs branch, master vs master, branch vs master.
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch();
  try {
    for (const [vw, size, tok] of [[1400, "large", "Hello"], [390, "comfortable", L.REAL], [1400, "large", L.REAL], [390, "large", "Hello"]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vw === 1400 ? 950 : 844 } });
      const b = await ctx.newPage(), m = await ctx.newPage(); await b.goto(s.branch, { waitUntil: "networkidle" }); await m.goto(s.master, { waitUntil: "networkidle" });
      const shots = { b: [], m: [] };
      for (let i = 0; i < 3; i++) for (const [k, p] of [["b", b], ["m", m]]) {
        await p.bringToFront(); await L.prepare(p, tok); await p.evaluate((sz) => setWordSize(sz), size); await L.settle(p); await L.settle(p); await p.waitForTimeout(600);
        shots[k].push(await p.locator(".reader-frame").screenshot({ animations: "disabled", caret: "hide" }));
      }
      const d = async (x, y) => (await L.pixelDiff(b, x, y)).differingPixels;
      console.log(vw, size, tok.length, "b0-b1", await d(shots.b[0], shots.b[1]), "b1-b2", await d(shots.b[1], shots.b[2]), "m0-m1", await d(shots.m[0], shots.m[1]), "m1-m2", await d(shots.m[1], shots.m[2]),
        "b0-m0", await d(shots.b[0], shots.m[0]), "b1-m1", await d(shots.b[1], shots.m[1]), "b2-m2", await d(shots.b[2], shots.m[2]));
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
