"use strict";
// Usable scroll area, note visibility and reachability by keyboard, wheel and CDP touch.
const L = require("./lib.cjs");
const out = L.path.join(L.SP, "ev", "scroll"); L.fs.mkdirSync(out, { recursive: true });
const geo = (page) => page.evaluate(() => {
  const R = (el) => { const b = el.getBoundingClientRect(); return { top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2), left: +b.left.toFixed(2), right: +b.right.toFixed(2), h: +b.height.toFixed(2), w: +b.width.toFixed(2) }; };
  const inter = (a, b) => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
  const d = els.wordDisplay, f = d.closest(".reader-frame"), n = els.longTextNote;
  const region = R(d), frame = R(f), note = n.hidden ? null : R(n);
  const others = { previous: els.previousContext, next: els.nextContext }; const ov = {};
  for (const [k, el] of Object.entries(others)) if (!el.hidden && el.textContent) { const r = R(el); ov[k] = { rect: r, overlapsRegion: inter(r, region), overlapsNote: note ? inter(r, note) : null }; }
  const rails = [...document.querySelectorAll(".focus-rail")].filter((e) => getComputedStyle(e).display !== "none").length;
  const lh = parseFloat(getComputedStyle(d).lineHeight) || 10.5;
  return { viewport: { w: innerWidth, h: innerHeight, scrollY }, scrolling: d.classList.contains("scrolling-long-word"), font: getComputedStyle(d).fontSize, lineHeight: lh,
    frame, region, regionClientH: d.clientHeight, regionScrollH: d.scrollHeight, visibleLines: +(d.clientHeight / lh).toFixed(2),
    note, noteInsideFrame: note ? note.top >= frame.top && note.bottom <= frame.bottom && note.left >= frame.left && note.right <= frame.right : null,
    noteTruncated: note ? n.scrollWidth > n.clientWidth || n.scrollHeight > n.clientHeight : null, noteLines: note ? Math.round(note.h / (12 * 1.25)) : null,
    noteOverlapsRegion: note ? inter(note, region) : null, context: ov, railsVisible: rails,
    frameInViewport: frame.top >= 0 && frame.bottom <= innerHeight, regionInViewport: region.top >= 0 && region.bottom <= innerHeight, noteInViewport: note ? note.top >= 0 && note.bottom <= innerHeight : null };
});
const glyphs = (page) => page.evaluate(() => {
  const el = els.wordDisplay, box = el.getBoundingClientRect();
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node, first, last; while ((node = w.nextNode())) { if (!first && node.length) first = node; if (node.length) last = node; }
  const rr = (n, a) => { const r = document.createRange(); r.setStart(n, a); r.setEnd(n, a + 1); return r.getBoundingClientRect(); };
  const g1 = rr(first, 0), g2 = rr(last, last.length - 1);
  return { scrollTop: el.scrollTop, max: el.scrollHeight - el.clientHeight, firstVisible: g1.top >= box.top && g1.bottom <= box.bottom, lastVisible: g2.top >= box.top && g2.bottom <= box.bottom, winY: scrollY };
});
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 600 }, { width: 844, height: 390 }]) {
      const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(s.branch, { waitUntil: "networkidle" });
      for (const [kind, n] of [["W", 2000], ["W", 10000], ["real", 2000]]) {
        const row = { viewport: viewport.width + "x" + viewport.height, token: kind + n };
        await L.prepare(page, L.token(kind, n)); row.geo = await geo(page);
        if (!row.geo.scrolling) { rows.push(row); continue; }
        await page.locator(".reader-frame").screenshot({ path: L.path.join(out, `area-${viewport.width}x${viewport.height}-${kind}${n}.png`) });
        await page.screenshot({ path: L.path.join(out, `page-${viewport.width}x${viewport.height}-${kind}${n}.png`) });
        row.top = await glyphs(page);
        // Keyboard End.
        await page.locator("#word-display").focus(); await page.keyboard.press("End"); await page.waitForTimeout(400); row.end = await glyphs(page);
        // Keyboard PageDown from top.
        await page.evaluate(() => { els.wordDisplay.scrollTop = 0; }); let presses = 0; let g = await glyphs(page);
        while (g.scrollTop < g.max && presses < 600) { await page.keyboard.press("PageDown"); presses++; await page.waitForTimeout(30); g = await glyphs(page); }
        await page.waitForTimeout(300); g = await glyphs(page); row.pageDown = { presses, ...g };
        // Wheel from top.
        await page.evaluate(() => { els.wordDisplay.scrollTop = 0; els.wordDisplay.scrollIntoView({ block: "center" }); });
        await L.settle(page); let box = await page.locator("#word-display").boundingBox(); let wheels = 0; g = await glyphs(page); const winBefore = g.winY;
        while (g.scrollTop < g.max && wheels < 600) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.wheel(0, 400); wheels++; await page.waitForTimeout(40); g = await glyphs(page); }
        await page.waitForTimeout(300); g = await glyphs(page); row.wheel = { wheels, ...g, pageScrolledBy: g.winY - winBefore };
        // CDP touch swipes from top.
        await page.evaluate(() => { els.wordDisplay.scrollTop = 0; els.wordDisplay.scrollIntoView({ block: "center" }); }); await L.settle(page);
        box = await page.locator("#word-display").boundingBox(); const cdp = await ctx.newCDPSession(page); let swipes = 0;
        try {
          await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
          g = await glyphs(page); const winT = g.winY; const x = box.x + box.width / 2, y0 = box.y + box.height - 8, dist = Math.max(20, Math.min(box.height - 16, 150));
          while (g.scrollTop < g.max && swipes < 800) {
            await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0, id: 1 }] });
            for (let o = 10; o <= dist; o += 10) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - o, id: 1 }] });
            await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); swipes++; await page.waitForTimeout(30); g = await glyphs(page);
          }
          await page.waitForTimeout(400); g = await glyphs(page); row.touch = { swipes, swipeDistance: dist, ...g, pageScrolledBy: g.winY - winT, regionBoxH: +box.height.toFixed(2) };
        } finally { await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false }); await cdp.detach(); }
        rows.push(row);
      }
      if (errors.length) rows.push({ viewport: viewport.width + "x" + viewport.height, errors });
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "scroll.json"), JSON.stringify(rows, null, 1));
  for (const r of rows) {
    if (r.errors) { console.log("ERRORS", r.viewport, r.errors); continue; }
    const g = r.geo; console.log(r.viewport, r.token, "scrolling", g.scrolling, "frame", g.frame.top + "-" + g.frame.bottom, "region", g.region.top + "-" + g.region.bottom, "clientH", g.regionClientH, "lines", g.visibleLines,
      "note", g.note && (g.note.top + "-" + g.note.bottom + " lines " + g.noteLines), "noteInFrame", g.noteInsideFrame, "trunc", g.noteTruncated, "noteOvRegion", g.noteOverlapsRegion,
      "ctx", JSON.stringify(Object.fromEntries(Object.entries(g.context).map(([k, v]) => [k, v.rect.top + "-" + v.rect.bottom + (v.overlapsRegion ? " OVR" : "") + (v.overlapsNote ? " OVN" : "")]))),
      "inVP frame/region/note", g.frameInViewport, g.regionInViewport, g.noteInViewport);
    if (r.end) console.log("   top", JSON.stringify(r.top), "\n   End", JSON.stringify(r.end), "\n   PageDown", JSON.stringify(r.pageDown), "\n   wheel", JSON.stringify(r.wheel), "\n   touch", JSON.stringify(r.touch));
  }
})().catch((e) => { console.error(e); process.exit(1); });
