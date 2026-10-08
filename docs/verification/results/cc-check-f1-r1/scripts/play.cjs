"use strict";
// W6.9 one-Play paths, final word and finish (vs master), W6.10 keys and focus, preservation (F-6).
const L = require("./lib.cjs"), assert = require("node:assert/strict");
const out = L.path.join(L.OUT, "play"); L.fs.mkdirSync(out, { recursive: true });
const snap = (page) => page.evaluate(() => ({ index: state.index, playing: state.playing, finished: state.finished, countdown: state.countdownActive ? state.countdownValue : null,
  marker: els.wordDisplay.dataset.longTextPaused ?? null, note: els.longTextNote ? !els.longTextNote.hidden : null, scrolling: els.wordDisplay.classList.contains("scrolling-long-word"),
  frameScroll: els.wordDisplay.closest(".reader-frame").classList.contains("scrolling-long-text"), tabindex: els.wordDisplay.getAttribute("tabindex"), inert: els.wordDisplay.inert, role: els.wordDisplay.getAttribute("role"),
  scrollTop: els.wordDisplay.scrollTop, shown: els.wordDisplay.textContent.slice(0, 10) + "(" + els.wordDisplay.textContent.length + ")",
  summary: !els.finishSummary.hidden, font: getComputedStyle(els.wordDisplay).fontSize, classes: els.wordDisplay.className,
  active: document.activeElement === document.body ? "body" : (document.activeElement.id || document.activeElement.className || document.activeElement.tagName) }));
