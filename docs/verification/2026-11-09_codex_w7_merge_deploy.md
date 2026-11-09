# W7 merge and deployment

2026-11-09, Codex. Marcus authorized merge, gated push and deployment under W7.14.
Merged and pushed **131713ed8ba6bb8b53d036340046010ebf2abb6c**. Cloudflare deployment succeeded.
Post-deployment validation initially STOPPED at a raw Git-blob hash comparison. Marcus authorized
resumption on 2026-11-09: production is built from the CRLF checkout prescribed by .gitattributes.
All four checkout hashes and all requested live checks now PASS. No revert, force-push, product
change or package installation occurred. W7 is closed; residual platform checks remain open.

## Merge and gate

Read AGENTS.md, CLAUDE.md, DECISIONS (W7, clarifications and W7.13), HOSTING,
the F1 merge/deploy report, CC's CLEAR delta report and relevant vault context.
Fetched origin successfully after the sandbox denied writing .git/FETCH_HEAD.
The clean starting feature branch was 0cedf1902614fdd9489d269258ade77b9450e4d5;
master 2a376445ceb1b98a1b4c943cf8834e77e0578120; fetched origin/master
188d65e877c9cf63096bcc1e8abc2b523f16f07d; hooks .githooks. All matched.

Appended W7.14 verbatim in records-only commit 131713e; its parent diff contains only
docs/DECISIONS.md. Stamp passed. Fast-forward merge advanced master to that commit without
a merge commit and included the intended earlier docs-only da9eecf and 2a37644 commits.
Stamp passed after merge. npm test: **515, zero skips** (223 static, 169 proxy, 32 exposure,
91 post-review). Initial sandbox run failed with loopback connect EACCES; the authorized
unsandboxed run passed. No parity regeneration was run.

Git Bash ran the unmodified tools/push.sh. Gate output, verbatim:

```text
PASS: pre-push hook active (.githooks)
PASS: on branch master
PASS: working tree is clean
PASS: no tracked .env* file
PASS: master is not behind origin/master
PASS: npm test (no skips)
PASS: browser parity stamp matches committed inputs
To https://github.com/MarcTheSharkWalksInThePark/WordFlow.git
   188d65e..131713e  master -> master
PASS post-push: origin master = 131713ed8ba6bb8b53d036340046010ebf2abb6c
```

tools/push.log: gates PASS at 15:14:46 UTC; remote verification OK at 15:14:51 UTC.
No gate refusal occurred. Both master refs matched the pushed SHA before the records commit.

## Deployment and hash-comparison STOP

GitHub Cloudflare Pages check first reported Building and then completed successfully at
15:15:18 UTC, comfortably within 15 minutes. Exact head SHA matched. Deployment ID:
**4b4ab19b-eee0-43ea-8963-48c1d961c5e5**; title "Deployed successfully".
Evidence: results/w7-live/deployment-check.json.

Production https://wordflow-reader.pages.dev/app.js returned HTTP 200:

| Bytes hashed | SHA-256 |
|---|---|
| Raw committed Git blob (LF) | 5907de53adcf1d4b2f90cf2326a4554c4c51ae562521d5b207491d5c9ef17baf |
| Production response | 6f2f2a1a5868e5fd2335aebe2807bd1007519d4d499e9a986131151892168e2d |
| Committed blob converted to prescribed CRLF checkout | 6f2f2a1a5868e5fd2335aebe2807bd1007519d4d499e9a986131151892168e2d |
| Local checked-out app.js | 6f2f2a1a5868e5fd2335aebe2807bd1007519d4d499e9a986131151892168e2d |

The comparison harness used git show HEAD:app.js bytes directly. .gitattributes explicitly
requires app.js (and the other three requested assets) to be checked out with CRLF. Thus the
first comparison used a different byte representation from the prescribed build inputs.
An offline comparison, without another production request, proves production matches the
committed content after exactly the prescribed checkout conversion. This is a validation
method error; it does not establish a product/deployment failure. Nevertheless the explicit
STOP was retained and no remaining live checks were run. Evidence: deployment-assets.json.

## Authorized resumption and live results

Marcus's 2026-11-09 resumption explicitly approves checkout-byte comparison (the F1 report basis),
recording the raw blob hashes too, completing live checks, and a records commit/push. No deployment
defect existed. All four assets returned 200 and matched both the working tree at pushed 131713e
and the committed blob converted exactly as .gitattributes prescribes. The original failure evidence
is preserved in deployment-assets.json; resumed evidence is deployment-assets-resumed.json.
Git blobs use LF; the prescribed production checkout uses CRLF, so their raw hashes differ.

