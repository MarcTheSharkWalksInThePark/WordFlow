"use strict";
// Pixel-level W6.7 check at the last non-scrolling length: do the token's painted pixels touch the
// context words' painted pixels or the note? Four frame captures per case:
// all shown / word only / context only / neither (background). Ink = pixels differing from background.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "ink"); L.fs.mkdirSync(out, { recursive: true });
const thr = require(L.path.join(L.OUT, "thr", "thr.json")).rows;
const tok = (kind, n) => kind === "W" ? "W".repeat(n) : L.REAL45.repeat(Math.ceil(n / 45)).slice(0, n);

async function inkRows(page, clip) {
  const vis = async (word, ctx, note) => {
    await page.evaluate(([word, ctx, note]) => {
      els.wordDisplay.style.visibility = word ? "" : "hidden";
      for (const el of [els.previousContext, els.nextContext]) el.style.visibility = ctx ? "" : "hidden";
      if (els.longTextNote) els.longTextNote.style.visibility = note ? "" : "hidden";
    }, [word, ctx, note]);
    return (await page.screenshot({ clip })).toString("base64");
  };
  const shots = { bg: await vis(false, false, false), word: await vis(true, false, false), ctx: await vis(false, true, false), note: await vis(false, false, true) };
  await vis(true, true, true);
  // Clean up the inline visibility so the app's own styles are untouched afterwards.
  await page.evaluate(() => { for (const el of [els.wordDisplay, els.previousContext, els.nextContext, els.longTextNote]) if (el) el.style.visibility = ""; if (!els.wordDisplay.getAttribute("style")) els.wordDisplay.removeAttribute("style"); });
  return page.evaluate(async (shots) => {
    const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + s; });
    const px = async (s) => { const img = await load(s); const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data }; };
    const bg = await px(shots.bg), layers = {};
    for (const k of ["word", "ctx", "note"]) {
      const p = await px(shots[k]); const set = new Uint8Array(p.w * p.h); let top = Infinity, bottom = -1, n = 0;
      for (let i = 0; i < p.w * p.h; i++) { const j = i * 4; if (Math.abs(p.d[j] - bg.d[j]) + Math.abs(p.d[j + 1] - bg.d[j + 1]) + Math.abs(p.d[j + 2] - bg.d[j + 2]) > 6) { set[i] = 1; n++; const y = Math.floor(i / p.w); top = Math.min(top, y); bottom = Math.max(bottom, y); } }
      layers[k] = { set, top, bottom, n, w: p.w };
    }
    const both = (a, b) => { let n = 0; for (let i = 0; i < a.set.length; i++) if (a.set[i] && b.set[i]) n++; return n; };
    // Vertical clearance between the word's ink and context ink, per context word (above / below the frame centre).
    const W = layers.word, C = layers.ctx, w = W.w, H = W.set.length / w, mid = H / 2;
    const rowsWith = (L, from, to) => { const r = []; for (let y = from; y < to; y++) { for (let x = 0; x < w; x++) if (L.set[y * w + x]) { r.push(y); break; } } return r; };
    const ctxAbove = rowsWith(C, 0, Math.floor(mid)), ctxBelow = rowsWith(C, Math.floor(mid), H), wordRows = rowsWith(W, 0, H);
    const gapAbove = ctxAbove.length && wordRows.length ? wordRows[0] - ctxAbove[ctxAbove.length - 1] - 1 : null;
    const gapBelow = ctxBelow.length && wordRows.length ? ctxBelow[0] - wordRows[wordRows.length - 1] - 1 : null;
    return { wordPx: W.n, ctxPx: C.n, notePx: layers.note.n, wordCtxSharedPx: both(W, C), wordNoteSharedPx: both(W, layers.note), ctxNoteSharedPx: both(C, layers.note),
      wordInkRows: [W.top, W.bottom], ctxAboveRows: ctxAbove.length ? [ctxAbove[0], ctxAbove[ctxAbove.length - 1]] : null, ctxBelowRows: ctxBelow.length ? [ctxBelow[0], ctxBelow[ctxBelow.length - 1]] : null, clearAbovePx: gapAbove, clearBelowPx: gapBelow };
  }, shots);
}

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const res = []; const only = process.argv[2];
  try {
    // optional layout filter in argv[2], e.g. 844x390
    for (const r of thr.filter((r) => r.context && (!only || r.layout === only))) {
      const [w, h] = r.layout.split(" ")[0].split("x").map(Number), focusMode = r.layout.includes("focus");
      const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage();
      await page.goto(s.branch, { waitUntil: "networkidle" });
      for (const [phase, n] of [["below", r.lastNonScroll], ["above", r.firstScroll]]) {
        await L.prepare(page, tok(r.kind, n), { context: true, letter: r.letter, focusMode });
        // Bring the whole frame into the viewport (needed in landscape 844x390, where it extends below the fold).
        await page.evaluate(() => { const f = els.wordDisplay.closest(".reader-frame").getBoundingClientRect(); if (f.bottom > innerHeight) window.scrollBy(0, f.bottom - innerHeight + 2); });
        await L.settle(page);
        const m = await L.measure(page);
        const clip = { x: m.inner.left, y: m.inner.top, width: m.inner.width, height: m.inner.height };
        const ink = await inkRows(page, clip);
        res.push({ layout: r.layout, letter: r.letter, kind: r.kind, phase, n, scrolling: m.scrolling, wordBox: m.word, textRect: m.textRect,
          prevBox: m.context.previous?.box, nextBox: m.context.next?.box, boxOverlapPrev: m.word.top < m.context.previous?.box.bottom, boxOverlapNext: m.word.bottom > m.context.next?.box.top, ...ink });
        if (phase === "below" && r.letter && r.kind === "W") await page.screenshot({ clip, path: L.path.join(out, `ink-${w}x${h}${focusMode ? "-focus" : ""}-below.png`) });
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, only ? `ink-${only}.json` : "ink.json"), JSON.stringify(res, null, 1));
  const lines = res.map((x) => [x.layout.padEnd(15), "letter", +x.letter, x.kind.padEnd(4), x.phase.padEnd(5), "n", x.n, x.scrolling ? "scroll" : "wrap  ", "| shared word/ctx px", x.wordCtxSharedPx, "word/note", x.wordNoteSharedPx, "ctx/note", x.ctxNoteSharedPx,
    "| clear above", x.clearAbovePx, "below", x.clearBelowPx, "| element-box overlap prev", x.boxOverlapPrev, "next", x.boxOverlapNext].join(" "));
  L.fs.writeFileSync(L.path.join(out, only ? `ink-${only}.txt` : "ink.txt"), lines.join("\n") + "\n"); console.log(lines.join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
