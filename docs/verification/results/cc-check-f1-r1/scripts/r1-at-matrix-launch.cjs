"use strict";
// CC check of R-1 under W6.13/W6.14: the Finished screen, branch vs master, with my own measurements.
// Reuses only tests/helpers.cjs start() and tests/browser-helper.cjs launch() (through lib.cjs).
// Each case uses freshly reloaded master and branch pages with the same history, production CSS,
// and separate browser contexts so both stay foreground. No normalisation of any attribute.
// Usage: node r1.cjs <matrix|spot> [--natural-only|--direct-only]
const L = require("./lib.cjs");
const MODE = process.argv[2] || "matrix";
const OUT = L.path.join(L.OUT, "r1-" + MODE); L.fs.mkdirSync(OUT, { recursive: true });
const LAYOUTS = [[390, 844, false], [390, 600, false], [844, 390, false], [1400, 950, false], [1708, 950, false],
  [1920, 1080, false], [996, 950, true], [1400, 950, true], [390, 844, true]];
const NO = "Menneskerettighetene";
const TOKENS = ["understanding.", "kommunikasjon.", "Kommune.", "here.", "Tail", "Bærekraftig.", "Arbeidsmiljøloven.",
  "Høyesterettsadvokat.", "Kommunikasjonsmiddel.", "Menneskerettighetene.", "responsibility.", "Telecommunications.",
  "Internationalization.", "Misunderstanding.", L.REAL45, "W".repeat(135), "W".repeat(2000), NO.repeat(40), NO.repeat(400)];
const SPOT_TOKENS = ["understanding.", "kommunikasjon.", "Kommune.", "here.", "Kommunikasjonsmiddel.", "Telecommunications.",
  L.REAL45, "W".repeat(135), "W".repeat(2000), NO.repeat(400)];
const norsk = (t) => /[æøå]|^kommun|^Kommun|^Menneske|^Arbeids|^Høyeste|^Bære/.test(t);
const label = (t) => t.length > 45 ? (t[0] === "W" ? "W" : "NO") + "x" + t.length : t;

let configs;
if (MODE === "matrix") {
  configs = [];
  for (const [w, h, f] of LAYOUTS) for (const size of ["comfortable", "large"]) configs.push({ w, h, focusMode: f, size, letter: true, context: true, tokens: TOKENS });
} else if (MODE === "test") {
  configs = [{ w: 390, h: 844, focusMode: false, size: "comfortable", letter: true, context: true, tokens: ["understanding.", "Tail", "W".repeat(2000)] },
    { w: 844, h: 390, focusMode: false, size: "large", letter: true, context: true, tokens: ["Kommunikasjonsmiddel.", "W".repeat(2000)] },
    { w: 1708, h: 950, focusMode: false, size: "comfortable", letter: true, context: true, tokens: [L.REAL45] }];
} else {
  configs = [];
  for (const [w, h, f] of [[390, 844, false], [1400, 950, false], [1920, 1080, false], [996, 950, true]]) for (const size of ["comfortable", "large"])
    configs.push({ w, h, focusMode: f, size, letter: false, context: true, tokens: SPOT_TOKENS });
  for (const [w, h, f] of [[390, 844, false], [844, 390, false], [1400, 950, false], [1708, 950, false], [390, 844, true]])
    configs.push({ w, h, focusMode: f, size: "compact", letter: true, context: true, tokens: SPOT_TOKENS });
  for (const [w, h, f] of [[390, 844, false], [1400, 950, false]]) configs.push({ w, h, focusMode: f, size: "compact", letter: false, context: false, tokens: SPOT_TOKENS });
}

// Everything the Finished screen exposes about the word, the panel and the controls.
async function snap(page) {
  const m = await L.measure(page);
  const extra = await page.evaluate(() => {
    const d = els.wordDisplay, panel = els.finishSummary, R = (b) => ({ left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height });
    const controls = [...document.querySelectorAll("button,input,select,textarea,a[href]")].filter((e) => {
      const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden]");
    }).map((e) => ({ id: e.id || e.className, rect: R(e.getBoundingClientRect()) }));
    return {
      inert: d.inert, inertAttr: d.hasAttribute("inert"), tabindex: d.getAttribute("tabindex"), role: d.getAttribute("role"), ariaLabel: d.getAttribute("aria-label"),
      describedby: d.getAttribute("aria-describedby"), noteHidden: els.longTextNote?.hidden ?? true, overflow: getComputedStyle(d).overflow,
      pointerEvents: getComputedStyle(d).pointerEvents, finished: state.finished, playing: state.playing, countdown: state.countdownActive,
      status: els.status.textContent, panelHidden: panel.hidden, panel: R(panel.getBoundingClientRect()), pauseWhileFinished: window.__pf ?? 0,
      frameRect: R(d.closest(".reader-frame").getBoundingClientRect()), controls, active: document.activeElement.id || document.activeElement.tagName
    };
  });
  return { ...m, ...extra };
}

