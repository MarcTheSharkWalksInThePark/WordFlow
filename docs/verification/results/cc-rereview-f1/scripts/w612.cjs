"use strict";
// W6.12 independent check with REAL words (Norwegian and English), large size, context on/off,
// focus letter on/off. Master and branch pages side by side in one browser context.
// - Fully visible on master  -> branch must equal master: font, style, rectangle, classes, text, outerHTML; frame PNG.
// - Clipped on master         -> branch text must be inside the inner frame (both axes); size checks.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "w612"); L.fs.mkdirSync(out, { recursive: true });
const LAYOUTS = [[1708, 950, false], [1920, 1080, false], [996, 950, true], [1400, 950, true], [390, 844, false], [1400, 950, false]];
const CONFIGS = [{ context: true, letter: true }, { context: false, letter: true }, { context: true, letter: false }, { context: false, letter: false }];
const WORDS = [
  // English, 10-16 letters, plus two longer ones
  "Background", "Throughput", "Whatsoever", "Workmanship", "Extraordinary", "Understanding", "Neighbourhood", "Wholeheartedly",
  "Responsibility", "Infrastructure", "Accomplishment", "Characteristics", "Recommendations", "Misunderstanding",
  "Telecommunications", "Internationalization",
  // Norwegian, 10-16 letters, plus longer compounds
  "Bærekraftig", "Arbeidsplass", "Sannsynligvis", "Fylkeskommune", "Mikrobølgeovn", "Utviklingsland", "Barnehagelærer",
  "Skolebibliotek", "Sykehusavdeling", "Kommunestyremøte", "Arbeidsmiljøloven", "Forsikringsselskap", "Personvernerklæring",
  "Høyesterettsadvokat", "Kommunikasjonsmiddel", "Menneskerettighetene",
  // 45-character word, short controls
  L.REAL45, "Hello", "Kommune"
];
const textWidthAt = (page, px) => page.evaluate((px) => {
  const d = els.wordDisplay, f = d.closest(".reader-frame"), c = d.cloneNode(true);
  c.removeAttribute("id"); c.classList.remove("wrapped-long-word", "scrolling-long-word"); c.style.fontSize = px + "px";
  c.style.position = "absolute"; c.style.visibility = "hidden"; c.style.left = "0"; c.style.top = "0"; f.appendChild(c);
  const r = document.createRange(); r.selectNodeContents(c); const w = r.getBoundingClientRect().width; c.remove(); return w;
}, px);

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = []; const fails = [];
  try {
    for (const [w, h, focusMode] of LAYOUTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const b = await ctx.newPage(), m = await ctx.newPage(); const errors = [];
      for (const p of [b, m]) p.on("pageerror", (e) => errors.push(e.message));
      await b.goto(s.branch, { waitUntil: "networkidle" }); await m.goto(s.master, { waitUntil: "networkidle" });
      for (const cfg of CONFIGS) for (const word of WORDS) {
        const c = { ...cfg, focusMode };
        await m.bringToFront(); await L.prepare(m, word, c); const mm = await L.measure(m);
        await b.bringToFront(); await L.prepare(b, word, c); const bm = await L.measure(b);
        const row = { layout: `${w}x${h}${focusMode ? " focus" : ""}`, ...cfg, word, len: [...word].length, masterVisible: mm.fullyInside,
          master: { font: mm.font, text: mm.textRect, word: mm.word, classes: mm.classes, inner: mm.inner }, branch: { font: bm.font, text: bm.textRect, word: bm.word, classes: bm.classes, wrapped: bm.wrapped, scrolling: bm.scrolling, fullyInside: bm.fullyInside, ctx: bm.context } };
        const bad = (msg) => { fails.push(row.layout + " " + JSON.stringify(cfg) + " " + word + ": " + msg); row.fail = (row.fail || []).concat(msg); };
        if (bm.text !== word || mm.text !== word) bad("text differs from token");
        if (mm.fullyInside) {
          const keys = ["font", "styleAttr", "classes", "text", "outerHTML", "word", "textRect", "frameClasses"];
          // Normalise the history-dependent empty style attribute (style="" vs none): no rendering effect (see stylecheck.cjs).
          const norm = (x, k) => k === "styleAttr" ? (x[k] || null) : k === "outerHTML" ? x[k].replace(' style=""', "") : x[k];
          const diff = keys.filter((k) => JSON.stringify(norm(mm, k)) !== JSON.stringify(norm(bm, k)));
          row.rawStyleDiff = (mm.styleAttr ?? "<none>") !== (bm.styleAttr ?? "<none>");
          for (const k of ["previous", "next"]) if (JSON.stringify(mm.context[k]) !== JSON.stringify(bm.context[k])) diff.push("context." + k);
          row.domDiff = diff; if (diff.length) bad("DOM differs from master: " + diff.join(","));
          const clip = { x: Math.floor(mm.inner.left) - 1, y: Math.floor(mm.inner.top) - 1, width: Math.ceil(mm.inner.width) + 2, height: Math.ceil(mm.inner.height) + 2 };
          const shot = async (p) => { await p.bringToFront(); await L.settle(p); return p.screenshot({ clip }); };
          let a = await shot(m), z = await shot(b); row.png = await L.pixelDiff(b, a, z);
          if (!row.png.sameSize || row.png.differingPixels) {
            // Retry on fresh documents (an earlier review saw history-dependent background raster differences).
            row.pngFirst = row.png;
            for (const p of [m, b]) { await p.reload({ waitUntil: "networkidle" }); await p.bringToFront(); await L.prepare(p, word, c); }
            a = await shot(m); z = await shot(b); row.png = await L.pixelDiff(b, a, z);
            if (!row.png.sameSize || row.png.differingPixels) { bad("pixels differ: " + JSON.stringify(row.png)); L.fs.writeFileSync(L.path.join(out, `px-${w}-${word}-m.png`), a); L.fs.writeFileSync(L.path.join(out, `px-${w}-${word}-b.png`), z); }
          }
        } else {
          if (!bm.fullyInside) bad("clipped on master and still not fully inside frame");
          for (const k of ["previous", "next"]) if (bm.context[k] && bm.context[k].overlap) bad("collides with context " + k);
          const font = parseFloat(bm.font), target = bm.inner.width * 0.9;
          if (font < 10) bad("font below floor");
          if (!bm.wrapped) {
            if (bm.textRect.width > target + 0.01) bad("unwrapped width above 90% target");
            row.widthAtPlus1 = await textWidthAt(b, font + 1); row.maximal = row.widthAtPlus1 > target;
          } else {
            row.widthAtFloor = await textWidthAt(b, 10);
            if (font !== 10 || !(row.widthAtFloor > bm.inner.width)) bad("wrapped although not required by W6.1");
          }
        }
        rows.push(row);
      }
      if (errors.length) fails.push(`${w}x${h} page errors: ${errors.join(" | ")}`);
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "w612.json"), JSON.stringify({ rows, fails }, null, 1));
  const lines = [];
  for (const r of rows) if (r.context && r.letter) lines.push([r.layout, r.word.padEnd(46), r.len, r.masterVisible ? "VISIBLE" : "CLIPPED", r.master.font, r.master.text.width, "->", r.branch.font, r.branch.text.width, r.branch.wrapped ? "wrap" : "", r.branch.scrolling ? "scroll" : "",
    r.masterVisible ? ("dom " + (r.domDiff.length ? r.domDiff.join(",") : "=") + " px " + r.png.differingPixels + (r.pngFirst ? " (first " + r.pngFirst.differingPixels + ")" : "")) : ("inside " + r.branch.fullyInside + (r.maximal !== undefined ? " maximal " + r.maximal : "")), "inner", r.master.inner.width].join(" "));
  const vis = rows.filter((r) => r.masterVisible), clip = rows.filter((r) => !r.masterVisible);
  lines.push(`RAW style-attribute-only differences (normalised): ${rows.filter((r) => r.rawStyleDiff).length}`);
  lines.push(`TOTAL ${rows.length} pairs: master-visible ${vis.length} (DOM-identical ${vis.filter((r) => !r.domDiff.length).length}, PNG-identical ${vis.filter((r) => r.png.sameSize && !r.png.differingPixels).length}, retried ${vis.filter((r) => r.pngFirst).length}); master-clipped ${clip.length} (inside ${clip.filter((r) => r.branch.fullyInside).length}, wrapped ${clip.filter((r) => r.branch.wrapped).length}, non-maximal fits ${clip.filter((r) => r.maximal === false).length})`);
  lines.push("FAILS " + fails.length); for (const f of fails) lines.push("  " + f);
  L.fs.writeFileSync(L.path.join(out, "w612.txt"), lines.join("\n") + "\n"); console.log(lines.slice(-3 - fails.length).join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
