# WordFlow static hosting

Built under Marcus's [RULING W2](docs/DECISIONS.md), recorded before code changes.
Deployment happens only by Cloudflare's Git integration from master, after review.
No deployment or account/repository setting change was performed during this build.

## Platform — Codex implementation choice

Cloudflare Pages with a Pages Function at `functions/api/read.js`. It imports the single
platform-neutral `lib/read-proxy.mjs`; Node's local server imports the same module.
No Wrangler installation or npm/Python package installation is needed on Marcus's PC.

`node tools/build.cjs` copies precisely the 197 named files in the local static allowlist,
plus `_headers` and `_routes.json`, to ignored `dist/`. It never copies the repository,
test evidence, proxy source, Git data or environment files into the published assets.
The root `functions/` directory is compiled by Cloudflare's Git build, outside dist.
The top-level 404.html prevents Pages' implicit single-page-app fallback.

`_routes.json` includes only `/api/read`. Every static asset route bypasses the Function.
Unknown API paths do not invoke it. The same-origin proxy returns JSON; HTML parsing stays
in the browser. [Pages routing](https://developers.cloudflare.com/pages/functions/routing/)
and [Function setup](https://developers.cloudflare.com/pages/functions/get-started/)
describe this mechanism (accessed 2026-10-06).

## Free plan and quota

No paid tier, card or add-on is authorized. Use the free pages.dev address.
Static requests are free and unlimited. Functions share **100,000 requests/day per account**
with any other Workers/Functions; reset **00:00 UTC**.
[Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/) (2026-10-06).

Workers Free has **10 ms CPU**, **128 MB memory**, **50 subrequests/request** and **6 simultaneous
outgoing connections**. Network waiting does not count as CPU. Each URL hop uses at most two
parallel DNS queries plus one fetch, at most 18 fetches for the initial URL and five redirects.
The body has a 3 MiB streamed cap; the entire operation has a 12-second abort deadline.
Actual edge CPU use on a maximum-size body is **unverified** until the live check.
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/) (2026-10-06).

Pages Free: **500 builds/month**, one concurrent build, 20-minute build timeout,
20,000 asset files, 25 MiB per asset. This build has 199 files in dist; uploads are browser
memory inputs, never Pages assets or Function request bodies.
[Pages limits](https://developers.cloudflare.com/pages/platform/limits/) (2026-10-06).

Cloudflare documents a quota error page with **Error 1027**; the cited docs do **not** specify
a guaranteed HTTP status or exact HTML body. Do not claim it is necessarily 429 or 503.
app.js checks the 1027 error-page marker independently of HTTP status.
[Workers errors](https://developers.cloudflare.com/workers/observability/errors/) (2026-10-06).

Set Pages **Settings > Runtime > Fail open / closed = Fail open**. When Functions are over
quota, Pages serves static assets, including the exact `api/read` fallback file containing
`WORDFLOW_FREE_LIMIT`. app.js recognizes this even at status 200. This is an implementation
choice using [Pages' documented fallback](https://developers.cloudflare.com/pages/functions/routing/)
(2026-10-06); its live routing must be checked after connection.
The direct browser-fetch fallback still runs. If both loaders fail after quota exhaustion,
the user sees exactly:

> URL loading has reached today's free limit. It resets at 00:00 UTC. Paste the text instead.

Reader controls, file input, pasted text, and resume remain available. Simulated Error 1027
and fail-open responses are exercised at desktop and phone widths.

## Proxy policy and residual risks

- GET only. HTTP/HTTPS only. Ports 80/443 only. No credentials.
- W4.3 confirms these behaviour changes, the all-file 24 MiB cap and five revalidated redirects.
- Refuse the request's own hostname and every configured custom domain on every hop.
  Under W5.3, a request host ending in `.pages.dev` automatically supplies its last three labels
  as the project name. That name and every subdomain (deployment hash and branch aliases included)
  are refused before DoH and fetch, independently of `SITE_HOSTNAMES`. All trailing dots are stripped.
  `SITE_HOSTNAMES` starts empty; add custom domains there before using them. The automatic suffix
  derives from Pages-host requests. For requests arriving on custom domains, also list the assigned
  Pages address and deployed aliases explicitly to cover those exact cross-domain targets.
- Refuse localhost, subdomains of localhost, .local, .internal and .arpa, including trailing-dot
  spelling. WHATWG URL parsing canonicalizes alternate IPv4 spellings before classification.
- Refuse non-public IPv4 ranges: unspecified, loopback, private, link-local, CGNAT, benchmarking,
  documentation, multicast, reserved and deprecated relay space.
- IPv6 permits current ordinary IANA global allocations only, excludes special-purpose space and
  documentation, and conservatively refuses translation/tunnel forms (mapped, compatible, NAT64,
  Teredo, 6to4), including forms with a private embedded IPv4 address.
- Resolve names using Cloudflare DNS-over-HTTPS (A and AAAA); fail closed on DNS errors, empty
  results or **any** non-public address answer. Revalidate syntax, IP and DNS on every redirect;
  manual redirects, at most five hops.
- Forward no client cookies, authorization, Origin or forwarded headers. The remote request uses
  only fixed User-Agent `WordFlow Reader/1.0`; DoH uses fixed Accept application/dns-json.
- If Origin is present, it must equal the request's own origin. No cross-origin CORS permission.
  Non-browser clients can omit Origin: this is not authentication. Abuse can exhaust the daily
  free quota; the static site stays available.
- Errors are generic; no stacks, internal paths, URLs or document content are logged by the handler.

**DNS rebinding gap:** fetch resolves again after the DNS check. The implementation does not pin
the connection to the vetted addresses and does not claim to close that gap. The public Function
runs on Cloudflare's edge, with no access to Marcus's network. The local server has the same
residual DNS race on Marcus's machine; retain its loopback bind and Host controls.
The direct fallback uses browser networking and CORS rather than the proxy policy.

Address policy sources, accessed 2026-10-06:
[IPv4 special-purpose registry](https://www.iana.org/assignments/iana-ipv4-special-registry/),
[IPv6 special-purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry/),
[IPv6 allocations](https://www.iana.org/assignments/ipv6-unicast-address-assignments/).
Future allocations need a reviewed policy update. This deliberately conservative policy may
refuse some globally reachable special-purpose addresses.

## Files, privacy and headers

PDF and DOCX parse in the browser; native ZIP deflate-raw handles DOCX. All inputs have a
24 MiB cap. Selected DOCX XML entries have a combined 64 MiB decompressed cap and a 4096-entry
ZIP directory cap. This is a resource-bound implementation choice; very large or corrupt
documents may be refused. PDF.js is pinned, local, and configured with eval and WASM disabled
for text extraction. Its CMaps/fonts and licences ship locally.
See THIRD_PARTY_NOTICES.md and vendor/manifest.json for npm SRI and every file's SHA-256.

The visible privacy note (W4.6) reads exactly:

> Files are read in your browser and never uploaded. Links you load are fetched through WordFlow's proxy on Cloudflare. Cloudflare and the website you load can see the request, including your IP address. If the proxy fails, your browser contacts the website directly. Nothing is stored except your own resume session in this browser.

Cloudflare Worker subrequests expose visitor IP through `CF-Connecting-IP` / `X-Real-IP` and
identify the Worker zone through `CF-Worker`. The handler's own fixed-header policy does not
prevent Cloudflare adding these headers. Cloudflare DoH also receives URL hostnames, including
redirect hosts. Direct fallback contacts the destination from the browser.

No app analytics, cookies or telemetry is enabled. The app persists
only the compatible `wordflow-reader-session-v1` resume record in localStorage.
Proxy URLs are sent to Cloudflare and destination hosts; DNS names are sent to Cloudflare DoH.
Cloudflare's infrastructure processing is outside the app's storage guarantee.

`_headers` applies CSP, nosniff, no-referrer and a restrictive Permissions-Policy to static files.
It removes Pages' default `Access-Control-Allow-Origin` permission; the local server likewise
sends no such header. Browser extraction, workers and fonts are all same-origin.
The Function sets its own response headers, since Pages' _headers does not apply to Functions.
The local server applies the same static headers for Chrome verification.
There are **no inline styles or scripts in index.html**. CSP therefore uses style-src 'self'
without unsafe-inline. The reader's existing JS style-property changes for fitting work under CSP.
worker-src 'self' blob: allows PDF.js's worker; there is no runtime CDN.
[Pages headers](https://developers.cloudflare.com/pages/configuration/headers/) (2026-10-06).

## Logging defaults and confirmation

The handler contains no console logging. No log bindings, Tail Worker, analytics integration,
or source-map upload is configured. Pages' own Functions logging is a manually started stream;
the Pages documentation says logs are not persisted. Leave the deployment's Functions log
stream closed, and do not enable Web Analytics, Zaraz, Logpush or integrations.
Confirm in **Workers & Pages > WordFlow > deployment > View details > Functions** that no log
session is running. If Cloudflare exposes a Workers Logs/Observability persistence toggle for
the generated Function, set it **Disabled** and check it after each deployment; this dashboard
state cannot be enforced or verified before Marcus connects the project.
New standalone Workers may default to persisted logs; this build uses Pages.
[Pages logging](https://developers.cloudflare.com/pages/functions/debugging-and-logging/),
[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
(2026-10-06). Starting a tail stream can expose full requested URLs, so do not use real sensitive
links in any logging session.

## Marcus's manual sequence

1. Have CC review the committed feature branch in a fresh clone, reproducing tests, mutations,
   extraction comparisons and smoke. This build report is not independent CC approval.
2. Before merge, run `npm run parity` for all W4.2-covered changes and commit its generated stamp.
   After review, merge `feat/static-hosting` into master; run tests and push **only**
   through `bash tools/push.sh`. Never bypass the gate. Once connected, master is production.
3. Marcus makes the GitHub repository public himself. W3 fully settles email history (W4.4),
   and W4.1 accepts inherited profile paths; no scrub or history rewrite.
4. Create a **Free** Cloudflare account (no card/add-ons). Create **Pages > Connect to Git**;
   authorize only the WordFlow repository. Use these project settings:

   | Setting | Value |
   |---|---|
   | Project name | Marcus chooses an available name |
   | Repository | WordFlow |
   | Production branch | master |
   | Framework preset | None |
   | Root directory | repository root (blank) |
   | Build command | node tools/build.cjs |
   | Build output directory | dist |
   | Node version (build variable) | NODE_VERSION=24.16.0 |
   | Dependency installation | SKIP_DEPENDENCY_INSTALL=true |
   | Functions compatibility date | 2026-10-06 |
   | Functions compatibility flags | none |
   | Preview branches | None (disable automatic preview deployments) |
   | Runtime quota behavior | Fail open |
   | Plan | Workers Free / Pages Free |
   | Bindings / secrets | none |
   | Web Analytics / logging / integrations | off |

   Cloudflare compiles functions from the root; nothing is installed on Marcus's PC.
   For the compatibility date/flags, dashboard documentation gives both **Settings > Functions >
   Compatibility Flags** and **Settings > Runtime**; use the section exposed by this dashboard.
   Do not select Workers & Assets or Direct Upload for this documented flow.
   [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/),
   [branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/),
   [build image](https://developers.cloudflare.com/pages/configuration/build-image/)
   (2026-10-06).
5. Assigned live address: https://wordflow-reader.pages.dev/ (2026-10-06); repository now public,
   confirmed by Marcus's launch handoff. Record the address in the vault project note too.
   Pages-host requests need no code change for the project name (W5.3).
   Configure any custom domains in `SITE_HOSTNAMES` before using them.
6. Live check the generated HTTPS pages.dev URL: desktop and 390 px
   reader/upload/resume flows; **load one real public URL through /api/read**; rejected private
   and self-host URL; security response headers; downloaded
   notices; a simulated quota page and static api/read marker; static requests do not increase
   Function invocations; logging/analytics off. Check maximum-body CPU against the 10 ms limit.
   Never deliberately exhaust 100,000 requests to test the quota.
   After every deployment run `npm run smoke:live` (or pass an HTTPS site origin after `--`).
   It requires example.com HTML at 200 and private/self refusals at 403, failing nonzero otherwise.
   To save evidence: `npm run smoke:live -- https://wordflow-reader.pages.dev/ --out result.json`.
   A missing/unmatched Function also serves the static `api/read` marker. Its response is
   indistinguishable from quota fail-open in app code, so the real public URL check is required
   to prove the Function works. Real quota/fail-open mapping and maximum-body edge CPU (S6)
   remain launch checks.

## Prior review findings

### Dashboard record correction — 2026-10-07

Marcus's dashboard confirmations, relayed by the claude.ai orchestrator and dated 2026-10-06:
Runtime "Fail open" is set; preview branches = None; Web Analytics off. These are human
dashboard confirmations, not measurements of runtime quota behavior.

**UNVERIFIED:** actual quota/fail-open routing at runtime; maximum-body edge CPU (no CPU
data yet; Error 1102 would indicate the 10 ms limit); Functions log-session state; whether
the daily request count excludes static page views.

**Reader F1 / W6:** local `fix/f1-long-token` reached the mandatory vertical STOP with a
2000-character token at 390 px (frame scrollHeight 705 > clientHeight 704). The candidate
is preserved as evidence; production reader files are restored. F1 is not fixed and needs
Marcus's vertical-behavior ruling before implementation and independent CC review.

L1 closed: Python, interpreter resolver and cache fallback are removed from the product and tests.
L2 closed: extractor endpoint/process removed; shared proxy and server errors are generic.
L3 closed under W4.2: npm test has only Node suites, no skip paths; parity separately fails
nonzero on missing Chrome/automation. Push checks the successful parity stamp and refuses skips.
L4 closed: HOSTING.md is rewritten without stale code-line anchors.
L5–L8 remain historical disclosed limitations where applicable; this does not overrule CC.

### F1 continuation — 2026-10-07

W6.5 authorizes pause-and-scroll within the normal-height reader frame. CC reviewed that
local build CLEAR WITH FINDINGS (fc98d1e). The W6.7-W6.11 round reached the mandatory W6.8
STOP: enforcing the display cap changes tokens that are fully visible on master. The candidate
is withdrawn and the starting W6.5 reader restored; F1 is not fixed or accepted. Marcus must
resolve the fit invariant before further implementation and one CC re-review. Dashboard
confirmations and unverified platform checks remain as recorded. No merge, push or deployment.
See `docs/verification/2026-10-07_codex_f1_round2.md`; the W6.5 report remains historical evidence.

### F1 round 3 — 2026-10-07

Marcus's W6.12 resolves the historical capped-box STOP. F1 candidate (W6.1-W6.12)
committed on fix/f1-long-token, pending CC re-review; not yet fixed (W6.11). Fully visible
master tokens remain unchanged; clipped wide-frame tokens use the rendered-text fit target.
Full builder parity succeeds; the generated stamp is committed. One CC re-review, then
Marcus's merge/push decision through tools/push.sh and smoke:live after deployment.
Master b9d3d9e unchanged; nothing pushed or deployed. Platform checks remain unverified.
See `docs/verification/2026-10-07_codex_f1_round3.md`.
