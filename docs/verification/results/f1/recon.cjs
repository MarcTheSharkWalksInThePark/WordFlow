"use strict";
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "../../../..");
const { start, stop } = require(path.join(root, "tests/helpers.cjs"));
const { launch } = require(path.join(root, "tests/browser-helper.cjs"));
const real = "Pneumonoultramicroscopicsilicovolcanoconiosis";
(async () => {
  let server, browser;
  const stage = process.argv[2] || "before";
  const result = { stage, measurements: [] };
  try {
    server = await start(root);
    browser = await launch(); result.chrome = browser.version();
    for (const viewport of [{ width: 1400, height: 950 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      await page.goto("http://127.0.0.1:" + server.port);
      for (const token of ["Hello", real, real.repeat(3), "W".repeat(135), "W".repeat(500), "W".repeat(2000)]) {
        await page.evaluate(token => { state.wordSize = "large"; state.focusLetter = true; renderWord(token); }, token);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const dimensions = await page.locator("#word-display").evaluate(el => {
          const frame = el.closest(".reader-frame"), word = el.getBoundingClientRect(), box = frame.getBoundingClientRect();
          const rect = r => ({ x: r.x, y: r.y, width: r.width, height: r.height });
          return { text: el.textContent, fontSize: getComputedStyle(el).fontSize, classes: el.className,
            word: rect(word), frame: rect(box), clientWidth: frame.clientWidth, clientHeight: frame.clientHeight,
            scrollWidth: frame.scrollWidth, scrollHeight: frame.scrollHeight,
            displayClientWidth: el.clientWidth, displayScrollWidth: el.scrollWidth,
            displayClientHeight: el.clientHeight, displayScrollHeight: el.scrollHeight };
        });
        result.measurements.push({ viewport, length: token.length, ...dimensions });
      }
      await page.screenshot({ path: path.join(__dirname, stage + "-" + viewport.width + ".png"), fullPage: true });
      await page.close();
    }
    fs.writeFileSync(path.join(__dirname, stage + ".json"), JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result.measurements.map(({ viewport, length, fontSize, word, clientWidth, clientHeight, scrollWidth, scrollHeight }) =>
      ({ width: viewport.width, length, fontSize, wordWidth: word.width, wordHeight: word.height, clientWidth, clientHeight, scrollWidth, scrollHeight }))));
  } finally { if (browser) await browser.close(); await stop(server); }
})().catch(error => { console.error(error); process.exitCode = 1; });
