# WordFlow decisions

## RULING W5 — delta-review fixes, merge and gated push

MARCUS'S RULINGS (2026-10-06, relayed by the claude.ai orchestrator). Recorded verbatim before any code change.

W5.1 (D-a) Keep stamping app.js, index.html and styles.css in addition to the W4.2c files.
     Frontend pushes therefore need a fresh `npm run parity`; proxy-only fixes stay pushable.
W5.2 (D-b) No CI. Protection against deliberate stamp tampering is the written rule plus review.
     Fix N2.
W5.3 (D-c) The self-host guard refuses the whole project pages.dev name and every subdomain of it.
     Derive the name AUTOMATICALLY from the request host: when the request host ends in
     ".pages.dev", the project name is its last three labels, and that name plus all its
     subdomains are refused. This is in addition to the request host itself and SITE_HOSTNAMES
     (kept for custom domains). The guard must not depend on the configured name being right.
W5.4 (D-d) "wordflow.pages.dev" belongs to someone else. Remove it as a default from
     SITE_HOSTNAMES and the docs. Marcus chooses the Pages project name when creating it. HOSTING.md
     tells him to record the assigned *.pages.dev address afterwards. No code change is needed for
     the name, because of W5.3.

Marcus authorizes this task's verified fast-forward merge to master and push only through
tools/push.sh; stop if the merge is not a fast-forward or the gate refuses. Repository visibility
and Cloudflare remain Marcus's launch steps.

## RULING W4 — post-review fixes

MARCUS'S RULINGS (2026-10-06, relayed by the claude.ai orchestrator). Recorded verbatim before code changes.

W4.1 (D1) The repository may go public with the existing Windows user-profile paths in tracked
     files and history. No scrub or history rewrite.
     From now on, NEW or EDITED committed content must not add real user-profile paths; use
     placeholders such as <home> or <vault>. Add this as a rule in AGENTS.md. Existing operational
     paths in AGENTS.md and CLAUDE.md may stay.

