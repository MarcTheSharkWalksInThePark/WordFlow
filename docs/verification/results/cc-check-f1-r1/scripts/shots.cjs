"use strict";
// Figures for the report: Finished screen frames, master vs branch, production CSS, pointer parked.
const L = require("./lib.cjs");
const out = L.path.join(L.OUT, "shots"); L.fs.mkdirSync(out, { recursive: true });
const cases = [
  [1400, 950, "large", "W".repeat(2000), "W2000"],
  [844, 390, "large", "W".repeat(2000), "W2000"],
  [390, 844, "comfortable", "understanding.", "understanding"],
  [1708, 950, "large", "Kommunikasjonsmiddel.", "Kommunikasjonsmiddel"]
];
(async () => {
  const s = await L.servers(); const browser = await L.launch();
  try {
    for (const [w, h, size, tok, name] of cases) for (const [side, url] of [["master", s.master], ["branch", s.branch]]) {
      const c = await browser.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage();
      await p.goto(url, { waitUntil: "networkidle" });
      await L.prepare(p, "", { text: "Lead " + tok, index: 1, size });
      await p.evaluate(() => completeReading()); await L.settle(p); await L.settle(p);
      await p.mouse.move(0, 0); await p.waitForTimeout(300);
      await p.evaluate(() => els.wordDisplay.closest(".reader-frame").scrollIntoView({ block: "center" })); await L.settle(p);
      await p.locator(".reader-frame").screenshot({ path: L.path.join(out, `finished-${w}x${h}-${size}-${name}-${side}.png`) });
      await c.close();
    }
  } finally { await browser.close(); await s.close(); }
  console.log(L.fs.readdirSync(out).join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
