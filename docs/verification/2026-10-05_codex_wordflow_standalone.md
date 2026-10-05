# Standalone WordFlow verification — 2026-10-05

Author: Codex (gpt-6.1-sol, high). The current chat's local turn_context reported exactly that model and effort before meaningful work; no model switch or configuration edit occurred. This report covers the authorized local extraction only.

## Result and preconditions

- Source master: **11092e186e8805ac0555e8dc1baf43fb8036b074**. Verified `git merge-base --is-ancestor 11d266a master` exit 0; source server SHA-256 **3fc09a9f6502ea4c15ad097223cd3a92b5a8395f9296f3aaa39b81794b10f2dd**, matching the merged RULING 59 server. Ruling text, amendments, 6a/6b and merge-condition change were read.
- Destination `C:\Users\Marcu\Documents\WordFlow` was absent before creation. No source files, branches, hooks, index or worktree registration were changed. A pre-existing ` M tools/session_close.log` remains untouched. No GitHub repository, remote, push, mirror refresh or package installation occurred.
- Read the recon 2.1–2.9/3.1–3.5 and located the 2026-08-04 precondition at source `docs/DECISIONS.md:622–639`: **“write the WordFlow regression tests BEFORE the split, not after.”** The 32-case corpus was written in a temporary harness and ran green on old master before destination creation/history extraction. The later task forbids writing these tests into MarcDeck; the disposable-master execution satisfies the regression-before-split requirement without changing MarcDeck.
- Old server ran in a detached worktree of a `git clone --no-local --no-checkout --single-branch --branch master` **scratch clone**, not a worktree registered in the source. Only a synthetic dummy env file existed there, no node_modules, no secrets. Real env files were never opened, copied, printed or requested.
- Brain OS context read from the canonical vault (AGENTS/Home/hot-cache/current-state/index/project/stub). Writeback is constrained by the task to **one Codex worklog entry**, with HH:MM; daily/durable/cache notes are not changed.

## History: M2 exact plumbing replay

Original root commit: **6927f18e36528915257b503f47c4bbc776472984** (Marcus, baseline, 2026-06-09 21:14:54 +0200).
New history commit: **8920acb55b9987cc4835ebc86cca0ec899fadebc**. Tree: **8748f66b6a59c22867121c2266cf55609dcff616**.

Each of the five paths has exactly one `git log --all` commit and a single `git log --follow --name-status` addition in 6927f18. Master blob IDs equal baseline IDs. No renamed paths were inferred.

| Path | Preserved Git blob |
|---|---|
| index.html | f78834f477c31c8b42403e93f7950da8063c8929 |
| app.js | f0a49286e6bc81f40b534d36e4e59d0430e08544 |
| styles.css | 75c799cce213a74e8af6acbac30722ddcb4f182a |
| assets/wordflow-mark.svg | cb445d98c90c8c183f75ab45f330c79cb9e7719d |
| extract_text.py | ebb51b45244b4364f8f757c4ba82dad53e14c43d |

M2 was executed only in the new repository: `read-tree --empty`; for each allowlisted path, read its source blob and `hash-object -w --stdin`, assert the same blob ID, then `update-index --add --cacheinfo 100644,<blob>,<path>`; `write-tree`; `commit-tree` with the **exact raw author/committer identities, timestamp/timezone and original message**; set main; checkout-index. No parent is added. The replay commit's metadata/message equal the original byte-for-byte after the changed tree line. It contains exactly five paths, count 1, and fsck passed. No MarcDeck/server history, screenshots, pyc or env paths were imported. The follow-up commit carries this report and an Agent trailer; the historical baseline message is preserved unchanged by design. Its final SHA is obtained with `git rev-parse HEAD` (a report cannot include the SHA of the commit containing itself).

## Files, dependency and recon claim verification

Entry-point inspection confirmed the only local front-end references are app.js/styles.css/wordflow-mark.svg; no CDN or CSS url/import/font-face. app.js calls the two WordFlow APIs, retains its direct browser-fetch fallback and the same localStorage key. All five carried files are byte-identical to old master's checkout. Their served responses match too. CRLF attributes preserve those checkout bytes and registered multiline mutation anchors in future clones; underlying historical Git blobs remain unchanged.

SETUP_GUIDE.md's title and contents identify it as MarcDeck's setup guide; it was not copied. Screenshots/pyc from recon are omitted. New package.json uses native Node only, npm start, test/parity/mutations/optional smoke; **no npm dependencies or lockfile**. Only the optional smoke harness uses the already-existing external Playwright installation. Node **24.16.0** was executed; engines conservatively requires that version or later, without claiming an older Node floor.

