# WordFlow Agent Operating Rules

Shared rules for every agent that works in this repository: Claude Code, Codex, Sol, and the
claude.ai orchestrator. `CLAUDE.md` adds Claude-specific notes and defers to this file.

- Local path: `C:\Users\Marcu\Documents\WordFlow`
- Remote: `https://github.com/MarcTheSharkWalksInThePark/WordFlow` (public; Marcus launched 2026-10-06).
  After review and connection, Cloudflare's Git integration deploys master.
- Default branch: `master`.

## Rulings in force

- **RULING W1** (Marcus, 2026-10-05; `docs/DECISIONS.md`): this standalone repository is canonical
  for WordFlow from its first commit. The WordFlow copy inside MarcDeck is frozen and will be
  removed under a MarcDeck ruling. WordFlow fixes go to this repository only.
- **RULING W2** (Marcus, 2026-10-05, relayed; recorded verbatim 2026-10-06 in
  `docs/DECISIONS.md`): free public STATIC hosting on Cloudflare; same-origin URL Function;
  browser PDF/DOCX; licence settled; remove env loader and Python; pinned vendoring approved.
  W2 authorizes only exact named additions to the R59 static allowlist. Build work stays on
  `feat/static-hosting`, unmerged and unpushed, pending CC review. Marcus controls visibility.
- **RULING W4** (Marcus, 2026-10-06; `docs/DECISIONS.md`): accepts inherited profile paths,
  requires Node-only tests plus stamped pre-merge browser parity, confirms the proxy/file policy,
  settles email history via W3, defers F1 until after launch and approves the exact privacy text.
- **On the MarcDeck side**, MarcDeck records the same thing as its "WORDFLOW CANONICAL REPOSITORY"
  ruling (MarcDeck `docs/DECISIONS.md`). WordFlow's files and routes inside MarcDeck are frozen
  until a MarcDeck removal ruling. Never "fix" WordFlow in MarcDeck.
- **RULING 59** (MarcDeck, local server exposure; carried here unchanged). These protections must
  **not be weakened, removed or reordered without a new ruling**:
  - **Bind.** `127.0.0.1` by default. Any other interface only by an explicit shell `HOST`, which
    prints a warning (`server.js` `listenHost`, `startupWarning`).
  - **Static allowlist.** W2 expands the original four names to the 197 exact site and vendored
    filenames enumerated in `STATIC_FILES`; `/` aliases `index.html`. No wildcard or directory.
    Never add repository sources, fixtures or environment files. The production build copies
    this same list, plus only Cloudflare's `_headers` and `_routes.json` configuration.
  - **Dot guard.** Dotfiles and `.env*` are refused even if listed. The guard runs on the
    once-decoded path before normalisation (`isRefusedStaticPath`, `resolveStaticPath`).
  - **B2.** A request target that does not start `/`, or that starts `//` or `/\`, gets 404 before
    any URL parsing.
  - **B3.** More than one Host header field gets 400, first, whether or not the Host check is on.
  - **Host check (parts 6, 6a, 6b).** While bound to loopback, Host must be `localhost`,
    `127.0.0.1` or `[::1]` at the BOUND port; at bound port 80 the portless names are accepted too.
    Anything else, a missing Host included, gets 403. It is off only for a non-loopback HOST, and
    the warning says so (`checkHostHeader`, `isAllowedHostHeader`).
  - **F8.** Node's `requireHostHeader` is on exactly when the app's Host check is off
    (`serverOptions`).
  - `listenHost` and `checkHostHeader` are decided from the shell before routing. W2 removes
    `loadLocalEnv()` entirely; no environment file can change the bind or the check.

  `tests/server_exposure.test.js` (32 checks) and the 46 registered mutations in
  `tools/r59.spec.json` (45 killed, M9 the proven equivalent) guard them. W2 adds six killed
  proxy mutations; W4 adds six, W5 adds 19 and the live URL fix adds one (78 total, 77 killed,
  one equivalent; Marcus approved the E9 DoH anchor update). A change that touches
  them needs the mutations re-run, per RULING 55 part 3: exact transform, target suite, and SHA-256
  before, mutated and restored.

## Never

- **RULING W5** (2026-10-06): frontend files remain stamped; no CI. The gate verifies committed
  blobs at the pushed sha and refuses hidden-index flags on stamped paths. Review and the written
  never-edit rule protect the stamp. Derive the Pages project suffix automatically from the request
  host and refuse that project plus all subdomains; custom domains use SITE_HOSTNAMES.

- W4.1 accepts existing user-profile paths in tracked files and history; do not scrub or rewrite
  them. NEW or EDITED committed content must not add real user-profile paths: use `<home>` or
  `<vault>`. Existing operational paths in AGENTS.md and CLAUDE.md may stay.
- **Never open, print, copy or commit any `.env` file.** WordFlow needs no secret. Tests use
  synthetic dummy values in temporary directories only. `.env*` is ignored by Git, and
  `tools/push.sh` refuses if one is ever tracked.
- Never push except through `tools/push.sh`. Never use `git push --no-verify`. Never write the push
  marker (`$GIT_DIR/WORDFLOW_PUSH_OK`) by hand. Never hand-write or edit `tests/parity-stamp.json`;
  only a successful `npm run parity` generates the production stamp.
- Deployment happens only by **Cloudflare's Git integration from master, after review**.
  Never deploy from a feature branch or expose the local Node server publicly. Exact project
  settings and the remaining human/live checks are in `HOSTING.md`.
- Never install packages into a machine's Python or Node without the user's approval.

## Run

Node **24.16.0 or later**; there are no npm dependencies.

```powershell
cd 'C:\Users\Marcu\Documents\WordFlow'
npm start
```

Open the URL printed at start-up, normally `http://localhost:8080/`. If 8080 is taken, the next
20 ports are tried; the start-up line names the bound port. Stop with Ctrl+C. `PORT` and `HOST`
are read from the shell only.

