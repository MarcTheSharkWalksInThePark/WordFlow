# Independent review: standalone WordFlow build (Codex) - 2026-10-05

Author: **Claude Code (`claude-opus-5-5`, effort set to high by the session prompt; not self-verifiable)**.
Role: one-round independent review. Codex's report
(`docs/verification/2026-10-05_codex_wordflow_standalone.md`) was treated as claims to check.
Nothing was fixed. Branch: `review/standalone`, from `main` at `b8b1892`, local only.

**Verdict: CLEAR** for RULING 59 and RULING W1 scope. History, isolation, parity, the R59
protections, the 64 tests and the requested mutations all reproduce independently. Eight findings
outside that scope are listed for later (section 8). Seven of the 19 dispositions read as settled
without a quoted Marcus instruction; they are flagged for Marcus to confirm (section 7).

## 0. Setup and boundaries

- **WordFlow repo.** `main` = `b8b18928bfc2393871af04b025fc3e83f3607d32` is the only ref. It has no
  remote, no stash and no non-sample hooks. The working tree was clean before this branch.
- **Old side for parity.** A `git clone --no-local --no-checkout --single-branch --branch master`
  scratch clone of MarcDeck, checked out detached at `11092e186e8805ac0555e8dc1baf43fb8036b074`. It
  held one synthetic `.env.local` (`WORDFLOW_REVIEW_DUMMY=synthetic-not-a-secret`) and no
  `node_modules`.
  - `server.js` and the five carried files are blob-identical between `11092e1` and MarcDeck's
    current `master` (`7ded449`).
- **New side.** A fresh `git clone` of the WordFlow repo (status clean). Tests, parity and mutations
  ran there, not in `C:\Users\Marcu\Documents\WordFlow`.
- **Secrets.** No real `.env` file was opened, copied or printed. Node `v24.16.0`. Nothing was
  installed.
- **Scratch.** The review scripts live in the session scratchpad. Two result files are committed
  beside this report: `results/cc-review/parity.json` and `results/cc-review/mutations.json`.

## 1. History - VERIFIED

| Check | Result |
|---|---|
| `8920acb` vs MarcDeck `6927f18`, raw commit objects | Identical except the `tree` line: author and committer `Marcus <<email redacted>> 1781032494 +0200` (2026-06-09 21:14:54 +0200), message `baseline`. No parent. |
| `8920acb` tree | Exactly 5 paths. Each blob ID equals `6927f18`'s, and equals MarcDeck `master`'s, for index.html `f78834f4`, app.js `f0a49286`, styles.css `75c799cc`, assets/wordflow-mark.svg `cb445d98`, extract_text.py `ebb51b45`. |
| Same five paths in `b8b1892` | Same blob IDs (unchanged). |
| `b8b1892` | Parent `8920acb`; author and committer Marcus, 2026-10-05 18:32:35 +0200; trailer `Agent: Codex (gpt-6.1-sol, high)`. |
| Working-tree bytes | The parity harness compares the old checkout's and the fresh clone's files byte for byte: 5 / 5 identical. |
| Secrets in history (names only) | Every path in every commit was listed: 30 paths, none named `.env*`, `*secret*`, `*credential*`, `*.pem`, `*.key`, `id_rsa` or `*token*`. A content scan of both commits for secret-shaped strings (`sk-...`, `AKIA...`, `ghp_...`, `xox?-`, private-key headers, assigned `OPENAI_API_KEY`, quoted 16+ char `api_key`) found **none**. Every `.env.local` mention is a request target, a refusal case, a dummy-fixture writer or `loadLocalEnv`'s file list. `fsck --unreachable` reports nothing; there are no dangling objects. The working tree has no `.env*` file. |

## 2. Isolation - VERIFIED

- `server.js` requires Node built-ins only (`node:http`, `node:fs/promises`, `node:fs`, `node:os`,
  `node:path`, `node:child_process`, `node:url`). Tests and tools add only built-ins, the repo's
  own `tests/helpers.cjs`, and `playwright`, which only the optional smoke tool uses.
- Routes are `/api/read` and `/api/extract-file`, then the static handler. There is no other
  pathname. `server.js` contains no "marcdeck".
- The remaining MarcDeck mentions are:
  - documentation;
  - a provenance comment (`tests/server_exposure.test.js:3`);
  - a refusal target `/marcdeck_pptx.js` (`:343`);
  - the helpers' banner regex, which accepts both labels so the old server can start under parity
    (`tests/helpers.cjs:49`).
