# W7 Portal '03 restyle

## W7.12 frame measurements

| Viewport | Theme | Mode | Pre-restyle W x H (px) | Repaired W x H (px) | Width ratio | Height ratio | Minimum clearance (px) |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 390x844 | dark | Normal | 344.00 x 280.00 | 340.00 x 280.00 | 98.84% | 100.00% | 24.58 |
| 390x844 | dark | Focus | 344.00 x 573.91 | 340.00 x 573.91 | 98.84% | 100.00% | 105.14 |
| 390x600 | dark | Normal | 344.00 x 280.00 | 340.00 x 280.00 | 98.84% | 100.00% | 24.58 |
| 390x600 | dark | Focus | 344.00 x 408.00 | 340.00 x 408.00 | 98.84% | 100.00% | 58.69 |
| 768x1024 | dark | Normal | 318.00 x 368.00 | 318.00 x 368.63 | 100.00% | 100.17% | 41.50 |
| 768x1024 | dark | Focus | 686.00 x 721.00 | 686.00 x 683.61 | 100.00% | 94.81% | 129.69 |
| 1400x900 | dark | Normal | 606.00 x 577.00 | 606.00 x 565.03 | 100.00% | 97.93% | 58.36 |
| 1400x900 | dark | Focus | 1318.00 x 612.00 | 1318.00 x 612.00 | 100.00% | 100.00% | 65.05 |
| 1400x950 | dark | Normal | 606.00 x 627.00 | 606.00 x 615.03 | 100.00% | 98.09% | 72.36 |
| 1400x950 | dark | Focus | 1318.00 x 647.00 | 1318.00 x 646.00 | 100.00% | 99.85% | 74.56 |
| 1708x950 | dark | Normal | 914.00 x 627.00 | 914.00 x 615.03 | 100.00% | 98.09% | 72.36 |
| 1708x950 | dark | Focus | 1626.00 x 647.00 | 1626.00 x 646.00 | 100.00% | 99.85% | 72.39 |
| 1920x1080 | dark | Normal | 1126.00 x 757.00 | 1126.00 x 745.03 | 100.00% | 98.42% | 108.77 |
| 1920x1080 | dark | Focus | 1838.00 x 777.00 | 1838.00 x 745.03 | 100.00% | 95.89% | 100.13 |
| 390x844 | light | Normal | 344.00 x 280.00 | 340.00 x 280.00 | 98.84% | 100.00% | 24.58 |
| 390x844 | light | Focus | 344.00 x 573.91 | 340.00 x 573.91 | 98.84% | 100.00% | 105.14 |
| 390x600 | light | Normal | 344.00 x 280.00 | 340.00 x 280.00 | 98.84% | 100.00% | 24.58 |
| 390x600 | light | Focus | 344.00 x 408.00 | 340.00 x 408.00 | 98.84% | 100.00% | 58.69 |
| 768x1024 | light | Normal | 318.00 x 368.00 | 318.00 x 368.63 | 100.00% | 100.17% | 41.50 |
| 768x1024 | light | Focus | 686.00 x 721.00 | 686.00 x 681.61 | 100.00% | 94.54% | 129.13 |
| 1400x900 | light | Normal | 606.00 x 577.00 | 606.00 x 563.03 | 100.00% | 97.58% | 57.80 |
| 1400x900 | light | Focus | 1318.00 x 612.00 | 1318.00 x 612.00 | 100.00% | 100.00% | 65.05 |
| 1400x950 | light | Normal | 606.00 x 627.00 | 606.00 x 613.03 | 100.00% | 97.77% | 71.80 |
| 1400x950 | light | Focus | 1318.00 x 647.00 | 1318.00 x 646.00 | 100.00% | 99.85% | 74.56 |
| 1708x950 | light | Normal | 914.00 x 627.00 | 914.00 x 613.03 | 100.00% | 97.77% | 71.80 |
| 1708x950 | light | Focus | 1626.00 x 647.00 | 1626.00 x 646.00 | 100.00% | 99.85% | 72.39 |
| 1920x1080 | light | Normal | 1126.00 x 757.00 | 1126.00 x 743.03 | 100.00% | 98.15% | 108.20 |
| 1920x1080 | light | Focus | 1838.00 x 777.00 | 1838.00 x 743.03 | 100.00% | 95.63% | 99.56 |

Each row gives the smallest of six top/bottom clearances for Large, Comfort and Compact with the same controlled word, `Hello`, between `Lead` and `Tail`. All 168 clearances passed 8 px. The minimum was 24.58 px. The 1400x950 normal row met both 95% bounds in both themes. Every remaining ratio was at least 90%. [Raw before/after checks](results/w7-restyle/geometry-w712/after.json).

## Builder handoff for independent CC review

**Verified on local branch `feat/w7-portal03-restyle`.** The final product revision is `cc00891f10a45bb15cd2621358d3f7c051918b0a`. The test re-baseline is `e639930`, followed by `c5da31832145e7e0fc238052fdebc0347cd53510`, which applies the same full-containment assertion to both wide-probe loops. The final evidence commit contains this report and the generated stamp. Resolve that commit's exact SHA with `git log -1 --format=%H -- docs/verification/2026-11-07_codex_w7_portal03_restyle.md`. The [local branch head SHA](../../.git/refs/heads/feat/w7-portal03-restyle) is also recorded in the Codex worklog handoff and the builder's delivery.

The product changes are the Portal '03 graphite/Mint shell, steel plate and favicon, page-only theme control, and reader-panel Fullscreen API integration. It retains the source/review workflow, transport, slider, storage schema and privacy paragraph. Implementation choices include using the existing transport in both modes, reserving space for the fading fullscreen bars, retaining the native progress slider, and placing fullscreen position/time on a second line at phone widths. The W7.12 frame matrix and all 80 pre-restyle floor comparisons are part of this report. The later W7.12 ruling supersedes the original 1100 px shell cap.

