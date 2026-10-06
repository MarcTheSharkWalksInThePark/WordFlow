const state = {
  words: [],
  paragraphBreaks: new Set(),
  sections: [],
  index: 0,
  playing: false,
  timerId: null,
  countdownActive: false,
  countdownValue: null,
  countdownTimerId: null,
  readingStartedAt: null,
  elapsedBeforeCurrentRun: 0,
  finished: false,
  wpm: 300,
  sentencePause: true,
  commaPause: true,
  paragraphPause: true,
  smartPacing: true,
  focusLetter: true,
  contextWords: true,
  focusMode: false,
  wordSize: "comfortable",
  sourceText: "",
  sourceTitle: "Untitled source",
  sourceReview: {
    rawText: "",
    title: "Untitled source",
    label: "Source",
    warnings: []
  }
};

const STORAGE_KEY = "wordflow-reader-session-v1";

const els = {
  status: document.querySelector("#reader-status"),
  wordCount: document.querySelector("#word-count"),
  timeLeft: document.querySelector("#time-left"),
  textInput: document.querySelector("#text-input"),
  loadTextButton: document.querySelector("#load-text-button"),
  clearButton: document.querySelector("#clear-button"),
  sampleButton: document.querySelector("#sample-button"),
  resumeButton: document.querySelector("#resume-button"),
  fileInput: document.querySelector("#file-input"),
  fileName: document.querySelector("#file-name"),
  urlInput: document.querySelector("#url-input"),
  loadUrlButton: document.querySelector("#load-url-button"),
  sourceReview: document.querySelector("#source-review"),
  sourceTitle: document.querySelector("#source-title"),
  reviewWordCount: document.querySelector("#review-word-count"),
  reviewCharCount: document.querySelector("#review-char-count"),
  sourceWarning: document.querySelector("#source-warning"),
  cleanupLinebreaks: document.querySelector("#cleanup-linebreaks"),
  cleanupHyphens: document.querySelector("#cleanup-hyphens"),
  cleanupBoilerplate: document.querySelector("#cleanup-boilerplate"),
  cleanupPageNoise: document.querySelector("#cleanup-page-noise"),
  reviewText: document.querySelector("#review-text"),
  applySourceButton: document.querySelector("#apply-source-button"),
  rawSourceButton: document.querySelector("#raw-source-button"),
  reviewBackButton: document.querySelector("#review-back-button"),
  wordDisplay: document.querySelector("#word-display"),
  previousContext: document.querySelector("#previous-context"),
  nextContext: document.querySelector("#next-context"),
  finishSummary: document.querySelector("#finish-summary"),
  finishTitle: document.querySelector("#finish-title"),
  finishWords: document.querySelector("#finish-words"),
  finishTime: document.querySelector("#finish-time"),
  finishWpm: document.querySelector("#finish-wpm"),
  finishRestartButton: document.querySelector("#finish-restart-button"),
  finishNewSourceButton: document.querySelector("#finish-new-source-button"),
  progressSlider: document.querySelector("#progress-slider"),
  positionLabel: document.querySelector("#position-label"),
  percentLabel: document.querySelector("#percent-label"),
  restartButton: document.querySelector("#restart-button"),
  prevButton: document.querySelector("#prev-button"),
  sentenceBackButton: document.querySelector("#sentence-back-button"),
  playButton: document.querySelector("#play-button"),
  playIcon: document.querySelector("#play-icon"),
  nextButton: document.querySelector("#next-button"),
  copyWordButton: document.querySelector("#copy-word-button"),
  wpmSlider: document.querySelector("#wpm-slider"),
  wpmOutput: document.querySelector("#wpm-output"),
  slowerButton: document.querySelector("#slower-button"),
  fasterButton: document.querySelector("#faster-button"),
  sectionSelect: document.querySelector("#section-select"),
  sentencePauseToggle: document.querySelector("#sentence-pause-toggle"),
  commaPauseToggle: document.querySelector("#comma-pause-toggle"),
  paragraphPauseToggle: document.querySelector("#paragraph-pause-toggle"),
  smartPacingToggle: document.querySelector("#smart-pacing-toggle"),
  focusToggle: document.querySelector("#focus-toggle"),
  contextToggle: document.querySelector("#context-toggle"),
  focusModeButton: document.querySelector("#focus-mode-button"),
  focusModeLabel: document.querySelector("#focus-mode-label")
};

const sampleText = `A focused reading rhythm can make dense text feel lighter. Load an article, set a pace that feels steady, and let each word arrive with enough room to land. Good speed reading is not a race against comprehension; it is a clean path for attention.`;

