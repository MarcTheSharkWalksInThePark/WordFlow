"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../../../../..");
const {start, stop} = require(path.join(root, "tests/helpers.cjs"));
const {launch} = require(path.join(root, "tests/browser-helper.cjs"));
const {baseline, prepare, measure} = require(path.join(root, "tests/reader-round2.cjs"));
const {checkTokenLayout} = require(path.join(root, "tests/reader-smoke.cjs"));
const ref = "2a376445ceb1b98a1b4c943cf8834e77e0578120";
const audit = require("./wide-target-audit.json");
const real = "Pneumonoultramicroscopicsilicovolcanoconiosis";

async function observe(page, token, fixture) {
  const {width, height, focus, context, letter} = fixture;
  await page.setViewportSize({width, height});
  await prepare(page, token, {focus, context, letter});
  const m = await measure(page);
  await checkTokenLayout(page);
  return {font:m.font, textWidth:m.contentWidth, boxWidth:m.word.width, frameWidth:m.frame.clientWidth,
    percentage:100 * m.contentWidth / m.frame.clientWidth, wrapped:m.wrapped,
    scrolling:m.scrolling, inside:m.ink.fullyVisible};
}

(async () => {
  const server = await start(root);
  let browser;
  try {
    browser = await launch();
    const context = await browser.newContext();
    const origin = "http://127.0.0.1:" + server.port;
    const old = await baseline(context, origin, root, ref), candidate = await context.newPage();
    await candidate.goto(origin);
    const rows = [];
    for (const fixture of audit.rows.filter(row => !row.passed)) {
      const token = fixture.kind === "W" ? "W".repeat(fixture.n) : real.repeat(45);
      assert.equal(token.length, fixture.n);
      const prior = await observe(old, token, fixture);
      const current = await observe(candidate, token, fixture);
      rows.push({width:fixture.width, height:fixture.height, focus:fixture.focus, context:fixture.context,
        letter:fixture.letter, kind:fixture.kind, n:fixture.n, candidateUnfitted:fixture.base.width,
        candidateFloorWidth:fixture.floor.width, prior, current});
    }
    const summary = {ref, count:rows.length, baselineAtFloor:rows.filter(r=>r.prior.font==="10px").length,
      candidateAtFloor:rows.filter(r=>r.current.font==="10px").length,
      priorWrapped:rows.filter(r=>r.prior.wrapped).length, candidateWrapped:rows.filter(r=>r.current.wrapped).length,
      bothInside:rows.filter(r=>r.prior.inside&&r.current.inside).length};
    fs.writeFileSync(path.join(__dirname, "floor-cross-check.json"), JSON.stringify({summary, rows},null,2)+"\n");
    console.log(JSON.stringify(summary));
    assert.equal(summary.count,80); assert.equal(summary.baselineAtFloor,80);
    assert.equal(summary.candidateAtFloor,80); assert.equal(summary.bothInside,80);
  } finally { if (browser) await browser.close(); await stop(server); }
})().catch(error=>{console.error(error);process.exitCode=1;});
