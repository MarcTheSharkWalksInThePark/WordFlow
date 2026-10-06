# WordFlow static hosting build — 2026-10-06

Author: Codex (gpt-6.1-sol, high). Builder's report; **CC review is still required**.
Branch: feat/static-hosting, local only. No merge, push, deployment, GitHub setting change,
Cloudflare account operation or package installation was performed.

## Result

Marcus's W2 is recorded verbatim in DECISIONS.md in commit **3921959**, before code changes.
That commit also preserves the first four DOCX fixtures/goldens and seven PDF fixtures with
six successful Python goldens plus the encrypted-PDF baseline failure record.
Two supplemental DOCX goldens cover every section label and default/missing styles; they
were captured later with the same committed historical extractor recovered from 3921959.
Existing runtime versions measured: Python 3.12.14, pypdf 6.10.0, python-docx 1.2.0.
No Python source, runtime resolver, package pins or fixture-generation script remains in the
product/test checkout. Historical source and this provenance remain in Git.

Implemented: static asset-only distribution, browser PDF/DOCX, the single shared URL proxy,
Pages Function wrapper, quota handling/fallback, security headers, visible privacy note,
exact licence/notices, corrected decisions and operating docs. The v1 resume key/format and
reader behavior remain. HOSTING.md records the exact platform settings and manual sequence.

## Rulings versus implementation choices

**Marcus:** W2.1–W2.7 and the task's explicit workflow/R59 exception. All-rights-reserved
licence; free static Cloudflare; same-origin proxy; browser files; confirmed dispositions;
env/Python removal; pinned vendoring; no merge/push until review. W3 remains completed.

**Codex choices:** Pages Functions rather than Workers Assets; a named dist copy build;
only /api/read invokes a Function; fail-open plus static api/read quota marker; PDF.js 6.4.299;
native deflate-raw ZIP; conservative IANA IPv6 allocation policy; DOCX selected-XML expansion
cap of 64 MiB and 4096 central entries. These are not additional Marcus rulings.
Current primary doc links and access dates (2026-10-06) are in HOSTING.md.

## Validation numbers and evidence

