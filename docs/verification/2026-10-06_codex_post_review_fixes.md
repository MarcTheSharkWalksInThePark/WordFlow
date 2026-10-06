# WordFlow post-review fixes — 2026-10-06

Author: Codex (gpt-6.1-sol, high). Builder follow-up to CC's single independent review.
Baseline: `feat/static-hosting` at `6060f66`. W4 was recorded verbatim in DECISIONS.md
before code changes. This task ends in a local commit on that branch; no merge, push,
deployment, GitHub/Cloudflare change or installation. CC's report and evidence are untouched.

## Result and evidence

All evidence below is under `docs/verification/results/post-review/`. The committed harness
`verify.cjs` reproduces Node/absence checks, staged checkout conversions and dist comparisons.
The fixture generator is evidence only: Python is absent from the product and test gate.

| Verification | Result | Evidence |
|---|---|---|
| `npm test`, Node 24.16.0 | **370 checks = 223 static + 97 proxy + 32 R59 + 18 post-review; 0 skips** | node-tests.json; static-regression.json; proxy.json; post-review-tests.json |
| Playwright and Chrome absent | **npm test exit 0, identical output** with every Playwright/browser-helper import forbidden and Chrome executable probes false, inherited by Node children | no-browser-preload.cjs; node-tests.json |
| `npm run parity` | **9/9 DOCX**, byte-exact historical Python payloads; **all 7 PDFs asserted**, exactly 2 pinned differences | browser-parity.json; generated tests/parity-stamp.json |
| Chrome smoke | **48 checks**, 24 each at 1400×950 and 390×844; **0 app errors, blocked unexpected origins or upload requests** | static-smoke.json and four screenshots |
| Mutations | **58 total: 57 KILLED, M9 equivalent, 0 unexpected, 0 errors** | mutations.json (exact transforms, target suites and before/mutated/restored SHA-256) |
| Earlier definitions | **52/52 unchanged**, including original **46/46 R59** | final-checks.json; comparison against 6060f66 and source master |
| Distribution / checkout conversion | **197 allowlisted assets + 2 configurations = 199**, exact source bytes; identical under core.autocrlf true and false | checkouts-and-dist.json; final-checks.json |
| Preserved implementation | **30 reader helpers + 8 R59 helpers** unchanged after EOL normalization | final-checks.json |
| Vendoring / fixtures | **188 vendored hashes**, all **16 fixture records** verified | static-regression.json; golden-provenance.json |

The absence probe does not uninstall or modify any runtime. It makes browser dependencies
unavailable to the actual npm command. The Node tests never load them. The stamp check also
runs using only Node, so pushes do not depend on Codex's Playwright cache being present.

## W4 rulings mapped to changes

| Ruling | Change and evidence |
|---|---|
| W4.1 | AGENTS.md accepts inherited paths, bans new profile paths and prescribes `<home>` / `<vault>`. No scrub/history rewrite. Added committed lines and new text evidence contain no real user-profile paths (hygiene.json). Existing AGENTS/CLAUDE operational paths remain. |
| W4.2 a–b | npm test is four Node suites only. npm run parity runs browser extraction and the Chrome smoke. AGENTS/README require parity before merge for extraction/vendor/fixtures and app/index/styles changes. Browser absence probe passes. |
| W4.2 c–e | Successful parity alone generates the production stamp with Chrome **154.0.8037.98**, Playwright **1.62.1**, and hashes of every extractor/vendor/fixture file. As an implementation choice it also hashes app.js, index.html and styles.css, enforcing the frontend pre-merge rule. Exact file-set comparison catches additions/deletions. Never-edit rule sits beside the existing push-marker rule. |
| W4.2 f–g | Tests run the actual push.sh stamp block in a temporary synthetic tree: matching hashes pass, a changed fixture refuses with npm run parity instructions, additions/deletions fail. Synthetic test stamps use the same generator and never alter the production stamp. Disabling the push stamp block is KILLED. |
| W4.3 | Prior Codex report has an appended dated **Correction**, retaining its historical text and attributing the listed behaviour changes to W4.3. Current regression labels and HOSTING use the corrected ruling. |
| W4.4 | HOSTING removes the separate email-history confirmation step; W3 fully settles it. Marcus still controls visibility and launch. |
| W4.5 | AGENTS records F1 as a separate reader task after launch; fitting behaviour is unchanged. |
| W4.6 | Exact approved privacy paragraph in index.html and HOSTING, with CF-Connecting-IP / X-Real-IP, CF-Worker and DoH hostnames explained. Screenshots show wrapping at phone width. |

## CC findings mapped to fixes

