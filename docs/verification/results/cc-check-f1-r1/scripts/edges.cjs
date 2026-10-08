"use strict";
// Edge cases: (1) finishing while the scroll area has focus; (2) resizing while finished, vs master.
const L = require("./lib.cjs");
const snap = (p) => p.evaluate(() => { const d = els.wordDisplay, r = d.getBoundingClientRect(); return { font: getComputedStyle(d).fontSize, classes: d.className, style: d.getAttribute("style"), rect: [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 1000) / 1000), inert: d.inert, tabindex: d.getAttribute("tabindex"), role: d.getAttribute("role"), active: document.activeElement.id || document.activeElement.tagName, note: els.longTextNote ? els.longTextNote.hidden : true, finished: state.finished, status: els.status.textContent }; });
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const out = [];
  try {
    // (1) Focus the reading scroll area on the final word, then press Play with the keyboard-free path (click via JS keeps focus).
    for (const [w, h] of [[390, 844], [1400, 950]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage(); await p.goto(s.branch, { waitUntil: "networkidle" });
      await L.prepare(p, "", { text: "Lead " + "W".repeat(10000), index: 1, size: "comfortable" });
      await p.locator("#word-display").focus(); const before = await snap(p);
      await p.evaluate(() => els.playButton.click()); await L.settle(p); await L.settle(p);
      const after = await snap(p);
      await p.keyboard.press("PageDown"); const afterKey = await snap(p);
      out.push({ case: "finish with area focused " + w, before, after, afterKey, ok: before.active === "word-display" && after.finished && after.inert && after.active !== "word-display" && after.tabindex === null && after.note });
      await c.close();
    }
    // (2) Resize while finished: branch vs master, same sequence.
    for (const [tok, size] of [["understanding.", "comfortable"], ["Kommunikasjonsmiddel.", "large"], ["W".repeat(2000), "comfortable"], [L.REAL45, "large"]]) {
      const res = {};
      for (const [side, url] of [["master", s.master], ["branch", s.branch]]) {
        const c = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await c.newPage(); await p.goto(url, { waitUntil: "networkidle" });
        await L.prepare(p, "", { text: "Lead " + tok, index: 1, size }); await p.evaluate(() => completeReading()); await L.settle(p); await L.settle(p);
        const seq = [await snap(p)];
        for (const [vw, vh] of [[1400, 950], [1920, 1080], [390, 844]]) { await p.setViewportSize({ width: vw, height: vh }); await L.settle(p); await L.settle(p); await L.settle(p); seq.push(await snap(p)); }
        res[side] = seq; await c.close();
      }
      const m = await (async () => res)();
      const cmp = m.master.map((a, i) => { const b = m.branch[i]; return { font: [a.font, b.font], classes: [a.classes, b.classes], rectEqual: JSON.stringify(a.rect) === JSON.stringify(b.rect), styleEqual: a.style === b.style }; });
      out.push({ case: "resize while finished " + (tok.length > 45 ? "Wx" + tok.length : tok) + " " + size, steps: ["390", "1400", "1920", "390"], cmp, branchInert: m.branch.map((x) => x.inert), branchNoteHidden: m.branch.map((x) => x.note) });
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(L.OUT, "edges.json"), JSON.stringify(out, null, 1));
  for (const o of out) console.log(JSON.stringify(o).slice(0, 900));
})().catch((e) => { console.error(e); process.exit(1); });