const sectionLeadWords = new Set([
  "abstract",
  "argumenter",
  "background",
  "chapter",
  "claim",
  "conclusion",
  "discussion",
  "drofing",
  "drofting",
  "hypotese",
  "innforing",
  "innledning",
  "introduction",
  "kapittel",
  "kilder",
  "method",
  "metode",
  "motargument",
  "motargumenter",
  "pastand",
  "problemstilling",
  "references",
  "result",
  "resultat",
  "resultater",
  "results",
  "sammendrag",
  "sources",
  "teori",
  "utstyr",
  "vurdering"
]);

const sectionLeadPhrases = [
  "argumenter som",
  "vurdering av",
  "innforing i",
  "arguments for",
  "arguments against",
  "source review"
];

function cleanText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tokenize(text) {
  return cleanText(text)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function setStatus(message) {
  els.status.textContent = message;
}

function loadText(text, label = "Text loaded", title = "Untitled source") {
  const cleaned = cleanText(text);
  const model = buildReadingModel(cleaned);

  pause();
  state.sourceText = cleaned;
  state.sourceTitle = title;
  state.words = model.words;
  state.paragraphBreaks = model.paragraphBreaks;
  state.sections = model.sections;
  state.index = 0;
  state.elapsedBeforeCurrentRun = 0;
  state.readingStartedAt = null;
  state.finished = false;
  els.textInput.value = cleaned;
  setStatus(state.words.length ? label : "No words found");
  render();
  saveSession();
}

function buildReadingModel(text) {
  const words = [];
  const paragraphBreaks = new Set();
  const sections = [];
  const paragraphs = cleanText(text).split(/\n{2,}/).filter((paragraph) => paragraph.trim());

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);

    lines.forEach((rawLine, lineIndex) => {
      const line = stripSectionMarker(rawLine);
      const lineWords = tokenize(line);
      if (!lineWords.length) return;

      if (isLikelySectionHeading(rawLine, paragraphIndex, lineIndex, lines.length)) {
        const sectionIndex = words.length;
        const title = line;
        if (!sections.some((section) => section.index === sectionIndex)) {
          sections.push({ title, index: sectionIndex });
        }
      }

      words.push(...lineWords);
    });

    if (words.length) {
      paragraphBreaks.add(words.length - 1);
    }
  });

  if (words.length && !sections.length) {
    sections.push({ title: "Start", index: 0 });
  }

  return { words, paragraphBreaks, sections };
}

