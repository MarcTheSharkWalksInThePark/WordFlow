# WordFlow F1 round 2 — W6.7–W6.11

Date: 2026-10-07. Builder: Codex (gpt-6.1-sol, high).

Starting clean branch: fix/f1-long-token at fc98d1e8a047b72bf785bb4bffc37523b7da0033.
Master: b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7. Rulings recorded verbatim
before code in separate commit 2d5e6a7. Local only; no merge/push/deployment.

## Recon — recorded before implementation

The flow under test is paste -> display a whole token -> fit/wrap/scroll -> pause,
one Play through the existing countdown, normal finish and restart. Browser plugin
not available; use the repository's installed Chrome/bundled Playwright workflow.

W6.7: reset only the long-layout classes synchronously, measure the previous/next
context strips in their normal live layout, and compare natural wrapped height with
the free centred gap. Include text ink extending outside the context line boxes.
For hidden or absent context, briefly measure the same strips with actual adjacent
words (a nonbreaking-space placeholder for an absent neighbor), then restore their
hidden/text values before paint. Focus mode uses those same live measurements after
its class changes; no percentage of frame height substitutes for the context gap.
The reserved scroll layout remains bounded by the normal frame. Its existing 130 px
phone area exceeds three 10.5 px lines; the full requested matrix must verify this.

F-2: max-width:min(820px,94%) caps the display rectangle at 820 while the focus spans
overflow. At frame width 912, 90% is 820.8, so the old rectangle-only comparison
returns true at base font size. Fitting must include the text Range and scroll/client
width comparison; the floor break must also use the actual capped display width.
Preserve the existing 12-step search, flooring, base sizes and geometry for content
that fits on master. The amendment permits changing the clipped wide-frame cases.

F-3: play checks data-long-text-paused before finished. completeReading renders the
same long word without clearing that marker or the note; the next Play finishes again.
Finished rendering must clear presentation and skip long-layout fitting. The next
Play then reaches master's existing finished/index reset and countdown.

F-4: the marker is set only on automatic pause. Manual Next/Previous/seek and Resume
enable scrolling without it, so Play counts down on the same token and auto-pauses.
Detect the current scroll class in play instead, advance via seekTo, and retain the
existing countdown. No new state or session field is necessary.

Minor 6: resetLongTokenLayout removes tabindex (dropping focus) and zeros scrollTop.
renderWord resets before fitDisplayedWord can capture the offset. Preserve the offset
through same-token rendering and keep tabindex during synchronous remeasurement;
remove it only if the resulting token leaves scroll state. Do not call focus().
Copy/pacing/size/context/focus changes and same-index seeks can keep that presentation.
Countdown following Play is on the next word under W6.9; clearing the old region there
is appropriate. Leaving scroll state clears presentation, as requested.

## Labelled implementation choices — before coding

- Measure conservative centred free height against both context boxes and text ink.
- Retain existing reserved strips, note, native scrolling, no visual hyphens and 10 px floor.
- Use rendered content extents as well as the capped box; preserve the fitting algorithm.
- Preserve raw pixel scrollTop (clamped by the browser if the new maximum is smaller),
  rather than inventing a character-position or resume field.
- Keep keyboard focus by retaining the existing tab stop during measurement; never auto-focus.
- Reuse seekTo/countdown/pause/completeReading; clear all long-text presentation on finish.

Verification and final evidence will be appended after the authorized fix round.

## Mandatory STOP and final source state

**STOP — W6.8 changed fully visible master tokens. F1 is not fixed or accepted.**

At 1708x950, master renders `WWWWWWW` at 128 px. Its text Range is 900.375 px wide,
inside the 912 px frame: x = 423.8125–1324.1875 against frame interior x = 418–1330.
The 820 px display box has visible child overflow; that overflow is still entirely inside
the frame. The cap-based candidate shrinks the token to 116 px (815.984375 px content).
Both frames have clientWidth = scrollWidth = 912. This is a rendering change to a token
that was not clipped on master. It meets Marcus's explicit STOP condition.

Measuring against the capped box and preserving all tokens fully visible inside the frame
are different constraints for these cases. No exemption or alternate fitting behavior was
invented. Marcus must clarify which invariant governs cap-overflowing but fully visible tokens.
The planned implementation status and CC re-review handoff are withheld until that is resolved.