// Frame region (+30 px margin, trimmed to the viewport) with and without the word painted.
// Viewport capture only: a fullPage capture emulates a resize, which fires the app's resize
// handler and refits the word. If the frame is not fully in view, the document is scrolled and
// then restored. Rectangles are re-measured at capture time (viewport coordinates).
async function frameShot(page, hideWord = false) {
  // Park the pointer away from every control and let the buttons' 120 ms hover transitions finish.
  await page.mouse.move(0, 0); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const f = els.wordDisplay.closest(".reader-frame"), orig = scrollY; let b = f.getBoundingClientRect();
    if (b.top < 0 || b.bottom > innerHeight) { window.scrollTo(0, Math.max(0, b.top + scrollY - Math.max(0, (innerHeight - b.height) / 2))); b = f.getBoundingClientRect(); }
    const R = (x, e) => { const k = e ? (parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0) + 2 : 0; return { left: x.left + k, top: x.top + k, right: x.right - k, bottom: x.bottom - k, inset: k }; };
    const inner = { left: b.left + f.clientLeft, top: b.top + f.clientTop }; inner.right = inner.left + f.clientWidth; inner.bottom = inner.top + f.clientHeight;
    const controls = [...document.querySelectorAll("button,input,select,textarea,a[href]")].filter((e) => { const q = e.getBoundingClientRect(); return q.width && q.height && getComputedStyle(e).visibility !== "hidden" && !e.closest("[hidden]"); })
      .map((e) => ({ id: e.id || e.className, rect: R(e.getBoundingClientRect(), e) }));
    return { x: b.left, y: b.top, w: b.width, h: b.height, orig, vw: innerWidth, vh: innerHeight, inner, panel: R(els.finishSummary.getBoundingClientRect(), els.finishSummary), panelBox: R(els.finishSummary.getBoundingClientRect()), panelHidden: els.finishSummary.hidden, controls };
  });
  const clip = { x: Math.max(0, Math.floor(r.x - 30)), y: Math.max(0, Math.floor(r.y - 30)) };
  clip.width = Math.min(r.vw, Math.ceil(r.x + r.w + 30)) - clip.x; clip.height = Math.min(r.vh, Math.ceil(r.y + r.h + 30)) - clip.y;
  // Hide the word with a Web Animation: it never touches the style attribute and is allowed under the CSP.
  const prev = hideWord ? await page.evaluate(() => { const d = els.wordDisplay, p = d.outerHTML; window.__ccAnim = d.animate([{ visibility: "hidden" }, { visibility: "hidden" }], { duration: 1e7 }); return p; }) : null;
  await L.settle(page);
  const png = await page.screenshot({ clip });
  if (hideWord) { const ok = await page.evaluate((prev) => { window.__ccAnim.cancel(); delete window.__ccAnim; return els.wordDisplay.outerHTML === prev ? true : "changed"; }, prev); if (ok !== true) throw new Error("word DOM changed during hidden capture"); }
  await page.evaluate((y) => window.scrollTo(0, y), r.orig); await L.settle(page);
  return { png, clip, at: r };
}

// Decode two PNGs in a scratch page; report differing pixels, their bounding box and per-region maxima.
async function diff(tool, a, b, origin, regions = {}) {
  return tool.evaluate(async ({ a, b, origin, regions }) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sameSize: false };
    const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia), db = px(ib), W = ia.width; let n = 0, max = 0; const box = { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 };
    const reg = Object.fromEntries(Object.keys(regions).map((k) => [k, { n: 0, max: 0 }]));
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
      if (!d) continue;
      n++; if (d > max) max = d; const x = (i / 4) % W + origin.x, y = Math.floor(i / 4 / W) + origin.y;
      box.left = Math.min(box.left, x); box.right = Math.max(box.right, x + 1); box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y + 1);
      for (const [k, r] of Object.entries(regions)) if (x >= r.left && x + 1 <= r.right && y >= r.top && y + 1 <= r.bottom) { reg[k].n++; if (d > reg[k].max) reg[k].max = d; }
    }
    return { sameSize: true, differingPixels: n, maxDelta: max, bbox: n ? box : null, regions: reg };
  }, { a: a.toString("base64"), b: b.toString("base64"), origin, regions });
}