| Finding | Change / disposition | Evidence |
|---|---|---|
| S1 | Separate Node gate and required stamped parity (W4.2). | node-tests.json; post-review-tests.json; stamp; W4 mutation |
| S2 | Exact approved privacy text, including visitor IP and direct fallback (W4.6). | index.html; HOSTING; screenshots |
| S3 | Marcus accepts inherited profile paths; new additions use placeholders (W4.1). | AGENTS; hygiene.json |
| S4 | Marcus confirms all listed behaviour changes; attribution corrected (W4.3). | DECISIONS; dated Correction |
| S5 | noBreakHyphen becomes ASCII `-`; main/core/styles parts follow package relationships; only paragraph styles inform pStyle headings. ZIP metadata is indexed, only selected related XML is inflated; existing 4096-entry / 64 MiB limits remain. Three new fixtures reproduce CC's cases; document2 additionally relocates styles and uses a root-relative styles relationship. | golden-provenance.json; generator; browser-parity.json |
| S6 | **Live-only, unverified**: actual edge CPU on a maximum-size body. HOSTING retains the 10 ms / Error 1102 launch check. | HOSTING live sequence |
| S7 | Match error code: 1027 regardless of content type; match an Error 1027 phrase instead of any standalone number. Preserve readable Function JSON articles. Every section 5 table row is covered, including IPv6, Ray IDs, CSS, links, static marker and missing Function. | 14 quota rows in post-review-tests.json |
| S8 | validateTarget itself refuses file/data/javascript/ftp/ws redirect targets; public-host forms isolate the scheme guard. Test DoH redirect options, HTTP failures with valid answers, SERVFAIL/NXDOMAIN with valid answers, malformed/oversized JSON, malformed answers and AAAA-only failure. All seven PDFs asserted. | proxy.json; browser-parity.json; E3/E9/E10/E11 KILLED |
| S9 | Explicit EOL rules for _headers, api/read, 404.html, LICENSE, functions/api/read.js, .gitattributes, all JS and evidence Python; vendor bytes retain -text. Both checkout configurations pass the same Node output and PDF/DOCX assertions and produce identical dist bytes and matching stamps. | .gitattributes; checkouts-and-dist.json |
| S10 | Removed requirements.txt hint; named Codex runtime cache using `<home>`; both compatibility-date dashboard paths; corrected ten early/two later golden chronology. W4.4 removes settled email step. | push.sh; README; HOSTING |
| S11 | README explicitly documents local hostname disclosure to cloudflare-dns.com and LAN-only/hosts-file failure. | README |
| S12 | `_headers` removes Access-Control-Allow-Origin; local static responses have no CORS allowance. Compare all declared static security headers to actual local response. Same-origin PDFs/DOCX/workers/fonts, controls and direct external fallback pass smoke. | regression header assertions; static-smoke.json |
| S13 | Removed dead skipped counter. Push grep detects plain skipped messages case-insensitively and nonzero JSON skip counts while accepting skipped:0. | server_exposure.test.js; push.sh; node-tests.json |
| S14 | At every hop, refuse the canonical request hostname or any configured alias before DoH/fetch. SITE_HOSTNAMES defaults to wordflow.pages.dev; custom production aliases can be added there. Tests cover request host, configured Pages and production names, uppercase/trailing-dot/port variants and redirects, with no outbound fetch to them. | proxy.json; S14-self-host-guard-removed KILLED |

The **Function missing + static marker** response is indistinguishable from quota fail-open;
no browser-code change can resolve that. HOSTING requires **load one real public URL** through
the live Function, proving deployment/routing before launch. This remaining S7 deployment case
is disclosed rather than claimed fixed. S6 and real quota/fail-open/headers/logging/invocation
checks remain live-only. Actual assigned Pages/custom aliases must be recorded before launch;
the request-host guard already protects whichever hostname receives a request.

## New mutations

| Row | Witness | Verdict |
|---|---|---|
| E3-redirect-scheme-guard-removed | validateTarget rejects a public-host file: URL independently of the hostname check | KILLED |
| E9-DoH-redirect-follow | DNS options observed outside handleRead's generic catch must use redirect:error | KILLED |
| E10-DoH-status-ignored | HTTP 500 carrying valid public DNS answers still refuses without target fetch | KILLED |
| E11-DoH-Status-field-ignored | SERVFAIL carrying valid public answers still refuses without target fetch | KILLED |
| W4-stamp-check-disabled | Actual push stamp block must refuse a changed synthetic fixture | KILLED |
| S14-self-host-guard-removed | Self-host destination must refuse before any network call | KILLED |

The original 52 rows retain their definitions and verdicts (51 KILLED + M9 equivalent).
M1/X10 retain the disclosed test-preload unsafe-bind setup abort. None created a public socket.
All six new rows are assertion-killed, not timeouts/setup errors. Production sources were not
mutated; each temporary target's restored hash equals its before hash.

## Rendered verification

Browser plugin unavailable; the existing Playwright workflow drives installed headless Chrome.
Flow: localhost app → paste/upload/URL → review → reader controls/resume; simulated quota →
visible limit message → direct fallback. Full smoke verifies page identity, meaningful content,
controls and responsive widths, with no app errors or blank/error overlay. Inspected the
1400 px reader and 390 px quota/privacy screenshots: no clipping or page overflow, and the
approved privacy wording wraps readably. No design change beyond wording.

Checkout comparison caught working-copy LF styles.css despite its existing explicit CRLF
rule; the working copy was aligned, without changing CSS content, and parity regenerated the
stamp. Both checkout configurations then passed. Earlier harness-only npm-location and Windows
NODE_OPTIONS quoting issues were corrected; the final committed evidence contains successful runs.

## Boundaries and handoff

No Cloudflare execution is claimed. DNS rebinding between DoH and fetch, unauthenticated quota
abuse, other browsers/corpora, lower Node versions and Windows 8.3 remain disclosed. F1 is deferred
by W4.5. The complete stamp check is tested through its actual shell block; no real push or remote
fetch was attempted, and the entire push script was not executed end to end.

The Brain context was read first. Project note, hot-cache/current-state and one HH:MM Codex
worklog entry are updated for the local commit and next launch/review step. The dated daily note
is absent; it is not created. Further launch actions remain with Marcus. Keep this branch local;
merge/push only after review via the mandatory gate, then Marcus controls visibility and free
Cloudflare Git connection. The review remains CC's one round; these are builder verification claims.