| Viewport / mode | Token | Master font -> candidate font | Master content width | Frame width | Fully visible on master |
|---|---|---|---|---|---|
| 1708x950 normal | W x 7 | 128px -> 116px | 900.38 | 912 | yes |
| 1920x1080 normal | W x 7 | 128px -> 116px | 900.38 | 1124 | yes |
| 1920x1080 normal | W x 8 | 128px -> 102px | 1029 | 1124 | yes |
| 996x950 focus | W x 9 | 99.6px -> 90px | 900.81 | 912 | yes |
| 1400x950 focus | W x 6 | 140px -> 136px | 844.13 | 1316 | yes |
| 1400x950 focus | W x 7 | 140px -> 116px | 984.8 | 1316 | yes |
| 1400x950 focus | W x 8 | 140px -> 102px | 1125.48 | 1316 | yes |
| 1400x950 focus | W x 9 | 140px -> 90px | 1266.17 | 1316 | yes |

`wide-controls.json` records all 36 cap-boundary probes, including full before/after word,
context, note, frame and area rectangles/sizes for each. `wide-controls.cjs` reproduces them
after restoring the candidate in a disposable checkout.

Production app.js, tests/reader-smoke.cjs and tools/static_smoke.cjs were restored from fc98d1e.
The untracked tests/reader-round2.cjs was removed after preservation. There is no frontend or
runtime-test diff from the starting branch. styles.css and index.html were never changed.
The rejected candidate is retained as `candidate.patch` plus `candidate-reader-round2.cjs`.
Apply the patch and copy that test file to tests/reader-round2.cjs only in a disposable checkout
for reproduction. No candidate implementation is committed as production code.

## Candidate measurements and implementation choices

The recon choices above were tried in the withdrawn candidate. Existing 52/96 px reserved strips
were retained: a token can enter the scroll state while all its content fits the reserved area;
it pauses and shows the note, but needs no scrolling gesture. When content does overflow that
area, native vertical scrolling is retained. The smallest tested area was 130 px, over twelve
10.5 px lines. No unusable-area STOP occurred.

The candidate included box and text-Range widths plus scroll/client width in fitting. The floor
break used the capped box width. It retained the 10 px floor, 12-step search and no hyphens.
That capped-box choice is the source of the mandatory STOP, not an accepted Marcus decision.

Scroll position is the raw CSS-pixel offset, clamped to a new maximum if necessary. Existing
tabindex is kept during synchronous measurement; focus() is never called by production code.
The existing presentation marker identifies every current scroll token, including manual arrival.
Play uses seekTo(index+1) and the existing countdown. Final finish resets presentation and allows
the existing finished-to-first-word restart. No new playback state or v1 field was added.

Normal mode, focus mode, context on/off and focus-letter on/off use live strip rectangles and
text ink. The threshold is twice the smaller distance from the frame centre to those bounds.
This conservative centred clearance is slightly smaller than CC's uncentred ink-gap figure:
116.50 versus 117.09 px on the phone; 285.91 versus 285.95 px at 1400; 281 versus 281.69 px
in phone focus mode. Natural height includes scrollHeight, not just the line-box height.

| Viewport / mode | Frame client height | Threshold | Last non-scroll W length / natural height | First scroll W length / natural height | Reserved area client height |
|---|---|---|---|---|---|
| 390x844 normal | 278 | 116.5 | 300 / 107 | 301 / 117 | 130 |
| 390x600 normal | 278 | 116.5 | 300 / 107 | 301 / 117 | 130 |
| 844x390 normal | 366 | 158.16 | 476 / 149 | 477 / 159 | 218 |
| 1400x950 normal | 625 | 285.91 | 1458 / 285 | 1459 / 296 | 477 |
| 1708x950 normal | 625 | 285.91 | 2187 / 285 | 2188 / 296 | 477 |
| 1920x1080 normal | 755 | 358.72 | 3300 / 348 | 3301 / 359 | 607 |
| 996x950 focus | 645 | 307.03 | 2349 / 306 | 2350 / 317 | 497 |
| 1400x950 focus | 645 | 297.13 | 3276 / 296 | 3277 / 306 | 497 |
| 390x844 focus | 572 | 281 | 780 / 275 | 781 / 285 | 424 |

Every layout was repeated with context off and focus letter off (all four combinations).
The threshold is identical for context on/off at each layout. The same word remains intact.
All 72 below/above boundary cases were collision-free in the candidate.

