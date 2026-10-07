"use strict";
// W6.7: find each layout's first scrolling token length by binary search, then check the token
// just below (wrapped, not scrolling) and just above (scrolling) for collisions with the context
// words and the note. Threshold computed independently from a "Hello" render's context rectangles.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "thr"); L.fs.mkdirSync(out, { recursive: true });
const LAYOUTS = [[390, 844, false], [390, 600, false], [844, 390, false], [1400, 950, false], [1708, 950, false], [1920, 1080, false], [996, 950, true], [1400, 950, true], [390, 844, true]];
const CONFIGS = [{ context: true, letter: true }, { context: false, letter: true }, { context: true, letter: false }, { context: false, letter: false }];
const tok = (kind, n) => kind === "W" ? "W".repeat(n) : L.REAL45.repeat(Math.ceil(n / 45)).slice(0, n);
const natural = (page) => page.evaluate(() => {
  const d = els.wordDisplay, f = d.closest(".reader-frame"), c = d.cloneNode(true);
  c.removeAttribute("id"); c.classList.remove("scrolling-long-word"); c.style.visibility = "hidden"; f.appendChild(c);
  const h = Math.max(c.scrollHeight, c.getBoundingClientRect().height); c.remove(); return h;
});
const gapOf = (page) => page.evaluate(() => {
  const f = els.wordDisplay.closest(".reader-frame"), fr = f.getBoundingClientRect(), center = fr.top + f.clientTop + f.clientHeight / 2;
  const b = [els.previousContext, els.nextContext].map((el) => { const r = el.getBoundingClientRect(), g = document.createRange(); g.selectNodeContents(el); const i = g.getBoundingClientRect(); return { top: Math.min(r.top, i.top), bottom: Math.max(r.bottom, i.bottom) }; });
  return { uncentred: b[1].top - b[0].bottom, centred: 2 * Math.min(center - b[0].bottom, b[1].top - center), frameH: f.clientHeight };
});

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = []; const fails = [];
  try {
    for (const [w, h, focusMode] of LAYOUTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(s.branch, { waitUntil: "networkidle" });
      for (const cfg of CONFIGS) for (const kind of (cfg.context && cfg.letter) ? ["W", "real"] : ["W"]) {
        const c = { ...cfg, focusMode };
        await L.prepare(page, "Hello", { ...c, context: true }); const gap = await gapOf(page);
        const at = async (n) => { await L.prepare(page, tok(kind, n), c); return L.measure(page); };
        let lo = 50, hi = 40000;
        while (hi - lo > 1) { const mid = (lo + hi) >> 1; if ((await at(mid)).scrolling) hi = mid; else lo = mid; }
        const below = await at(lo), belowNat = await natural(page), above = await at(hi), aboveNat = await natural(page);
        // Sweep the wrapped, non-scrolling range for collisions too.
        let firstWrap = 1; { let a = 1, z = lo; while (z - a > 1) { const mid = (a + z) >> 1; if ((await at(mid)).wrapped) z = mid; else a = mid; } firstWrap = z; }
        const sweep = [];
        for (let i = 0; i <= 8; i++) { const n = Math.round(firstWrap + (lo - firstWrap) * i / 8); const m = await at(n); sweep.push({ n, h: m.textRect.height, wrapped: m.wrapped, scrolling: m.scrolling, prev: m.context.previous?.overlap ?? null, next: m.context.next?.overlap ?? null, inside: m.fullyInside }); }
        const row = { layout: `${w}x${h}${focusMode ? " focus" : ""}`, ...cfg, kind, gap, firstWrap, lastNonScroll: lo, firstScroll: hi, belowNat, aboveNat,
          below: { wrapped: below.wrapped, scrolling: below.scrolling, text: below.textRect, prev: below.context.previous, next: below.context.next, note: below.note, inside: below.fullyInside },
          above: { scrolling: above.scrolling, word: above.word, area: above.area, prev: above.context.previous, next: above.context.next, note: above.note, inner: above.inner }, sweep };
        const bad = (msg) => { fails.push(`${row.layout} ${JSON.stringify(cfg)} ${kind}: ${msg}`); row.fail = (row.fail || []).concat(msg); };
        if (!below.wrapped || below.scrolling) bad("below threshold should be wrapped, not scrolling");
        if (!above.scrolling) bad("above should scroll");
        if (belowNat > gap.uncentred + 0.5) bad(`below natural ${belowNat} > free gap ${gap.uncentred}`);
        if (aboveNat <= gap.centred - 0.5) bad(`scrolls although natural ${aboveNat} <= centred gap ${gap.centred}`);
        for (const [n, m] of [["below", below], ["above", above]]) {
          for (const k of ["previous", "next"]) if (m.context[k]?.overlap) bad(`${n}: word overlaps context ${k} ${JSON.stringify(m.context[k].overlap)}`);
          if (m.note && (m.note.overlap || m.note.ctxOverlap.length)) bad(`${n}: note overlaps ${JSON.stringify(m.note)}`);
          if (m.note && m.note.rect.bottom > m.inner.bottom + 0.01) bad(`${n}: note outside frame`);
        }
        if (below.note) bad("note shown below threshold");
        if (!above.note) bad("no note above threshold");
        for (const p of sweep) if (p.prev || p.next || !p.inside) bad(`sweep n=${p.n} collision/outside ${JSON.stringify(p)}`);
        rows.push(row);
        if (cfg.context && cfg.letter && kind === "W") {
          await at(lo); await page.locator(".reader-frame").screenshot({ path: L.path.join(out, `thr-${w}x${h}${focusMode ? "-focus" : ""}-W${lo}-below.png`) });
          await at(hi); await page.locator(".reader-frame").screenshot({ path: L.path.join(out, `thr-${w}x${h}${focusMode ? "-focus" : ""}-W${hi}-above.png`) });
        }
      }
      if (errors.length) fails.push(`${w}x${h}: page errors ${errors.join(" | ")}`);
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "thr.json"), JSON.stringify({ rows, fails }, null, 1));
  const lines = rows.map((r) => [r.layout.padEnd(15), `ctx=${+r.context} letter=${+r.letter}`, r.kind.padEnd(4), "frameH", r.gap.frameH, "gap", r.gap.uncentred.toFixed(2), "centred", r.gap.centred.toFixed(2),
    "| last non-scroll", r.lastNonScroll, "nat", r.belowNat, "| first scroll", r.firstScroll, "nat", r.aboveNat, "| area", r.above.area.clientH, "| note", r.above.note ? `${r.above.note.rect.top}-${r.above.note.rect.bottom} inVP=${r.above.note.inViewport}` : "-", r.fail ? "FAIL" : "ok"].join(" "));
  // Same first-scroll length with context on and off?
  for (const lay of [...new Set(rows.map((r) => r.layout))]) for (const letter of [true, false]) {
    const on = rows.find((r) => r.layout === lay && r.context && r.letter === letter && r.kind === "W"), off = rows.find((r) => r.layout === lay && !r.context && r.letter === letter && r.kind === "W");
    lines.push(`SAME-THRESHOLD ${lay} letter=${+letter}: on ${on.firstScroll} off ${off.firstScroll} ${on.firstScroll === off.firstScroll ? "equal" : "DIFFERENT"}`);
  }
  lines.push("FAILS " + fails.length); for (const f of fails) lines.push("  " + f);
  L.fs.writeFileSync(L.path.join(out, "thr.txt"), lines.join("\n") + "\n"); console.log(lines.join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