| Check | Result | Evidence |
|---|---|---|
| npm test, Node 24.16.0 | 223 static regression + 81 proxy + 32 R59 = **336 checks**, 0 skips; then extraction parity | static-regression.json, proxy.json; exposure output reproduced by npm test |
| DOCX byte parity | **6/6**, **0 mismatches**, exact UTF-8 payload bytes including LF | browser-parity.json, tests/fixtures/*.golden.json |
| PDF comparisons | **7**, five identical results, **two differences** detailed below | browser-parity.json |
| Chrome feature smoke | **48 checks**, 24 at each of 1400×950 and 390×844; 0 app errors; 0 file-upload requests | static-smoke.json; static-reader/quota-*.png |
| Registered mutations | **52: 51 KILLED, 1 equivalent (M9), 0 unexpected, 0 errors** | static-mutations.json |
| Original R59 rows | **46/46 unchanged**, no re-anchoring | static-final-checks.json |
| Vendoring | npm SRI verified; **188/188 file SHA-256 values verified** | vendor/manifest.json; static-regression.json |
| Distribution | **197 named assets + 2 configuration files = 199**; all below 25 MiB | static-final-checks.json |
| Preserved implementation | **30 reader helpers + 8 R59 helpers byte-identical after EOL comparison** | static-final-checks.json |

Evidence files above live in docs/verification/results/. Historical split/parity reports and
evidence were not edited. npm test requires installed Chrome/Playwright and fails nonzero if
either is missing; no packages are installed. This closes L3 without relying on hidden skips.

### DOCX coverage

Original heading/body/table fixture; core title present and absent; Title/Subtitle/Heading
style names including custom names; 22-word/180-character limits; directly bold runs; character
style bold (including direct bold=false with style bold=true); mixed/whitespace-only runs;
all 15 labels; sentence-end punctuation and trailing quotes/brackets; empty paragraphs;
hyperlink text in document.paragraphs but absent from paragraph.runs; all body paragraphs before
all tables; multi-paragraph cells; horizontal and vertical merged cells; Unicode astral text;
default paragraph/character styles and a missing style ID; empty-document warning.
Native DecompressionStream("deflate-raw") succeeded in Chrome. No ZIP library was needed.

Payload bytes are compared with Python's original JSON formatting and LF, not just parsed text.
No cleanup toggle or browser text normalization is applied before this comparison.

### Every PDF difference

1. **hyphenation.pdf:** pypdf body ends `Wide    spacing remains.` (four spaces).
   PDF.js ends `Wide spacing remains.` (one space). Both preserve
   `A word is hyphen-\nated across lines.`; title and warnings agree.
   This is PDF.js text extraction behavior, left visible in the comparison; no custom
   normalization was added to manufacture parity.
2. **encrypted.pdf:** the original extractor's `reader.decrypt("")` returns failure without
   raising inside its try. The subsequent metadata access raises
   **FileNotDecryptedError: File has not been decrypted**, so there was no JSON golden.
   Browser extraction returns filename title, empty body, and exactly
   **This PDF is encrypted and could not be read.** This implements Marcus's requested behavior
   and closes the traceback leak; it is an intentional difference from the old defect.

**No other differences** on fixture.pdf, columns.pdf, headers-footers.pdf, empty.pdf and
empty-password.pdf. The three varied generated articles are multi-column, hyphenation and
two-page journal headers/footers. The simple fixture and empty-password PDF titles agree.
The blank/scanned-style fixture returns exactly the existing OCR warning. These are synthetic,
real-world-style generated PDFs, not a claim about all real documents or OCR support.

### Proxy contract and guards

Missing/malformed URL remains 400 Missing URL. Public HTML, manual redirects, plain UTF-8,
remote 404, and oversized response retain the JSON shape/status/body contract
`{url, contentType, body}` / `{error}`. Offline tests use the original HTML/plain/missing body
bytes under a public-name surrogate, with injected DNS/fetch.

W2 intentionally changes the original loopback-target tests to rejection, POST to
405 GET required, and /api/extract-file to 404. It is impossible to retain those original
statuses while also following W2's explicit GET-only/SSRF/removal requirements. They are
recorded contract changes, not claimed old/new server parity.

81 proxy checks cover private/special IPv4 and IPv6 (mapped/embedded/tunnel forms), alternate
IPv4 URL spellings, hostname suffixes, schemes, ports, credentials, method, Origin, any unsafe
DNS answer, DNS failures, all redirect validation, five-hop boundary, no client headers,
3 MiB boundary/overflow, generic errors and the 12-second streamed-body deadline.
Deadline testing triggers a controlled timer and asserts its actual production value is 12000;
the mutation suite does not wait 12 seconds per row.
The Function wrapper, server and tests import lib/read-proxy.mjs; there is no copied proxy.

New mutants P1–P6 remove IP/DoH/redirect/size/Origin checks or add client-header forwarding:
all **KILLED** by named semantic assertions. All 46 old transforms are byte-unchanged.
Each row records the exact transform, target command, actual failure/exit and SHA-256 before,
mutated, restored; restore equals before and current source hashes match. M9's original proof
still applies. M1/X10 retain the disclosed safe pre-bind setup-refusal kill. No timeout or
infrastructure failure is counted as a kill. Diagnostics replace machine path prefixes for
public-repository privacy; assertions/transforms/hashes are unmodified.

### Chrome flow and visual checks

Browser plugin unavailable; existing Playwright drove installed Chrome 154.0.8037.95.
Each viewport used a fresh profile and a local server with a test-only fake outbound-fetch
preload. The app made no file POST/upload request. Page routing allowed local assets and
explicitly simulated URL fallback requests only. No unexpected page request or app console/
runtime error was recorded. Browser background networking is disabled but was not audited at
the socket layer; this is not a claim of OS-wide network isolation.

Exercised via controls: paste/sample/clear; review title/counts/warnings/four toggles/raw/back/use;
text/MD/CSV/HTML/HTM; PDF/DOCX; 24 MiB rejection; URL normalization, local-server proxy and HTML
extraction; all WPM/pacing/focus/context/size controls; fitted long word; countdown 3→2→1;
progress/restart/previous/next/sentence rewind/copy; sections; finish summary; focus mode;
Space/arrows; legacy v1 localStorage resume. Quota tests cover simulated HTML Error 1027 at
503 and static fail-open JSON at 200, direct fallback success, and preservation of reader UI.
An article containing 1027 and WORDFLOW_FREE_LIMIT remains readable: quota detection inspects
the platform response type/error field, not arbitrary article text.

Desktop/phone screenshots were inspected: meaningful UI, readable controls/privacy note,
no error overlay, clipping or horizontal page overflow in the captured states. Quota message
wraps visibly at phone width while the loaded reader stays present. Existing review behavior
leaves the review panel open after Use source; the smoke uses Back to continue, without
changing that behavior.

No inline styles/scripts exist in index.html. CSP uses style-src 'self', without unsafe-inline.
The JS style-property fitting works under CSP. Cloudflare _headers and local static headers
match; the Function supplies its own JSON safety headers.

## Findings and unverified boundaries

- **F1, inherited reader edge case, outside hosting scope:** a 135-character artificial token
  (the 45-character long word repeated three times) still spans 640.89 px in a 604 px desktop
  frame at the existing 10 px font floor. The authentic 45-character long word fits on both
  viewports. The fitting helper is unchanged; a separate reader task can decide the minimum.
- **F2, platform documentation limit:** Cloudflare documents Error 1027 but not guaranteed HTTP
  status/exact body. The simulations are not an observed Cloudflare response. Real fail-open
  mapping to static api/read needs the live check.
- **F3, expected residual proxy risks:** DoH/fetch DNS rebinding gap; Origin is not authentication;
  non-browser clients can exhaust the account quota. Worker edge has no access to Marcus's LAN;
  local dev shares the DNS race. Conservative allocation policy may reject special public IPs.
- **F4, launch verification pending:** actual Pages build/deploy, CPU under 10 ms at maximum body,
  invocation exclusion/account quota reset, HTTPS response headers and platform logging state.
- **F5, compatibility:** other browsers/native-deflate support, broader document corpora, a
  genuinely corrupted per-page PDF read failure, Windows 8.3 spellings and lower Node versions
  were not verified. Per-page error handling emits the required message but was not triggered
  by this corpus.

**CC L1–L4 closed in the build:** no Python/runtime dependency; generic server/proxy errors;
no successful test skip path; rewritten HOSTING without stale line anchors. New independent
CC review must reproduce these claims. Historical L5–L8 are still disclosed where applicable.

## Handoff

CC review → merge and gated push → Marcus's separate email-history confirmation (W3 already
complete) → Marcus makes repo public → free Pages account/Git connection with exact HOSTING.md
settings → live check. Only master becomes production; preview deployments must be disabled.
Nothing in this report authorizes bypassing the push gate or changing the frozen MarcDeck copy.

Brain context was retrieved before meaningful work. Final Brain writeback updates the project,
hot-cache/current-state and one HH:MM Codex worklog entry. The dated daily note was absent when
checked; none was created.
