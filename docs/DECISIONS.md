# WordFlow decisions

RULING W1 (Marcus, 2026-10-05): The standalone WordFlow repository is canonical for
WordFlow from its first commit. The WordFlow copy inside MarcDeck is frozen and will be
removed under a MarcDeck ruling. WordFlow fixes go to the standalone repository only.

## Recon decisions 1–19

Source: MarcDeck `docs/verification/2026-10-01_cc_recon_wordflow_split.md`, section 3.5. The 2026-10-05 task settles this local extraction only. Engineering choices below are implementation choices, not invented Marcus rulings.

| # | Recon decision | Status and owner |
|---|---|---|
| 1 | Repository name | **Partly settled:** local path is WordFlow. GitHub name remains **Marcus**; no remote created. |
| 2 | Visibility | **Open — Marcus.** No push or publication. |
| 3 | Deferral and sufficient regression | **Settled for this extraction by the task:** proceed now; its requested route/extractor/local-fetch corpus ran green against old master **before** creating the new repo. MarcDeck is not edited. |
| 4 | Server strategy | **Settled:** independent trimmed server with copied helper logic; no shared package. |
| 5 | History method | **Settled:** M2 plumbing replay, no installs; five original blobs, exact author/committer/dates/message. |
| 6 | Paths that travel | **Settled:** index.html, app.js, styles.css, assets/wordflow-mark.svg, extract_text.py. SETUP_GUIDE is verified MarcDeck-owned. Screenshots and tracked pyc omitted from history. One new synthetic smoke screenshot is verification evidence. |
| 7 | Env handling | **Settled implementation for parity:** copy no env file or secret; preserve loadLocalEnv unchanged. WordFlow needs no secret. Dummy files are test-only. |
| 8 | Retire MarcDeck guard/fence, dispositions | **Open — Marcus's separate MarcDeck ruling and its designated implementer.** No guard, fence, hook or bug disposition changed. |
| 9 | Delete protected files in MarcDeck | **Deferred — Marcus.** Explicitly prohibited in this task; frozen copy remains. |
| 10 | Executor, verifier, pusher | **Settled for this task:** Codex (gpt-6.1-sol, high) builds and verifies locally; no pusher. Independent review and any later push remain **Marcus's assignment**. |
| 11 | Python pins and resolver | **Settled:** exact observed pins pypdf 6.10.0/python-docx 1.2.0; keep existing resolver unchanged. **Later hosting owner** must choose a provisioned interpreter instead of relying on Codex's cache. |
| 12 | Node floor | **Implementation choice:** engines >=24.16.0, the version actually tested with the inherited requireHostHeader behavior. Older Node support remains unverified; any lower floor needs verification by the **WordFlow maintainer**. |
| 13 | S1/local server protections | **Settled on verified source master** by merged RULING 59; all protections carried and tested here. No new MarcDeck fix in this task. |
| 14 | Public /api/read policy and backup | **Open — Marcus, later hosting engineer.** Preserve local behavior now; HOSTING.md records required SSRF/redirect policy. Backup destination remains **Marcus**; no mirror changed. |
| 15 | MarcDeck / after removal | **Open — Marcus and MarcDeck engineer** under its removal ruling. |
| 16 | WordFlow hooks / push gate | **Open — Marcus.** No custom hooks or inherited MarcDeck push gate installed. Verification is available via npm test/mutations. |
| 17 | MarcDeck upload producer | **Open — Marcus and MarcDeck engineer.** No new cross-repo dependency introduced; removal phase must settle its extractor. |
| 18 | Timing in MarcDeck build order | **Settled for WordFlow extraction:** execute this task now. MarcDeck removal timing remains **Marcus/orchestration**. |
| 19 | Eight local ZIP copies | **Marcus's instruction, relayed by the orchestrator:** checked against MarcDeck history 2026-10-05; possibly unique entries found; nothing moved; report in the vault. |

## Other open decisions

**Licence — Marcus:** LICENSE says exactly “TO BE DECIDED BY MARCUS”. Public hosting and deployment need their own ruling and verification. RULING W1 does not authorize any edits or removals in MarcDeck. W1 canonicality takes effect from the replayed first commit; this file is recorded in the follow-up implementation commit, as required by M2's provenance step.