| Verification | Final result |
| --- | --- |
| Node | **514 passed, zero skips**. The four suites passed 223, 169, 32 and 90 checks respectively. [Output](results/w7-restyle/verification/node.txt). |
| Browser extraction | **9 DOCX, 7 PDF, zero skips**. DOCX had zero mismatches; the two expected PDF differences matched their goldens. [Extraction](results/w7-restyle/verification/parity/browser-parity.json). |
| Chrome smoke | **924 passed**, zero app errors, unexpected external origins or upload requests. Chrome 156.0.8078.81 and Playwright 1.62.1. [Full check inventory](results/w7-restyle/verification/parity/static-smoke.json). |
| Finished | 288 direct and 288 natural completions, 108 restoration actions. [Matrix summary](results/w7-restyle/verification/finished-summary.json). |
| W6.12 | All 36 cap probes and all 324 grid probes passed; 36 grid cases above the floor met the strict target. 76 unwrapped floor misses under the former rule matched the exact 10 px width. Only four wrapped ranges used the 1/64 CSS px allowance. [Wide summary](results/w7-restyle/verification/wide-summary.json), [all 80 cross-checks](#cross-check-of-the-80-floor-cases). |
| Build and mutations | Both fresh builds contain the same **199 filenames**; only four frontend contents differ. **78 mutations: 77 killed, equivalent M9**, zero unexpected or erroneous outcomes. [Build hashes](results/w7-restyle/verification/build.json), [mutation run](results/w7-restyle/mutations.json), [verdict comparison](results/w7-restyle/verification/mutation-comparison.json). |
| Stamp and source | All 225 stamped inputs were verified against committed Git blobs. The generated stamp changes only app.js, index.html and styles.css relative to the Chrome-156 qualified baseline. All 65 original ids, privacy text, and 12 fitting/playback/storage function bodies were verified. [Input comparison](results/w7-restyle/verification/stamp.json), [source integrity](results/w7-restyle/verification/integrity.json). |
| Visual QA | 24 screenshots in both themes at 1400x900 and 390x844. The black reader, steel plate, LCDs, panels, dock, ticker, badges and footer are visible at desktop size. Phone headings can ellipsize and Focus mode requires scrolling to the transport. Phone fullscreen gives position/time their own line even with a long source title. [Screenshot list](#w712-verification-and-finished-state-stop), [readout bounds](results/w7-restyle/verification/fullscreen-readout.json). |

### Final assertion and suite comparison

Line numbers are for the qualified baseline at `a9eb63e` and final tests at `c5da318`. Behavior, data, security and extraction assertions retain their original meanings. The W7.11 reference-set assertion is the separately ruled exception. The evidence label `master` in historical test output continues to denote the pinned PRE_F1 frontend.

| Suite | Baseline lines | Final lines | Visual assertion and replacement |
| --- | --- | --- | --- |
| reader-smoke.cjs | 106 | 158-160 | Master font, classes, rectangles and pixel-related presentation became candidate bounds and geometry checks. Text, token markup and dataSame comparisons remain. |
| reader-round2.cjs | 133, 134, 142 | 114-118 | Styled DOM, font, rectangles and screenshot equality became token markup, independent scroll-threshold and layout checks. |
| reader-wide.cjs | 45-46, 51 | 64-65 | Baseline style, ink rectangles and pixels became token markup and candidate bounds. The historical clipping classification remains. |
| reader-wide.cjs | 53, 69 | 22-41, 67, 80 | Both 90% guards use the candidate's measured base width and fitted state. They enforce strict 90% above the floor, exact floor-width preservation for unwrapped tokens, and at most 1/64 px range overhang relative to the wrapped box. Full containment is checked for every probe. |
| reader-finished.cjs | 85-86, 98 | 84, 96-98 | The restart snapshot previously compared computed font and rectangle. Restart state and word/control DOM still compare to PRE_F1; the settled candidate is checked for containment. |
| reader-finished.cjs | 125-127 | 121-124 | Baseline frame/panel rectangles, font and styled DOM became token markup, panel visibility, reading-to-finished frame size and candidate paint bounds. |
| reader-finished.cjs | 148-149, 154 | 121-126 | Repeat-capture and pixel equality became candidate geometry, inertness, panel order and interaction checks. |

| Browser suite | Before | After |
| --- | ---: | ---: |
| General smoke and predicate checks | 60 | 60 |
| Reader smoke | 24 | 24 |
| Round 2 | 116 | 116 |
| Wide | 72 | 72 |
| Finished | 612 | 612 |
| Portal theme/fullscreen | 0 | 40 |
| **Total** | **884** | **924** |

Large raw matrix traces are stored as gzip-compressed JSON. Each archive was decompressed and checked byte-for-byte against the original output. [Trace manifest and SHA-256 values](results/w7-restyle/verification/compressed-evidence.json). The original 884 check names match across both runs. The Portal suite contributes ten groups per viewport/theme combination; checks use system emulation, real entry/exit, unsupported and refused fallbacks, WPM clamps, keyboard modifiers, idle visibility, full containment, contrast and overflow. The final minimum measured contrast was 5.39:1 in Graphite and 6.13:1 in Mint. Nine additional Node checks cover the F shortcut, theme choice and storage. [Counts](results/w7-restyle/verification/counts.json). PRE_F1 remains the comparison commit and the historical fc98d1e and 8ae3d54 refs remain pinned.

The changed served files are app.js, index.html, styles.css and assets/wordflow-mark.svg. Tests and runner changes are confined to the four reader comparison suites, the new tests/reader-portal.cjs, tests/post-review.test.cjs, tools/static_smoke.cjs and the W7.11 line in tests/server_exposure.test.js. docs/DECISIONS.md records Marcus's rulings and AGENTS.md records the handoff. The independent reviewer should reproduce the checks in a fresh local clone of this branch. Other browsers, real iPhone/iPad fullscreen, physical touch, zoom and screen readers remain unverified. Marcus decides any later merge or gated push. No merge, push, deploy, package installation or live smoke occurred.

## Initial frames before the W7.12 repair


Initial measurements at product commit `5a1939f`, before the CSS repair. Each row uses the same loaded `Lead Hello Tail End.` fixture and the same viewport on both revisions. Sizes are outer frame rectangles in CSS pixels. The pre-restyle revision is `2a376445ceb1b98a1b4c943cf8834e77e0578120`. [Raw measurements](results/w7-restyle/geometry-w712/before.json).

| Viewport | Theme | Mode | Pre-restyle W x H (px) | Before repair W x H (px) | Width ratio | Height ratio |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 390x844 | dark | Normal | 344.00 x 280.00 | 340.00 x 260.00 | 98.84% | 92.86% |
| 390x844 | dark | Focus | 344.00 x 573.91 | 340.00 x 573.91 | 98.84% | 100.00% |
| 390x600 | dark | Normal | 344.00 x 280.00 | 340.00 x 260.00 | 98.84% | 92.86% |
| 390x600 | dark | Focus | 344.00 x 408.00 | 340.00 x 408.00 | 98.84% | 100.00% |
| 768x1024 | dark | Normal | 318.00 x 368.00 | 334.00 x 280.00 | 105.03% | 76.09% |
| 768x1024 | dark | Focus | 686.00 x 721.00 | 696.00 x 680.00 | 101.46% | 94.31% |
| 1400x900 | dark | Normal | 606.00 x 577.00 | 485.13 x 339.56 | 80.05% | 58.85% |
| 1400x900 | dark | Focus | 1318.00 x 612.00 | 1052.00 x 612.00 | 79.82% | 100.00% |
| 1400x950 | dark | Normal | 606.00 x 627.00 | 485.13 x 339.56 | 80.05% | 54.16% |
| 1400x950 | dark | Focus | 1318.00 x 647.00 | 1052.00 x 646.00 | 79.82% | 99.85% |
| 1708x950 | dark | Normal | 914.00 x 627.00 | 485.13 x 339.56 | 53.08% | 54.16% |
| 1708x950 | dark | Focus | 1626.00 x 647.00 | 1052.00 x 646.00 | 64.70% | 99.85% |
| 1920x1080 | dark | Normal | 1126.00 x 757.00 | 485.13 x 339.56 | 43.08% | 44.86% |
| 1920x1080 | dark | Focus | 1838.00 x 777.00 | 1052.00 x 723.61 | 57.24% | 93.13% |
| 390x844 | light | Normal | 344.00 x 280.00 | 340.00 x 260.00 | 98.84% | 92.86% |
| 390x844 | light | Focus | 344.00 x 573.91 | 340.00 x 573.91 | 98.84% | 100.00% |
| 390x600 | light | Normal | 344.00 x 280.00 | 340.00 x 260.00 | 98.84% | 92.86% |
| 390x600 | light | Focus | 344.00 x 408.00 | 340.00 x 408.00 | 98.84% | 100.00% |
| 768x1024 | light | Normal | 318.00 x 368.00 | 334.00 x 280.00 | 105.03% | 76.09% |
| 768x1024 | light | Focus | 686.00 x 721.00 | 696.00 x 680.00 | 101.46% | 94.31% |
| 1400x900 | light | Normal | 606.00 x 577.00 | 485.13 x 337.56 | 80.05% | 58.50% |
| 1400x900 | light | Focus | 1318.00 x 612.00 | 1052.00 x 612.00 | 79.82% | 100.00% |
| 1400x950 | light | Normal | 606.00 x 627.00 | 485.13 x 337.56 | 80.05% | 53.84% |
| 1400x950 | light | Focus | 1318.00 x 647.00 | 1052.00 x 646.00 | 79.82% | 99.85% |
| 1708x950 | light | Normal | 914.00 x 627.00 | 485.13 x 337.56 | 53.08% | 53.84% |
| 1708x950 | light | Focus | 1626.00 x 647.00 | 1052.00 x 646.00 | 64.70% | 99.85% |
| 1920x1080 | light | Normal | 1126.00 x 757.00 | 485.13 x 337.56 | 43.08% | 44.59% |
| 1920x1080 | light | Focus | 1838.00 x 777.00 | 1052.00 x 721.61 | 57.24% | 92.87% |

**The approved floor-aware gate passed all 36 cap probes and all 324 wide/floor probes.** The same 80 floor-limited cases reached exactly 10 px on both revisions and remained contained. [All 80 cases](#cross-check-of-the-80-floor-cases) and [wide-suite totals](results/w7-restyle/verification/wide-summary.json). The following checkpoints record the earlier build history.

## Original baseline STOP

On 2026-11-07 the W7 starting gate failed in the existing wide-reader smoke suite. Implementation stopped before the ruling commit. The local branch `feat/w7-portal03-restyle` points to **2a376445ceb1b98a1b4c943cf8834e77e0578120**. These uncommitted records document the stop.

## Starting state

The working tree was clean on `master`, the hook path was `.githooks`, and local master was two commits ahead of `origin/master` at `188d65e877c9cf63096bcc1e8abc2b523f16f07d`. The intervening commits contain records of the F1 deployment and pause. The requested diff of index.html, styles.css, app.js and assets/wordflow-mark.svg was empty. The W7 branch was created from the requested local master.

| Untouched check | Result |
| --- | --- |
| Node 24.16.0, npm 11.13.0 | 223 static + 169 proxy + 32 exposure + 81 post-review = 505 passed, zero skipped. The first sandbox invocation could not connect to loopback. The same command completed with loopback access. |
| Browser extraction | 9 DOCX with zero mismatches. All 7 PDFs compared, with the 2 expected differences. Zero skipped. |
| Chrome smoke | Exited 1 in the 1708 x 950 wide-reader probe for eight W characters, focus mode off. The assertion saw actual true, expected false. No full smoke count is available for this run. |
| Stamp | The failed run did not generate a stamp. The file's SHA-256 before and after was `3ca46f922440c6f6a131252b61f0005b58941e7b9e863679861384ed91ddebdf`. The committed-input verifier passed. |
| Runtime identity | Chrome reported `156.0.8078.81`; the committed stamp records `155.0.8059.39`. Playwright matched at `1.62.1`. Even a successful run with this Chrome would produce different stamp bytes. |

## Why the comparison failed

The test loads the frontend from the moving Git ref `master` and compares word visibility with saved round-2 measurements. At 1708 x 950 the reference frame was 912 px wide. Before F1, eight W characters occupied 1029 px and clipped. The accepted F1 fix fitted them to 820 px. Today's master includes that fix, so the probe observed the word fully inside the frame. Pinning this comparison to today's master SHA alone would reproduce the same mismatch. [Failing assertion](../../tests/reader-wide.cjs#L41) and [recorded before/after measurements](2026-10-07_codex_f1_round3.md).

## Evidence and disposition

The [baseline output](results/w7-restyle/baseline/console.txt) records suite totals and the first failing assertion. The [extraction results](results/w7-restyle/baseline/browser-parity.json), [reader measurements](results/w7-restyle/baseline/reader-1400.json), [round-2 matrix](results/w7-restyle/baseline/reader-round2.json.gz) and intermediate Chrome screenshots are in the same directory. The screenshots show the pre-W7 UI. The two tracked historical evidence files regenerated by parity were restored after their new output was preserved.

There were no implementation choices, changes to assertions, new W7 checks, commits, merges, pushes or deployments. The ruling and AGENTS.md were not edited. Mutation totals and the dist file set were not reverified. W7 appearance, fullscreen, fallback, accessibility, other browsers, real iPhone/iPad fullscreen, physical touch, zoom and screen readers were not tested.

Marcus's baseline decision comes before implementation or independent CC review. The two decisions are which historical ref to use for the pre-F1 visibility observation, and whether this Chrome version may generate a fresh baseline stamp. All behaviour, data and security checks remain in force.

The Codex worklog, WordFlow project handoff, hot-cache, current-state and wiki log record this stop. The dated daily note was absent.

## Amended baseline

Marcus accepted Chrome 156.0.8078.81 and the historical F1 comparison ref on 2026-11-07. The ruling-only commit `0a5e500` contains W7.1 through W7.10. The four reader suites now share one `PRE_F1` constant defined in reader-smoke.cjs, with seven Git ref uses replaced. No assertion, threshold, fixture, or other pinned ref changed in this step. **Implementation choice:** keep the historical evidence label `master`, which already identifies b9d3d9e. The repair leaves all 225 frontend, extractor, fixture and vendor hashes identical. The Node baseline passed 223 + 169 + 32 + 81 = 505 checks, zero skipped. Browser extraction again passed nine DOCX and seven PDF fixtures.

Commit `a9eb63e82e95099e51952012cd4a8f6814edaf70` records the pin and generated stamp. Chrome parity passed all 884 smoke checks, zero skipped, zero app errors and zero uploads. The finished matrix completed 288 direct and 288 natural cases with 108 restoration actions. The full generated stamp diff follows. A structured comparison also verified that every other field, filename and input hash matched. [Extraction](results/w7-restyle/qualified/browser-parity.json) and [smoke results](results/w7-restyle/qualified/static-smoke.json).

```diff
-  "chrome": "155.0.8059.39",
+  "chrome": "156.0.8078.81",
```

## Implementation

The implementation-only commit `5a1939f` changes four files. Code inspection confirmed 65 existing ids preserved, 74 unique ids in total, and byte-identical privacy paragraph markup. The committed JS passes its syntax check. The product files have CRLF endings, and the ruling and test files have LF endings.

| File | Candidate change |
| --- | --- |
| index.html | Steel plate, status and readouts, theme and fullscreen controls, ticker, reader head, footer badges and original privacy paragraph. The existing progress and transport controls are inside one bottom bar. |
| styles.css | Supplied graphite, Mint and lime tokens, CSS system theme, black scanlined screen, glossy controls, responsive shell, fullscreen layout and idle-bar visibility. |
| app.js | Page-only theme choice, fullscreen entry/exit/events and focus fallback, readouts, idle timeout, WPM controls and guarded F shortcut. Uses the existing word-fitting path on fullscreen changes. |
| assets/wordflow-mark.svg | Standalone steel tile, screw dots, brushed surface, path-based W and lime LED. |

**Implementation choices.** The shell uses the requested 1100 px cap. The three grid columns use fractional widths inside it. The existing numeric position and remaining-time values feed the fullscreen head. The new head and existing control group stay in the panel. CSS hides inactive fullscreen controls and reserves space when the bars fade. Selecting Source from a fullscreen finished screen requests browser exit. The progress slider retains its native track with lime accent. The URL placeholder uses a bare example domain to satisfy the CSP hygiene brief. The steel tile brush uses a local SVG pattern. All palette values come from Marcus's supplied screenshots. The original orchestrator canvas was unavailable.

## Candidate STOP

On the first candidate `npm test`, static regression passed 223/223, proxy passed 169/169 and exposure passed 31/32. The post-review suite did not run. Total observed: 423 passes and one failure. At [server_exposure.test.js line 275](../../tests/server_exposure.test.js#L275) the test requires at least four local `src` or `href` occurrences. The pre-W7 header had a second reference to the favicon asset. Removing the header image per W7 leaves the same three distinct assets and exactly three occurrences. The assertion fails before checking each reference in that test. The separate byte-for-byte serving check passed. [Candidate output](results/w7-restyle/candidate-stop/console.txt).

The test and all R59 protections are unchanged. The implementation is preserved in its commit. The five attempted test edits were saved as [an evidence diff](results/w7-restyle/candidate-stop/attempted-tests.diff), then restored exactly to commit `a9eb63e`. The only committed test changes are the approved comparison pin and its generated baseline stamp.

### Attempted visual assertions

These line numbers refer to the qualified baseline and the preserved, unexecuted draft. No visual assertion replacement remains active. The proposed changes retained data and restart comparisons to PRE_F1.

| Suite | Qualified line(s) | Draft line(s) | Visual component and proposed replacement |
| --- | --- | --- | --- |
| reader-smoke.cjs | 106 | 158-160 | Font, rectangles and layout classes. Check candidate bounds, floor, region state and collision, retaining text and markup comparison. |
| reader-round2.cjs | 133, 134, 142 | 114-118 | Styled DOM, rectangles/fonts and pixel equality. Compare token markup and test extent, floor and scrolling against the candidate's own geometry. |
| reader-wide.cjs | 45-46, 51 | 35-37 | Styled DOM/ink rectangles and pixels of formerly visible words. Check token markup and bounds; preserve historical classification, floor checks and clipped-word width target. |
| reader-finished.cjs | 85-86, 98 | 84, 96-98 | Restart equality included computed font and rectangle. Compare restart state and check the candidate's fitted word after layout. |
| reader-finished.cjs | 125, 126-127 | 121-124 | Frame/panel bounds and master word presentation. Check panel visibility and token markup, reading-to-finished frame size and paint bounds. |
| reader-finished.cjs | 148-149, 154 | 121-126 | Recapture and pixel equality. Check candidate geometry, panel order and inertness; keep the existing pointer/scroll checks. |

| Browser suite | Qualified baseline checks | Candidate checks completed |
| --- | ---: | --- |
| General smoke and predicate checks | 60 | Not run |
| Reader smoke | 24 | Not run |
| Round 2 | 116 | Not run |
| Wide | 72 | Not run |
| Finished | 612 | Not run |

The restored Node test draft added nine shortcut, theme and storage checks. None ran. The candidate has no generated parity stamp. The existing stamp authenticates the untouched frontend at `a9eb63e`.

## Earlier exposure STOP handoff

Candidate parity, mutation verdicts, build, four-file dist content comparison, theme contrast, overflow, keyboard accessibility, long-word fitting and real or fallback fullscreen were not verified. No candidate screenshots were taken or inspected. The screenshot folders under the qualified baseline show the old reader. The qualified dist inventory had 199 files. The previous 78 mutation verdicts are historical. Other browsers, physical touch, real iPhone/iPad fullscreen, zoom and screen readers remain untested.

Marcus needs to reconcile removing the header image with the exposure test before the build can continue. One proposed ruling is to check for the three named script, stylesheet and favicon references, keeping the per-file checks and byte-for-byte serving checks. No change to the exposure test has been made. Independent CC review and Marcus's merge/push decision follow a qualified candidate. No merge, push, deployment, package install, or live smoke occurred. The dated daily note was absent.

## W7.11 and current verification

Marcus supplied W7.11 on 2026-11-07. Commit `1853463e139c65608fd330063ce8c90adcf5d709` records the ruling verbatim. Commit `2737bd3a6ed9891941e21d500955315d9cb3ee0d` changes only line 275 of tests/server_exposure.test.js. It compares the actual and expected sets with an order-independent assertion and lists the distinct references on failure.

I ran the actual `frontEndFiles()` and `frontEndReferences()` function bodies from each revision against its committed index.html. Both versions of `frontEndFiles()` return exactly **app.js, assets/wordflow-mark.svg, index.html, styles.css**. Reference occurrences go from four to three because the duplicate image was removed. Byte comparison of the exposure test with `2a37644` found just the authorized line difference, including the helpers and the existing file and serving checks. [Coverage evidence](results/w7-restyle/exposure-coverage.json).

| Current run | Result |
| --- | --- |
| Node with the nine new checks in the draft | 223 static + 169 proxy + 32 exposure + 90 post-review = **514 passed, zero skips**. [Node evidence](results/w7-restyle/candidate-node.txt) |
| Browser extraction | 9 DOCX, zero mismatches. 7 PDFs, both expected differences. Zero skipped. [Extraction evidence](results/w7-restyle/context-stop/browser-parity.json) |
| W7 browser checks at 1400x900 | Ten check groups passed in each theme. Real native panel fullscreen worked in headless Chrome 156. Exit via F, the button and the browser API worked. Idle controls hid during playback and reappeared on key input. Both unsupported and rejected entry took the Focus fallback. Theme changes retained the original 13-field resume record. CSP, accessible heading and icon labels passed. [Graphite](results/w7-restyle/context-stop/portal-1400-dark.json) and [Mint](results/w7-restyle/context-stop/portal-1400-light.json) |
| Layout and contrast | Document scroll width equalled viewport width at 390, 768, 1400 and 1920 in both themes. Minimum tested contrast was 5.39:1 for Graphite muted text and 6.13:1 for the Mint legend. The real 45-character word fitted at 55 px in fullscreen. W2000 wrapped at 10 px and fit vertically without a scroll pause. |
| Full candidate parity | Exited 1 on the first reader-smoke control. The run did not produce a candidate stamp. The branch's stamp is the repaired baseline stamp. |
| Mutations and build | Not run on the candidate after the F1 STOP. The qualified pre-restyle build inventory is 199 files. |

### F1 collision

The smoke's Large-size `Hello` control failed the proposed word/context separation check. The failing call uses the existing `noCollisions` rectangle predicate. I reproduced it in a fresh browser against the candidate, pre-restyle `2a37644`, and pre-F1 `b9d3d9e`, with the same 1400x950 viewport and token sequence. Positive values below are clearance. Negative values are overlap. [Geometry evidence](results/w7-restyle/context-stop/geometry.json).

| Revision and word | Frame in CSS px | Font size | Upper box clearance | Lower box clearance |
| --- | --- | ---: | ---: | ---: |
| Candidate, Hello | 485.125 x 337.563 | 128 | -5.328 | -5.313 |
| Both baselines, Hello | 606 x 627 | 128 | +76.828 | +76.844 |
| Candidate, 45-character word | 485.125 x 337.563 | 19 | +53.531 | +53.547 |

The candidate's DOM text ranges also intersect by 14.281 px above and 10.078 px below for Hello. The painted letters have visible space in the screenshot. The measured word/context box violation remains. [Candidate frame](results/w7-restyle/context-stop/candidate-hello.png) and [pre-restyle frame](results/w7-restyle/context-stop/pre-restyle-hello.png).

### Screenshot inspection

All twelve desktop screenshots were inspected. The normal views show the steel plate, both LCDs, six transport buttons, side panels and privacy footer. Focus enlarges the reader; the viewport ends partway through the transport dock. The Source heading's decorative square wraps above the heading with Resume and Sample visible. The review pane shows the cleanup controls and preview. The finished panel covers the center of the reader as intended. Fullscreen playback shots show the bars hidden and the context words visible.

| Desktop state | Graphite | Mint |
| --- | --- | --- |
| Normal | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-normal.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-normal.png) |
| Focus | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-focus.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-focus.png) |
| Fullscreen paused | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-fullscreen-paused.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-fullscreen-paused.png) |
| Fullscreen playing | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-fullscreen-playing.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-fullscreen-playing.png) |
| Finished | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-finished.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-finished.png) |
| Review | [Screenshot](results/w7-restyle/context-stop/screens/1400-dark-review.png) | [Screenshot](results/w7-restyle/context-stop/screens/1400-light-review.png) |

