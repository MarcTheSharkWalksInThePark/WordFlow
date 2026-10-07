# WordFlow F1 round 3 — W6.12

Date: 2026-10-07. Builder: Codex (gpt-6.1-sol, high).

F1 candidate (W6.1-W6.12) committed on fix/f1-long-token, pending CC re-review; not yet fixed (W6.11). No product STOP occurred in the tested matrix. Builder verification is not independent acceptance.

## Authority and source state

Starting clean local branch fix/f1-long-token: 5f7fc11bdff8f15a75c236fe475c2d7f953e5078. Master remains b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7. W6.12 was appended verbatim under W6 in docs/DECISIONS.md and committed alone as ce27e09d39fb3264063efdf917f814737cf40146 before code. Read repository AGENTS/CLAUDE, W1-W6.11, HOSTING/README, all three Codex F1 reports, CC review, retained candidate, wide controls and hand-mutant evidence; read relevant vault rules, project, cache, state, index, sync/refresh and availability notes.

No merge, push, deployment, public listener, package installation or settings change. Other agents' reports and earlier evidence remain untouched. No environment file opened or copied. No changes to lib/read-proxy.mjs, functions/, server.js, R59, push gate, vendor/, _headers, CSP, fixtures, styles.css or index.html in this round.

## Labelled implementation choices

These are Codex implementation choices under Marcus's ruling, not new rulings:

- Apply the retained round-2 candidate.patch and candidate-reader-round2.cjs. W6.7 live context clearance, W6.9 existing seek/countdown/finish paths, W6.10 Space behavior and raw/clamped offset/focus preservation remain unchanged.
- Replace only W6.8 fitting measurement: at base size, preserve master's box/height check. If that check requires fitting, use its exact original box/height predicate through the existing 12-step search. Otherwise fit only when the text Range crosses either inner horizontal frame edge (left = frame.left + clientLeft; right = left + clientWidth); use text Range width against 90% of frame through that same search. Base sizes, flooring, 10 px floor and height target are unchanged.
- At the floor, compare the unbroken rendered text Range width strictly with frame.clientWidth. Do not compare with the capped box. Existing W6.1 wrapping and W6.7 scrolling then apply, without hyphens or altered token text.
- Update the retained test's W6.8 box-overflow assertion/classification to actual frame-edge visibility, as W6.12 requires. Add wide controls and independent floor measurements; retain all boundary, data, interaction and preservation assertions. The new helper restores focus mode after testing; the existing asynchronous Copy smoke now waits for its unchanged expected status before the original status/clipboard assertions. No new product resource, HTML inline style/script, playback state or session field.

## W6.12 measurements and identity

All 36 retained cap probes rerun. The file actually contains 21 fully visible tokens and 15 clipped tokens. Step 2(a)'s literal request for all 36 to remain identical conflicts with step 2(b) and W6.12 for those 15 clipped tokens. Implementation follows the verbatim W6.12: all 21 fully visible probes, including every one of the eight round-2 counterexamples, retain exact outerHTML, text, classes, font, word/frame/context rectangles and text bounds; all 21 PNG pairs are byte-identical with zero differing pixels. The 15 clipped probes are fitted and inside the frame. Initial optional clarification incorrectly counted 22/14; the exact recorded count is 21/15.

Pixel method: equal fresh documents on both sides, with the same test-only flat #fffdfa frame background served by an intercepted stylesheet, matching round 2. Production CSS is unchanged. This establishes controlled-backdrop token raster identity, not whole-frame production-gradient identity. Geometry, collisions, data and interaction checks otherwise use production CSS.

Coordinates and widths are CSS pixels. Before = actual master frontend blobs served with the same headers, not inferred from old numbers. After = current candidate. Raw JSON retains complete rectangles, frame/area sizes and bounds.

| Viewport/mode | W length | Master font / text width | Candidate font / text width | Inner width | Master visible | Result |
|---|---|---|---|---|---|---|
| 1708x950 normal | 4 | 128px / 514.5 | 128px / 514.5 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 1708x950 normal | 5 | 128px / 643.125 | 128px / 643.125 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 1708x950 normal | 6 | 128px / 771.75 | 128px / 771.75 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 1708x950 normal | 7 | 128px / 900.375 | 128px / 900.375 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 1708x950 normal | 8 | 128px / 1029 | 102px / 820 | 912 | false | fits 90% target; inside frame |
| 1708x950 normal | 9 | 128px / 1157.625 | 90px / 813.984 | 912 | false | fits 90% target; inside frame |
| 1708x950 normal | 10 | 128px / 1286.25 | 81px / 813.969 | 912 | false | fits 90% target; inside frame |
| 1708x950 normal | 11 | 128px / 1414.875 | 74px / 818 | 912 | false | fits 90% target; inside frame |
| 1708x950 normal | 12 | 128px / 1543.5 | 68px / 820 | 912 | false | fits 90% target; inside frame |
| 1920x1080 normal | 4 | 128px / 514.5 | 128px / 514.5 | 1124 | true | DOM + PNG identical; 0 pixels differ |
| 1920x1080 normal | 5 | 128px / 643.125 | 128px / 643.125 | 1124 | true | DOM + PNG identical; 0 pixels differ |
| 1920x1080 normal | 6 | 128px / 771.75 | 128px / 771.75 | 1124 | true | DOM + PNG identical; 0 pixels differ |
| 1920x1080 normal | 7 | 128px / 900.375 | 128px / 900.375 | 1124 | true | DOM + PNG identical; 0 pixels differ |
| 1920x1080 normal | 8 | 128px / 1029 | 128px / 1029 | 1124 | true | DOM + PNG identical; 0 pixels differ |
| 1920x1080 normal | 9 | 128px / 1157.625 | 111px / 1003.906 | 1124 | false | fits 90% target; inside frame |
| 1920x1080 normal | 10 | 128px / 1286.25 | 100px / 1004.906 | 1124 | false | fits 90% target; inside frame |
| 1920x1080 normal | 11 | 128px / 1414.875 | 91px / 1005.922 | 1124 | false | fits 90% target; inside frame |
| 1920x1080 normal | 12 | 128px / 1543.5 | 83px / 1000.875 | 1124 | false | fits 90% target; inside frame |
| 996x950 focus | 4 | 99.6px / 400.375 | 99.6px / 400.375 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 5 | 99.6px / 500.453 | 99.6px / 500.453 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 6 | 99.6px / 600.547 | 99.6px / 600.547 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 7 | 99.6px / 700.641 | 99.6px / 700.641 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 8 | 99.6px / 800.719 | 99.6px / 800.719 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 9 | 99.6px / 900.813 | 99.6px / 900.813 | 912 | true | DOM + PNG identical; 0 pixels differ |
| 996x950 focus | 10 | 99.6px / 1000.891 | 81px / 813.969 | 912 | false | fits 90% target; inside frame |
| 996x950 focus | 11 | 99.6px / 1100.969 | 74px / 818 | 912 | false | fits 90% target; inside frame |
| 996x950 focus | 12 | 99.6px / 1201.063 | 68px / 820 | 912 | false | fits 90% target; inside frame |
| 1400x950 focus | 4 | 140px / 562.75 | 140px / 562.75 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 5 | 140px / 703.438 | 140px / 703.438 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 6 | 140px / 844.125 | 140px / 844.125 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 7 | 140px / 984.797 | 140px / 984.797 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 8 | 140px / 1125.484 | 140px / 1125.484 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 9 | 140px / 1266.172 | 140px / 1266.172 | 1316 | true | DOM + PNG identical; 0 pixels differ |
| 1400x950 focus | 10 | 140px / 1406.859 | 117px / 1175.734 | 1316 | false | fits 90% target; inside frame |
| 1400x950 focus | 11 | 140px / 1547.547 | 107px / 1182.781 | 1316 | false | fits 90% target; inside frame |
| 1400x950 focus | 12 | 140px / 1688.219 | 98px / 1181.75 | 1316 | false | fits 90% target; inside frame |

