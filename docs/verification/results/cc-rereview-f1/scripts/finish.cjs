"use strict";
// Natural playback to the end (Play, countdown, all words), default word size and the real UI, branch vs master.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "play"); L.fs.mkdirSync(out, { recursive: true });
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  try {
    for (const [w, h] of [[390, 844], [1400, 950]]) for (const text of ["Vi leser om kommunikasjon.", "We read about understanding.", "Short text ends here."]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const res = {};
      for (const [name, url] of [["master", s.master], ["branch", s.branch]]) {
        const p = await ctx.newPage(); await p.goto(url, { waitUntil: "networkidle" }); await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle" });
        await p.locator("#text-input").fill(text); await p.locator("#load-text-button").click(); await p.locator("#apply-source-button").click(); await p.locator("#review-back-button").click();
        await p.locator("#play-button").click(); await p.waitForFunction(() => state.finished, null, { timeout: 30000 }); await L.settle(p); await L.settle(p);
        const m = await L.measure(p); res[name] = { size: await p.evaluate(() => state.wordSize), font: m.font, classes: m.classes, textWidth: m.textRect.width, inner: m.inner.width, inside: m.horizInside, shot: await p.locator(".reader-frame").screenshot() };
        await p.close();
      }
      const px = await (async () => { const p = await ctx.newPage(); const d = await L.pixelDiff(p, res.master.shot, res.branch.shot); await p.close(); return d; })();
      L.fs.writeFileSync(L.path.join(out, `natural-finish-${w}-${text.split(" ").pop().replace(/\W/g, "")}-branch.png`), res.branch.shot);
      L.fs.writeFileSync(L.path.join(out, `natural-finish-${w}-${text.split(" ").pop().replace(/\W/g, "")}-master.png`), res.master.shot);
      delete res.master.shot; delete res.branch.shot; rows.push({ viewport: w + "x" + h, text, ...res, px }); await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "natural-finish.json"), JSON.stringify(rows, null, 1));
  for (const r of rows) console.log(r.viewport, JSON.stringify(r.text).padEnd(32), "size", r.master.size, "| master", r.master.font, r.master.classes, "inside", r.master.inside, "| branch", r.branch.font, r.branch.classes, "inside", r.branch.inside, "w", r.branch.textWidth, "/", r.branch.inner, "| px diff", r.px.differingPixels);
})().catch((e) => { console.error(e); process.exit(1); });