function stripSectionMarker(line) {
  return line.replace(/^#{1,4}\s+/, "").trim();
}

function isLikelySectionHeading(line, paragraphIndex, lineIndex, lineCount) {
  const trimmed = line.trim();
  const marked = /^#{1,4}\s+\S+/.test(trimmed);
  const visible = marked ? stripSectionMarker(trimmed) : trimmed;
  const words = tokenize(visible);
  if (!visible) return false;
  if (marked) return words.length <= 24 && visible.length <= 180;
  if (lineIndex > 0 && lineCount > 1) return false;
  if (/^[-*\u2022]\s+/.test(visible)) return false;
  if (startsSectionLabel(visible)) return true;
  if (/^\d+(\.\d+)*\s+\S+/.test(visible)) return true;
  if (words.length > 12 || visible.length > 120) return false;

  const terminal = visible.replace(/[»”"')\]]+$/g, "").trim();
  if (/[.!?,;:]$/.test(terminal)) return false;
  if (hasSectionLead(visible)) return true;

  const letters = visible.replace(/[^\p{L}]/gu, "");
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;

  const capitalized = words.filter((word) => /^\p{Lu}/u.test(word)).length;
  const titleLike = capitalized / Math.max(words.length, 1) >= 0.6;
  return titleLike && (paragraphIndex === 0 || lineIndex === 0 || lineCount === 1);
}

function startsSectionLabel(line) {
  return /^(p[aå]stand|claim|section|chapter|kapittel)\s*\d+[:.)]?/iu.test(line.trim());
}

function hasSectionLead(line) {
  const key = normalizeHeadingKey(line);
  if (!key) return false;

  const firstWord = key.split(" ")[0];
  return sectionLeadWords.has(firstWord) || sectionLeadPhrases.some((phrase) => key.startsWith(phrase));
}

function normalizeHeadingKey(line) {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function currentWord() {
  return state.words[state.index] || "";
}

function focusIndexFor(word) {
  const length = Array.from(word).length;
  if (length <= 1) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

function renderWord(word) {
  els.wordDisplay.classList.toggle("compact", state.wordSize === "compact");
  els.wordDisplay.classList.toggle("large", state.wordSize === "large");
  els.wordDisplay.style.fontSize = "";
  els.wordDisplay.classList.remove("fitted-long-word");

  if (!word) {
    els.wordDisplay.innerHTML = `<span class="empty-word">Load text</span>`;
    fitDisplayedWord();
    return;
  }

  if (!state.focusLetter) {
    els.wordDisplay.textContent = word;
    fitDisplayedWord();
    return;
  }

  const letters = Array.from(word);
  const pivot = focusIndexFor(word);
  const left = letters.slice(0, pivot).join("");
  const focus = letters[pivot] || "";
  const right = letters.slice(pivot + 1).join("");
  els.wordDisplay.innerHTML = [
    `<span class="word-left">${escapeHtml(left)}</span>`,
    `<span class="word-focus">${escapeHtml(focus)}</span>`,
    `<span class="word-right">${escapeHtml(right)}</span>`
  ].join("");
  fitDisplayedWord();
}

function fitDisplayedWord() {
  window.requestAnimationFrame(() => {
    const display = els.wordDisplay;
    const frame = display.closest(".reader-frame");
    if (!frame || !display.textContent.trim() || display.querySelector(".empty-word")) return;

    display.style.fontSize = "";
    const baseSize = Number.parseFloat(window.getComputedStyle(display).fontSize);
    const maxWidth = frame.clientWidth * 0.9;
    const maxHeight = frame.clientHeight * 0.58;

    const fits = () => {
      const rect = display.getBoundingClientRect();
      return rect.width <= maxWidth && rect.height <= maxHeight;
    };

    if (fits()) return;

    let low = 10;
    let high = baseSize;
    for (let step = 0; step < 12; step += 1) {
      const mid = (low + high) / 2;
      display.style.fontSize = `${mid}px`;

      if (fits()) {
        low = mid;
      } else {
        high = mid;
      }
    }

    display.style.fontSize = `${Math.max(10, Math.floor(low))}px`;
    display.classList.add("fitted-long-word");
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[char];
  });
}

function renderProgress() {
  const total = state.words.length;
  const current = total ? state.index + 1 : 0;
  const percent = total ? Math.round((current / total) * 100) : 0;
  const secondsLeft = estimateRemainingSeconds();

  els.wordCount.textContent = total.toLocaleString();
  els.timeLeft.textContent = formatTime(secondsLeft);
  els.progressSlider.max = Math.max(total - 1, 0);
  els.progressSlider.value = Math.min(state.index, Math.max(total - 1, 0));
  els.progressSlider.disabled = total === 0;
  els.positionLabel.textContent = `${current.toLocaleString()} / ${total.toLocaleString()}`;
  els.percentLabel.textContent = `${percent}%`;
}

function estimateRemainingSeconds() {
  if (!state.words.length) return 0;
  let totalMs = 0;
  for (let i = state.index + 1; i < state.words.length; i += 1) {
    totalMs += wordDelay(state.words[i], i);
  }
  return Math.ceil(totalMs / 1000);
}

function renderControls() {
  const hasWords = state.words.length > 0;
  const activePlayback = state.playing || state.countdownActive;
  els.playButton.disabled = !hasWords;
  els.restartButton.disabled = !hasWords;
  els.prevButton.disabled = !hasWords || state.index === 0;
  els.sentenceBackButton.disabled = !hasWords || state.index === 0;
  els.nextButton.disabled = !hasWords || state.index >= state.words.length - 1;
  els.copyWordButton.disabled = !hasWords;
  els.wpmOutput.value = `${state.wpm} WPM`;
  els.wpmSlider.value = state.wpm;
  els.sentencePauseToggle.checked = state.sentencePause;
  els.commaPauseToggle.checked = state.commaPause;
  els.paragraphPauseToggle.checked = state.paragraphPause;
  els.smartPacingToggle.checked = state.smartPacing;
  els.focusToggle.checked = state.focusLetter;
  els.contextToggle.checked = state.contextWords;
  els.playButton.title = activePlayback ? "Pause" : "Play";
  els.playButton.setAttribute("aria-label", activePlayback ? "Pause" : "Play");
  els.playIcon.innerHTML = activePlayback
    ? `<rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect>`
    : `<path d="m8 5 11 7-11 7z"></path>`;
  els.focusModeButton.classList.toggle("active", state.focusMode);
  els.focusModeLabel.textContent = state.focusMode ? "Exit" : "Focus";
  els.focusModeButton.title = state.focusMode ? "Exit focus mode" : "Focus mode";
  els.focusModeButton.setAttribute("aria-label", state.focusMode ? "Exit focus mode" : "Focus mode");
}

function render() {
  if (state.countdownActive) {
    renderCountdown();
  } else {
    renderWord(currentWord());
  }
  renderContextWords();
  renderFinishSummary();
  renderProgress();
  renderControls();
  renderSections();
}

function renderCountdown() {
  els.wordDisplay.classList.remove("compact", "large", "fitted-long-word");
  els.wordDisplay.style.fontSize = "";
  els.wordDisplay.innerHTML = `<span class="countdown-word">${state.countdownValue}</span>`;
}

function renderContextWords() {
  const showContext = state.contextWords && state.words.length && !state.countdownActive && !state.finished;
  els.previousContext.textContent = showContext ? state.words[state.index - 1] || "" : "";
  els.nextContext.textContent = showContext ? state.words[state.index + 1] || "" : "";
  els.previousContext.hidden = !showContext || !els.previousContext.textContent;
  els.nextContext.hidden = !showContext || !els.nextContext.textContent;
}

function renderFinishSummary() {
  els.finishSummary.hidden = !state.finished;
  if (!state.finished) return;

  const totalSeconds = Math.max(1, Math.round(readingElapsedMs() / 1000));
  const averageWpm = Math.round(state.words.length / (totalSeconds / 60));
  els.finishTitle.textContent = state.sourceTitle || "Reading complete";
  els.finishWords.textContent = state.words.length.toLocaleString();
  els.finishTime.textContent = formatTime(totalSeconds);
  els.finishWpm.textContent = Number.isFinite(averageWpm) ? averageWpm.toLocaleString() : "0";
}

function renderSections() {
  const signature = state.sections.map((section) => `${section.index}:${section.title}`).join("|");
  if (els.sectionSelect.dataset.signature !== signature) {
    els.sectionSelect.replaceChildren();
    state.sections.forEach((section) => {
      const option = document.createElement("option");
      option.value = String(section.index);
      option.textContent = section.title;
      els.sectionSelect.append(option);
    });

    if (!state.sections.length) {
      const option = document.createElement("option");
      option.textContent = "No sections";
      els.sectionSelect.append(option);
    }

    els.sectionSelect.dataset.signature = signature;
  }

  els.sectionSelect.disabled = state.sections.length <= 1;
  const active = activeSection();
  if (active) els.sectionSelect.value = String(active.index);
}

function activeSection() {
  let active = state.sections[0] || null;
  state.sections.forEach((section) => {
    if (section.index <= state.index) active = section;
  });
  return active;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function wordDelay(word, index = state.index) {
  const baseDelay = 60000 / state.wpm;
  let multiplier = 1;
  const cleanWord = word.replace(/[^\p{L}\p{N}]/gu, "");
  let smartLength = 0;

  if (state.smartPacing) {
    smartLength = Array.from(cleanWord).length;
    if (smartLength >= 28) {
      multiplier += 1.15 + Math.min(1.45, (smartLength - 28) * 0.055);
    } else if (smartLength >= 18) {
      multiplier += 0.48 + (smartLength - 18) * 0.075;
    } else if (smartLength >= 12) {
      multiplier += 0.16 + (smartLength - 12) * 0.05;
    }
  }

  if (state.commaPause && /[,;:]$/.test(word)) multiplier = Math.max(multiplier, 1.35);
  if (state.sentencePause && isSentenceEnd(word)) multiplier = Math.max(multiplier, 1.85);
  if (state.paragraphPause && state.paragraphBreaks.has(index)) multiplier = Math.max(multiplier, 2.15);

  let delay = baseDelay * multiplier;
  if (state.smartPacing && smartLength >= 28) {
    delay = Math.max(delay, Math.min(800, 420 + (smartLength - 28) * 8));
  } else if (state.smartPacing && smartLength >= 18) {
    delay = Math.max(delay, Math.min(440, 320 + (smartLength - 18) * 10));
  }

  return delay;
}

function scheduleNext() {
  window.clearTimeout(state.timerId);
  if (!state.playing) return;

  state.timerId = window.setTimeout(() => {
    if (state.index >= state.words.length - 1) {
      completeReading();
      return;
    }

    state.index += 1;
    render();
    saveSession();
    scheduleNext();
  }, wordDelay(currentWord(), state.index));
}

function play() {
  if (!state.words.length || state.countdownActive) return;
  if (state.finished && state.index >= state.words.length - 1) {
    state.index = 0;
    state.elapsedBeforeCurrentRun = 0;
    state.finished = false;
  }
  startCountdown();
}

function startReading() {
  state.playing = true;
  state.finished = false;
  state.readingStartedAt = Date.now();
  setStatus("Reading");
  render();
  scheduleNext();
}

function pause() {
  if (state.playing && state.readingStartedAt) {
    state.elapsedBeforeCurrentRun += Date.now() - state.readingStartedAt;
  }
  state.playing = false;
  state.countdownActive = false;
  state.countdownValue = null;
  state.readingStartedAt = null;
  window.clearTimeout(state.timerId);
  window.clearTimeout(state.countdownTimerId);
  state.timerId = null;
  state.countdownTimerId = null;
  renderControls();
}

function completeReading() {
  if (state.playing && state.readingStartedAt) {
    state.elapsedBeforeCurrentRun += Date.now() - state.readingStartedAt;
  }
  state.playing = false;
  state.countdownActive = false;
  state.readingStartedAt = null;
  state.finished = true;
  window.clearTimeout(state.timerId);
  window.clearTimeout(state.countdownTimerId);
  state.timerId = null;
  state.countdownTimerId = null;
  setStatus("Finished");
  render();
  saveSession();
}

function readingElapsedMs() {
  const running = state.playing && state.readingStartedAt ? Date.now() - state.readingStartedAt : 0;
  return state.elapsedBeforeCurrentRun + running;
}

function togglePlayback() {
  if (state.playing || state.countdownActive) {
    pause();
    setStatus("Paused");
    render();
  } else {
    play();
  }
}

function seekTo(index) {
  state.finished = false;
  state.index = Math.min(Math.max(index, 0), Math.max(state.words.length - 1, 0));
  render();
  if (state.playing) scheduleNext();
  saveSession();
}

function rewindSentence() {
  if (!state.words.length || state.index === 0) return;
  const currentStart = sentenceStartBefore(state.index);
  const target = state.index === currentStart && currentStart > 0
    ? sentenceStartBefore(currentStart - 1)
    : currentStart;
  seekTo(target);
  setStatus("Sentence rewind");
}

function sentenceStartBefore(index) {
  for (let i = Math.max(index - 1, 0); i >= 0; i -= 1) {
    if (isSentenceEnd(state.words[i])) return i + 1;
  }
  return 0;
}

function isSentenceEnd(word) {
  return /[.!?]["')\]]*$/.test(word);
}

function startCountdown() {
  state.countdownActive = true;
  state.countdownValue = 3;
  setStatus("Starting");
  render();

  const tick = () => {
    if (!state.countdownActive) return;
    state.countdownValue -= 1;

    if (state.countdownValue <= 0) {
      state.countdownActive = false;
      state.countdownValue = null;
      startReading();
      return;
    }

    render();
    state.countdownTimerId = window.setTimeout(tick, 650);
  };

  state.countdownTimerId = window.setTimeout(tick, 650);
}

function sourceFromHtml(html, fallbackTitle = "Website source") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const title = cleanText(
    doc.querySelector("article h1, main h1, h1")?.textContent ||
    doc.querySelector("title")?.textContent ||
    fallbackTitle
  );

  doc.querySelectorAll("script, style, noscript, svg, nav, header, footer, form, aside").forEach((node) => node.remove());
  const preferred = doc.querySelector("article, main") || doc.body;

  return {
    title,
    text: cleanText(preferred?.innerText || preferred?.textContent || doc.documentElement.textContent || "")
  };
}

function htmlToReadableText(html) {
  return sourceFromHtml(html).text;
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function fetchWebsiteSource(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("Missing URL");

  const loaders = [];
  if (location.protocol === "http:" || location.protocol === "https:") {
    loaders.push(() => fetchViaLocalReader(url));
  }
  loaders.push(() => fetchDirectly(url));

  let lastError;
  let quotaError;
  for (const load of loaders) {
    try {
      return await load();
    } catch (error) {
      lastError = error;
      if (error.code === "FREE_LIMIT") quotaError = error;
    }
  }

  throw quotaError || lastError || new Error("Website blocked");
}

async function fetchViaLocalReader(url) {
  const endpoint = new URL("/api/read", location.href);
  endpoint.searchParams.set("url", url);
  const response = await fetch(endpoint);
  const raw = await response.text();
  let payload;
  try { payload = JSON.parse(raw); } catch {}
  // Cloudflare documents Error 1027, an HTML error page; HTTP status/body wording
  // are not a stable contract. Pages fail-open may instead serve our static fallback.
  const errorText = raw.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, " ");
  if ((!payload && /\berror[\W_]+(?:code[\W_]*)?1027\b/i.test(errorText)) ||
      payload?.error === "WORDFLOW_FREE_LIMIT") {
    const error = new Error("URL loading has reached today's free limit. It resets at 00:00 UTC. Paste the text instead.");
    error.code = "FREE_LIMIT";
    throw error;
  }
  if (!response.ok) throw new Error(`Reader returned ${response.status}`);
  if (!payload) throw new Error("Could not load website");

  if (payload.contentType.includes("text/html")) {
    const source = sourceFromHtml(payload.body, payload.url || "Website source");
    return { ...source, label: "Website", warnings: payload.warnings || [] };
  }

  return {
    title: payload.url || "Website source",
    text: cleanText(payload.body),
    label: "Website",
    warnings: payload.warnings || []
  };
}

async function fetchDirectly(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Website returned ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();

  if (contentType.includes("text/html")) {
    const source = sourceFromHtml(body, response.url || "Website source");
    return { ...source, label: "Website", warnings: [] };
  }

  return {
    title: response.url || "Website source",
    text: cleanText(body),
    label: "Website",
    warnings: []
  };
}

async function loadFromUrl() {
  const url = els.urlInput.value;
  setStatus("Loading website...");
  els.loadUrlButton.disabled = true;

  try {
    const source = await fetchWebsiteSource(url);
    showSourceReview(source);
  } catch (error) {
    setStatus(error.code === "FREE_LIMIT" ? error.message : "Website blocked; paste copied text");
  } finally {
    els.loadUrlButton.disabled = false;
  }
}

async function readFile(file) {
  if (!file) return;
  els.fileName.textContent = file.name;
  setStatus("Loading file...");
  els.fileInput.disabled = true;

  try {
    if (file.size > 24 * 1024 * 1024) throw new Error("Upload is too large");
    if (requiresDocumentExtraction(file)) {
      const source = await extractFileInBrowser(file);
      showSourceReview(source);
      return;
    }

    const raw = await readFileAsText(file);
    const source = file.name.match(/\.html?$/i)
      ? { ...sourceFromHtml(raw, file.name), label: "File", warnings: [] }
      : { title: file.name, text: raw, label: "File", warnings: [] };
    showSourceReview(source);
  } catch (error) {
    setStatus(error.message || "Could not read file");
  } finally {
    els.fileInput.disabled = false;
    els.fileInput.value = "";
  }
}

function requiresDocumentExtraction(file) {
  return /\.(pdf|docx)$/i.test(file.name);
}

async function extractFileInBrowser(file) {
  const { extractFile } = await import("./file-extractors.mjs");
  const payload = await extractFile(file);

  return {
    title: payload.title || file.name,
    text: payload.body || "",
    label: "File",
    warnings: payload.warnings || []
  };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Could not read file")));
    reader.readAsText(file);
  });
}

function showSourceReview(source) {
  pause();
  state.sourceReview = {
    rawText: String(source.text || ""),
    title: source.title || "Untitled source",
    label: source.label || "Source",
    warnings: source.warnings || []
  };

  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.hidden = true;
    pane.classList.remove("active");
  });

  els.sourceReview.hidden = false;
  els.sourceTitle.textContent = state.sourceReview.title;
  els.cleanupLinebreaks.checked = true;
  els.cleanupHyphens.checked = true;
  els.cleanupBoilerplate.checked = true;
  els.cleanupPageNoise.checked = true;
  applyCleanupToReview();
  setStatus("Review source");
}

function hideSourceReview() {
  els.sourceReview.hidden = true;
  restoreActiveTabPane();
}

function restoreActiveTabPane() {
  const activeTab = document.querySelector(".tab.active")?.dataset.tab || "paste";
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    const isActive = pane.id === `${activeTab}-pane`;
    pane.classList.toggle("active", isActive);
    pane.hidden = !isActive;
  });
}