### Browser extraction

PDF uses pinned vendored PDF.js; DOCX uses native DecompressionStream("deflate-raw").
All files are parsed in the browser with a 24 MiB cap. Python, its resolver and the upload
endpoint are removed under W2. Preserve committed fixtures and Python goldens.
Any vendoring update needs official npm SRI, per-file SHA-256 and third-party licence notices.

## Test and push

```powershell
npm test                                                    # Node suites only; no skips
npm run parity                                              # browser extraction + Chrome smoke + stamp
npm run mutations -- --out docs/verification/results/static-mutations.json
bash tools/push.sh                                          # the only way to push
```

- W4.2: `npm test` and the push gate use only Node suites, without Chrome or Playwright, and
  fail nonzero on any failure. No skips. `npm run parity` is REQUIRED before merge for changes
  to `file-extractors.mjs`, `vendor/**`, `tests/fixtures/**`, `app.js`, `index.html` or `styles.css`.
  It requires installed Chrome/Playwright and fails closed. Success records their versions and
  all those files' SHA-256 values in `tests/parity-stamp.json`; commit the generated stamp.
  The push gate compares the exact file set and hashes and refuses stale/missing stamps with
  an instruction to run `npm run parity`. Never install packages without Marcus's approval.
- **Push gate.** `tools/push.sh` is fail-closed. It refuses unless:
  - the hook is active;
  - the branch is `master`;
  - the tree is clean;
  - no `.env*` is tracked;
  - `master` is not behind `origin/master` (a failed fetch refuses);
  - `npm test` passes with no skip.
  - committed parity inputs at the pushed sha exactly match the generated stamp;
  - stamped paths carry neither skip-worktree nor assume-unchanged flags.

  It then pushes through a single-use marker, verifies the remote sha and appends to
  `tools/push.log`. Commit that log with your next change.
- **The hook travels with the repo, but git must be told to use it, once per clone:**
  `git config core.hooksPath .githooks`. `.githooks/pre-push` refuses any push that lacks the
  marker, pushes a ref other than `master`, or pushes a sha other than the marker's.
- Historical split parity is retained in the old reports. W2 intentionally removes upload routes
  and refuses private proxy destinations/POST. Extraction parity now uses committed Python
  goldens in `tests/browser-parity.cjs`; never edit MarcDeck's frozen copy for W2.

## Verification discipline

- **Builder and reviewer are different agents.** The reviewer treats the builder's report as
  claims. It reproduces the numbers from committed code and fixtures in a fresh clone, and states
  what it did not check.
- **One verification round** per build unless Marcus rules otherwise.
- **Findings outside the task's ruling scope are logged, not blocking.** Record them in the report
  and in the open items below; they need their own task or ruling.
- **Decisions belong to Marcus.** An agent may make implementation choices but must label them as
  such. Never present a choice the recon put to Marcus as "settled".
- Reports go to `docs/verification/YYYY-MM-DD_<agent>_<topic>.md`, with evidence under
  `docs/verification/results/`. Decisions go to `docs/DECISIONS.md`. Never edit another agent's
  report; answer it in your own.
- Commit trailer: `Agent: <agent> (<model>, <effort>)`.

## Worklogs and vault

- **Vault root:** `C:\Users\Marcu\Documents\AI brain\AI brain`. Follow its `AGENTS.md` and
  `CLAUDE.md`.
- **Project note:** `03_Projects/Active/WordFlow.md`.
- **Per-agent worklogs, with an HH:MM time per entry:**
  - Claude Code: `09_AI_Worklog/ClaudeCode/YYYY-MM-DD_claude-code-log.md`
  - Codex: `09_AI_Worklog/Codex/YYYY-MM-DD_codex-log.md`
  - claude.ai: `09_AI_Worklog/Claude/YYYY-MM-DD_claude-log.md`
  - Sol: `09_AI_Worklog/Sol/`
