# WordFlow F1 long-token recon — W6 vertical STOP

Date: 2026-10-07. Builder: Codex (gpt-6.1-sol, high).

**Result: STOPPED, not fixed.** The candidate removes horizontal overflow, but the
2000-character phone token breaches the mandatory vertical bound. No alternate behavior
was implemented. Production `app.js` and `styles.css` are restored byte-for-byte to master;
the candidate is retained only as `results/f1/candidate.patch`. F1 must not be described as
"fixed on fix/f1-long-token, pending review" after this STOP.

## Authority and local state

Read repository AGENTS/CLAUDE, W1-W5 in DECISIONS, HOSTING/README, vault AGENTS/CLAUDE,
Home, project, hot-cache, current-state, index, availability and sync/refresh instructions.
W6 was recorded verbatim before code, in its own commit `130bbd9` on Marcus's requested
`fix/f1-long-token` branch. Initial master was `b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7`;
its ref and source remain unchanged. The pending two push-log records for that earlier
master push are included with this task's evidence, without adding a push event.

No merge, push, deployment, package installation or repository/account setting change.
No changes to server.js, lib/read-proxy.mjs, functions/, R59 protections, gate, vendor/,
fixtures, index.html, _headers or CSP. No environment file was read or copied.

## Recon before the implementation choice

The flow under test was the local reader: render a token at desktop/phone width, let
`fitDisplayedWord()` run, and measure the displayed word and `.reader-frame`.

`renderWord()` populates `#word-display` / `.word-display`; its focus-letter rendering
uses `.word-left`, `.word-focus` and `.word-right`. `fitDisplayedWord()` schedules fitting
with requestAnimationFrame, resets the font size, and compares the display rectangle with
90% of frame width and 58% of frame height. If that does not fit, it searches 12 times
between `low = 10` and the computed base size. It finally writes
`Math.max(10, Math.floor(low))` and adds `.fitted-long-word`. Thus 10 px is the unchanged
floor even when the unbroken word is still too wide. The existing flex display and
inline-block / white-space:pre focus spans prevent wrapping. The frame's existing
overflow:hidden can hide the excess; that is the inherited failure, not a solution.

Installed Chrome 155.0.8059.39, Playwright 1.62.1, Node 24.16.0, Windows. Browser plugin
not available; the frontend testing skill's fallback uses the existing bundled Playwright
and installed Chrome. No browser or dependency installation. Viewports: 1400 x 950 and
390 x 844. Loopback-only test servers; sandbox localhost denial required elevated test
execution. This is local recon, not a live-site browser test.

The real word is `Pneumonoultramicroscopicsilicovolcanoconiosis` (45 characters).
The original F1 artificial token repeats it three times (135 characters). Additional
135/500/2000-character tokens consist of repeated uppercase W, exercising a wider glyph.
Recon uses large word size and focus-letter rendering. Measurements and the recon findings
were reported in chat before the candidate was applied.

## Before and candidate-after measurements

`word W x H` is the bounding rectangle in CSS pixels. `frame C/S` is clientWidth / scrollWidth;
`frame H C/S` is clientHeight / scrollHeight. Values are from `before.json` and `after.json`,
not inferred from screenshots. "After" means the rejected candidate, not committed production.

| Viewport | Token | Font | Before word W x H | Before frame C/S | Candidate word W x H | Candidate frame C/S | Candidate frame H C/S |
|---|---|---|---|---|---|---|---|
| 1400 | Hello (5) | 128 px | 318.31 x 138.23 | 604 / 604 | 318.31 x 138.23 | 604 / 604 | 625 / 625 |
| 390 | Hello (5) | 64 px | 159.16 x 69.11 | 342 / 342 | 159.16 x 69.11 | 342 / 342 | 278 / 278 |
| 1400 | Real word (45) | 23 px | 522.72 x 24.83 | 604 / 604 | 522.72 x 24.83 | 604 / 604 | 625 / 625 |
| 390 | Real word (45) | 13 px | 295.47 x 14.03 | 342 / 342 | 295.47 x 14.03 | 342 / 342 | 278 / 278 |
| 1400 | Real word x 3 (135) | 10 px | 640.89 x 10.80 | 604 / 682 | 543.59 x 21.00 | 604 / 604 | 625 / 625 |
| 390 | Real word x 3 (135) | 10 px | 640.89 x 10.80 | 342 / 682 | 307.80 x 31.50 | 342 / 342 | 278 / 278 |
| 1400 | W x 135 | 10 px | 820.00 x 10.80 | 604 / 1357 | 543.59 x 31.50 | 604 / 604 | 625 / 625 |
| 390 | W x 135 | 10 px | 1275.22 x 10.80 | 342 / 1357 | 307.80 x 52.50 | 342 / 342 | 278 / 278 |
| 1400 | W x 500 | 10 px | 820.00 x 10.80 | 604 / 5024 | 543.59 x 105.00 | 604 / 604 | 625 / 625 |
| 390 | W x 500 | 10 px | 4722.97 x 10.80 | 342 / 5024 | 307.80 x 178.50 | 342 / 342 | 278 / 278 |
| 1400 | W x 2000 | 10 px | 820.00 x 10.80 | 604 / 20098 | 543.59 x 399.00 | 604 / 604 | 625 / 625 |
| 390 | W x 2000 | 10 px | 18891.81 x 10.80 | 342 / 20098 | 307.80 x 703.50 | 342 / 342 | **704 / 705 — STOP** |

