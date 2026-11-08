# WordFlow decisions

## RULING W6 — F1 long-token overflow

MARCUS'S RULINGS (2026-10-07, relayed by the claude.ai orchestrator). Recorded verbatim before any code change.

W6.1 F1 (W4.5): a single token that still exceeds the reader frame's width at the existing 10 px fitting floor is broken across lines inside the frame. The break applies ONLY below the floor. Every token that fits at or above the floor renders exactly as before; the floor itself does not change.
W6.2 The token's text is not altered: no characters added, removed or replaced in the underlying word, copy, progress or resume data. Whether a visual hyphen is shown at break points is an implementation choice; label it as such.
W6.3 Work on local branch fix/f1-long-token. Do not merge or push. An independent review follows.
W6.4 Docs-only record corrections in this task are authorized as listed in the task (repository AGENTS.md/HOSTING.md and the vault).

W6.5 (Marcus, 2026-10-07, relayed by the claude.ai orchestrator) Vertical bound. The reader frame keeps its normal height for every token; no content-driven frame growth. A token that, after W6.1 breaking at the 10 px floor, still exceeds the frame's normal height is shown in a display area that scrolls vertically within the frame. If playback is running when such a token is shown, playback pauses on it through the existing pause path; the reader resumes with the existing play control. The token stays one word: its text, word count, progress, navigation step and the wordflow-reader-session-v1 resume record are unchanged. A short visible note is shown only for that token: "Long text paused — scroll to read, then press play." Every token that does not overflow vertically behaves exactly as under W6.1.
W6.6 W6.3 continues: local branch only; no merge or push; an independent review follows.

W6.7 (Marcus, 2026-10-07, relayed by the claude.ai orchestrator; CC D1) Scroll trigger. A wrapped token enters the W6.5 scroll state when its natural height exceeds the free height between the previous/next context-word strips, computed from the live layout (CC measured 117 px at 390x844, 286 px at 1400x950, 282 px in focus mode). The same threshold applies whether context words are shown or hidden. A wrapped token below the threshold must not overlap the context words or the note.
W6.8 (CC D2) Wide frames. Fitting measures each token against the width actually available to the word display, including its max-width cap and any child overflow, not against 90% of the frame alone. This amends W6.1's "renders exactly as before": tokens that are clipped on master may now shrink and, at the 10 px floor, break under W6.1. Every token that fully fits on master still renders exactly as before.
W6.9 (CC D3) One Play press. When the reader is paused on a scroll-state token, however it got there (auto-pause, Next/Previous, a progress seek or Resume), one Play press continues to the next word through the existing countdown. On the final word, Play finishes exactly as master does after a normal final word: the note and every long-text state are cleared, and the behaviour after finishing is identical to master's.
W6.10 (CC D4) Space key. On the focused scroll area, Space scrolls it. Everywhere else Space keeps its existing play/pause role. Focus never moves into the scroll area automatically.
W6.11 (CC D5-D6) One Codex fix round, then one CC re-review. Local branch only; no merge or push. F1 is not described as implemented or fixed in any record until the re-review is CLEAR.

W6.12 (Marcus, 2026-10-07, relayed by the claude.ai orchestrator; resolves the round-2 STOP; replaces W6.8's measurement sentence, and W6.8's guarantee is restated here) Wide frames. A token is fitted (with the existing 12-step search, base sizes, flooring and 10 px floor unchanged) when master's existing check would fit it, OR when its rendered text extends beyond the reader frame's inner edge, measured from the rendered text and not from the capped display box. A token fitted only because of the second condition is fitted by the existing search to master's existing 90%-of-frame target, measured on its rendered text width. At the 10 px floor, W6.1 breaking applies when the rendered text still exceeds the frame's inner width. Every token whose rendered text lies fully inside the frame on master renders exactly as on master (font size, rectangle, classes, text), including tokens wider than the 820 px display box.

W6.13 (Marcus, 2026-10-07, relayed by the claude.ai orchestrator; CC re-review decisions 1-3) Finished screen. The finished screen fits the last word exactly as during reading: master's shrink-to-fit plus W6.12 and W6.1. It never shows the long-text note and never auto-pauses. Every last word that is fully visible on master's finished screen renders exactly as on master. A last word in the W6.7 scroll state stays in its scroll area without the note. This is one narrow fix round, as an exception to W6.11, followed by a short CC check of this fix only. CC's O-2 (resize leftover class) and the landscape-note behaviour are accepted as they are.