- Update `04_Knowledge/LLM_Wiki/hot-cache.md` when the current state changes.
- **Never create the dated daily note.** If it is missing, log to the worklog only and say so.

## Open items

From Codex's build report (`docs/verification/2026-10-05_codex_wordflow_standalone.md`) and CC's
review (`docs/verification/2026-10-05_cc_review_wordflow_standalone.md`):

- **Live:** public repository and free Cloudflare Git site at https://wordflow-reader.pages.dev/.
  The 2026-10-06 URL fix is independently reviewed and deployed: all five originally failing
  public sites return 200 HTML; private/self/alias refusals and POST 405 remain intact.
  The temporary diagnostic is removed. See `docs/verification/2026-10-06_codex_live_url_fix.md`.
  Remaining runtime quota/CPU/fail-open/log-session/request-count checks stay unverified below.
- **Dashboard confirmations** (Marcus, relayed by the orchestrator, 2026-10-06): Runtime
  "Fail open" is set; preview branches = None; Web Analytics off.
- **Residual risks:** DNS rebinding between DoH and fetch; unauthenticated clients can exhaust
  quota. **UNVERIFIED:** actual quota/fail-open routing at runtime; maximum-body edge CPU
  (no CPU data yet; Error 1102 would indicate the 10 ms limit); Functions log-session state;
  whether the daily request count excludes static page views.
- **F1:** F1 (W6.1-W6.14) on fix/f1-long-token, CC CLEAR; awaiting Marcus's merge/push decision.
  CC's short R-1 check (docs/verification/2026-10-08_cc_check_f1_r1.md, fresh clone of dd1283c)
  reproduced 505 Node / 0 skips (also with Chrome and Playwright blocked), parity 9 DOCX /
  7 PDF / 884 smoke with 0 errors/uploads and a byte-identical stamp (3ca46f92...ddebdf),
  78 mutations = 77 KILLED + M9 and eight red hand-mutants. Own probes, 984 finished-screen
  cases vs master: 618/618 master-visible last words identical (production-CSS pixels),
  366/366 clipped words inside the frame, no collision, no note/auto-pause, 114/114 scroll-state
  words inert, restart equals master. Informational O-A: on wider frames the inert scroll area
  stays visible around the Finished panel, as W6.14 permits. Merge/push only through
  tools/push.sh and post-deploy `npm run smoke:live` remain Marcus's decision. Master b9d3d9e
  untouched; nothing pushed or deployed. CC scratch folders remain for Marcus to delete.
- **MarcDeck side.** Removing WordFlow from MarcDeck, what MarcDeck serves at `/` afterwards, its
  own upload extractor, and retiring its guard and fence. All need MarcDeck rulings.
- **Marcus's ruling, relayed by the orchestrator:** checked archived ref commits 2026-10-05; moved to quarantine for Marcus to delete; report in the vault.
- **Unverified:** Windows 8.3 short names; Node versions below 24.16.0.
- **Review findings, not blocking:**
  - **L1–L4 closed by W2:** Python removed; generic errors; no npm-test skips; HOSTING rewritten
    without stale line anchors. CC independently verifies this build next.
  - **L5:** the listener-inventory check is Windows-only.
  - **L6:** M1 and X10 are killed by a setup abort.
  - **L7:** smoke uses Codex's bundled Playwright.
  - **L8:** commit identity is Marcus, with the agent in the trailer.
- **Resolved on 2026-10-05:**
  - RULING W3: no-reply history and literal report redaction verified; Marcus confirmed the GitHub recreation/email settings; normal gated push and fresh GitHub clone privacy checks passed. Earlier WordFlow SHAs are pre-rewrite; mapping is in `docs/verification/2026-10-05_codex_history_email_rewrite.md`.
  - the GitHub repository (name `WordFlow`, private, backup on GitHub);
  - the independent reviewer (CC: CLEAR);
  - the WordFlow push gate (`tools/push.sh` and `.githooks/pre-push`).

## Updates

### 2026-10-05 - claude-code

Created with the push gate, the GitHub remote and the vault project note. Open items are carried
from the Codex build report and the CC review.

### 2026-10-06 — Codex

Marcus's W2 task replaces the local-only deployment rule and authorizes exact static additions,
env/Python removal, browser extraction and free Pages Git hosting. Rules above reflect that
ruling; no merge, push, deployment or repository settings change occurred in the build.

### 2026-10-06 — Codex — live URL fix

Workers rejects DoH redirect error mode at Request construction. The reviewed fix uses manual
mode with the unchanged non-2xx refusal. Both agents reproduce 498 Node checks / 0 skips and
78 mutations (77 killed + equivalent M9). All earlier verdicts remain; only E9's anchor changes
with Marcus's approval. Live smoke and diagnostic removal pass. No stamped file changed or
package was installed. Run `npm run smoke:live` after deployments.
