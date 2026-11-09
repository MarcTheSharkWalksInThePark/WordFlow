"use strict";
// Authorized post-deployment smoke: synthetic text, existing Chrome and Playwright.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { launch, runtime } = require('../../../../tests/browser-helper.cjs');
const out = __dirname, site = 'https://wordflow-reader.pages.dev/';
const result = { site, at: new Date().toISOString(), browserPlugin: 'not available; user requested existing Playwright and installed Chrome', playwright: runtime().playwrightVersion, rows: [] };
async function settle(p) { await p.evaluate(() => document.fonts.ready); await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); }
async function storage(p, context) {
  const value = await p.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), payload: JSON.parse(localStorage.getItem('wordflow-reader-session-v1')) }));
  assert.deepEqual(value.local, ['wordflow-reader-session-v1']); assert.deepEqual(value.session, []);
  assert.deepEqual(Object.keys(value.payload).sort(), ['title','text','index','wpm','sentencePause','commaPause','paragraphPause','smartPacing','focusLetter','contextWords','focusMode','wordSize','savedAt'].sort());
  assert.deepEqual(await context.cookies(), []); return value;
}
async function geometry(p) {
  const g = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, elements: ['.reader-heading','#reader-fullscreen','.reader-frame'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return { selector: s, left: r.left, right: r.right }; }) }));
  assert(g.scrollWidth <= g.width, JSON.stringify(g)); for (const e of g.elements) assert(e.left >= 0 && e.right <= g.width, JSON.stringify(g)); return g;
}
(async () => {
  let browser;
  try {
    browser = await launch(); result.chrome = browser.version();
    for (const viewport of [{width:1400,height:950},{width:390,height:844},{width:320,height:844}]) for (const colorScheme of ['dark','light']) {
      const row = { viewport, colorScheme, errors: [], csp: [] }; result.rows.push(row);
      const context = await browser.newContext({ viewport, colorScheme }); const p = await context.newPage();
      await p.addInitScript(() => { window.liveCsp = []; document.addEventListener('securitypolicyviolation', e => window.liveCsp.push({directive:e.violatedDirective, blocked:e.blockedURI})); });
      p.on('pageerror', e => row.errors.push({type:'pageerror',message:e.message})); p.on('console', m => { if (m.type() === 'error') row.errors.push({type:'console',message:m.text()}); });
      const response = await p.goto(site); assert.equal(response.status(), 200); assert.match(await p.title(), /WordFlow/); assert(await p.locator('#text-input').isVisible());
      assert.equal(await p.locator('#theme-button').textContent(), colorScheme === 'dark' ? 'Lights on' : 'Lights off');
      await p.locator('#text-input').fill('Lead Hello Tail End. Synthetic text for the authorized live check.');
      await p.locator('#load-text-button').click(); await p.locator('#apply-source-button').click(); await p.locator('#review-back-button').click(); await settle(p);
      row.normal = await geometry(p); row.storageBefore = await storage(p, context);
      await p.locator('#theme-button').click(); assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), colorScheme === 'dark' ? 'light' : 'dark');
      await p.locator('#next-button').click(); row.storageToggled = await storage(p, context); await geometry(p);
      await p.locator('#theme-button').click(); assert.equal(await p.evaluate(() => document.documentElement.dataset.theme), colorScheme); await settle(p);
      await p.screenshot({path:path.join(out, `${viewport.width}-${colorScheme}-normal.png`),fullPage:false});
      await p.locator('#reader-fullscreen').click(); await p.waitForFunction(() => document.fullscreenElement === document.querySelector('.reader-panel'));
      assert(await p.locator('#fullscreen-exit').isVisible()); await settle(p); row.fullscreen = await geometry(p);
      await p.screenshot({path:path.join(out, `${viewport.width}-${colorScheme}-fullscreen.png`),fullPage:false});
      await p.locator('#fullscreen-exit').click(); await p.waitForFunction(() => document.fullscreenElement === null); await settle(p);
      row.afterExit = await geometry(p); row.storageAfter = await storage(p, context); row.nativeFullscreen = true;
      row.csp = await p.evaluate(() => window.liveCsp); assert.deepEqual(row.errors, []); assert.deepEqual(row.csp, []); row.passed = true;
      await context.close();
    }
    result.passed = true;
  } catch (e) { result.passed = false; result.failure = e.stack; process.exitCode = 1; }
  finally { if (browser) await browser.close(); fs.writeFileSync(path.join(out,'browser-check.json'), JSON.stringify(result,null,2)+'\n'); console.log(JSON.stringify(result,null,2)); }
})();