Selected Python was verified by evaluating the unchanged resolver and executing it: **C:\Users\Marcu\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe**, **3.12.14**, **pypdf 6.10.0**, **python-docx 1.2.0**. Both are pinned exactly in requirements.txt. PDF and DOCX extraction succeeded; no skips. The Codex-cache fallback is retained for parity, documented as a portability decision for hosting. No third-party package was installed.

The recon's shared-helper partition was checked against current source reachability: only the two handlers plus their transitive file/buffer/multipart/extractor/response helpers are present. All runtime require specifiers are Node builtins; no MarcDeck imports/routes/handlers remain. The historical claim that carried helper logic is stable was also compared directly to 6927f18 with EOL normalization, for all 16 original WordFlow/shared functions. `git log -L` now attributes 21879ea to resolvePythonPath because of the adjacent static-security hunk; its actual function text is unchanged. Original bind/static/Host infra changed under R59, so the recon's pre-R59 exposure and line-number claims are not treated as today's behavior. No claim about external ZIPs, firewall reachability or untracked worktrees was used.

## Every carried helper and change

Source lines below refer to master 11092e1, new lines to this server. Exact span hashes are in [provenance.json](results/provenance.json).

| Helper | Source line | New line | Change |
|---|---:|---:|---|
| listen | 197 | 87 | Only startup label: MarcDeck / WordFlow -> WordFlow |
| startupWarning | 219 | 107 | Byte-identical |
| serverOptions | 229 | 114 | Byte-identical |
| isAllowedHostHeader | 235 | 118 | Byte-identical |
| isLoopbackHost | 243 | 125 | Byte-identical |
| loadLocalEnv | 249 | 131 | Byte-identical |
| readRemoteUrl | 268 | 150 | Byte-identical |
| extractUploadedFile | 300 | 182 | Byte-identical |
| normalizeRemoteUrl | 1899 | 223 | Byte-identical |
| readLimitedText | 1911 | 235 | Byte-identical |
| readLimitedBuffer | 1931 | 255 | Byte-identical |
| readMultipartFile | 1968 | 283 | Byte-identical |
| parseMultipart | 1979 | 294 | Byte-identical |
| parsePartHeaders | 2009 | 324 | Byte-identical |
| extractDispositionValue | 2021 | 336 | Byte-identical |
| decodeUploadedText | 2029 | 344 | Byte-identical |
| sanitizeFilename | 2035 | 350 | Byte-identical |
| runExtractor | 2039 | 354 | Byte-identical |
| resolvePythonPath | 2076 | 391 | Byte-identical |
| serveStaticFile | 2109 | 410 | Byte-identical |
| resolveStaticPath | 2140 | 439 | Byte-identical |
| isRefusedStaticPath | 2157 | 454 | Byte-identical |
| sendJson | 2161 | 458 | Byte-identical |
| sendText | 2180 | 466 | Byte-identical |

**23 of 24 functions are byte-identical.** The only function change is listen's product label: `MarcDeck / WordFlow:` becomes `WordFlow:`, because this server is standalone WordFlow. Bind address, retry limit, actual-port banner fields, stale-callback guard and warning remain identical. No extraction, multipart, URL, buffer or Python resolver logic changes.

Outside functions, only separation changes were made: remove MarcDeck imports/constants/routes/functions, narrow the static set to **index.html, styles.css, app.js, assets/wordflow-mark.svg** (`/` still aliases index.html), and trim unreachable MIME entries to HTML/CSS/JS/SVG with the same values. loadLocalEnv and its call/order are retained: shell HOST/PORT are decided before env loading, as before. No env file crosses repositories.

All R59 protections retain behavior: default loopback bind; explicit HOST opt-in and identical non-loopback warning; exact static allowlist; independent dot/.env guard; percent-decode once before guard then normalization; B2 raw-target gate before parsing; duplicate-Host 400 first regardless of check mode; 6a bound-loopback Host enforcement; 6b portless names only at bound 80; Node requireHostHeader complementary to the app check. The backslash-leading target still gets Node's inherited **400**, not a manufactured 404.

## Parity and tests

[pre-split-baseline.json](results/pre-split-baseline.json): **32 passed before split, 0 skips**. [parity.json](results/parity.json): **32 requests identical**, plus **5/5 files byte-identical**, **0 body normalizations and 0 unexplained differences**. Only transport headers such as Date/Connection/chunk framing are outside the comparison; statuses and complete decoded HTTP body bytes are exact. Requests use the same fixture origin and fixture bytes for both servers, so JSON URLs/titles need no normalization.

The corpus covers / and all static files, HEAD/query/encoding, forbidden files, both APIs, missing/invalid URL, HTML/redirect/non-HTML/remote 404/oversized local response, UTF-8/Latin-1/empty/MIME text uploads, synthetic PDF and DOCX (including heading/table content), method/no-file/unsupported/boundary errors. Existing **500 Missing multipart boundary** is explicitly retained; the initial baseline test expectation was corrected after observing it, not the product changed. No real outbound HTTP was used.

