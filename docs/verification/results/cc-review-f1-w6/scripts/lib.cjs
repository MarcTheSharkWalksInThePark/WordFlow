"use strict";
// CC review helpers: serve the branch clone and a master worktree, drive installed Chrome.
const path = require("node:path"), fs = require("node:fs"), crypto = require("node:crypto");
const SP = __dirname, BR = path.join(SP, "wf-review"), MA = path.join(SP, "wf-master");
const { start, stop } = require(path.join(BR, "tests/helpers.cjs"));
const { launch, runtime } = require(path.join(BR, "tests/browser-helper.cjs"));
const REAL = "Pneumonoultramicroscopicsilicovolcanoconiosis";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const token = (kind, n) => kind === "W" ? "W".repeat(n) : REAL.repeat(Math.ceil(n / REAL.length)).slice(0, n);
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

async function servers() {
  const b = await start(BR), m = await start(MA);
  return { b, m, branch: "http://127.0.0.1:" + b.port, master: "http://127.0.0.1:" + m.port, close: async () => { await stop(b); await stop(m); } };
}

// Same entry path as tests/reader-smoke.cjs prepare(), with configurable modes.
async function prepare(page, tok, cfg = {}) {
  const c = { focusLetter: true, context: true, focusMode: false, index: 1, lead: "Lead ", tail: " Tail End.", ...cfg };
  await page.evaluate(({ tok, c }) => {
    if (state.playing || state.countdownActive) pause();
    switchTab("paste"); hideSourceReview();
    state.focusLetter = c.focusLetter; state.contextWords = c.context;
    state.wpm = 100; state.smartPacing = false; state.sentencePause = false; state.commaPause = false; state.paragraphPause = false;
    loadText(c.lead + tok + c.tail, "Reader fixture", "Reader fixture");
    setWordSize("large");
    if (state.focusMode !== c.focusMode) toggleFocusMode();
    seekTo(c.index);
    window.scrollTo(0, 0);
  }, { tok, c });
  await settle(page); await settle(page);
}

async function measure(page) {
  return page.evaluate(() => {
    const R = (b) => b && { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2), top: +b.top.toFixed(2), bottom: +b.bottom.toFixed(2), left: +b.left.toFixed(2), right: +b.right.toFixed(2) };
    const textRect = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const visible = (el) => el && !el.hidden && getComputedStyle(el).display !== "none" && el.textContent !== "" ;
    const d = els.wordDisplay, f = d.closest(".reader-frame");
    const word = d.getBoundingClientRect(), content = textRect(d), frame = f.getBoundingClientRect();
    const inter = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? { w: +w.toFixed(2), h: +h.toFixed(2) } : null; };
    // Visible word ink: the word box clipped to the frame (frame has overflow:hidden; the scroll area clips itself).
    const clip = (a, b) => ({ left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) });
    const visibleContent = clip(clip(content, word), frame);
    const ctx = {};
    for (const [k, el] of [["previous", els.previousContext], ["next", els.nextContext]]) {
      if (!visible(el)) { ctx[k] = null; continue; }
      const box = el.getBoundingClientRect(), txt = textRect(el);
      ctx[k] = { text: el.textContent, box: R(box), text_rect: R(txt), overlapBox: inter(box, word), overlapInk: inter(txt, visibleContent) };
    }
    const rails = [...document.querySelectorAll(".focus-rail")].filter((el) => getComputedStyle(el).display !== "none").map((el) => { const b = el.getBoundingClientRect(); return { cls: el.className, rect: R(b), overlapInk: inter(b, visibleContent) }; });
    const note = els.longTextNote && !els.longTextNote.hidden ? { rect: R(els.longTextNote.getBoundingClientRect()), overlapWord: inter(els.longTextNote.getBoundingClientRect(), word) } : null;
    return {
      viewport: { w: innerWidth, h: innerHeight }, font: getComputedStyle(d).fontSize, classes: d.className,
      textLength: d.textContent.length, frame: { ...R(frame), clientW: f.clientWidth, clientH: f.clientHeight, scrollW: f.scrollWidth, scrollH: f.scrollHeight },
      word: R(word), content: R(content), area: { clientH: d.clientHeight, scrollH: d.scrollHeight, scrollTop: d.scrollTop },
      wrapped: d.classList.contains("wrapped-long-word"), scrolling: d.classList.contains("scrolling-long-word"),
      context: ctx, rails, note, playing: state.playing, index: state.index
    };
  });
}

// Pixel comparison of two PNG buffers inside Chrome (no PNG dependency in Node).
async function pixelDiff(page, a, b) {
  return page.evaluate(async ({ a, b }) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sameSize: false, a: [ia.width, ia.height], b: [ib.width, ib.height] };
    const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia), db = px(ib); let diff = 0;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) diff++;
    return { sameSize: true, size: [ia.width, ia.height], differingPixels: diff };
  }, { a: a.toString("base64"), b: b.toString("base64") });
}

module.exports = { SP, BR, MA, REAL, sha, token, settle, servers, prepare, measure, pixelDiff, launch, runtime, fs, path };