function applyCleanupToReview() {
  const cleaned = cleanupSourceText(state.sourceReview.rawText, {
    linebreaks: els.cleanupLinebreaks.checked,
    hyphens: els.cleanupHyphens.checked,
    boilerplate: els.cleanupBoilerplate.checked,
    pageNoise: els.cleanupPageNoise.checked
  });
  els.reviewText.value = cleaned;
  renderReviewMeta(cleaned);
}

function cleanupSourceText(text, options) {
  let output = String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, "");

  if (options.hyphens) {
    output = output.replace(/([A-Za-z])-\n(?=[A-Za-z])/g, "$1");
  }

  if (options.pageNoise) {
    output = removePageNoise(output);
  }

  if (options.boilerplate) {
    output = removeObviousClutter(output);
  }

  if (options.linebreaks) {
    output = output
      .split(/\n{2,}/)
      .map((block) => block.replace(/[ \t]*\n[ \t]*/g, " "))
      .join("\n\n");
  }

  return output
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeObviousClutter(text) {
  const clutterPatterns = [
    /^(home|menu|search|login|log in|sign in|subscribe|share|advertisement|advertising)$/i,
    /^(privacy policy|terms of service|cookie settings|accept all|reject all|skip to content)$/i,
    /^(previous|next|back to top|read more|follow us|newsletter)$/i,
    /^©\s?\d{4}/i,
    /^\d+\s*\/\s*\d+$/
  ];

  const seen = new Set();
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (isExplicitSectionLine(trimmed)) return true;
      if (clutterPatterns.some((pattern) => pattern.test(trimmed))) return false;

      const signature = trimmed.toLowerCase();
      const isShort = tokenize(trimmed).length <= 8;
      if (isShort && seen.has(signature)) return false;
      if (isShort) seen.add(signature);
      return true;
    })
    .join("\n");
}

