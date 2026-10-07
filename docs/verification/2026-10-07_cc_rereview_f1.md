# CC re-review — F1 candidate under RULINGS W6.1–W6.12

Date: 2026-10-07. Reviewer: Claude Code (claude-opus-5-5, effort high). Builder: Codex.
This is the single re-review W6.11 allows. Reviewed: local `fix/f1-long-token` at
`2215e81c482e16fda4ba496c720a821a3f93801f`, against master `b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7`
(unchanged). I treated Codex's round-2 and round-3 reports as claims and did not edit them.
Nothing was merged, pushed or deployed. I installed no package, changed no setting and opened no
`.env` file.

## Verdict: CLEAR WITH FINDINGS

Every builder number reproduces in a fresh clone. The three wide-frame rulings hold under my own
probes with real Norwegian and English words:

- **W6.12:** 672 of 672 tokens that are fully visible on master are DOM- and pixel-identical to
  master, including 212 that are wider than the 820 px box. All 168 tokens clipped on master are
  now inside the frame.
- **W6.7:** at all 9 round-3 layouts, the word, the context words and the note share 0 painted
  pixels just below and just above the threshold.
- **W6.9 and W6.10:** each path needs exactly one Play press, and Space works as ruled.

My earlier findings F-1 to F-5 are closed. F-6 is closed except for the landscape note, which I
judge acceptable (see "Landscape" below). F-7 is partly closed.

One new defect blocks a CLEAR verdict:

| # | Finding | Severity | Ruling affected |
|---|---|---|---|
| **R-1** | **The Finished screen leaves the final word unfitted.** `fitDisplayedWord()` now returns early when `state.finished` (`app.js:369`), before master's fitting runs. Any final word that master shrinks to fit is shown at base size on the branch and clipped by the frame, behind the Finished panel, with its edges visible. This happens in ordinary use: in a natural playback at the default size, "We read about understanding." and "Vi leser om kommunikasjon." both show it at 390 and 1400 px. Master fits 34 of the 35 ordinary words I tested at large size, down to the 7-letter "Kommune". Data is unaffected. | Medium (visible, common, cosmetic) | W6.1 ("every token that fits at or above the floor renders exactly as before") and W6.9 ("the behaviour after finishing is identical to master's") |

There are also informational observations (O-1 to O-5), none of which I consider blocking. Under
W6.11, F1 must not be described as fixed: the records below say "CC re-review CLEAR WITH FINDINGS
(R-1)".

## Setup

- `git clone --no-local <home>/Documents/WordFlow` into this session's scratchpad
  (`wf-rr`), with `fix/f1-long-token` checked out at `2215e81`. `core.hooksPath=.githooks`. Master
  in the clone is `b9d3d9e`. I created a local `master` branch from `origin/master` in the clone
  only, because the harness runs `git show master:<file>`. A `wf-master` worktree served master
  for the side-by-side runs. A second `--no-local` clone (`wf-mut`, also `2215e81`) took the hand
  mutants, so that they never touched the clone serving the browser probes.
- Node 24.16.0. Chrome 155.0.8059.39 at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- **Playwright 1.62.1 resolves from**
  `<home>\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright`.
  This is the fallback in `tests/browser-helper.cjs`. A bare `require("playwright")` gives
  `MODULE_NOT_FOUND`. L7 is unchanged.
