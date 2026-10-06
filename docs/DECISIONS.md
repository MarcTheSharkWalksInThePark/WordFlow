# WordFlow decisions

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
| 1 | Repository name | **Partly settled:** local path is WordFlow. GitHub name remains **Marcus**; no remote created. |
| 2 | Visibility | **Open — Marcus.** No push or publication. |
| 3 | Deferral and sufficient regression | **Settled for this extraction by the task:** proceed now; its requested route/extractor/local-fetch corpus ran green against old master **before** creating the new repo. MarcDeck is not edited. |
| 4 | Server strategy | **Settled:** independent trimmed server with copied helper logic; no shared package. |
| 5 | History method | **Settled:** M2 plumbing replay, no installs; five original blobs, exact author/committer/dates/message. |
| 6 | Paths that travel | **Settled:** index.html, app.js, styles.css, assets/wordflow-mark.svg, extract_text.py. SETUP_GUIDE is verified MarcDeck-owned. Screenshots and tracked pyc omitted from history. One new synthetic smoke screenshot is verification evidence. |
| 7 | Env handling | **Settled implementation for parity:** copy no env file or secret; preserve loadLocalEnv unchanged. WordFlow needs no secret. Dummy files are test-only. |
| 8 | Retire MarcDeck guard/fence, dispositions | **Open — Marcus's separate MarcDeck ruling and its designated implementer.** No guard, fence, hook or bug disposition changed. |
| 9 | Delete protected files in MarcDeck | **Deferred — Marcus.** Explicitly prohibited in this task; frozen copy remains. |
| 10 | Executor, verifier, pusher | **Settled for this task:** Codex (gpt-6.1-sol, high) builds and verifies locally; no pusher. Independent review and any later push remain **Marcus's assignment**. |
| 11 | Python pins and resolver | **Settled:** exact observed pins pypdf 6.10.0/python-docx 1.2.0; keep existing resolver unchanged. **Later hosting owner** must choose a provisioned interpreter instead of relying on Codex's cache. |
| 12 | Node floor | **Implementation choice:** engines >=24.16.0, the version actually tested with the inherited requireHostHeader behavior. Older Node support remains unverified; any lower floor needs verification by the **WordFlow maintainer**. |
| 13 | S1/local server protections | **Settled on verified source master** by merged RULING 59; all protections carried and tested here. No new MarcDeck fix in this task. |
| 14 | Public /api/read policy and backup | **Open — Marcus, later hosting engineer.** Preserve local behavior now; HOSTING.md records required SSRF/redirect policy. Backup destination remains **Marcus**; no mirror changed. |
| 15 | MarcDeck / after removal | **Open — Marcus and MarcDeck engineer** under its removal ruling. |
| 16 | WordFlow hooks / push gate | **Open — Marcus.** No custom hooks or inherited MarcDeck push gate installed. Verification is available via npm test/mutations. |
| 17 | MarcDeck upload producer | **Open — Marcus and MarcDeck engineer.** No new cross-repo dependency introduced; removal phase must settle its extractor. |
| 18 | Timing in MarcDeck build order | **Settled for WordFlow extraction:** execute this task now. MarcDeck removal timing remains **Marcus/orchestration**. |
| 19 | Eight local ZIP copies | **Marcus's ruling, relayed by the orchestrator:** checked archived ref commits 2026-10-05; moved to quarantine for Marcus to delete; report in the vault. |

## Other open decisions

**Licence — Marcus:** LICENSE says exactly “TO BE DECIDED BY MARCUS”. Public hosting and deployment need their own ruling and verification. RULING W1 does not authorize any edits or removals in MarcDeck. W1 canonicality takes effect from the replayed first commit; this file is recorded in the follow-up implementation commit, as required by M2's provenance step.

## RULING W3 — history email privacy

Marcus's rulings, 2026-10-05, relayed by the claude.ai orchestrator:

- **W3.1** Every commit's author and committer email becomes `292589207+MarcTheSharkWalksInThePark@users.noreply.github.com`. Everything else stays unchanged: names, dates, timezones, messages and parent order.
- **W3.2** Every occurrence of the old personal email inside committed FILE CONTENT, in every commit, becomes the text "<email redacted>". This includes other agents' reports. This is a one-time exception to "never edit another agent's report". Redaction is the only permitted change to those files.
- **W3.3** The GitHub remote is NOT force-pushed. After local verification, Marcus deletes the GitHub repository and recreates it empty, private, with the same name. Then the rewritten master is pushed through `tools/push.sh` as normal. No `--no-verify`, no hand-written marker, no force push.
- **W3.4** This repository's local `git config user.email` becomes the no-reply address, so future commits never carry the personal email.

Implementation: all eight existing commits and both local branches rewritten and verified; one report file redacted by exact byte replacement. Earlier WordFlow SHA citations are pre-rewrite; the old-to-new mapping is in `docs/verification/2026-10-05_codex_history_email_rewrite.md`. The additional final commit records this ruling and report. Marcus confirmed the empty-private-repository recreation and email settings with `done`; the normal `tools/push.sh` push passed, and a fresh GitHub clone passed the identity/content/reachable-object privacy checks. No force push or gate bypass was used.