function removePageNoise(text) {
  const lines = text.split("\n");
  const counts = new Map();
  const normalized = lines.map((line) => normalizeNoiseLine(line));

  normalized.forEach((line) => {
    if (!line) return;
    counts.set(line, (counts.get(line) || 0) + 1);
  });

  const repeatedLimit = Math.max(2, Math.ceil(lines.length / 18));
  return lines
    .filter((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (isExplicitSectionLine(trimmed)) return true;
      if (/^(page\s*)?\d+(\s+of\s+\d+)?$/i.test(trimmed)) return false;
      if (/^-?\s*\d+\s*-?$/.test(trimmed)) return false;

      const key = normalized[index];
      const isShort = tokenize(trimmed).length <= 9 && trimmed.length <= 90;
      return !(isShort && key && (counts.get(key) || 0) >= repeatedLimit);
    })
    .join("\n");
}

function normalizeNoiseLine(line) {
  return line
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ");
}

function isExplicitSectionLine(line) {
  return /^#{1,4}\s+\S+/.test(line.trim());
}

function renderReviewMeta(text) {
  const words = tokenize(text);
  const warnings = [...state.sourceReview.warnings];
  if (!words.length) {
    warnings.push("No readable words found.");
  }

  els.reviewWordCount.textContent = words.length.toLocaleString();
  els.reviewCharCount.textContent = cleanText(text).length.toLocaleString();
  els.sourceWarning.textContent = warnings.join(" ");
  els.sourceWarning.hidden = warnings.length === 0;
}