- My probes are my own scripts (`results/cc-rereview-f1/scripts/`). They reuse only the
  repository's `tests/helpers.cjs start()` (loopback server) and `tests/browser-helper.cjs
  launch()`. They drive the app through its globals and the real paste UI. **No Codex probe
  script was used as evidence.**

## Reproduction

| Claim | Result | Evidence |
|---|---|---|
| `npm test`: 505 checks, 0 skips | **Reproduced**: 223 static + 169 proxy + 32 exposure + 81 post-review, exit 0 | `runs/npmtest.txt` |
| Same with Chrome and Playwright denied | **Reproduced, 505**, exit 0. Node permission model (fs-read limited to the clone, scratch and Node directories), `USERPROFILE`/`HOME` set to an empty folder. Inside: Chrome `ERR_ACCESS_DENIED`; real Playwright path `ERR_ACCESS_DENIED`; bare `playwright` `MODULE_NOT_FOUND`; `runtime()` `ERR_ACCESS_DENIED`. The script now derives the home path at run time, so no redaction was needed. | `runs/absent.txt`, `scripts/absent.sh` |
| `npm run parity`: 9 DOCX exact; 7 PDFs (5 exact / 2 pinned) | **Reproduced**: `docx 9, mismatches 0, pdfCompared 7, pdfDifferences 2, skipped 0` | `runs/parity.txt` |
| 272 smoke checks, 0 app errors, 0 uploads | **Reproduced**: 272 passed (230 at 1400 + 42 at 390), 0 errors, 0 blocked origins, 0 uploads, 0 skipped. Run time 2 min 41 s. | `runs/parity/static-smoke.json` |
| Generated stamp byte-identical to committed | **Reproduced**: `4898c798858f2407ed3ca178d0ada55bbde8c71a0f75fa17085edf1549666f03` before and after | `runs/parity.txt` |
| `node tools/parity-stamp.cjs` passes against committed blobs | **Reproduced**: `PASS: browser parity stamp matches committed inputs` | — |
| Only app.js differs in stamp inputs vs fc98d1e | **Reproduced**: 225 inputs on both sides in the same order; the only changed hash is `app.js`. The schema, chrome and playwright fields are unchanged. | — |
| Mutations: 78 = 77 KILLED + M9, definitions unchanged | **Reproduced**: `{"total":78,"killed":77,"equivalent":1,"unexpected":0,"errors":0}`. Across all 78 rows, every non-volatile field equals Codex's round-3 file and my first review: id, origin, source, file, suite, transform, sourceSpec, sourceCommit, targetCommand, adaptation, before/mutated/restored SHA-256, verdict, failingChecks, safetyWitness and expected. Only the captured `run` stdout differs, in 14 rows (ports and timing). `sourceSpecs` and `originalSha256` are equal. `tools/mutations.cjs` and `tools/r59.spec.json` have no diff from master; the spec SHA-256 is `88909206…f18da`. | `runs/mutations.json`, `runs/mutations.txt` |

### Hand mutants B1–B5, S1–S3

These are my original exact transforms (`scripts/mutants.cjs`), run against the four Node suites and
the full committed `tools/static_smoke.cjs`. Each mutant was restored and hashed after both
suites. `app.js` SHA-256 before and restored is
`a3ba064933477e672e6774f1a05fbc72604608b0f2c5bc651034fa9145c38ba8` for every row and at the end.
Every mutated hash equals the one in Codex's round-3 table.

| ID | Mutated SHA-256 | Node | First red Node check | Chrome | First red Chrome check | Rendered checks only* |
|---|---|---|---|---|---|---|
| B1 | d4b150161f02d7d877e1c91c8cb410670fd206048c74f074a57308be1b397305 | KILLED | floor word wider than frame breaks | KILLED | W6 browser predicate B1/B4 | KILLED |
| B2 | ea4a52c2e8806d669566278f0145ac58924eb80b283e4cc018281171375369b0 | KILLED | floor word fitting frame does not break | KILLED | W6 browser predicate B2 | survives |
| B3 | 1db9d8165f3f62086775c171451c39e77eb42fefa7cf0e975b8a82244ea4d226 | KILLED | no break above the floor | KILLED | W6 browser predicate B3/B5 | survives |
| B4 | 9acf9bc4a43af7b88a61acef8fd89ca2d6e0ffb35fe9e03aefd692117a41daff | KILLED | floor word wider than frame breaks | KILLED | W6 browser predicate B1/B4 | KILLED |
| B5 | 68d25bdf425a24416892c082df19e5b41aa76e775b266bd15a508eb9278419d6 | KILLED | no break above the floor | KILLED | W6 browser predicate B3/B5 | survives |
| S1 | dcf8004874d8c6ab2d569129bc1afd60a8dfb080f816a69c6de4530e394f9525 | KILLED | wrapped token at frame height does not scroll | KILLED | W6 browser predicate S1 | survives |
| S2 | caeac147eb7e092b00931e7b3051835a23e9b944bd893fe42a07a3fb17878e61 | KILLED | unwrapped token never enables vertical state | KILLED | W6 browser predicate S2 | survives |
| S3 | c7f232638c25d1827ee3f34be8108e973c37f57ff815fe561f2b7a5a7ee1ab32 | KILLED | strict excess height enables vertical state | KILLED | W6 browser predicate S3 | KILLED |

All 8 are red in both Node and Chrome, as required. *Informational, not a requirement: to see what
the Chrome kills rest on, I ran a second, scratch-only pass of the smoke with the one
`browserPredicateChecks` line removed (restored and hashed afterwards). The rendered layout checks
alone still kill only B1, B4 and S3, exactly as in my first review. The Chrome kills of B2, B3,
B5, S1 and S2 come from calling the production predicates inside Chrome with boundary arguments.
That is a legitimate guard, but it is a unit test in the browser, not a layout observation. Those
five remain equivalent in every rendered state I could reach. (`runs/mutants/`)

## Scope

- **Diff vs master** (outside `docs/verification/results/`): `app.js`, `index.html`, `styles.css`,
  `tests/parity-stamp.json`, `tests/post-review.test.cjs`, the new `tests/reader-smoke.cjs`,
  `tests/reader-round2.cjs` and `tests/reader-wide.cjs`, `tools/static_smoke.cjs`, `tools/push.log`
  (the 2 pending lines of the earlier master push), `AGENTS.md`, `HOSTING.md`,
  `docs/DECISIONS.md` and five reports. All are expected frontend, test, docs and evidence files.
- **No diff** in `lib/` (including `read-proxy.mjs`), `functions/`, `server.js`, `tools/push.sh`,
  `.githooks/`, `vendor/`, `_headers` (CSP), `_routes.json`, `tools/r59.spec.json`,
  `tools/mutations.cjs`, `tools/parity*.cjs`, `tools/build.cjs`, `tests/fixtures/` or
  `tests/server_exposure.test.js`. The R59 protections are untouched.
- `index.html` has 0 `style=` attributes, and its one `<script>` is `src="app.js"`. **No inline
  styles or scripts.**
- Line endings: `app.js` has 1347/1347 CRLF lines, `index.html` 348/348 and `styles.css`
  1023/1023, with no bare LF. The test files are LF. The only non-ASCII character added to the
  frontend is U+2014 in the ruled note.
- **Rulings before code.** W6.7–W6.11 were committed alone in `2d5e6a7` (18:28; `DECISIONS.md`,
  +6 lines). Round 2 then committed only docs and evidence (`5f7fc11`, 18:59; its candidate code
  was withdrawn). W6.12 was committed alone in `ce27e09` (19:17; +2 lines), before the code commit
  `2215e81` (19:36). `git diff ce27e09 2215e81 -- docs/DECISIONS.md` is empty. **Not verifiable by
  me:** a word-for-word comparison with Marcus's original relay, which I do not hold. The W6.7
  text does quote my first review's measurements (117 / 286 / 282 px) correctly.

## W6.12 — wide frames, real words (`scripts/w612.cjs`, `runs/w612.*`)

**Words.** I used 16 English words (Background, Throughput, Whatsoever, Workmanship,
Extraordinary, Understanding, Neighbourhood, Wholeheartedly, Responsibility, Infrastructure,
Accomplishment, Characteristics, Recommendations, Misunderstanding, Telecommunications,
Internationalization). I used 16 Norwegian words (Bærekraftig, Arbeidsplass, Sannsynligvis,
Fylkeskommune, Mikrobølgeovn, Utviklingsland, Barnehagelærer, Skolebibliotek, Sykehusavdeling,
Kommunestyremøte, Arbeidsmiljøloven, Forsikringsselskap, Personvernerklæring,
Høyesterettsadvokat, Kommunikasjonsmiddel, Menneskerettighetene). I added the 45-character word
and the controls "Hello" and "Kommune". Most words have 10–16 letters, and some compounds have up
to 20.

**Method.** Each word was loaded into "Lead … Tail End." at large size, with context words on and
off and the focus letter on and off. Master and the branch ran side by side. "Fully visible" means
the rendered text Range lies inside the frame's inner box on both axes.

| Layout | Pairs | Visible on master | …of which wider than 820 px | Clipped on master | Inside frame now | Branch font for clipped |
|---|---|---|---|---|---|---|
| 1708×950 normal | 140 | 64 | 32 | 76 | 76 | 36–113 px |
| 1920×1080 normal | 140 | 108 | 76 | 32 | 32 | 44–108 px |
| 996×950 focus | 140 | 108 | 16 | 32 | 32 | 36–88 px |
| 1400×950 focus | 140 | 112 | 88 | 28 | 28 | 52–123 px |
| 390×844 normal | 140 | 140 | 0 | 0 | — | — |
| 1400×950 normal (control) | 140 | 140 | 0 | 0 | — | — |
| **Total** | **840** | **672** | **212** | **168** | **168** | |

- **Visible on master (672):** font, `style`, rectangle, classes, text, `outerHTML`, text Range,
  frame classes and both context elements are equal to master. Frame PNGs were captured with
  production CSS (no test backdrop) and have **0 differing pixels in all 672 cases**. One capture
  first differed and matched on a fresh pair of documents, the same capture effect seen in both
  earlier rounds.
- **Clipped on master (168):** all are now inside the frame on both axes, with no context
  collision. Each is fitted to at most 90% of the inner width. No real word reaches the 10 px
  floor, so none wraps. The W-token floor and break cases are covered under W6.7. In 166 cases the
  font is the largest integer that fits. In 2 cases ("Telecommunications", 1400 focus, context on
  and off) it is 122 px where 123 px would fit by 0.2 px. That is the unchanged 12-step search
  with flooring, so it is expected under W6.12.
- **45-character word:** 1708 normal 128 → 36 px (818 / 912); 1920 normal 128 → 44 px (1000 /
  1124); 996 focus 99.6 → 36 px; 1400 focus 140 → 52 px. At 390 (13 px) and 1400 normal (23 px)
  it is identical to master. Context on and off give the same fonts.
- Examples at 1708: "Understanding" stays 128 px (895 px wide, visible). "Barnehagelærer"
  (956 px, clipped) becomes 109 px. "Kommunikasjonsmiddel" (1449 px, clipped) becomes 72 px. At
  1920 "Misunderstanding" (1095 px) and "Barnehagelærer" stay at 128 px, visible and identical.
- **O-1 (informational).** In a long run, 344 pairs had `style=""` on the branch where master has
  no `style` attribute at all. This is history: once the branch has fitted any token, Chrome keeps
  an empty `style` attribute. On a fresh page, with the same sequence on both sides, the attributes
  are equal (`runs/stylecheck.json`). Computed font, rectangle, classes and pixels are identical.
  Master shows the same artefact whenever it has fitted an earlier token. The counts above are
  normalised for it.

## W6.7 — threshold and collisions (`scripts/thr.cjs`, `scripts/inkcheck.cjs`)

At the 9 round-3 layouts, with context on and off and the focus letter on and off, I found the
first scrolling length by binary search with W tokens, plus real-word tokens at context on / letter
on. I computed the free gap myself from a "Hello" render's context rectangles.

| Layout | Frame H | Free gap (centred) | Last non-scroll (natural H) | First scroll (natural H) | Scroll area | Real-word first scroll |
|---|---|---|---|---|---|---|
| 390×844 | 278 | 117.09 (116.50) | W×300 (107) | W×301 (117) | 130 | 604 |
| 390×600 | 278 | 117.09 (116.50) | W×300 (107) | W×301 (117) | 130 | 604 |
| 844×390 | 366 | 159.56 (158.16) | W×476 (149) | W×477 (159) | 218 | 950 |
| 1400×950 | 625 | 285.95 (285.91) | W×1458 (285) | W×1459 (296) | 477 | 2893 |
| 1708×950 | 625 | 285.95 (285.91) | W×2187 (285) | W×2188 (296) | 477 | 4373 |
| 1920×1080 | 755 | 358.77 (358.72) | W×3300 (348) | W×3301 (359) | 607 | 6592 |
| 996×950 focus | 645 | 308.13 (307.03) | W×2349 (306) | W×2350 (317) | 497 | 4698 |
| 1400×950 focus | 645 | 297.17 (297.13) | W×3276 (296) | W×3277 (306) | 497 | 6552 |
| 390×844 focus | 572 | 281.69 (281.00) | W×780 (275) | W×781 (285) | 424 | 1566 |

- These match Codex's table exactly, and my first review's 117 / 286 / 282 px. The first scrolling
  length is **identical with context on and off** at every layout and focus-letter setting (18/18).
  Every first-scroll token's natural height exceeds the centred gap, and every last non-scroll
  token's natural height fits the gap.
- **Pixels.** I captured each frame four times (word only, context only, note only, background)
  and counted the pixels each layer paints. At the last non-scrolling and first scrolling length
  of every layout (context on, letter on and off, W and real; 54 cases):
  - 0 pixels are shared between the word and the context words, between the word and the note, or
    between the context words and the note;
  - the visible clearance between the word ink and the context ink is 7–16 px just below the
    threshold and at least 19 px in the scroll state.

  In addition, 9 sampled lengths from first wrap to the threshold in every configuration showed no
  collision, and every case stayed inside the frame. (`runs/ink.txt`, `runs/ink-844x390.txt`,
  `shots/thr-*`)
- My stricter box test flagged 0.23–0.75 px overlaps between the word's text-Range box and a
  context box, at the last non-scroll length at 1400, 1708, 996 focus and 1400 focus. These are
  font content-area boxes (ascent and descent), not ink. The pixel test shows 0 shared pixels and
  at least 7 px clearance there. The element-box test (my first review's definition) shows no
  overlap. **Not a finding.**

## Earlier findings — status

| # | Status | Fresh evidence |
|---|---|---|
| F-1 overlap | **Closed** | W6.7 section: 0 shared pixels at the threshold in 54 cases and no collision in the sweep, at all 9 layouts |
| F-2 wide frames | **Closed** | W6.12 section: 168/168 clipped words now inside; 672/672 visible words identical |
| F-3 final long word | **Closed**, but see the new R-1 | Auto-pause on the last word → one Play finishes: summary shown; note hidden; marker, scroll classes and tabindex cleared. The next Play restarts at word 0 with countdown 3, as the short-final control does. Manual arrival on a final scroll token → one Play finishes. Tested at 390 and 1920. (`runs/play.txt`) |
| F-4 two Play presses | **Closed** | One Play from auto-pause, Next, Previous, a progress-slider seek and reload+Resume. Each runs 3-2-1 (≈650 ms per step), then plays "Tail" (index 2) at ≈1970 ms, with no second pause. Tested at 390×844 and 1920×1080. |
| F-5 Space key | **Closed** by W6.10 and verified | After auto-pause, focus stays on the control used (Play, Next, Prev or Resume), never the area. Space on body or the Play button → countdown 3. Space on the focused area → scrolls (scrollTop rises), no playback, index unchanged. Tested at both widths. |
| F-6 preservation | **Closed** except the landscape note, which is unchanged and judged acceptable below | With the area focused and scrollTop 300, ten actions keep focus, scrollTop 300, the scroll state and the marker: WPM slider, context off/on, focus letter, word size and back, Copy, same-index seek, resize 390→1400 and back, and 1920→1708 and back. The countdown reset is moot because Play now advances. |
| F-7 test coverage | **Partly closed** | The round-2 matrix adds non-scroll collision checks. All 8 hand-mutants are red in Chrome, but 5 only through in-browser predicate calls (see above). The smoke has no finish-screen check, which is how R-1 got through. |

## R-1 — Finished screen: final word unfitted (new)

**Mechanism.** `completeReading()` → `render()` → `renderWord()` clears `style.fontSize`, then
`fitDisplayedWord()`. On the branch, the early return at `app.js:369` includes `state.finished`,
so master's 12-step fitting never runs on the finished screen. Master has no such condition and
fits the word as usual. A resize while finished (`app.js:1344`) takes the same path.

**Measurements.** I compared master and the branch on the same word, after `completeReading()` at
large size and after a natural playback at the default ("comfortable") size through the real UI
(`runs/play.json` `screen *`, `runs/natural-finish.json`):

| Viewport | Final word | Master | Branch | Frame PNG pixels differing |
|---|---|---|---|---|
| 390×844, comfortable, natural playback | "understanding." | 43 px, fitted, inside | 51.2 px, 366 px wide in a 342 px frame, clipped | 1257 |
| 390×844, comfortable, natural playback | "kommunikasjon." | 39 px | 51.2 px, 399 px wide, clipped | 1517 |
| 1400×950, comfortable, natural playback | "understanding." / "kommunikasjon." | 76 / 69 px | 108.8 px, 777 / 848 px wide in 604, clipped | 10094 / 9723 |
| 390×844, large | Kommunikasjonsmiddel / Internationalization / 45-char | 27 / 33 / 13 px | 64 px, clipped | 1660 / 1543 / 1757 |
| 1400×950, large | the same three | 48 / 58 / 23 px | 128 px, clipped | 12180 / 10447 / 10029 |
| both, both sizes | "here." / "Tail" (no fitting needed) | identical | identical | 0 |

`shots/natural-finish-390-understanding-{branch,master}.png` and
`shots/finish-1400-Kommunikasjo-{branch,master}.png` show the difference. On the branch, large
clipped glyphs stand out on both sides of the Finished panel, and faintly through it (the panel is
96% opaque). On master the word is fitted and barely visible. Text, counts, progress and the
session record are unaffected.

**Why it was missed.** Codex's "W6.9 final finish and restart equals master"
(`tests/reader-round2.cjs`) finishes master on the 45-character word and the branch on W×10000.
It then compares state, status, the summary's `outerHTML` and the Play button, but never the word
display's font or rectangle. No check compares the finish screen's word rendering with master.

**Fix direction (not implemented; implementation is Codex's).** In the finished state, skip only
the W6.1/W6.5 long-token states (wrap, scroll, note, marker) and keep master's fitting. Then add a
finish-screen comparison with master for a fitted final word to the smoke.

## Harness changes vs fc98d1e

`tests/post-review.test.cjs` is unchanged since fc98d1e. New files: `tests/reader-round2.cjs` and
`tests/reader-wide.cjs`.

- **The Copy smoke wait** (`tools/static_smoke.cjs`, "copy current word") is **wait-only**. It adds
  `waitForFunction(() => els.status.textContent === "Copied current word")` before the two
  original assertions, which are unchanged: the status text, and clipboard = `currentWord()`. If
  the status never comes, the wait times out red. `copyCurrentWord()` is unchanged from master
  and sets the status only after `await navigator.clipboard.writeText`, so this was a real harness
  race.
- **The focus-mode cleanup is cleanup-only:**
  - `reader-wide.cjs` `finally` does `unroute`, `pause()`, focus mode off and `render()`, then
    closes the master page;
  - `static_smoke.cjs` adds `page.setViewportSize(viewport)` after the round-2 and wide checks.

  Neither removes or relaxes an assertion. Codex's `parity-first-harness-failure.txt` shows the
  failure this fixed: Sample hidden by leftover focus mode.
- **Assertions that changed in `tests/reader-smoke.cjs`** (all follow from W6.7 or W6.9; listed
  as requested):
  1. The scroll-state oracle changes from `naturalHeight > frame clientHeight` to `> contextFreeHeight(frame)`
     (W6.7). This oracle calls the **production** function, so on its own it would not catch an
     error inside `contextFreeHeight`. `reader-round2.cjs` and my probes compute the gap
     independently, so this is a note, not a gap.
  2. In the scroll state, `area.scrollHeight > area.clientHeight` becomes
     `area.clientHeight >= 31.5`, and the scroll-input checks now run only when the area overflows.
     **This relaxes the earlier assertion.** It is needed because under W6.7 a scroll-state token
     can fit the reserved area (for example W×301 at 390 is 117 px in a 130 px area).
  3. "First-word countdown then pause": the asserts for auto-pause at index 0 after the countdown
     and for a second Play are removed. They are replaced by one Play → 3-2-1 → index 1 playing
     (W6.9).
  4. The resize test token changes from W×2000 to W×500, because W×2000 now scrolls at 1400 under
     the W6.7 threshold.
  5. `module.exports` is widened (no assertion change).

  `static_smoke.cjs` also adds the browser predicate checks at the start and the round-2 and wide
  checks at 1400.

## Data and v1 session

The real paste UI flow (Load, Use source, large, Next, Copy, reload, Resume, Copy) was compared
with master for W×10000, W×2000, W×135, real-word×45 (2025 characters), the 45-character word,
Kommunikasjonsmiddel, Internationalization, Barnehagelærer and Hello, at 390×844, 1400×950 and
1920×1080. **27/27 match** after Next and after Resume. Compared fields: index, word, display
text, word list, count, the word-count, position, percent and time-left labels, slider max and
value, source text, clipboard (equal to the token in every case), and the 13-key
`wordflow-reader-session-v1` record. `savedAt` is excluded from equality only and has type number
on both sides. (`runs/data.txt`)

## Landscape 844×390 — judged acceptable, not a finding

`runs/landscape.json`, `shots/landscape-branch-viewport.png`:

- At scrollY 0, the frame spans y 143–511 on **both master and the branch** (unchanged layout).
- The branch's scroll area is 196–414 (218 px, with its last 24 px below the 390 px fold). The
  note is 485–500, inside the frame, about 95 px below the fold. Master's own Play button is at
  592–650, also below the fold.
- The frame (368 px) fits the viewport, so one page scroll of about 120 px shows the area and the
  note together. My pixel capture at that position shows the note fully painted, with 0 pixels
  shared with the word or the context words.

**Why acceptable.** In this orientation master already puts the lower part of the frame and the
whole transport, including the Play control the note refers to, below the fold. The reader has to
scroll the page to press Play on master too. The note is inside the frame, not truncated and not
overlapping anything, so W6.5 ("a short visible note is shown") is met once the frame is in view.
Making it visible without scrolling would need a landscape layout change, which is outside F1.

## Observations (informational, not blocking)

- **O-1:** history-dependent `style=""` attribute (see W6.12).
- **O-2: classes after a resize.** On master, a resize leaves a stale `fitted-long-word` class on
  a word that no longer needs fitting, because master's `fitDisplayedWord` returns before touching
  the class. The branch removes it. For example, "Understanding" or "Kommune" fitted at 390 and
  then resized to 1920: master's classes are `word-display large fitted-long-word` and the
  branch's are `word-display large`. The font (128 px) and the rectangle are equal. The class has
  no CSS rule, so there is no visible difference. This is a literal "classes" difference under
  W6.12 only after a resize. (`runs/resizeclass.json`)
- **O-3:** two non-maximal fits, from the unchanged search and flooring (see W6.12).
- **O-4:** five hand-mutants are guarded in Chrome only by predicate unit calls (see the mutant
  table).
- **O-5:** the `reader-smoke` scroll oracle uses the production `contextFreeHeight` (see the
  harness section).

## What I did NOT check

- Physical phones, touch hardware, orientation sensors, other browsers, zoom levels and
  device-pixel ratios, OS font sets, and screen readers.
- Playback in a hidden tab (auto-pause runs in `requestAnimationFrame`). This was not retested and
  remains unverified.
- Unicode beyond Norwegian æ/ø, including grapheme clusters, RTL and complex scripts. Context
  words other than "Lead"/"Tail" in the threshold probe. Compact and comfortable sizes for scroll
  tokens. Only large size was used for W6.12, plus the comfortable natural finish under R-1.
- W6.9 paths and preservation at viewports other than 390×844 and 1920×1080.
- R-1 at every viewport and size. I measured 390 and 1400 at large and comfortable.
- A word-for-word comparison of W6.7–W6.12 with the original relay.
- Any fix. I implemented nothing.
- The live site and Cloudflare runtime: out of scope and unchanged.

## Scratch deletion

- **Old session folder:**
  `<home>/AppData/Local/Temp/claude/<project>/b5e64aff-57bf-4527-a98a-7b6d342bad63/`.
  - I verified the resolved path is under `<home>/AppData/Local/Temp/claude/` and not inside
    `<home>/Documents/WordFlow`. It has no symlinks and no `.env*` files, and is 8.6 MB.
  - It holds 245 files: Codex's 243 inventoried scratchpad files, plus 2 harness task logs under
    `tasks/` (my first session's hand-mutant log and a "done" marker).
  - The six retained files still hash as Codex inventoried them (`absent.sh` `f64feb1f…`, B2
    `30a9217f…`, B3 `4d4bbc44…`, B5 `5c84d621…`, S1 `5baa7dc9…`, S2 `1dd4f7e4…`).
  - **Deletion was refused** by this session's permission system. Per the task I stopped that step
    and tried no other method. **The folder still exists**, and Marcus may delete it.
- **This review's scratch:**
  `<home>/AppData/Local/Temp/claude/<project>/658b95a1-78d0-4c62-99e7-210f0008619c/scratchpad/`.
  - It holds `wf-rr` (clone, clean, `2215e81`), `wf-master` (master worktree, clean, `b9d3d9e`),
    `wf-mut` (clone, clean, `app.js` restored to `a3ba0649…`), `ev/` (raw outputs, including
    per-mutant smoke output and screenshots), `scripts/`, `tmp/` and `emptyhome/`. There are no
    `.env*` files.
  - I verified the same way, and **deletion was again refused.** It still exists. Everything of
    value is committed under `results/cc-rereview-f1/`, so Marcus may delete the whole session
    folder.

## Decisions for Marcus

1. **R-1, the Finished-screen regression.** W6.11 allowed one fix round, and it is used. Options:
   - (a) authorize a narrow Codex fix that keeps master's fitting in the finished state, plus a
     smoke check against master. It should be followed by a scoped CC check of that fix only:
     npm test, parity and stamp, the finish comparison, and the W6.12 and W6.9 probes rerun;
   - (b) merge with R-1 as a known issue;
   - (c) other.

   **Lean: (a).** It affects the most common end-of-text state on phones and desktops, it breaks
   W6.1 and W6.9 as written, and the fix is small.
2. **O-2, resize class.** Accept the branch's cleaner class state (no visual effect), or require
   master's stale class? **Lean: accept**, recorded as an implementation choice.
3. **Landscape note.** Accept as is, given master's layout already puts the frame bottom and Play
   below the fold, with any landscape layout change as a separate task. **Lean: accept.**
4. **Records.** Until R-1 is resolved, F1 stays "not yet fixed" (W6.11). The records below say
   "CC re-review CLEAR WITH FINDINGS (R-1)", not CLEAR.
5. **Scratch.** Both session folders above still exist because deletion was refused. **Lean:**
   Marcus deletes them manually, or grants the deletion in a later session.

## Evidence

`docs/verification/results/cc-rereview-f1/`:

- `scripts/`: every probe I ran: `lib`, `w612`, `stylecheck`, `thr`, `inkcheck`, `play`,
  `finish`, `data`, `landscape`, `resizeclass`, `mutants` and `absent.sh`.
- `runs/`: raw outputs, the parity JSON, mutations and hand-mutant JSON.
  `runs/parity/other-outputs.sha256` lists the large round-2 and wide harness outputs, which were
  not copied.
- `shots/`: 10 selected PNGs. User-profile paths appear only as `<home>` and `<project>`.
