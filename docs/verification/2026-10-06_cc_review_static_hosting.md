# Independent review: WordFlow static hosting build (Codex) - 2026-10-06

Author: **Claude Code (`claude-opus-5-5`, effort max, set by Marcus for this session)**.
Role: the one-round independent reviewer. Codex built `feat/static-hosting`; Marcus decides. Codex's
report (`2026-10-06_codex_static_hosting.md`) and `HOSTING.md` were read only after these checks
were planned, and every number in them was treated as a claim. Nothing was fixed, merged, pushed or
deployed, and no GitHub or Cloudflare setting was touched. This report and its evidence are the only
additions to the branch.

## Verdict: CLEAR WITH FINDINGS

- Every claimed number reproduces in a fresh clone:
  - 336 Node checks, 0 skips;
  - 52 mutations: 51 killed, M9 equivalent;
  - DOCX 6/6 byte-exact;
  - PDF: exactly the two disclosed differences;
  - 48 Chrome checks;
  - 188/188 vendored hashes.
- The goldens are genuinely Python's: all 12 are byte-identical to fresh output from the historical
  extractor.
- **No proxy bypass** in 190 adversarial attempts, plus real-socket compression-bomb, slow-drip and
  old-versus-new contract tests.
- **No feature regression** outside W2 that I would call a regression. The reader code is untouched.
  - Two behavioural changes do need Marcus to confirm them as rulings (S4).
  - Three DOCX edge-case divergences exist outside the fixtures (S5).
- **No personal data is added by the two commits under review.**
  - Older tracked files and all history contain Windows user-profile paths.
  - Making the repository public publishes those. That is a decision for Marcus before the
    visibility flip (S3, D1), not something this merge introduces.

The main **should-fix items before launch**:

- **S1:** `npm test`, and so the push gate, depends on Codex's private Playwright cache.
- **S2:** The privacy note does not say that destination sites can see the visitor's IP address.

## 0. Setup and boundaries

- **Branch.** `feat/static-hosting` at `cdb5b979fcbe70518bf5d6ec26c763d38f0f3c05`, which is the
  expected tip. Master is `57ca645`. The main repository was clean.
- **Clone.** `git clone --no-local` into the session scratch directory, outside both repositories,
  with `core.hooksPath=.githooks`. All tests, mutations, smoke and builds ran there. The clone is
  deleted at the end.
- **Runtimes.**
  - Node v24.16.0.
  - Chrome 154.0.8037.98, the system install. Codex's run used .95, so Chrome auto-updated in
    between.
  - Playwright 1.62.1, resolved from Codex's cache (section 2).
- **Python.** The existing Codex-runtime interpreter was used only to regenerate goldens and to
  generate a synthetic DOCX corpus in scratch: Python 3.12.14, pypdf 6.10.0, python-docx 1.2.0.
  Nothing was installed anywhere.
- **Network.**
  - Cloudflare documentation pages (section 5).
  - `registry.npmjs.org`: the pdfjs-dist 6.4.299 metadata and tarball, saved to scratch and read
    in memory for hashing only.
  - Everything else was loopback, with injected DNS and fetch.
- **No `.env` file** was opened, printed or copied.
- **Three disclosures:**
  - A `chrome.exe --version` probe started Chrome briefly; on Windows it does not print a
    version. I stopped it, and no Chrome process from it was left running. If a blank Chrome
    window appeared on Marcus's desktop at about that time, that was this.
  - Running `tools/push.sh` in a sandboxed second clone was declined at the permission prompt and
    was not retried. Section 2 relies on the script's code instead.
  - Extracting the tarball to disk was declined. I used an in-memory read instead.

## 1. Reproduced numbers versus claims

