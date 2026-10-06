# WordFlow

WordFlow is a static speed reader: paste text, upload text/HTML/PDF/DOCX, or load a website.
Source review includes four cleanup controls; the reader supports pacing, focus, sections,
progress, keyboard controls and compatible browser-local resume.

This standalone repository is canonical under [W1](docs/DECISIONS.md). Marcus's
[W2](docs/DECISIONS.md) authorizes the free Cloudflare static build. Development continues
after launch. Deployment happens only by Cloudflare's Git integration from master, after review.
The only push path is `bash tools/push.sh`; the gate and pre-push hook remain mandatory.

## Local use

Node **24.16.0 or later**; no npm install, Python or secret is needed.

```powershell
npm start
```

Open the printed URL, normally http://localhost:8080/. Bind remains 127.0.0.1; occupied
ports retry the next 20. Stop with Ctrl+C. HOST and PORT come from the shell only;
environment files are never read. Preserve all [R59 controls](AGENTS.md).

Files parse locally in a modern browser, with a 24 MiB limit. PDF.js is pinned and vendored;
DOCX uses native DecompressionStream("deflate-raw"). Chrome is verified; other browsers and
older versions need their own validation. URL reading uses a same-origin proxy, then the
existing direct-fetch fallback. See [HOSTING.md](HOSTING.md) for policy and residual risks.
The local server sends URL hostnames to `cloudflare-dns.com` for DNS-over-HTTPS, including
redirect destinations. LAN-only and hosts-file names fail; private destinations are refused.

## Build and verify

```powershell
npm run build
npm test
npm run parity
npm run mutations -- --out docs/verification/results/static-mutations.json
npm run smoke
```

Build copies only named site assets to ignored dist/. Cloudflare publishes that directory;
its Git pipeline compiles functions/api/read.js from the root. No Wrangler is needed locally.
Exact project settings and Marcus's review-to-live sequence are in [HOSTING.md](HOSTING.md).

`npm test` runs only Node suites, without Chrome or Playwright, and fails nonzero on any failure;
there are no skips. The push gate runs these suites and checks `tests/parity-stamp.json`.
`npm run parity` runs extraction parity and the Chrome smoke, then generates the stamp only on
success. It is REQUIRED before merge for changes to `file-extractors.mjs`, `vendor/**`,
`tests/fixtures/**`, `app.js`, `index.html` or `styles.css`. Commit the generated stamp; never
hand-write or edit it. A missing/stale stamp refuses a push and directs you to `npm run parity`.
W5 keeps the frontend files stamped. The gate hashes the committed blobs at the sha being pushed,
and refuses skip-worktree or assume-unchanged flags on stamped paths. Recording uses only tracked
inputs, normalizes text as Git does and ignores scratch files; binary fixtures/vendor retain their
bytes. No CI is added: written rules and review protect against deliberate stamp forgery (W5.2).

Parity requires already-installed Chrome and Playwright and fails nonzero if either is missing.
Set WORDFLOW_CHROME and WORDFLOW_PLAYWRIGHT_DIR if needed. The Playwright fallback is Codex's
runtime cache at `<home>/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.
Nothing is installed by these commands. Node unit tests inject fake fetch; the local proxy smoke
uses a test-only preload and synthetic inputs. Real Cloudflare deploy/CPU/quota behavior awaits
Marcus's connection and live check.

Ten successful goldens were committed in 3921959 before Python removal. The `labels.docx` and
`defaults.docx` goldens came with the browser build and CC verified both Python-identical.
Three S5 fixtures/goldens were added after review using the historical extractor from 3921959
and the existing python-docx 1.2.0 runtime. Python is used only for this recorded fixture capture.
All seven PDFs are asserted: five byte-identical and two precisely pinned differences. See the
[static-hosting report](docs/verification/2026-10-06_codex_static_hosting.md) and evidence in
docs/verification/results/. The original split reports remain historical.

Known DOCX divergences from python-docx (CC's synthetic corpus): browser extraction accepts
backslash main/styles targets, external styles relationships (ignored), duplicate main/styles
relationships (first selected), styles pointing at the document, case-differing Styles.xml,
percent-encoded targets, a .dotx content type and dangling unrelated image relationships where
python-docx errors. Without core properties, the browser title uses the filename rather than
python-docx's `Word Document`. Duplicate unrelated ZIP parts are accepted; a duplicate selected
part is refused. These malformed-package leniencies do not escape the in-memory ZIP or its limits.
Quota matching handles Error 1027, nonbreaking spaces, Error: 1027 and error code 1027.
Unconfirmed bare-number or JSON-shaped 1027 responses are generic errors; the live check remains
required to validate Cloudflare's actual page and fail-open routing.

Copyright (c) 2026 Marcus, all rights reserved. [LICENSE](LICENSE).
[Third-party notices](THIRD_PARTY_NOTICES.md) ship with the site.