### Handoff

The working test files, including the smoke runner, were restored to the W7.11 commit. The exact [tracked test draft](results/w7-restyle/context-stop/attempted-tests.diff) and [new Portal test module](results/w7-restyle/context-stop/reader-portal.cjs) are preserved. To reproduce this STOP, apply that patch to the W7.11 tree, place the module at tests/reader-portal.cjs and run npm test and npm run parity. The earlier visual assertion table describes this same re-baseline.

The current build needs a decision on a CSS repair for the normal reader's Large word/context clearance. Keep the geometry assertion for verification. The remainder of candidate parity, the 390x844 interaction/screenshot suite, candidate mutations, dist comparison, other browsers, real iPhone/iPad fullscreen, physical touch, zoom and screen readers remain unverified. Independent CC review has not begun. No merge, push, deployment, package install or live smoke occurred.

## W7.12 verification and Finished-state STOP

The full W7.12 decision was recorded verbatim in `12dc3021393799286c5cdf96742ec0c620b4a9ad`. The CSS-only repair is `17b16bcae3807af8bd802437457748df111c09e4`. **Implementation choices:** the shell uses the viewport height with four grid rows, the workspace receives the flexible row, and the desktop columns use the pre-restyle side-panel widths. Reduced bar and panel spacing leaves the ticker and privacy text in place. The tablet normal frame reserves 36vh, with a 280 px minimum. Phone normal frames have a 280 px minimum. No HTML structure, JS fitting path, word-size declaration, or assertion was changed by the repair.

