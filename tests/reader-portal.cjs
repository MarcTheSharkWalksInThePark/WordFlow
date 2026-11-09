"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { checkTokenLayout, settle } = require("./reader-smoke.cjs");
const { measure, baseline, prepare } = require("./reader-round2.cjs");

const sessionFields = ["title", "text", "index", "wpm", "sentencePause", "commaPause", "paragraphPause",
  "smartPacing", "focusLetter", "contextWords", "focusMode", "wordSize", "savedAt"].sort();
const realWord = "Pneumonoultramicroscopicsilicovolcanoconiosis";
const fallbackStatus = "Fullscreen isn't available in this browser; focus mode is on instead.";

function luminance(rgb) {
  const linear = rgb.match(/[\d.]+/g).slice(0, 3).map(value => {
    const s = Number(value) / 255;
    return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
  });
  return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
}

async function contrast(page) {
  const samples = await page.evaluate(() => {
    const pairs = [
      ["body", "body", ".app-shell"], ["panel text", ".toggle-row", ".settings-panel"],
      ["muted", ".tagline", ".topbar"], ["head", "h2", ".panel-heading"],
      ["legend", ".option-group legend", ".settings-panel"], ["gel", "#theme-button", "#theme-button"],
      ["chrome", "#fullscreen-button", "#fullscreen-button"], ["LCD", "#reader-wpm", "#reader-wpm"],
      ["ticker", ".ticker", ".ticker"], ["TIP", ".ticker strong", ".ticker strong"],
      ["badge left", ".badges b", ".badges b"], ["badge right", ".badges b + b", ".badges b + b"]
    ];
    return pairs.map(([name, fg, bg]) => {
      const style = selector => getComputedStyle(document.querySelector(selector));
      const surface = style(bg);
      const backgrounds = surface.backgroundImage.match(/rgba?\([^)]*\)/g) || [surface.backgroundColor];
      return { name, color: style(fg).color, backgrounds };
    });
  });
  for (const sample of samples) {
    const fg = luminance(sample.color);
    const ratios = sample.backgrounds.map(color => {
      const bg = luminance(color);
      return (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
    });
    sample.minimum = Math.min(...ratios);
    assert(sample.minimum >= 4.5, sample.name + " contrast " + sample.minimum);
  }
  return samples;
}

async function assertFullscreen(page, active) {
  await page.waitForFunction(active => {
    const panel = document.querySelector(".reader-panel");
    return (document.fullscreenElement === panel) === active &&
      panel.classList.contains("is-fullscreen") === active;
  }, active);
  assert.equal(await page.locator("#fullscreen-button").textContent(), active ? "Exit fullscreen" : "Fullscreen");
  assert.equal(await page.locator("#fullscreen-exit").isVisible(), active);
}

// Only use this branch when native support is absent or Chrome itself rejected
// the native call. Failure to handle a successful native request remains fatal.
async function firstEntry(page) {
  await page.evaluate(() => {
    const panel = document.querySelector(".reader-panel");
    if (!document.fullscreenEnabled || !panel.requestFullscreen) {
      window.testFullscreenUnavailable = "native API unavailable";
      return;
    }
    const request = panel.requestFullscreen.bind(panel);
    panel.requestFullscreen = async () => {
      try { return await request(); }
      catch (error) { window.testFullscreenUnavailable = String(error); throw error; }
    };
  });
  await page.locator("#fullscreen-button").click();
  const reason = await page.evaluate(() => window.testFullscreenUnavailable || null);
  if (reason) {
    await page.waitForFunction(status => els.status.textContent === status, fallbackStatus);
    await page.evaluate(() => {
      if (state.focusMode) toggleFocusMode();
      let current = null;
      Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: true });
      Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => current });
      els.readerPanel.requestFullscreen = async () => {
        current = els.readerPanel;
        document.dispatchEvent(new Event("fullscreenchange"));
      };
      document.exitFullscreen = async () => {
        current = null;
        document.dispatchEvent(new Event("fullscreenchange"));
      };
    });
    await page.locator("#fullscreen-button").click();
  }
  await assertFullscreen(page, true);
  return reason ? "stub after " + reason : "native";
}