### Clipped-token cases

292 clipped-master comparisons across the 36 layout/mode combinations pass. 324 independent unbroken-at-10-px measurements, plus all 36 cap floor checks, establish the break condition: wrapped iff computed font <= 10 and rendered unbroken width > inner frame width. Every clipped token tested is fully inside the frame afterward, fitted to the original target or broken at the floor. All cases (including context/letter off) are in parity/wide-controls.json. Representative context/letter-on cases follow; the 45-character real word is Pneumonoultramicroscopicsilicovolcanoconiosis.

| Viewport/mode | Token | Master font / rendered width | After font / rendered width | Inner / 90% target | Floor unbroken width | After state |
|---|---|---|---|---|---|---|
| 390x844 normal | W 135 | 10px / 1356.625 | 10px / 301.5 | 342 / 307.8 | 1356.625 | break |
| 390x844 normal | W 2000 | 10px / 20097.688 | 10px / 301.5 | 342 / 307.8 | 20097.688 | break + scroll |
| 390x844 normal | real-repeated 2025 | 10px / 10226.75 | 10px / 307.609 | 342 / 307.8 | 10226.75 | break + scroll |
| 390x600 normal | W 135 | 10px / 1356.625 | 10px / 301.5 | 342 / 307.8 | 1356.625 | break |
| 390x600 normal | W 2000 | 10px / 20097.688 | 10px / 301.5 | 342 / 307.8 | 20097.688 | break + scroll |
| 390x600 normal | real-repeated 2025 | 10px / 10226.75 | 10px / 307.609 | 342 / 307.8 | 10226.75 | break + scroll |
| 844x390 normal | W 135 | 10px / 1356.625 | 10px / 341.688 | 384 / 345.6 | 1356.625 | break |
| 844x390 normal | W 2000 | 10px / 20097.688 | 10px / 341.688 | 384 / 345.6 | 20097.688 | break + scroll |
| 844x390 normal | real-repeated 2025 | 10px / 10226.75 | 10px / 345.563 | 384 / 345.6 | 10226.75 | break + scroll |
| 1400x950 normal | W 135 | 10px / 1356.625 | 10px / 542.672 | 604 / 543.6 | 1356.625 | break |
| 1400x950 normal | W 2000 | 10px / 20097.688 | 10px / 542.672 | 604 / 543.6 | 20097.688 | break + scroll |
| 1400x950 normal | real-repeated 2025 | 10px / 10226.75 | 10px / 543.313 | 604 / 543.6 | 10226.75 | break |
| 1708x950 normal | real45 45 | 128px / 2908.938 | 36px / 818.156 | 912 / 820.8 | 227.281 | single line |
| 1708x950 normal | W 135 | 128px / 17364.375 | 10px / 813.984 | 912 / 820.8 | 1356.625 | break |
| 1708x950 normal | W 2000 | 128px / 257250 | 10px / 813.984 | 912 / 820.8 | 20097.688 | break |
| 1708x950 normal | real-repeated 2025 | 128px / 130902.188 | 10px / 820.406 | 912 / 820.8 | 10226.75 | break |
| 1920x1080 normal | real45 45 | 128px / 2908.938 | 44px / 999.969 | 1124 / 1011.6 | 227.281 | single line |
| 1920x1080 normal | W 135 | 128px / 17364.375 | 10px / 1004.906 | 1124 / 1011.6 | 1356.625 | break |
| 1920x1080 normal | W 2000 | 128px / 257250 | 10px / 1004.906 | 1124 / 1011.6 | 20097.688 | break |
| 1920x1080 normal | real-repeated 2025 | 128px / 130902.188 | 10px / 1011.047 | 1124 / 1011.6 | 10226.75 | break |
| 996x950 focus | real45 45 | 99.6px / 2263.547 | 36px / 818.156 | 912 / 820.8 | 227.281 | single line |
| 996x950 focus | W 135 | 99.6px / 13511.688 | 10px / 813.984 | 912 / 820.8 | 1356.625 | break |
| 996x950 focus | W 2000 | 99.6px / 200172.656 | 10px / 813.984 | 912 / 820.8 | 20097.688 | break |
| 996x950 focus | real-repeated 2025 | 99.6px / 101858.266 | 10px / 820.406 | 912 / 820.8 | 10226.75 | break |
| 1400x950 focus | real45 45 | 140px / 3181.672 | 52px / 1181.781 | 1316 / 1184.4 | 227.281 | single line |
| 1400x950 focus | W 135 | 140px / 18992.297 | 10px / 1175.734 | 1316 / 1184.4 | 1356.625 | break |
| 1400x950 focus | W 2000 | 140px / 281367.188 | 10px / 1175.734 | 1316 / 1184.4 | 20097.688 | break |
| 1400x950 focus | real-repeated 2025 | 140px / 143174.281 | 10px / 1183.422 | 1316 / 1184.4 | 10226.75 | break |
| 390x844 focus | W 135 | 10px / 1356.625 | 10px / 301.5 | 342 / 307.8 | 1356.625 | break |
| 390x844 focus | W 2000 | 10px / 20097.688 | 10px / 301.5 | 342 / 307.8 | 20097.688 | break + scroll |
| 390x844 focus | real-repeated 2025 | 10px / 10226.75 | 10px / 307.609 | 342 / 307.8 | 10226.75 | break + scroll |

## Retained round-2 checks rerun

| Check | Result |
|---|---|
| Matrix | 36 rows = nine layouts x context on/off x focus letter on/off; 144 samples, including 72 just-below/above threshold cases; all clear of context/note collisions |
| Controls | 180 master comparisons; 56 fully visible controls DOM/pixel identical; clipped cases contained |
| Data and v1 session | 72 comparisons: real paste/review/Next and reload/Resume; all 13 fields checked, savedAt number with independent clock values excluded |
| W6.9 | Auto-pause, Next, Previous, progress seek and Resume: one Play advances one whole word with existing 3-2-1 countdown. Final finish state and next Play restart equal short-final master |
| W6.10 | Focused region: native Space scroll, no playback. Play control: existing Space toggle. No automatic focus |
| Preservation | 9 actions retain keyboard focus and raw/clamped scrollTop: resize 1400, resize 390, same-index seek, copy, focus letter, context, focus mode, word size, pacing |
| Reachability | Existing End/PageDown/wheel/CDP touch checks pass with final glyph visible; scroll areas remain within normal-height frames. Landscape note may need page scrolling, as already recorded |

| Viewport/mode | Frame height | Threshold | Last clear W / natural height | First scroll W / natural height | Scroll area height |
|---|---|---|---|---|---|
| 390x844 normal | 278 | 116.5 | 300 / 107 | 301 / 117 | 130 |
| 390x600 normal | 278 | 116.5 | 300 / 107 | 301 / 117 | 130 |
| 844x390 normal | 366 | 158.156 | 476 / 149 | 477 / 159 | 218 |
| 1400x950 normal | 625 | 285.906 | 1458 / 285 | 1459 / 296 | 477 |
| 1708x950 normal | 625 | 285.906 | 2187 / 285 | 2188 / 296 | 477 |
| 1920x1080 normal | 755 | 358.719 | 3300 / 348 | 3301 / 359 | 607 |
| 996x950 focus | 645 | 307.031 | 2349 / 306 | 2350 / 317 | 497 |
| 1400x950 focus | 645 | 297.125 | 3276 / 296 | 3277 / 306 | 497 |
| 390x844 focus | 572 | 281 | 780 / 275 | 781 / 285 | 424 |