At 1400x950 in normal mode the repaired frame measures **606 x 615.03 px** in Graphite and **606 x 613.03 px** in Mint, compared with **606 x 627 px** at 2a37644. The lowest width or height ratio across all cases was 94.54% (Mint, 768x1024, Focus, frame height). Hello's minimum context clearance was 24.58 px. The 45-character control's minimum clearance across the same 168 measurements was 52.13 px. [45-character measurements](results/w7-restyle/geometry-w712/real45.json) and [reproduction script](results/w7-restyle/geometry-w712/measure.cjs).

| Current verification | Result |
| --- | --- |
| Phone at 390x844 | All 20 W7 check groups passed, ten per theme. Native panel fullscreen worked. The real word fitted at 14 px, W2000 wrapped at 10 px, paused for scrolling, and advanced one index with a single Play. [Checks](results/w7-restyle/geometry-w712/phone/checks.json), [Graphite](results/w7-restyle/geometry-w712/phone/portal-390-dark.json), [Mint](results/w7-restyle/geometry-w712/phone/portal-390-light.json). |
| Node | 223 static + 169 proxy + 32 exposure + 90 post-review = **514 passed, zero skips**. [Output](results/w7-restyle/geometry-w712/node.txt). |
| Browser extraction | All 9 DOCX and 7 PDF fixtures passed, including the two documented PDF differences. Zero skipped. [Evidence](results/w7-restyle/geometry-w712/parity/browser-parity.json). |
| Desktop browser | Both 1400x900 W7 theme groups passed, including native fullscreen. The F1 short/real control that previously stopped the run passed. The smoke reached the original W6.9 final-token comparison. [Graphite](results/w7-restyle/geometry-w712/parity/portal-1400-dark.json), [Mint](results/w7-restyle/geometry-w712/parity/portal-1400-light.json). |
| Full parity / stamp | Exited 1 at W6.9. No candidate stamp was generated. The existing stamp still belongs to `a9eb63e`. |
| Mutations and build | Candidate mutations and build were not run after the mandatory STOP. The prior 78 verdicts and the pre-restyle 199-file inventory are historical. |

