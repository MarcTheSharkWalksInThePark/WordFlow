# WordFlow delta-review fixes — 2026-10-06

Author: Codex (gpt-6.1-sol, high). Builder follow-up to CC's independent delta review.
Baseline: clean `feat/static-hosting` at `3cdcc43` (CC's delta review plus its cleanup correction).
Marcus's W5 was recorded verbatim in DECISIONS.md before any code change. CC's reports and
evidence are unchanged. No installation, visibility change or Cloudflare action occurred.

## Verification

Evidence: `docs/verification/results/delta-fixes/`; refreshed parity/smoke artifacts remain in
`results/post-review/`, as written by the existing parity runner. The production stamp was
generated only by the successful `npm run parity`.

| Check | Result | Evidence |
|---|---|---|
| npm test, Node 24.16.0 | 491 = 223 static + 162 proxy + 32 R59 + 74 post-review; zero skips | node-tests.json; proxy.json; post-review-tests.json |
| No-browser npm test | Same output and exit 0 with Playwright/browser-helper imports denied and Chrome probes absent in every Node child | node-tests.json; verify.cjs; tests/no-browser-preload.cjs |
| All mutations | 77 total: 76 KILLED, equivalent M9; zero unexpected/errors | mutations.json |
| Earlier rows | All 58 earlier definitions and verdicts unchanged; all 19 new rows assertion-killed, with before/mutated/restored SHA-256 evidence | final-checks.json; mutations.json |
| Browser parity | 9/9 DOCX byte-exact; all 7 PDFs asserted, five exact and two precisely pinned differences | post-review/browser-parity.json |
| Chrome smoke | 48 checks at 1400×950 and 390×844; zero app errors/upload requests | post-review/static-smoke.json; screenshots |
| Stamp | 225 tracked inputs, Chrome 154.0.8037.98, Playwright 1.62.1; normalized committed-blob SHA-256 | tests/parity-stamp.json |
| Hygiene | No added profile paths; CC reports/evidence untouched | final-checks.json |

These are builder checks, not a new independent review. The report is committed before the
authorized fast-forward and real gate run. The end-to-end push result, remote sha and fresh
GitHub-clone checks are recorded after execution in tools/push.log, the Codex vault worklog and
the task's final response; they are not claimed in advance here.

## Rulings and findings

| Item | Change or disposition | Evidence |
|---|---|---|
| W5.1 / D-a | Keep app.js, index.html and styles.css alongside extractor/vendor/fixture inputs. Proxy-only changes remain unstamped. | NAMED list; changed-file tests; four named-input mutants |
| W5.2 / D-b | No CI. Written never-edit rule plus review protect against deliberate stamp forgery; N2 hardened below. | AGENTS/README; committed stamp checks |
| W5.3 / D-c / N1 | Canonicalize case and all trailing dots. Derive last three request-host labels whenever it ends in .pages.dev. Refuse that project and every subdomain before DoH/fetch on every hop, independently of configured names. Exact request/configured custom-domain refusal remains. | 65 added proxy checks; W5-Pages-suffix-removed KILLED |
| W5.4 / D-d | SITE_HOSTNAMES starts empty; remove the third-party address from current hosting defaults. Marcus chooses a name and records the assigned address afterwards; Pages requests need no code edit. Historical agent reports retain their original text. | HOSTING/README; former-default target allowed test |
| N2 | Capture HEAD sha before the gate; verify stamp and exact input set from that commit using git ls-tree and git cat-file --batch. Before tests, refuse S or lowercase git ls-files -v flags on any stamped path. Recheck HEAD before marker/push. | restored-working-bytes test; both hidden-flag tests; W5-on-disk-hashing and W5-index-flags-allowed KILLED |
| N3 | Add changed-file checks for all four named inputs; schema/version/committed-symlink checks; actual shell skip block; injectable parity runner tests for first/second suite failure, spawn failure, changed inputs, version disagreement, unavailable runtime and success. DOMParser-free units execute the real unzip/relatedPart functions for caps, selected duplicates, External/cross-origin/URI guards and relocated paths. | post-review-tests.json; named/parity/schema/symlink/DOCX mutants KILLED |
| N4 / skip grep | Replace the slipping grep with a fail-closed Node scanner. Zero JSON/plain/node:test summaries are accepted; every other skip token is refused. Test all 21 exact lines from CC's evidence through the actual shell block: 18 refused, three accepted, including skipped: 0 and ℹ skipped 0. | post-review-tests.json; W5-skip-check-disabled KILLED |
| N5 | Recording uses Git's tracked set rather than recursive disk walking; push verification uses committed tree blobs. Ignored cache files cannot poison either set or its stamp. Normalize CRLF text to Git's LF blobs; preserve binary inputs. | ignored-file and LF/CRLF tests; both autocrlf settings; N2 blob witness |
| N6 | Index duplicate ZIP names as ambiguous; refuse only when a selected part is read. Duplicate unrelated parts are accepted again, preserving the prior reader behavior. | selected/unused duplicate unit; W5-DOCX-selected-duplicate-allowed KILLED; full DOCX parity |
| N7 | Document all ten lenient malformed-package cases and the missing-core filename-versus-Word Document title difference. No extractor strictness change for these cases. | README divergence paragraph; CC docx.json remains source evidence |
| N8 | Decode nbsp/numeric nonbreaking-space entities and accept error code 1027, Error: 1027 and error_code: 1027. Preserve parsed JSON articles and number-boundary checks. | 22 quota rows; smoke |
| N9 | Commit parity's regenerated evidence alongside its stamp. Remove hard-coded Windows Bash path: resolve from installed Git's exec path, with WORDFLOW_BASH override. | regenerated evidence; synthetic shell tests |
| N10 | CC's scratch cleanup was declined; this task does not delete its retained clones or change its correction. Marcus owns that separate housekeeping. | CC report section 0 / commit 3cdcc43, unchanged |

The on-disk-hashing witness commits changed extractor bytes, restores the previous working bytes,
and verifies the explicit pushed sha: it must refuse even without either hiding flag. The hidden
flag witnesses also confirm git status is clean and the real stamp shell block still refuses.
The old commit can still be verified explicitly, proving selection of the requested sha.

CRLF/LF consistency checks compare the recording hashes against actual committed blob hashes,
then verify under both core.autocrlf settings. The new stamp consequently changes the three
frontend hashes from CRLF working bytes to LF committed bytes, in addition to the changed quota
matcher/extractor content. No production stamp was hand-edited.

The 65 MiB claim check asserts refusal before constructing a Blob/decompression stream, so it
cannot be accidentally killed only by the cumulative cap or a length mismatch. The cumulative
check reads two individually valid 33 MiB deflated parts: one succeeds (and is cached), the
second refuses. The 4096/4097 boundary and an over-expanding part are separately tested.

The mutation runner keeps exact historical anchors and copies the additional test-tool modules
into scratch. It never mutates production sources. Original M1/X10 retain their disclosed unsafe
bind setup refusal; M9 remains equivalent. Every new row is assertion-killed, without timeout.

During this verification round, the Chrome-version mutant initially survived because synthetic
ignored caches were left behind and a hash mismatch masked the version witness. Cleaning those
synthetic files before the corruption tests isolates each schema/version assertion; the final
complete mutation run supersedes that diagnostic run. An npm-test attempt during mutations hit
netstat's default 1 MiB child-process buffer (measured inventory: 1,204,394 bytes). Increase only
that capture limit to 16 MiB; all 32 listener/exposure assertions and R59 production code remain
unchanged. Final normal/no-browser verification runs after mutation execution.

## Rendered QA

Browser plugin not available; the requested existing parity workflow uses installed Playwright
and headless Chrome. Flow: localhost app → paste/file/URL review → reader controls and resume;
simulated quota → visible free-limit message and direct fallback. Smoke verifies page identity,
meaningful content, no overlay, interaction state and console health at both sizes. Inspected
the desktop reader and phone quota/privacy screenshots: no clipping or page overflow.

## Limits and next steps

Bare 1027 bodies and JSON-shaped Cloudflare code objects remain generic errors: CC knows of no
real error page in those forms, and a bare number can be legitimate content. The live quota and
fail-open check remains required. Missing Function plus the static marker stays indistinguishable
from quota, so HOSTING requires loading one real public URL through the deployed Function.

The lightweight relationship units isolate guards; they do not claim full real-world DOCX corpus
coverage. Historical hard-coded-core-path and version-forgery extra mutants are not all promoted
to the registry. Review, not CI, remains the protection against intentionally forged stamps.
Actual edge CPU/quota/routing/headers/logging, DNS rebinding, unauthenticated quota abuse, other
browsers, Windows 8.3 and lower Node versions remain disclosed. F1 stays deferred under W4.5.

After the verified fast-forward and successful mandatory gate: Marcus makes the repository
public; creates the free Cloudflare account and Pages Git project with his chosen name; applies
HOSTING's exact settings; records the assigned address; performs the live check. No deploy or
repository setting change is authorized for the agent. The daily note must never be created;
write back to the project, hot-cache/current-state and one HH:MM Codex worklog entry.
