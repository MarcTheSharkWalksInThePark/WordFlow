"use strict";
// Harness item (b): where does the empty style="" attribute after restart come from?
// Runs the same sequences on master and on the branch, each on a fresh page, and records the
// word display's style attribute after Finished -> Restart. No normalisation.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "stylehist"); L.fs.mkdirSync(out, { recursive: true });
const seqs = [
  { name: "short final only", vp: [390, 844], steps: [["Lead Tail", "comfortable"]] },
  { name: "master-fitted earlier word, then short final", vp: [390, 844], steps: [["Lead Kommunikasjonsmiddel Tail End.", "large", 1], ["Lead Tail", "comfortable"]] },
  { name: "final word master fits (understanding.)", vp: [390, 844], steps: [["Lead understanding.", "comfortable"]] },
  { name: "final 45-char word, 1708 comfortable (Codex case)", vp: [1708, 950], steps: [["Lead " + L.REAL45, "comfortable"]] },
  { name: "final Kommunikasjonsmiddel, 1708 large", vp: [1708, 950], steps: [["Lead Kommunikasjonsmiddel", "large"]] },
  { name: "final Understanding, 1708 large (visible on master, wider than 820)", vp: [1708, 950], steps: [["Lead Understanding", "large"]] }
];
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  try {
    for (const q of seqs) {
      const row = { name: q.name, viewport: q.vp.join("x") };
      for (const [side, url] of [["master", s.master], ["branch", s.branch]]) {
        const ctx = await browser.newContext({ viewport: { width: q.vp[0], height: q.vp[1] } }); const p = await ctx.newPage();
        await p.goto(url, { waitUntil: "networkidle" });
        const trail = [];
        for (const [text, size, index] of q.steps) {
          await L.prepare(p, "", { text, size, index: index ?? 1 });
          trail.push({ text: text.slice(0, 30), style: await p.evaluate(() => els.wordDisplay.getAttribute("style")), font: await p.evaluate(() => getComputedStyle(els.wordDisplay).fontSize) });
        }
        await p.evaluate(() => completeReading()); await L.settle(p); await L.settle(p);
        const fin = await p.evaluate(() => ({ style: els.wordDisplay.getAttribute("style"), font: getComputedStyle(els.wordDisplay).fontSize, classes: els.wordDisplay.className }));
        await p.evaluate(() => els.finishRestartButton.click()); await L.settle(p); await L.settle(p);
        const after = await p.evaluate(() => { const d = els.wordDisplay, r = d.getBoundingClientRect(); return { style: d.getAttribute("style"), outerHTML: d.outerHTML, font: getComputedStyle(d).fontSize, rect: [r.left, r.top, r.width, r.height], classes: d.className }; });
        row[side] = { trail, finished: fin, afterRestart: after };
        await ctx.close();
      }
      const strip = (h) => h.replace(' style=""', "");
      row.outerHTMLEqual = row.master.afterRestart.outerHTML === row.branch.afterRestart.outerHTML;
      row.equalIgnoringEmptyStyle = strip(row.master.afterRestart.outerHTML) === strip(row.branch.afterRestart.outerHTML);
      row.fontRectEqual = JSON.stringify([row.master.afterRestart.font, row.master.afterRestart.rect]) === JSON.stringify([row.branch.afterRestart.font, row.branch.afterRestart.rect]);
      rows.push(row);
      console.log(`${q.name} @${row.viewport}: master final style=${JSON.stringify(row.master.finished.style)} restart style=${JSON.stringify(row.master.afterRestart.style)} | branch final style=${JSON.stringify(row.branch.finished.style)} restart style=${JSON.stringify(row.branch.afterRestart.style)} | outerHTML equal=${row.outerHTMLEqual} ignoringEmptyStyle=${row.equalIgnoringEmptyStyle} font+rect equal=${row.fontRectEqual}`);
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "stylehist.json"), JSON.stringify(rows, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