// Paint check for the branch: which pixels the word paints, and whether any lie outside the inner frame
// or above the panel/controls (a word beneath the 96%-opaque panel changes its pixels by at most ~4%).
async function paintCheck(tool, page) {
  const on = await frameShot(page), off = await frameShot(page, true);
  if (JSON.stringify(on.clip) !== JSON.stringify(off.clip)) throw new Error("capture regions differ");
  const inner = on.at.inner, regions = { panel: on.at.panelHidden ? { left: 0, top: 0, right: 0, bottom: 0 } : on.at.panel };
  for (const c of on.at.controls) {
    const r = c.rect; if (r.right <= inner.left || r.left >= inner.right || r.bottom <= inner.top || r.top >= inner.bottom) continue;
    regions["ctl:" + c.id] = r;
  }
  const d = await diff(tool, on.png, off.png, { x: on.clip.x, y: on.clip.y }, { ...regions, panelBox: on.at.panelHidden ? { left: 0, top: 0, right: 0, bottom: 0 } : on.at.panelBox });
  d.uncovered = d.differingPixels - d.regions.panelBox.n; delete regions.panelBox;
  const outside = d.bbox && (d.bbox.left < Math.floor(inner.left) || d.bbox.right > Math.ceil(inner.right) || d.bbox.top < Math.floor(inner.top) || d.bbox.bottom > Math.ceil(inner.bottom));
  const above = Object.entries(d.regions).filter(([k, v]) => k !== "panelBox" && v.max > 16).map(([k, v]) => k + ":" + v.max);
  return { painted: d.differingPixels, uncovered: d.uncovered, bbox: d.bbox, inner, clip: on.clip, outside: !!outside, regions: d.regions, aboveAny: above, png: on.png };
}

async function restartSnap(page, sel) {
  return page.evaluate((sel) => {
    document.querySelector(sel).click();
    const d = els.wordDisplay, r = d.getBoundingClientRect();
    return { index: state.index, finished: state.finished, playing: state.playing, countdown: state.countdownActive, countdownValue: state.countdownValue,
      status: els.status.textContent, word: d.outerHTML, font: getComputedStyle(d).fontSize, rect: [r.left, r.top, r.width, r.height],
      panelHidden: els.finishSummary.hidden, play: els.playButton.outerHTML, note: els.longTextNote?.hidden ?? true, scrollY };
  }, sel);
}
async function settledSnap(page) {
  await L.settle(page); await L.settle(page);
  return page.evaluate(() => {
    const d = els.wordDisplay, r = d.getBoundingClientRect();
    return { index: state.index, countdown: state.countdownActive, word: d.outerHTML, font: getComputedStyle(d).fontSize, rect: [r.left, r.top, r.width, r.height],
      classes: d.className, inert: d.inert, note: els.longTextNote?.hidden ?? true, frame: d.closest(".reader-frame").className, scrollY, status: els.status.textContent };
  });
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const firstDiff = (a, b) => Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));

