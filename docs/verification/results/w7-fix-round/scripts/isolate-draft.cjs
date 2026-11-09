"use strict";
// One-time conversion of the archived draft: new checks get a fresh context/page
// each; the original Portal suite is preserved, including every fixture/assertion.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),{execFileSync}=require("node:child_process");
const root=process.cwd(),target=path.join(root,"tests/reader-portal.cjs");
const original=execFileSync("git",["show","e2b212d:tests/reader-portal.cjs"],{cwd:root,encoding:"utf8"});
let draft=fs.readFileSync(target,"utf8");
const names=["W4.6 privacy paragraph and W7.7 ruled copy are exact","W7.12 unfitted word sizes equal pre-restyle in normal and focus mode","W7.4 saves after both theme directions preserve the exact resume schema and values","W7.13 reader heading, fullscreen icon and frame fit from 310 px","W7.5 fullscreen refit is already stable and meets the floor-aware target"];
const blocks=names.map(name=>{const start=draft.indexOf('      await check("'+name+'", async () => {');assert(start>=0,name);const end=draft.indexOf("\n      });",start)+"\n      });".length;assert(end>start);return draft.slice(start,end).replace('await check("'+name+'", async () => {','await isolated("'+name+'", async page => {');});
const helper=`async function portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme }) {
  const viewport = { width, height: width === 390 ? 844 : 950 };
  const details = { viewport, colorScheme, isolation: "fresh browser context and page for each check" };
  const isolated = async (name, fn) => verify("W7 " + width + " " + colorScheme + " " + name, async () => {
    const context = await browser.newContext({ viewport, screen: viewport, colorScheme });
    const errors = [], blocked = [], uploads = [];
    try {
      await context.route("**/*", route => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        blocked.push(route.request().url()); return route.abort();
      });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("request", request => { if (request.method() === "POST") uploads.push(request.url()); });
      await page.goto(origin, { waitUntil: "networkidle" });
      await page.locator("#sample-button").click();
      await page.locator("#apply-source-button").click();
      await page.locator("#review-back-button").click();
      await page.evaluate(() => { seekTo(2); window.scrollTo(0, 0); });
      await fn(page);
      assert.deepEqual(errors, []); assert.deepEqual(blocked, []); assert.deepEqual(uploads, []);
    } finally { await context.close(); }
  });
  try {
${blocks.join("\n")}
  } finally {
    fs.writeFileSync(path.join(out, "portal-regressions-" + width + "-" + colorScheme + ".json"), JSON.stringify(details, null, 2) + "\\n");
  }
}

`;
let result=original.replace('const { measure } = require("./reader-round2.cjs");','const { measure, baseline, prepare } = require("./reader-round2.cjs");');
const sig='async function portalChecks({ browser, origin, width, verify, out, root }) {';
const newSig='async function portalChecks({ browser, origin, width, verify, out, root, newChecksOrder = "before" }) {';
result=result.replace(sig,helper+newSig+'\n  assert(["before", "after"].includes(newChecksOrder), "unknown new-check order");');
const start='  for (const colorScheme of ["dark", "light"]) {',before='\n    if (newChecksOrder === "before") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });';
result=result.replace(start,start+before);
const end='      await context.close();\n    }\n  }\n}\n\nmodule.exports';
const after='    if (newChecksOrder === "after") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });\n';
assert(result.includes(end));result=result.replace(end,'      await context.close();\n    }\n'+after+'  }\n}\n\nmodule.exports');
// Remove only our helper, calls, signature/import additions, then require exact
// original bytes. This includes the complete old fixtures, assertions and waits.
const reconstructed=result.replace(helper,"").replace(newSig+'\n  assert(["before", "after"].includes(newChecksOrder), "unknown new-check order");',sig).replace(before,"").replace(after,"").replace('const { measure, baseline, prepare } = require("./reader-round2.cjs");','const { measure } = require("./reader-round2.cjs");');
assert.equal(reconstructed,original,"existing Portal code changed");
fs.writeFileSync(target,result);
console.log("Isolated five new groups; existing Portal code reconstructs byte-for-byte.");
