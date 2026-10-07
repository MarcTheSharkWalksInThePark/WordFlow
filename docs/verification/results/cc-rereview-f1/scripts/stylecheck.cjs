"use strict";
// Is the W6.12 DOM difference only style="" (history), and does it vanish on a fresh document?
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const out = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1708, height: 950 } });
    const b = await ctx.newPage(), m = await ctx.newPage();
    for (const [p, u] of [[b, s.branch], [m, s.master]]) await p.goto(u, { waitUntil: "networkidle" });
    const style = (p) => p.evaluate(() => ({ attr: els.wordDisplay.getAttribute("style"), font: getComputedStyle(els.wordDisplay).fontSize, cls: els.wordDisplay.className }));
    for (const seq of [["Responsibility"], ["Wholeheartedly", "Responsibility"]]) {
      for (const p of [b, m]) await p.reload({ waitUntil: "networkidle" });
      for (const w of seq) { for (const p of [m, b]) { await p.bringToFront(); await L.prepare(p, w); } }
      out.push({ seq: seq.join(" -> "), branch: await style(b), master: await style(m) });
    }
    await ctx.close();
  } finally { await browser.close(); await s.close(); }
  console.log(JSON.stringify(out, null, 1)); L.fs.writeFileSync(L.path.join(L.OUT, "w612", "stylecheck.json"), JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
