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

## Build and verify

```powershell
npm run build
npm test
npm run mutations -- --out docs/verification/results/static-mutations.json
npm run smoke
```

Build copies only named site assets to ignored dist/. Cloudflare publishes that directory;
its Git pipeline compiles functions/api/read.js from the root. No Wrangler is needed locally.
Exact project settings and Marcus's review-to-live sequence are in [HOSTING.md](HOSTING.md).

Tests require already-installed Chrome and Playwright for browser extraction parity and fail
nonzero if either is missing: there are no skips. Set WORDFLOW_CHROME and
WORDFLOW_PLAYWRIGHT_DIR if needed. The existing bundled automation runtime is the default;
nothing is installed by these commands. Node unit tests inject fake fetch; the local proxy smoke
uses a test-only preload and synthetic inputs. Real Cloudflare deploy/CPU/quota behavior awaits
Marcus's connection and live check.

DOCX fixtures and exact Python goldens were captured and committed before Python removal.
PDF comparisons record unaltered differences. See the
[static-hosting report](docs/verification/2026-10-06_codex_static_hosting.md) and evidence in
docs/verification/results/. The original split reports remain historical.

Copyright (c) 2026 Marcus, all rights reserved. [LICENSE](LICENSE).
[Third-party notices](THIRD_PARTY_NOTICES.md) ship with the site.
