"use strict";
// Two-Play sequence, Space/keyboard/focus behaviour (branch, with master reference for keys).
const L = require("./lib.cjs");
const out = L.path.join(L.SP, "ev", "play"); L.fs.mkdirSync(out, { recursive: true });
const snap = (page) => page.evaluate(() => ({ t: Math.round(performance.now()), index: state.index, playing: state.playing, countdown: state.countdownActive ? state.countdownValue : null,
  marker: els.wordDisplay.dataset.longTextPaused ?? null, note: !els.longTextNote?.hidden, scrolling: els.wordDisplay.classList.contains("scrolling-long-word"),
  scrollTop: els.wordDisplay.scrollTop, shown: els.wordDisplay.textContent.slice(0, 12) + "(" + els.wordDisplay.textContent.length + ")", status: document.querySelector("#status-text, .status, [role=status]")?.textContent?.trim() ?? null,
  active: document.activeElement === document.body ? "body" : (document.activeElement.id || document.activeElement.className || document.activeElement.tagName) }));
async function timeline(page, ms = 4500) {
  const rows = []; let last = ""; const end = Date.now() + ms;
  while (Date.now() < end) { const s = await snap(page); const key = JSON.stringify({ ...s, t: 0 }); if (key !== last) { rows.push(s); last = key; } await page.waitForTimeout(25); }
  return rows;
}
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const R = {};
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(s.branch, { waitUntil: "networkidle" });
    const W = L.token("W", 10000);

    // A. Manual next onto the long token, scroll a little, then press Play twice.
    await L.prepare(page, W, { index: 0 }); await page.locator("#next-button").click(); await L.settle(page);
    R.A_arrival = await snap(page);
    await page.evaluate(() => { els.wordDisplay.scrollTop = 600; }); R.A_scrolled = await snap(page);
    await page.locator("#play-button").click(); R.A_firstPlay = await timeline(page);
    await page.locator("#play-button").click(); R.A_secondPlay = await timeline(page, 2500);
    await page.evaluate(() => pause());

    // B. Manual previous onto the long token (from Tail), then Play.
    await L.prepare(page, W, { index: 2 }); await page.locator("#prev-button").click(); await L.settle(page);
    R.B_arrival = await snap(page); await page.locator("#play-button").click(); R.B_firstPlay = await timeline(page);
    await page.evaluate(() => pause());

    // C. Reload + Resume onto the long token, then Play (twice).
    await L.prepare(page, W, { index: 1 }); await page.reload({ waitUntil: "networkidle" }); await page.locator("#resume-button").click(); await L.settle(page); await L.settle(page);
    R.C_resumed = await snap(page); await page.locator("#play-button").click(); R.C_firstPlay = await timeline(page);
    await page.locator("#play-button").click(); R.C_secondPlay = await timeline(page, 2500);
    await page.evaluate(() => pause());

    // D. Playback arriving at the token (control): one Play to continue.
    await L.prepare(page, W, { index: 0 }); await page.locator("#play-button").click(); R.D_playFromLead = await timeline(page, 4500);
    R.D_activeAfterAutoPause = (await snap(page)).active;
    await page.locator("#play-button").click(); R.D_secondPlay = await timeline(page, 2500); await page.evaluate(() => pause());

    // E. Keyboard while auto-paused, focus NOT in region (focus on body).
    await L.prepare(page, W, { index: 0 }); await page.evaluate(() => startReading()); await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1");
    await page.evaluate(() => document.activeElement.blur()); R.E_before = await snap(page);
    await page.keyboard.press("PageDown"); R.E_pageDownBody = await snap(page);
    await page.keyboard.press("ArrowDown"); R.E_arrowDownBody = await snap(page);
    await page.keyboard.press("End"); R.E_endBody = await snap(page);
    await page.keyboard.press("Space"); R.E_spaceBody = await timeline(page, 2600); await page.evaluate(() => pause());

    // F. Region focused by mouse click while auto-paused: keys.
    await L.prepare(page, W, { index: 0 }); await page.evaluate(() => startReading()); await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1");
    const box = await page.locator("#word-display").boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + 20);
    R.F_afterClick = await snap(page);
    const keys = {};
    for (const k of ["Space", "ArrowDown", "PageDown", "End", "ArrowUp", "PageUp", "Home"]) { await page.keyboard.press(k); await page.waitForTimeout(250); keys[k] = await snap(page); }
    R.F_regionKeys = keys;
    await page.keyboard.press("ArrowRight"); await L.settle(page); R.F_arrowRight = await snap(page);
    await page.keyboard.press("Space"); R.F_spaceAfterLeaving = await timeline(page, 800); await page.evaluate(() => pause());
    await L.prepare(page, W, { index: 0 }); await page.evaluate(() => startReading()); await page.waitForFunction(() => els.wordDisplay.dataset.longTextPaused === "1");
    await page.locator("#word-display").focus(); await page.keyboard.press("ArrowLeft"); await L.settle(page); R.F_arrowLeft = await snap(page);

    // G. Tab order: can the keyboard reach the region, and from where?
    await L.prepare(page, W, { index: 1 }); await page.locator("#play-button").focus(); R.G_onPlay = await snap(page);
    await page.keyboard.press("Space"); R.G_spaceOnPlayButton = await timeline(page, 800); await page.evaluate(() => pause());
    await L.prepare(page, W, { index: 1 });
    R.G_tabbable = await page.evaluate(() => { const all = [...document.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")].filter((e) => !e.disabled && e.tabIndex >= 0 && e.offsetParent !== null); const i = all.indexOf(els.wordDisplay); return { regionIndex: i, before: all[i - 1]?.id || null, after: all[i + 1]?.id || null, total: all.length }; });

    // H. Master reference: Space and arrows with focus on body, same token.
    const m = await ctx.newPage(); await m.goto(s.master, { waitUntil: "networkidle" });
    await L.prepare(m, W, { index: 1 }); await m.evaluate(() => document.activeElement.blur());
    await m.keyboard.press("PageDown"); R.H_masterPageDown = await m.evaluate(() => ({ winY: scrollY, index: state.index }));
    await m.keyboard.press("Space"); await m.waitForTimeout(300); R.H_masterSpace = await m.evaluate(() => ({ countdown: state.countdownActive, index: state.index }));
    await m.evaluate(() => pause());
    R.errors = errors;
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "play.json"), JSON.stringify(R, null, 1));
  for (const [k, v] of Object.entries(R)) console.log(k, Array.isArray(v) ? "\n  " + v.map((x) => JSON.stringify(x)).join("\n  ") : JSON.stringify(v));
})().catch((e) => { console.error(e); process.exit(1); });