// Restart through both controls; compare with master unnormalised, immediately and after settling.
async function restarts(mp, bp) {
  const out = {};
  for (const sel of ["#finish-restart-button", "#play-button"]) {
    const [a, b] = await Promise.all([restartSnap(mp, sel), restartSnap(bp, sel)]);
    const [sa, sb] = await Promise.all([settledSnap(mp), settledSnap(bp)]);
    const r = { immediate: eq(a, b), settled: eq(sa, sb), immediateDiff: firstDiff(a, b), settledDiff: firstDiff(sa, sb), index: b.index, countdownValue: b.countdownValue, status: b.status };
    // Classify (not normalise): differences that are exactly an empty style attribute on one side.
    const strip = (o) => ({ ...o, word: o.word.replace(' style=""', "") });
    r.emptyStyleOnly = (!r.immediate || !r.settled) && eq(strip(a), strip(b)) && eq(strip(sa), strip(sb));
    if (r.emptyStyleOnly) r.emptyStyleSide = [a.word.includes(' style=""') ? "master" : "", b.word.includes(' style=""') ? "branch" : ""].filter(Boolean).join("+");
    if (!r.immediate) r.detail = { master: a, branch: b };
    if (sel === "#play-button") {
      // Let the countdown run to the first word on both, then pause and compare the reading display.
      await Promise.all([mp, bp].map((p) => p.waitForFunction(() => state.playing && !state.countdownActive && state.index === 0, null, { timeout: 10000 })));
      await Promise.all([mp, bp].map((p) => p.evaluate(() => pause())));
      const [fa, fb] = await Promise.all([settledSnap(mp), settledSnap(bp)]);
      r.firstWord = eq(fa, fb); r.firstWordDiff = firstDiff(fa, fb); r.firstWordEmptyStyleOnly = !r.firstWord && eq(strip(fa), strip(fb));
    }
    out[sel === "#play-button" ? "play" : "restart"] = r;
    if (sel !== "#play-button") {
      await Promise.all([mp, bp].map((p) => p.evaluate(() => { seekTo(state.words.length - 1); completeReading(); })));
      await L.settle(mp); await L.settle(bp); await L.settle(mp); await L.settle(bp);
    }
  }
  return out;
}

// Inertness probes for a scroll-state last word on the branch's Finished screen.
async function inertProbes(page) {
  const offset = () => page.evaluate(() => { const d = els.wordDisplay, b = d.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(d); const t = r.getBoundingClientRect(); return { dy: t.top - b.top, scrollTop: d.scrollTop, scrollY }; });
  const res = {}; const start = await offset();
  await page.evaluate(() => document.activeElement.blur());
  let hit = false; for (let i = 0; i < 60; i++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement === els.wordDisplay)) hit = true; }
  for (let i = 0; i < 20; i++) { await page.keyboard.press("Shift+Tab"); if (await page.evaluate(() => document.activeElement === els.wordDisplay)) hit = true; }
  res.tabReachedWord = hit;
  res.programmaticFocus = await page.evaluate(() => { els.wordDisplay.focus(); return document.activeElement === els.wordDisplay; });
  await page.evaluate(() => document.activeElement.blur());
  const before = await offset();
  await page.evaluate(() => { const d = els.wordDisplay; d.scrollTop = 300; d.scrollTo(0, 500); d.scrollBy(0, 200); d.lastElementChild?.scrollIntoView?.({ block: "end" }); });
  const prog = await offset(); res.programmaticScroll = { before, after: prog, moved: prog.dy !== before.dy || prog.scrollTop !== 0 };
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await page.evaluate(() => { const b = els.wordDisplay.getBoundingClientRect(); return { x: (b.left + b.right) / 2, y: Math.min(b.bottom - 4, innerHeight - 4) }; });
  const w0 = await offset(); await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 400); await L.settle(page); await L.settle(page);
  const w1 = await offset(); res.wheel = { before: w0, after: w1, moved: w1.dy !== w0.dy || w1.scrollTop !== 0 };
  res.hitAtCentre = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? (e.id || e.className) : null; }, box);
  for (const k of ["ArrowDown", "PageDown", "End"]) await page.keyboard.press(k);
  const k1 = await offset(); res.keys = { moved: k1.dy !== start.dy || k1.scrollTop !== 0 };
  res.stillFinished = await page.evaluate(() => state.finished && !state.playing && !state.countdownActive);
  await page.evaluate(() => window.scrollTo(0, 0));
  res.ok = !res.tabReachedWord && !res.programmaticFocus && !res.programmaticScroll.moved && !res.wheel.moved && !res.keys.moved && res.stillFinished;
  return res;
}

const instrument = (p) => p.evaluate(() => { window.__pf = 0; const o = pause; pause = function () { if (state.finished) window.__pf++; return o.apply(this, arguments); }; });

async function newPair(browser, s, cfg) {
  const vp = { viewport: { width: cfg.w, height: cfg.h } };
  const [mc, bc] = [await browser.newContext(vp), await browser.newContext(vp)];
  const [mp, bp] = [await mc.newPage(), await bc.newPage()];
  await mp.goto(s.master, { waitUntil: "networkidle" }); await bp.goto(s.branch, { waitUntil: "networkidle" });
  return { mp, bp, close: async () => { await mc.close(); await bc.close(); } };
}
async function fresh(p) { await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); }