The unchanged [W6.9 assertion](../../tests/reader-round2.cjs#L186) compares the full Finished snapshot to PRE_F1. A separate reproduction at 390x844 confirmed that the **only** different key is `controls`. The values for finished, index, playing, countdown, status and the complete summary HTML are equal. In the Play button's outerHTML, the newline preceding the SVG has 16 spaces instead of 14. The newline before the closing button tag has 14 instead of 12. The SVG, path, attributes, and element order are identical. The difference came from indenting existing rows under the W7 reader-controls wrapper. [Exact snapshots and child nodes](results/w7-restyle/geometry-w712/finish-comparison.json) and [reproduction script](results/w7-restyle/geometry-w712/diagnose-finish.cjs).

All 24 repaired-candidate screenshots were captured and inspected. At 390 px the ticker wraps to two lines and all six buttons fit on the normal transport row. Focus mode extends the transport below the first screen. In phone fullscreen the sample title truncates the inline word-position/time text; the bottom position slider and percent remain visible. At 1400 px the restored reader fills the center, the Source square sits beside its heading, and all three panels and the footer are visible in the normal view. Both themes keep the screen black. The earlier 12 desktop screenshots are archived under context-stop/screens/.

| State | Phone Graphite | Phone Mint | Desktop Graphite | Desktop Mint |
| --- | --- | --- | --- | --- |
| Normal | [390](results/w7-restyle/screens/390-dark-normal.png) | [390](results/w7-restyle/screens/390-light-normal.png) | [1400](results/w7-restyle/screens/1400-dark-normal.png) | [1400](results/w7-restyle/screens/1400-light-normal.png) |
| Focus | [390](results/w7-restyle/screens/390-dark-focus.png) | [390](results/w7-restyle/screens/390-light-focus.png) | [1400](results/w7-restyle/screens/1400-dark-focus.png) | [1400](results/w7-restyle/screens/1400-light-focus.png) |
| Fullscreen paused | [390](results/w7-restyle/screens/390-dark-fullscreen-paused.png) | [390](results/w7-restyle/screens/390-light-fullscreen-paused.png) | [1400](results/w7-restyle/screens/1400-dark-fullscreen-paused.png) | [1400](results/w7-restyle/screens/1400-light-fullscreen-paused.png) |
| Fullscreen playing | [390](results/w7-restyle/screens/390-dark-fullscreen-playing.png) | [390](results/w7-restyle/screens/390-light-fullscreen-playing.png) | [1400](results/w7-restyle/screens/1400-dark-fullscreen-playing.png) | [1400](results/w7-restyle/screens/1400-light-fullscreen-playing.png) |
| Finished | [390](results/w7-restyle/screens/390-dark-finished.png) | [390](results/w7-restyle/screens/390-light-finished.png) | [1400](results/w7-restyle/screens/1400-dark-finished.png) | [1400](results/w7-restyle/screens/1400-light-finished.png) |
| Review | [390](results/w7-restyle/screens/390-dark-review.png) | [390](results/w7-restyle/screens/390-light-review.png) | [1400](results/w7-restyle/screens/1400-dark-review.png) | [1400](results/w7-restyle/screens/1400-light-review.png) |

The exact verification drafts matched the preserved context-stop files before restoration. Tracked tests and the smoke runner have been restored to the committed versions. The repaired candidate is preserved. A narrowly scoped next change would restore those two whitespace text nodes in index.html and verify the original comparison. W7.12 limits HTML changes to moving the ticker or footer, so that change requires Marcus's decision. Other browsers, real iPhone/iPad fullscreen, physical touch, zoom and screen readers remain unverified. No dependency installation, merge, push, live test or deploy occurred.

On 2026-11-08 Codex prepared the [two-line patch](results/w7-restyle/geometry-w712/proposed-play-whitespace.diff). `git apply --check` succeeded at `17b16bc`. Marcus subsequently approved the exact patch and requested resumed verification.

## Approved whitespace repair and wide-frame comparison

Commit `a242904ec0e9e3e0a4b86c2398c6b9d7cdb360fa` removes the two approved pairs of indentation spaces from index.html. The independent reproduction found zero differing snapshot fields and byte-identical Play child nodes. The full run also passed the unchanged W6.9 assertion. [Compared values](results/w7-restyle/verification/finish-comparison.json).

Commit `cc00891f10a45bb15cd2621358d3f7c051918b0a` addresses the clipped word-position/time readout observed in the earlier screenshots. **Implementation choice:** in fullscreen, long titles can ellipsize while the readout retains its width. At phone widths it occupies the next line. An initial ad hoc probe read the layout before the app received fullscreenchange. After waiting for that event and settled layout, Chrome showed the entire readout with a long title at both sizes and in both themes. [Readout bounds](results/w7-restyle/verification/fullscreen-readout.json). The full 28-row W7.12 geometry table, including all per-size clearances, reproduced exactly. [Final measurements](results/w7-restyle/verification/frames.json).

| Candidate verification | Result |
| --- | --- |
| Node | 223 static + 169 proxy + 32 exposure + 90 post-review = **514 passed**, zero skips. [Output](results/w7-restyle/verification/node.txt). |
| Phone | 20/20 W7 groups passed. Native fullscreen, modes, storage, controls, contrast, overflow and F1 checks passed in both themes. [Checks](results/w7-restyle/verification/phone-checks.json). |
| Browser parity | Extraction passed all 9 DOCX and 7 PDF fixtures, including the two pinned differences. The smoke completed both desktop Portal groups and round 2, including W6.9, before failing the wide-frame comparison. No candidate stamp was generated. [Failed assertion](results/w7-restyle/verification/parity-output.txt). |
| Mutations | **78 total, 77 killed, M9 equivalent**. No errors or unexpected verdicts. All definition fields, verdicts and original/mutated/restored hashes matched the accepted run. [Raw run](results/w7-restyle/mutations.json) and [comparison](results/w7-restyle/verification/mutation-comparison.json). |
| Build | A fresh build of `2a37644` in a temporary local clone and the candidate build both produced **199 files with identical names**. Only app.js, assets/wordflow-mark.svg, index.html and styles.css differed in content. The earlier ignored dist inventory had a stale file-extractors.mjs hash. Both fresh builds contain the exact committed extractor bytes. [Manifests and hashes](results/w7-restyle/verification/build.json). |
| Screenshots | All 24 current screenshots were inspected. The phone fullscreen paused view now shows the position and time beneath the title. Focus-mode transport can require scrolling on phone. [Phone fullscreen](results/w7-restyle/screens/390-light-fullscreen-paused.png) and [desktop fullscreen](results/w7-restyle/screens/1400-dark-fullscreen-paused.png). |

### The wide-frame assertion

The failure occurs on the ninth W at 1920x1080 normal. The test requires the rendered width to be at most 90% of the candidate frame because PRE_F1 clipped this token. Independent measurements of the candidate at its original font size show that neither its display box nor its rendered text needs fitting. A second case has the same mismatch in Focus mode. All 36 controls were visible. All 13 candidate controls that actually fitted met the 90% target. [All probe measurements](results/w7-restyle/verification/cap-probes.json) and [candidate crop](results/w7-restyle/verification/candidate-W9.png).

| Case | PRE_F1 base text / frame (px) | Candidate unfitted (px) | Rendered (px) | Inner frame (px) | Rendered / frame | Side clearance (px) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1920x1080 normal, W x 9 at 128 px | 1157.625 / 1124 | 1018.125 | 1018.125 | 1120 | 90.9040% | 50.94 / 50.94 |
| 1400x950 Focus, W x 10 at 140 px | 1406.859 / 1316 | 1237.328125 | 1237.328125 | 1312 | 94.3085% | 37.34 / 37.33 |

The candidate's box is 820 px wide in both cases and satisfies the existing width and height predicates. Marcus approved the W7.8 re-baseline on 2026-11-08. Both checks now use the candidate's independently measured unfitted width and retain the existing inside-frame assertions for every probe. The subsequent floor-aware clarification requires strict 90% for fitting above 10 px and exactly 10 px for floor-limited fits. An unwrapped floor token must render at its actual measured 10 px width. A wrapped box must stay at or below 90%; only its text range may extend up to 1/64 CSS px past the box. No other comparison has a tolerance. PRE_F1 classification, data, behavior, security, fitting source and the existing checkFloor rule are preserved.

### Cross-check of the 80 floor cases

Every row was run against both the committed frontend at `2a376445ceb1b98a1b4c943cf8834e77e0578120` and the candidate. All 80 rendered at exactly 10 px on each revision. Every word or scroll aperture was fully inside the frame on both. Pre-restyle wrapped 80, while the candidate wrapped four. The other 76 candidate text ranges equal their independently measured, unwrapped 10 px widths exactly. The four wrapped cases rendered a range of 342.015625 px in a 342 px box in a 380 px inner frame. All four overhangs were exactly 0.015625 px. [Full measurements](results/w7-restyle/verification/floor-cross-check.json) and [cross-check script](results/w7-restyle/verification/check-floor-history.cjs).

Each data cell lists **pre-restyle / candidate**. Width means the rendered text range, frame means its inner width, and percentage means rendered width divided by inner width. `Real x 45` denotes 45 repetitions of the real 45-character word Pneumonoultramicroscopicsilicovolcanoconiosis (2025 characters total).

| # | Viewport and mode | Context / focus letter | Token | Font (px) | Width (px) | Frame (px) | Percentage | Wrapped |
| ---: | --- | --- | --- | --- | ---: | ---: | ---: | --- |
| 1 | 390x844, normal | on / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 2 | 390x844, normal | on / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 3 | 390x844, normal | on / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 4 | 390x844, normal | on / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 5 | 390x844, normal | on / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 6 | 390x844, normal | on / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
| 7 | 390x844, normal | off / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 8 | 390x844, normal | off / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 9 | 390x844, normal | off / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 10 | 390x844, normal | off / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 11 | 390x844, normal | off / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 12 | 390x844, normal | off / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
| 13 | 390x600, normal | on / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 14 | 390x600, normal | on / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 15 | 390x600, normal | on / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 16 | 390x600, normal | on / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 17 | 390x600, normal | on / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 18 | 390x600, normal | on / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
| 19 | 390x600, normal | off / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 20 | 390x600, normal | off / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 21 | 390x600, normal | off / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 22 | 390x600, normal | off / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 23 | 390x600, normal | off / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 24 | 390x600, normal | off / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
| 25 | 844x390, normal | on / on | Real x 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990% / 90.004% | yes / yes |
| 26 | 844x390, normal | on / off | Real x 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990% / 90.004% | yes / yes |
| 27 | 844x390, normal | off / on | Real x 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990% / 90.004% | yes / yes |
| 28 | 844x390, normal | off / off | Real x 45 | 10 / 10 | 345.5625 / 342.015625 | 384 / 380 | 89.990% / 90.004% | yes / yes |
| 29 | 996x950, Focus | on / on | W x 99 | 10 / 10 | 813.984375 / 874.96875 | 912 / 908 | 89.253% / 96.362% | yes / no |
| 30 | 996x950, Focus | on / on | W x 100 | 10 / 10 | 813.984375 / 883.8125 | 912 / 908 | 89.253% / 97.336% | yes / no |
| 31 | 996x950, Focus | on / on | W x 101 | 10 / 10 | 813.984375 / 892.640625 | 912 / 908 | 89.253% / 98.308% | yes / no |
| 32 | 996x950, Focus | on / on | W x 102 | 10 / 10 | 813.984375 / 901.484375 | 912 / 908 | 89.253% / 99.282% | yes / no |
| 33 | 996x950, Focus | on / off | W x 99 | 10 / 10 | 813.96875 / 874.953125 | 912 / 908 | 89.251% / 96.360% | yes / no |
| 34 | 996x950, Focus | on / off | W x 100 | 10 / 10 | 813.96875 / 883.796875 | 912 / 908 | 89.251% / 97.334% | yes / no |
| 35 | 996x950, Focus | on / off | W x 101 | 10 / 10 | 813.96875 / 892.640625 | 912 / 908 | 89.251% / 98.308% | yes / no |
| 36 | 996x950, Focus | on / off | W x 102 | 10 / 10 | 813.96875 / 901.46875 | 912 / 908 | 89.251% / 99.281% | yes / no |
| 37 | 996x950, Focus | off / on | W x 99 | 10 / 10 | 813.984375 / 874.96875 | 912 / 908 | 89.253% / 96.362% | yes / no |
| 38 | 996x950, Focus | off / on | W x 100 | 10 / 10 | 813.984375 / 883.8125 | 912 / 908 | 89.253% / 97.336% | yes / no |
| 39 | 996x950, Focus | off / on | W x 101 | 10 / 10 | 813.984375 / 892.640625 | 912 / 908 | 89.253% / 98.308% | yes / no |
| 40 | 996x950, Focus | off / on | W x 102 | 10 / 10 | 813.984375 / 901.484375 | 912 / 908 | 89.253% / 99.282% | yes / no |
| 41 | 996x950, Focus | off / off | W x 99 | 10 / 10 | 813.96875 / 874.953125 | 912 / 908 | 89.251% / 96.360% | yes / no |
| 42 | 996x950, Focus | off / off | W x 100 | 10 / 10 | 813.96875 / 883.796875 | 912 / 908 | 89.251% / 97.334% | yes / no |
| 43 | 996x950, Focus | off / off | W x 101 | 10 / 10 | 813.96875 / 892.640625 | 912 / 908 | 89.251% / 98.308% | yes / no |
| 44 | 996x950, Focus | off / off | W x 102 | 10 / 10 | 813.96875 / 901.46875 | 912 / 908 | 89.251% / 99.281% | yes / no |
| 45 | 1400x950, Focus | on / on | W x 135 | 10 / 10 | 1175.734375 / 1193.140625 | 1316 / 1312 | 89.342% / 90.941% | yes / no |
| 46 | 1400x950, Focus | on / on | W x 140 | 10 / 10 | 1175.734375 / 1237.328125 | 1316 / 1312 | 89.342% / 94.309% | yes / no |
| 47 | 1400x950, Focus | on / on | W x 141 | 10 / 10 | 1175.734375 / 1246.15625 | 1316 / 1312 | 89.342% / 94.981% | yes / no |
| 48 | 1400x950, Focus | on / on | W x 142 | 10 / 10 | 1175.734375 / 1255 | 1316 / 1312 | 89.342% / 95.655% | yes / no |
| 49 | 1400x950, Focus | on / on | W x 143 | 10 / 10 | 1175.734375 / 1263.84375 | 1316 / 1312 | 89.342% / 96.330% | yes / no |
| 50 | 1400x950, Focus | on / on | W x 144 | 10 / 10 | 1175.734375 / 1272.671875 | 1316 / 1312 | 89.342% / 97.002% | yes / no |
| 51 | 1400x950, Focus | on / off | W x 135 | 10 / 10 | 1175.71875 / 1193.125 | 1316 / 1312 | 89.340% / 90.939% | yes / no |
| 52 | 1400x950, Focus | on / off | W x 140 | 10 / 10 | 1175.71875 / 1237.3125 | 1316 / 1312 | 89.340% / 94.307% | yes / no |
| 53 | 1400x950, Focus | on / off | W x 141 | 10 / 10 | 1175.71875 / 1246.15625 | 1316 / 1312 | 89.340% / 94.981% | yes / no |
| 54 | 1400x950, Focus | on / off | W x 142 | 10 / 10 | 1175.71875 / 1254.984375 | 1316 / 1312 | 89.340% / 95.654% | yes / no |
| 55 | 1400x950, Focus | on / off | W x 143 | 10 / 10 | 1175.71875 / 1263.828125 | 1316 / 1312 | 89.340% / 96.328% | yes / no |
| 56 | 1400x950, Focus | on / off | W x 144 | 10 / 10 | 1175.71875 / 1272.65625 | 1316 / 1312 | 89.340% / 97.001% | yes / no |
| 57 | 1400x950, Focus | off / on | W x 135 | 10 / 10 | 1175.734375 / 1193.140625 | 1316 / 1312 | 89.342% / 90.941% | yes / no |
| 58 | 1400x950, Focus | off / on | W x 140 | 10 / 10 | 1175.734375 / 1237.328125 | 1316 / 1312 | 89.342% / 94.309% | yes / no |
| 59 | 1400x950, Focus | off / on | W x 141 | 10 / 10 | 1175.734375 / 1246.15625 | 1316 / 1312 | 89.342% / 94.981% | yes / no |
| 60 | 1400x950, Focus | off / on | W x 142 | 10 / 10 | 1175.734375 / 1255 | 1316 / 1312 | 89.342% / 95.655% | yes / no |
| 61 | 1400x950, Focus | off / on | W x 143 | 10 / 10 | 1175.734375 / 1263.84375 | 1316 / 1312 | 89.342% / 96.330% | yes / no |
| 62 | 1400x950, Focus | off / on | W x 144 | 10 / 10 | 1175.734375 / 1272.671875 | 1316 / 1312 | 89.342% / 97.002% | yes / no |
| 63 | 1400x950, Focus | off / off | W x 135 | 10 / 10 | 1175.71875 / 1193.125 | 1316 / 1312 | 89.340% / 90.939% | yes / no |
| 64 | 1400x950, Focus | off / off | W x 140 | 10 / 10 | 1175.71875 / 1237.3125 | 1316 / 1312 | 89.340% / 94.307% | yes / no |
| 65 | 1400x950, Focus | off / off | W x 141 | 10 / 10 | 1175.71875 / 1246.15625 | 1316 / 1312 | 89.340% / 94.981% | yes / no |
| 66 | 1400x950, Focus | off / off | W x 142 | 10 / 10 | 1175.71875 / 1254.984375 | 1316 / 1312 | 89.340% / 95.654% | yes / no |
| 67 | 1400x950, Focus | off / off | W x 143 | 10 / 10 | 1175.71875 / 1263.828125 | 1316 / 1312 | 89.340% / 96.328% | yes / no |
| 68 | 1400x950, Focus | off / off | W x 144 | 10 / 10 | 1175.71875 / 1272.65625 | 1316 / 1312 | 89.340% / 97.001% | yes / no |
| 69 | 390x844, Focus | on / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 70 | 390x844, Focus | on / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 71 | 390x844, Focus | on / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 72 | 390x844, Focus | on / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 73 | 390x844, Focus | on / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 74 | 390x844, Focus | on / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
| 75 | 390x844, Focus | off / on | W x 35 | 10 / 10 | 301.5 / 309.34375 | 342 / 334 | 88.158% / 92.618% | yes / no |
| 76 | 390x844, Focus | off / on | W x 36 | 10 / 10 | 301.5 / 318.1875 | 342 / 334 | 88.158% / 95.266% | yes / no |
| 77 | 390x844, Focus | off / on | W x 37 | 10 / 10 | 301.5 / 327.015625 | 342 / 334 | 88.158% / 97.909% | yes / no |
| 78 | 390x844, Focus | off / off | W x 35 | 10 / 10 | 301.46875 / 309.328125 | 342 / 334 | 88.149% / 92.613% | yes / no |
| 79 | 390x844, Focus | off / off | W x 36 | 10 / 10 | 301.46875 / 318.171875 | 342 / 334 | 88.149% / 95.261% | yes / no |
| 80 | 390x844, Focus | off / off | W x 37 | 10 / 10 | 301.46875 / 327.015625 | 342 / 334 | 88.149% / 97.909% | yes / no |