async function timeline(page, ms) {
  const rows = []; let last = ""; const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await snap(page); const key = JSON.stringify(s); if (key !== last) { rows.push({ t: Date.now() - t0, ...s }); last = key; } await page.waitForTimeout(30); }
  return rows;
}
const W = (n) => "W".repeat(n);
const summarise = (tl) => tl.map((r) => `${r.t}ms i${r.index}${r.countdown ? " cd" + r.countdown : ""}${r.playing ? " playing" : ""}${r.finished ? " finished" : ""}${r.scrolling ? " scroll" : ""}${r.note ? " note" : ""}${r.marker !== null ? " m" + r.marker : ""} '${r.shown}'`).join(" | ");

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const R = { paths: {}, finish: {}, keys: {}, preserve: {}, landscape: {} }; const fails = [];
  const check = (name, cond, detail) => { if (!cond) fails.push(name + ": " + JSON.stringify(detail).slice(0, 400)); };
  try {
    for (const [vw, vh] of [[390, 844], [1920, 1080]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
      const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(s.branch, { waitUntil: "networkidle" });
      const tokL = W(10000), key = vw + "x" + vh;
      // ---- W6.9 paths: each must need exactly one Play, then the existing 3-2-1 countdown, then index 2.
      const paths = {
        autoPause: async () => { await L.prepare(page, tokL, { index: 0 }); await page.locator("#play-button").click(); await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1" && !state.playing, null, { timeout: 15000 }); },
        next: async () => { await L.prepare(page, tokL, { index: 0 }); await page.locator("#next-button").click(); },
        previous: async () => { await L.prepare(page, tokL, { index: 2 }); await page.locator("#prev-button").click(); },
        seek: async () => { await L.prepare(page, tokL, { index: 3 }); await page.locator("#progress-slider").evaluate((el) => { el.value = "1"; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }); },
        resume: async () => { await L.prepare(page, tokL, { index: 1 }); await page.reload({ waitUntil: "networkidle" }); await page.locator("#resume-button").click(); }
      };
      for (const [name, arrive] of Object.entries(paths)) {
        await arrive(); await L.settle(page); await L.settle(page);
        const at = await snap(page);
        await page.evaluate(() => { els.wordDisplay.scrollTop = 200; });
        await page.locator("#play-button").click(); const tl = await timeline(page, 3600); await page.evaluate(() => pause());
        const cds = [...new Set(tl.map((r) => r.countdown).filter(Boolean))];
        const ok = at.index === 1 && at.scrolling && at.note && !at.playing && at.active !== "word-display" && cds.join() === "3,2,1" && tl.some((r) => r.index === 2 && r.playing && !r.countdown) && !tl.some((r) => r.index === 1 && r.countdown === null && r.t > 50 && !r.playing && r.scrolling && tl.indexOf(r) > 0);
        R.paths[key + " " + name] = { at, timeline: summarise(tl) }; check(`${key} W6.9 ${name}`, ok, { at, tl: summarise(tl) });
      }
      // ---- Final scroll token: auto-pause, Play, Play (branch) vs a short final word (master and branch).
      const finalSeq = async (p, text) => {
        await L.prepare(p, "", { text, index: 0 }); await p.locator("#play-button").click();
        await p.waitForFunction(() => (!state.playing && !state.countdownActive && state.index === state.words.length - 1) || state.finished, null, { timeout: 15000 });
        await L.settle(p); const a = await snap(p);
        if (!a.finished) { await p.locator("#play-button").click(); await L.settle(p); await L.settle(p); }
        const b = await snap(p); await p.locator("#play-button").click(); const c = await timeline(p, 1200); await p.evaluate(() => pause());
        return { pausedOnLast: a, afterFinish: b, nextPlay: summarise(c), nextPlayFirst: c[0] };
      };
      R.finish[key + " branch long final"] = await finalSeq(page, "Lead " + tokL);
      R.finish[key + " branch short final"] = await finalSeq(page, "Lead Tail");
      const lf = R.finish[key + " branch long final"];
      check(`${key} F-3 final long word finishes with one Play and clears state`, lf.pausedOnLast.scrolling && lf.afterFinish.finished && lf.afterFinish.summary && !lf.afterFinish.note && lf.afterFinish.marker === null && lf.afterFinish.scrolling && lf.afterFinish.inert && lf.afterFinish.role === null && lf.afterFinish.tabindex === null /* W6.13/W6.14: scroll geometry kept, inert */, lf);
      check(`${key} F-3 next Play restarts at word 0 with countdown`, lf.nextPlayFirst.index === 0 && lf.nextPlayFirst.countdown === 3 && !lf.nextPlayFirst.finished, lf.nextPlay);
      // Manual arrival on a final scroll token, then Play.
      await L.prepare(page, "", { text: "Lead " + tokL, index: 0 }); await page.locator("#next-button").click(); await L.settle(page); await L.settle(page);
      const mf0 = await snap(page); await page.locator("#play-button").click(); await L.settle(page); const mf1 = await snap(page);
      R.finish[key + " manual final"] = { before: mf0, after: mf1 };
      check(`${key} manual final scroll token: one Play finishes`, mf0.scrolling && mf1.finished && !mf1.note && mf1.scrolling && mf1.inert && mf1.tabindex === null && mf1.marker === null, { mf0, mf1 });

      // ---- W6.10 keys and focus.
      await L.prepare(page, tokL, { index: 0 }); await page.locator("#play-button").click();
      await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1" && !state.playing, null, { timeout: 15000 });
      const k0 = await snap(page); check(`${key} W6.10 no automatic focus after auto-pause`, k0.active !== "word-display", k0);
      await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press("Space"); const k1 = await timeline(page, 700); await page.evaluate(() => pause());
      check(`${key} W6.10 Space on body toggles playback`, k1.some((r) => r.countdown === 3), summarise(k1));
      await L.prepare(page, tokL, { index: 1 }); await page.locator("#word-display").focus(); const kf = await snap(page);
      await page.keyboard.press("Space"); await page.waitForTimeout(400); const k2 = await snap(page);
      check(`${key} W6.10 Space on focused area scrolls, no playback`, kf.active === "word-display" && k2.scrollTop > kf.scrollTop && !k2.playing && k2.countdown === null && k2.index === 1, { kf, k2 });
      await page.locator("#play-button").focus(); await page.keyboard.press("Space"); const k3 = await timeline(page, 600); await page.evaluate(() => pause());
      check(`${key} W6.10 Space on Play button keeps play role`, k3.some((r) => r.countdown === 3), summarise(k3));
      R.keys[key] = { k0, k1: summarise(k1), kf, k2, k3: summarise(k3) };

      // ---- Preservation (F-6): focus + scrollTop through actions, via the real controls where they exist.
      const actions = [
        ["wpm", () => page.locator("#wpm-slider").evaluate((el) => { el.value = String(Number(el.value) + 20); el.dispatchEvent(new Event("input", { bubbles: true })); })],
        ["context toggle off", () => page.locator("#context-toggle").evaluate((el) => { el.checked = false; el.dispatchEvent(new Event("change", { bubbles: true })); })],
        ["context toggle on", () => page.locator("#context-toggle").evaluate((el) => { el.checked = true; el.dispatchEvent(new Event("change", { bubbles: true })); })],
        ["focus letter", () => page.locator("#focus-toggle").evaluate((el) => { el.checked = !el.checked; el.dispatchEvent(new Event("change", { bubbles: true })); })],
        ["word size", () => page.evaluate(() => setWordSize("comfortable"))],
        ["word size back", () => page.evaluate(() => setWordSize("large"))],
        ["copy", () => page.evaluate(() => copyCurrentWord())],
        ["same-index seek", () => page.evaluate(() => seekTo(state.index))],
        ["resize narrow->wide", () => page.setViewportSize({ width: vw === 390 ? 1400 : 1708, height: 950 })],
        ["resize back", () => page.setViewportSize({ width: vw, height: vh })]
      ];
      await L.prepare(page, tokL, { index: 1 }); await page.locator("#word-display").focus(); await page.evaluate(() => { els.wordDisplay.scrollTop = 300; });
      const pres = [];
      for (const [name, act] of actions) {
        const before = await snap(page); let err = null; try { await act(); } catch (e) { err = e.message.slice(0, 120); }
        await L.settle(page); await L.settle(page); const after = await snap(page);
        pres.push({ name, err, before: { st: before.scrollTop, active: before.active }, after: { st: after.scrollTop, active: after.active, scrolling: after.scrolling, marker: after.marker } });
        check(`${key} F-6 ${name} keeps focus and scroll`, !err && after.active === "word-display" && after.scrolling && (after.scrollTop === before.scrollTop || name.startsWith("resize") || name.startsWith("word size")), { name, err, before, after });
      }
      R.preserve[key] = pres;
      if (errors.length) fails.push(key + " page errors: " + errors.join(" | "));
      await ctx.close();
    }

    // ---- Finish screen vs master for a normal final word that needs fitting, and the long final.
    for (const [vw, vh] of [[390, 844], [1400, 950]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh } }); const b = await ctx.newPage(), m = await ctx.newPage();
      await b.goto(s.branch, { waitUntil: "networkidle" }); await m.goto(s.master, { waitUntil: "networkidle" });
      for (const text of ["Lead Kommunikasjonsmiddel", "Lead Internationalization", "Lead " + L.REAL45, "Lead Tail"]) {
        const res = {};
        for (const [name, p] of [["master", m], ["branch", b]]) {
          await p.bringToFront(); await L.prepare(p, "", { text, index: 1 }); await p.evaluate(() => completeReading()); await L.settle(p); await L.settle(p);
          const mm = await L.measure(p); res[name] = { font: mm.font, word: mm.word, textRect: mm.textRect, classes: mm.classes, style: mm.styleAttr, finished: await p.evaluate(() => state.finished),
            shot: (await p.locator(".reader-frame").screenshot()).toString("base64") };
        }
        const px = await L.pixelDiff(b, Buffer.from(res.master.shot, "base64"), Buffer.from(res.branch.shot, "base64"));
        L.fs.writeFileSync(L.path.join(out, `finish-${vw}-${text.split(" ")[1].slice(0, 12)}-master.png`), Buffer.from(res.master.shot, "base64"));
        L.fs.writeFileSync(L.path.join(out, `finish-${vw}-${text.split(" ")[1].slice(0, 12)}-branch.png`), Buffer.from(res.branch.shot, "base64"));
        delete res.master.shot; delete res.branch.shot;
        R.finish[`screen ${vw} ${text.slice(5, 30)}`] = { ...res, px };
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "play.json"), JSON.stringify({ R, fails }, null, 1));
  const lines = [];
  for (const [k, v] of Object.entries(R.paths)) lines.push(`PATH ${k}: arrive i${v.at.index} scroll=${v.at.scrolling} note=${v.at.note} active=${v.at.active} || ${v.timeline}`);
  for (const [k, v] of Object.entries(R.finish)) lines.push(`FINISH ${k}: ${JSON.stringify(v).slice(0, 700)}`);
  for (const [k, v] of Object.entries(R.keys)) lines.push(`KEYS ${k}: ${JSON.stringify(v).slice(0, 900)}`);
  for (const [k, v] of Object.entries(R.preserve)) for (const p of v) lines.push(`PRESERVE ${k} ${p.name}: ${JSON.stringify(p.before)} -> ${JSON.stringify(p.after)}${p.err ? " ERR " + p.err : ""}`);
  lines.push("FAILS " + fails.length); for (const f of fails) lines.push("  " + f);
  L.fs.writeFileSync(L.path.join(out, "play.txt"), lines.join("\n") + "\n"); console.log(lines.join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