function useReviewedSource() {
  const text = els.reviewText.value;
  renderReviewMeta(text);
  loadText(text, `${state.sourceReview.label} loaded`, state.sourceReview.title);
}

function switchTab(nextTab) {
  els.sourceReview.hidden = true;

  document.querySelectorAll(".tab").forEach((tab) => {
    const isActive = tab.dataset.tab === nextTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  restoreActiveTabPane();
}

function setWpm(value) {
  state.wpm = Math.min(Math.max(Number(value), 100), 900);
  render();
  if (state.playing) scheduleNext();
  saveSession();
}

function setWordSize(size) {
  state.wordSize = size;
  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.size === size);
  });
  render();
  saveSession();
}

function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  document.body.classList.toggle("focus-mode", state.focusMode);
  render();
  saveSession();
}

async function copyCurrentWord() {
  const word = currentWord();
  if (!word) return;

  try {
    await navigator.clipboard.writeText(word);
    setStatus("Copied current word");
  } catch (error) {
    setStatus("Copy blocked by browser");
  }
}

function saveSession() {
  if (!state.sourceText || !state.words.length) {
    updateResumeButton();
    return;
  }

  try {
    const session = {
      title: state.sourceTitle,
      text: state.sourceText,
      index: state.index,
      wpm: state.wpm,
      sentencePause: state.sentencePause,
      commaPause: state.commaPause,
      paragraphPause: state.paragraphPause,
      smartPacing: state.smartPacing,
      focusLetter: state.focusLetter,
      contextWords: state.contextWords,
      focusMode: state.focusMode,
      wordSize: state.wordSize,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    updateResumeButton();
  } catch (error) {
    setStatus("Session storage full");
  }
}

function readSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session && session.text ? session : null;
  } catch (error) {
    return null;
  }
}

