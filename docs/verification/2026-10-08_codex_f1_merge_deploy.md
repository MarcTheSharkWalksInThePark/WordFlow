# F1 merge and deployment

2026-10-08, Codex. Marcus authorized this task and accepted CC's O-A under W6.15.
F1 fixed under W6.1-W6.15, deployed **188d65e877c9cf63096bcc1e8abc2b523f16f07d**.

Read AGENTS.md, W6.1-W6.14, HOSTING.md, CC's R-1 CLEAR report (c98cb51), and the
relevant vault rules/project/current context. No product, stamp, security guard, dependency
or hosting setting was changed in this task.

## Merge and gate

Remote refreshed before merge: master, origin/master and GitHub master all equalled
b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7. Clean starting branch fix/f1-long-token
at 2a2a5c8a0b0695a4d7f7f9fd294b51c90748f3bd.
Recorded the exact W6.15 text in docs/DECISIONS.md alone in commit 188d65e.
`git diff HEAD^ HEAD --name-only` listed only that document; no stamped input changed.
`node tools/parity-stamp.cjs` passed on the branch, after fast-forward merge, and in the gate.
`git merge --ff-only fix/f1-long-token` advanced master to 188d65e; no merge commit.

`npm test`: 223 static + 169 proxy + 32 exposure + 81 post-review = **505, zero skips**.
Evidence: results/f1-live/node-tests.txt. Test-output no-skip validation also passed.

The initial `bash tools/push.sh` invocation could not start because bash was absent from
PowerShell PATH. The installed Git Bash executable then ran **the same tools/push.sh**.
No gate refusal or workaround occurred. Gate output:

```text
PASS: pre-push hook active (.githooks)
PASS: on branch master
PASS: working tree is clean
PASS: no tracked .env* file
PASS: master is not behind origin/master
PASS: npm test (no skips)
PASS: browser parity stamp matches committed inputs
To https://github.com/MarcTheSharkWalksInThePark/WordFlow.git
   b9d3d9e..188d65e  master -> master
PASS post-push: origin master = 188d65e877c9cf63096bcc1e8abc2b523f16f07d
```

Gate timestamps: 16:41:48 UTC gates=PASS; 16:41:53 UTC pushed=... OK.
The new tools/push.log entries are committed with this follow-up record; **no second push**.

## Deployment and scoped live checks

GitHub's Cloudflare Pages check for the exact SHA first reported Building, then completed
with conclusion success, title Deployed successfully, latest commit 188d65e, deployment
f5719257-a400-4a2c-ad0a-3d52d3ed8163. Before tests, production app.js/index.html/styles.css
returned 200 and matched the local committed SHA-256 values. Confirmation completed within
minutes, under the 15-minute deadline. Evidence: deployment-check.json and deployment-assets.json
under results/f1-live/.

`npm run smoke:live -- https://wordflow-reader.pages.dev/ --out docs/verification/results/f1-live/smoke-live.json`
passed 3/3: public example.com HTML 200, private refusal 403, self refusal 403.

Browser plugin not available; Marcus explicitly requested existing Playwright and installed
Chrome. Used Playwright 1.62.1, Chrome 155.0.8059.39, three live page loads and three local
page loads total. The local server remained loopback-only. Synthetic pasted text only.

| Check | Result |
|---|---|
| Page identity/content, screenshots, app errors | WordFlow Reader; meaningful UI; no error overlay; zero console/page errors |
| Finished understanding., 390x844 | 43 px; text/DOM class/font and rectangles exactly equal local reviewed code; inside frame |
| Finished understanding., 1920x1080 | 108.8 px; same exact local equality; inside frame |
| Real 45-character word, 1920x1080, Large | Pneumonoultramicroscopicsilicovolcanoconiosis fully inside frame |
| W2000, 390x844 | Wrapped/scroll state; auto-paused at index 1; exact visible note; one Play advanced to index 2/countdown, then Finished |
| W2000, 1920x1080, Large | Wrapped at 10 px, natural text height 213.5 px fits free height; inside frame; playback remains running without note, as W6.7 requires |

First harness attempt wrongly waited for desktop W2000 to enter scroll pause and timed out.
The phone checks had already passed. Corrected that expectation to match W6.7 and reran only
desktop. This was a harness correction, not a product change. Original output is preserved
as browser-first-attempt.json; desktop rerun browser-check.json; consolidated passing rows
browser-summary.json. Script and finished/long-token screenshots are in the same folder.
Finished screenshots were visually inspected. Master's translucent panel behavior is preserved.

## Cleanup and records

Deleted: `<home>/AppData/Local/Temp/wordflow-r1-hand-69e5acadb2854bd78f79a34c94e99c3a`.
Immediately before deletion, resolved the absolute path under the actual Temp root and outside
the canonical repository; refused reparse targets; checked its .git directory and Git top-level.
Origin was `<home>/Documents/WordFlow/.`, resolving to the canonical WordFlow repository.
The dirty temporary mutant files were covered by Marcus's explicit deletion request.
Native PowerShell Remove-Item -LiteralPath deleted it; subsequent existence check was false.

Skipped under `<home>/AppData/Local/Temp/` (outside this retained F1-clone cleanup scope):

- wordflow-diag-review-d457e544d9094e1297cfbc5290e21c50
- wordflow-fix-review-eb309926ce1a4ac0b771b32fbf2643d8
- wordflow-w3-github-20261005-l0zlkigt
- wordflow-w3-github-20261005-oz8qm0id
- wordflow-w3-independent-6qt80f7r
- wordflow-w3-independent-ppqzzyl_
- wordflow-goldens-cd57p87r (unrelated extraction temporary directory)

CC scratch folders were not touched; Marcus reports having deleted them by hand.

AGENTS.md F1 item closed; residual Cloudflare checks retained verbatim. Vault project,
hot-cache WordFlow context, current-state, Codex/Claude logs and wiki trace updated append-first.
The requested 18:40 Claude entry is copied verbatim. Today's daily note is absent and was not created.

## NOT verified

Actual quota/fail-open routing at runtime; maximum-body edge CPU; Functions log-session state;
whether daily request counts exclude static page views. DNS rebinding and unauthenticated quota
exhaustion remain residual risks. No load testing, physical-touch testing, other browsers,
zoom/Unicode matrix, or repeat full parity/mutation review was performed. Existing CC CLEAR
and generated stamp remain the pre-merge parity evidence.

Agent: Codex (gpt-6.1-sol, high)
