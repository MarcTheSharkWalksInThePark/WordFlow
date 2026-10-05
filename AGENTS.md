# WordFlow Agent Operating Rules

Shared rules for every agent that works in this repository: Claude Code, Codex, Sol, and the
claude.ai orchestrator. `CLAUDE.md` adds Claude-specific notes and defers to this file.

- Local path: `C:\Users\Marcu\Documents\WordFlow`
- Remote: `https://github.com/MarcTheSharkWalksInThePark/WordFlow` (private). It is the backup;
  nothing is deployed from it.
- Default branch: `master`.

## Rulings in force

- **RULING W1** (Marcus, 2026-10-05; `docs/DECISIONS.md`): this standalone repository is canonical
  for WordFlow from its first commit. The WordFlow copy inside MarcDeck is frozen and will be
  removed under a MarcDeck ruling. WordFlow fixes go to this repository only.
- **On the MarcDeck side**, MarcDeck records the same thing as its "WORDFLOW CANONICAL REPOSITORY"
  ruling (MarcDeck `docs/DECISIONS.md`). WordFlow's files and routes inside MarcDeck are frozen
  until a MarcDeck removal ruling. Never "fix" WordFlow in MarcDeck.
- **RULING 59** (MarcDeck, local server exposure; carried here unchanged). These protections must
  **not be weakened, removed or reordered without a new ruling**:
  - **Bind.** `127.0.0.1` by default. Any other interface only by an explicit shell `HOST`, which
    prints a warning (`server.js` `listenHost`, `startupWarning`).
  - **Static allowlist.** Exactly `index.html`, `styles.css`, `app.js` and
    `assets/wordflow-mark.svg`; `/` aliases `index.html`. No wildcard, no directory entry
    (`STATIC_FILES`).
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
  - `listenHost` and `checkHostHeader` are decided before `loadLocalEnv()`, so an env file cannot
    change the bind or the check.

  `tests/server_exposure.test.js` (32 checks) and the 46 registered mutations in
  `tools/r59.spec.json` (45 killed, M9 the proven equivalent) guard them. A change that touches
  them needs the mutations re-run, per RULING 55 part 3: exact transform, target suite, and SHA-256
  before, mutated and restored.

## Never

- **Never open, print, copy or commit any `.env` file.** WordFlow needs no secret. Tests use
  synthetic dummy values in temporary directories only. `.env*` is ignored by Git, and
  `tools/push.sh` refuses if one is ever tracked.
- Never push except through `tools/push.sh`. Never use `git push --no-verify`. Never write the push
  marker (`$GIT_DIR/WORDFLOW_PUSH_OK`) by hand.
- Never deploy or expose WordFlow beyond localhost. **Hosting needs its own Marcus ruling and its
  own verification first**; `HOSTING.md` lists what that work must cover. It is a list of
  requirements, not an implementation.
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

### Python

- Text uploads need no Python. PDF and DOCX need Python with the exact pins in
  `requirements.txt`: `pypdf==6.10.0` and `python-docx==1.2.0`.
- `resolvePythonPath` (`server.js`) tries `$PYTHON`, then Codex's bundled runtime
  (`%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`),
  then `python`. **A `PYTHON` that is not an existing full path is silently skipped.**
- On Marcus's PC today, only the Codex runtime has both libraries; system `py` (3.14.5) has
  neither. That works, but it is fragile (review finding L1). The durable local setup, with the
  user's approval:

  ```powershell
  py -m pip install -r requirements.txt
  $env:PYTHON = (py -c "import sys; print(sys.executable)")
  ```

## Test and push

```powershell
npm test                                                    # 32 regression cases + 32 exposure checks = 64
npm run mutations -- --out docs/verification/results/mutations.json
bash tools/push.sh                                          # the only way to push
```

- `npm test` prints `SKIPPED` and still exits 0 when the selected Python lacks the libraries.
  `tools/push.sh` treats any skip as a refusal.
- **Push gate.** `tools/push.sh` is fail-closed. It refuses unless:
  - the hook is active;
  - the branch is `master`;
  - the tree is clean;
  - no `.env*` is tracked;
  - `master` is not behind `origin/master` (a failed fetch refuses);
  - `npm test` passes with no skip.

  It then pushes through a single-use marker, verifies the remote sha and appends to
  `tools/push.log`. Commit that log with your next change.
- **The hook travels with the repo, but git must be told to use it, once per clone:**
  `git config core.hooksPath .githooks`. `.githooks/pre-push` refuses any push that lacks the
  marker, pushes a ref other than `master`, or pushes a sha other than the marker's.
- **Parity against the frozen MarcDeck copy** (only when server behaviour is in question) uses a
  scratch clone of MarcDeck, never its real checkout. See README.

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

- **[Needs Human Input] RULING W3:** local history rewritten and verified; Marcus must delete/recreate WordFlow on GitHub empty and private, enable email privacy/push blocking, then reply `done`. Push waits for confirmation; no force push. SHA mapping: `docs/verification/2026-10-05_codex_history_email_rewrite.md`.

From Codex's build report (`docs/verification/2026-10-05_codex_wordflow_standalone.md`) and CC's
review (`docs/verification/2026-10-05_cc_review_wordflow_standalone.md`):

- **[Needs Human Input] Marcus to confirm** the seven dispositions the review flagged in
  `docs/DECISIONS.md`:
  - #3: is the never-committed pre-split regression run enough?
  - #4: server strategy;
  - #5: history method;
  - #6: paths, with screenshots and `.pyc` dropped;
  - #7: keep `loadLocalEnv`;
  - #11: exact pins, and keep the Codex-runtime path;
  - #12: Node floor 24.16.0.
- **[Needs Human Input] Licence.** `LICENSE` reads "TO BE DECIDED BY MARCUS".
- **[Needs Human Input] Hosting.** Policy, allowed hosts, `/api/read` SSRF rules, limits, logging
  and deployment approval (`HOSTING.md`).
- **MarcDeck side.** Removing WordFlow from MarcDeck, what MarcDeck serves at `/` afterwards, its
  own upload extractor, and retiring its guard and fence. All need MarcDeck rulings.
- **Marcus's ruling, relayed by the orchestrator:** checked archived ref commits 2026-10-05; moved to quarantine for Marcus to delete; report in the vault.
- **Unverified:** Windows 8.3 short names; Node versions below 24.16.0.
- **Review findings, not blocking:**
  - **L1:** Python silently depends on Codex's runtime; a non-path `PYTHON` is ignored; HOSTING.md
    omits the interpreter.
  - **L2:** extractor and fetch errors, including Python tracebacks with server paths, are returned
    to the client.
  - **L3:** `npm test` exits 0 with skips (the push gate now refuses skips).
  - **L4:** two HOSTING.md anchors are 1-3 lines early.
  - **L5:** the listener-inventory check is Windows-only.
  - **L6:** M1 and X10 are killed by a setup abort.
  - **L7:** smoke uses Codex's bundled Playwright.
  - **L8:** commit identity is Marcus, with the agent in the trailer.
- **Resolved on 2026-10-05:**
  - the GitHub repository (name `WordFlow`, private, backup on GitHub);
  - the independent reviewer (CC: CLEAR);
  - the WordFlow push gate (`tools/push.sh` and `.githooks/pre-push`).

## Updates

### 2026-10-05 - claude-code

Created with the push gate, the GitHub remote and the vault project note. Open items are carried
from the Codex build report and the CC review.