function updateResumeButton() {
  const session = readSavedSession();
  els.resumeButton.hidden = !session;
  if (session) {
    els.resumeButton.title = `Resume ${session.title || "last session"}`;
  }
}

function restoreSession() {
  const session = readSavedSession();
  if (!session) {
    setStatus("No saved session");
    updateResumeButton();
    return;
  }

  state.wpm = Number(session.wpm) || state.wpm;
  const legacyPunctuation = session.punctuationPause !== false;
  state.sentencePause = session.sentencePause ?? legacyPunctuation;
  state.commaPause = session.commaPause ?? legacyPunctuation;
  state.paragraphPause = session.paragraphPause ?? true;
  state.smartPacing = session.smartPacing !== false;
  state.focusLetter = session.focusLetter !== false;
  state.contextWords = session.contextWords !== false;
  state.focusMode = session.focusMode === true;
  document.body.classList.toggle("focus-mode", state.focusMode);
  state.wordSize = session.wordSize || "comfortable";
  loadText(session.text, "Session restored", session.title || "Saved session");
  state.index = Math.min(Math.max(Number(session.index) || 0, 0), Math.max(state.words.length - 1, 0));
  setWordSize(state.wordSize);
  render();
  saveSession();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.tab));
});

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => setWordSize(button.dataset.size));
});

