# Independent review of the live URL fix

Date: 2026-10-06. Reviewer: separate Codex agent (gpt-6.1-sol, xhigh).

Reviewed commit: `c6372aaddbadea4f933ff68ea1a2a3d885bf2371`.
Launch baseline: `134e5db8ab9a2acee37a01238575caeed3df9b94`.

## Verdict

**CLEAR for the authorized gated master push.** No blocking finding in the fix scope.
The root agent must perform post-deployment live verification before declaring URL reading
restored. This review does not claim that the fix is already deployed.

## Independent reproduction

Created another fresh `git clone --no-local --no-checkout` under `<temp>`, then checked out
the exact fix SHA with detached HEAD. Used Node `v24.16.0` and npm `11.13.0`; installed nothing.

- `npm test` exited 0: **223 static + 169 proxy + 32 exposure + 74 post-review = 498 passed,
  0 skipped**.
- `npm run mutations -- --out review-mutations.json` exited 0: **78 total, 77 KILLED,
  1 equivalent M9 survivor, 0 unexpected, 0 errors**.
- Independently compared all **77 prior verdicts** with the committed launch
  `docs/verification/results/delta-fixes/mutations.json`: all unchanged.
- Independently checked all **78 SHA-256 triples**: before equals restored; mutated differs
  from before; hash values are valid SHA-256 strings.
- `node tools/parity-stamp.cjs` passed for the exact reviewed committed inputs.
- `git diff --exit-code` was clean after verification. The only new scratch-clone file was
  the reviewer's mutation output.

Evidence: [reviewer mutation results](results/reviewer-live-url-mutations.json). The report
and evidence are the reviewer's own files; no builder implementation or report was edited.

The Node suite and mutation process initially overlapped. Inspection confirmed the mutation
runner applies transforms only in a separate dedicated temporary scratch root; it reads the
review clone without changing it. There was no shared-source mutation race. No redundant
test round was needed.

## Root cause and implementation

Independently fetched the pinned primary
[Cloudflare workerd HTTP source](https://github.com/cloudflare/workerd/blob/ebd90312bff06ae5c7689a23a3589c898f4b7618/src/workerd/api/http.c%2B%2B)
using Node fetch: HTTP 200, SHA-256
`81388e77d25248c1255c1e6b7d0d6a82bd7debd4e88762518987ae4249269560`.
The request constructor throws TypeError for unsupported redirect modes; `tryParseRedirect`
accepts only follow/manual. The DoH `redirect: "error"` option in launch code therefore fails
at request construction. This source pin, unavailable to the diagnostic review's first fetch
attempts, is now independently reproduced.

Read the committed fixed-input live diagnostic capture: both A and AAAA for both hardcoded
hosts show the corresponding runtime TypeError, before any target fetch. That capture was
made by the builder and was not independently recaptured by this reviewer.

The final production diff in `lib/read-proxy.mjs` changes only the DoH redirect mode to manual
and adds its explanatory comment. The existing `!res.ok` refusal remains before DNS body
parsing. Manual mode returns a redirect response without following it; the status gate then
refuses it. Resolver, A/AAAA checks, destination policy, and error mapping are preserved.

An independent source-backed fetch-contract exercise applied identical inputs to the launch
and fixed modules: launch returned generic **500**, fixed returned **200** with HTML. The
fixed path made exactly two DNS calls and one target call, preserved Unicode content, used
the exact fixed outbound Accept/User-Agent headers, and shared one AbortSignal.

## Regression and refusal review

The reproduced proxy suite now contains a Workers redirect-mode constraint based on the
pinned implementation; it exercises the actual proxy call path and the Node Request/stream
objects. It checks exact request headers, manual mode, the shared signal, byte chunks,
reader reads and lock release, and split multibyte UTF-8 decoding. It would reject launch's
Node-valid but Workers-invalid error redirect mode.

All **301/302/303/307/308** DoH responses are explicitly tested with a Location header and a
valid public DNS answer body. Each produces exactly the generic 500 and only the two DNS
calls: no redirect destination and no target fetch. E9 (automatic following) and U1
(unsupported error mode) are both assertion-killed by the exact manual-mode contract.

Independently fetched pinned `basics.h`, `encoding.h`, and `streams/readable.h`. They declare
the AbortSignal `throwIfAborted`, TextDecoder/decode, and reader getReader/read/releaseLock
and Promise-returning cancel APIs used by the implementation. Cloudflare's
[reader documentation](https://developers.cloudflare.com/workers/runtime-apis/streams/readablestreamdefaultreader/)
and [encoding documentation](https://developers.cloudflare.com/workers/runtime-apis/encoding/)
also describe these reader and decoder interfaces. The tests use Node's implementations;
they do not execute workerd or reproduce every edge-runtime behavior.

All W2-W5 security code is otherwise byte-identical to launch: URL schemes, ports,
credentials, Origin, private/special IP classification, DNS validation, per-hop redirect
validation, own-host/Pages-project/subdomain refusals, GET-only behavior, limits/deadline,
fixed forwarding headers, generic public errors, and R59 server protections remain intact.

`functions/api/diag.js` is absent from the committed tree; the temporary checkDNS/limitedText
exports are gone. `_routes.json` is exactly the launch configuration with only `/api/read`.
The diagnostic review's temporary HOSTING route-summary mismatch is therefore resolved.

## Definitions, stamp and deployment checks

Compared prior mutation row objects directly from committed Git blobs: **76 unchanged**,
only E9 altered. E9 changes only its exact transform anchor/replacement to the manual-mode
DoH expression and keeps automatic-follow semantics and all other row metadata. Marcus's
explicit exception is recorded in the builder report. U1 is the only added mutation.

No stamped input or `tests/parity-stamp.json` changed from launch. The existing committed
stamp passed its verifier. Browser parity was not rerun because this delta does not require
it; no package, Wrangler, workerd, Chrome, or Playwright installation occurred.

`tools/live-smoke.mjs` is dependency-free and fails nonzero on a wrong status, non-JSON
response, missing expected HTML/content, or changed private/self error contract. Its offline
tests reject public 500, quota marker at 200, non-HTML success, and accepted private targets.
It checks example.com 200/HTML, 192.168.1.1 403, and site-self 403 with deadlines. HOSTING
records `https://wordflow-reader.pages.dev/` in step 5 and documents this check in step 6.

## Limits

This reviewer did not push, deploy, change repository/Cloudflare settings, install software,
run real workerd, access secret files, recapture the live diagnostic, or run the final live
smoke before deployment. Maximum-body edge CPU, quota/fail-open behavior, dashboard logging,
and the previously documented DNS-rebinding and unauthenticated quota-abuse risks remain
outside this fix review. The root agent owns post-deployment live checks and coordinated
Brain writeback; no shared vault notes were edited concurrently by the reviewer.

Agent: Codex (gpt-6.1-sol, xhigh)
