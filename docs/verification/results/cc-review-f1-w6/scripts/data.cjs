"use strict";
// Data integrity through the real paste UI, and normal-token identity (byte and pixel) vs master.
const L = require("./lib.cjs"), assert = require("node:assert/strict");
const out = L.path.join(L.SP, "ev", "data"); L.fs.mkdirSync(out, { recursive: true });
const capture = (page) => page.evaluate(() => {
  const raw = localStorage.getItem(STORAGE_KEY); const session = JSON.parse(raw); const savedAt = session.savedAt; delete session.savedAt;
  return { index: state.index, word: state.words[state.index], display: els.wordDisplay.textContent, count: state.words.length, wordsJoined: state.words.join("\u0001"),
    wordCountLabel: els.wordCount.textContent, position: els.positionLabel.textContent, percent: els.percentLabel.textContent, timeLeft: document.querySelector("#time-left")?.textContent ?? null,
    sliderMax: els.progressSlider.max, sliderValue: els.progressSlider.value, sourceText: state.sourceText, session, sessionKeys: Object.keys(JSON.parse(raw)), savedAtType: typeof savedAt };
});
async function viaUi(page, origin, text) {
  await page.goto(origin, { waitUntil: "networkidle" }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "networkidle" });
  await page.locator("#text-input").fill(text); await page.locator("#load-text-button").click();
  await page.locator("#apply-source-button").click(); await page.locator("#review-back-button").click();
  await page.locator('.segment[data-size="large"]').click(); await page.locator("#next-button").click(); await L.settle(page); await L.settle(page);
  const a = await capture(page);
  await page.locator("#copy-word-button").click(); a.clipboard = await page.evaluate(() => navigator.clipboard.readText());
  await page.reload({ waitUntil: "networkidle" }); await page.locator("#resume-button").click(); await L.settle(page); await L.settle(page);
  const b = await capture(page); await page.locator("#copy-word-button").click(); b.clipboard = await page.evaluate(() => navigator.clipboard.readText());
  return { afterNext: a, afterResume: b };
}
const wordState = (page) => page.evaluate(() => { const d = els.wordDisplay, r = d.getBoundingClientRect(); return { font: getComputedStyle(d).fontSize, rect: [r.x, r.y, r.width, r.height], classes: d.className, text: d.textContent, html: d.outerHTML, style: d.getAttribute("style"),
  prev: els.previousContext.outerHTML, next: els.nextContext.outerHTML }; });
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const R = { data: [], identity: [] }; let failures = 0;
  try {
    for (const viewport of [{ width: 1400, height: 950 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"] });
      const b = await ctx.newPage(), m = await ctx.newPage();
      for (const [kind, n] of [["W", 135], ["W", 500], ["W", 1000], ["W", 2000], ["W", 10000], ["real", 135], ["real", 500], ["real", 1000], ["real", 2000], ["real", 10000], ["real", 45], ["Hello", 5]]) {
        const tok = kind === "Hello" ? "Hello" : L.token(kind, n), text = "Lead " + tok + " Tail End.";
        await b.bringToFront(); const xb = await viaUi(b, s.branch, text); await m.bringToFront(); const xm = await viaUi(m, s.master, text);
        const diffs = [];
        for (const phase of ["afterNext", "afterResume"]) for (const k of Object.keys(xm[phase])) if (JSON.stringify(xm[phase][k]) !== JSON.stringify(xb[phase][k])) diffs.push(phase + "." + k);
        const ok = diffs.length === 0 && xb.afterNext.word === tok && xb.afterNext.clipboard === tok && xb.afterResume.word === tok && xb.afterNext.index === 1 && xb.afterResume.index === 1;
        if (!ok) failures++;
        R.data.push({ viewport: viewport.width, token: kind + n, ok, diffs, index: xb.afterNext.index, count: xb.afterNext.count, wordCountLabel: xb.afterNext.wordCountLabel, position: xb.afterNext.position, percent: xb.afterNext.percent,
          resumeIndex: xb.afterResume.index, sessionKeys: xb.afterNext.sessionKeys, tokenSha: L.sha(tok), clipboardSha: L.sha(xb.afterNext.clipboard), sessionSha: L.sha(JSON.stringify(xb.afterNext.session)), masterSessionSha: L.sha(JSON.stringify(xm.afterNext.session)) });
      }
      // Normal tokens: byte- and pixel-identical frame (base config) and two other word sizes.
      await b.goto(s.branch, { waitUntil: "networkidle" }); await m.goto(s.master, { waitUntil: "networkidle" });
      for (const size of ["large", "comfortable", "compact"]) for (const tok of ["Hello", L.REAL]) {
        const shots = {}; const st = {};
        for (const [name, page] of [["branch", b], ["master", m]]) {
          await page.bringToFront(); await L.prepare(page, tok); await page.evaluate((sz) => setWordSize(sz), size); await L.settle(page); await L.settle(page);
          st[name] = await wordState(page); shots[name] = await page.locator(".reader-frame").screenshot();
          L.fs.writeFileSync(L.path.join(out, `id-${viewport.width}-${size}-${tok.length}-${name}.png`), shots[name]);
        }
        const px = await L.pixelDiff(b, shots.branch, shots.master);
        const same = Object.keys(st.master).filter((k) => JSON.stringify(st.master[k]) !== JSON.stringify(st.branch[k]));
        if (same.length || !px.sameSize || px.differingPixels) failures++;
        R.identity.push({ viewport: viewport.width, wordSize: size, len: tok.length, differingFields: same, font: st.branch.font, rect: st.branch.rect, classes: st.branch.classes, pngShaEqual: L.sha(shots.branch) === L.sha(shots.master), ...px });
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(out, "data.json"), JSON.stringify(R, null, 1));
  for (const d of R.data) console.log("DATA", d.viewport, d.token, d.ok ? "MATCH" : "DIFF " + d.diffs.join(","), "idx", d.index, "count", d.count, d.position, d.percent, "resume", d.resumeIndex, "keys", d.sessionKeys.length, "session", d.sessionSha.slice(0, 12), d.masterSessionSha.slice(0, 12));
  for (const i of R.identity) console.log("ID", i.viewport, i.wordSize, i.len, "fields", JSON.stringify(i.differingFields), i.font, JSON.stringify(i.rect), i.classes, "png==", i.pngShaEqual, "px", i.differingPixels, JSON.stringify(i.size));
  console.log("failures", failures, "sessionKeys", R.data[0].sessionKeys.join(","));
})().catch((e) => { console.error(e); process.exit(1); });
