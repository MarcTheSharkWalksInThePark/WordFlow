"use strict";
// CC re-review helpers: serve the branch clone and its master worktree, drive installed Chrome.
// Independent of Codex's probes: own preparation through the app's globals, own measurements.
const path = require("node:path"), fs = require("node:fs"), crypto = require("node:crypto");
const SP = path.resolve(__dirname, ".."), BR = path.join(SP, "wf-rr"), MA = path.join(SP, "wf-master");
const { start, stop } = require(path.join(BR, "tests/helpers.cjs"));
const { launch, runtime } = require(path.join(BR, "tests/browser-helper.cjs"));
const REAL45 = "Pneumonoultramicroscopicsilicovolcanoconiosis";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const OUT = path.join(SP, "ev"); fs.mkdirSync(OUT, { recursive: true });

async function servers() {
  const b = await start(BR), m = await start(MA);
  return { branch: "http://127.0.0.1:" + b.port, master: "http://127.0.0.1:" + m.port, close: async () => { await stop(b); await stop(m); } };
}

// Load "Lead <token> Tail End." (or a custom text) through the app's own functions, large size.
async function prepare(page, tok, cfg = {}) {
  const c = { letter: true, context: true, focusMode: false, index: 1, size: "large", text: null, ...cfg };
  await page.evaluate(({ tok, c }) => {
    if (state.playing || state.countdownActive) pause();
    switchTab("paste"); hideSourceReview();
    state.focusLetter = c.letter; state.contextWords = c.context;
    state.wpm = 100; state.smartPacing = false; state.sentencePause = false; state.commaPause = false; state.paragraphPause = false;
    loadText(c.text ?? ("Lead " + tok + " Tail End."), "Reader fixture", "Reader fixture");
    setWordSize(c.size);
    if (state.focusMode !== c.focusMode) toggleFocusMode();
    seekTo(c.index);
    window.scrollTo(0, 0);
  }, { tok, c });
  await page.evaluate(() => document.fonts.ready);
  await settle(page); await settle(page);
}

// Own measurement: word box, rendered text Range, inner frame edges, context ink, note.
async function measure(page) {
  return page.evaluate(() => {
    const r2 = (n) => Math.round(n * 1000) / 1000;
    const R = (b) => b && { left: r2(b.left), top: r2(b.top), right: r2(b.right), bottom: r2(b.bottom), width: r2(b.width), height: r2(b.height) };
    const ink = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
    const shown = (el) => el && !el.hidden && getComputedStyle(el).display !== "none" && el.textContent !== "";
    const d = els.wordDisplay, f = d.closest(".reader-frame"), fr = f.getBoundingClientRect();
    const inner = { left: fr.left + f.clientLeft, top: fr.top + f.clientTop }; inner.right = inner.left + f.clientWidth; inner.bottom = inner.top + f.clientHeight;
    const word = d.getBoundingClientRect(), text = ink(d);
    // What the reader can see of the word: text ink, clipped by the word box when it scrolls, and by the frame.
    const scrolling = d.classList.contains("scrolling-long-word");
    const vis = { left: Math.max(text.left, inner.left), right: Math.min(text.right, inner.right), top: Math.max(text.top, scrolling ? word.top : -1e9, inner.top), bottom: Math.min(text.bottom, scrolling ? word.bottom : 1e9, inner.bottom) };
    const inter = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? { w: r2(w), h: r2(h) } : null; };
    const ctx = {};
    for (const [k, el] of [["previous", els.previousContext], ["next", els.nextContext]]) {
      if (!shown(el)) { ctx[k] = null; continue; }
      const box = el.getBoundingClientRect(), t = ink(el);
      const u = { left: Math.min(box.left, t.left), right: Math.max(box.right, t.right), top: Math.min(box.top, t.top), bottom: Math.max(box.bottom, t.bottom) };
      ctx[k] = { text: el.textContent, box: R(box), ink: R(t), overlap: inter(u, vis) };
    }
    const noteEl = els.longTextNote;
    const note = noteEl && !noteEl.hidden ? { rect: R(noteEl.getBoundingClientRect()), overlap: inter(noteEl.getBoundingClientRect(), vis),
      ctxOverlap: ["previous", "next"].map((k) => ctx[k] && inter(noteEl.getBoundingClientRect(), ctx[k].box)).filter(Boolean),
      inViewport: noteEl.getBoundingClientRect().bottom <= innerHeight && noteEl.getBoundingClientRect().top >= 0 } : null;
    return {
      viewport: [innerWidth, innerHeight], font: getComputedStyle(d).fontSize, styleAttr: d.getAttribute("style"), classes: d.className, text: d.textContent,
      outerHTML: d.outerHTML, frameClasses: f.className,
      word: R(word), textRect: R(text), inner: R({ ...inner, width: f.clientWidth, height: f.clientHeight }),
      fullyInside: text.left >= inner.left - 0.001 && text.right <= inner.right + 0.001 && text.top >= inner.top - 0.001 && text.bottom <= inner.bottom + 0.001,
      horizInside: text.left >= inner.left - 0.001 && text.right <= inner.right + 0.001,
      frame: { clientW: f.clientWidth, scrollW: f.scrollWidth, clientH: f.clientHeight, scrollH: f.scrollHeight },
      area: { clientH: d.clientHeight, scrollH: d.scrollHeight, scrollTop: d.scrollTop, clientW: d.clientWidth, scrollW: d.scrollWidth },
      wrapped: d.classList.contains("wrapped-long-word"), scrolling, marker: d.dataset.longTextPaused ?? null,
      context: ctx, note, playing: state.playing, index: state.index, scrollY
    };
  });
}

async function pixelDiff(page, a, b) {
  return page.evaluate(async ({ a, b }) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sameSize: false };
    const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
    const da = px(ia), db = px(ib); let diff = 0;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) diff++;
    return { sameSize: true, size: [ia.width, ia.height], differingPixels: diff };
  }, { a: a.toString("base64"), b: b.toString("base64") });
}

module.exports = { SP, BR, MA, OUT, REAL45, sha, settle, servers, prepare, measure, pixelDiff, launch, runtime, fs, path };