W6.14 (Marcus, 2026-10-07, relayed by the claude.ai orchestrator; resolves the R-1 STOP; amends W6.13's collision condition) On master, the Finished panel overlays the centre of the reader frame and every last word lies beneath its translucent background. That is master's existing design and is not a collision. On the finished screen a collision means only: any part of the last word lying outside the frame's inner bounds; the word painted above the Finished panel or any control; or any change to a last word that is fully visible on master's finished screen. A last word in the W6.7 scroll state keeps its geometry on the finished screen but becomes inert: not focusable, no region role, no accessible description, no note, no scrolling interaction. All other W6.13 text stands.

W6.15 (Marcus, 2026-10-08, relayed by the claude.ai orchestrator) CC's O-A is accepted as is: on wide screens a scroll-state last word keeps its reading area on the Finished screen, and its text may show above and below the translucent Finished panel, as W6.14 permits. Marcus authorizes a fast-forward merge of fix/f1-long-token into master and a push only through tools/push.sh.

## RULING W5 — delta-review fixes, merge and gated push

MARCUS'S RULINGS (2026-10-06, relayed by the claude.ai orchestrator). Recorded verbatim before any code change.

W5.1 (D-a) Keep stamping app.js, index.html and styles.css in addition to the W4.2c files.
     Frontend pushes therefore need a fresh `npm run parity`; proxy-only fixes stay pushable.
W5.2 (D-b) No CI. Protection against deliberate stamp tampering is the written rule plus review.
     Fix N2.
W5.3 (D-c) The self-host guard refuses the whole project pages.dev name and every subdomain of it.
     Derive the name AUTOMATICALLY from the request host: when the request host ends in
     ".pages.dev", the project name is its last three labels, and that name plus all its
     subdomains are refused. This is in addition to the request host itself and SITE_HOSTNAMES
     (kept for custom domains). The guard must not depend on the configured name being right.
W5.4 (D-d) "wordflow.pages.dev" belongs to someone else. Remove it as a default from
     SITE_HOSTNAMES and the docs. Marcus chooses the Pages project name when creating it. HOSTING.md
     tells him to record the assigned *.pages.dev address afterwards. No code change is needed for
     the name, because of W5.3.

Marcus authorizes this task's verified fast-forward merge to master and push only through
tools/push.sh; stop if the merge is not a fast-forward or the gate refuses. Repository visibility
and Cloudflare remain Marcus's launch steps.

## RULING W4 — post-review fixes

MARCUS'S RULINGS (2026-10-06, relayed by the claude.ai orchestrator). Recorded verbatim before code changes.

W4.1 (D1) The repository may go public with the existing Windows user-profile paths in tracked
     files and history. No scrub or history rewrite.
     From now on, NEW or EDITED committed content must not add real user-profile paths; use
     placeholders such as <home> or <vault>. Add this as a rule in AGENTS.md. Existing operational
     paths in AGENTS.md and CLAUDE.md may stay.

W4.2 (D2) Gate design = CC option C, with a stamp check.
     a. `npm test`, and therefore tools/push.sh, runs only the Node suites. No Playwright and no
        Chrome. It must still exit nonzero on any failure and never skip.
     b. A new `npm run parity` runs the browser extraction parity and the Chrome smoke. It is a
        REQUIRED pre-merge step for any change to the files in (c), and for any change to app.js,
        index.html or styles.css. Document this in AGENTS.md and README.
     c. `npm run parity`, on success only, writes a committed stamp file. The stamp holds the
        SHA-256 of every file in lib/file-extractors.mjs (or wherever extraction lives), vendor/**
        and tests/fixtures/**, plus the Chrome and Playwright versions used.
     d. tools/push.sh refuses to push when any of those files' current hashes differ from the
        stamp. The message tells the user to run `npm run parity`.
     e. Never hand-write or edit the stamp. Add that rule next to the existing marker rule.
     f. Add tests:
        - push.sh/stamp logic refuses on a changed fixture and passes when the hashes match;
        - npm test passes with Playwright absent.
     g. Register a mutation that disables the stamp check. It must be KILLED.

W4.3 (D3) Marcus confirms all behaviour changes listed in CC S4 as rulings:
     - the 24 MiB cap on all files, including text;
     - /api/read is GET-only;
     - private, special, localhost and LAN destinations are refused, on the local server too;
     - ports 80/443 only; URLs with credentials refused; explicit non-http(s) schemes refused,
       including host:port input;
     - at most 5 redirects, each revalidated.
     Correct your earlier report's attribution: these are now W4.3, not W2 text. Do this with a
     dated "Correction" note appended to your own report; do not rewrite the old text.

W4.4 (D4) W3 fully settles the email-history step. Remove it from HOSTING.md's manual sequence.

W4.5 (D5) F1 (the 135-character token overflow) is deferred to a separate reader task after launch.
     Record it as an open item.

W4.6 The privacy note text becomes exactly:
     "Files are read in your browser and never uploaded. Links you load are fetched through
     WordFlow's proxy on Cloudflare. Cloudflare and the website you load can see the request,
     including your IP address. If the proxy fails, your browser contacts the website directly.
     Nothing is stored except your own resume session in this browser."
     Mirror it in HOSTING.md's privacy section, together with CC's points:
     - CF-Connecting-IP / X-Real-IP;
     - the CF-Worker header;
     - DoH hostnames.
     If the current note's first and last sentences differ from the text above, keep the meaning
     but use this text.

## RULING W2 — static hosting

MARCUS'S RULINGS (2026-10-05, relayed by the claude.ai orchestrator). Recorded verbatim on 2026-10-06.

W2.1 Hosting.
- WordFlow becomes a public, STATIC website on Cloudflare's FREE plan.
- Condition: every current feature stays intact, and development continues after launch.
- There is no paid tier, card or paid add-on.

W2.2 URL reading.
- A Cloudflare Worker / Function at the same origin serves /api/read.
- Expected load is under 100,000 requests/day.
- If the free daily limit is reached, the rest of the site must keep working. URL loading must fail
  with a clear message, never a crash or a blank page.

W2.3 Visibility.
- The GitHub repository becomes public. Marcus flips this himself, after review and after a separate
  email-history decision.
- Do not change repository settings.

W2.4 Licence. Replace LICENSE with exactly:
  "Copyright (c) 2026 Marcus. All rights reserved.
  No permission is granted to use, copy, modify, merge, publish, distribute, sublicense or sell this
  software or any part of it without the prior written permission of the copyright holder.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT
  SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM, OUT OF
  OR IN CONNECTION WITH THE SOFTWARE OR ITS USE."
  Bundled third-party code keeps its own licence. Its notices go in THIRD_PARTY_NOTICES.md and ship
  with the site.

W2.5 Dispositions (CC review section 7).
- #3, #4, #5, #6 and #12: CONFIRMED by Marcus.
- #7: REMOVE loadLocalEnv. WordFlow has no secrets.
- #11: SUPERSEDED. Python leaves the product, so the pins, the resolver and the Codex-runtime
  fallback go away.

W2.6 Record corrections.
- Update DECISIONS rows #1, #2, #10 and #16 to match AGENTS.md's "Resolved on 2026-10-05": private
  GitHub repo, CC review CLEAR, push gate built.
- Record that the default branch was named `main` during the build and review and is `master` now.

W2.7 Vendoring. Marcus approves adding pinned third-party browser libraries as files in the repo:
- pdf.js (pdfjs-dist), taken from the official npm registry tarball;
- optionally one small zip-inflate library, only if the browser's native DecompressionStream
  ("deflate-raw") proves insufficient.
For each, record the version, the npm integrity hash and the SHA-256 of every vendored file.
Nothing is installed into the machine's Node or Python. No CDN at runtime.

### W2 workflow and R59 exception (Marcus, task dated 2026-10-06)

Work on local `feat/static-hosting`; do not merge or push. Deployment happens only by
Cloudflare's Git integration from master, after review. W2 authorizes extending R59's
STATIC_FILES by exact new site and vendored filenames only; all other R59 protections
remain in force. Remove the env loader and Python product code after preserving goldens.
The default branch was named `main` during the build and review; it is `master` now.

RULING W1 (Marcus, 2026-10-05): The standalone WordFlow repository is canonical for
WordFlow from its first commit. The WordFlow copy inside MarcDeck is frozen and will be
removed under a MarcDeck ruling. WordFlow fixes go to the standalone repository only.

## Recon decisions 1–19

Source: MarcDeck `docs/verification/2026-10-01_cc_recon_wordflow_split.md`, section 3.5. The 2026-10-05 task settles this local extraction only. Engineering choices below are implementation choices, not invented Marcus rulings.

| # | Recon decision | Status and owner |
|---|---|---|
| 1 | Repository name | **Resolved 2026-10-05:** WordFlow, private GitHub backup repository created. |
| 2 | Visibility | **Resolved 2026-10-05:** private GitHub repository. W2.3 authorizes Marcus to make it public after review and the separate email-history decision; not performed in this build. |
| 3 | Deferral and sufficient regression | **Confirmed by Marcus, W2.5:** the never-committed pre-split regression run is sufficient for the extraction. MarcDeck remains unedited. |
| 4 | Server strategy | **Confirmed by Marcus, W2.5:** independent trimmed server. W2 now shares one platform-neutral proxy with the Pages Function. |
| 5 | History method | **Confirmed by Marcus, W2.5:** M2 plumbing replay. W3 later changes only the authorized email metadata/content. |
| 6 | Paths that travel | **Confirmed by Marcus, W2.5:** the original five paths, with screenshots and pyc dropped. W2 later removes Python and adds named static/vendor assets. |
| 7 | Env handling | **Marcus W2.5:** REMOVE loadLocalEnv. WordFlow has no secrets; environment files are never read. |
| 8 | Retire MarcDeck guard/fence, dispositions | **Open — Marcus's separate MarcDeck ruling and its designated implementer.** No guard, fence, hook or bug disposition changed. |
| 9 | Delete protected files in MarcDeck | **Deferred — Marcus.** Explicitly prohibited in this task; frozen copy remains. |
| 10 | Executor, verifier, pusher | **Resolved 2026-10-05:** Codex built; independent CC review CLEAR; normal gated push completed. W2 requires a new CC review before merge/push. |
| 11 | Python pins and resolver | **SUPERSEDED by Marcus, W2.5:** Python leaves the product; pins, resolver and Codex-runtime fallback removed after committed goldens. |
| 12 | Node floor | **Confirmed by Marcus, W2.5:** Node >=24.16.0. Lower versions remain unverified. |
| 13 | S1/local server protections | **Settled on verified source master** by merged RULING 59; all protections carried and tested here. No new MarcDeck fix in this task. |
| 14 | Public /api/read policy and backup | **Marcus W2:** free public static Pages site, same-origin URL Function and explicit proxy policy; implementation choices and residual risks in HOSTING.md. GitHub backup remains unchanged. |
| 15 | MarcDeck / after removal | **Open — Marcus and MarcDeck engineer** under its removal ruling. |
| 16 | WordFlow hooks / push gate | **Resolved 2026-10-05:** tools/push.sh and .githooks/pre-push built, independently reviewed, active. Only master may be pushed; gate stays mandatory. |
| 17 | MarcDeck upload producer | **Open — Marcus and MarcDeck engineer.** No new cross-repo dependency introduced; removal phase must settle its extractor. |
| 18 | Timing in MarcDeck build order | **Settled for WordFlow extraction:** execute this task now. MarcDeck removal timing remains **Marcus/orchestration**. |
| 19 | Eight local ZIP copies | **Marcus's ruling, relayed by the orchestrator:** checked archived ref commits 2026-10-05; moved to quarantine for Marcus to delete; report in the vault. |

## Other open decisions

**Licence resolved by Marcus, W2.4:** LICENSE now contains the exact all-rights-reserved text; bundled third-party licences remain and notices ship. W2 authorizes static hosting; CC review and Marcus’s connection/live steps remain. RULING W1 does not authorize any edits or removals in MarcDeck. W1 canonicality takes effect from the replayed first commit; this file is recorded in the follow-up implementation commit, as required by M2's provenance step.

## RULING W3 — history email privacy

Marcus's rulings, 2026-10-05, relayed by the claude.ai orchestrator:

- **W3.1** Every commit's author and committer email becomes `292589207+MarcTheSharkWalksInThePark@users.noreply.github.com`. Everything else stays unchanged: names, dates, timezones, messages and parent order.
- **W3.2** Every occurrence of the old personal email inside committed FILE CONTENT, in every commit, becomes the text "<email redacted>". This includes other agents' reports. This is a one-time exception to "never edit another agent's report". Redaction is the only permitted change to those files.
- **W3.3** The GitHub remote is NOT force-pushed. After local verification, Marcus deletes the GitHub repository and recreates it empty, private, with the same name. Then the rewritten master is pushed through `tools/push.sh` as normal. No `--no-verify`, no hand-written marker, no force push.
- **W3.4** This repository's local `git config user.email` becomes the no-reply address, so future commits never carry the personal email.

Implementation: all eight existing commits and both local branches rewritten and verified; one report file redacted by exact byte replacement. Earlier WordFlow SHA citations are pre-rewrite; the old-to-new mapping is in `docs/verification/2026-10-05_codex_history_email_rewrite.md`. The additional final commit records this ruling and report. Marcus confirmed the empty-private-repository recreation and email settings with `done`; the normal `tools/push.sh` push passed, and a fresh GitHub clone passed the identity/content/reachable-object privacy checks. No force push or gate bypass was used.

## W2 implementation choices — Codex, 2026-10-06

Pages Functions with Git integration; exact dist asset build; /api/read-only invocation route;
Pages fail-open with static quota marker; pinned pdfjs-dist 6.4.299; native deflate-raw for DOCX.
These are engineering choices, not additional Marcus rulings. HOSTING.md contains dated official
doc links, project settings, privacy/logging limits and the honest DNS rebinding gap.

CC findings L1–L4 are closed in this build (see HOSTING.md), subject to the new independent review.
W3's completed history work fully settles the email-history step under W4.4. W4.1 accepts
inherited profile paths; Marcus still controls the visibility change after review.

## RULING W7 — Portal '03 restyle and fullscreen (Marcus, 2026-11-07, relayed by the claude.ai orchestrator)

W7.1 Scope. Visual restyle of index.html, styles.css and assets/wordflow-mark.svg to the "Portal '03" design (early-2000s portal look: grey metal panels, glossy gel buttons, LCD readouts, black reading screen), plus the additions in W7.4–W7.8. Same layout (Source | Reader | Settings), same features, same reading behaviour. app.js changes are limited to what W7.4–W7.8 need.
W7.2 Accent: lime. Dark theme: graphite. Light theme: "Mint" (green-tinted greys). The reading screen stays black in both themes.
W7.3 Logo: "K — Steel plate": an engraved metal nameplate reading WORDFLOW with a lime power light. Tagline "one word at a time".
W7.4 Theme switch. Default follows the device's prefers-color-scheme. A "Lights on / Lights off" button switches theme for the current page only. NOTHING is stored: no localStorage, sessionStorage, cookie or session field for theme. The approved privacy text is unchanged.
W7.5 Fullscreen. A Fullscreen button uses the browser Fullscreen API on the reader panel. In fullscreen: large word, top bar (title, position, time left, WPM LCD with − / + buttons in 25 WPM steps, "Exit fullscreen (Esc)"), bottom progress, transport and shortcut hint. Controls auto-hide while playing and reappear on pointer/keyboard/touch activity. Where the Fullscreen API is unavailable or refused (for example iPhone Safari), the button falls back to the existing Focus mode and says so in the status line.
W7.6 Keyboard: F toggles fullscreen (not while typing in a field and not with Ctrl/Meta/Alt). Esc exits (browser default). Space and arrow keys are unchanged.
W7.7 Extras: a "TIP" ticker bar under the header ("Press Space to play or pause. Use the arrow keys to step one word. Press F for fullscreen."), and footer badges NO UPLOADS, 100% FREE, PRIVACY FIRST.
W7.8 Tests. Browser checks that compare the candidate's visual presentation with the baseline (computed font/colour/line-height/letter-spacing, element rectangles, pixel/screenshot equality) may be re-baselined: their visual-equality assertions are replaced by self-consistency invariants on the candidate, and the remaining baseline comparisons stay pinned to pre-F1 commit b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7 (W7.10). Every behaviour, data, security and extraction assertion stays unchanged. Any failure of those is a STOP, not a re-baseline.
W7.9 No merge, push, deploy, package install, R59/proxy/Functions/_headers/_routes/gate change, or STATIC_FILES change under W7. Independent Claude Code review follows; Marcus decides merge/push.
W7.10 Baseline repair. The F1 browser suites compared against the moving ref `master`, which since the 2026-10-08 F1 merge points at the F1 fix itself, so `npm run parity` fails on untouched master (eight W characters at 1708x950). Before any W7 code: pin those comparisons to b9d3d9eedf5f67b9b6c03742faae8cf35e3cb7e7 with no other test change, verify that npm test and npm run parity pass on the untouched frontend, and commit the regenerated stamp. Chrome 156.0.8078.81 is accepted; the stamp may differ from the previous one only in the Chrome version.
W7.11 Exposure-test floor. In tests/server_exposure.test.js, the check "front-end references are derived from the WordFlow document, and none is a directory or wildcard" replaces only its count assertion `refs.length >= 4` with: the set of DISTINCT references from index.html equals exactly { "app.js", "styles.css", "assets/wordflow-mark.svg" } (order-independent; the failure message lists the set found). Rationale: the old count of 4 included assets/wordflow-mark.svg twice (favicon + header image); W7.3 removes the header image, and the distinct served set is unchanged. The per-reference isFile loop, frontEndReferences(), frontEndFiles() and every serving/exposure check stay byte-for-byte unchanged. No other R59 protection or test changes.

W7.12 Reader geometry. Root cause (from your geometry.json): at 1400x950 the reader frame shrank from 606x627 (pre-restyle) to 485x338, because of the max-width: 1100px shell in the orchestrator's spec plus the new ticker/footer height, while Large stays 128px. The 1100px cap was an orchestrator spec error. The fix restores the reader's space; it does not shrink word sizes.

1. Remove the 1100px max-width cap. Keep the pre-restyle layout width and the Portal '03 look (shell background, borders and bars can stay full-width). Keep the ticker and footer, but make them compact enough that they don't take the reader's height.
2. Measure first, change gates second. At every smoke viewport (390x844, 390x600, 768x1024, 1400x900, 1400x950, 1708x950, 1920x1080), in both themes, in normal and focus mode, record the reader frame width and height on the candidate and on 2a376445ceb1b98a1b4c943cf8834e77e0578120. Put the table in the report before anything else.
3. Gates now in force:
   a. The existing word-vs-context geometry assertion stays as it is, with clearance >= 8px top and bottom for the Large, Comfort and Compact sizes at every viewport above.
   b. At 1400x950 normal mode, the frame width and height must each be >= the pre-restyle values (606x627) minus 5%.
   c. At every other viewport, report the ratio to pre-restyle. Do not invent a threshold. If any ratio is below 90%, STOP and report the table so Marcus can rule on it.
4. Changes allowed only in styles.css (and index.html structure only if the ticker or footer must move). No change to word sizes, the fitting logic in app.js, or any test except restoring the existing geometry assertion if your drafts touched it.
5. Then resume the full W7 verification exactly as specified: the phone interaction suite, npm test, parity and stamp, mutations (78 = 77 KILLED + M9), build, and all screenshots in both themes. All other STOP conditions stand.
6. Record W7.12 verbatim in docs/DECISIONS.md as its own records commit before the CSS commit.

### W7 clarifications (Marcus, 2026-11-08)

Marcus approved the prepared index.html patch removing two leading spaces before the Play SVG and two before the closing button tag: "Apply the whitespace fix and resume verification".

Marcus's response on the two wide-frame target checks:

Approved, as a W7.8 visual re-baseline. Conditions: (1) the 90% target still applies to every token where the candidate's own unfitted width exceeds the frame, so F1's fitting is still tested; (2) "fully inside the frame" stays asserted for these two tokens and every other probe; (3) list both tokens in the report with their unfitted width, rendered width, frame width and percentage. PRE_F1 comparisons and every data, behaviour and security check stay unchanged. Then rerun parity.