Rectangles below use x / y / width / height in CSS px. Frame and area sizes use
clientWidth / scrollWidth / clientHeight / scrollHeight. These compare fc98d1e
with the candidate on the same token. Context/focus-letter are on; each entry is
recorded immediately after fitting, before scrolling. A hidden note has no visible rectangle.
The raw JSON has all four mode combinations and every size/rectangle before and after.

### Just below the candidate threshold

| Viewport / mode / W length | Build | Word rectangle | Previous rectangle | Next rectangle | Note rectangle | Frame C/S W/H | Area C/S W/H | Threshold |
|---|---|---|---|---|---|---|---|---|
| 390x844 normal / 300 | before | 41.1 / 320.97 / 307.8 / 105 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 105 / 107 | 116.5 |
| 390x844 normal / 300 | candidate | 41.1 / 320.97 / 307.8 / 105 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 105 / 107 | 116.5 |
| 390x600 normal / 300 | before | 41.1 / 320.97 / 307.8 / 105 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 105 / 107 | 116.5 |
| 390x600 normal / 300 | candidate | 41.1 / 320.97 / 307.8 / 105 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 105 / 107 | 116.5 |
| 844x390 normal / 476 | before | 437.2 / 253.5 / 345.59 / 147 | 589.49 / 224.52 / 41.02 / 20.41 | 595.08 / 409.08 / 29.84 / 20.41 | hidden | 384 / 384 / 366 / 366 | 346 / 346 / 147 / 149 | 158.16 |
| 844x390 normal / 476 | candidate | 437.2 / 253.5 / 345.59 / 147 | 589.49 / 224.52 / 41.02 / 20.41 | 595.08 / 409.08 / 29.84 / 20.41 | hidden | 384 / 384 / 366 / 366 | 346 / 346 / 147 / 149 | 158.16 |
| 1400x950 normal / 1458 | before | 448.2 / 314.75 / 543.59 / 283.5 | 690.83 / 281.5 / 58.34 / 29.05 | 698.78 / 602.45 / 42.44 / 29.05 | hidden | 604 / 604 / 625 / 625 | 544 / 544 / 284 / 285 | 285.91 |
| 1400x950 normal / 1458 | candidate | 448.2 / 314.75 / 543.59 / 283.5 | 690.83 / 281.5 / 58.34 / 29.05 | 698.78 / 602.45 / 42.44 / 29.05 | hidden | 604 / 604 / 625 / 625 | 544 / 544 / 284 / 285 | 285.91 |
| 1708x950 normal / 2187 | before | 140659.44 / 387.38 / 820 / 138.23 | 844.83 / 281.5 / 58.34 / 29.05 | 852.78 / 602.45 / 42.44 / 29.05 | hidden | 912 / 281303 / 625 / 625 | 820 / 141061 / 138 / 152 | 285.91 |
| 1708x950 normal / 2187 | candidate | 463.6 / 314.75 / 820.8 / 283.5 | 844.83 / 281.5 / 58.34 / 29.05 | 852.78 / 602.45 / 42.44 / 29.05 | hidden | 912 / 912 / 625 / 625 | 821 / 821 / 284 / 285 | 285.91 |
| 1920x1080 normal / 3300 | before | 212239.25 / 452.38 / 820 / 138.23 | 950.83 / 310.09 / 58.34 / 29.05 | 958.78 / 703.86 / 42.44 / 29.05 | hidden | 1124 / 424463 / 755 / 755 | 820 / 212641 / 138 / 152 | 358.72 |
| 1920x1080 normal / 3300 | candidate | 474.2 / 348.25 / 1011.59 / 346.5 | 950.83 / 310.09 / 58.34 / 29.05 | 958.78 / 703.86 / 42.44 / 29.05 | hidden | 1124 / 1124 / 755 / 755 | 1012 / 1012 / 347 / 348 | 358.72 |
| 996x950 focus / 2349 | before | 117183.39 / 412.72 / 820 / 107.56 | 473.79 / 285.89 / 48.42 / 24.09 | 480.39 / 623.02 / 35.22 / 24.09 | hidden | 912 / 235103 / 645 / 645 | 820 / 117961 / 108 / 118 | 307.03 |
| 996x950 focus / 2349 | candidate | 87.6 / 314.25 / 820.8 / 304.5 | 473.79 / 285.89 / 48.42 / 24.09 | 480.39 / 623.02 / 35.22 / 24.09 | hidden | 912 / 912 / 645 / 645 | 821 / 821 / 305 / 306 | 307.03 |
| 1400x950 focus / 3276 | before | 230071.72 / 390.91 / 820 / 151.19 | 670.83 / 285.89 / 58.34 / 29.05 | 678.78 / 618.06 / 42.44 / 29.05 | hidden | 1316 / 460879 / 645 / 645 | 820 / 230850 / 151 / 166 | 297.13 |
| 1400x950 focus / 3276 | candidate | 107.8 / 319.5 / 1184.39 / 294 | 670.83 / 285.89 / 58.34 / 29.05 | 678.78 / 618.06 / 42.44 / 29.05 | hidden | 1316 / 1316 / 645 / 645 | 1184 / 1184 / 294 / 296 | 297.13 |
| 390x844 focus / 780 | before | 41.1 / 383.92 / 307.8 / 273 | 177.32 / 360.28 / 35.36 / 17.59 | 182.14 / 662.97 / 25.72 / 17.59 | hidden | 342 / 342 / 572 / 572 | 308 / 308 / 273 / 275 | 281 |
| 390x844 focus / 780 | candidate | 41.1 / 383.92 / 307.8 / 273 | 177.32 / 360.28 / 35.36 / 17.59 | 182.14 / 662.97 / 25.72 / 17.59 | hidden | 342 / 342 / 572 / 572 | 308 / 308 / 273 / 275 | 281 |