## Suites, hand mutations and stamp

npm test: 505 Node checks (223 static, 169 proxy, 32 exposure, 81 post-review), 0 skips. Full npm run parity succeeds: 9 exact DOCX, 0 mismatches; 7 PDF comparisons (5 exact, 2 pinned differences); 272 Chrome smoke checks, 0 app errors, 0 uploads and 0 unexpected external origins. Chrome 155.0.8059.39, Playwright 1.62.1. Browser plugin not available; existing installed Chrome/bundled Playwright used.

The initial sandbox-only Node attempt was denied loopback access; the authorized elevated suite passed. First full parity reached the new wide checks, then a test-helper cleanup omission left focus mode enabled and hid Sample for the following smoke check. Corrected the new helper's cleanup. The second attempt caught an existing race: the Copy smoke read Restarted before asynchronous clipboard.writeText resolved; copyCurrentWord is unchanged and sets its status after awaiting that operation. The smoke now waits for that same expected status, retaining the status and clipboard equality assertions. Third full command succeeds; preserve parity-first-harness-failure.txt and parity-second-clipboard-race.txt. No product behavior changed for either harness repair. These are harness failures, not a product STOP or a retained round-2 candidate assertion regressing. This is one build verification round with documented harness repairs.

Registered mutations: 78 rows, 77 KILLED + equivalent M9; 0 unexpected verdicts/errors. Definitions, verdicts and all before/mutated/restored hashes equal the retained round-2 result across all 78 rows. Registry and protected source unchanged. Fresh run logs retain volatile temp names/timing separately; those are not equality fields. Exact transforms and full before/mutated/restored SHA-256 values are retained.

CC hand mutations use the eight original exact transforms, through the existing post-review suite and real full Chrome smoke entry point. Chrome executes production predicates directly for exact equality/above-floor states; rendered layout is checked separately. All eight killed in both environments. No new mutation registry/harness. Sequential restoration checks after each suite prevent concurrent edits.

| ID | Exact transform | Node | Chrome | Chrome failing check | Mutated SHA-256 |
|---|---|---|---|---|---|
| B1 | `return fontSize <= 10 && wordWidth > frameWidth;` → `return fontSize < 10 && wordWidth > frameWidth;` | KILLED | KILLED | Error: W6 browser predicate B1/B4: Expected values to be strictly equal: | d4b150161f02d7d877e1c91c8cb410670fd206048c74f074a57308be1b397305 |
| B2 | `return fontSize <= 10 && wordWidth > frameWidth;` → `return fontSize <= 10 && wordWidth >= frameWidth;` | KILLED | KILLED | Error: W6 browser predicate B2: Expected values to be strictly equal: | ea4a52c2e8806d669566278f0145ac58924eb80b283e4cc018281171375369b0 |
| B3 | `return fontSize <= 10 && wordWidth > frameWidth;` → `return wordWidth > frameWidth;` | KILLED | KILLED | Error: W6 browser predicate B3/B5: Expected values to be strictly equal: | 1db9d8165f3f62086775c171451c39e77eb42fefa7cf0e975b8a82244ea4d226 |
| B4 | `return fontSize <= 10 && wordWidth > frameWidth;` → `return fontSize <= 10 && frameWidth > wordWidth;` | KILLED | KILLED | Error: W6 browser predicate B1/B4: Expected values to be strictly equal: | 9acf9bc4a43af7b88a61acef8fd89ca2d6e0ffb35fe9e03aefd692117a41daff |
| B5 | `return fontSize <= 10 && wordWidth > frameWidth;` → `return 10 <= fontSize && wordWidth > frameWidth;` | KILLED | KILLED | Error: W6 browser predicate B3/B5: Expected values to be strictly equal: | 68d25bdf425a24416892c082df19e5b41aa76e775b266bd15a508eb9278419d6 |
| S1 | `return wrapped && wordHeight > frameHeight;` → `return wrapped && wordHeight >= frameHeight;` | KILLED | KILLED | Error: W6 browser predicate S1: Expected values to be strictly equal: | dcf8004874d8c6ab2d569129bc1afd60a8dfb080f816a69c6de4530e394f9525 |
| S2 | `return wrapped && wordHeight > frameHeight;` → `return wordHeight > frameHeight;` | KILLED | KILLED | Error: W6 browser predicate S2: Expected values to be strictly equal: | caeac147eb7e092b00931e7b3051835a23e9b944bd893fe42a07a3fb17878e61 |
| S3 | `return wrapped && wordHeight > frameHeight;` → `return wrapped && frameHeight > wordHeight;` | KILLED | KILLED | Error: W6 browser predicate S3: Expected values to be strictly equal: | c7f232638c25d1827ee3f34be8108e973c37f57ff815fe561f2b7a5a7ee1ab32 |

Hand-mutant app.js before/restored SHA-256: a3ba064933477e672e6774f1a05fbc72604608b0f2c5bc651034fa9145c38ba8. Full hashes after Node and Chrome equal mutated bytes for every row; final restore equals before.

Generated stamp: only a successful npm run parity writes tests/parity-stamp.json; no hand edit. Committed-blob verifier is run after the candidate commit. New text logs have trailing line/EOF whitespace normalized; structured results and PNG bytes are unchanged.

| File | SHA-256 |
|---|---|
| tests/parity-stamp.json bytes | 4898c798858f2407ed3ca178d0ada55bbde8c71a0f75fa17085edf1549666f03 |
| app.js normalized input | b81eac0eb13570723c794851162d6b36314e8146107c403d84febc2ef611d39a |
| index.html normalized input | 44cf402e3cf9ec0585e181904f21f45366d2589a085133b55f0de092303f7800 |
| styles.css normalized input | 5bbccd16bd8d06a151d66a92b7d835a1d775b95eb5cd7ac1c4d9c5f3c64b57af |

225 inputs; changed versus starting branch: app.js. All other input hashes are unchanged.

## Scratch inventory and disposition

Verified resolved path under <home>/AppData/Local/Temp/claude/ and outside <home>/Documents/WordFlow. Inventoried 243 files: 98 identical committed blobs, 139 other temporary files/scaffolding, six retained cited/unclear files. All sizes/SHA-256 values and matching committed paths appear below and in scratch-inventory.json. No .env filename found. Symbolic links were not followed.

**Delete nothing.** absent.sh differs from the committed redacted script; the five mutant static-smoke JSON files differ from committed blobs and belong to CC's cited hand-mutation evidence. Their value is retained/conservatively unclear. Marcus decides. The entire scratchpad and its session parent are unchanged; the two clones were already absent.

| Retained file | Reason |
|---|---|
| absent.sh | CC-cited output/script is not byte-identical to a committed file |
| ev/mutants/B2/static-smoke.json | CC-cited raw evidence differs from committed bytes |
| ev/mutants/B3/static-smoke.json | CC-cited raw evidence differs from committed bytes |
| ev/mutants/B5/static-smoke.json | CC-cited raw evidence differs from committed bytes |
| ev/mutants/S1/static-smoke.json | CC-cited raw evidence differs from committed bytes |
| ev/mutants/S2/static-smoke.json | CC-cited raw evidence differs from committed bytes |

### Every scratch file

Paths are relative to the verified scratchpad; exact full placeholder root is recorded in scratch-inventory.json.

