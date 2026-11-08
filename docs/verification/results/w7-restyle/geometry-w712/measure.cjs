"use strict";
const path = require("node:path"), fs = require("node:fs");
const root = path.resolve(__dirname, "../../../../..");
const {start, stop} = require(path.join(root, "tests/helpers.cjs"));
const {launch} = require(path.join(root, "tests/browser-helper.cjs"));
const {baseline, prepare} = require(path.join(root, "tests/reader-round2.cjs"));
const {settle} = require(path.join(root, "tests/reader-smoke.cjs"));
const ref = "2a376445ceb1b98a1b4c943cf8834e77e0578120";
const viewports = [[390,844],[390,600],[768,1024],[1400,900],[1400,950],[1708,950],[1920,1080]];
const stage = process.argv[2];
if (!["before","after","real45"].includes(stage)) throw Error("Specify before, after or real45");
const token = stage === "real45" ? "Pneumonoultramicroscopicsilicovolcanoconiosis" : "Hello";
async function dimensions(page, focus) {
  await prepare(page, token, {focus, size:"large"});
  const samples = {};
  for (const size of ["large","comfortable","compact"]) {
    await page.evaluate(size => setWordSize(size), size);
    await settle(page); await settle(page);
    samples[size] = await page.evaluate(() => {
      const d = els.wordDisplay, word = d.getBoundingClientRect();
      const frame = d.closest(".reader-frame").getBoundingClientRect();
      return {width:frame.width, height:frame.height, font:getComputedStyle(d).fontSize,
        top:word.top - els.previousContext.getBoundingClientRect().bottom,
        bottom:els.nextContext.getBoundingClientRect().top - word.bottom};
    });
  }
  return samples;
}
(async () => {
  const server = await start(root);
  let browser;
  try {
    browser = await launch();
    const origin = "http://127.0.0.1:" + server.port;
    const rows = [];
    for (const theme of ["dark","light"]) {
      const context = await browser.newContext({colorScheme:theme});
      try {
        const old = await baseline(context, origin, root, ref);
        const page = await context.newPage();
        await page.goto(origin, {waitUntil:"networkidle"});
        for (const [width,height] of viewports) {
          for (const tab of [old,page]) await tab.setViewportSize({width,height});
          for (const focus of [false,true]) {
            const prior = await dimensions(old,focus), current = await dimensions(page,focus);
            rows.push({width,height,theme,focus,prior,current,
              widthRatio:current.large.width/prior.large.width, heightRatio:current.large.height/prior.large.height});
          }
        }
      } finally { await context.close(); }
    }
    fs.writeFileSync(path.join(__dirname,stage+".json"),JSON.stringify({ref,stage,version:browser.version(),rows},null,2)+"\n");
    for (const row of rows) {
      const p=row.prior.large, c=row.current.large;
      console.log([row.width+"x"+row.height,row.theme,row.focus?"focus":"normal",
        p.width,p.height,c.width,c.height,(100*row.widthRatio).toFixed(1),(100*row.heightRatio).toFixed(1),
        Math.min(...Object.values(row.current).flatMap(v=>[v.top,v.bottom])).toFixed(2)].join(" | "));
    }
  } finally { if (browser) await browser.close(); await stop(server); }
})().catch(error => {console.error(error);process.exitCode=1;});