async function portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme }) {
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
      await isolated("W4.6 privacy paragraph and W7.7 ruled copy are exact", async page => {
        assert.equal(await page.locator(".privacy-note").textContent(), "Files are read in your browser and never uploaded. Links you load are fetched through WordFlow's proxy on Cloudflare. Cloudflare and the website you load can see the request, including your IP address. If the proxy fails, your browser contacts the website directly. Nothing is stored except your own resume session in this browser.");
        assert.equal(await page.locator(".ticker strong").textContent(), "TIP");
        assert.equal(await page.locator(".ticker span").textContent(), "Press Space to play or pause. Use the arrow keys to step one word. Press F for fullscreen.");
        assert.deepEqual(await page.locator(".badges > span").evaluateAll(badges => badges.map(b => [...b.children].map(e => e.textContent))), [["NO","UPLOADS"],["100%","FREE"],["PRIVACY","FIRST"]]);
        assert.equal(await page.locator(".tagline").textContent(), "one word at a time");
      });
      await isolated("W7.12 unfitted word sizes equal pre-restyle in normal and focus mode", async page => {
        const comparisonViewport = { width, height: width === 390 ? 844 : 950 };
        const baseContext = await browser.newContext({ viewport: comparisonViewport, colorScheme });
        try {
          const base = await baseline(baseContext, origin, root, "2a376445ceb1b98a1b4c943cf8834e77e0578120");
          await page.setViewportSize(comparisonViewport);
          details.baseSizes = [];
          for (const focus of [false,true]) for (const size of ["large","comfortable","compact"]) {
            const fonts = [];
            for (const p of [base,page]) {
              await prepare(p,"Hi",{focus,size});
              fonts.push(await p.locator("#word-display").evaluate(el => {
                if (el.style.fontSize || el.classList.contains("fitted-long-word")) throw new Error("short control word was fitted");
                return getComputedStyle(el).fontSize;
              }));
            }
            assert.equal(fonts[1],fonts[0],JSON.stringify({width,focus,size,fonts}));
            details.baseSizes.push({viewport:comparisonViewport,focus,size,baseline:fonts[0],candidate:fonts[1]});
          }
        } finally { await baseContext.close(); }
        await page.setViewportSize(viewport);
        await page.evaluate(() => { if(state.focusMode)toggleFocusMode(); setWordSize("comfortable"); });
      });
      await isolated("W7.4 saves after both theme directions preserve the exact resume schema and values", async page => {
        const saved = () => page.evaluate(() => ({storageKeys:Object.keys(localStorage).sort(),record:JSON.parse(localStorage.getItem("wordflow-reader-session-v1"))}));
        const before = await saved();
        let previous=before;
        let wpm=before.record.wpm,index=before.record.index,lastSavedAt=before.record.savedAt;
        details.themeSaves=[];
        for (const direction of [1,2]) {
          await page.locator("#theme-button").click();
          assert.deepEqual(await saved(),previous);
          for (const action of ["stepper","seek","word step"]) {
            if(action==="stepper") {await page.locator("#faster-button").click();wpm=Math.min(900,wpm+25);}
            if(action==="seek") {index=4;await page.locator("#progress-slider").evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}));},index);}
            if(action==="word step") {await page.locator("#next-button").click();index++;}
            const after=await saved();
            assert.deepEqual(after.storageKeys,["wordflow-reader-session-v1"]);
            assert.deepEqual(Object.keys(after.record).sort(),sessionFields);
            const expected={...before.record,wpm,index,savedAt:after.record.savedAt};
            assert.deepEqual(after.record,expected,"theme leaked or an unrelated session value changed after "+action);
            assert.equal(typeof after.record.savedAt,"number");assert(after.record.savedAt>=lastSavedAt);lastSavedAt=after.record.savedAt;
            details.themeSaves.push({direction,action,...after});previous=after;
          }
        }
      });
      await isolated("W7.13 reader heading, fullscreen icon and frame fit from 310 px", async page => {
        details.narrowWidths=[];
        for(const w of [310,320,340,360,375])for(const focus of [false,true]){
          await page.setViewportSize({width:w,height:844});
          await page.evaluate(focus=>{if(state.focusMode!==focus)toggleFocusMode();window.scrollTo(0,0);},focus);
          await settle(page);
          const bounds=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
            elements:[".reader-heading","#reader-fullscreen",".reader-frame"].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {selector,left:r.left,right:r.right,width:r.width};})}));
          assert(bounds.scrollWidth<=w,JSON.stringify(bounds));
          for(const e of bounds.elements)assert(e.width>0&&e.left>=0&&e.right<=w,JSON.stringify(e));
          details.narrowWidths.push({focus,...bounds});
        }
        await page.evaluate(()=>{if(state.focusMode)toggleFocusMode();});
        await page.setViewportSize(viewport);await settle(page);
      });
      await isolated("W7.5 fullscreen refit is already stable and meets the floor-aware target", async page => {
        await page.setViewportSize({width,height:width===390?844:950});
        await prepare(page,realWord,{size:"comfortable"});
        await page.locator("#fullscreen-button").click();
        await assertFullscreen(page,true);
        await settle(page);
        const before=await measure(page);
        const widths=await page.evaluate(()=>{
          const d=els.wordDisplay,style=d.style.fontSize,classes=d.className;
          const width=()=>{const r=document.createRange();r.selectNodeContents(d);return r.getBoundingClientRect().width;};
          try{d.classList.remove("fitted-long-word","wrapped-long-word","scrolling-long-word");d.style.fontSize="";const unfitted=width();d.style.fontSize="10px";return {unfitted,floor:width()};}
          finally{d.className=classes;d.style.fontSize=style;}
        });
        assert(widths.unfitted>before.frame.clientWidth,"fixture must require fullscreen fitting: "+JSON.stringify({widths,frame:before.frame.clientWidth}));
        assert(before.classes.split(" ").includes("fitted-long-word"),"fullscreen entry must fit before any explicit refit");
        await page.evaluate(()=>fitDisplayedWord());await settle(page);
        const after=await measure(page);
        assert.deepEqual(after,before,"fullscreenchange left a stale fit");
        const font=parseFloat(before.font);
        if(font>10)assert(before.contentWidth<=.9*before.frame.clientWidth);
        else{
          assert.equal(font,10);assert.equal(before.wrapped,widths.floor>before.frame.clientWidth);
          if(before.wrapped)assert(before.contentWidth<=before.word.width+1/64);
          else assert.equal(before.contentWidth,widths.floor);
        }
        assert(before.ink.fullyVisible);await checkTokenLayout(page);
        details.fullscreenRefit={before,after,widths};
        await page.evaluate(()=>document.exitFullscreen());await assertFullscreen(page,false);
        await page.setViewportSize(viewport);
      });
  } finally {
    fs.writeFileSync(path.join(out, "portal-regressions-" + width + "-" + colorScheme + ".json"), JSON.stringify(details, null, 2) + "\n");
  }
}