| Asset | Checkout / production SHA-256 | Raw Git-blob SHA-256 |
|---|---|---|
| app.js | 6f2f2a1a5868e5fd2335aebe2807bd1007519d4d499e9a986131151892168e2d | 5907de53adcf1d4b2f90cf2326a4554c4c51ae562521d5b207491d5c9ef17baf |
| index.html | fe42feb67ee7c7fe070a68ad6465c6ace141ecb2f08dc7f1c30c7a5fad60bf28 | fe1358f6080f29e4f0a9ce24f3c4b11193b73d3fafafdab9beeef43cdd97150c |
| styles.css | b654519947ce3a1bda2d9ff00c5f57dd1eaa228b17a9f3514423df02dbdcd478 | 6f5f5e735a6d5ce131e1f06545358f7ac07cc96550cbef396f213023d579c61f |
| assets/wordflow-mark.svg | 1faa76c2224fe8154c781d8ce69257c42ed9734364f9aa2121bc9593048a8d66 | 47e3f9f9ea46aa75a438b11b1296781d6fc755f7ff32c9643db14f75b00a71a0 |

`npm run smoke:live -- https://wordflow-reader.pages.dev/ --out docs/verification/results/w7-live/smoke-live.json`
passed **3/3**: public example.com HTML 200, private refusal 403, self refusal 403.

Browser plugin not available; used the requested existing Playwright 1.62.1 and installed Chrome
156.0.8078.81, headless, DPR 1. Synthetic pasted text only, six fresh browser contexts/page loads.
Interaction: load -> paste/review/apply -> next word -> toggle theme in both directions with a
post-toggle save -> reader fullscreen button -> native fullscreen -> exit button -> normal view.
The script asserted document.fullscreenElement on entry and null on exit; no fallback or API shim.

| Check | Result |
|---|---|
| Cloudflare check on pushed SHA | PASS |
| Four production asset checkout hashes | PASS, all HTTP 200 |
| Live proxy smoke | PASS 3/3 |
| 1400x950 dark / light | PASS / PASS |
| 390x844 dark / light | PASS / PASS |
| 320x844 dark / light | PASS / PASS |
| Page identity / meaningful UI / no error overlay | PASS all six |
| Console / page / CSP errors | Zero in every case |
| Horizontal overflow | None before entry, in fullscreen or after exit |
| Theme toggle and storage | Both directions work; only wordflow-reader-session-v1; exact 13-field schema; no sessionStorage or cookies |
| Native fullscreen via buttons | Entered and exited in all six |
| Screenshots | All 12 normal/fullscreen PNGs visually inspected |

Visual inspection: reader frame and words are contained, themes render correctly, mobile transport
wraps at 320 px as expected, normal reader heading and fullscreen icon stay inside the viewport.
Observation V-1 (nonblocking, outside the specified overflow gate): at 320 px in native fullscreen,
the long exit-button label is partly clipped on the right in both themes. The button remains visible
and usable, the actual exit click passed, and document.scrollWidth equals innerWidth. No product
repair is included in this records task; any visual adjustment needs a separate task.

Evidence and runnable asset/browser harnesses are under results/w7-live/. W7 open item closed in
AGENTS.md, with V-1 and residual Cloudflare checks retained. This report, evidence and the first
push's tools/push.log entries form one follow-up records commit on master, pushed through the same
unmodified tools/push.sh. The gate will append fresh log entries for this second push; those stay
for the next change under the normal convention, avoiding an endless chain of log-only pushes.
The records commit SHA and gate result are reported in the final chat/vault after pushing.
No stamped input changed and no parity/mutation regeneration was needed.

## NOT verified

Actual quota/fail-open routing, maximum-body CPU, Functions log-session state and conclusive
static-versus-Function request accounting remain unverified. DNS rebinding and unauthenticated
quota exhaustion remain residual risks. No repeat parity/mutation review, other browsers,
physical touch/Escape, real iOS/Android, zoom or screen-reader testing was performed. Fullscreen
fallback was not needed or exercised live. These scoped checks do not repeat the full extraction,
F1 geometry, playback/idle-control or mutation suites already covered by the reviewed parity stamp.
Today's dated vault daily note is absent and was not created.

Agent: Codex (GPT-6, high)
