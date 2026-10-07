"use strict";
// Data / wordflow-reader-session-v1 parity through the real paste UI: Load, Use source, Next, Copy, reload, Resume.
const L = require("./lib.cjs");
const capture = (page) => page.evaluate(() => {
  const raw = localStorage.getItem(STORAGE_KEY); const session = JSON.parse(raw); const savedAtType = typeof session.savedAt; delete session.savedAt;
  return { index: state.index, word: state.words[state.index], display: els.wordDisplay.textContent, count: state.words.length, words: state.words.join("\u0001"),
    wordCountLabel: els.wordCount.textContent, position: els.positionLabel.textContent, percent: els.percentLabel.textContent, timeLeft: els.timeLeft?.textContent ?? null,
    slider: [els.progressSlider.max, els.progressSlider.value], sourceText: state.sourceText, session, sessionKeys: Object.keys(JSON.parse(raw)), savedAtType };
});
async function viaUi(page, origin, text) {
  await page.goto(origin, { waitUntil: "networkidle" }); await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "networkidle" });
  await page.locator("#text-input").fill(text); await page.locator("#load-text-button").click();
  await page.locator("#apply-source-button").click(); await page.locator("#review-back-button").click();
  await page.locator('.segment[data-size="large"]').click(); await page.locator("#next-button").click(); await L.settle(page); await L.settle(page);
  const a = await capture(page); await page.locator("#copy-word-button").click(); await page.waitForFunction(() => els.status.textContent === "Copied current word");
  a.clipboard = await page.evaluate(() => navigator.clipboard.readText());
  await page.reload({ waitUntil: "networkidle" }); await page.locator("#resume-button").click(); await L.settle(page); await L.settle(page);
  const b = await capture(page); await page.locator("#copy-word-button").click(); await page.waitForFunction(() => els.status.textContent === "Copied current word");
  b.clipboard = await page.evaluate(() => navigator.clipboard.readText());
  return { afterNext: a, afterResume: b };
}
(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = []; let failures = 0;
  const toks = [["W10000", "W".repeat(10000)], ["W2000", "W".repeat(2000)], ["W135", "W".repeat(135)], ["real2025", L.REAL45.repeat(45)], ["real45", L.REAL45],
    ["Kommunikasjonsmiddel", "Kommunikasjonsmiddel"], ["Internationalization", "Internationalization"], ["Barnehagelærer", "Barnehagelærer"], ["Hello", "Hello"]];
  try {
    for (const [w, h] of [[390, 844], [1400, 950], [1920, 1080]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, permissions: ["clipboard-read", "clipboard-write"] });
      const b = await ctx.newPage(), m = await ctx.newPage();
      for (const [name, tok] of toks) {
        const text = "Lead " + tok + " Tail End.";
        await b.bringToFront(); const xb = await viaUi(b, s.branch, text); await m.bringToFront(); const xm = await viaUi(m, s.master, text);
        const diffs = []; for (const ph of ["afterNext", "afterResume"]) for (const k of Object.keys(xm[ph])) if (JSON.stringify(xm[ph][k]) !== JSON.stringify(xb[ph][k])) diffs.push(ph + "." + k);
        const ok = !diffs.length && [xb.afterNext, xb.afterResume].every((x) => x.word === tok && x.display === tok && x.clipboard === tok && x.index === 1 && x.count === 4 && x.savedAtType === "number");
        if (!ok) failures++;
        rows.push({ viewport: w + "x" + h, token: name, ok, diffs, sessionKeys: xb.afterNext.sessionKeys.length, position: xb.afterNext.position, percent: xb.afterNext.percent, count: xb.afterNext.wordCountLabel,
          tokenSha: L.sha(tok), clipSha: L.sha(xb.afterResume.clipboard), sessionSha: L.sha(JSON.stringify(xb.afterNext.session)), masterSessionSha: L.sha(JSON.stringify(xm.afterNext.session)) });
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
  L.fs.writeFileSync(L.path.join(L.OUT, "data.json"), JSON.stringify(rows, null, 1));
  for (const r of rows) console.log(r.viewport, r.token.padEnd(22), r.ok ? "MATCH" : "DIFF " + r.diffs.join(","), "keys", r.sessionKeys, r.count, r.position, r.percent, "session", r.sessionSha.slice(0, 12), r.masterSessionSha.slice(0, 12), "clip==token", r.clipSha === r.tokenSha);
  console.log("failures", failures, "of", rows.length);
})().catch((e) => { console.error(e); process.exit(1); });
