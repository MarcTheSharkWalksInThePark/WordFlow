"use strict";
const L = require("./lib.cjs");
(async () => {
  const s = await L.servers(); const browser = await L.launch();
  try {
    for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1440 }]) {
      const ctx = await browser.newContext({ viewport });
      for (const [name, origin] of [["branch", s.branch], ["master", s.master]]) {
        const page = await ctx.newPage(); await page.goto(origin, { waitUntil: "networkidle" });
        for (const tok of [L.REAL, L.token("W", 2000)]) {
          await L.prepare(page, tok, { focusMode: false });
          const m = await L.measure(page);
          console.log(viewport.width, name, "normal", tok.length, m.font, m.classes, "frameClientW", m.frame.clientW, "frameScrollW", m.frame.scrollW, "scrolling", m.scrolling);
          if (name === "branch" && tok.length === 2000) await page.locator(".reader-frame").screenshot({ path: L.path.join(L.SP, "ev", "focus", `normal-${viewport.width}-branch-2000.png`) });
        }
        await page.close();
      }
      await ctx.close();
    }
  } finally { await browser.close(); await s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