### Just above the candidate threshold

| Viewport / mode / W length | Build | Word rectangle | Previous rectangle | Next rectangle | Note rectangle | Frame C/S W/H | Area C/S W/H | Threshold |
|---|---|---|---|---|---|---|---|---|
| 390x844 normal / 301 | before | 41.1 / 315.72 / 307.8 / 115.5 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 116 / 117 | 116.5 |
| 390x844 normal / 301 | candidate | 41.1 / 286.47 / 307.8 / 130 | 177.32 / 246.47 / 35.36 / 17.59 | 182.14 / 440.88 / 25.72 / 17.59 | 37.67 / 487.47 / 314.63 / 15 | 342 / 342 / 278 / 278 | 308 / 308 / 130 / 130 | 116.5 |
| 390x600 normal / 301 | before | 41.1 / 315.72 / 307.8 / 115.5 | 177.32 / 295.63 / 35.36 / 17.59 | 182.14 / 433.72 / 25.72 / 17.59 | hidden | 342 / 342 / 278 / 278 | 308 / 308 / 116 / 117 | 116.5 |
| 390x600 normal / 301 | candidate | 41.1 / 286.47 / 307.8 / 130 | 177.32 / 246.47 / 35.36 / 17.59 | 182.14 / 440.88 / 25.72 / 17.59 | 37.67 / 487.47 / 314.63 / 15 | 342 / 342 / 278 / 278 | 308 / 308 / 130 / 130 | 116.5 |
| 844x390 normal / 477 | before | 437.2 / 248.25 / 345.59 / 157.5 | 589.49 / 224.52 / 41.02 / 20.41 | 595.08 / 409.08 / 29.84 / 20.41 | hidden | 384 / 384 / 366 / 366 | 346 / 346 / 158 / 159 | 158.16 |
| 844x390 normal / 477 | candidate | 437.2 / 196 / 345.59 / 218 | 589.49 / 156 / 41.02 / 20.41 | 595.08 / 435.59 / 29.84 / 20.41 | 433.36 / 485 / 353.27 / 15 | 384 / 384 / 366 / 366 | 346 / 346 / 218 / 218 | 158.16 |
| 1400x950 normal / 1459 | before | 448.2 / 309.5 / 543.59 / 294 | 690.83 / 281.5 / 58.34 / 29.05 | 698.78 / 602.45 / 42.44 / 29.05 | hidden | 604 / 604 / 625 / 625 | 544 / 544 / 294 / 296 | 285.91 |
| 1400x950 normal / 1459 | candidate | 448.2 / 196 / 543.59 / 477 | 690.83 / 156 / 58.34 / 29.05 | 698.78 / 685.95 / 42.44 / 29.05 | 442.16 / 744 / 555.67 / 15 | 604 / 604 / 625 / 625 | 544 / 544 / 477 / 477 | 285.91 |
| 1708x950 normal / 2188 | before | 140723.75 / 387.38 / 820 / 138.23 | 844.83 / 281.5 / 58.34 / 29.05 | 852.78 / 602.45 / 42.44 / 29.05 | hidden | 912 / 281432 / 625 / 625 | 820 / 141126 / 138 / 152 | 285.91 |
| 1708x950 normal / 2188 | candidate | 463.6 / 196 / 820.8 / 477 | 844.83 / 156 / 58.34 / 29.05 | 852.78 / 685.95 / 42.44 / 29.05 | 454.47 / 744 / 839.03 / 15 | 912 / 912 / 625 / 625 | 821 / 821 / 477 / 477 | 285.91 |
| 1920x1080 normal / 3301 | before | 212303.56 / 452.38 / 820 / 138.23 | 950.83 / 310.09 / 58.34 / 29.05 | 958.78 / 703.86 / 42.44 / 29.05 | hidden | 1124 / 424591 / 755 / 755 | 820 / 212706 / 138 / 152 | 358.72 |
| 1920x1080 normal / 3301 | candidate | 474.2 / 196 / 1011.59 / 607 | 950.83 / 156 / 58.34 / 29.05 | 958.78 / 815.95 / 42.44 / 29.05 | 462.95 / 874 / 1034.08 / 15 | 1124 / 1124 / 755 / 755 | 1012 / 1012 / 607 / 607 | 358.72 |
| 996x950 focus / 2350 | before | 117233.44 / 412.72 / 820 / 107.56 | 473.79 / 285.89 / 48.42 / 24.09 | 480.39 / 623.02 / 35.22 / 24.09 | hidden | 912 / 235203 / 645 / 645 | 820 / 118011 / 108 / 118 | 307.03 |
| 996x950 focus / 2350 | candidate | 87.6 / 196 / 820.8 / 497 | 473.79 / 156 / 48.42 / 24.09 | 480.39 / 710.91 / 35.22 / 24.09 | 78.47 / 764 / 839.03 / 15 | 912 / 912 / 645 / 645 | 821 / 821 / 497 / 497 | 307.03 |
| 1400x950 focus / 3277 | before | 230142.06 / 390.91 / 820 / 151.19 | 670.83 / 285.89 / 58.34 / 29.05 | 678.78 / 618.06 / 42.44 / 29.05 | hidden | 1316 / 461020 / 645 / 645 | 820 / 230920 / 151 / 166 | 297.13 |
| 1400x950 focus / 3277 | candidate | 107.8 / 196 / 1184.39 / 497 | 670.83 / 156 / 58.34 / 29.05 | 678.78 / 705.95 / 42.44 / 29.05 | 94.63 / 764 / 1210.72 / 15 | 1316 / 1316 / 645 / 645 | 1184 / 1184 / 497 / 497 | 297.13 |
| 390x844 focus / 781 | before | 41.1 / 378.67 / 307.8 / 283.5 | 177.32 / 360.28 / 35.36 / 17.59 | 182.14 / 662.97 / 25.72 / 17.59 | hidden | 342 / 342 / 572 / 572 | 308 / 308 / 284 / 285 | 281 |
| 390x844 focus / 781 | candidate | 41.1 / 286.47 / 307.8 / 423.91 | 177.32 / 246.47 / 35.36 / 17.59 | 182.14 / 734.78 / 25.72 / 17.59 | 37.67 / 781.38 / 314.63 / 15 | 342 / 342 / 572 / 572 | 308 / 308 / 424 / 424 | 281 |