[els.cleanupLinebreaks, els.cleanupHyphens, els.cleanupBoilerplate, els.cleanupPageNoise].forEach((checkbox) => {
  checkbox.addEventListener("change", applyCleanupToReview);
});

els.reviewText.addEventListener("input", () => renderReviewMeta(els.reviewText.value));
els.applySourceButton.addEventListener("click", useReviewedSource);
els.rawSourceButton.addEventListener("click", () => {
  els.cleanupLinebreaks.checked = false;
  els.cleanupHyphens.checked = false;
  els.cleanupBoilerplate.checked = false;
  els.cleanupPageNoise.checked = false;
  els.reviewText.value = state.sourceReview.rawText.trim();
  renderReviewMeta(els.reviewText.value);
});
els.reviewBackButton.addEventListener("click", hideSourceReview);
els.resumeButton.addEventListener("click", restoreSession);
els.loadTextButton.addEventListener("click", () => {
  showSourceReview({
    title: "Pasted text",
    text: els.textInput.value,
    label: "Text",
    warnings: []
  });
});
els.clearButton.addEventListener("click", () => loadText(""));
els.sampleButton.addEventListener("click", () => {
  showSourceReview({
    title: "Sample reading text",
    text: sampleText,
    label: "Sample",
    warnings: []
  });
});
els.fileInput.addEventListener("change", (event) => readFile(event.target.files[0]));
els.loadUrlButton.addEventListener("click", loadFromUrl);
els.urlInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadFromUrl();
});

els.playButton.addEventListener("click", togglePlayback);
els.restartButton.addEventListener("click", () => {
  seekTo(0);
  setStatus("Restarted");
});
els.prevButton.addEventListener("click", () => seekTo(state.index - 1));
els.sentenceBackButton.addEventListener("click", rewindSentence);
els.nextButton.addEventListener("click", () => seekTo(state.index + 1));
els.copyWordButton.addEventListener("click", copyCurrentWord);
els.progressSlider.addEventListener("input", (event) => seekTo(Number(event.target.value)));
els.wpmSlider.addEventListener("input", (event) => setWpm(event.target.value));
els.slowerButton.addEventListener("click", () => setWpm(state.wpm - 25));
els.fasterButton.addEventListener("click", () => setWpm(state.wpm + 25));
els.sectionSelect.addEventListener("change", (event) => {
  seekTo(Number(event.target.value));
  setStatus("Section selected");
});
els.sentencePauseToggle.addEventListener("change", (event) => {
  state.sentencePause = event.target.checked;
  if (state.playing) scheduleNext();
  saveSession();
});
els.commaPauseToggle.addEventListener("change", (event) => {
  state.commaPause = event.target.checked;
  if (state.playing) scheduleNext();
  saveSession();
});
els.paragraphPauseToggle.addEventListener("change", (event) => {
  state.paragraphPause = event.target.checked;
  if (state.playing) scheduleNext();
  saveSession();
});
els.smartPacingToggle.addEventListener("change", (event) => {
  state.smartPacing = event.target.checked;
  if (state.playing) scheduleNext();
  saveSession();
});
els.focusToggle.addEventListener("change", (event) => {
  state.focusLetter = event.target.checked;
  render();
  saveSession();
});
els.contextToggle.addEventListener("change", (event) => {
  state.contextWords = event.target.checked;
  render();
  saveSession();
});
els.focusModeButton.addEventListener("click", toggleFocusMode);
els.finishRestartButton.addEventListener("click", () => {
  state.elapsedBeforeCurrentRun = 0;
  seekTo(0);
  setStatus("Restarted");
});
els.finishNewSourceButton.addEventListener("click", () => {
  state.finished = false;
  state.focusMode = false;
  document.body.classList.remove("focus-mode");
  switchTab("paste");
  render();
  setStatus("Choose source");
});

document.addEventListener("keydown", (event) => {
  const editable = ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
  if (editable) return;

  if (event.code === "Space") {
    event.preventDefault();
    togglePlayback();
  }

  if (event.key === "ArrowLeft") seekTo(state.index - 1);
  if (event.key === "ArrowRight") seekTo(state.index + 1);
});

window.addEventListener("resize", fitDisplayedWord);

updateResumeButton();
render();