Intentional scope differences outside that corpus: MarcDeck routes and its four static files are absent; the startup label is WordFlow; unreachable MIME entries are removed. These are repository separation, not lost WordFlow behavior. No timing fields in response bodies were ignored.

The standalone regression runs the same 32-case corpus without old master. Adapted `tests/server_exposure.test.js` retains **all 32 applicable checks**, passing with zero skips. Adaptations remove MarcDeck front-end/stub requirements, use the WordFlow banner, select a fixture repo for mutations, and replace the LAN connection probe with loopback address plus Windows listener inventory. The test-only preload prevents any unsafe bind before the kernel sees it; check-off behavior is exercised by redirecting only TEST-NET HOST 192.0.2.1 to loopback. Both the original intended bind policy and actual bound address are verified. All static/encoding/traversal/method/Host/port-retry/6a/6b/B3/F7/F8 witnesses are retained.

## Mutations — RULING 55 part 3

[tools/r59.spec.json](../../tools/r59.spec.json) carries all **46** registered M1–M12, X1–X10, Y1–Y14, Z1–Z3, N1–N6 and D1 transforms (including the specifically required N4/N6). Source paths and exact commands are recorded. **No new re-anchoring**: all 46 anchors match exactly once. Y11/Y12 retain their already-registered historical re-anchoring notes.

[mutations.json](results/mutations.json): **45 KILLED, 1 accepted equivalent (M9), 0 unexpected, 0 errors**. A green 32-check baseline ran first. Every row records the executable patch, target suite, actual failing checks/exit, and before/mutated/restored SHA-256. Mutations run on copies in disposable fixture roots; the real server is never mutated and each restoration is byte-exact. No timeout or infrastructure error is counted as a kill.

M1 and X10 are killed by a deterministic attempted-non-loopback-bind refusal before socket creation, not by briefly exposing a mutant. Other kills are behavioral/unit/wiring test failures. M9 equivalence is proven again: `/^\.env/i` requires a literal initial dot, so its match set is a subset of `segment.startsWith(".")` for every string. Removing that disjunct cannot change the result. The guard function is unchanged from master, and the suite remains green for this one mutant.

## Chrome smoke

[smoke.json](results/smoke.json), [screenshot](results/smoke.png): installed Chrome **154.0.8037.95**, 1400×950, isolated profile. Browser plugin was absent and CUA inventory offered no Chrome, so the existing bundled Playwright drove the installed Chrome; no browser/package installed. Page identity is WordFlow Reader, meaningful UI renders, no error overlay or console/page errors. File tab -> synthetic fixture.txt upload -> review contains its text -> Use source -> same text loaded and first word **WordFlow** visible in the reader. Screenshot was inspected.

All 5 front-end responses were 200. Server fixtures and requests stayed on loopback. Chrome's 13 background connection attempts reached only a loopback deny-proxy and were dropped, never forwarded; DNS names are mapped to loopback and page interception permits only the WordFlow origin. No outbound connection occurred. Server/browser/proxy were stopped after verification. This is a desktop TXT-upload smoke, not a claim that every browser control or viewport was tested.

## Hosting and open items

[HOSTING.md](../../HOSTING.md) cites the current code and records required SSRF/DNS/redirect enforcement, public allowed-hosts policy, upload/rate/concurrency limits, extractor timeout, HTTPS reverse proxy, content-free logging and secret handling. None is implemented here; deploying or changing local behavior requires the later ruling and verification. The current local security is preserved, not a public-hosting safety claim.

[DECISIONS.md](../DECISIONS.md) records W1 verbatim and maps all 19 recon decisions to settled/partial/open states and owners. Open: Marcus's GitHub name/visibility/licence/backup, WordFlow hooks and independent reviewer, hosting policy and deployment approval, separate MarcDeck removal/root/guard/fence/upload-producer/timing decisions, older Node support and the ZIP copies. Windows 8.3 behavior remains unverified; exact allowlisting rejects unlisted spellings. BUG 61/B1 is MarcDeck-only code and was not imported or fixed.

## Reproduction and final checks

`npm test`; `npm run mutations -- --out docs/verification/results/mutations.json`; `npm run smoke -- --out docs/verification/results/smoke.json --screenshot docs/verification/results/smoke.png` (already-installed Chrome/Playwright). For parity, add `--old <disposable-master-worktree> --new <WordFlow>` to npm run parity. Python fixtures are created at test time; missing PDF/DOCX libraries are explicitly reported.

The final follow-up commit uses trailer **Agent: Codex (gpt-6.1-sol, high)**. Additional final npm-test/fresh-checkout/fsck/secret-path/source-immutability evidence is recorded in results/final-checks.json before commit. No MarcDeck commit guard or push procedure is copied into WordFlow; there is no source commit or push in this task.