## Verification results — distinguish candidate from restored source

| Check | Candidate / STOP evidence | Restored starting reader |
|---|---|---|
| npm test | 505 Node checks, 0 skips | 505 Node checks, 0 skips |
| Expanded browser probe | 36 layout/mode rows; 144 geometry samples; 72 boundary cases | New checks are withdrawn with the candidate |
| Master control comparison | 180 probes; 56 declared box-fitting controls byte-identical / 0 differing pixels with flat test backdrop; eight later fully-visible counterexamples violate W6.8 | Baseline prior controls pass |
| Data / v1 session | 72 comparisons (36 real paste + Next and 36 reload + Resume); all 13 v1 fields checked, savedAt number/clock values excluded | Existing baseline resume/data checks pass |
| Play | Auto-pause, Next, Previous, progress seek, Resume each advance with one Play and 3-2-1 countdown; final finish/Play restart matches short-final master | Existing 72 smoke checks pass; CC findings remain |
| Keyboard / focus | Native Space scroll inside region; external Space toggles; no automatic focus | Existing baseline keys pass |
| Preservation | Resize 1400 and 390, same-index seek, copy, focus letter, context, focus mode, word size, pacing: 9 actions keep focus and raw/clamped scrollTop | CC's prior reset findings remain |
| 78 registered mutations | 77 KILLED + equivalent M9; 0 unexpected/errors; exact definitions and verdicts equal CC | Protected source restored/unchanged; registry unchanged |
| npm run parity | No successful full candidate parity: STOP | 9 exact DOCX, 7 PDFs (5 exact / 2 pinned), 72 smoke, 0 skips/errors/uploads |