- `STATIC_FILES` is exactly `index.html`, `styles.css`, `app.js` and `assets/wordflow-mark.svg`.
  `/marcdeck.html` now returns 404, which is the intended separation.

## 3. Parity - REPRODUCED, and headers checked as well

- `node tests/regression.cjs --old <scratch 11092e1> --new <fresh clone>`:
  **`{"mode":"parity","passed":32,"skipped":0,"differences":0}`**.
  - 32 / 32 cases identical; 5 / 5 files byte-identical.
  - The selected interpreter is the Codex runtime, Python 3.12.14, and PDF/DOCX fixtures were
    generated.
  - The network guard recorded 8 events, with 0 non-loopback binds and 0 outbound connections.
- **What the harness does not compare: response headers.** It compares statuses and bodies only
  (`tests/regression.cjs:85`). CC compared headers separately, excluding Date, Connection,
  Keep-Alive and Transfer-Encoding. They are identical for `/`, the 4 static files, HEAD `/`,
  `/.env.local`, `/nope`, `/api/read`, `/api/extract-file` and `//x`. `/marcdeck.html` differs
  (200 -> 404), as intended.
- **Helper changes.** Every top-level function was extracted from both `server.js` files (EOL
  normalised) and compared: **23 of 24 are identical.** `listen` differs in one line, the banner
  label `MarcDeck / WordFlow:` -> `WordFlow:`, as Codex states.
- **Non-function code.** It was read in full.
  - The bind configuration, the 6a switch and the whole request-entry block (B3 -> Host check -> B2
    -> `try`) are textually identical to MarcDeck.
  - The MIME map is trimmed to HTML, CSS, JS and SVG. The other entries are unreachable under the
    4-file allowlist.
  - The MarcDeck imports, constants and routes are removed. The remaining requires, `node:url`
    among them, were already in MarcDeck's `server.js`.
  - **Every justified change is sound.**

## 4. Protections - VERIFIED

- **Present.** Every part is present and is text-identical to MarcDeck `11092e1`:
  - default `127.0.0.1` bind and the HOST opt-in (part 1);
  - the exact 4-file allowlist (part 2);
  - the independent dot/.env guard, applied before normalisation (part 3);
  - the B2 raw-target gate before parsing;
  - B3 duplicate Host -> 400 first, whether the check is on or off;
  - part 6 / 6a / 6b against the bound port;
  - F1 mapped loopback;
  - F8 `serverOptions`.

  The order is `listenHost` < `checkHostHeader` < `loadLocalEnv()` < `createServer`.
- **Tests from a fresh clone: `npm test` exit 0, 64 passed.** The split is 32 regression cases
  (0 skipped) and 32 exposure checks, and the clone stays clean afterwards.
- **The exposure suite against MarcDeck's.** It has the same 32 check labels, except three
  adaptations:
  - two wording changes, one document instead of two;
  - the LAN-connection probe is replaced by a `netstat -ano -p tcp` inventory of the server PID. It
    requires every row to be `127.0.0.1:<port>`, and a missing row also fails.

  On Windows this is at least as strong as before; on other platforms see finding L5.
- **Spec fidelity.** All 46 rows of `tools/r59.spec.json` carry byte-exact copies of their MarcDeck
  source rows' transforms (12 from `r59_2026-10-01`, 10 from Codex `own.spec`, 14 from
  `r59_2026-10-05c.y-replay`, 3 from `r59_2026-10-05b`, 6 from Codex `own-new`, 1 from
  `r59_2026-10-05c`). Every anchor matches exactly once. **"No new re-anchoring" is true.**
