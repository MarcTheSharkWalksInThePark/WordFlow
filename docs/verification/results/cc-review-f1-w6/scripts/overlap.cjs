"use strict";
// Priority finding: do wrapped, non-scrolling tokens overlap the context words?
const L = require("./lib.cjs");
const out = L.path.join(L.SP, "ev", "overlap"); L.fs.mkdirSync(out, { recursive: true });
const VIEWPORTS = [{ width: 1400, height: 950 }, { width: 390, height: 844 }];
const CONFIGS = [
  { name: "base", focusLetter: true, focusMode: false },
  { name: "letterOff", focusLetter: false, focusMode: false },
  { name: "focusMode", focusLetter: true, focusMode: true },
  { name: "focusMode-letterOff", focusLetter: false, focusMode: true }
];
const LENGTHS = [135, 500, 1000, 2000];
const anyInk = (m) => ["previous", "next"].some((k) => m.context[k] && m.context[k].overlapInk);
const anyBox = (m) => ["previous", "next"].some((k) => m.context[k] && m.context[k].overlapBox);

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const result = { chrome: browser.version(), cases: [], thresholds: [], master: [] };
  try {
    for (const viewport of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage(), master = await ctx.newPage();
      const errors = []; page.on("pageerror", (e) => errors.push(e.message)); master.on("pageerror", (e) => errors.push(e.message));
      await page.goto(s.branch, { waitUntil: "networkidle" }); await master.goto(s.master, { waitUntil: "networkidle" });
      for (const cfg of CONFIGS) {
        await page.bringToFront();
        const at = async (kind, n) => { await L.prepare(page, L.token(kind, n), cfg); return L.measure(page); };
        // Gap between context strips in the normal (non-scroll) layout, from a short word.
        await L.prepare(page, "Hello", cfg); const ref = await L.measure(page);
        const gap = { frameClientH: ref.frame.clientH, frameTop: ref.frame.top, prevTextBottom: ref.context.previous.text_rect.bottom, nextTextTop: ref.context.next.text_rect.top,
          prevBoxBottom: ref.context.previous.box.bottom, nextBoxTop: ref.context.next.box.top };
        gap.inkGap = +(gap.nextTextTop - gap.prevTextBottom).toFixed(2); gap.boxGap = +(gap.nextBoxTop - gap.prevBoxBottom).toFixed(2);
        gap.fit58 = +(ref.frame.clientH * 0.58).toFixed(2);
        gap.railsGap = ref.rails.length === 2 ? +(ref.rails[1].rect.top - ref.rails[0].rect.bottom).toFixed(2) : null;
        for (const kind of ["W", "real"]) {
          for (const n of LENGTHS) {
            const m = await at(kind, n);
            const row = { viewport: viewport.width + "x" + viewport.height, config: cfg.name, kind, n, ...m, inkOverlap: anyInk(m), boxOverlap: anyBox(m) };
            if (row.inkOverlap || row.boxOverlap || n === 2000 || n === 500) {
              const file = `ov-${viewport.width}-${cfg.name}-${kind}${n}.png`;
              await page.locator(".reader-frame").screenshot({ path: L.path.join(out, file) }); row.screenshot = file;
            }
            result.cases.push(row);
          }
          // Scroll trigger: smallest length that scrolls (binary search on the branch).
          let lo = 135, hi = 40000;
          while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((await at(kind, mid)).scrolling) hi = mid; else lo = mid; }
          const below = await at(kind, lo); const belowShot = `thr-${viewport.width}-${cfg.name}-${kind}${lo}-below.png`;
          await page.locator(".reader-frame").screenshot({ path: L.path.join(out, belowShot) });
          const above = await at(kind, hi); const aboveShot = `thr-${viewport.width}-${cfg.name}-${kind}${hi}-above.png`;
          await page.locator(".reader-frame").screenshot({ path: L.path.join(out, aboveShot) });
          // First length whose visible ink touches a context word.
          let a = 1, b = lo; let firstOverlap = null;
          if (anyInk(below)) { while (b - a > 1) { const mid = (a + b) >> 1; if (anyInk(await at(kind, mid))) b = mid; else a = mid; } firstOverlap = b; }
          const first = firstOverlap ? await at(kind, firstOverlap) : null;
          const lastClear = firstOverlap ? await at(kind, firstOverlap - 1) : null;
          result.thresholds.push({ viewport: viewport.width + "x" + viewport.height, config: cfg.name, kind, gap,
            scrollTrigger: { lastNonScrolling: lo, firstScrolling: hi, below: { ...below, inkOverlap: anyInk(below), shot: belowShot }, above: { ...above, inkOverlap: anyInk(above), noteOverlap: above.note && above.note.overlapWord, shot: aboveShot } },
            firstInkOverlap: firstOverlap, firstOverlapWordH: first && first.word.h, lastClearWordH: lastClear && lastClear.word.h });
        }
      }
      // Master reference: base config only, same tokens.
      await master.bringToFront();
      for (const kind of ["W", "real"]) for (const n of LENGTHS) {
        await L.prepare(master, L.token(kind, n), CONFIGS[0]); const m = await L.measure(master);
        result.master.push({ viewport: viewport.width, kind, n, word: m.word, content: m.content, inkOverlap: anyInk(m), boxOverlap: anyBox(m), font: m.font });
      }
      result.errors = (result.errors || []).concat(errors);
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "overlap.json"), JSON.stringify(result, null, 1));
  // Compact summary.
  for (const c of result.cases) {
    const p = c.context.previous, n = c.context.next;
    console.log([c.viewport, c.config, c.kind + c.n, "font " + c.font, c.wrapped ? "wrap" : "-", c.scrolling ? "SCROLL" : "-", "word y" + c.word.top + "-" + c.word.bottom + " h" + c.word.h,
      "frame " + c.frame.top + "-" + c.frame.bottom, "prev " + (p ? p.text_rect.top + "-" + p.text_rect.bottom + (p.overlapInk ? " INK" + JSON.stringify(p.overlapInk) : "") : "none"),
      "next " + (n ? n.text_rect.top + "-" + n.text_rect.bottom + (n.overlapInk ? " INK" + JSON.stringify(n.overlapInk) : "") : "none"),
      "rails " + c.rails.filter((r) => r.overlapInk).length].join(" | "));
  }
  for (const t of result.thresholds) console.log("THR", t.viewport, t.config, t.kind, JSON.stringify(t.gap), "lastNon", t.scrollTrigger.lastNonScrolling, "h", t.scrollTrigger.below.word.h, "ink", t.scrollTrigger.below.inkOverlap, "| first", t.scrollTrigger.firstScrolling, "ink", t.scrollTrigger.above.inkOverlap, "note", JSON.stringify(t.scrollTrigger.above.noteOverlap), "| firstInkOverlap", t.firstInkOverlap, "h", t.firstOverlapWordH, "lastClear h", t.lastClearWordH);
  for (const m of result.master) console.log("MASTER", m.viewport, m.kind + m.n, m.font, "h" + m.word.h, "ink", m.inkOverlap);
  console.log("errors", JSON.stringify(result.errors));
})().catch((e) => { console.error(e); process.exit(1); });