The 56 control classification initially required content to fit the capped box. The extra W4–W12
probes correctly distinguish box overflow from actual frame clipping, exposing the eight counterexamples.
Consequently the initial control successes do **not** prove W6.8 for all master-fitting tokens.

Candidate probe is not the full static smoke: it drives real Chrome but its standalone driver
did not collect candidate pageerror events. Reference-page errors were asserted zero. Full
candidate smoke/parity was not completed; 0 application errors and 0 uploads are established
for the restored baseline only. The rejected candidate must not receive a passing parity claim.

### CC hand-mutant reproduction

No new registered mutation harness. CC's eight exact transforms are replayed by the small
evidence script against the existing post-review suite and full Chrome smoke entry point.
Every final run checks mutated bytes after both suites and original bytes after restoration.
An initial run was discarded after overlapping line-ending normalization; the authoritative
rerun is sequential and hash-checked.

| ID | Node | Chrome | Chrome red check | Previously survived Chrome |
|---|---|---|---|---|
| B1 | KILLED | KILLED | W6 browser predicate B1/B4 | no |
| B2 | KILLED | KILLED | W6 browser predicate B2 | yes |
| B3 | KILLED | KILLED | W6 browser predicate B3/B5 | yes |
| B4 | KILLED | KILLED | W6 browser predicate B1/B4 | no |
| B5 | KILLED | KILLED | W6 browser predicate B3/B5 | yes |
| S1 | KILLED | KILLED | W6 browser predicate S1 | yes |
| S2 | KILLED | KILLED | W6 browser predicate S2 | yes |
| S3 | KILLED | KILLED | W6 browser predicate S3 | no |

B2 tests exact width equality; B3/B5 test above-floor excess width; S1 tests exact height
equality; S2 tests unwrapped excess height. These execute production predicates in Chrome,
not synthetic DOM layout states. The real rendered matrix separately checks fitting, collisions
and transitions. All five survivors are caught by candidate browser checks, but those tests
remain candidate evidence after STOP. hand-mutants.json has each exact transform, full SHA-256
before/mutated/after-suite/restored and both failing check names.

### Pixel-capture investigation

Raw frame PNG comparisons initially differed despite identical token DOM, geometry and computed CSS.
A history-dependent Hello pair differed by 2264 pixels across unchanged frame background/borders;
reloading changed master's own pixels and produced a byte-identical fresh pair. A later real-word
pair differed by 83 pixels confined to x=171–172 of the unchanged centre gradient, with no word-pixel
difference. Disabling GPU did not consistently remove it; that helper experiment was reverted.
The underlying Chrome rasterisation cause is not established.

Token comparisons therefore use matching fresh documents with a flat #fffdfa frame backdrop
served only by the test route on both sides. Production styles are unchanged and all geometry,
collision and interaction checks use them. The scope is token rasterisation on a controlled
backdrop; whole production-frame PNG identity is **not** claimed. Captured mismatch/fresh PNGs
and pixel-diagnostic.cjs are retained for review. This capture issue did not cause the final STOP:
the W x 7 counterexample changes actual font and geometry.

## Generated baseline stamp

Successful npm run parity regenerated the production stamp after restoring fc98d1e.
It is byte-identical to the already committed stamp; no hand-edit or artificial delta.
All 225 input hashes are unchanged. Chrome 155.0.8059.39; Playwright 1.62.1.

