# Delta review: WordFlow post-review fixes (Codex, W4) - 2026-10-06

Author: **Claude Code (`claude-opus-5-5`)**. Role: the independent reviewer for the delta
`6060f66..5480567` only (Codex's W4 fixes to CC's findings). Codex's report
`2026-10-06_codex_post_review_fixes.md` was read only after these checks were planned and run,
and its numbers were treated as claims. Nothing was fixed, merged, pushed or deployed. No GitHub
or Cloudflare setting was touched and nothing was installed. This report and its evidence are the
only additions to the branch.

## Verdict: CLEAR WITH FINDINGS

- **Every claimed number reproduces in a fresh clone** (section 1):
  - 370 Node checks, 0 skips, and the same 370 with Chrome and Playwright made unreadable by CC's
    own method;
  - DOCX 9/9 byte-exact, all 7 PDFs asserted with only the 2 pinned differences, 48 smoke checks;
  - 58 mutations: 57 killed plus M9, with the 52 earlier rows unchanged and the 6 new rows each
    killed by a named assertion;
  - the 3 new goldens byte-identical to the historical extractor.
- **The W4 points are done as ruled.** W4.6 text is exact, W4.3 is append-only, W4.1 adds no
  profile path, W4.4 and W4.5 are recorded, and W4.2 a-g are all present.
- **S5, S7, S8, S9, S10, S11, S12 and S13 are fixed.** S14 is partly fixed (finding N1).
- **No proxy bypass** to a private or special destination. **No personal data added.**
- **No push is accepted that an honest workflow should have refused.** The two acceptances I found
  both need deliberate local tampering (section 2).

The reasons this is not BLOCK, stated plainly so Marcus can disagree:

- The gate accepts a **hand-written stamp**. That is undetectable by design; W4.2e protects it by
  rule only.
- The gate also accepts a committed fixture or extractor change when the working copy is restored
  and flagged `skip-worktree` or `assume-unchanged` (N2). That needs deliberate git plumbing, the
  same class as hand-writing the stamp or `--no-verify`. It is cheap to close.

Should-fix **before the Cloudflare connection** (not before merge):

- **N1:** the self-host guard does not cover the project's other `pages.dev` aliases. Also, the
  default `wordflow.pages.dev` is a third party's live site.
- **N2:** the gate verifies the working copy, not the commit being pushed.

## 0. Setup and boundaries

- **Tip.** `feat/static-hosting` at `5480567be6f38a14dcad68ed3c101cc26b22273f`, as expected. The
  main repository was clean, with `core.hooksPath=.githooks`.
- **Clone.** `git clone --no-local` into the session scratch directory, outside both
  repositories, with `core.hooksPath=.githooks`. `core.autocrlf=true` came from Git for Windows'
  system config; a second harness used `false`.
  - A `git worktree` of the clone at `6060f66` was used for old-versus-new comparisons.
  - All scratch was outside both repositories.
