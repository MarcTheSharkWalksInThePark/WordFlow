"use strict";
// First W6.13 STOP gate: real Finished layout, using committed master/pre-fix blobs.
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "../../../.."), out = __dirname;
const { start, stop, sha } = require(path.join(root, "tests/helpers.cjs"));
const { launch, runtime } = require(path.join(root, "tests/browser-helper.cjs"));
const { baseline, prepare } = require(path.join(root, "tests/reader-round2.cjs"));
const { settle } = require(path.join(root, "tests/reader-smoke.cjs"));
async function measure(page) {
  return page.evaluate(() => {
    const d = els.wordDisplay, f = d.closest(".reader-frame"), panel = els.finishSummary;
    const rect = e => { const r = e.getBoundingClientRect(); return {
      left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height
    }; };
    const word = rect(d), summary = rect(panel), frame = rect(f);
    const range = document.createRange(); range.selectNodeContents(d);
    const text = rect({ getBoundingClientRect: () => range.getBoundingClientRect() });
    const overlap = { width: Math.max(0, Math.min(word.right, summary.right) - Math.max(word.left, summary.left)),
      height: Math.max(0, Math.min(word.bottom, summary.bottom) - Math.max(word.top, summary.top)) };
    const hit = document.elementFromPoint((summary.left + summary.right) / 2, (summary.top + summary.bottom) / 2);
    return { font: getComputedStyle(d).fontSize, classes: d.className, frameClasses: f.className,
      word, text, frame, summary, overlap, overlapArea: overlap.width * overlap.height,
      panelHidden: panel.hidden, panelZIndex: getComputedStyle(panel).zIndex,
      hitInPanel: panel.contains(hit), hitInWord: d.contains(hit),
      frameInner: { left: frame.left + f.clientLeft, right: frame.left + f.clientLeft + f.clientWidth,
        top: frame.top + f.clientTop, bottom: frame.top + f.clientTop + f.clientHeight },
      area: { clientHeight: d.clientHeight, scrollHeight: d.scrollHeight, scrollTop: d.scrollTop },
      noteHidden: els.longTextNote?.hidden ?? true, marker: d.dataset.longTextPaused ?? null,
      finished: state.finished, playing: state.playing, index: state.index,
      status: els.status.textContent, textLength: d.textContent.length };
  });
}
(async () => {
  let server, browser, context;
  const errors = [], evidence = { viewport: { width: 390, height: 844 },
    cfg: { final: true, size: "comfortable", context: true, letter: true }, token: "W x 2000", errors, uploads: 0 };
  try {
    server = await start(root); browser = await launch(); evidence.chrome = browser.version();
    evidence.playwright = runtime().playwrightVersion;
    const origin = "http://127.0.0.1:" + server.port;
    context = await browser.newContext({ viewport: evidence.viewport });
    for (const [name, ref] of [["master", "master"], ["before", "caa0d65"], ["candidate", null]]) {
      const page = ref ? await baseline(context, origin, root, ref) : await context.newPage();
      page.on("pageerror", e => errors.push(e.message));
      page.on("request", r => { if (r.method() === "POST") evidence.uploads++; });
      if (!ref) await page.goto(origin, { waitUntil: "networkidle" });
      await prepare(page, "W".repeat(2000), evidence.cfg);
      const reading = await measure(page);
      // Match the real one-Play path for a final scroll token; master completes after its final delay.
      await page.evaluate(() => {
        if (els.wordDisplay.classList.contains("scrolling-long-word")) play();
        else completeReading();
      });
      await settle(page); await settle(page);
      const finished = await measure(page);
      const png = await page.locator(".reader-frame").screenshot({ path: path.join(out, name + "-finished-390-W2000.png") });
      evidence[name] = { reading, finished, pngSha256: sha(png), title: await page.title() };
      await page.close();
    }
    const c = evidence.candidate.finished;
    evidence.stop = c.classes.includes("scrolling-long-word") && c.overlapArea > 0 && c.hitInPanel
      ? "STOP: scrolling last word overlaps the Finished panel, which intercepts pointer input in the overlap."
      : null;
    fs.writeFileSync(path.join(out, "finished-stop.json"), JSON.stringify(evidence, null, 2) + "\n");
    console.log(JSON.stringify({ stop: evidence.stop, chrome: evidence.chrome, candidate: c, errors, uploads: evidence.uploads }, null, 2));
    if (evidence.stop) process.exitCode = 2;
  } finally {
    if (context) await context.close(); if (browser) await browser.close(); if (server) await stop(server);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