async function natural(p, cfg, tok) {
  await fresh(p);
  if (cfg.focusMode) await p.locator("#focus-mode-button").click();
  await p.locator(`.segment[data-size="${cfg.size}"]`).click();
  if (!cfg.letter) await p.evaluate(() => { const t = els.focusToggle; t.checked = false; t.dispatchEvent(new Event("change", { bubbles: true })); });
  if (!cfg.context) await p.evaluate(() => { const t = els.contextToggle; t.checked = false; t.dispatchEvent(new Event("change", { bubbles: true })); });
  await p.locator("#text-input").fill((norsk(tok) ? "Vi leser om " : "We read about ") + tok);
  await p.locator("#load-text-button").click(); await p.locator("#apply-source-button").click(); await p.locator("#review-back-button").click();
  await p.locator("#wpm-slider").evaluate((el) => { el.value = "900"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  await instrument(p); await p.evaluate(() => window.scrollTo(0, 0));
  await p.locator("#play-button").click();
  await p.waitForFunction(() => state.finished || (!state.playing && !state.countdownActive && state.index === state.words.length - 1), null, { timeout: 30000 });
  await L.settle(p); await L.settle(p);
  let reading = null, plays = 1;
  if (!(await p.evaluate(() => state.finished))) {
    reading = await snap(p); plays++;
    await p.locator("#play-button").click(); await p.waitForFunction(() => state.finished, null, { timeout: 10000 });
  }
  await L.settle(p); await L.settle(p);
  await p.evaluate(() => window.scrollTo(0, 0)); await L.settle(p);
  return { reading, plays, words: await p.evaluate(() => state.words.length) };
}
async function direct(p, cfg, tok) {
  await fresh(p);
  await L.prepare(p, tok, { text: "Lead " + tok, index: 1, size: cfg.size, letter: cfg.letter, context: cfg.context, focusMode: cfg.focusMode });
  await instrument(p);
  const reading = await snap(p);
  await p.evaluate(() => completeReading()); await L.settle(p); await L.settle(p);
  return { reading, plays: 0 };
}

async function runCase(tool, pair, cfg, tok, kind) {
  const { mp, bp } = pair;
  const [rm, rb] = await Promise.all([kind === "natural" ? natural(mp, cfg, tok) : direct(mp, cfg, tok), kind === "natural" ? natural(bp, cfg, tok) : direct(bp, cfg, tok)]);
  const [a, b] = [await snap(mp), await snap(bp)];
  const row = { kind, viewport: cfg.w + "x" + cfg.h, focusMode: cfg.focusMode, size: cfg.size, letter: cfg.letter, context: cfg.context, token: label(tok),
    plays: [rm.plays, rb.plays], readingScroll: !!(rb.reading && rb.reading.scrolling), masterVisible: a.fullyInside, masterFont: a.font, branchFont: b.font };
  const errs = [];
  // Ruled state on the branch's Finished screen.
  if (!b.finished || b.playing || b.countdown || b.status !== "Finished") errs.push("not finished/Finished status");
  if (!b.noteHidden) errs.push("note shown");
  if (b.pauseWhileFinished) errs.push("pause() called while finished");
  if (b.marker !== null) errs.push("pause marker present");
  if (b.textRect && b.text !== tok) errs.push("text changed");
  if (b.panelHidden || !eq(b.panel, a.panel) || !eq(b.frameRect, a.frameRect)) errs.push("panel/frame differs from master");
  if (b.scrolling) {
    if (!b.inert || !b.inertAttr || b.tabindex !== null || b.role !== null || b.ariaLabel !== null || b.describedby !== null) errs.push("scroll word not inert/attrs present");
    if (b.overflow !== "clip" || b.pointerEvents !== "none") errs.push("scroll word overflow/pointer not clipped");
  } else if (b.inert || b.tabindex !== null || b.role !== null || b.describedby !== null) errs.push("non-scroll word carries scroll attributes");
  if (rb.reading && rb.reading.scrolling) {
    if (!b.scrolling) errs.push("reading scroll state lost on finish");
    else {
      // Document coordinates: Playwright's click may scroll the page (landscape) before the reading snapshot.
      const doc = (m) => ({ left: m.word.left + 0, top: m.word.top + m.scrollY, width: m.word.width, height: m.word.height });
      if (!eq(doc(b), doc(rb.reading))) errs.push("scroll geometry changed on finish");
      row.scrollGeometry = { reading: doc(rb.reading), finished: doc(b) };
    }
    row.areaClientWidth = [rb.reading.area.clientW, b.area.clientW];
  }
  // Master-visible → identical (DOM, font, geometry) and pixel comparison with production CSS.
  if (a.fullyInside) {
    for (const k of ["font", "styleAttr", "classes", "outerHTML", "word", "textRect", "frameClasses", "wrapped", "scrolling"]) if (!eq(a[k], b[k])) errs.push("master-visible differs: " + k);
    const tries = [];
    for (let i = 0; i < 3; i++) {
      const [sa, sb] = [await frameShot(mp), await frameShot(bp)];
      const d = await diff(tool, sa.png, sb.png, { x: 0, y: 0 }); tries.push({ px: d.differingPixels, max: d.maxDelta });
      if (d.differingPixels === 0) break;
      if (i === 0) { L.fs.writeFileSync(L.path.join(OUT, `pxdiff-${row.viewport}-${cfg.size}-${row.token.replace(/\W/g, "")}-m.png`), sa.png); L.fs.writeFileSync(L.path.join(OUT, `pxdiff-${row.viewport}-${cfg.size}-${row.token.replace(/\W/g, "")}-b.png`), sb.png); }
    }
    row.pixels = tries;
    if (tries[tries.length - 1].px !== 0) errs.push("master-visible pixels differ after 3 captures");
  } else {
    // Master-clipped → inside the frame on the branch.
    if (!b.horizInside) errs.push("branch text outside frame horizontally");
    if (!b.scrolling && !b.fullyInside) errs.push("branch text outside frame");
    if (b.scrolling && !(b.word.left >= b.inner.left - 0.001 && b.word.right <= b.inner.right + 0.001 && b.word.top >= b.inner.top - 0.001 && b.word.bottom <= b.inner.bottom + 0.001)) errs.push("scroll aperture outside frame");
  }
  // Paint: no word pixel outside the inner frame; beneath panel and every control inside the frame.
  const pc = await paintCheck(tool, bp, b);
  row.noWordPixels = !pc.painted; // e.g. a short word wholly under the panel's opaque metric boxes
  row.paint = { painted: pc.painted, uncoveredByPanel: pc.uncovered, outside: pc.outside, aboveAny: pc.aboveAny, panelMax: pc.regions.panel.max, panelPixels: pc.regions.panel.n };
  if (pc.outside) errs.push("word paints outside inner frame");
  if (pc.aboveAny.length) errs.push("word painted above " + pc.aboveAny.join(","));
  if (MODE === "matrix" && kind === "natural" && cfg.size === "comfortable" && cfg.w === 390 && cfg.h === 844 && !cfg.focusMode && ["understanding.", "kommunikasjon.", "W".repeat(2000), NO.repeat(400)].includes(tok)) {
    const name = row.token.replace(/\W/g, "");
    L.fs.writeFileSync(L.path.join(OUT, `finished-390-${name}-branch.png`), pc.png);
    L.fs.writeFileSync(L.path.join(OUT, `finished-390-${name}-master.png`), (await frameShot(mp)).png);
  }
  // Inert probes before restart need a fresh Finished screen afterwards; do restart first on an untouched pair.
  row.scrollY = [a.scrollY, b.scrollY];
  row.restart = await restarts(mp, bp);
  for (const k of ["restart", "play"]) {
    const r = row.restart[k];
    if ((!r.immediate || !r.settled) && !r.emptyStyleOnly) errs.push(k + " differs from master: " + [...r.immediateDiff, ...r.settledDiff].join(","));
    if (k === "play" && !r.firstWord && !r.firstWordEmptyStyleOnly) errs.push("play first word differs: " + r.firstWordDiff.join(","));
  }
  if (b.scrolling) {
    await bp.evaluate(() => { pause(); seekTo(state.words.length - 1); completeReading(); }); await L.settle(bp); await L.settle(bp);
    row.inert = await inertProbes(bp);
    if (!row.inert.ok) errs.push("inert probe failed");
  }
  row.scrolling = b.scrolling; row.wrapped = b.wrapped; row.errors = errs;
  return row;
}

(async () => {
  const s = await L.servers(); const browser = await L.launch(); const rows = [];
  const kinds = process.argv.includes("--natural-only") ? ["natural"] : process.argv.includes("--direct-only") ? ["direct"] : ["direct", "natural"];
  const toolCtx = await browser.newContext(); const tool = await toolCtx.newPage();
  const errors = []; const t0 = Date.now();
  try {
    for (const cfg of configs) {
      const pair = await newPair(browser, s, cfg);
      for (const p of [pair.mp, pair.bp]) { p.on("pageerror", (e) => errors.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); }); p.on("request", (r) => { if (r.method() === "POST") errors.push("POST " + r.url()); }); }
      try {
        for (const tok of cfg.tokens) for (const kind of kinds) {
          let row;
          try { row = await runCase(tool, pair, cfg, tok, kind); } catch (e) { row = { kind, viewport: cfg.w + "x" + cfg.h, size: cfg.size, token: label(tok), errors: ["exception: " + e.message.split("\n")[0]] }; }
          rows.push(row);
          if (row.errors.length) console.log("FAIL", JSON.stringify({ k: row.kind, v: row.viewport, f: cfg.focusMode, s: cfg.size, l: cfg.letter, c: cfg.context, t: row.token, e: row.errors }));
        }
      } finally { await pair.close(); }
      console.log(`${cfg.w}x${cfg.h}${cfg.focusMode ? " focus" : ""} ${cfg.size} letter=${cfg.letter} context=${cfg.context}: ${rows.length} rows, ${Math.round((Date.now() - t0) / 1000)} s`);
      L.fs.writeFileSync(L.path.join(OUT, "rows.json"), JSON.stringify(rows, null, 1));
    }
  } finally { await toolCtx.close(); await browser.close(); await s.close(); }
  const sum = { mode: MODE, rows: rows.length, failing: rows.filter((r) => r.errors.length).length, pageErrors: errors,
    masterVisible: rows.filter((r) => r.masterVisible).length, masterClipped: rows.filter((r) => r.masterVisible === false).length,
    scrolling: rows.filter((r) => r.scrolling).length, wrappedNoScroll: rows.filter((r) => r.wrapped && !r.scrolling).length,
    naturalTwoPlays: rows.filter((r) => r.plays && r.plays[1] === 2).length,
    pixelFirstCaptureDiffs: rows.filter((r) => r.pixels && r.pixels[0].px).map((r) => ({ v: r.viewport, s: r.size, t: r.token, k: r.kind, tries: r.pixels })),
    inertProbes: rows.filter((r) => r.inert).length, inertOk: rows.filter((r) => r.inert && r.inert.ok).length,
    restartExact: rows.filter((r) => r.restart && r.restart.restart.immediate && r.restart.restart.settled && r.restart.play.immediate && r.restart.play.settled && r.restart.play.firstWord).length,
    restartEmptyStyleOnly: rows.filter((r) => r.restart && (r.restart.restart.emptyStyleOnly || r.restart.play.emptyStyleOnly || r.restart.play.firstWordEmptyStyleOnly)).map((r) => ({ v: r.viewport, f: r.focusMode, s: r.size, t: r.token, k: r.kind, mv: r.masterVisible, mf: r.masterFont, side: r.restart.restart.emptyStyleSide || r.restart.play.emptyStyleSide })),
    noWordPixels: rows.filter((r) => r.noWordPixels).map((r) => [r.kind, r.viewport, r.focusMode, r.size, r.token].join(" ")),
    uncoveredByPanel: rows.filter((r) => r.paint && r.paint.uncoveredByPanel).map((r) => [r.kind, r.viewport, r.focusMode ? "focus" : "", r.size, r.token, r.scrolling ? "scroll" : "", r.masterVisible ? "mv" : "clipped", r.paint.uncoveredByPanel].join(" ")),
    scrollYDiffer: rows.filter((r) => r.scrollY && r.scrollY[0] !== r.scrollY[1]).length };
  L.fs.writeFileSync(L.path.join(OUT, "summary.json"), JSON.stringify(sum, null, 1));
  console.log(JSON.stringify(sum, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
