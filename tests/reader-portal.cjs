"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { checkTokenLayout, settle } = require("./reader-smoke.cjs");
const { measure } = require("./reader-round2.cjs");

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

async function portalChecks({ browser, origin, width, verify, out, root }) {
  const viewport = { width, height: width === 390 ? 844 : 900 };
  const screens = path.join(root, "docs/verification/results/w7-restyle/screens");
  fs.mkdirSync(screens, { recursive: true });
  for (const colorScheme of ["dark", "light"]) {
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
  }
}

module.exports = { portalChecks };