| Path | Bytes | SHA-256 | Classification |
|---|---|---|---|
| absent.sh | 1726 | f64feb1fbc3ce66cffccd164bc0723ce06c866a925a2c2c80dda551bf431f8bb | unclear |
| absent.txt | 5250 | f1b0d7e29f79f93b27f6c02f891c25c3df30b3d0cb4ec213ce160c1496c88b7e | identical committed blob |
| collect.sh | 2671 | 89521069849333506e7b6de24ecabc8041ba57c6eb171e75c6c0c9f3681d421f | no value |
| data.cjs | 6437 | 559291f48730cd540ff915910ca003fa06136835534c0f16d995bc96606944f0 | identical committed blob |
| ev/absent.txt | 5250 | f1b0d7e29f79f93b27f6c02f891c25c3df30b3d0cb4ec213ce160c1496c88b7e | identical committed blob |
| ev/data/data.json | 23114 | 9f71fa9b8ca7c0a8af7c9559aa722fc887ac90644d3e375da7ea8d4dae959cb9 | identical committed blob |
| ev/data/id-1400-comfortable-45-branch.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-comfortable-45-master.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-comfortable-5-branch.png | 11259 | 51c36a6464c9817865f4233f47f00a766e93ebba546e29f88935221aa1da17af | no value |
| ev/data/id-1400-comfortable-5-master.png | 11259 | 51c36a6464c9817865f4233f47f00a766e93ebba546e29f88935221aa1da17af | no value |
| ev/data/id-1400-compact-45-branch.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-compact-45-master.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-compact-5-branch.png | 10373 | 5f8792018cf2d428b89599e094c32c62af013bf8db173422002db8c7dae2eb31 | no value |
| ev/data/id-1400-compact-5-master.png | 10373 | 5f8792018cf2d428b89599e094c32c62af013bf8db173422002db8c7dae2eb31 | no value |
| ev/data/id-1400-large-45-branch.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-large-45-master.png | 13230 | 38237265e6fdc71d6aa779e403ef83040cdb112e8bff25acbe36f590bc7e5a02 | no value |
| ev/data/id-1400-large-5-branch.png | 11759 | 984453d8ac8930dc9100c4b60a981a9a070657c0682892da33aba268a7630543 | no value |
| ev/data/id-1400-large-5-master.png | 11759 | 984453d8ac8930dc9100c4b60a981a9a070657c0682892da33aba268a7630543 | no value |
| ev/data/id-390-comfortable-45-branch.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-comfortable-45-master.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-comfortable-5-branch.png | 4504 | 9f5bbc47f03db5e3b8ecdeb5b69bf9a131ba31746f00a66301c9b6362a9a2e42 | no value |
| ev/data/id-390-comfortable-5-master.png | 4504 | 9f5bbc47f03db5e3b8ecdeb5b69bf9a131ba31746f00a66301c9b6362a9a2e42 | no value |
| ev/data/id-390-compact-45-branch.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-compact-45-master.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-compact-5-branch.png | 3923 | 7f1e77012543b454c5f388a3551cae5f4da2184130b23e05b7c2c63febfaafd4 | no value |
| ev/data/id-390-compact-5-master.png | 3923 | 7f1e77012543b454c5f388a3551cae5f4da2184130b23e05b7c2c63febfaafd4 | no value |
| ev/data/id-390-large-45-branch.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-large-45-master.png | 4407 | 21dc14b66374cfbed1dd8095689f5c2e1b79ef7c94eb694272adc67de8732951 | no value |
| ev/data/id-390-large-5-branch.png | 4957 | 50620c26cd87c1f09b3fffdde343bbd88af35190b551b557ffd915090d0ee7c9 | no value |
| ev/data/id-390-large-5-master.png | 4957 | 50620c26cd87c1f09b3fffdde343bbd88af35190b551b557ffd915090d0ee7c9 | no value |
| ev/data-run1/data.json | 23120 | 58e19ab903bd72fea1fbb5d2b7be87980413105f3b49879fc6196a261d11d246 | identical committed blob |
| ev/data-run1/data.txt | 4046 | 604a2acf1fc9d9efadb8bfcc842cdd0b557b67cb67c104ae56a141e8544fa911 | identical committed blob |
| ev/data-run2.txt | 4040 | 0a426cd18f02599eaf4e0c492724a4632807277b1cef761099413c4133686d83 | identical committed blob |
| ev/data.txt | 4046 | 604a2acf1fc9d9efadb8bfcc842cdd0b557b67cb67c104ae56a141e8544fa911 | identical committed blob |
| ev/extra/extra.json | 2949 | a9eda4214d616a5dd5ffbf25acc46f1fedd23fb1e93d506b24c0ffb8460dee2a | identical committed blob |
| ev/extra/final-word-after-play-390.png | 19634 | d78f75c533ee09044d19f01684df7123d95d5c596054f01d29c74fb4cf5e5870 | no value |
| ev/extra/final-word-play2-390.png | 19611 | ab4d66104a0e0c146b356361a80cc582665b5d0f0fd603b442e3a3121039d434 | identical committed blob |
| ev/extra.txt | 2255 | d56c516537fc758d3952a38437296c8649d779a4f056141aecd1f8d9d8f63667 | identical committed blob |
| ev/final.txt | 1618 | 5bacab2f9d78eec35776dd66da6b83528536400a4cc296ae131311412ee8b227 | identical committed blob |
| ev/focus/focus-1024-branch-10000.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-branch-135.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-branch-2000.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-branch-45.png | 19169 | 244e80d6d1a19a2369184f6c0fb576aa5dc89641e7381469f20e97532ba3ad41 | no value |
| ev/focus/focus-1024-master-10000.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-master-135.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-master-2000.png | 19397 | 025bfb34bc2e121f5e6eb19819811b1e3dc69b0632e3beced1d004a3f86ab241 | no value |
| ev/focus/focus-1024-master-45.png | 19169 | 244e80d6d1a19a2369184f6c0fb576aa5dc89641e7381469f20e97532ba3ad41 | no value |
| ev/focus/focus-1400-branch-10000.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-branch-135.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-branch-2000.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-branch-45.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/focus/focus-1400-master-10000.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-master-135.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-master-2000.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/focus/focus-1400-master-45.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/focus/focus-390-branch-10000.png | 11050 | 5c5cba8256ae2fc4b8dc42f35af512b654c67c80749151d8ea0be0b291edb630 | no value |
| ev/focus/focus-390-branch-135.png | 5922 | de354c776f04b9b53eed4eb75f56ad9e3254ab83e5aaaba78751d86158a50264 | no value |
| ev/focus/focus-390-branch-2000.png | 11050 | 5c5cba8256ae2fc4b8dc42f35af512b654c67c80749151d8ea0be0b291edb630 | no value |
| ev/focus/focus-390-branch-45.png | 6106 | 7a24f6a7353ac09a84fcb28abad3d89377eecb4043cb9afffc030100991d1604 | no value |
| ev/focus/focus-390-master-10000.png | 5182 | 4457f2a449d7caf512362e41e5b8c144709b62f5cf6f2c4b1da406e18a6f1dc1 | no value |
| ev/focus/focus-390-master-135.png | 5182 | 4457f2a449d7caf512362e41e5b8c144709b62f5cf6f2c4b1da406e18a6f1dc1 | no value |
| ev/focus/focus-390-master-2000.png | 5182 | 4457f2a449d7caf512362e41e5b8c144709b62f5cf6f2c4b1da406e18a6f1dc1 | no value |
| ev/focus/focus-390-master-45.png | 6106 | 7a24f6a7353ac09a84fcb28abad3d89377eecb4043cb9afffc030100991d1604 | no value |
| ev/focus/focus.json | 11205 | 26c820fc9b5a298cd07e922474527c7bd9a2a1391d3495e00e7f1facddcde5e1 | identical committed blob |
| ev/focus/normal-1920-branch-2000.png | 26620 | 0c2132127e11580ba11576066cb6a7d16829ae5e5ae2e71783b5344f8ce589f7 | identical committed blob |
| ev/focus/normal-2560-branch-2000.png | 35372 | a81816fdf78200c57cb623e276019b456cd4b163885979cb343396fcac363390 | no value |
| ev/focus.txt | 4049 | 3a6710274c60f738bc5f2ad67ba4fd104c9803de4203d12c5212e33999781185 | identical committed blob |
| ev/mutants/B1/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/B2/f1-scroll-1400.png | 198402 | 90a6a7d4775c68fe97fb97b5abde1e078cd0bc5a0192a6a7113f72ea4eda83e6 | identical committed blob |
| ev/mutants/B2/f1-scroll-390.png | 97149 | 693daa1a32534c952e024e9f341c6d1e262596874a9b434c512d820b325144f9 | identical committed blob |
| ev/mutants/B2/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/mutants/B2/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/mutants/B2/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/B2/static-quota-390.png | 96763 | 481016bc0fb44a443f819316771b053b29d8c9e3e9bdaa5473f846bd3f850c51 | identical committed blob |
| ev/mutants/B2/static-reader-1400.png | 125079 | 5f4aa86ae482cc81763aa55036e054d4598815ee34ac570460a102c4fe712b8b | no value |
| ev/mutants/B2/static-reader-390.png | 99588 | a465dad20d8fa67f8159954f2748773a0061e4edf6cd24e5fed4e4fcca44c449 | no value |
| ev/mutants/B2/static-smoke.json | 8902 | 30a9217fb24dc7faf1e13e07dfe84fc87bdba119075e823f39c2a38090c43311 | retain evidence |
| ev/mutants/B3/f1-scroll-1400.png | 198403 | c5f32823da6b0b44bf4de0f6f2392d640bb19a982f2c0dacb58b051d4eec04a2 | no value |
| ev/mutants/B3/f1-scroll-390.png | 97138 | 91cdd50adce47132aec23748ea02a2c691fc6821c53811cad1cfab8aa817208c | no value |
| ev/mutants/B3/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/mutants/B3/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/mutants/B3/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/B3/static-quota-390.png | 96759 | 95975c581e16e1f9aeba82364dbbc7c71b54f4bac020f041c4f9991fae4d5b6b | identical committed blob |
| ev/mutants/B3/static-reader-1400.png | 125079 | 5f4aa86ae482cc81763aa55036e054d4598815ee34ac570460a102c4fe712b8b | no value |
| ev/mutants/B3/static-reader-390.png | 99596 | 670cb933bc42ff236404b1391030938d2dfef4a0f01223a3c4b407c3c1be4f3a | no value |
| ev/mutants/B3/static-smoke.json | 8902 | 4d4bbc4411425be2ce3a6e93bf3b984df6d13d344192fb9beacb806393f088de | retain evidence |
| ev/mutants/B4/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/B5/f1-scroll-1400.png | 198403 | 46dc05c2889fc7ecbed0d8ed8b3a655f913c4751390d0fbfc4d8154c73090aa0 | identical committed blob |
| ev/mutants/B5/f1-scroll-390.png | 97139 | 7d7069b8f433395af4849dfe7b81f5440e7527439aa1b0f1742ef7555342ab14 | no value |
| ev/mutants/B5/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/mutants/B5/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/mutants/B5/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/B5/static-quota-390.png | 96759 | 95975c581e16e1f9aeba82364dbbc7c71b54f4bac020f041c4f9991fae4d5b6b | identical committed blob |
| ev/mutants/B5/static-reader-1400.png | 125079 | 5f4aa86ae482cc81763aa55036e054d4598815ee34ac570460a102c4fe712b8b | no value |
| ev/mutants/B5/static-reader-390.png | 99588 | a465dad20d8fa67f8159954f2748773a0061e4edf6cd24e5fed4e4fcca44c449 | no value |
| ev/mutants/B5/static-smoke.json | 8902 | 5c84d6214e68eb4413aaadedcb074b20ce5881d31808f081746d0f1dc34bc7e8 | retain evidence |
| ev/mutants/mutants.json | 16041 | 8b9f99016bfe03f9254fb9748c2b0f8f0b25bd6b2edb429dc7c5efc16cec4a70 | identical committed blob |
| ev/mutants/S1/f1-scroll-1400.png | 198426 | 8fcb145d4236422a35313d9a0e74de50651ec0c001b5d5958259035ef398415c | no value |
| ev/mutants/S1/f1-scroll-390.png | 97156 | a2c489bf782894050f5091991ddaa4c0b191eb6bbbca598e2d4ae58d8407899b | no value |
| ev/mutants/S1/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/mutants/S1/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/mutants/S1/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants/S1/static-quota-390.png | 96784 | f87c77d2274857a8b98097bc6c9cf4db2edc2a2ff27888941d8ca1b682c1954b | no value |
| ev/mutants/S1/static-reader-1400.png | 124829 | 0be23c6da2b176abd9789c1c7b34721bbd36bfa72fa80ab0b06b54ab727adebf | no value |
| ev/mutants/S1/static-reader-390.png | 99590 | 20d9d1fac014c64bb4b7f1c58ffcdef91f15a0705c9556bdd28a0e5bbe446018 | no value |
| ev/mutants/S1/static-smoke.json | 8902 | 5baa7dc9e4324e759b86a13313e42759274e5ec3e1f55b82aeea033654e53eb9 | retain evidence |
| ev/mutants/S2/f1-scroll-1400.png | 198426 | 8fcb145d4236422a35313d9a0e74de50651ec0c001b5d5958259035ef398415c | no value |
| ev/mutants/S2/f1-scroll-390.png | 97139 | 7d7069b8f433395af4849dfe7b81f5440e7527439aa1b0f1742ef7555342ab14 | no value |
| ev/mutants/S2/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/mutants/S2/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/mutants/S2/static-quota-1400.png | 122649 | 4af591ebf3142e9b72fd292cfc6c47b1a502f93fb6f169b649c991ae6be4f981 | identical committed blob |
| ev/mutants/S2/static-quota-390.png | 96759 | 95975c581e16e1f9aeba82364dbbc7c71b54f4bac020f041c4f9991fae4d5b6b | identical committed blob |
| ev/mutants/S2/static-reader-1400.png | 124820 | bae6dba525d8593f28210a7ce77bdb58fa71c504cb2932df918904f47069cc5c | no value |
| ev/mutants/S2/static-reader-390.png | 99588 | a465dad20d8fa67f8159954f2748773a0061e4edf6cd24e5fed4e4fcca44c449 | no value |
| ev/mutants/S2/static-smoke.json | 8902 | 1dd4f7e4a9b8d86a5e2e345c6700987203c81aa47926f4732448b642b0b6e5c5 | retain evidence |
| ev/mutants/S3/static-quota-1400.png | 122494 | 73dd57280bda6a7d635600c591d4ec7deb24acb59b59d8d07b84d0bc3d122a88 | identical committed blob |
| ev/mutants.txt | 2943 | 3c25d2330d21fc8ecd1f26b180f955664890c14c2608f8fadc7d405688bddb4a | identical committed blob |
| ev/mutations.json | 269598 | 963014ddc66e6704eb11e4d18246fe12fc2d568048e2d490e5d9df3ccd37bf34 | identical committed blob |
| ev/mutations.txt | 2938 | bd42a36d62a1bd149fc546ce3ab61440a637c1c6d6a5c327798f702816cab278 | identical committed blob |
| ev/npmtest.txt | 3359 | 58d4cdef72ae4fd4c168f8480097cedb5bdb3a187d09b86fc9c382f516e1b968 | identical committed blob |
| ev/overlap/ov-1400-base-real2000.png | 39542 | 64a3183693df5e22c43fed516ca516f537381bcf6b9f380ecbeb64f7fd8bc115 | no value |
| ev/overlap/ov-1400-base-real500.png | 15983 | 9a9adb22a52e356e5c0bc017c0277851656298282bf5d6f290cd0b28a8a534df | no value |
| ev/overlap/ov-1400-base-W2000.png | 15829 | 43d09a908b8c6b905df2d849f38ca0f871df896b002dc3d855016ab4cb4425e0 | identical committed blob |
| ev/overlap/ov-1400-base-W500.png | 9933 | 329cca89dea5b9c30840309b7699dcc35212f7aadc6d2d2aa1c2d41644c47f71 | no value |
| ev/overlap/ov-1400-focusMode-letterOff-real2000.png | 25846 | 89c4d7eef80531d46782f47e843ca605053df45a1a5fa2c8d86b95fe5fe2391b | no value |
| ev/overlap/ov-1400-focusMode-letterOff-real500.png | 25846 | 89c4d7eef80531d46782f47e843ca605053df45a1a5fa2c8d86b95fe5fe2391b | no value |
| ev/overlap/ov-1400-focusMode-letterOff-W2000.png | 25048 | ee63585cc14347f37e7c50f590f0561d66ac796da589141937bc70472427485f | no value |
| ev/overlap/ov-1400-focusMode-letterOff-W500.png | 25048 | ee63585cc14347f37e7c50f590f0561d66ac796da589141937bc70472427485f | no value |
| ev/overlap/ov-1400-focusMode-real2000.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/overlap/ov-1400-focusMode-real500.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/overlap/ov-1400-focusMode-W2000.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/overlap/ov-1400-focusMode-W500.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/overlap/ov-1400-letterOff-real2000.png | 39413 | af8fec44c7e28492529dcdf8262242c3c23d100b7c74acba99ca4f3b0e6f0d45 | no value |
| ev/overlap/ov-1400-letterOff-real500.png | 15830 | ee78ee8e79b8740c02dbc91bd7e4a592cbd50f11ef0a4193eef98a22d99ca261 | no value |
| ev/overlap/ov-1400-letterOff-W2000.png | 15565 | 841e1ec2709d59ede2467272aaa4f7d02b294fcb3fd82348e42fc4179776eb70 | no value |
| ev/overlap/ov-1400-letterOff-W500.png | 9656 | 6c00c3c54e0978b0dad7fb8ab23ccae3db96d4c43e6e3e649a578a4a6bb3bdbe | no value |
| ev/overlap/ov-390-base-real1000.png | 15574 | 8b3837b2ef7b540f123e6a8871edf3b3edc0b604f42ba769113613460df3ada5 | identical committed blob |
| ev/overlap/ov-390-base-real2000.png | 14770 | 931a7052db5621dcfea14a2897b0992d8edc8f490ec8ec0b53cacfd095dc546c | no value |
| ev/overlap/ov-390-base-real500.png | 10332 | d097304e7236ee2638aa4b96278164b933c5d525dc4d5a41e032e7646806c34b | no value |
| ev/overlap/ov-390-base-W2000.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/overlap/ov-390-base-W500.png | 5952 | 49e0fa445a245ecdb505f98e72210cd26a6c20204035446b290584cc6d6a8fad | identical committed blob |
| ev/overlap/ov-390-focusMode-letterOff-real2000.png | 25211 | 315fa525294d4b627c415858921387a6179d5a91c944ef953ed87758fbd1cbaa | no value |
| ev/overlap/ov-390-focusMode-letterOff-real500.png | 12260 | d5b83e47832bdb269be72a45c29c3330d3728ec645129eae7f6e9ff10f00cd39 | no value |
| ev/overlap/ov-390-focusMode-letterOff-W1000.png | 8916 | d38baaaace17dafea6e8ba3b7fda41e402ec96c7f6d30c60be4b5a91f42df4c1 | no value |
| ev/overlap/ov-390-focusMode-letterOff-W2000.png | 10817 | b6249af468b785f1d55096a0f01fff53db212fb97b78d57506ae593f2f4d5193 | no value |
| ev/overlap/ov-390-focusMode-letterOff-W500.png | 6792 | 19a0dcd8518807e39afae5ee75007144111d8afb9d27fc0aaebb9e9f0e6c7284 | no value |
| ev/overlap/ov-390-focusMode-real2000.png | 25273 | 1b3002c017920aa840765b1cadfbdb92fe27fd499ffe319e4b52e042f97cd5e0 | no value |
| ev/overlap/ov-390-focusMode-real500.png | 12327 | 5379565c71f9be01df564d6c7995c06f0074a9a2f11267c3612d7f72e7a3cd6f | no value |
| ev/overlap/ov-390-focusMode-W1000.png | 9159 | 244fbae1728c850033ce4042d6ea54f3c9e6428dedc7f199b5346214cf09a0f3 | identical committed blob |
| ev/overlap/ov-390-focusMode-W2000.png | 11050 | 5c5cba8256ae2fc4b8dc42f35af512b654c67c80749151d8ea0be0b291edb630 | no value |
| ev/overlap/ov-390-focusMode-W500.png | 7060 | 881d8a128247fd0b61a2156afaa6eec8400dbf327aa8c8fe71b191f9e1dc640d | no value |
| ev/overlap/ov-390-letterOff-real1000.png | 15512 | 24ed9f4be528e36eceacb89b140536a9af522f4ebe71e120ca800917e27cce9b | no value |
| ev/overlap/ov-390-letterOff-real2000.png | 14721 | 1a6c7b22bec773c3c7cc1959e79025f37c7f930133a0426de62c259fed6d6c9f | no value |
| ev/overlap/ov-390-letterOff-real500.png | 10305 | 46cf59c8fef6091d685ff5534f63151323dbb711f25b654608ff6fde6543a817 | no value |
| ev/overlap/ov-390-letterOff-W2000.png | 6420 | ee05598c2dc76c98cf925407858cf14d224345a9c84bf370b36e7b12ba788bb6 | no value |
| ev/overlap/ov-390-letterOff-W500.png | 5719 | 16ef5717672c677de8d02182ccf61204d250849e9836e379670e66367404fe56 | identical committed blob |
| ev/overlap/overlap.json | 258736 | 4a41d1055383b3477a569981d7db1971d80753007848f5f2da1dd5d126af5e84 | identical committed blob |
| ev/overlap/thr-1400-base-real6319-below.png | 99951 | e382e66566f0d315c638709f9026ccae9aa25db900f0ea54508e84bb175b6d89 | no value |
| ev/overlap/thr-1400-base-real6320-above.png | 82507 | efb60c11bd8663c928a7c91a3a92dc1c713b13da2d3f578dcc7330051b0d49a7 | no value |
| ev/overlap/thr-1400-base-W3186-below.png | 19258 | f845cc4d03f6a8742d332195658772126ffc8160636682afc57a727acadafa51 | identical committed blob |
| ev/overlap/thr-1400-base-W3187-above.png | 17761 | fee0b5315408457a26af80708280df1aa4eecc01c19a5c28a6d0512b89819c04 | identical committed blob |
| ev/overlap/thr-1400-focusMode-letterOff-real39999-below.png | 25846 | 89c4d7eef80531d46782f47e843ca605053df45a1a5fa2c8d86b95fe5fe2391b | no value |
| ev/overlap/thr-1400-focusMode-letterOff-real40000-above.png | 25846 | 89c4d7eef80531d46782f47e843ca605053df45a1a5fa2c8d86b95fe5fe2391b | no value |
| ev/overlap/thr-1400-focusMode-letterOff-W39999-below.png | 25048 | ee63585cc14347f37e7c50f590f0561d66ac796da589141937bc70472427485f | no value |
| ev/overlap/thr-1400-focusMode-letterOff-W40000-above.png | 25048 | ee63585cc14347f37e7c50f590f0561d66ac796da589141937bc70472427485f | no value |
| ev/overlap/thr-1400-focusMode-real39999-below.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/overlap/thr-1400-focusMode-real40000-above.png | 27343 | 5fe868d551b51345ca70e75820e91d372f969aa5a6d4549e5ab0c515ab740d94 | identical committed blob |
| ev/overlap/thr-1400-focusMode-W39999-below.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/overlap/thr-1400-focusMode-W40000-above.png | 29510 | 77961e4a48efb7263072db6ec09ea0e50b953dfe1df471d48bba4f6fbb876f8e | no value |
| ev/overlap/thr-1400-letterOff-real6319-below.png | 99751 | 494bcc9c1d23b6976a96799f803e8a0d8c7092f311abf2728cf8d032109b5422 | no value |
| ev/overlap/thr-1400-letterOff-real6320-above.png | 82317 | cf883e97c4a1696936e7e526f3a04547dc05a7ef37b975b5a52f46c3e414cfe3 | no value |
| ev/overlap/thr-1400-letterOff-W3186-below.png | 19006 | f267dacedfb2c4c5018d78f3ff85eff20d9ec61c540a87bd0ebdc10a27d0dcf0 | no value |
| ev/overlap/thr-1400-letterOff-W3187-above.png | 17529 | 4c6dc710df5c4ee54718cdd7e953dd2fdcfb6d9ef65ab834bedd2eacef401007 | no value |
| ev/overlap/thr-390-base-real1565-below.png | 20022 | 75a55db007cae567f81c0c657afa6f06b320c36f8e45c3c18eb49e8a4a9e6276 | no value |
| ev/overlap/thr-390-base-real1566-above.png | 14770 | 931a7052db5621dcfea14a2897b0992d8edc8f490ec8ec0b53cacfd095dc546c | no value |
| ev/overlap/thr-390-base-W780-below.png | 6837 | 705fdfcc06dfae1dcfdb990827c5cd0d3e989bb18c8b5d503dcb9df25a7c8f85 | identical committed blob |
| ev/overlap/thr-390-base-W781-above.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/overlap/thr-390-focusMode-letterOff-real3244-below.png | 35209 | 9ae9b8256a928147cacc9400547e7994b2c7da553df87e7c804c5fe75c645db7 | no value |
| ev/overlap/thr-390-focusMode-letterOff-real3245-above.png | 28832 | 30d6f97e4f1abe64349341fb8628c9c15d65ea6d775e4e0b79f6787310ab90a5 | no value |
| ev/overlap/thr-390-focusMode-letterOff-W1620-below.png | 10699 | 305b2566e220b8fd2f557ac2da3533ab79c1938d4a42afbd16685ded72a998e4 | no value |
| ev/overlap/thr-390-focusMode-letterOff-W1621-above.png | 10817 | b6249af468b785f1d55096a0f01fff53db212fb97b78d57506ae593f2f4d5193 | no value |
| ev/overlap/thr-390-focusMode-real3244-below.png | 35270 | 87306491feeaecca365bd06e8cf282e76d3986c8fb42a69e39e93cdb43197799 | no value |
| ev/overlap/thr-390-focusMode-real3245-above.png | 28875 | febd309ef79d1993bf2c86ab1469a5111d72e1890f81a8c1d230f0c8462b7539 | no value |
| ev/overlap/thr-390-focusMode-W1620-below.png | 10936 | 557f2fef69e08d01f9715a2752724fed0a81f3a38aaf1b3c8bd8f75f15e80203 | no value |
| ev/overlap/thr-390-focusMode-W1621-above.png | 11050 | 5c5cba8256ae2fc4b8dc42f35af512b654c67c80749151d8ea0be0b291edb630 | no value |
| ev/overlap/thr-390-letterOff-real1565-below.png | 19960 | fcb43fdefe3251021548c5b498da9aae6333bd7b4e6993ace3dbc1425f3bbf1b | no value |
| ev/overlap/thr-390-letterOff-real1566-above.png | 14721 | 1a6c7b22bec773c3c7cc1959e79025f37c7f930133a0426de62c259fed6d6c9f | no value |
| ev/overlap/thr-390-letterOff-W780-below.png | 6607 | aef8e8fc478c251299dec2f3ed0158a0560e20b505ca56441016be65a1aff107 | no value |
| ev/overlap/thr-390-letterOff-W781-above.png | 6420 | ee05598c2dc76c98cf925407858cf14d224345a9c84bf370b36e7b12ba788bb6 | no value |
| ev/overlap-table.txt | 11630 | 9e58a3523733e2cfed157aeff694d269a57c1e42b733ef23f968ff8eafbdc3f8 | identical committed blob |
| ev/overlap.txt | 16472 | 7f84b53dc37560b18dc6541f162804872bea0aa116ff6a54662ff954915fe33b | identical committed blob |
| ev/parity/browser-parity.json | 13412 | dda071b7356dd6a12c67b05aff35bdffa59efbed67b614788cbe541bfeb7379c | identical committed blob |
| ev/parity/f1-scroll-1400.png | 198426 | 8fcb145d4236422a35313d9a0e74de50651ec0c001b5d5958259035ef398415c | no value |
| ev/parity/f1-scroll-390.png | 97139 | 7d7069b8f433395af4849dfe7b81f5440e7527439aa1b0f1742ef7555342ab14 | no value |
| ev/parity/reader-1400.json | 27693 | c5fce0349543497b1761991cb3e475a27fe147018504df3d0911a1ad8d4dc40b | identical committed blob |
| ev/parity/reader-390.json | 28204 | 2f133279aced11340bbba6622068ec0d7d264defff856e980d79362672e99ed8 | identical committed blob |
| ev/parity/static-reader-1400.png | 124988 | 56199211e5a3ad6cb252dca26d55a31308b2421a4bdb9da67a77243f64008c95 | no value |
| ev/parity/static-reader-390.png | 99601 | 1c751544489277643b2504522d2916dd2f8e758ca8f39ac6551f108e991355c7 | no value |
| ev/parity/static-smoke.json | 8902 | 134b798c0a01c35d4c83453d2d640728af68d8c70135d678960d6b2b2c115c17 | identical committed blob |
| ev/parity.txt | 289 | 4fc754d87f18bcd0ebac929971d5496dd893cacb42abe900c9ec355953129ff6 | identical committed blob |
| ev/play/play.json | 13660 | e4d9a76e2a4bcb14eac22da781b443c1b90e5e96eda6a6335684922fc55ad46e | identical committed blob |
| ev/play.txt | 10221 | 947498ead500e1c5fe36020538670a8f8c1bfc69ae22d250e96dc09116e93337 | identical committed blob |
| ev/repeat.txt | 282 | aba241803e1196756e1244ec01a61a70474a9d583c37906f06fe9d7fe815b36c | identical committed blob |
| ev/resize.json | 6624 | 348ef680d6ac6bf30f4bde2b3f85e80811b880f9649463fad5028fd7dc7060f6 | identical committed blob |
| ev/resize.txt | 4940 | f1a612435d3791c215e61dca7b4841888fe3a601993c934e3d7a40093f032d6f | identical committed blob |
| ev/restart.txt | 148 | 1314aec9a8c2e09dddaeeecbf0b87b865ee6fe5e67e10ad3fb9f8a649319e4c9 | identical committed blob |
| ev/scroll/area-390x600-real2000.png | 14770 | 931a7052db5621dcfea14a2897b0992d8edc8f490ec8ec0b53cacfd095dc546c | no value |
| ev/scroll/area-390x600-W10000.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/scroll/area-390x600-W2000.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/scroll/area-390x844-real2000.png | 14770 | 931a7052db5621dcfea14a2897b0992d8edc8f490ec8ec0b53cacfd095dc546c | no value |
| ev/scroll/area-390x844-W10000.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/scroll/area-390x844-W2000.png | 6648 | b888d63e63bd61c1d18b1c5c6307611c696de1b358d159b79cc4d2fd4496c1bb | identical committed blob |
| ev/scroll/area-844x390-W10000.png | 10303 | 37dd5fbe0dbc708cb9d4b6002e14db055d58e5180c2f2b1a0267b82e2f08c4df | no value |
| ev/scroll/area-844x390-W2000.png | 10303 | 37dd5fbe0dbc708cb9d4b6002e14db055d58e5180c2f2b1a0267b82e2f08c4df | no value |
| ev/scroll/page-390x600-real2000.png | 31253 | 7d4612e0c7d39d8cd9265a0a1f3bc1e25db3b97c3d2c790d17a9ead84f4b8f48 | no value |
| ev/scroll/page-390x600-W10000.png | 22953 | 19e0f8e700490e80fe79f6de811f82f661b2bd02545cb2dcc887b8dcc3ebd720 | no value |
| ev/scroll/page-390x600-W2000.png | 22953 | 19e0f8e700490e80fe79f6de811f82f661b2bd02545cb2dcc887b8dcc3ebd720 | no value |
| ev/scroll/page-390x844-real2000.png | 45853 | 91ec090796a0481068dec8510ceaa89432eac9326001fc1e10089b393a4267b5 | no value |
| ev/scroll/page-390x844-W10000.png | 37543 | 04a148f7b1641ebec24bfea85647b9f3f9c8087e3ab2ff1f2bcdfe5101483aa2 | no value |
| ev/scroll/page-390x844-W2000.png | 37543 | 04a148f7b1641ebec24bfea85647b9f3f9c8087e3ab2ff1f2bcdfe5101483aa2 | no value |
| ev/scroll/page-844x390-W10000.png | 39891 | 4009eb027f74748aeab859b6140966f29ce9c1245efa7f2ca1b502c4681238d6 | identical committed blob |
| ev/scroll/page-844x390-W2000.png | 39891 | 4009eb027f74748aeab859b6140966f29ce9c1245efa7f2ca1b502c4681238d6 | identical committed blob |
| ev/scroll/scroll.json | 17808 | 8f75e58bbf4ca480175246fd6e347c245ff38b19f4949ba26ef4eb466b877a76 | identical committed blob |
| ev/scroll.txt | 6694 | dcf845d433089c836e14c1e037437dfd2c06b19a005eaf4ca424d06438a65617 | identical committed blob |
| ev/wide.txt | 808 | 769f62a7afd29fbfd7ba54158c36ee59bda45f8497e5b33003616d5267ebe585 | identical committed blob |
| extra.cjs | 4818 | 5c1cad335c87d5db64b89e93e92be120cf321737c86597e9963ad24f2a949c96 | identical committed blob |
| final.cjs | 1816 | b4d402652c78a8ef192e2ccae0416a7da9546a47b536e41393ecde7bd9a6f2b5 | identical committed blob |
| focuscheck.cjs | 2253 | 92ca22eeedb1312e5ac90fa147e995211d3ba9135e00b03afa5ab7a3188312ff | identical committed blob |
| lib.cjs | 5836 | e0429981cf0086b79d130b065d0756b88afca6c2edb86c3d8640546cf37b27db | identical committed blob |
| mutants.cjs | 3176 | 8f9eb41032a869280dd4f257bcfae6d2f7ed9e33e5859f2424ccf1d3cdb844ed | identical committed blob |
| npmtest-nobrowser.txt | 46 | 8560f2a519a817d4227dff2f98845ac2e2ab94512045bff27416a30adef9c049 | no value |
| npmtest.txt | 3359 | 58d4cdef72ae4fd4c168f8480097cedb5bdb3a187d09b86fc9c382f516e1b968 | identical committed blob |
| overlap.cjs | 6689 | fcbd06feb29e92b7589ab62dcb36312fe024c6e7f69e5badbcd6d3493c423b9a | identical committed blob |
| parity.txt | 289 | 4fc754d87f18bcd0ebac929971d5496dd893cacb42abe900c9ec355953129ff6 | identical committed blob |
| play.cjs | 7030 | 23766068cfca55d00bb2ce3e913383f6fb41bbc924a5c82e0fa8c19dc01459ca | identical committed blob |
| repeat.cjs | 1623 | 26b5b40eea74277e6a343e6025021d3a35b4ca1579a18069871a7e1be0506944 | identical committed blob |
| resize.cjs | 3400 | 14eaf1c96e34f7925a4df63f3e70545038dc0a912ca556037f082d7cf29310a2 | identical committed blob |
| restart.cjs | 1275 | a4bdb34ac5e5806470ad70805c2f835b089e6793c83e1dbfc0a98bdf72c76f81 | identical committed blob |
| scrollarea.cjs | 7994 | ef5f093331938740d0cabed75db4c2bf35b64a5794a5c669473cb69239e48969 | identical committed blob |
| tmp/wordflow-test-network.jsonl | 87 | 6689b389e9e29a5991d94a7935fbd6aec39504ddd781225351ff9f09316d50f1 | no value |
| tmp/x.txt | 1 | 6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b | no value |
| vault-project.cjs | 5134 | 6391561790bf263cc4ec99f0ced2cdf6f7f5c279c46674f507ffd4b9ff2e60d8 | no value |
| wide.cjs | 1188 | 72d78fdd7554fbd3f17c506c655f1aadb024ba3317e8040c8df318d7867151a5 | identical committed blob |

