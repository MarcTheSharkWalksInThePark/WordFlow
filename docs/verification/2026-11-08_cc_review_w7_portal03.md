# CC independent review — W7 Portal '03 restyle (W7.1–W7.12 and the 2026-11-08 clarifications)

Date: 2026-11-08. Reviewer: Claude Code (claude-opus-5-5, effort medium). Builder: Codex.
Reviewed: local `feat/w7-portal03-restyle` at `51e22d04398197edf1ad6a94b8d150a8a13345cc` against
`2a376445ceb1b98a1b4c943cf8834e77e0578120` (pre-restyle master) and, for the pinned comparisons,
`b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7` (PRE_F1). The authority is `docs/DECISIONS.md` RULING W7
(W7.1–W7.12) and "W7 clarifications (Marcus, 2026-11-08)". Codex's report
(`2026-11-07_codex_w7_portal03_restyle.md`) was treated as claims and is not edited. Nothing was fixed,
merged, pushed, deployed or installed, and no `.env` file was opened.

## Verdict: CLEAR WITH FINDINGS

Every number Codex reports reproduces in a fresh clone. Node gives 514 / 0 skips, identical with Chrome
and Playwright made unreadable. Parity gives 924 / 0 errors / 0 uploads, extraction 9 DOCX + 7 PDF,
Finished 288 / 288 / 108, and a byte-identical stamp. The mutation run gives 78 = 77 KILLED + equivalent
M9, every verdict and hash equal to Codex's file. The build has 199 identical filenames with exactly four
changed assets. The 28-row W7.12 frame table reproduces to the hundredth of a pixel. Word sizes equal
2a37644 at every viewport and mode, and every W7.12 gate holds. Thirteen floor cases (all four wrapped
ones, in both themes) land at exactly 10 px on both 2a37644 and the candidate, with Codex's widths.

The scope is clean apart from one runner line. No R59 file, proxy, Function, header, gate, fixture,
vendor file or STATIC_FILES entry changed. Every test change is a ruled re-baseline, the W7.10 pin, the
W7.11 line, a clarification or a new W7 check. I found no loosened behaviour, data or security
assertion. The floor-aware gate implements rules (a)–(c) exactly, with no other tolerance.

The findings are small. None is High, and none touches stored data, privacy, R59 or extraction:

| # | Finding | Severity | Needs |
|---|---|---|---|
| F-1 | **Horizontal overflow at viewports ≤ 340 px.** The page is 342–344 px wide there; the reader heading, its fullscreen icon and the frame's right edge are cut off and the page scrolls sideways. 2a37644 fits down to 310 px. This is outside the W7.12 viewport list, but it covers 320 px phones and 400% zoom on a 1280 px screen (WCAG 2.1 AA reflow). | Medium (small regression) | Codex fix (CSS), or Marcus ruling to accept |
| F-2 | **Word sizes are no longer guarded by any test.** Hand mutant M14 (Large 128 → 120 px, which W7.12 forbids) survives all 514 Node and 924 Chrome checks. The W7.8 re-baseline removed every font comparison and nothing pins the base sizes. The sizes are correct today (measured equal to 2a37644). | Low (coverage) | Codex test, if Marcus wants it |
| F-3 | **Fullscreen re-fit is untested.** M9 (no `fitDisplayedWord()` on `fullscreenchange`) survives. Without it, at 390 px "reading" enters fullscreen at 102.4 px using 98.6% of the frame instead of being fitted to 93 px, and "comprehension;" keeps its smaller normal-mode size. | Low (coverage) | Codex test, if Marcus wants it |
| F-4 | **The approved privacy text is only partly asserted.** M10 (one word of the W4.6 paragraph changed) survives; only "Files are read in your browser" is checked. This is pre-existing, but W7 rewrote the footer around it. I verified the paragraph is byte-identical today. | Low (coverage, pre-existing) | Codex test, if Marcus wants it |
| F-5 | **W7.4's "no session field for theme" is only partly tested.** M2b adds `theme: document.documentElement.dataset.theme` to the saved session. That value is undefined (and dropped by JSON) until a manual toggle, then stored on the next save. It survives all checks: the Portal suite compares storage right after the toggles, and toggling does not save, while the later `setWpm` saves are never inspected. (M2a, an always-defined theme field, is killed.) The product is correct today: I measured the session value byte-identical across toggles, with 13 fields. | Low (coverage of a privacy rule) | Codex test (check the record after a save that follows a toggle) |
| F-6 | **Ticker text untested.** M12 ("fullscreen" → "full screen" in the W7.7 ticker) survives; no test reads the ticker, badges or tagline. All three are correct today (verified exact). | Low (coverage) | Codex test, if Marcus wants it |
| F-7 | **`tools/static_smoke.cjs` changed** (one added line that runs the new Portal suite). The review brief lists all of `tools/` as must-be-identical. It is not the push gate (`tools/push.sh` runs only `npm test`), W7.9's list does not name it, and Codex disclosed it. | Low (scope) | Marcus ruling (accept or not) |
| F-8 | **Theme button accessible name does not contain its visible text** ("Lights on" / aria-label "Switch to light theme"). Speech-input users saying the visible label may not reach it (WCAG 2.5.3). The visible text is ruled; the aria-label is an implementation choice. | Low | Codex fix, or Marcus ruling |
| F-9 | **Record order.** The whitespace approval was recorded in `ad1761f` (16:37) five hours after its code commit `a242904` (11:34). The approval itself came first, per Codex's report and worklog. All other rulings were recorded before their code. | Low (records) | none (noted) |
| F-10 | Unruled small copy changes: URL placeholder `https://example.com/article` → `example.com/article` (Codex's choice, to satisfy its own no-URL test regex); the W6.5 note's em dash is now `&mdash;` in the source (rendered text identical, verified); the stats caption "left" became LCD captions "WORDS" / "TIME LEFT". | Info | none, or Marcus |
| F-11 | The Portal suite's `firstEntry()` switches to a stubbed Fullscreen API whenever the native request rejects; the evidence records "native" in all four runs, but nothing asserts it. The obvious trigger (Permissions-Policy `fullscreen=()`) is caught by the Node header check (extra mutant M16 KILLED). | Info | none |
| F-12 | `npm run parity` now also rewrites the 24 committed W7 screenshots (4 changed in my run) besides the existing post-review evidence, so the tree is dirty after a parity run and must be restored or committed before `tools/push.sh`. | Info | none |
| F-13 | Fallback and keyboard details: with the Fullscreen API unavailable, pressing Fullscreen or F again repeats the fallback status and does not leave Focus mode; F with the "Jump to" `<select>` focused toggles fullscreen (only INPUT/TEXTAREA are exempt, the same pattern as Space). W7.5/W7.6 do not rule on either. | Info | none |

**Nothing here blocks Marcus's merge/push decision.** F-1 is the only user-visible issue; Marcus may
want it fixed (or accepted) before merging. F-2 to F-6 are missing tests, not defects: five of the 17
hand mutants (M2b, M9, M10, M12, M14) survive every Node and Chrome check, and each guards something
that is correct today. F-5 is the one I would add first, because it protects a privacy rule.

## Setup

- Canonical repo: clean on `feat/w7-portal03-restyle`; `feat/w7-portal03-restyle` =
  `51e22d04398197edf1ad6a94b8d150a8a13345cc`, `master` = `2a376445ceb1b98a1b4c943cf8834e77e0578120`,
  `origin/master` = `188d65e877c9cf63096bcc1e8abc2b523f16f07d`, `core.hooksPath` = `.githooks`. All as
  expected; nothing was checked out or tested in the canonical working tree.
- `git clone --no-local` into the session scratch directory (`wf`), detached at `51e22d0`, with a local
  `master` at `2a37644` in the clone only. Four more clones at `51e22d0` (`wf-m1`…`wf-m4`) ran hand
  mutants in parallel; one at `2a37644` (`wf-base`) gave the baseline build and Node counts.
- Node 24.16.0, npm 11.13.0. **Chrome 156.0.8078.81** (file version; the same as Codex's and the stamp's).
  **Playwright 1.62.1**, from the Codex runtime path that `tests/browser-helper.cjs` falls back to (L7).
  Note: an early `chrome.exe --version` call (Windows Chrome does not print a version) was stopped; it
  may have opened a browser window. Headed checks later opened Chrome windows on the desktop briefly.
- My probes reuse `tests/helpers.cjs start()` and the helper's installed Chrome. Baseline pages serve
  `index.html`, `app.js`, `styles.css` and `assets/wordflow-mark.svg` from the given SHA by routing.

## Commits (14, exactly as listed, in order)

| SHA | Subject | Files | Kind |
|---|---|---|---|
| 0a5e500 | Record Marcus W7 Portal '03 restyle ruling before code | DECISIONS.md (+11) | records |
| a9eb63e | Pin F1 comparisons and qualify the untouched Chrome 156 baseline | 4 reader suites, stamp | W7.10 pin |
| 5a1939f | Restyle the reader as Portal '03 and add panel fullscreen | app.js, svg, index.html, styles.css | code |
| 1853463 | Record Marcus W7.11 exposure-test ruling | DECISIONS.md (+1) | records |
| 2737bd3 | Require the exact distinct frontend asset references under W7.11 | server_exposure.test.js (1 line) | W7.11 |
| 12dc302 | Record Marcus W7.12 reader geometry ruling | DECISIONS.md (+10) | records |
| 17b16bc | Restore reader space across W7 layouts without resizing words | styles.css | code |
| a242904 | Restore exact Play button whitespace in the Finished-state snapshot | index.html (2 lines, whitespace only) | code |
| cc00891 | Keep fullscreen position and remaining time visible with long titles | styles.css | code |
| ad1761f | Record the approved W7 whitespace and visual baseline clarifications | DECISIONS.md (+4) | records |
| 53cd617 | Record the W7 floor-aware target and 80-case cross-check | DECISIONS.md (+2) | records |
| e639930 | Verify the Portal reader against its measured layout and pinned data baseline | tests (6) + `tools/static_smoke.cjs` | tests |
| c5da318 | Assert full containment in both wide probe loops | reader-wide.cjs (+1) | tests |
| 51e22d0 | Record verified W7 parity stamp, evidence and independent-review handoff | report, evidence, AGENTS.md, generated stamp | records + stamp |

- Author and committer on all 14: `Marcus <292589207+MarcTheSharkWalksInThePark@users.noreply.github.com>`.
- `Agent: Codex (gpt-6-astra, xhigh)` trailer on all 14.
- Records commits touch only `docs/DECISIONS.md`. `51e22d0` also carries `AGENTS.md` (two added lines:
  the W7 ruling and the open item) and the generated `tests/parity-stamp.json`, as AGENTS.md requires.
- DECISIONS.md: 28 added lines, **zero removed** across the range; no W1–W6 text or earlier W7 text edited.
- Order: W7.1–W7.10 (17:20) before the pin (17:33) and code (17:40); W7.11 (21:46) before 2737bd3 (22:13);
  W7.12 (23:16) before 17b16bc (23:20); the wide-frame and floor-aware clarifications (16:37, 16:46)
  before e639930 (16:52). **Exception (F-9):** the whitespace approval's record (ad1761f, 16:37) follows
  a242904 (11:34). cc00891 is a fullscreen readout fix under W7.5 and needs no separate ruling.

## Reproduced numbers (fresh clone)

| Check | Codex claims | My result |
|---|---|---|
| `npm test` | 514 passed, 0 skips | **514** = 223 static + 169 proxy + 32 exposure + 90 post-review, 0 skips, exit 0 |
| `npm test`, Chrome/Playwright unavailable (W4.2) | Node-only | **514, identical**, exit 0. Node permission model as in my F1 review: `chrome.exe` stat `ERR_ACCESS_DENIED`, Codex Playwright path `ERR_ACCESS_DENIED`, bare `playwright` `MODULE_NOT_FOUND`, `browser-helper.runtime()` `ERR_ACCESS_DENIED` |
| `npm run parity` | 924 passed, 0 app errors/uploads; 9 DOCX + 7 PDF | **924** passed, 0 errors, 0 blocked origins, 0 uploads (13 min). Extraction: `docx 9, mismatches 0, pdfCompared 7, pdfDifferences 2, skipped 0`. Finished 288 direct / 288 natural / 108 restoration. All four Portal runs entered **native** fullscreen |
| Regenerated stamp | byte-identical, 225 inputs | SHA-256 `c9fdc679…62816714dbf0dd` before and after; 225 inputs; `node tools/parity-stamp.cjs`: `PASS: browser parity stamp matches committed inputs` |
| `npm run mutations -- --out <scratch>` | 78 = 77 KILLED + M9 | **78 = 77 KILLED + M9** (SURVIVED, the registered equivalent), 0 unexpected, 0 errors. All 78 rows: 19 of 20 fields equal to Codex's `results/w7-restyle/mutations.json` (id, transform, sourceSpec, before/mutated/restored SHA-256, verdict, failingChecks, …). The 20th, the raw `run` log, differs only in ephemeral port numbers (12 rows) and random temp-folder names (2 rows). `tools/r59.spec.json` SHA-256 `88909206…18da` at both SHAs |
| `npm run build` | 199 filenames; four changed | **199** identical filenames against a fresh 2a37644 build; contents differ only for `app.js`, `assets/wordflow-mark.svg`, `index.html`, `styles.css`. STATIC_FILES still 197 |

Suite counts, 2a37644 → 51e22d0. Node: 223 → 223, 169 → 169, 32 → 32, **81 → 90** (+9 W7 checks).
Chrome: all **884** check names of Codex's qualified run (a9eb63e = 2a37644 tests + the pin; 2a37644
itself cannot complete parity, which is W7.10's reason) are present unchanged in my run, plus exactly
**40** new `W7 …` checks (10 groups × 2 themes × 2 widths) = 924. No suite decreased.

## Scope audit (`git diff 2a37644 51e22d0`)

Changed, outside `docs/verification/`: `app.js`, `assets/wordflow-mark.svg`, `index.html`,
`styles.css`; `tests/reader-smoke.cjs`, `reader-round2.cjs`, `reader-wide.cjs`, `reader-finished.cjs`;
`tests/server_exposure.test.js` (line 275 only); new `tests/reader-portal.cjs`;
`tests/post-review.test.cjs` (+18 lines, 9 checks); `tests/parity-stamp.json` (generated);
`docs/DECISIONS.md`; `AGENTS.md`; **`tools/static_smoke.cjs` (+1 line, F-7)**.

New W7 check files, justified against the ruling (I do not hold the build prompt's §4.2):
`tests/reader-portal.cjs` tests W7.4 (system theme, page-only toggle, labels, no storage, the 13-field
record), W7.5 (three entries and exits, ±25 WPM with clamps, idle hide only while playing, reveal,
unfocusable hidden bars, both fallbacks and the exact status text, fullscreen F1 geometry), W7.6
(F ignored in fields and with modifiers), W7.1 hygiene (CSP, h1 name, icon labels), contrast and
overflow. `tests/post-review.test.cjs` adds Node checks for the F shortcut, `effectiveTheme`,
`toggleTheme` and "storage writes use only the v1 key". `tools/static_smoke.cjs` only registers the
Portal suite before the existing checks.

**Byte-identical to 2a37644 (empty diff, same tree/blob id):** `server.js`, `lib/`, `functions/`,
`api/`, `file-extractors.mjs`, `vendor/`, `tests/fixtures/`, `_headers`, `_routes.json`, `404.html`,
`.githooks/`, `.gitattributes`, `package.json`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `HOSTING.md`,
`README.md`, `CLAUDE.md`, and every file in `tools/` **except** `static_smoke.cjs` (push.sh, build.cjs,
parity.cjs, parity-stamp.cjs, mutations.cjs and r59.spec.json all identical). STATIC_FILES: 197 names,
unchanged (server.js identical).

**R59:** no protection, proxy rule, gate or hosting setting changed. The served CSP equals `_headers`
exactly; Permissions-Policy unchanged (it does not restrict fullscreen).

**Line endings.** Blobs are LF. Checkout gives CRLF on every line of `app.js`, `index.html`,
`styles.css` and the SVG (CR count = LF count); `.cjs`, `.js`, `.json` and `.md` are LF with no CR.
No mixed endings. **No new non-ASCII outside docs/**: `index.html` lost its only non-ASCII character
(the W6.5 em dash, now `&mdash;`); app.js uses `·` escapes.

**Privacy.** No e-mail address at all in added text (all files; eight `.gz` evidence files
decompressed; 101 added PNGs scanned for text chunks). No absolute user-profile path in added text.

## Test-change classification (every changed or removed test line, 2a37644 → 51e22d0)

Line numbers are old → new. Classes: V visual re-baseline (W7.8), P W7.10 pin, E W7.11, G W7.12 gate,
C 2026-11-08 clarification, N new W7 check. **No line is X.**

| File | Old line(s) | New line(s) | Class | What and why |
|---|---|---|---|---|
| reader-smoke.cjs | — | 4 | P | `PRE_F1 = "b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7"` |
| reader-smoke.cjs | — | 85–136 | N | `tokenMarkup()` (word/focus-letter markup minus font-size style, fitting classes and the W6 region attributes) and `checkTokenLayout()` (full containment, no frame overflow, font ≥ 10, wrapped ⇒ 10 px, scrolling ⇒ wrapped, and the W6.5/W6.14 rules for role, tabindex, aria-label, aria-describedby, inert, marker and note, plus `noCollisions`) |
| reader-smoke.cjs | 92 | 145 | P | `git show master:` → `PRE_F1:` |
| reader-smoke.cjs | 105 | 158–160 | V | `font, word(rect), classes, text, frame` equal to master → `text` equal, markup equal, candidate layout. `dataSame` and the `!wrapped && !scrolling && noteHidden` line are untouched |
| reader-smoke.cjs | 184 | 239 | P/N | exports add `PRE_F1`, then the two helpers |
| reader-round2.cjs | 4 | 4 | P/N | imports |
| reader-round2.cjs | 79 | 79 | P | baseline `"master"` → `PRE_F1`; `fc98d1e` unchanged |
| reader-round2.cjs | 81–92 | — | V | test-only flat-backdrop CSS route, used only for pixel identity |
| reader-round2.cjs | 121, 123–124 | — | V | `flatBackground=true` and its capture-history comment |
| reader-round2.cjs | 129–145 | 114–118 | V (+N) | master-fitting DOM, `word/frame/context/font/classes` and pixel equality → markup equal **for every token**, `scrolling == wrapped && naturalHeight > threshold` (W6.7), candidate layout. `assert(m.ink.fullyVisible)` stays |
| reader-round2.cjs | 221 | — | V | `unroute` of the removed route |
| reader-wide.cjs | 3–4 | 3 | P/N | imports (drop `execFileSync`) |
| reader-wide.cjs | 6–7, 10–14 | 5–43 | C | `floorMeasure` → `unwrappedMeasure(page, size)` (also strips `fitted-long-word`, which no CSS rule targets at either SHA; `try/finally` only restores, no `catch`) and `checkWideTarget()` — the floor-aware gate, below |
| reader-wide.cjs | 17 | 45 | P | baseline → `PRE_F1`; the round-2 `oldRows` file is unchanged |
| reader-wide.cjs | 19–25, 37, 56, 76 | — | V | flat-backdrop route and its toggles/unroute |
| reader-wide.cjs | 32 | 53 | C | `checkFloor` measures via `unwrappedMeasure(page,"10px")`; the predicate (wrap iff ≤ 10 px and 10 px text > inner width) is unchanged |
| reader-wide.cjs | 44–54 | 64–67 | V + C | master-visible `outerHTML/word/frame/context/font/classes/ink` and pixel equality → markup equal + candidate layout; the unconditional "≤ 90% for master-clipped" → `checkWideTarget` (clarification (1)). `before.ink.fullyVisible == oldRow` and `after.ink.fullyVisible` stay |
| reader-wide.cjs | — | 77 | C | `checkTokenLayout` in the grid loop (clarification (2), c5da318) |
| reader-wide.cjs | 66–71 | 79–82 | C | the 90% guard limited to master-clipped, unwrapped tokens with master's box inside 90%/58% → `checkWideTarget` on **every** token |
| reader-finished.cjs | 3–4 | 3 | N | imports |
| reader-finished.cjs | 80, 85–86 | 79, 84 | V | `restartState` drops computed `font` and `rectangle`; index, finished, playing, countdown, countdownValue, status, word `outerHTML`, panelHidden and Play `outerHTML` still deep-equal PRE_F1 |
| reader-finished.cjs | — | 97–98 | N | settle, then `checkTokenLayout` after the restart compare |
| reader-finished.cjs | 106 | 106 | P | baseline → `PRE_F1`; `8ae3d54` unchanged |
| reader-finished.cjs | 108–111, 176, 184 | — | V | flat-backdrop route and toggles |
| reader-finished.cjs | 125–127 | 121–124 | V (+N) | `frame/panel` rect equality and master-visible `font/renderStyle/classes/outerHTML/word/text(rect)` → `panelHidden` equal, markup equal for every last word, candidate layout, finished frame = reading frame. `paintInside`, `wordText === token`, `orderCheck`, `inertInputs` stay |
| reader-finished.cjs | 131–156 | — | V | pixel identity and recapture |
| server_exposure.test.js | 275 | 275 | E | `refs.length >= 4` → distinct set equals {app.js, styles.css, assets/wordflow-mark.svg} |
| post-review.test.cjs | — | 24–41 | N | 9 Node checks |
| tools/static_smoke.cjs | — | 39 | N | runs `portalChecks` first (scope: F-7) |
| reader-portal.cjs | — | 1–319 | N | new suite (above) |
| parity-stamp.json | `chrome` | `chrome`, 3 hashes | P / generated | 155 → 156 at a9eb63e (W7.10); app.js, index.html, styles.css at 51e22d0 |

**W7.10 pin.** All four suites read one `PRE_F1` = `b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7`. No
`"master"` or `master:` git ref remains in `tests/` or `tools/` (the only hits are the evidence label
`master:"b9d3d9e"`, a fixture hostname in `proxy.test.mjs` and `push.sh`'s branch check). `fc98d1e` and
`8ae3d54` are unchanged. The pin commit changes nothing else.

**W7.11.** Exactly line 275 changed; the file is otherwise byte-identical (diff with line 275 removed is
empty). I ran each SHA's own `frontEndReferences()`/`frontEndFiles()` bodies (helper text SHA-256
identical) against its own `index.html`: references go 4 → 3 (the duplicate SVG left with the header
image), and `frontEndFiles()` returns **app.js, assets/wordflow-mark.svg, index.html, styles.css at both
SHAs**. Node's `deepStrictEqual` on Sets is order-independent; the message lists the set found.

**Behaviour, data and security assertions.** Unchanged in meaning: token text (smoke, finished
`wordText`), index, word list, clipboard, all 13 session fields and `dataSame` (round-2 data block and
smoke, byte-identical), progress labels and slider, play/pause/countdown and restart (W6.9 block
byte-identical; restart still compares to PRE_F1), the note text, inertness (`inertInputs` unchanged,
plus the new self-consistent attribute rules), one Play advancing one word (W6.9 block unchanged),
extraction (`browser-parity.cjs` and fixtures unchanged) and exposure (W7.11 only). No assertion was
loosened outside the ruled visual comparisons.

**Play whitespace.** `a242904` changes exactly two lines of `index.html`, each losing two leading spaces
(`git diff -w` is empty). The W6.9 `outerHTML` comparisons (`summary`, `controls`) are unchanged and pass.

## Floor-aware target and the 80 cases

`checkWideTarget()` (reader-wide.cjs 22–43), applied to every cap probe and grid token:

- `fitted = unfitted text exceeds the inner frame || class fitted-long-word`. The unfitted width is
  measured with the inline font removed. This is clarification (1). app.js adds `fitted-long-word`
  whenever it shrinks a word (line 425), so every fitted token is covered.
- **(a)** `font > 10` and fitted ⇒ `contentWidth <= 0.9 × inner width`, strict.
- **(b)** otherwise `font === 10` exactly; wrap iff the 10 px text exceeds the inner width (`checkFloor`,
  same predicate as before); an unwrapped floor token must equal its separately measured 10 px width
  exactly; full containment comes from `after.ink.fullyVisible` and `checkTokenLayout` in both loops.
- **(c)** the only tolerance: wrapped range width ≤ wrapped box width + 1/64 px. The wrapped box must
  also be ≤ 90% (stricter than required).
- No other tolerance, skip, swallowing `catch`, early return (besides "not fitted"), reduced loop,
  viewport list or probe count: the cap probes still iterate the 36 round-2 rows, the grid still has
  9 layouts × 2 × 2 × 9 tokens, and the "same master classification" assertion is intact.

My cross-check of 13 of Codex's 80 cases (wide-suite settings, Mint as in the smoke; the four wrapped
ones also in Graphite). Each cell is **2a37644 / candidate**; width is the rendered range, frame the
inner width.

| Viewport, mode | Ctx / letter | Token | Font | Width (px) | Frame | % | Wrapped |
|---|---|---|---|---|---|---|---|
| 844×390 normal | on / on | Real × 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990 / 90.004 | yes / yes |
| 844×390 normal | on / off | Real × 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990 / 90.004 | yes / yes |
| 844×390 normal | off / on | Real × 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990 / 90.004 | yes / yes |
| 844×390 normal | off / off | Real × 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990 / 90.004 | yes / yes |
| 390×844 normal | on / on | W × 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158 / 92.618 | yes / no |
| 390×844 normal | on / on | W × 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158 / 95.266 | yes / no |
| 390×844 normal | on / on | W × 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158 / 97.909 | yes / no |
| 390×600 normal | off / off | W × 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149 / 97.909 | yes / no |
| 390×844 Focus | on / on | W × 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158 / 95.266 | yes / no |
| 996×950 Focus | on / off | W × 99 | 10 / 10 | 813.96875 / 874.953125 | 912 / 908 | 89.251 / 96.360 | yes / no |
| 996×950 Focus | on / off | W × 102 | 10 / 10 | 813.96875 / 901.46875 | 912 / 908 | 89.251 / 99.281 | yes / no |
| 1400×950 Focus | off / on | W × 135 | 10 / 10 | 1175.734375 / 1193.140625 | 1316 / 1312 | 89.342 / 90.941 | yes / no |
| 1400×950 Focus | off / on | W × 144 | 10 / 10 | 1175.734375 / 1272.671875 | 1316 / 1312 | 89.342 / 97.002 | yes / no |

All 13 (17 with Graphite) equal Codex's rows 25–28, 1–3, 24, 70, 33, 36, 57 and 62 exactly. Every case
is fully inside the frame on both SHAs. On the candidate the unwrapped widths equal their measured
10 px widths exactly, and the four wrapped ranges overhang their 342 px box by exactly 0.015625 px.
**Why 80 wrapped before and 4 now:** the W7 word font (Trebuchet MS bold, styles.css 356–370) is about
12% narrower than the pre-restyle 780-weight font, so W × 35 at 10 px measures 309.3 px (fits 334)
instead of 351.7 px (exceeds 342). `fitDisplayedWord`, `shouldBreakWord` and `shouldScrollWord` are
byte-identical, so app behaviour is unchanged and only the gate moved, as Marcus's cross-check required.

## W7.12 geometry (reproduced; outer frame rectangles, CSS px)

| Viewport | Theme | Mode | 2a37644 | Candidate | W % | H % | Min clearance box / ink |
|---|---|---|---|---|---|---|---|
| 390×844 | dark | Normal | 344.00 × 280.00 | 340.00 × 280.00 | 98.84 | 100.00 | 24.58 / 20.17 |
| 390×844 | dark | Focus | 344.00 × 573.91 | 340.00 × 573.91 | 98.84 | 100.00 | 105.14 / 100.73 |
| 390×600 | dark | Normal | 344.00 × 280.00 | 340.00 × 280.00 | 98.84 | 100.00 | 24.58 / 20.17 |
| 390×600 | dark | Focus | 344.00 × 408.00 | 340.00 × 408.00 | 98.84 | 100.00 | 58.69 / 54.28 |
| 768×1024 | dark | Normal | 318.00 × 368.00 | 318.00 × 368.63 | 100.00 | 100.17 | 41.50 / 36.08 |
| 768×1024 | dark | Focus | 686.00 × 721.00 | 686.00 × 683.61 | 100.00 | 94.81 | 129.69 / 124.27 |
| 1400×900 | dark | Normal | 606.00 × 577.00 | 606.00 × 565.03 | 100.00 | 97.93 | 58.36 / 49.41 |
| 1400×900 | dark | Focus | 1318.00 × 612.00 | 1318.00 × 612.00 | 100.00 | 100.00 | 65.05 / 55.09 |
| **1400×950** | dark | **Normal** | 606.00 × 627.00 | **606.00 × 615.03** | 100.00 | 98.09 | 72.36 / 63.41 |
| 1400×950 | dark | Focus | 1318.00 × 647.00 | 1318.00 × 646.00 | 100.00 | 99.85 | 74.56 / 64.61 |
| 1708×950 | dark | Normal | 914.00 × 627.00 | 914.00 × 615.03 | 100.00 | 98.09 | 72.36 / 63.41 |
| 1708×950 | dark | Focus | 1626.00 × 647.00 | 1626.00 × 646.00 | 100.00 | 99.85 | 72.39 / 62.44 |
| 1920×1080 | dark | Normal | 1126.00 × 757.00 | 1126.00 × 745.03 | 100.00 | 98.42 | 108.77 / 99.81 |
| 1920×1080 | dark | Focus | 1838.00 × 777.00 | 1838.00 × 745.03 | 100.00 | 95.89 | 100.13 / 90.17 |
| 390×844 | light | Normal | 344.00 × 280.00 | 340.00 × 280.00 | 98.84 | 100.00 | 24.58 / 20.17 |
| 390×844 | light | Focus | 344.00 × 573.91 | 340.00 × 573.91 | 98.84 | 100.00 | 105.14 / 100.73 |
| 390×600 | light | Normal | 344.00 × 280.00 | 340.00 × 280.00 | 98.84 | 100.00 | 24.58 / 20.17 |
| 390×600 | light | Focus | 344.00 × 408.00 | 340.00 × 408.00 | 98.84 | 100.00 | 58.69 / 54.28 |
| 768×1024 | light | Normal | 318.00 × 368.00 | 318.00 × 368.63 | 100.00 | 100.17 | 41.50 / 36.08 |
| 768×1024 | light | Focus | 686.00 × 721.00 | 686.00 × 681.61 | 100.00 | 94.54 | 129.13 / 123.70 |
| 1400×900 | light | Normal | 606.00 × 577.00 | 606.00 × 563.03 | 100.00 | 97.58 | 57.80 / 48.84 |
| 1400×900 | light | Focus | 1318.00 × 612.00 | 1318.00 × 612.00 | 100.00 | 100.00 | 65.05 / 55.09 |
| **1400×950** | light | **Normal** | 606.00 × 627.00 | **606.00 × 613.03** | 100.00 | 97.77 | 71.80 / 62.84 |
| 1400×950 | light | Focus | 1318.00 × 647.00 | 1318.00 × 646.00 | 100.00 | 99.85 | 74.56 / 64.61 |
| 1708×950 | light | Normal | 914.00 × 627.00 | 914.00 × 613.03 | 100.00 | 97.77 | 71.80 / 62.84 |
| 1708×950 | light | Focus | 1626.00 × 647.00 | 1626.00 × 646.00 | 100.00 | 99.85 | 72.39 / 62.44 |
| 1920×1080 | light | Normal | 1126.00 × 757.00 | 1126.00 × 743.03 | 100.00 | 98.15 | 108.20 / 99.25 |
| 1920×1080 | light | Focus | 1838.00 × 777.00 | 1838.00 × 743.03 | 100.00 | 95.63 | 99.56 / 89.61 |

Fixture `Lead Hello Tail End.` on "Hello". Clearance is the smallest of six (Large, Comfort, Compact ×
top/bottom), as element boxes (the existing `noCollisions` measure) and as text ink. **Gates:** at
1400×950 normal, 606 ≥ 575.70 and 615.03 / 613.03 ≥ 595.65; every other ratio ≥ 94.54% (≥ 90%);
smallest clearance 24.58 px box / 20.17 px ink (≥ 8). The frame is the same for all three sizes.
**Word sizes equal 2a37644 for Large, Comfort and Compact at every viewport and mode** (for example
128 / 108.8 / 83.2 px at 1400, 64 / 51.2 / 38.4 px at 390, 140 and 144 px in focus mode). This table
equals Codex's to the hundredth.

## Hand mutants (clones only; exact replacement, restored and SHA-256 verified)

The 15 requested mutants, with "theme in the saveSession payload" run in two variants (M2a, M2b), plus
one extra (M16): 17 in all. Node suites first; if green, the full Chrome smoke
(`tools/static_smoke.cjs`, which stops at the first failing check). Four clones ran in parallel; every kill names a check aimed at the mutated behaviour, so
none was a load artefact.

| # | Mutant | Verdict | Caught by |
|---|---|---|---|
| M1 | theme toggle also writes `localStorage.setItem("wordflow-theme", …)` | KILLED | Node post-review "theme toggle overrides the system on this page" (ReferenceError in its sandbox); "storage writes use only the v1 resume key" would also fail |
| M2a | `theme` (always defined) added to the saveSession payload | KILLED | Chrome "W7 1400 dark system theme, manual choice and resume fields" (14 keys ≠ 13) |
| M2b | `theme: dataset.theme` (undefined until a manual toggle) added to the payload | **SURVIVED** (514 + 924) | — (F-5) |
| M3 | F toggles fullscreen while a field is focused | KILLED | Chrome "W7 1400 dark F ignores editable controls and modifiers" |
| M4 | F toggles with Ctrl held | KILLED | Node "fullscreen ignores ctrlKey" |
| M5 | fullscreen −/+ by 10 instead of 25 | KILLED | Chrome "W7 1400 dark WPM readout, step and clamps" |
| M6 | fallback does not turn on Focus mode | KILLED | Chrome "W7 1400 dark reload and unsupported or refused API fallback" |
| M7 | fallback status text changed by one character | KILLED | same |
| M8 | auto-hide also while paused | KILLED | Chrome "W7 1400 dark idle controls only while playing and keyboard reveal" |
| M9 | `fullscreenchange` no longer calls `fitDisplayedWord()` | **SURVIVED** (514 + 924) | — (F-3) |
| M10 | one word of the privacy note ("uploaded" → "shared") | **SURVIVED** (514 + 924) | — (F-4) |
| M11 | `style=""` added to the ticker `<div>` | KILLED | Chrome "W7 1400 dark CSP, accessible heading and icon buttons" (Node static regression does not check) |
| M12 | ticker text "fullscreen" → "full screen" | **SURVIVED** (514 + 924) | — (F-6) |
| M13 | light/dark label logic inverted | KILLED | Chrome "W7 1400 dark system theme, manual choice and resume fields" |
| M14 | Large word `clamp(4rem, 10vw, 8rem)` → `7.5rem` (128 → 120 px) | **SURVIVED** (514 + 924) | — (F-2) |
| M15 | F1 floor 10 → 9 px (`let low = 9` and `Math.max(9, …)`; changing only one is equivalent) | KILLED | Chrome "W7 1400 dark fullscreen F1 geometry and playback" (`checkTokenLayout`: wrapped ⇒ 10 px) |
| M16 | extra: local server Permissions-Policy adds `fullscreen=()` | KILLED | Node static regression (header assertion) |

## Spec and behaviour checks (independent of Codex's tests)

**Storage (W7.4).** app.js has one `localStorage.setItem(STORAGE_KEY, …)` and one `getItem(STORAGE_KEY)`,
the same two lines as at 2a37644 (session code); no `sessionStorage`, `document.cookie` or `indexedDB`. In Chrome, both themes: before
load `[]`; after loading text, after each theme toggle, in fullscreen and after exit, only
`wordflow-reader-session-v1`, with **the same value byte for byte across both toggles** and 13 fields;
sessionStorage empty, cookie empty, `indexedDB.databases()` empty. After reload, `data-theme` is unset.

**Privacy text** byte-identical (the whole `<p class="privacy-note">` element has the same SHA-256 at
both SHAs) and equal to W4.6 in the DOM.

**ids and hooks.** 65 ids at 2a37644, 74 at the head; none removed or renamed; nine added
(fullscreen-button, fullscreen-exit, fullscreen-faster, fullscreen-position, fullscreen-slower,
reader-fullscreen, reader-wpm, reading-title, theme-button). All 78 selectors used by app.js at either
SHA resolve in the candidate DOM, except `.empty-word, .countdown-word`, which app.js creates itself.
All 73 original app.js functions are present; only `renderProgress` and `renderControls` changed (they
feed the new readouts). `fitDisplayedWord`, the predicates, `saveSession`, `restoreSession`, playback,
`seekTo`, `setWpm` and `toggleFocusMode` are byte-identical.

**CSP hygiene.** index.html: no `style=`, no `<style>`, no `on*=`, one `<script src="app.js">`; no
`http(s):`, `//`, `@import` or `url()` in index.html or styles.css. The local server sends exactly the
production `_headers` CSP; loading the app, toggling themes, entering/exiting fullscreen and finishing
produced **zero** `securitypolicyviolation` events and zero console errors or warnings in both themes.

**Favicon SVG.** Parses as standalone `image/svg+xml` (no parser error; SVG namespace); elements svg,
defs, linearGradient, stop, pattern, path, rect, g, circle; no `<script>`, `<text>`, `href`/`xlink`,
`<image>`, `foreignObject` or external `url()`. Linked only as the favicon.

**Design conformance** (no deviation found):

- Lime tokens `#8fd400 #a8e83a #d6f79a #9be22d #6fb000 #4a7a00 #2f4d00 #142200 #e8ffc2` all present.
- Graphite: shell `#24272c`, panel `#2c3036`, ink `#e8e8e8`, muted `#aab0b8`.
- Mint: shell `#f1f5ec`, panel `#fafcf7`, ink `#1d2416`, muted `#4b5641`, link `#3f6b00`. Applied by
  `prefers-color-scheme` and by `data-theme`.
- Reading screen is literal `#000000` with scanlines in both themes and in fullscreen.
- Steel plate "WORDFLOW" with a lime LED; tagline "one word at a time"; h1 name "WordFlow Reader".
- Ticker text exact; badges `NO | UPLOADS`, `100% | FREE`, `PRIVACY | FIRST`.
- Theme button "Lights on" while dark and "Lights off" while light, following system changes.
- Fallback status exact: "Fullscreen isn't available in this browser; focus mode is on instead."
- Fullscreen head and foot: "Exit fullscreen (Esc)", WPM LCD, −/+, "Space play/pause · ← → step · F
  fullscreen · Esc exit".

**Contrast (WCAG, computed styles, worst case over every gradient stop; my compositor).**

| Element | Graphite | Mint |
|---|---|---|
| body/panel text | 10.83 | 15.45 |
| muted (tagline, status, privacy, LCD captions) | **5.39** | 6.14 |
| muted field label / progress meta | 6.07 | 7.51 |
| panel head h2 / now reading | 6.35 | 12.52 |
| legend (link colour) | 9.01 | **6.13** |
| gel primary / active tab | 6.27 | 6.27 |
| chrome and subtle buttons | 10.68 | 10.68 |
| inactive tab | 6.73 | 10.68 |
| LCD (WPM, words, time) | 14.75 | 14.75 |
| ticker text / TIP | 14.73 / 9.21 | 14.73 / 9.21 |
| badges left / right | 16.89 / 11.34 | 16.89 / 11.34 |
| reader word / focus letter / context | 19.92 / 13.54 / 6.53 | same |
| fullscreen title, readout, exit, LCD, hint | 6.27–19.92 | 6.27–19.92 |
| finished title, metrics, buttons | 6.27–11.07 | 6.27–14.15 |

All ≥ 4.5; minima 5.39 and 6.13 equal Codex's. (A first version of my compositor stacked gradients
over white and gave false lows for the reader screen; `contrast2.cjs` is the corrected one.)

**Fullscreen** (headless 1400×950 and 390×844, and headed 1400×950):

- Entry by the button, the reader icon and F, and exit by F and the Exit button, all work natively with
  `.is-fullscreen` in sync.
- **A real Escape key could not be tested.** Playwright's injected Escape does not exit element
  fullscreen in headless or headed Chrome; the app has no Escape handler and resyncs on
  `fullscreenchange`, which works for `document.exitFullscreen()`.
- Bars hide **2498 ms** after playback starts (three runs: 2498.1 / 2498.2 / 2498.9), never while paused
  (3.2 s check), and stay hidden with the cursor resting on Play. Headed, the only events after the hide
  were `pointerout`/`pointerover`, which the app ignores. They reappear on pointer move, key press and
  CDP touch.
- Hidden bars: after the 200 ms fade nothing in them can be focused. During the fade they still can,
  which is harmless because any key reveals them.
- Leaving fullscreen fades the bars back in over 200 ms, from any path (sampled).
- Long title (cc00891): the title ellipsizes and " · word 4 of 45 · 0:18 left" is fully inside the
  panel and not clipped at 1400 and 390 (own line at 390).
- Real 45-character word: 55 px at 1400 (54 px headed) and 14 px at 390. W × 2000: 10 px wrapped,
  scrolling at 390. Both fully inside the frame, with no frame overflow.
- Reload starts outside fullscreen.

**Accessibility.**

- `getByRole("heading", {level: 1, name: "WordFlow Reader", exact: true})` matches once.
- All nine icon-only buttons have an aria-label and title.
- `:focus-visible` gives a 2 px lime outline plus a 2 px dark ring on every control tried, in both
  themes; crops inspected (the dark ring keeps it visible on Mint).
- Label-in-name: F-8.
- Overflow at 390, 768, 1400, 1708 and 1920 px: none. At ≤ 340 px: F-1 (scan 300–430 px in both
  themes: candidate overflows at 300–340, 2a37644 only at 300–305).

## Visual inspection

I took 24 screenshots of my own (1400×950 and 390×844, both themes: normal, focus, fullscreen paused,
fullscreen playing, finished, review), plus full-page phone views and focus-ring crops, and looked at
each, and at Codex's 24. Nothing is broken, overlapping or unreadable at these sizes:

- The black screen, plate, LCDs, gel and chrome buttons, ticker, badges and footer render in both themes.
- Phone fullscreen puts the readout on its own line; playing hides both bars; the Finished panel sits
  over the frame as designed.
- In focus mode the footer is below the fold at 1400×950 and the transport at 390, as Codex reports.

Two first-capture artefacts were mine and are explained: a playing shot and a Finished shot taken
inside the 200 ms fade. Retaken. The only defect seen is F-1 (320 px). No design taste is judged.

## NOT verified

- A physical Escape key leaving fullscreen, and true OS fullscreen sizing (headed Playwright kept the
  panel inside the 1384×945 window).
- Other browsers, real iPhone/iPad (the fallback was tested only by disabling or rejecting the API in
  Chrome), physical touch (CDP-emulated only), zoom levels beyond the 320 px width equivalence,
  device-pixel ratios, forced colours, reduced motion (a `prefers-reduced-motion` rule removes the
  fade; not exercised), and screen readers (names and labels only).
- 67 of Codex's 80 floor rows individually (13 reproduced, including all four wrapped), and the 36
  above-floor grid cases individually (covered only by the passing suite).
- The build prompt's §4.2, which I do not hold. New checks are judged against W7.4–W7.8.
- A word-for-word comparison of W7 and the 2026-11-08 clarifications with Marcus's original relay. I
  have only the DECISIONS.md text.
- Codex's intermediate STOP evidence beyond spot checks; the live site and Cloudflare (out of scope;
  nothing deployed).

## Evidence

`docs/verification/results/w7-cc-review/` (absolute profile and scratch paths written `<home>` /
`<scratch>`, W4.1):

- `scripts/`: every probe and the mutant runner.
- `runs/`: Node, browser-denied, parity (`parity/`, large JSON gzipped), mutations (gzipped), geometry,
  spec, contrast, widths, fullscreen, flicker, fade, focus, refit, exposure, build manifests and id lists.
- `mutants/`: per-mutant transform, SHA-256 before/mutated/restored, the Node and smoke results.
- `shots/`: contact sheets of my screenshots and of Codex's, the 320 px comparison and the M9 view.

## Scratch

Not deleted. Under `<home>\AppData\Local\Temp\claude\<project>\a4870a79-41f1-4161-89fe-2cd278af36f0\scratchpad\`:
`wf` (review clone, restored and clean), `wf-m1` … `wf-m4` (mutant clones, sources restored; their
tracked evidence screenshots were rewritten by smoke runs), `wf-base` (2a37644 clone with `dist/`),
`ev/`, `scripts/`, `tmp/`, `emptyhome/`. None holds a secret or a `.env` file. Marcus may delete the folder.

## Model and effort

Claude Code, model `claude-opus-5-5`, effort medium. Builder and reviewer are different agents.
