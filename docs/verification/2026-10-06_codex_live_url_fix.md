# WordFlow live URL fix — 2026-10-06

Agent: Codex (gpt-6.1-sol, xhigh). Authorized task: diagnose and fix the live Pages Function;
push only through tools/push.sh. No installs, repository settings changes or direct deployment.

## Initial evidence and temporary diagnostic

Marcus relayed claude.ai's 21:10 live check at https://wordflow-reader.pages.dev/, master
134e5db: example.com, en.wikipedia.org, gutenberg.org, httpbin.org/html and nrk.no all return
500 `{"error":"Could not load website"}` in about 12 ms. POST is 405; localhost, 192.168.1.1,
169.254.169.254, the site and abc123.wordflow-reader.pages.dev are 403. Static pages/headers pass.
The orchestrator's Node execution with real Cloudflare DoH answers for example.com succeeds:
A 172.66.147.243 / 104.20.23.154; AAAA 2606:4700:10::6814:179a, all public by the current policy.

The current [Workers Request docs](https://developers.cloudflare.com/workers/runtime-apis/request/)
list error/manual/follow and AbortSignal support. They do not establish the live cause.
The temporary /api/diag route has a source-level ENABLE_DIAGNOSTIC switch, GET/no-query only,
two hardcoded targets, shared production DNS/stream routines, bounded reads and a deadline.
It returns step statuses and error names/messages, never incoming data or fetched content.
/api/read retains its generic public error policy. Remove this route and helper exports with
the fix. Diagnostic deployment/test/live evidence and final results are appended below.

Diagnostic validation: npm test passes 491 checks (223 static + 162 proxy + 32 exposure + 74 post-review), 0 skips. A direct diagnostic scope/error check rejects POST and queries with no subrequests, restricts all DNS names to the fixed list, preserves exact production options and captures the synthetic runtime error. No stamped file changed; parity is unchanged. A sandbox child-process EPERM required running the test suites with approved escalation.

Root-cause lead: Cloudflare's [primary workerd implementation](https://github.com/cloudflare/workerd/blob/ebd90312bff06ae5c7689a23a3589c898f4b7618/src/workerd/api/http.c%2B%2B) rejects error redirect mode at Request construction; tryParseRedirect accepts only follow/manual. This contradicts the Request documentation. The fixed-target live diagnostic will confirm the deployed runtime error.

Marcus's approval, relayed by the orchestrator during this task: update only E9's exact DoH anchor from the removed error-mode expression to the fixed manual-mode expression, preserving automatic-follow mutation semantics and the required KILLED verdict. All other 76 earlier mutation definitions must remain identical. Marcus additionally requires a 3xx DoH response with a Location header to fail closed with no target fetch.

Separate reviewer (Codex subagent): temporary diagnostic CLEAR; fresh --no-local clone 491 Node checks / 0 skips, plus 39 diagnostic checks / 0 skips. Review report: docs/verification/2026-10-06_ccodex_review_live_url_diag.md. No diagnostic mutation/parity/live run was claimed by the reviewer.

## Root cause, live evidence and fix

The reviewed diagnostic was gate-pushed as 2abef4a4437ef8258e74b67d5d82244b5978d0b2. The live route returned 200 and captured the same TypeError on A and AAAA for both fixed hosts: error redirect mode is unsupported. No DNS or target response was reached. Raw fixed-input evidence: results/live-url-diagnostic.json. The downloaded pinned runtime source SHA-256 is 81388e77d25248c1255c1e6b7d0d6a82bd7debd4e88762518987ae4249269560; its Request rejection begins at line 484.

Fix: change only DoH's redirect mode to manual. The existing !res.ok gate still refuses every non-2xx, including 3xx with Location, before DNS parsing or any target fetch. Keep cloudflare-dns.com, both A/AAAA queries, public-IP classification, per-hop revalidation, private/self/Origin/method/port/credential refusals, limits/deadline and generic errors. No alternative resolver, wire format or security design is introduced. Remove /api/diag, its route entry and its temporary helper exports. The final public route set returns to only /api/read.

## Regression and deployment verification

Node npm test now passes 498 checks: 223 static, 169 proxy, 32 exposure, 74 post-review; 0 skips. Seven added proxy checks exercise the accepted Workers fetch modes/shared abort signal, Request headers, Uint8Array reads/releaseLock, split UTF-8 decoding, five explicit DoH redirect statuses (301/302/303/307/308) with Location and a valid DNS body, and the post-deploy smoke's rejection of broken success/refusal contracts. The old synthetic-throw redirect test now uses an actual 302 response. The source-backed Workers fetch constraint reproduces the Node-vs-Workers difference; it is an offline contract test, not execution of workerd. The deployed diagnostic and final live smoke exercise the real edge runtime. Nothing was installed.

The new dependency-free tools/live-smoke.mjs (npm run smoke:live) checks example.com 200 with HTML/known page content, 192.168.1.1 403 and self 403, with a deadline and nonzero failure. It rejects quota-marker HTML, generic 500s, non-HTML success and accepted private URLs in offline checks. Before the fix deployment it fails on the observed public 500, as required. HOSTING step 5 records the actual address and public repository; step 6 documents this script.

All stamped files are unchanged from launch 134e5db; npm run parity is not required and was not rerun. The gate validates the existing generated stamp. Mutation definition comparison proves 76 earlier definitions unchanged; only E9 is reanchored under Marcus's explicit approval, with the same follow-mode mutation. U1 reintroduces the Workers-invalid error mode. Full mutation outcomes, independent fix review and final live results follow after execution. DNS rebinding, quota/CPU/fail-open/dashboard logging limits remain the previously disclosed residuals.
