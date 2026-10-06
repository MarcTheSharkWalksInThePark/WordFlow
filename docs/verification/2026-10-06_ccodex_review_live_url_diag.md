# Independent review of the temporary live URL diagnostic

Date: 2026-10-06. Reviewer: separate Codex agent (gpt-6.1-sol, xhigh).

Reviewed commit: `b060b4b35fd623287c7ad2af1cbe2a5df774228d`.
Baseline: `134e5db8ab9a2acee37a01238575caeed3df9b94`.

## Verdict

**CLEAR for the authorized temporary diagnostic push.** This is a diagnostic review, not a
production-fix or live-deployment verification. Remove `/api/diag` and the temporary helper
exports in the fix commit, as requested by Marcus.

## Independent reproduction

- Created a fresh `git clone --no-local --no-checkout` under `<temp>`, then checked out the
  exact reviewed SHA with detached HEAD. No builder working-tree files were used.
- Node `v24.16.0`, npm `11.13.0`; no packages installed.
- `npm test` exited 0: static regression **223**, proxy **162**, server exposure **32**,
  post-review **74** = **491 passed, 0 skipped**.
- A separate injected-fetch diagnostic exercise passed **39 assertions, 0 skipped**.
- `git diff --exit-code` and `git status --porcelain` were clean after verification.
- The sandbox blocked Git's shell signal pipe and Node child-process spawning. The approved
  escalation retried only the fresh scratch clone and independent suite; neither action
  changed the primary checkout, pushed, or installed software.

## Scope and security findings

Compared the committed diagnostic, helper exports, `_routes.json`, and `HOSTING.md` with the
baseline and read the complete proxy implementation and current W2-W5 rulings.

`functions/api/diag.js` is controlled by a literal build-time boolean. It accepts only GET
with no nonempty query string; POST, HEAD, and a query containing an attacker-selected URL
returned 404 without any fetch. The only target destinations are the fixed HTTPS origins
`example.com` and `en.wikipedia.org`. Each target gets the shared A/AAAA DoH check and the
shared bounded body reader before reporting its step results.

The direct exercise confirmed four DNS calls and two target calls, fixed DNS Accept and
target User-Agent headers, AbortSignal use, and manual target redirects. An incoming Origin
and arbitrary header marker did not appear in outbound headers or returned JSON. Retrieved
HTML content did not appear in the diagnostic response; only its character count appeared.
The route returns fixed target names, step status, and caught error name/message. Request
body, request headers, and caller-selected destinations are not consumed or echoed.

Both newly exported helpers retain their baseline implementation. `handleRead`, all URL/IP,
private/self-host refusal logic, redirect revalidation, body bounds, and its public error
mapping are unchanged. Simulating the runtime TypeError exposed that error only through
the authorized diagnostic; `/api/read` still returned exactly status 500 and
`{"error":"Could not load website"}`. No stack or target content was returned.

`_routes.json` adds only the exact temporary `/api/diag` route to `/api/read`. The static
allowlist and public assets are unchanged. HOSTING step 5 records the assigned live address
`https://wordflow-reader.pages.dev/` and Marcus's repository-public launch handoff without
adding a real user-profile path.

Minor temporary documentation mismatch: HOSTING's platform summary still says `_routes.json`
contains only `/api/read`. This does not block the explicitly authorized short-lived route;
removing the diagnostic in the fix makes the summary accurate again.

## Runtime evidence

Independently retrieved Cloudflare's primary
[workerd HTTP runtime source](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B)
on 2026-10-06. `Request::constructor` passes the requested redirect mode to `tryParseRedirect`
and raises TypeError when parsing fails; its error tells callers to use manual mode and
check response status. `tryParseRedirect` accepts only follow and manual, returning no value
for error. The proxy's DoH call uses `redirect: "error"`, so the runtime rejects its first
DNS subrequest before DNS answers or body-reading APIs matter. This source evidence explains
the observed immediate generic 500 and identifies a concrete cause to confirm live.

The builder supplied source commit `ebd90312bff06ae5c7689a23a3589c898f4b7618`. Attempts to
retrieve that exact pinned source through the web tool returned cache misses, and direct
PowerShell retrieval was network-blocked. This diagnostic review independently read the main
source above; it does not claim to have reproduced the builder's source pin.

## Limits and next check

No live diagnostic request, Cloudflare configuration check, actual workerd execution,
mutation rerun, browser parity rerun, push, deployment, repository settings change, secret
file access, or vault write was performed by this reviewer. No stamped frontend/extraction
file changed in the reviewed commit, so parity is not required for this diagnostic delta.
The builder owns the gated push and live capture; the root agent owns coordinated Brain
writeback to prevent simultaneous shared-note edits.

The production fix must preserve fail-closed DNS redirects. Review its exact committed SHA
separately, including a 3xx DoH response with Location: it must produce a generic failure and
perform no redirect or target fetch. The existing residual DNS-rebinding and quota-abuse
risks are unchanged by this diagnostic.

Agent: Codex (gpt-6.1-sol, xhigh)