Before wrapping, all desktop frame clientHeights are 625 and phone clientHeights are 278;
their scrollHeights match. The real 45-character word and short word retain exactly the
same font, rectangle, text and existing classes in the candidate; neither gains the break
state. Existing desktop max-width constrains some display rectangles to 820 px, but child
content still overflows; the scrollWidth evidence captures that excess.

## Implementation choices — candidate only

These are Codex engineering choices, not additional Marcus rulings:

- A pure `shouldBreakWord(fontSize, wordWidth, frameWidth)` predicate tests floor size and
  excess width. Width uses the larger of display scrollWidth and bounding width so constrained
  boxes cannot conceal wider focus-span content. Its comparison is against the frame width,
  not the existing 90% fitting margin: a floor-sized token that fits the frame remains unchanged.
- `.wrapped-long-word` switches only affected tokens to block layout, 90% frame width,
  white-space:normal, overflow-wrap:anywhere and word-break:normal. Its focus spans become
  inline so the word can wrap across the existing focus markup.
- No visual hyphen; existing hyphens:none remains. No characters are inserted in the DOM text.
  Fitting resets the state before measuring again; renderWord/renderCountdown clear it as well.
  No new resource, inline HTML style/script, altered fitting floor or data-path code.

**Vertical STOP:** at 390 px, the 2000-character word rectangle is 703.5 px high. The existing
grid naturally expands the frame from clientHeight 278 to 704, yet scrollHeight is 705.
The strict scrollHeight <= clientHeight requirement fails by 1 CSS pixel even after expansion.
No rounding allowance was used to declare success. The frame's existing clipping makes this
a real condition to investigate rather than accepting the prototype. No clipping, scrolling,
additional shrinkage, line-height workaround or frame-size policy was added after observing it.
The two production source files were restored and the patch saved for review/reproduction.

Options for Marcus, neither implemented:

1. Authorize content-driven frame growth for tokens that cannot fit vertically at 10 px,
   including sufficient line clearance and a decision about neighboring context words.
2. Keep a fixed-height frame and specify another presentation for such tokens in a new ruling,
   including navigation/pacing and preservation of the whole token's data.

## Verification after restoring production source

The mandatory STOP supersedes completing the fix. The following results validate the unchanged
production reader and record corrections, **not acceptance of the candidate**.

| Check | Result |
|---|---|
| npm test | 498 Node checks: 223 static + 169 proxy + 32 exposure + 74 post-review; 0 skips |
| npm run parity | 9 DOCX exact goldens, 0 mismatches; 7 PDF comparisons, 5 exact / 2 pinned differences; 0 skips |
| Existing Chrome smoke | All 48 checks pass at 1400/390; 0 app errors, 0 uploads, 0 unexpected external origins |
| Existing mutations | 78 rows: 77 KILLED + equivalent M9; 0 unexpected verdicts, 0 harness errors |
| Production reader restoration | app.js/styles.css have no diff from master; all 225 stamp input hashes unchanged |
| CSP/resources/protected scope | No production diff in those files |

The successful parity run generated tests/parity-stamp.json through the normal command. Its only
change is the measured Chrome version from 154.0.8037.98 to 155.0.8059.39. Playwright remains
1.62.1 and all 225 input hashes remain identical. No stamp was edited by hand. Historical parity
evidence was restored after the run; fresh results are under `results/f1/baseline-parity/`.

Stamp SHA-256: `b31e583f0355f6a21b09f6258582e80c93f385b32a78bd0b184273849316e685`.