async function portalChecks({ browser, origin, width, verify, out, root, newChecksOrder = "before" }) {
  assert(["before", "after"].includes(newChecksOrder), "unknown new-check order");
  const viewport = { width, height: width === 390 ? 844 : 900 };
  const screens = path.join(root, "docs/verification/results/w7-restyle/screens");
  fs.mkdirSync(screens, { recursive: true });
  for (const colorScheme of ["dark", "light"]) {
    if (newChecksOrder === "before") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });
    const context = await browser.newContext({ viewport, screen: viewport, colorScheme });
    const errors = [], blocked = [], uploads = [];
    const details = { viewport, colorScheme, screenshots: [] };
    const check = (name, fn) => verify("W7 " + width + " " + colorScheme + " " + name, fn);
    try {
      await context.route("**/*", route => {
        if (new URL(route.request().url()).origin === origin) return route.continue();
        blocked.push(route.request().url());
        return route.abort();
      });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
      page.on("request", request => { if (request.method() === "POST") uploads.push(request.url()); });
      const capture = async name => {
        const file = [width, colorScheme, name].join("-") + ".png";
        await page.screenshot({ path: path.join(screens, file) });
        details.screenshots.push(file);
      };
      await page.goto(origin, { waitUntil: "networkidle" });
      await check("CSP, accessible heading and icon buttons", async () => {
        assert.equal(await page.getByRole("heading", { level: 1, name: "WordFlow Reader", exact: true }).count(), 1);
        const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
        const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
        assert(!/(?:https?:)?\/\//i.test(html + css), "external URL");
        const unsafe = await page.evaluate(html => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          return !!doc.querySelector("[style], style") || [...doc.scripts].some(s => s.textContent.trim()) ||
            [...doc.querySelectorAll("*")].some(el => [...el.attributes].some(a => /^on/i.test(a.name)));
        }, html);
        assert.equal(unsafe, false);
        assert(await page.locator("button").evaluateAll(bs =>
          bs.filter(b => !b.textContent.trim()).every(b => !!b.getAttribute("aria-label"))));
      });
      await page.locator("#sample-button").click();
      await page.locator("#source-review").scrollIntoViewIfNeeded();
      await capture("review");
      await page.locator("#apply-source-button").click();
      await page.locator("#review-back-button").click();
      await page.evaluate(() => { seekTo(2); window.scrollTo(0, 0); });
      await check("system theme, manual choice and resume fields", async () => {
        const root = page.locator("html"), button = page.locator("#theme-button");
        const other = colorScheme === "dark" ? "light" : "dark";
        const theLabel = scheme => scheme === "dark" ? "Lights on" : "Lights off";
        const bg = () => page.locator(".app-shell").evaluate(el => getComputedStyle(el).backgroundColor);
        const expected = scheme => scheme === "dark" ? "rgb(36, 39, 44)" : "rgb(241, 245, 236)";
        assert.equal(await root.getAttribute("data-theme"), null);
        assert.equal(await bg(), expected(colorScheme));
        assert.equal(await button.textContent(), theLabel(colorScheme));
        await page.emulateMedia({ colorScheme: other });
        await page.waitForFunction(label => els.themeButton.textContent === label, theLabel(other));
        assert.equal(await bg(), expected(other));
        assert.equal(await root.getAttribute("data-theme"), null);
        await page.emulateMedia({ colorScheme });
        await page.waitForFunction(label => els.themeButton.textContent === label, theLabel(colorScheme));
        const stored = () => page.evaluate(() => ({ ...localStorage }));
        const before = await stored();
        assert.deepEqual(Object.keys(before), ["wordflow-reader-session-v1"]);
        assert.deepEqual(Object.keys(JSON.parse(before["wordflow-reader-session-v1"])).sort(), sessionFields);
        await button.click();
        assert.equal(await root.getAttribute("data-theme"), other);
        assert.equal(await bg(), expected(other));
        assert.equal(await button.getAttribute("aria-label"), "Switch to " + colorScheme + " theme");
        assert.equal(await button.textContent(), theLabel(other));
        assert.equal(await button.getAttribute("aria-pressed"), null);
        await button.click();
        assert.deepEqual(await stored(), before);
      });
      await check("contrast and page width", async () => {
        details.contrast = await contrast(page);
        details.overflow = [];
        for (const [w, h] of [[390,844],[768,1024],[1400,900],[1920,1080]]) {
          await page.setViewportSize({ width: w, height: h });
          await settle(page);
          const actual = await page.evaluate(() => document.documentElement.scrollWidth);
          details.overflow.push({ width: w, height: h, scrollWidth: actual });
          assert(actual <= w, "horizontal overflow at " + w);
        }
        await page.setViewportSize(viewport);
        await settle(page);
      });
      await page.evaluate(() => window.scrollTo(0, 0));
      await capture("normal");
      await page.locator("#focus-mode-button").click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await capture("focus");
      await page.locator("#focus-mode-button").click();
      await check("F ignores editable controls and modifiers", async () => {
        for (const [tab, field] of [["#tab-paste","#text-input"],["#tab-url","#url-input"]]) {
          await page.locator(tab).click();
          await page.locator(field).focus();
          await page.keyboard.press("f");
          await assertFullscreen(page, false);
          assert((await page.locator(field).inputValue()).endsWith("f"));
        }
        await page.locator("#tab-paste").click();
        for (const key of ["Control+f","Alt+f","Meta+f"]) {
          await page.locator("#play-button").focus();
          await page.keyboard.press(key);
          await assertFullscreen(page, false);
        }
      });
      await check("three fullscreen entries and three exits", async () => {
        details.fullscreen = await firstEntry(page);
        await page.keyboard.press("f");
        await assertFullscreen(page, false);
        await page.locator("#reader-fullscreen").click();
        await assertFullscreen(page, true);
        await page.locator("#fullscreen-exit").click();
        await assertFullscreen(page, false);
        await page.locator("#play-button").focus();
        await page.keyboard.press("Shift+f");
        await assertFullscreen(page, true);
        await page.evaluate(() => document.exitFullscreen());
        await assertFullscreen(page, false);
      });
      await page.locator("#fullscreen-button").click();
      await assertFullscreen(page, true);
      await check("WPM readout, step and clamps", async () => {
        for (const [initial, id, expected] of [[300,"slower",275],[275,"faster",300],[110,"slower",100],[895,"faster",900]]) {
          await page.evaluate(w => setWpm(w), initial);
          await page.locator("#fullscreen-" + id).click();
          assert.equal(await page.evaluate(() => state.wpm), expected);
          assert.equal(await page.locator("#reader-wpm").textContent(), expected + " WPM");
        }
        await page.evaluate(() => setWpm(300));
      });
      await capture("fullscreen-paused");
      await check("idle controls only while playing and keyboard reveal", async () => {
        const bar = page.locator(".reader-controls");
        await page.waitForTimeout(2750);
        assert(await bar.isVisible());
        await page.locator("#play-button").click();
        assert(await page.evaluate(() => state.countdownActive));
        assert(await bar.isVisible());
        await page.waitForFunction(() => state.playing);
        await bar.waitFor({ state: "hidden" });
        assert.equal(await page.locator(".reader-heading").isVisible(), false);
        assert(await page.evaluate(() => getComputedStyle(els.readerPanel).cursor === "none"));
        assert(await page.evaluate(() => {
          els.playButton.focus();
          return document.activeElement !== els.playButton;
        }));
        await capture("fullscreen-playing");
        await page.keyboard.press("Shift");
        await bar.waitFor({ state: "visible" });
        await page.keyboard.press("Space");
        assert.equal(await page.evaluate(() => state.playing), false);
        assert(await bar.isVisible());
      });
      await check("fullscreen F1 geometry and playback", async () => {
        details.tokens = [];
        for (const token of [realWord, "W".repeat(2000)]) {
          await page.evaluate(token => {
            loadText("Lead " + token + " Tail End.", "Reader fixture", "Reader fixture");
            setWpm(100);
            startReading();
          }, token);
          await page.waitForFunction(() => state.index === 1);
          await settle(page);
          const m = await measure(page);
          await checkTokenLayout(page);
          assert.equal(m.scrolling, m.wrapped && m.naturalHeight > m.threshold);
          assert.equal(m.playing, !m.scrolling);
          assert.equal(await page.locator("#word-display").textContent(), token);
          details.tokens.push({ length: token.length, font: m.font, wrapped: m.wrapped, scrolling: m.scrolling,
            playing: m.playing, frame: m.frame, naturalHeight: m.naturalHeight, freeHeight: m.threshold });
          if (m.scrolling) {
            await page.locator("#play-button").click();
            assert.equal(await page.evaluate(() => state.index), 2);
          }
          await page.evaluate(() => pause());
        }
      });
      await page.evaluate(() => document.exitFullscreen());
      await assertFullscreen(page, false);
      await page.evaluate(() => {
        loadText("One word at a time.", "Sample", "Sample text");
        seekTo(state.words.length - 1);
        completeReading();
        window.scrollTo(0, 0);
      });
      await settle(page);
      await capture("finished");
      await check("reload and unsupported or refused API fallback", async () => {
        await page.reload();
        await assertFullscreen(page, false);
        assert.equal(await page.locator("html").getAttribute("data-theme"), null);
        await page.evaluate(() => {
          for (const key of ["fullscreenEnabled","webkitFullscreenEnabled"]) {
            Object.defineProperty(document, key, { configurable: true, value: false });
          }
        });
        await page.locator("#fullscreen-button").click();
        assert.equal(await page.evaluate(() => state.focusMode), true);
        assert.equal(await page.locator("#reader-status").textContent(), fallbackStatus);
        await page.reload();
        await page.evaluate(() => {
          Object.defineProperty(document, "fullscreenEnabled", { value: true });
          els.readerPanel.requestFullscreen = async () => { throw new Error("Test refusal"); };
        });
        await page.locator("#fullscreen-button").click();
        await page.waitForFunction(status => els.status.textContent === status, fallbackStatus);
        assert.equal(await page.evaluate(() => state.focusMode), true);
      });
      await check("offline, no uploads and no runtime errors", () => {
        assert.deepEqual(errors, []); assert.deepEqual(blocked, []); assert.deepEqual(uploads, []);
      });
    } finally {
      fs.writeFileSync(path.join(out, "portal-" + width + "-" + colorScheme + ".json"), JSON.stringify(details, null, 2) + "\n");
      await context.close();
    }
    if (newChecksOrder === "after") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });
  }
}

module.exports = { portalChecks };