- **Independent replay (CC's own runner, RULING 55 part 3 fields).** The baseline gave 32 checks
  passed, and the repo's `server.js` was never written:

  | Mutant | Verdict | Killed by |
  |---|---|---|
  | D1 duplicate-Host check removed | **KILLED** | B3 check; check-off integration (B3 still 400) |
  | N4 B2 after URL parsing | **KILLED** | F7 (`//[`, `http://[` ... -> 404) |
  | N6 requireHostHeader always off | **KILLED** | F8 unit check; check-off integration (Node 400) |
  | M2 allowlist bypassed | **KILLED** | non-listed files -> 404; exact matching |
  | M3 dot guard removed | **KILLED** | F5 encoded `..`; listed-by-mistake dotfiles |
  | M9 dot-prefix only (control) | SURVIVED | the accepted equivalent; the guard is byte-identical to master |

  Every restore was byte-exact (see `results/cc-review/mutations.json`).
- **Codex's full tool**, run in the fresh clone: **46 rows, 45 KILLED, 1 equivalent (M9), 0
  unexpected, 0 errors.** The clone and the original repo's `server.js` are unchanged
  (`6cd5be22...`).

## 5. Python dependency - ASSESSED (outside R59/W1; findings L1-L3)

- **How the interpreter is chosen.** `resolvePythonPath` (`server.js:391`) is unchanged from
  MarcDeck. Its candidates, in order, are `$PYTHON`, then
  `%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`, then
  `python`. **Every candidate except the bare `python` must pass `existsSync`.**
- Measured by evaluating the resolver itself:

  | Environment | Selected |
  |---|---|
  | USERPROFILE set, PYTHON unset (Marcus's PC) | the Codex runtime (3.12.14, pypdf 6.10.0, python-docx 1.2.0) |
  | `PYTHON=py` (a bare command) | **the Codex runtime: PYTHON silently ignored** |
  | `PYTHON=C:/no/such/python.exe` | **the Codex runtime: silently ignored** |
  | `PYTHON=<full path of system Python>` | system Python 3.14.5 |
  | USERPROFILE unset (typical Linux host) | `python` |

- **Does standalone WordFlow silently depend on Codex's runtime? Yes, on this PC.**
  - `py` and `python` both resolve to system Python 3.14.5, which has **neither** pypdf nor
    python-docx. Only the Codex runtime has them.
  - Forcing system Python by a full-path `PYTHON` reproduces what happens if the Codex runtime goes
    away: TXT upload 200; **PDF and DOCX upload 500, and the response body carries the raw Python
    traceback, with server file paths**.
  - With system Python, `node tests/regression.cjs` reports 30 passed and 2 skipped (PDF, DOCX) and
    **exits 0**. "64 pass" therefore holds only on a machine with the Codex runtime or a provisioned
    interpreter.
- **For Marcus locally.** It works today with no action, because the Codex runtime exists. It is
  fragile: a Codex update that moves or replaces that cache breaks PDF/DOCX. The durable local fix
  is README's own recipe: `py -m pip install -r requirements.txt`, then set `PYTHON` to the full path.
  - The README's `$env:PYTHON = (py -c "import sys; print(sys.executable)")` gives a full path, so
    it works.
  - README does not warn that a non-path `PYTHON` is silently skipped.
- **For hosting: not acceptable as is.**
  - On a host without USERPROFILE the resolver falls to `python`, which may not exist (often only
    `python3`).
  - Nothing fails at start-up: the first PDF/DOCX upload gets a 500.
  - HOSTING.md does not mention the interpreter at all. Only DECISIONS.md #11 assigns it to a
    "later hosting owner".

## 6. HOSTING.md and README accuracy

- **Line links.** All 24 `server.js#L...` links resolve to the named construct, for example:
  `checkHostHeader` L16, `maxRemoteBytes` L17, `maxUploadBytes` L18, `STATIC_FILES` L32,
  `createServer` L39, B3 L44, the catch L80, the abort timer L158, `normalizeRemoteUrl` L223 and
  `sendJson` L458.
  - Two point a few lines early: "runExtractor's env" L358 is the `spawn` line, and the `env`
    object is at L359; "runExtractor accumulates stderr" L369 is the stdout listener, and stderr is
    at L372 (L4).
- **Prose claims, checked against the code.** All are accurate:
  - `redirect: "follow"` at L162;
  - no destination classification in `normalizeRemoteUrl`;
  - the 12 s abort, which covers headers and body;
  - 24 MiB upload and 3 MiB remote limits, enforced, with `req.destroy()` on overflow;
  - a temp file removed in `finally`;
  - no extractor timeout;
  - Node's 400 kept while the app check is off;
  - duplicate Host always refused.
- **README.** All checked claims are accurate:
  - the port retry covers the next 20 ports (`port < startPort + 20`);
  - the bind is 127.0.0.1;
  - there are no npm dependencies (`package.json` has none);
  - HOST and PORT are decided before `loadLocalEnv`;
  - text uploads need no Python;
  - the skip messages exist (`tests/fixtures.py`);
  - `WORDFLOW_CHROME` and `WORDFLOW_PLAYWRIGHT_DIR` exist (`tools/chrome_smoke.cjs:11`, `:16`);
  - the smoke's Codex-Playwright default is disclosed.
- **Omissions** (no false claims):
  - HOSTING.md frames the catch and the extractor stderr as a logging risk only. In fact
    `error.message`, including Python stderr, is **returned to the client** in the 500 body (L2).
  - HOSTING.md has no interpreter section (L1).

## 7. The 19 dispositions - seven need Marcus to confirm

The recon's section 3.5 is titled **"Decisions for Marcus"**: all 19 were framed as his. DECISIONS.md
marks several "Settled" and attributes them to "the task", whose text it does not quote. This
review cannot see that task prompt. Where the recon posed an explicit choice, the record shows Codex
choosing.

| # | Codex's disposition | Flag |
|---|---|---|
| 3 | Settled: regression "ran green against old master before creating the new repo", in a disposable harness | **Marcus to confirm.** MarcDeck `DECISIONS.md:639` says "write the WordFlow regression tests BEFORE the split". Codex decided that a never-committed, pre-split run satisfies it, and also what "sufficient" means. That is interpretation of a Marcus ruling. |
| 4 | Settled: independent trimmed server | Marcus to confirm, unless his task named option (a). It matches the recon's LEAN. |
| 5 | Settled: M2 plumbing replay | Marcus to confirm, unless his task named M2 (the report's heading suggests it did). |
| 6 | Settled: five paths; screenshots and `.pyc` dropped | Marcus to confirm. The recon asked him about the 17 screenshots. |
| 7 | Settled: keep `loadLocalEnv` unchanged "for parity" | **Marcus's explicit question** ("Should WordFlow's server keep `loadLocalEnv`?"). It was settled by Codex. |
| 11 | Settled: exact pins; keep the resolver, including the Codex-runtime path | **Marcus's explicit question** (exact or lower bounds; keep or drop the Codex path). It was settled by Codex, and the kept path is finding L1. |
| 12 | "Implementation choice": `engines >=24.16.0` | **Marcus's explicit question** (18 or 24). It was settled by Codex; the choice is defensible (the tested version). |

Not flagged:

- #1, #2, #8, #9, #14-#17 and #19 are left open for Marcus.
- #10 and #18 are scoped "for this task".
- #13 rests on Marcus's RULING 59.

## 8. Findings (numbered; none blocks R59 / W1)

- **L1 - The Python interpreter silently depends on Codex's runtime.**
  - On this PC, PDF/DOCX work only because the Codex cache exists.
  - A `PYTHON` that is not an existing full path is silently ignored.
  - On a host without USERPROFILE the fallback is `python`, which may be absent.
  - HOSTING.md omits the interpreter requirement.
- **L2 - Extractor and fetch errors reach the client verbatim.** The request catch sends
  `error.message`, and for PDF/DOCX that is the extractor's stderr, so a Python traceback with
  server paths reaches the browser. This is pre-existing in MarcDeck, and HOSTING.md frames it as
  logging only.
- **L3 - `npm test` passes with skips.** Without the libraries the run exits 0, with 2 PDF/DOCX
  skips. They are explicit, not silent, but the "64 pass" claim depends on the machine.
- **L4 - Two HOSTING.md anchors land 1-3 lines early** (L358 -> env at L359; L369 -> stderr at
  L372).
- **L5 - The listener-inventory check is Windows-only.** Elsewhere it reduces to the bound-address
  assertion from the start-up line.
- **L6 - M1 and X10 are killed by a setup abort.** The test's guard refuses the wildcard bind, so
  the kill is a server crash rather than a failed assertion. It is sound, because the crash is
  exactly the property under test. But any start-up crash would also count, and only Codex's
  runner records the `safetyWitness` that distinguishes the two.
- **L7 - The smoke tool defaults to Codex's bundled Playwright.** This is disclosed in README.
- **L8 - Commit identity.** `b8b1892` is authored as "Marcus", because it uses the repo's git
  identity; the `Agent:` trailer identifies Codex. That matches the MarcDeck convention. Recorded
  for provenance only.

## 9. Not checked

- The Chrome smoke was not re-run.
- Codex's pre-split baseline run (`results/pre-split-baseline.json`) was not re-run as a separate
  pre-split event. The parity run against `11092e1` covers the same 32 cases.
- Windows 8.3 short names were not checked.
- The verbatim text of RULING W1 could not be checked against a source outside this repo.
- Codex's task prompt was not available, so section 7 flags rather than rules.