| Unchanged normalized input | SHA-256 |
|---|---|
| app.js | 193a3b5ca744e10b59c8ce66c6928637faaf425a9b900034647b8b2782e5dff7 |
| styles.css | fdad13bedb3f644f67d6f40399f53dee63a2eb8e33581e7d29cd03107da64468 |
| index.html | c816a6358cbfc722e9b2a6ebd0727e9735a0d0227997eac56336c25ac7285a39 |

The existing mutation runner dispatches only exposure, proxy and post-review suites; it has no
reader-rendering suite. No new harness was built and no break-removal mutation was registered
after the STOP. All existing definitions and verdicts are retained. Evidence includes each
existing exact transform and before/mutated/restored SHA-256 values in `results/f1/mutations.json`.

No new production trigger or Node trigger tests remain, because the prototype was withdrawn.
The long-token smoke extension, long-token copy/progress/resume assertions and new reader
mutation are incomplete pending Marcus's vertical ruling. Recon textContent matches the supplied
token before/after, but that does not prove the full copy/progress/resume workflow. The original
48 smoke checks cover the existing normal copy/resume flows and remain passing.

## Browser QA scope and limits

| Baseline QA | Evidence |
|---|---|
| Identity / meaningful UI / no overlay | Existing identity smoke passed; title WordFlow Reader |
| Console health | 0 app errors; expected simulated quota/fallback resource failures retain existing exclusions |
| Screenshot evidence | Baseline desktop/phone screenshots, plus separate before/candidate screenshots |
| Interaction proof | All existing sample/paste/review, copy, navigation, countdown, focus, resume, file, URL and quota checks pass |

Recon directly calls renderWord on synthetic tokens with large size and focus-letter enabled;
it is a geometry probe rather than a full source-loading/resume flow. Other word sizes,
focus-letter-off/context/focus-mode combinations, arbitrary Unicode/graphemes, resize/reset
transitions and long-token data workflows were not verified for this candidate. Other browsers,
older Chrome, OS/font inventories, zoom/device scales and viewports are unverified. No live-site
test, real Cloudflare quota/fail-open routing, maximum-body edge CPU, daily invocation-count
exclusion or Functions log-session inspection was performed. This report is the builder's account;
no independent CC review of this task occurred.

## Record corrections and Brain writeback

Separate docs-only corrections in AGENTS.md/HOSTING.md record Marcus's confirmations dated
2026-10-06, relayed by the claude.ai orchestrator: Runtime "Fail open" is set; preview branches
= None; Web Analytics off. Remaining **UNVERIFIED**: actual quota/fail-open routing at runtime;
maximum-body edge CPU (no CPU data yet; Error 1102 would indicate the 10 ms limit); Functions
log-session state; whether daily request count excludes static page views. These confirmations
were not independently inspected. Other rule text is preserved.

Vault project body: live deployment, 498/0 Node, 78 = 77 + M9, 9/7/48 parity, resolved public-repo
and deployment statements, dashboard record and F1 STOP. Existing Updates history is preserved;
a dated update and current handoff are appended. Hot-cache What Matters Now, Current Focus,
Blockers and AI Handoff now include current WordFlow state, with a dated Where We Are entry.
PMI and MarcDeck lines are retained: current-state.md still explicitly lists the independent
Node-guard lane and does not clearly establish supersession of those guard instructions.
They were not silently converted into WordFlow reader rules.

Claude's 21:15 live-check entry was confirmed present in its 2026-10-06 log. The requested
`16:25 - claude (logged by Codex)` handoff text was appended verbatim to the new 2026-10-07
Claude log using the prior frontmatter shape. Codex worklog, current-state, wiki index/log and
project handoff updated. Vault files were re-read immediately before editing. The dated daily
note is missing; **none was created**.

## Evidence and next step

Evidence: `results/f1/before.json`, `after.json`, `candidate.patch`, `recon.cjs`, before/after
screenshots, `node-tests.txt`, `mutations.json`, and `baseline-parity/`. The small parity wrapper
preserves historical evidence while running npm run parity; it does not change the gate.
To reproduce the candidate in a disposable checkout, apply candidate.patch, run
`node docs/verification/results/f1/recon.cjs candidate-reproduction`, then restore the
two reader files. The default recon run measures the unchanged production reader.

End state: local committed fix/f1-long-token, production reader unchanged, master untouched,
nothing pushed or deployed. Next: Marcus's vertical-behavior ruling, resume implementation and
required verification, independent CC review, then Marcus's merge/push decision. Run
npm run smoke:live after any eventual deployment.