Candidate patch application is checked against the restored source. Its blank context
prefixes intentionally contain one space (unified-diff syntax); other new content passes
the whitespace check. Text logs have trailing blank-line whitespace normalized.

Stamp SHA-256: `27092cd5cba725494010282afb6719d4218da555063f71fba179a3c6691caf9c`.

| Input | Normalized SHA-256 |
|---|---|
| app.js | b4933e1f7738763670088593517e73a4f3e7b80f5d84a509868c6b2bdba9423a |
| index.html | 44cf402e3cf9ec0585e181904f21f45366d2589a085133b55f0de092303f7800 |
| styles.css | 5bbccd16bd8d06a151d66a92b7d835a1d775b95eb5cd7ac1c4d9c5f3c64b57af |

This stamp verifies the restored W6.5 reader, **not the withdrawn candidate**. It remains
committed because the generated bytes equal the existing blob. Historical parity evidence
was preserved by the wrapper; new baseline output is in baseline-parity/.

## Scratch cleanup

Every deletion was independently checked under <home>/AppData/Local/Temp, outside
<home>/Documents/WordFlow and all descendants, with an on-disk .git entry and origin
exactly <home>/Documents/WordFlow. wf-master is the clone's master worktree; its
origin and git common directory were checked before it was removed first. Native
PowerShell Remove-Item -LiteralPath handled only the verified paths. No shell cross-deletion.

| Path | Result | Reason |
|---|---|---|
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/wf-master | deleted | temporary path, outside canonical repository, verified WordFlow origin |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/wf-review | deleted | temporary path, outside canonical repository, verified WordFlow origin |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/ev | skipped | not a git clone/worktree; no .git entry |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/tmp | skipped | not a git clone/worktree; no .git entry |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/emptyhome | skipped | not a git clone/worktree; no .git entry |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/ptest | skipped | not a git clone/worktree; no .git entry |
| <home>/AppData/Local/Temp/claude/<project>/1cf8e1c2-.../ | already absent | no session directory matches the earlier report prefix |
| <home>/AppData/Local/Temp/claude/<project>/9da28215-.../ | already absent | no session directory matches the earlier report prefix |
| <home>/AppData/Local/Temp/claude/C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad/probe scripts | skipped | loose scripts are not verified clone directories |

The earlier session prefixes were searched beneath every enabled Claude project temp
directory (session depth); no matching directory exists. Earlier reports only name those
prefixes, so the report does not invent missing UUID suffixes. The session parent and
non-clone outputs were deliberately retained under the required clone-only check.
No environment file was opened, printed or copied.

## Records, scope and limits

AGENTS.md and HOSTING.md now state round 2 STOP and the restored source. Vault project
frontmatter/current F1 item, active hot-cache lines/handoff, current-state, wiki index/log
and Codex worklog carry that correction; dated history is retained. The requested Claude
18:25 entry is appended verbatim. The planned exact success wording is withheld because
it would falsely call W6.1–W6.10 implemented after the mandatory STOP. W6.11 forbids that.
The dated daily note is absent; none was created.

No proxy, Functions, server, R59, gate, vendor, fixture, _headers or CSP changes. No new
product resource, inline script/style declaration, playback state or resume field. No
package installation, public listener, merge, push, deployment or account setting change.
Other agents' reports/evidence remain untouched. input-evidence.json inventories/hashes
the 106 supplied evidence files (28 structured JSON outputs) for provenance.

Not verified: a passing W6.8 candidate; a full candidate parity/stamp; physical phones/touch,
other browsers, zoom/DPR/font inventories, Unicode/graphemes/RTL, screen readers, hidden-tab
playback, arbitrary longer context words or all word-size/token combinations. Playback and
preservation are directly tested at the phone viewport with the stated resize/mode actions,
not exhaustively at every viewport. Existing platform quota/fail-open routing, edge CPU,
Functions logging and static-request-count exclusions remain unverified. No live checks
were performed because nothing was deployed. No new CC re-review occurred.

End state: fix/f1-long-token committed locally with STOP report, rulings, candidate evidence
and cleanup; master remains b9d3d9e, reader/tests restored to fc98d1e. Next: Marcus resolves
the cap versus fully-visible-token invariant before further work. One CC re-review follows
an accepted candidate; then Marcus's merge/push decision and npm run smoke:live after deployment.