| Claim (Codex) | CC result | How |
|---|---|---|
| `npm test`: 223 + 81 + 32 = 336 checks, 0 skips | **Reproduced:** 223 + 81 + 32, exit 0, no `SKIPPED` line; then DOCX 6, mismatches 0, PDF 7 compared, 2 different | R1. 196 of the 223 are per-asset "served byte-identical" checks, so the count is inflated, not hollow |
| Mutations 52: 51 KILLED, M9 equivalent, 0 unexpected, 0 errors | **Reproduced** in 84 s | R2 |
| P1-P6 kill the six guards | **Reproduced.** Each is killed by a named `FAIL` check with an `AssertionError`, exit 1, no timeout; restore hash = before hash | R2 |
| 46 original rows unchanged | **Reproduced.** JSON-identical to master; the master rows text appears verbatim in the new spec; all 52 anchors are unique | R2 |
| DOCX 6/6 byte parity | **Reproduced** | R3 |
| Goldens are Python's | **12/12 goldens are byte-identical** to fresh output of `extract_text.py` blob `ebb51b45` (3921959; same blob as master and MarcDeck). Ten were committed in 3921959, before any browser extractor existed. `defaults.docx` and `labels.docx` were added in cdb5b97 and are also byte-identical to Python. `encrypted.pdf` reproduces `FileNotDecryptedError` | R3 |
| PDF: 7 compared, exactly 2 differences | **Reproduced.** Five byte-identical; `hyphenation.pdf` body `Wide    spacing` (pypdf, four spaces) versus `Wide spacing` (PDF.js); `encrypted.pdf` Python crash versus the browser's warning. No other difference | R4 |
| Chrome smoke: 48 checks, 24 per viewport, 0 errors, 0 uploads | **Reproduced** at 1400x950 and 390x844: 0 errors, 0 blocked requests, 0 POSTs. My quota-390 and reader-1400 screenshots were inspected | R5 |
| Vendoring: SRI verified, 188/188 hashes | **Reproduced**, and more: the registry integrity and tarball SHA-256 equal the manifest; **all 188 vendored files are byte-identical** to the official tarball entries (554 entries, matching the registry's `fileCount`) | section 6 |
| dist: 197 + 2 = 199 files | **Reproduced**: exact set, 199/199 byte-identical to source, nothing forbidden | section 5 |
| 30 reader + 8 R59 helpers byte-identical | **Reproduced** with `tools/final_static_checks.cjs`. My own function-level diff: 63 of 69 `app.js` functions and all top-level code (state, storage key, event wiring, keyboard) are byte-identical to master | section 3 |

## 2. Where Chrome and Playwright come from (G1-G3)

### G1 - resolution

`tests/browser-helper.cjs` is used by `tests/browser-parity.cjs`, which is the last suite in
`npm test`. `tools/push.sh` step 6 runs `npm test`.

- **Chrome** is taken from the first of these that exists:
  1. `WORDFLOW_CHROME`;
  2. `%ProgramFiles%\Google\Chrome\Application\chrome.exe`;
  3. `C:/Program Files (x86)/...`.

  On this PC it is the **system Chrome install**, which auto-updates.
- **Playwright** is resolved in this order:
  1. `require("playwright")`. This is **not resolvable**: the repository has no node_modules and
     there is no NODE_PATH.
  2. `WORDFLOW_PLAYWRIGHT_DIR`, which is unset.
  3. `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.
     This is **Codex's private runtime cache**: Playwright 1.62.1, pnpm-managed, Codex runtime
     bundle 26.909.12148.

  The cache directory holds two `codex-runtime-install-*` staging folders dated 2026-08-20 and
  2026-09-11, a sign that Codex reinstalls this runtime from time to time.

**Answer:** yes, this is old **L7**. It has moved from the optional smoke tool into `npm test`, and
so into the push gate. It is the same class of hidden dependency as the closed L1.

### G2 - absence, simulated in the clone only

| Scenario | How it was simulated | `npm test` |
|---|---|---|
| Codex Playwright cache gone | `USERPROFILE` pointed at an empty scratch folder | **exit 1**: `Cannot find module '...\.cache\codex-runtimes\...\playwright'` |
| `WORDFLOW_PLAYWRIGHT_DIR` wrong | set to a missing folder | **exit 1**: `Cannot find module` |
| Chrome gone | a `NODE_OPTIONS --require` preload makes `existsSync(*chrome.exe)` false. Windows resets `ProgramFiles` for every 64-bit process, so that variable cannot simulate it | **exit 1**: `Chrome is required; tests fail closed, no skips` |
| both | both of the above | **exit 1** |

None of these skips or passes. The three Node suites (336 checks) still run and pass before
browser parity fails. I did not run `push.sh` (see section 0). Its step 6 is
`if ! npm test ...; then fail "npm test failed"`, so the gate would refuse.

### G3 - risk and options (Marcus decides)

**Risk: medium likelihood over months, high impact on shipping.**

- The failure is fail-closed and safe.
- But if a Codex update moves or drops its Playwright, or Codex is uninstalled, **every push stops**.
  That includes urgent proxy fixes after launch, because Cloudflare deploys only from pushed master.
- A pinned Playwright also drifts against the auto-updating Chrome. The Chrome version already
  changed during this review.

The options:

- **A. Keep it, and document it plainly.**
  - For: zero installs.
  - Against: WordFlow's ability to ship stays coupled to another tool's install state.
- **B. A Marcus-approved, pinned dev install.**
  - What: `playwright-core` 1.62.x as a devDependency, with a committed `package-lock.json`
    holding the integrity hashes. Installed by `npm ci` into the repository's own
    `node_modules`. It drives system Chrome.
  - For: independent of Codex. dist, Pages and `SKIP_DEPENDENCY_INSTALL=true` are unaffected,
    because dist copies only the allowlist.
  - Against: one approved install, a lockfile to maintain, and Chrome drift still possible.
- **C. Make browser parity a separate required pre-merge step, not a gate step.**
  - What: `push.sh` runs only the Node suites. `npm run parity` (and the smoke) becomes a written
    pre-merge requirement for any change touching `file-extractors.mjs`, `vendor/` or the
    fixtures.
  - Optionally, `push.sh` also refuses when those files' hashes differ from the last recorded
    parity pass.
  - For: pushes never depend on Playwright.
  - Against: browser parity relies on process plus a hash check, not on every push.
- **D. GitHub Actions CI** runs the browser suite on pull requests.
  - For: nothing is installed on Marcus's PC.
  - Against: it needs its own ruling (new infrastructure), and does not gate deploys without
    branch protection, which is a repository-settings change.

**CC lean, labelled as a lean: C with the hash check.** Choose B if Marcus wants the gate to stay
self-contained.

## 3. Feature parity (`app.js`, `index.html`, `styles.css`, master..branch)

### How the diff is shaped

- **app.js.** Of 69 functions, 63 are byte-identical after EOL normalisation, and so is all
  non-function code.
  - Changed: `fetchWebsiteSource`, `fetchViaLocalReader`, `loadFromUrl` and `readFile`.
  - Replaced: `requiresServerExtraction` and `extractFileOnServer` became
    `requiresDocumentExtraction` and `extractFileInBrowser`.
- **index.html** adds one privacy paragraph. **styles.css** adds its 9-line rule.
- The storage key `wordflow-reader-session-v1` and the save, read and restore code are unchanged.

### Every feature on the list still works

Evidence is the smoke at both widths unless noted.

| Feature | Status | Evidence |
|---|---|---|
| paste, sample, clear | works | smoke "sample and clear", "paste, title and counts" |
| review: title, counts, warnings, four toggles, raw view, back, use | works | smoke; warnings via `empty.docx` and `encrypted.pdf` |
| uploads: TXT, MD, HTML/HTM, other text (CSV) | works | smoke; code path unchanged (`readFileAsText`, `sourceFromHtml`) |
| uploads: PDF, DOCX | works, now in the browser | smoke and parity. Output differences: section 1 and S5 |
| 24 MiB cap | works, **now also applied to text files** | smoke rejects 24 MiB + 1 B `large.txt` (see change B2) |
| URL reading: `normalizeUrl`, `/api/read` loader, direct-fetch fallback, `sourceFromHtml` | works | smoke: scheme-less input, local proxy, and direct fallback (exercised only after a simulated quota) |
| WPM slider and +/-25 within 100-900; sentence, comma and paragraph pauses; smart pacing; focus letter; context words; word sizes; long-word fitting; 3-2-1 countdown | works; functions unchanged | smoke |
| progress, restart, previous/next, sentence rewind, copy word, sections, finish summary, focus mode, Space and arrows | works; functions unchanged | smoke. The sentence-rewind assertion is weak (`index < 3`) but the function is byte-identical |
| resume compatibility with `wordflow-reader-session-v1` | works | smoke restores a legacy v1 record, including `punctuationPause` |

### Every behavioural change

| # | Change | W2 covers it? |
|---|---|---|
| B1 | PDF and DOCX parse in the browser: PDF.js 6.4.299 and native deflate-raw. `hyphenation.pdf` whitespace differs. An encrypted PDF now shows a warning; on master the status line showed the raw Python traceback. Three DOCX edge cases differ (S5) | yes (W2.5 #11, W2.7). S5 is a quality gap inside it |
| B2 | The 24 MiB cap is now checked before **any** file is read, text included. On master only PDF and DOCX, which went to the server, were capped; a larger TXT/MD/HTML file loaded in the browser | **not in W2's text: Marcus confirm (S4a)**. Impact is tiny: 24 MiB is about 4 million words |
| B3 | PDF/DOCX opened from a `file://` page now fail with the browser's raw import error, instead of "PDF and DOCX need the local server" | unsupported mode; info |
| B4 | Quota handling: a clear free-limit message, reported in preference to the last loader error, with the direct fallback still tried first | yes (W2.2) |
| B5 | `fetchViaLocalReader` reads text and parses JSON itself. A non-JSON 200 now raises "Could not load website", where master raised a SyntaxError; both fall back the same way | equivalent |
| B6 | A visible privacy paragraph | yes (hosting). Wording: S2 |
| B7 | The CSP now applies locally and on Pages. Inline script and style, eval and framing are blocked. The local direct fallback can only reach https: and its own origin | security hardening; Codex choice; info |
| P-a | `/api/read` is GET only (405). Master accepted any method | **not in W2's text (S4b)** |
| P-b | Private and special destinations are refused (403), including localhost and LAN on the local server, which master could read | **not in W2's text (S4b)**. Required for a public proxy |
| P-c | Ports 80/443 only; URL credentials refused; explicit non-http schemes refused. A `host:port` input such as `example.com:443/x` is now read as a scheme and refused | **not in W2's text (S4b)** |
| P-d | Redirects are manual, at most 5, and every hop is revalidated. Master followed Node's default limit of 20 | **not in W2's text (S4b)** |
| P-e | DNS-over-HTTPS to `cloudflare-dns.com` before every fetch, **including from the local server** (new outbound contact; LAN-only and hosts-file names fail) | implementation choice; S11 |
| P-f | A cross-origin `Origin` header gets 403 | implementation choice |
| P-g | Error bodies are generic: six fixed strings | yes (closes L2) |
| P-h | The returned `url` keeps the `#fragment`; master's `response.url` dropped it | trivial |
| P-i | The JSON contract `{url, contentType, body}` / `{error}` is otherwise **identical to master's**: 13 content types and statuses compared byte for byte against master's real server (section 4) | n/a |
| S-a..d | `/api/extract-file` removed; `loadLocalEnv` removed; allowlist 197 plus security headers; catch-all `{"error":"Server error"}` | yes (W2.5 #7, #11; R59 exception; L2) |

**On S4b.** Codex's report calls P-a to P-d "W2's explicit GET-only/SSRF/removal requirements". The
recorded W2 text has no GET-only or SSRF wording. DECISIONS #14 says "explicit proxy policy". I do
not count these as feature regressions, because a public proxy without them would be unsafe and the
review prompt itself demands them. But they are Marcus's to rule on, not Codex's to attribute to him.

## 4. Adversarial proxy review

**Method.** I imported the clone's `lib/read-proxy.mjs` and called `handleRead` with injected DoH
and fetch. Each attempt was classified by an independent oracle: Node's `net.BlockList` over the
IANA special-purpose IPv4/IPv6 space, plus fake DNS names mapped to private addresses. Any outbound
fetch to a private or special target, or with a non-http(s) scheme, would count as **BYPASS**.

**Result: 190 attempts - 0 BYPASS, 132 blocked, 58 allowed-by-design.** "Allowed" means the request
reached only public hosts. For redirect rows that means the first hop. Every private redirect
target got 403 with no fetch.

| Area | Representative attempts | Result |
|---|---|---|
| IPv4 spellings | `2130706433`, `017700000001`, `0177.0.0.1`, `0x7f.0.0.1`, `0x7f000001`, `127.1`, `127.0.1`, `0`, `10.1`, `0xA9FEA9FE` and `169.254.169.254` (metadata), `100.100.100.200`, `192.0.0.192`, `127.000.000.001`, trailing dot, full-width digits, ideographic dots, a tab inside the host, scheme-less, `:80`/`:443`, broadcast, multicast, benchmarking | **blocked**: 403, no DoH, no fetch. WHATWG parsing canonicalises the host before the check |
| IPv6 forms | `[::1]`, expanded loopback; mapped `::ffff:127.0.0.1` and `::FFFF:7F00:1`; compatible `::127.0.0.1`; NAT64 `64:ff9b::` and `64:ff9b:1::`; 6to4 `2002:7f00:1::`; Teredo `2001:0:...`; `fe80::1`; zone IDs `%25eth0` and `%eth0`; `fc00::`, `fd12::`, `ff02::1`, `::`, `100::1`, `2001:db8::`, `3fff::`, `5f00::` | **blocked** (zone IDs are rejected by the URL parser, 400). Public `2606:4700:4700::1111`, `2001:4860:4860::8888` and `2a00:1450:...` are allowed by design |
| names | `LOCALHOST`, `localhost.`, `localhost..`, `Foo.LocalHost`, circled-letter `localhost`, `loca<soft hyphen>lhost`, `.local.`, `home.arpa`, `in-addr.arpa`, `localhost.localdomain`, names whose DNS is 127/169.254/192.168, `127.0.0.1.nip.io`, `router.lan`, `nas.corp`, `intranet` | **blocked**: 403 by suffix, or 403/500 fail-closed via DoH |
| syntax | userinfo and `@` tricks; `127.0.0.1#@public`; backslash-`@` both ways; `:8080`, `:0`, `:22`, `:65536`; `http:\\...`, `http:/...`, `//127.0.0.1`, `\\127.0.0.1\`; `file:`, `FILE:`, `ftp:`, `gopher:`, `data:`, `javascript:`, `ws:`, `blob:`; `%2f` in the host; `localhost:8080` | **blocked**. `https://public.example\@127.0.0.1/` fetches `public.example` with path `/@127.0.0.1/`, which is correct WHATWG behaviour |
| redirects | 302/301/303/307/308 to private literals, decimal/hex IPv4, `file:`, `javascript:`, `data:`, `ftp:`, protocol-relative `//127.0.0.1`, backslash `\\127.0.0.1`, `http:127.0.0.1`, credentials, `:8443`, `localhost`, DNS-private names, mixed DNS, metadata, a malformed `http://[` | **blocked**: 403, or a generic 500. Relative, protocol-relative-public and absolute-public targets are followed |
| hop boundary | exactly 5 redirects | 200 |
| hop boundary | 6 redirects; a loop | 500 `Too many redirects` |
| hop boundary | hop 5 lands on 127.0.0.1 | 403 |
| hop boundary | 300/304/305/306 with a Location to 10.0.0.1 | **not followed** (304 becomes a generic 500) |
| DNS | mixed public/private A; public A plus `::ffff:10.x` AAAA; ULA-only; CNAME to private; dangling CNAME; empty answers | **blocked** (403) |
| DNS | NXDOMAIN; SERVFAIL; DoH HTTP 500; non-JSON; over 64 KiB; transport error; non-array `Answer`; AAAA-only failure | **fail closed** (500) |
| Origin | `null`, foreign, `:443`, uppercase, `http:` | 403 |
| Origin | missing | allowed by design (not authentication) |
| Origin | same | 200 |
| methods | POST, PUT, DELETE, PATCH, OPTIONS, HEAD | 405 |
| headers | cookie, authorization, `x-forwarded-for`, `cf-connecting-ip`, referer, user-agent, custom | **none forwarded**. Outbound headers are exactly `{"user-agent":"WordFlow Reader/1.0"}`; DoH sends `{"accept":"application/dns-json"}`; DoH uses `redirect: "error"`, the target uses `manual` |
| odd shapes | a second `url` parameter (only the first counts); a fragment | as designed |

### Real sockets (loopback fixture; Node's real fetch decompresses)

- **Compression bombs.** 64 MiB expands from:
  - gzip, 65 KB;
  - brotli, 102 B;
  - deflate, 65 KB;
  - `gzip, gzip`, 267 B.

  Every one gets **500 `Response too large` within 22 ms**, with RSS growth of at most 13 MiB.
- **The 3 MiB cap applies to decompressed bytes.** A gzip body that decompresses to exactly 3 MiB
  returns 200 with 3,145,728 characters; one byte more returns 500.
- **Slow responses.** A body dripping one byte every 250 ms, and headers delayed 20 s, both get
  **500 `Website request timed out` at 12.004 s**.
- **Old versus new contract.** Master's real `server.js` and the new proxy were run against the
  same fixture server. Status, `contentType`, `body` and URL path are **identical for all 13
  cases**:
  - HTML, gzip HTML, plain, ISO-8859-1 bytes (both decode as UTF-8), JSON, PDF and PNG bytes,
    octet-stream, no content type;
  - 404, 500, 302, over-cap.

### My own extra mutants (not registered; `tests/proxy.test.mjs` unchanged)

20 mutants: 14 killed and 6 survived.

- **The 6 survivors:**
  - **E3** removes the scheme check in `validateTarget`. That check is the only scheme gate on
    redirect hops, and no test exercises it. It is not exploitable today: `file:`, `data:` and
    `javascript:` have an empty host, which is refused, and `fetch` rejects `ftp:` and `ws:`.
  - **E9-E11** change DoH failure options only.
  - **E17 and E18** are equivalent: the 2001::/23 and 2002::/16 exclusions are redundant with
    the allocation list.
- **E7 and E8** were killed by a TypeError inside a named check, not by an assertion.

### Residual risks (disclosed)

- **DNS rebinding.** The gap between the DoH check and the fetch is real.
  - At the edge, the fetch runs on Cloudflare's network, which cannot reach Marcus's LAN.
  - Locally, an attacker needs Marcus to paste their URL, and the private page is shown only to
    Marcus. GET only, fixed headers.
  - **Acceptable** for a free hobby site.
- **Quota abuse.** Anyone can call `/api/read`; `Origin` is optional.
  - The worst case is proxy reading off until 00:00 UTC. Static pages, files and the direct
    fallback keep working (W2.2).
  - Two aggravations:
    - Cloudflare adds `CF-Worker: <zone>` to every subrequest, so target sites can attribute
      abusive traffic to the project.
    - The Function can fetch its own `/api/read` (the pages.dev address is public), so one client
      request can fan out into several invocations, bounded by URL length.
  - **Acceptable** with that awareness. An optional later hardening is to refuse the project's own
    hostname (S14).
- **Conservative IPv6.** Hosts with any AAAA outside current IANA allocations, or in special global
  anycast space, are refused even when their A record is public. This fails closed, and the direct
  fallback still runs. **Acceptable**; it needs periodic list review.

## 5. Static build and Cloudflare platform

- **The build.** `node tools/build.cjs` makes `dist/` hold exactly the 197 allowlisted files plus
  `_headers` and `_routes.json`.
  - There is no `.git`, `.env`, test, evidence, proxy source, docs or package file.
  - The largest file is `pdf.worker.mjs` at 2.2 MB.
  - A content scan found no personal data. One email-shaped match in `pdf.worker.mjs` is
    obfuscated table data.
- **`_routes.json`** is `{"version":1,"include":["/api/read"],"exclude":[]}`: only `/api/read`
  invokes the Function.
- **The static fallback file.** `api/read` is the `WORDFLOW_FREE_LIMIT` JSON. It is unreachable
  locally, because the route runs first; `/api/%72ead` does serve it locally, which is harmless.

### The three questions (Cloudflare docs, accessed 2026-10-06)

1. **In normal operation, does the Function take precedence over the static file?** **Yes.** Pages
   routing (last updated 2026-09-18) says: "If no Function is matched, it will fall back to a
   static asset if there is one."
   <https://developers.cloudflare.com/pages/functions/routing/>
2. **Under fail-open quota exhaustion, is the static file served?** **Yes, per the docs.** The same
   page says: "'Fail open' means that static assets will continue to be served, even if Pages
   Functions would ordinarily have run first." Workers limits (2026-09-05) agree.
   <https://developers.cloudflare.com/workers/platform/limits/> The live mapping is still
   unverified (F2).
3. **Does the setting exist for Pages as HOSTING.md describes?** **Yes.** The routing page says it
   applies on the Workers Free plan once the daily free allowance is used up (paraphrased). The path
   is **Workers & Pages > project > Settings > Runtime > Fail open / closed**, as HOSTING.md says.

### Quota detection in `app.js` (its real `fetchViaLocalReader`, stubbed responses)

| Response | Shown as |
|---|---|
| HTML `Error 1027` at 429 | free-limit message (correct) |
| the static marker at 200 | free-limit message (correct) |
| a JSON article mentioning `1027` and `WORDFLOW_FREE_LIMIT` | **readable** (no false positive) |
| HTML 1102 page whose Ray ID contains `1027`; CSS `1027px` | generic error (correct) |
| HTML 1102 page showing an IPv6 address with a `1027` group; a `#1027` link | **false positive**: free-limit message for a non-quota error. Rare, and harmless |
| plain-text `error code: 1027` | **false negative**: generic "Website blocked" message. Only matters if fail-open does not apply |
| the Function missing but the static marker present | **false positive**: every URL load would say "free limit". The live check must load one real URL |

**Errors doc (2026-09-30).** 1027 means "Worker exceeded free tier daily request limit" and 1102
means "Worker exceeded CPU time limit". No HTTP status is documented, which confirms HOSTING.md.
<https://developers.cloudflare.com/workers/observability/errors/>

### HOSTING.md step 5 against current docs

| Setting | Docs | Verdict |
|---|---|---|
| `NODE_VERSION=24.16.0` | build image (2026-09-18): any version; v3 default is **22.16.0** | correct and needed |
| `SKIP_DEPENDENCY_INSTALL=true` | same page: `1` or `true` | correct |
| preview branches None | branch build controls (2026-04-21): All non-Production / **None** / Custom | correct |
| compatibility date 2026-10-06, no flags | standard URL parsing: Cloudflare's blog (2022-11-14) says the spec-compliant parser is the default "as of October 31, 2022" (`url_standard`); the flags page (2026-09-18) lists `fetch_standard_url` from 2024-06-03. So the IPv4 canonicalisation the proxy relies on applies at this date | correct. The dashboard path is inconsistent between Cloudflare pages: "Settings > Functions > Compatibility Flags" (get-started, 2026-04-21) versus "Settings > Runtime" (routing, 2026-09-18). HOSTING.md gives no path; add both (S10) |
| Fail open | routing (above) | correct |
| logging off | Pages logging (2026-04-21): "Logs are not stored ... they do not persist"; no persistent toggle documented for Pages | correct |
| `functions/` at the root, output `dist` | get-started: "`/functions` directory is at the root ... not in the static root, such as `/dist`" | correct |
| framework None, root blank, build command, bindings none | not separately doc-checked; standard options; build verified locally | OK |

Nothing in step 5 is wrong, renamed or missing.

Doc links:

- <https://developers.cloudflare.com/pages/configuration/build-image/>
- <https://developers.cloudflare.com/pages/configuration/branch-build-controls/>
- <https://developers.cloudflare.com/pages/functions/debugging-and-logging/>
- <https://developers.cloudflare.com/pages/functions/get-started/>
- <https://developers.cloudflare.com/workers/configuration/compatibility-flags/>
- <https://blog.cloudflare.com/standards-compliant-workers-api/>

### Free-plan limits quoted in HOSTING.md: all match

- **Workers Free:** 100,000 requests/day, reset at midnight UTC; 10 ms CPU; 128 MB; 50
  subrequests; 6 connections; network waits do not count. Worst case is 18 subrequests (6 hops x
  2 DoH + 1 fetch).
- **Functions pricing:** shared with Workers; static requests are "free and unlimited".
  <https://developers.cloudflare.com/pages/functions/pricing/>
- **Pages Free** (2026-09-05): 500 builds/month, 1 concurrent build, 20 minutes, 20,000 files,
  25 MiB per asset, 100 header rules.
  <https://developers.cloudflare.com/pages/platform/limits/>

### Other platform facts

- `_headers` is "not applied to responses generated by Pages Functions"; the Function sets its own
  headers. The `!Header` removal syntax exists (headers doc, 2026-08-25).
  <https://developers.cloudflare.com/pages/configuration/headers/>
- Pages adds `Access-Control-Allow-Origin: *` to static assets by default, and a top-level
  `404.html` disables the SPA fallback (serving doc, 2026-04-21). The default ACAO is harmless for
  public files and removable (S12).
  <https://developers.cloudflare.com/pages/configuration/serving-pages/>

### CPU (indicative only; Node, not Workers accounting)

`handleRead` was run on in-memory streams, 30 times each. Median:

| Body | Median |
|---|---|
| 3 MiB HTML with heavy escaping | **9.9 ms** (p90 13.4) |
| 3 MiB prose | 7.3 ms |
| 1 MiB | 3.5 ms |
| 300 KiB | 1.1 ms |

So near-cap pages may hit Error 1102 under the 10 ms limit. Failure is graceful: the app tries the
direct fallback, then shows a message. F4's live CPU check matters (S6).

## 6. User safety, privacy and licence

- **Headers.** CSP, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy` are
  **byte-identical** between `server.js` and `_headers`.
- **The CSP really blocks inline script.** In headless Chrome:
  - inline `<script>`, inline handlers, `<style>` and `style=""` are all blocked, with
    `securitypolicyviolation` reports;
  - from a real page script under the exact `_headers` CSP, `eval`, `new Function` and string
    `setTimeout` throw `EvalError`. The earlier "allowed" result came from Playwright's
    `evaluate` world, which bypasses CSP;
  - framing the app from another origin renders `chrome-error://` (`frame-ancestors 'none'`);
  - CSSOM styles still apply, which the long-word fitting needs.
- **No third-party requests.** Page load makes 5 same-origin GETs (`/`, `styles.css`, `app.js`,
  and the SVG twice). PDF/DOCX reading adds only same-origin GETs: `file-extractors.mjs`,
  `pdf.mjs`, `pdf.worker.mjs`. There are no POSTs.
- **The privacy note against actual behaviour.**
  - "Files are read in your browser and never uploaded": **true**.
  - "Nothing is stored except your own resume session": **true for the app**; Cloudflare's own
    processing is noted only in HOSTING.md.
  - "fetched through WordFlow's proxy on Cloudflare, with a direct browser fetch as fallback":
    **true but incomplete:**
    - Cloudflare's headers doc (2026-05-05) says: "For Worker subrequests destined for a
      non-Cloudflare customer zone, the `CF-Connecting-IP` and `x-real-ip` headers will both
      reflect the client's IP address, with only the `x-real-ip` header able to be altered."
      <https://developers.cloudflare.com/fundamentals/reference/http-headers/> So **most
      destination sites can see the visitor's IP address even through the proxy**, and
      `CF-Worker` names the zone.
    - The direct fallback contacts the site from the visitor's browser, with an `Origin` header
      and no referrer.
    - Hostnames go to Cloudflare DoH.
  - Codex's "forward no client headers" is true of the code, but HOSTING.md's privacy section and
    the note should say what the platform adds (S2).
- **The licence.** The LICENSE blob equals the W2.4 text recorded in DECISIONS.md exactly: LF, no
  CR, same line breaks. The orchestrator's log (2026-10-05 22:05) records Marcus's choice as "All
  rights reserved" with a no-warranty clause, consistent with it.
- **Notices.** `THIRD_PARTY_NOTICES.md`, `vendor/pdfjs/LICENSE` (Apache-2.0), `cmaps/LICENSE`,
  `LICENSE_FOXIT` and `LICENSE_LIBERATION` all ship in dist. **pdfjs-dist 6.4.299 ships no NOTICE
  file** (checked in the tarball), so Apache-2.0 section 4(d) requires none.
- **Vendoring.** All 188 `vendor/manifest.json` hashes match the files on disk, and every file under
  `vendor/` except the manifest is listed. The registry's `dist.integrity` matches. All 188 files
  are byte-identical to the tarball.

## 7. Public-repository hygiene

The scan covered the two commits in `master..cdb5b97`, the final tree, and every distinct blob
reachable from all local branches. Pattern names and locations only; no secret is quoted.

| Check | Two commits | Final tree | All history |
|---|---|---|---|
| "gmail" / old personal email | **0** | **0** | **0** |
| author and committer emails | no-reply only | - | no-reply only (all refs) |
| tokens and keys (GitHub, OpenAI, AWS, Slack, Google, private keys, JWT) | 0 | 0 | 0 |
| tracked `.env*` | 0 | 0 | 0 |
| secret-shaped assignment | `DUMMY_SECRET` in `tests/server_exposure.test.js`: a synthetic constant from 9ab47e9 | same | same |
| binary metadata | fixtures: "python-docx" and pypdf defaults with synthetic titles; PNGs have no metadata chunks | - | - |
| **Windows user-profile paths (`C:\Users\<user>\...`)** | **none added**: AGENTS.md lines 6, 69 and 128 are unchanged from master | **10 files** (below) | also README.md, `server.js` and `tools/chrome_smoke.cjs` in older commits |
| vault | path references and workflow text only (AGENTS.md, CLAUDE.md, reports); **no vault contents** | same | same |

The ten final-tree files with user-profile paths, all from 2026-10-05 or earlier:

- `AGENTS.md`, lines 6, 69 and 128 (fcc61cf);
- `CLAUDE.md`, lines 7 and 28 (fcc61cf);
- `docs/verification/2026-10-05_cc_review_wordflow_standalone.md`, line 24. That is CC's own
  earlier report (a649443);
- `docs/verification/2026-10-05_codex_history_email_rewrite.md`, line 43, the safety-mirror path
  (b4de13c);
- `docs/verification/2026-10-05_codex_wordflow_standalone.md`, lines 8 and 36 (9ab47e9);
- `docs/verification/results/` (9ab47e9 and a649443):
  - `cc-review/parity.json`, line 334;
  - `mutations.json`, lines 36, 40, 723 and 727;
  - `parity.json`, line 334;
  - `pre-split-baseline.json`, line 303;
  - `provenance.json`, line 3.

**Assessment.** These are low-sensitivity identifiers: a Windows account name derived from "Marcus",
plus folder names such as the vault and the safety-mirror path. There is no contact data, secret or
vault content.

**Why not BLOCK.** This merge publishes nothing new of this kind. The identifiers are in every
historical commit, so a tree-only fix would not hide them once the repository is public. And
publication is Marcus's separate step (W2.3). **The visibility flip should wait for Marcus's D1.**

## 8. Prior findings

- **L1 (Python on Codex's runtime): CLOSED.** No `python`, `spawn` or resolver remains in
  `server.js`, `app.js`, the extractors, the proxy or the Function. `extract_text.py`,
  `requirements.txt` and `tests/fixtures.py` are gone, and the tests need no Python. The same
  dependency class returned as L7 (S1).
- **L2 (raw errors to the client): CLOSED.**
  - The server catch sends `{"error":"Server error"}`.
  - The proxy emits only six fixed strings. A DoH transport error carrying "secret internal path"
    comes back generic, and my mutant E19, which leaks the detail, is killed.
  - Browser extraction errors are generic.
- **L3 (passes with skips): CLOSED.** There is no skip path; missing Chrome or Playwright exits 1
  (G2).
  - The inherited `skipped` counter in `server_exposure.test.js` is dead code: nothing returns
    `"skip"`.
  - `push.sh` greps uppercase `SKIPPED` while that file would print lowercase. Harmless; tidy later
    (S13).
- **L4 (stale HOSTING anchors): CLOSED.** HOSTING.md has no `#L` or `server.js:NN` anchors.

Re-rated:

- **L5** (Windows-only listener inventory): unchanged; later. Hosting does not run the local server.
- **L6** (M1/X10 setup-abort kills): unchanged, sound, witnessed; info.
- **L7** (Codex Playwright): **escalated to should-fix before launch (S1)**.
- **L8** (Marcus identity plus agent trailer): unchanged; info. The identity is now no-reply.
- **F1** (135-character token overflow at the 10 px floor): **agree** that it is a separate reader
  task after launch. `fitDisplayedWord` is byte-identical to master, so the behaviour is inherited,
  and the input is artificial. Later.
- **F2** (1027 status and body): confirmed by the docs; plus the detection gaps above. Later, plus
  the live check (S7).
- **F3** (rebinding, quota abuse, conservative IPv6): acceptable for a free hobby site (section 4).
- **F4** (live deploy, CPU, invocation exclusion, HTTPS headers, logging): agree; my CPU estimate
  makes the CPU check important (S6).
- **F5** (corpora and browsers): now concrete. Three DOCX divergences (S5); other browsers are still
  unverified.

## 9. Findings

Severity: blocker / should-fix before launch / later / info. Owner: **M** = Marcus decides,
**C** = Codex fixes. **No blocker.**

### Should-fix before launch

**S1 (L7 escalated) - M then C.**
- **Finding:** `npm test`, and so `push.sh`, needs Codex's private Playwright.
- **Repro:** section 2, G2.
- **Recommendation:** Marcus picks G3 option A, B, C or D; the lean is C plus a hash check.

**S2 - C, with M approving the wording.**
- **Finding:** the visible note and HOSTING.md do not say that destination sites can see the
  visitor's IP (`CF-Connecting-IP` and `X-Real-IP` per Cloudflare's docs) and the `CF-Worker` zone,
  or that the direct fallback contacts the site from the browser.
- **Repro:** the Cloudflare headers doc quoted in section 6.
- **Recommendation:** add one sentence. Suggested: "Cloudflare and the site you load can see the
  request, including your IP address; if the proxy fails, your browser contacts the site directly."

**S3 - M.**
- **Finding:** Windows user-profile paths in 10 tracked files and in history.
- **Repro:** section 7.
- **Recommendation:** decide before the visibility flip:
  - accept;
  - or scrub the tree and do a W3-style history rewrite;
  - or publish a fresh-history repository.

**S4 - M.**
- **Finding:** behavioural changes not in W2's recorded text:
  - (a) the 24 MiB cap now applies to text files;
  - (b) GET-only; private destinations refused (including localhost and LAN for the local
    server); ports 80/443; no URL credentials; explicit-scheme refusal, including `host:port`
    input; a 5-redirect limit.
- **Repro:** section 3, B2 and P-a to P-d.
- **Recommendation:** Marcus confirms them as rulings, recorded verbatim in DECISIONS.md, or asks
  for changes. CC recommends keeping both.

### Later

**S5 - C. DOCX divergences from python-docx outside the fixtures.**
- **Finding:**
  - `w:noBreakHyphen` gives U+2011 in the browser and "-" in Python (`run.py` `CT_NoBreakHyphen`);
  - a valid package whose main part is `word/document2.xml` is read by Python and fails in the
    browser;
  - a `pStyle` that points at a character style becomes a heading only in the browser.
  - Six other synthetic edge cases matched.
- **Repro:** `extraction.json`.
- **Recommendation:**
  - return "-" for `noBreakHyphen`;
  - follow the `officeDocument` and styles relationships;
  - type-check the style;
  - add these as fixtures with Python goldens.

**S6 - C (live check).**
- **Finding:** at the 3 MiB cap the proxy's own work takes about 10 ms in Node.
- **Repro:** section 5, CPU.
- **Recommendation:** measure at launch; if Error 1102 appears, lower `MAX_BYTES` or reduce the
  JSON work.

**S7 - C.**
- **Finding:** quota detection has a false negative (plain-text `error code: 1027`) and false
  positives (a standalone `1027` in other HTML error pages; a missing Function plus the marker).
- **Repro:** section 5.
- **Recommendation:**
  - also match `error code: 1027` regardless of content type;
  - keep "load one real URL" in the live check.

**S8 - C. Test gaps.**
- **Finding:**
  - nothing tests a redirect to a non-http scheme (E3 survives);
  - DoH failure options are untested (E9-E11);
  - `browser-parity.cjs` asserts only `fixture.pdf` and `encrypted.pdf`, so the other five PDFs
    could drift without failing `npm test`.
- **Repro:** section 4 and `tests/browser-parity.cjs`.
- **Recommendation:** add these tests; pin the known `hyphenation.pdf` difference and assert the
  rest.

**S9 - C. Line endings.**
- **Finding:** `_headers`, `api/read`, `404.html`, `LICENSE` and `functions/api/read.js` have no
  eol rule. Here, with `core.autocrlf=true`, they check out CRLF; on Cloudflare's Linux build they
  are LF; tests run on the CRLF copies. No functional effect was found.
- **Repro:** `git ls-files --eol`.
- **Recommendation:** add explicit eol rules.

### Info

**S10 - C. Stale or imprecise docs.**
- **Finding:**
  - `push.sh` line 74 still tells the user to install `requirements.txt`;
  - README's "bundled automation runtime" should name Codex's cache;
  - HOSTING.md step 3 (the email decision) is already settled, according to the orchestrator's
    log, so Marcus should confirm it;
  - add both dashboard paths for the compatibility date;
  - README says goldens were "committed before Python removal", but 2 of the 12 were committed
    with it (both are verified Python-identical).
- **Repro:** the files named.
- **Recommendation:** edit the wording.

**S11 - C.**
- **Finding:** the local server now sends every URL's hostname to `cloudflare-dns.com`, and names
  resolvable only on the LAN fail.
- **Repro:** P-e.
- **Recommendation:** document it in README.

**S12 - C (optional).**
- **Finding:** Pages adds `Access-Control-Allow-Origin: *` to static assets.
- **Repro:** the serving doc.
- **Recommendation:** add `! Access-Control-Allow-Origin` under `/*` if least privilege is wanted.

**S13 - C.**
- **Finding:** the dead `skipped` counter; the case-sensitive `SKIPPED` grep.
- **Repro:** section 8.
- **Recommendation:** remove the counter or align the grep.

**S14 - C (optional).**
- **Finding:** the Function can call its own `/api/read`.
- **Repro:** section 4, residual risks.
- **Recommendation:** refuse the request's own hostname.

### What Marcus must decide

- **D1 (S3):** whether the repository goes public with the inherited user-profile paths.
- **D2 (S1):** the browser-parity gate design.
- **D3 (S4):** the unruled behaviour changes.
- **D4:** that W3 satisfies HOSTING.md step 3.
- **D5:** F1 as a separate reader task after launch. CC agrees.
- **Also:** approve the S2 privacy wording.

### What Codex should fix

- S2 (wording), S5, S7, S8, S9, S10 and S11;
- S12 and S14 optionally;
- then implement D2.

The merge and the gated push can proceed once Marcus has read this. The visibility flip waits for
D1.

## 10. Not checked

- **No Cloudflare deploy.** These are unverified:
  - the fail-open mapping and the real 1027 body;
  - edge CPU;
  - invocation exclusion;
  - HTTPS headers;
  - logging state;
  - Pages bundling of the `../../lib/read-proxy.mjs` import;
  - Workers-specific `redirect: "manual"` and decompression behaviour. These were tested in Node
    only.
- `tools/push.sh` was not run end to end (declined).
- Other browsers; real-world PDF/DOCX corpora beyond the 13 fixtures and 9 synthetic DOCX files;
  a genuinely corrupt PDF page.
- Windows 8.3 names; Node below 24.16.0; the listener inventory on other platforms.
- Codex's W2 task prompt was not visible. W2 was checked against DECISIONS.md and the
  orchestrator's vault log only.
- Whether a Windows account path counts as personal data is a judgement (section 7).
- The Cloudflare quotes came from a page-to-text fetch tool that I asked for verbatim text. The
  wording that decisions rest on (sections 5 and 6) should be spot-checked on the live pages.

## 11. Evidence (this review; sanitised, ASCII)

`docs/verification/results/cc-review-static/`:

- `reproduction.json`: R1-R5, G1-G2, golden regeneration, mutation rows with kill reasons.
- `proxy.json`: all 190 attempts, real-socket results, the CPU estimate, extra mutants, quota
  detection.
- `extraction.json`: the DOCX differential.
- `platform-and-hygiene.json`: dist, vendoring, licence, headers, CSP and request inventory, the
  hygiene scan.

The scratch scripts and the synthetic corpus are not committed.