- **Runtimes.**
  - Node v24.16.0.
  - Chrome 154.0.8037.98 (system).
  - Playwright 1.62.1 (Codex's cache, used only by `npm run parity` and my browser scripts).
  - Python 3.12.14, python-docx 1.2.0, pypdf 6.10.0: the existing Codex-runtime interpreter, run
    with `-I`, only for goldens and my synthetic corpus. Nothing was installed.
- **Network.** Cloudflare documentation pages, then three probes:
  - one HEAD and one GET to `wordflow.pages.dev`;
  - one HEAD to an arbitrary subdomain of it;
  - two DoH lookups to `cloudflare-dns.com`.

  Everything else was loopback or injected. GitHub was not contacted.
- **No `.env` file** was opened, printed or copied. No `git push` of any kind was run, not even
  scratch-to-scratch: the harness origin is a `git clone --bare`.
- **Disclosure about my earlier review.** My earlier report says its clone "is deleted at the
  end". **It was not.** The clone at `cdb5b97`, with that session's scratch, was still in the
  earlier session's scratch directory. I copied my own corpus generator from it and delete that
  directory with this review's scratch at the end.

## 1. Reproduced numbers versus Codex's claims

| Claim (Codex) | CC result | How |
|---|---|---|
| `npm test`: 370 = 223 + 97 + 32 + 18, 0 skips | **Reproduced**, exit 0 | fresh clone |
| Same with Playwright and Chrome absent | **Reproduced, identical 370**, by CC's own method | see below |
| `npm run parity`: 9/9 DOCX byte-exact; all 7 PDFs asserted, 2 pinned differences; 48 smoke checks | **Reproduced**. The regenerated stamp is **byte-identical** to the committed one (same Chrome and Playwright, same 225 hashes) | fresh clone |
| 58 mutations: 57 KILLED + M9, 0 unexpected, 0 errors | **Reproduced**. The first 52 definitions are JSON-identical to `6060f66` and their verdicts equal Codex's run | `npm run mutations` |
| E3, E9, E10, E11, W4-stamp and S14 killed by assertions | **Reproduced.** Each is killed by a named `FAIL` check with an `AssertionError`, no timeout; restored hash = before hash | table below |
| 3 new goldens from the historical extractor | **3/3 byte-identical** to fresh output of `git show 3921959:extract_text.py` (blob `ebb51b45`, the same blob as before) | |
| dist identical under `autocrlf` true and false | **Reproduced**: 199 files, identical SHA-256 lists | two harness clones |
| 188 vendored hashes | **Reproduced** (inside the 223) | |

**Absence method (CC's own, not `no-browser-preload.cjs`).** I used Node's permission model:
`NODE_OPTIONS=--permission`, with fs-read allowed only for the clone, the temp directory and the
Node install, and fs-write for the clone and temp. Every Node child inherits it. I also pointed
`USERPROFILE`/`HOME` at an empty folder and unset `WORDFLOW_CHROME`, `WORDFLOW_PLAYWRIGHT_DIR` and
`NODE_PATH`.

- **Inside the sandbox:**
  - the `chrome.exe` stat returns `ERR_ACCESS_DENIED`;
  - Codex's Playwright returns `ERR_ACCESS_DENIED`;
  - bare `playwright` returns `MODULE_NOT_FOUND`;
  - `browser-helper.runtime()` returns `ERR_ACCESS_DENIED`.
- **On the host,** both exist.
- **All four suites passed** with identical counts.

No hooks were placed on module loading. This is runtime-level denial.

**New mutation rows (CC run):**

| Row | Killed by |
|---|---|
| E3 | `FAIL redirect protocol refused by validateTarget file:` (AssertionError: Missing expected exception) |
| E9 | `FAIL DoH redirects refused before following` |
| E10 | `FAIL DoH fails closed: HTTP 500 with otherwise valid answers` |
| E11 | `FAIL DoH fails closed: SERVFAIL with otherwise valid answers` |
| W4-stamp | `FAIL push stamp block refuses changed fixture` |
| S14 | `FAIL self and configured hostname refusal wordflow.example` |

## 2. Gate integrity (W4.2)

### How the stamp works (read from the code)

**Recording.**

- `tools/parity.cjs` runs `browser-parity.cjs` and `static_smoke.cjs`.
- It stamps only if both exit 0, the Chrome versions agree, and the inputs did not change during
  the run.
- `tools/parity-stamp.cjs` hashes the **working-copy** bytes of 4 named files (`file-extractors.mjs`,
  `app.js`, `index.html`, `styles.css`) plus a recursive walk of `vendor/` and `tests/fixtures/`.
  That is 225 files today, equal to `git ls-files`.
- It throws on any symlink entry.

**Verifying.** It parses the stamp and requires all of these:

- `schema === 1`;
- non-empty `chrome` and `playwright`;
- `JSON.stringify(hashes)` exactly equal to a fresh walk.

That catches changed content, additions, deletions, renames and case renames.

**In `push.sh`,** step 7 is `node tools/parity-stamp.cjs || fail ...`, after the clean-tree and
`npm test` steps.

### Harness (no push, no network)

- A scratch clone is put on `master`, and a **bare scratch clone** serves as `origin`.
- The gate is the real `tools/push.sh`, **cut mechanically** at `# Push, through the hook's
  marker.`, plus an "ACCEPTED" echo. So every real check runs (hook, branch, clean tree, `.env`,
  fetch, `npm test`, skip grep, stamp) and nothing can push.
- Each scenario commits its change, so the clean-tree step passes, then runs the gate. It also runs
  the stamp check on its own, to isolate it from `npm test`.
- Full rows: `results/cc-delta-review/gate-integrity.json`.

| # | Attempt | Gate | Stamp alone |
|---|---|---|---|
| A00 | no change (baseline) | **accepted** | pass |
| A01/A33 | fixture bytes; `capture.json` | refused (npm test / stamp) | refused |
| A02 | `file-extractors.mjs` changed | refused (stamp) | refused |
| A03 | vendor file changed | refused (npm test: vendor hashes) | refused |
| A04-A06 | file added in `vendor/`, in `tests/fixtures/`, in a nested fixtures dir | refused (stamp) | refused |
| A07/A08 | golden deleted; vendor licence deleted | refused (npm test) | refused |
| A09-A11 | stamp deleted, truncated, emptied | refused (stamp) | refused |
| A12-A14 | stamp `chrome` emptied; `schema: 2`; same hashes reordered | refused (stamp) | refused |
| A17 | fixture renamed | refused | refused |
| A18/A19 | **case-only rename** (`Fixture.pdf`; vendor `license`) | refused (stamp) | refused |
| A20-A22 | `app.js`, `index.html`, `styles.css` changed | refused (stamp) | refused |
| A23/A24 | proxy-only fix (`lib/read-proxy.mjs`); Function wrapper | **accepted** (correct: still pushable) | pass |
| A31 | `tests/browser-parity.cjs` changed (not stamped) | accepted (by design) | pass |
| L1 | ignored junction inside `vendor/` | refused (symlink check) | refused |
| L2 | `tests/fixtures` replaced by a junction to identical bytes | accepted (harmless: identical content) | pass |
| L3 | committed symlink blob (mode 120000) in `vendor/`, checked out as text | refused (stamp) | refused |
| A34 | `styles.css` rewritten LF in the working copy | refused (step 3: git reports it modified) | n/a |
| **A15** | fixture changed + **hand-written stamp with matching hashes** | refused, **only because `npm test` caught it** | **pass** |
| **A15b** | extractor changed + **hand-written stamp** with real version strings | **ACCEPTED** | pass |
| **A16** | stamp version strings hand-edited | **ACCEPTED** | pass |
| **A25-A27** | fixture or extractor change **committed**, then the old bytes restored in the working copy and the path flagged `skip-worktree` / `assume-unchanged` | **ACCEPTED** (and `npm test` passes on the old bytes) | pass |
| A28/A29 | an **ignored** file inside `tests/fixtures/` (`__pycache__`) or `vendor/node_modules`, nothing committed | **refused** (false refusal) | refused |
| A30 | stamp recorded while an ignored file was present, then the file removed (as on a fresh clone) | refused (false refusal; stamp not portable) | refused |

**Symlinks.** File and directory symlinks fail with `EPERM` here (no Developer Mode), so I used
junctions and a committed symlink blob instead (`core.symlinks=false`).

### CRLF versus LF

- Every stamped file has an explicit attribute: 204 `-text`, 18 `eol=lf`, and the 3 front-end files
  `eol=crlf`. So the stamp's bytes do not depend on `core.autocrlf`.
- With `autocrlf=false`, the gate accepted and the stamp passed.
- dist was byte-identical across both settings.
- The only tracked file whose working copy differs between the two settings is `.gitignore`, which
  is neither shipped nor stamped.

### Can a hand-edited stamp be detected? **No.**

`verify()` checks only that the stamp is internally consistent with the working tree. Anyone with
a shell can call `record()` or edit the JSON, and no local secret could prevent that. What protects
against it:

- the W4.2e rule (AGENTS.md "Never");
- review: the stamp's diff is visible, and a real `npm run parity` also rewrites the three
  post-review evidence files, which a hand-written stamp usually lacks;
- a reviewer re-running `npm run parity` and confirming the stamp regenerates byte-identically, as
  done here.

Only CI (G3 option D) would make it mechanical.

### Skip grep (case-insensitive)

Real `npm test` output passes (A00). Against 21 synthetic lines:

- **Caught:**
  - `"skipped":1` and `"skipped": 12`;
  - `1 skipped.` and `2 skips.`;
  - `SKIPPED: ...`;
  - `1 test skipped`.
- **Slip through:**
  - `"skipped":"1"`, `"skips":1` and `skippedCount`;
  - `1 skip`, `SKIP: ...` and `[SKIPPED] ...`;
  - `(skipped)`, `skipped=1`, `skipped, ...` and `Skipping ...`;
  - TAP `# SKIP`.
- **False refusals:**
  - `skipped: 0`;
  - node:test's summary line `ℹ skipped 0`.

None of this matters today: no suite has a skip path, and each prints `"skipped":0`. But any
adoption of `node --test` would refuse every push. (N4)

### Codex's choice to stamp `app.js`, `index.html` and `styles.css`

- **Is it beyond the ruling?** It goes beyond W4.2c/d's literal list, but it enforces W4.2b's own
  rule, which already makes `npm run parity` REQUIRED before merge for those files.
- **Does it bring back the Playwright dependency?** Only for pushes that change those three files,
  which is exactly when W4.2b already demands parity. A front-end hotfix (for example the quota
  matcher or the privacy text) cannot ship without Chrome and Playwright.
- **Proxy-only fixes stay pushable.** `lib/read-proxy.mjs` and `functions/api/read.js` are not
  stamped (A23, A24 accepted).
- **Recommendation: keep it**, and have Marcus confirm it as a ruling, because it is a Codex
  implementation choice. Narrowing it would make W4.2b process-only for the front end.

## 3. Specific fixes

### S5 (DOCX relationships): fixed, with one new edge-case behaviour change

My corpus was regenerated in scratch: the 9 original cases plus 22 new relationship and path-trick
cases. Each was run against Python, the 6060f66 browser extractor and the 5480567 one.
(`results/cc-delta-review/docx.json`.)

- **The 9 original cases: 9/9 identical** (previously 6/9). `noBreakHyphen`, `document2.xml` and
  the char-style `pStyle` now match Python.
- **Path tricks.** Nothing can leave the package: all reads go to the in-memory ZIP map.
  - `../../../word/styles.xml`, `/word/styles.xml` and `../../word/document.xml` resolve like
    Python's `posixpath.abspath`, and match.
  - **Fail in both:** an absolute URI, `?query` and a malformed `%E0`.
    - The browser throws internally (`URI malformed` on the last), but `extractFile` wraps every
      error as "Could not extract file text", so no raw text reaches the user.
  - **Fail in both:** `TargetMode="External"` on the main part, and no `_rels/.rels`.
  - **Match:** a missing styles relationship (fixed by this delta), and a self-loop relationship.
- **Browser succeeds where Python errors (10 cases).** Each is lenient, not unsafe:
  - backslash targets for the main part and for styles;
  - external styles relationship;
  - duplicate main or styles relationships (Python: "multiple relationships");
  - styles pointing at `document.xml` (Python: RecursionError);
  - case-differing `Styles.xml`;
  - percent-encoded target;
  - a `.dotx` content type;
  - a dangling unrelated image relationship.
- **Pre-existing:** with no core-properties relationship, Python's title is `Word Document`
  (python-docx's default core part) while the browser uses the filename.
- **Behaviour change in this delta (N6).** A ZIP with a duplicate **unrelated** entry name (two
  `docProps/app.xml`) is now refused. 6060f66 and Python both read it.
  - OPC forbids duplicate part names, so this is a malformed package.
  - I do not count it as a feature regression; Marcus may.
- **Limits (Chrome).** The 4096-entry and 64 MiB limits still apply to every relationship-resolved
  part:
  - 4096 entries: OK; 4097: refused;
  - styles claiming 65 MiB: refused;
  - styles or core claiming 1 KiB but inflating to 8 MiB: refused;
  - main 40 MiB + styles 30 MiB (cumulative 70): refused;
  - renamed main claiming 1 KiB and inflating to 70 MiB: refused;
  - an unreferenced 70 MiB part: never inflated, OK.

### S7 (quota matcher): fixed for every row of my table; narrower gaps remain

My section-5 table, re-run against app.js's real `fetchViaLocalReader`
(`results/cc-delta-review/proxy-and-quota.json`):

- **All 9 rows are now correct.** The IPv6 `1027` group and the `#1027` link no longer
  false-positive, and plain-text `error code: 1027` is now detected.
- **Correct on new probes:**
  - `error code: 1027` inside a real JSON article, and a Function JSON error mentioning 1027: both
    not treated as quota;
  - split tags `Error</span> <span>1027` and upper-case `ERROR 1027`: both detected;
  - `Error 10270`: not detected (correct);
  - a Function HTML article saying "Error 1027 explained": readable.
- **False positives (contrived):** a non-quota Cloudflare page whose text mentions "Error 1027"
  (also positive on 6060f66).
- **False negatives:**
  - `Error&nbsp;1027` (**was detected on 6060f66**);
  - `error code 1027` without the colon;
  - `Error: 1027` and `error_code: 1027`;
  - a JSON-shaped Cloudflare error `{errors:[{code:1027}]}`;
  - a bare `1027` body.

  I know of no real Cloudflare page in these forms, and fail-open serves the static marker anyway.
- **Function missing + marker** stays indistinguishable from quota, as Codex discloses. The
  "load one real URL" live check covers it.

### S8: fixed

E3 and E9-E11 are killed (section 1), and all 7 PDFs are asserted:

- `encrypted.pdf` and `hyphenation.pdf` are pinned to exact values;
- the other five need byte parity;
- the count is asserted at 7 PDFs with exactly 2 differences.

### S12: fixed

- The local server sends no `Access-Control-Allow-Origin` on `/`, `/app.js`, a vendor module, or
  an `/api/read` refusal.
- `_headers` adds `  ! Access-Control-Allow-Origin` under `/*`. The Pages headers doc (updated
  2026-08-25) says the `! ` prefix removes "a default header".
- Nothing broke: smoke is 48/48, and the regression suite compares every declared header to the
  real local response.
- That Pages actually strips it is a live check.

### S14 (self-host guard): exact name fixed; aliases not (N1)

I ran `handleRead` with injected DoH and fetch: 17 targets x 3 request hosts x direct/redirect
(102 cases).

**Refused (403, no fetch)** for the exact request host and for configured names, in every spelling:

- upper case;
- one trailing dot;
- `:443` and `:80`;
- `%2E`;
- full-width letters and ideographic dots (via redirect these give a generic 500);
- scheme-less input;
- through a redirect.

**Reached (fetch issued):**

- **any subdomain of the project's `pages.dev` name**: `<hash>.wordflow.pages.dev`,
  `master.wordflow.pages.dev`, `anything.wordflow.pages.dev`, and upper-case/trailing-dot forms
  of them. Whenever the request arrived on a different alias, the exact-host guard does not apply.
- `wordflow.pages.dev..` (only one trailing dot is stripped). Real DoH answers "Invalid query
  name" and Node fetch gives `ENOTFOUND`, so this **fails closed** in practice.
- **IP literals of Cloudflare's edge** (`172.66.x.x`, `2606:4700:...`). Cloudflare is documented
  to refuse direct-IP access (Error 1003); this is unverified live.
- a custom domain that is not in `SITE_HOSTNAMES`.

**Cloudflare's docs** ("Preview deployments", updated 2026-06-03):

- the formats are `<hash>.<project>.pages.dev` and `<branch>.<project>.pages.dev`;
- branch names are lowercased, with non-alphanumerics turned into hyphens;
- "By default, these deployment URLs are public";
- hash URLs stay reachable after later deployments.

That **production** deployments also get hash URLs comes from a third-party guide and common
observation, not the official page: **unverified, live check**. With preview branches set to None,
branch aliases other than production should not exist.

**Is a subdomain still reachable?**

- An arbitrary subdomain returns 404 (probe of `zz9-cc-probe.wordflow.pages.dev`), so only real
  hash or branch aliases serve the site.
- Whether a Pages Function's fetch to its own `pages.dev` zone loops back through the front door
  depends on the `global_fetch_strictly_public` behaviour (compatibility flags page, updated
  2026-09-18). That is **live-only**.

**Recommendation: yes, refuse the whole suffix.** Refuse `host === name ||
host.endsWith("." + name)` for each configured `<project>.pages.dev`, and strip all trailing dots.
Nothing legitimate lives under the project's own suffix.

**`SITE_HOSTNAMES` defaults to `wordflow.pages.dev`, and that name is taken.** It serves HTTP 200
with `<title>WordFlow — Pure Words, Pure Focus</title>`, and its `/api/read` returns HTML, so it is
not this repository. Marcus's project will get another name, so the default currently protects
nothing and blocks a stranger's site. HOSTING.md already says to choose an available name and
record it.

**HOSTING.md overclaims.** It says "The request-host guard already covers preview/request aliases
without relying on this list." It covers only the alias the request arrived on.

### W4.6, W4.1, W4.3, S9, S10, S11, S13

- **W4.6:** the `index.html` paragraph equals the DECISIONS.md text **exactly**, and HOSTING.md
  quotes it verbatim, with `CF-Connecting-IP`/`X-Real-IP`, `CF-Worker` and DoH hostnames.
- **W4.1:** in `6060f66..5480567`:
  - **0** added lines contain a profile path, email, token or key;
  - **0** `.env` files;
  - raw-blob hits are only the inherited, unchanged AGENTS.md operational paths, README's `<home>`,
    and `os.homedir()` code;
  - the 4 new PNGs have no metadata chunks, and the 3 new DOCX fixtures say
    `dc:creator python-docx`;
  - author and committer are no-reply.
- **W4.3:** Codex's earlier report is append-only (+10/-0). The 6060f66 text is an exact byte
  prefix, followed by a dated "Correction — 2026-10-06 (W4.3 / CC S4)".
- **S9:** `git ls-files --eol` shows `.gitattributes`, `404.html`, `LICENSE`, `_headers`,
  `api/read` and `functions/api/read.js` as `i/lf w/lf attr/text eol=lf`. dist is byte-identical
  under both settings.
- **S10:**
  - the `requirements.txt` hint is gone from `push.sh`;
  - README names Codex's cache with `<home>`;
  - the email step is removed (W4.4);
  - both dashboard paths are given;
  - the golden chronology (10 + 2 + 3) is accurate, and I verified it.
- **S11:** README documents DoH hostname disclosure and LAN-only failures.
- **S13:** the dead counter is removed and the grep is case-insensitive (see N4).
- **My earlier report** and its evidence are untouched by the delta.

## 4. Extra mutants (CC, unregistered; `results/cc-delta-review/gate-integrity.json`)

30 mutants were run against a scratch harness: 12 killed, 18 survived.

- **Killed:**
  - the stamp skips `vendor/` or `tests/fixtures/`;
  - the stamp check is made non-fatal;
  - the CLI forgets its exit code;
  - the self guard keeps only the own host, or only the configured names;
  - all four quota-matcher mutants;
  - the styles path and main-rels path are hard-coded (`document2.docx` parity).
- **Survived (test gaps, N3):**
  - **dropping `file-extractors.mjs`, `app.js`, `index.html` or `styles.css` from the stamp list
    (X1-X4)**. No test changes any of these four files, and the first is W4.2c's core file;
  - removing the symlink refusal, the version-field check or the schema check;
  - **disabling the skip grep entirely**;
  - `parity.cjs` stamping after a failed suite, or ignoring input changes during the run;
  - `canonicalHost` not applied (equivalent unless a request host has a trailing dot);
  - extractor: following External relationships, allowing cross-origin targets, removing the
    duplicate-name throw, a hard-coded core path;
  - **all three DOCX resource caps (64 MiB claim, cumulative 64 MiB, 4096 entries)**. These are
    tested nowhere, not even by `npm run parity`. Section 3 shows they work today.

## 5. Findings

Severity: should-fix before launch / later / info. Owner: **M** = Marcus decides, **C** = Codex
fixes. **No blocker.**

### Should-fix before the Cloudflare connection

**N1 - C (M confirms the scope).** The S14 guard misses the project's other `pages.dev` aliases.
- **Repro:** `handleRead` with the request on `wordflow.pages.dev` and target
  `https://<hash>.wordflow.pages.dev/api/read` issues a fetch.
- **Also:**
  - the default `SITE_HOSTNAMES` entry is a third party's live site;
  - HOSTING.md's "already covers preview/request aliases" is wrong.
- **Fix:**
  - refuse the `*.<project>.pages.dev` suffix;
  - strip all trailing dots;
  - set the real project name (and any custom domain) at connection time;
  - correct the HOSTING sentence;
  - add a test with an alias target.

**N2 - C (M on approach).** The gate verifies the working copy, not the commit being pushed.
- **Repro:** A25-A27 (commit a change, restore the old bytes, set `skip-worktree` or
  `assume-unchanged`): the gate accepts. `npm test` is fooled the same way, which is pre-existing
  since the gate was created.
- **Fix (cheap):**
  - step 3 also refuses if `git ls-files -v` shows `S` or lower-case flags;
  - the stamp hashes the committed blobs of the tracked set (`git ls-files` / `git cat-file`)
    instead of walking the disk. That also removes N5.

### Later

**N3 - C. Test gaps.** Repro: section 4.
- Add tests for:
  - changing each of the four named stamp files;
  - the skip grep against real and synthetic lines;
  - `parity.cjs`'s refusal paths, with stubbed suites;
  - the DOCX caps and relationship guards (browser parity fixtures, or a DOMParser-free unit for
    `unzip`).

**N4 - C. Skip grep.** Repro: section 2.
- Replace the denylist with an allowlist: require exactly the four expected summary lines with
  `"skipped":0` or `checks passed`, and refuse anything else.

**N5 - C. Ignored files in stamped directories.**
- Repro: A28-A30. A stray `__pycache__` refuses every push, and a stamp recorded with one is not
  portable.
- Fixed by N2's blob hashing, or by walking `git ls-files`.

**N6 - C (M may weigh in).** Duplicate unrelated ZIP entry names are now refused (p19).
- Python and 6060f66 accepted them.
- Fix: refuse duplicates only for names actually read.

**N7 - C.** Remaining DOCX leniency: 10 cases where the browser reads what python-docx errors on,
plus the pre-existing `Word Document` title difference.
- Document them in README's divergence list; no change needed.

**N8 - C. Quota false negatives.**
- Repro: section 3, S7.
- Accept `&nbsp;`, `error code 1027` and `Error: 1027` (`\berror\W+(?:code\W*)?1027\b`) and keep
  the live check.

### Info

**N9.**
- `npm run parity` rewrites three tracked evidence files, so each run needs them committed or
  reverted.
- `tests/post-review.test.cjs` hard-codes `C:/Program Files/Git/bin/bash.exe` on Windows.

**N10.** CC's own earlier review clone was not deleted, contrary to its report. It is deleted now
(section 0).

### What Marcus decides

- **D-a:** keep or narrow Codex's stamping of `app.js`, `index.html` and `styles.css`.
  - CC: **keep**, and record it as a ruling, because it goes beyond W4.2c/d's text.
- **D-b:** whether rule plus review is enough against deliberate circumvention (a hand-written
  stamp, skip-worktree), or whether to add CI.
  - CC lean: the rule, plus N2's cheap hardening. CI (G3 option D) is the only mechanical answer
    and needs its own ruling.
- **D-c:** confirm N1's scope (refuse the whole project `pages.dev` suffix). CC: yes.
- **D-d:** the Pages project name. `wordflow` is taken; whatever name is assigned must go into
  `SITE_HOSTNAMES` before the connection deploys master.

### What Codex fixes

- N1 and N2 before the Cloudflare connection;
- then N3-N8 at its own pace.

Merge and the gated push may proceed. Once Cloudflare is connected, master is production, so N1
must land before that step.

## 6. Not checked

- **No Cloudflare deploy.** These are unverified:
  - alias reachability;
  - whether production hash URLs exist;
  - same-zone fetch loop-back;
  - Error 1003 for IP literals;
  - `! Access-Control-Allow-Origin` stripping Pages' default;
  - the real 1027 body;
  - edge CPU (S6).
- `tools/push.sh` past its marker write and `git push` (deliberately cut off), and the pre-push hook
  (unchanged by the delta).
- File and directory symlinks (needs privileges here); Linux and macOS checkouts.
- Codex's own `verify.cjs` and `no-browser-preload.cjs` were read but not used as evidence.
- Other browsers; real-world DOCX and PDF corpora beyond 13 fixtures and 31 synthetic DOCX files.
- The Cloudflare doc quotes came through a page-to-text tool; spot-check the live pages for the
  wording N1 relies on.

## 7. Evidence (sanitised, ASCII; `<scratch>` and `<home>` placeholders)

`docs/verification/results/cc-delta-review/`:

- `reproduction.json`: npm test, the absence method and probe, parity, mutations (all 58 verdicts;
  the new six with hashes and assertions), goldens.
- `gate-integrity.json`: harness description, all A-rows and L-rows, CRLF/LF, skip-grep lines,
  the 30 extra mutants.
- `docx.json`: the 31-file differential (Python, new, old) and the limit cases.
- `proxy-and-quota.json`: 102 S14 rows, the DoH double-dot probe, the `wordflow.pages.dev` probe,
  the 24-row quota table (old vs new).
- `hygiene-and-docs.json`: W4.1 scan, W4.6 comparison, W4.3 prefix check, S9 eol, S12 headers.

Scratch scripts, the synthetic corpus and both clones are not committed. They are deleted at the
end.
