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