W4.2 (D2) Gate design = CC option C, with a stamp check.
     a. `npm test`, and therefore tools/push.sh, runs only the Node suites. No Playwright and no
        Chrome. It must still exit nonzero on any failure and never skip.
     b. A new `npm run parity` runs the browser extraction parity and the Chrome smoke. It is a
        REQUIRED pre-merge step for any change to the files in (c), and for any change to app.js,
        index.html or styles.css. Document this in AGENTS.md and README.
     c. `npm run parity`, on success only, writes a committed stamp file. The stamp holds the
        SHA-256 of every file in lib/file-extractors.mjs (or wherever extraction lives), vendor/**
        and tests/fixtures/**, plus the Chrome and Playwright versions used.
     d. tools/push.sh refuses to push when any of those files' current hashes differ from the
        stamp. The message tells the user to run `npm run parity`.
     e. Never hand-write or edit the stamp. Add that rule next to the existing marker rule.
     f. Add tests:
        - push.sh/stamp logic refuses on a changed fixture and passes when the hashes match;
        - npm test passes with Playwright absent.
     g. Register a mutation that disables the stamp check. It must be KILLED.

W4.3 (D3) Marcus confirms all behaviour changes listed in CC S4 as rulings:
     - the 24 MiB cap on all files, including text;
     - /api/read is GET-only;
     - private, special, localhost and LAN destinations are refused, on the local server too;
     - ports 80/443 only; URLs with credentials refused; explicit non-http(s) schemes refused,
       including host:port input;
     - at most 5 redirects, each revalidated.
     Correct your earlier report's attribution: these are now W4.3, not W2 text. Do this with a
     dated "Correction" note appended to your own report; do not rewrite the old text.

W4.4 (D4) W3 fully settles the email-history step. Remove it from HOSTING.md's manual sequence.

W4.5 (D5) F1 (the 135-character token overflow) is deferred to a separate reader task after launch.
     Record it as an open item.

W4.6 The privacy note text becomes exactly:
     "Files are read in your browser and never uploaded. Links you load are fetched through
     WordFlow's proxy on Cloudflare. Cloudflare and the website you load can see the request,
     including your IP address. If the proxy fails, your browser contacts the website directly.
     Nothing is stored except your own resume session in this browser."
     Mirror it in HOSTING.md's privacy section, together with CC's points:
     - CF-Connecting-IP / X-Real-IP;
     - the CF-Worker header;
     - DoH hostnames.
     If the current note's first and last sentences differ from the text above, keep the meaning
     but use this text.

## RULING W2 — static hosting

MARCUS'S RULINGS (2026-10-05, relayed by the claude.ai orchestrator). Recorded verbatim on 2026-10-06.

W2.1 Hosting.
- WordFlow becomes a public, STATIC website on Cloudflare's FREE plan.
- Condition: every current feature stays intact, and development continues after launch.
- There is no paid tier, card or paid add-on.

W2.2 URL reading.
- A Cloudflare Worker / Function at the same origin serves /api/read.
- Expected load is under 100,000 requests/day.
- If the free daily limit is reached, the rest of the site must keep working. URL loading must fail
  with a clear message, never a crash or a blank page.

W2.3 Visibility.
- The GitHub repository becomes public. Marcus flips this himself, after review and after a separate
  email-history decision.
- Do not change repository settings.

W2.4 Licence. Replace LICENSE with exactly:
  "Copyright (c) 2026 Marcus. All rights reserved.
  No permission is granted to use, copy, modify, merge, publish, distribute, sublicense or sell this
  software or any part of it without the prior written permission of the copyright holder.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT
  SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM, OUT OF
  OR IN CONNECTION WITH THE SOFTWARE OR ITS USE."
  Bundled third-party code keeps its own licence. Its notices go in THIRD_PARTY_NOTICES.md and ship
  with the site.

W2.5 Dispositions (CC review section 7).
- #3, #4, #5, #6 and #12: CONFIRMED by Marcus.
- #7: REMOVE loadLocalEnv. WordFlow has no secrets.
- #11: SUPERSEDED. Python leaves the product, so the pins, the resolver and the Codex-runtime
  fallback go away.

W2.6 Record corrections.
- Update DECISIONS rows #1, #2, #10 and #16 to match AGENTS.md's "Resolved on 2026-10-05": private
  GitHub repo, CC review CLEAR, push gate built.
- Record that the default branch was named `main` during the build and review and is `master` now.

W2.7 Vendoring. Marcus approves adding pinned third-party browser libraries as files in the repo:
- pdf.js (pdfjs-dist), taken from the official npm registry tarball;
- optionally one small zip-inflate library, only if the browser's native DecompressionStream
  ("deflate-raw") proves insufficient.
For each, record the version, the npm integrity hash and the SHA-256 of every vendored file.
Nothing is installed into the machine's Node or Python. No CDN at runtime.

### W2 workflow and R59 exception (Marcus, task dated 2026-10-06)

Work on local `feat/static-hosting`; do not merge or push. Deployment happens only by
Cloudflare's Git integration from master, after review. W2 authorizes extending R59's
STATIC_FILES by exact new site and vendored filenames only; all other R59 protections
remain in force. Remove the env loader and Python product code after preserving goldens.
The default branch was named `main` during the build and review; it is `master` now.

RULING W1 (Marcus, 2026-10-05): The standalone WordFlow repository is canonical for
WordFlow from its first commit. The WordFlow copy inside MarcDeck is frozen and will be
removed under a MarcDeck ruling. WordFlow fixes go to the standalone repository only.

## Recon decisions 1–19

Source: MarcDeck `docs/verification/2026-10-01_cc_recon_wordflow_split.md`, section 3.5. The 2026-10-05 task settles this local extraction only. Engineering choices below are implementation choices, not invented Marcus rulings.

| # | Recon decision | Status and owner |
|---|---|---|
| 1 | Repository name | **Resolved 2026-10-05:** WordFlow, private GitHub backup repository created. |
| 2 | Visibility | **Resolved 2026-10-05:** private GitHub repository. W2.3 authorizes Marcus to make it public after review and the separate email-history decision; not performed in this build. |
| 3 | Deferral and sufficient regression | **Confirmed by Marcus, W2.5:** the never-committed pre-split regression run is sufficient for the extraction. MarcDeck remains unedited. |
| 4 | Server strategy | **Confirmed by Marcus, W2.5:** independent trimmed server. W2 now shares one platform-neutral proxy with the Pages Function. |
| 5 | History method | **Confirmed by Marcus, W2.5:** M2 plumbing replay. W3 later changes only the authorized email metadata/content. |
| 6 | Paths that travel | **Confirmed by Marcus, W2.5:** the original five paths, with screenshots and pyc dropped. W2 later removes Python and adds named static/vendor assets. |
| 7 | Env handling | **Marcus W2.5:** REMOVE loadLocalEnv. WordFlow has no secrets; environment files are never read. |
| 8 | Retire MarcDeck guard/fence, dispositions | **Open — Marcus's separate MarcDeck ruling and its designated implementer.** No guard, fence, hook or bug disposition changed. |
| 9 | Delete protected files in MarcDeck | **Deferred — Marcus.** Explicitly prohibited in this task; frozen copy remains. |
| 10 | Executor, verifier, pusher | **Resolved 2026-10-05:** Codex built; independent CC review CLEAR; normal gated push completed. W2 requires a new CC review before merge/push. |
| 11 | Python pins and resolver | **SUPERSEDED by Marcus, W2.5:** Python leaves the product; pins, resolver and Codex-runtime fallback removed after committed goldens. |
| 12 | Node floor | **Confirmed by Marcus, W2.5:** Node >=24.16.0. Lower versions remain unverified. |
| 13 | S1/local server protections | **Settled on verified source master** by merged RULING 59; all protections carried and tested here. No new MarcDeck fix in this task. |
| 14 | Public /api/read policy and backup | **Marcus W2:** free public static Pages site, same-origin URL Function and explicit proxy policy; implementation choices and residual risks in HOSTING.md. GitHub backup remains unchanged. |
| 15 | MarcDeck / after removal | **Open — Marcus and MarcDeck engineer** under its removal ruling. |
| 16 | WordFlow hooks / push gate | **Resolved 2026-10-05:** tools/push.sh and .githooks/pre-push built, independently reviewed, active. Only master may be pushed; gate stays mandatory. |
| 17 | MarcDeck upload producer | **Open — Marcus and MarcDeck engineer.** No new cross-repo dependency introduced; removal phase must settle its extractor. |
| 18 | Timing in MarcDeck build order | **Settled for WordFlow extraction:** execute this task now. MarcDeck removal timing remains **Marcus/orchestration**. |
| 19 | Eight local ZIP copies | **Marcus's ruling, relayed by the orchestrator:** checked archived ref commits 2026-10-05; moved to quarantine for Marcus to delete; report in the vault. |

## Other open decisions

**Licence resolved by Marcus, W2.4:** LICENSE now contains the exact all-rights-reserved text; bundled third-party licences remain and notices ship. W2 authorizes static hosting; CC review and Marcus’s connection/live steps remain. RULING W1 does not authorize any edits or removals in MarcDeck. W1 canonicality takes effect from the replayed first commit; this file is recorded in the follow-up implementation commit, as required by M2's provenance step.

## RULING W3 — history email privacy

Marcus's rulings, 2026-10-05, relayed by the claude.ai orchestrator:

- **W3.1** Every commit's author and committer email becomes `292589207+MarcTheSharkWalksInThePark@users.noreply.github.com`. Everything else stays unchanged: names, dates, timezones, messages and parent order.
- **W3.2** Every occurrence of the old personal email inside committed FILE CONTENT, in every commit, becomes the text "<email redacted>". This includes other agents' reports. This is a one-time exception to "never edit another agent's report". Redaction is the only permitted change to those files.
- **W3.3** The GitHub remote is NOT force-pushed. After local verification, Marcus deletes the GitHub repository and recreates it empty, private, with the same name. Then the rewritten master is pushed through `tools/push.sh` as normal. No `--no-verify`, no hand-written marker, no force push.
- **W3.4** This repository's local `git config user.email` becomes the no-reply address, so future commits never carry the personal email.

Implementation: all eight existing commits and both local branches rewritten and verified; one report file redacted by exact byte replacement. Earlier WordFlow SHA citations are pre-rewrite; the old-to-new mapping is in `docs/verification/2026-10-05_codex_history_email_rewrite.md`. The additional final commit records this ruling and report. Marcus confirmed the empty-private-repository recreation and email settings with `done`; the normal `tools/push.sh` push passed, and a fresh GitHub clone passed the identity/content/reachable-object privacy checks. No force push or gate bypass was used.

## W2 implementation choices — Codex, 2026-10-06

Pages Functions with Git integration; exact dist asset build; /api/read-only invocation route;
Pages fail-open with static quota marker; pinned pdfjs-dist 6.4.299; native deflate-raw for DOCX.
These are engineering choices, not additional Marcus rulings. HOSTING.md contains dated official
doc links, project settings, privacy/logging limits and the honest DNS rebinding gap.

CC findings L1–L4 are closed in this build (see HOSTING.md), subject to the new independent review.
W3's completed history work fully settles the email-history step under W4.4. W4.1 accepts
inherited profile paths; Marcus still controls the visibility change after review.