## Records and limitations

AGENTS.md open item, vault project, hot-cache WordFlow lines and current-state carry: F1 candidate (W6.1-W6.12) committed on fix/f1-long-token, pending CC re-review; not yet fixed (W6.11). Vault append-first updates preserve history and other projects. Codex worklog and exact 19:15 Claude relay appended. Dated daily note absent; none created. Wiki index/log synchronized; current handoff points to this report.

NOT verified: independent CC re-review/acceptance; all possible tokens or viewports; physical phones/touch or orientation sensors; other browsers, zoom/DPR/font inventories; Unicode/graphemes/RTL/complex scripts; screen readers; hidden-tab playback; arbitrary longer context words; all compact/comfortable combinations (only existing controls/preservation paths exercised). One-Play and nine-action preservation are directly exercised at the phone viewport with stated resize/mode actions, not exhaustively at every viewport. Pixel identity uses the controlled backdrop, not production gradients. Cloudflare runtime quota/fail-open, maximum-body CPU, Functions log-session state and static-view request counting remain unverified. No live check ran because no deployment occurred.

End state: committed locally on fix/f1-long-token; master b9d3d9e untouched; nothing pushed/deployed. Next: one CC re-review, Marcus's merge/push decision through tools/push.sh, then npm run smoke:live after deployment.
