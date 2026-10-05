# WordFlow history email rewrite — 2026-10-05

RULING W3 (Marcus, relayed by the claude.ai orchestrator) was implemented locally. **Eight existing commits were rewritten on both local branches; one report file was redacted across six committed versions. One distinct blob and one literal file-content occurrence changed.** The old personal email is not recorded in this report.

GitHub was not changed or pushed. Marcus must delete and recreate the repository empty and private before the sanctioned push. A separate final governance commit records W3, this report and the pending push log.

## Before-change inventory

The stash was empty; one worktree, on master. The only pending working-tree edit was tools/push.log from the preceding sanctioned push. No feat/static-hosting branch existed. All eight distinct commits were inventoried across every local ref.

| Local branch | Original SHA | Rewritten tip before the final W3/report commit |
|---|---|---|
| refs/heads/master | `f3b1b8e29be94600db1126e7772ef58a44a09450` | `7fe8581e231db434d3e2a9baa9002a5fb4152565` |
| refs/heads/review/standalone | `af5c1cf0d6ef34dcbcdbddfffdb9cfc1304a8833` | `a649443a06f033794a1f952eec6eac80d3d75efe` |

Original origin/master: `f3b1b8e29be94600db1126e7772ef58a44a09450`. The actual GitHub remote retains the pre-rewrite history until Marcus recreates it. Local origin/master and symbolic origin/HEAD were advanced to the corresponding rewritten tip; origin/HEAD kept its symbolic target. No fetch or remote write was used during the rewrite.

| Role | Name | Email was the old personal email |
|---|---|---|
| author | Marcus | Yes |
| committer | Marcus | Yes |

git grep -F across git rev-list --all found content matches only in `docs/verification/2026-10-05_cc_review_wordflow_standalone.md`, in the six commits listed below. Two Codex tree-valued bookkeeping refs also contained that same report version and were inventoried and rewritten through the shared tree map. No tracked .env path was present; no .env contents were read.

| Original commit with matching file content | Path |
|---|---|
| `af5c1cf0d6ef34dcbcdbddfffdb9cfc1304a8833` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |
| `96a6be17575b1bd664a7b56aa72714867b03aad4` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |
| `17d53676a00c083495f55156c68f19fe3e6bc732` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |
| `7d5475ce7556275857f6905507d9bfbb1b026a1e` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |
| `4f89290e66268c193b0aad838372c3d362e4b231` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |
| `f3b1b8e29be94600db1126e7772ef58a44a09450` | docs/verification/2026-10-05_cc_review_wordflow_standalone.md |

Additional tree-valued refs:

| Ref | Original tree | Rewritten tree |
|---|---|---|
| refs/codex/turn-diffs/captures/1791231740201/3e65bb8c-5489-4032-a1f4-d01c5fdc222a/base | `cf4e297bf670f04a84cda5b1f22d4d1a2dc7273c` | `e6523a5b50a0a99d3e1fbc9fbb42040df2d63921` |
| refs/codex/turn-diffs/checkpoints/a26640f61f07329808fbd334bba28c0f/0eb9d1295a6d78b5b41b29a00b8f64cd/1791231479282/570cadba-bc6c-4b87-883a-f014ac9f7e87 | `cf4e297bf670f04a84cda5b1f22d4d1a2dc7273c` | `e6523a5b50a0a99d3e1fbc9fbb42040df2d63921` |

## Safety copy and method

Independent local safety copy: `C:\Users\Marcu\Documents\WordFlow_pre_email_rewrite_2026-10-05.git`. Created before changing any source refs with git clone --mirror --no-hardlinks, verified with git fsck --full, and checked against every inventoried source ref. It contains the original private history; Marcus deletes it after go-live. It was not modified by the replay or garbage collection.

No tools were installed. A single topological commit-tree replay memoized each old commit once, preserving shared commits across both local branches and the merge parent order. Raw author/committer names, epoch dates, timezone strings and message bytes were retained exactly; both emails were replaced with the specified no-reply address. New raw commit objects were compared byte-for-byte with the expected authorized header/tree/parent substitutions.

Blob replacement was exact literal byte replacement of the old personal email with `<email redacted>`. No decoding/re-encoding, newline normalization or whitespace changes were used. Recursive mktree replay reused every unchanged blob/tree; changed trees contain only changed child IDs. All refs were updated in one compare-and-swap transaction, including remote-tracking refs and Codex tree refs, preserving symbolic origin/HEAD. The pending working-tree push log was preserved exactly and is included with the final governance commit under the repository rule.

## Verification

- Eight old/new commit pairs: exact message bytes, author/committer names, dates and timezone strings preserved; ordered parent IDs match the old-to-new mapping. Commit counts remain eight before the additional governance commit.
- Every commit tree: identical path sets and modes; every unaffected blob identical; all six changed report versions equal only the literal replacement. One unique changed blob, one replacement occurrence.
- .gitattributes is identical wherever present in every commit. CRLF pins remain intact. The fresh clone preserved their required checkout behavior.
- git log --all identity emails contain only the specified no-reply address. git grep -F over every rewritten commit returns zero matches.
- git cat-file --batch-all-objects metadata was intersected with all objects reachable from the rewritten refs; their full raw contents were read with --batch and checked in memory. Builder scan: 79 reachable objects, zero old-email hits. An independent reviewer reproduced the privacy, graph and byte-comparison results across eight commit pairs and 251 file versions.
- Fresh --no-local clone, core.hooksPath=.githooks: 32 regression tests and 32 exposure checks passed, zero skips. A sandbox permission failure during clone setup was retried with approved access to the existing tools/runtime; nothing installed.
- Independent verdict: PASS. All 11 security source, test and mutation runner/spec anchor blobs are identical; mutation anchors are unaffected, so no mutation rerun was needed.
- No filter-branch was used, so refs/original was not created. Checked that it is absent; expired all working-repository reflogs and ran git gc --prune=now. All eight old commit objects and the unredacted report blob are absent from the working database; the verified safety copy retains them. The working database was scanned after GC: zero old-email hits, fsck passed. Shared unchanged objects remain, as required by byte preservation.
- Repository-local user.email equals the specified no-reply address; global config is unchanged. Final-commit identity/content checks run again after the W3/report commit.

## Old-to-new commit mapping

**All earlier reports and vault notes citing the original WordFlow SHAs are pre-rewrite citations.** Their text was not otherwise changed. Use this table to follow those citations; MarcDeck source SHAs remain unchanged.

| Pre-rewrite SHA | Rewritten SHA |
|---|---|
| `8920acb55b9987cc4835ebc86cca0ec899fadebc` | `a5065ea47720e6b9b10a59f55eb1dd11d6800605` |
| `b8b18928bfc2393871af04b025fc3e83f3607d32` | `9ab47e9510794480d550d0b6debdf1c3f7912f6b` |
| `af5c1cf0d6ef34dcbcdbddfffdb9cfc1304a8833` | `a649443a06f033794a1f952eec6eac80d3d75efe` |
| `96a6be17575b1bd664a7b56aa72714867b03aad4` | `fc2de2a633802009577c42e218d23ef7bca98205` |
| `17d53676a00c083495f55156c68f19fe3e6bc732` | `fac7f89ba2219c27999c8e5f37826b53d58071c8` |
| `7d5475ce7556275857f6905507d9bfbb1b026a1e` | `fcc61cff2b7e4a470efb904ebf6734e9cdf6dbde` |
| `4f89290e66268c193b0aad838372c3d362e4b231` | `78c4574039de96db3508c15d84f1f0019ae960e6` |
| `f3b1b8e29be94600db1126e7772ef58a44a09450` | `7fe8581e231db434d3e2a9baa9002a5fb4152565` |

## Remote handoff under W3.3

No push attempted. Marcus must:

1. Open WordFlow on GitHub, Settings → Danger Zone → Delete this repository.
2. Create WordFlow again with the same name, PRIVATE, without README, .gitignore or licence.
3. In account email settings, enable Keep my email addresses private and Block command line pushes that expose my email.
4. Reply `done`.

Then Codex runs only bash tools/push.sh. If its gate refuses the empty remote, stop and report without a workaround. On success, verify remote master equals local master and repeat the identity/content/reachable-object privacy check in a fresh GitHub clone.

After go-live Marcus deletes the local safety mirror, empties the MarcDeck ZIP quarantine himself, and decides whether to rotate the key unless those ZIPs never left his PC. Today's dated daily note is missing and was not created.

## Push completion — 2026-10-05 22:51 +02:00

Marcus replied `done`, confirming the manual repository recreation and email-setting steps. The unmodified `bash tools/push.sh` gate accepted the remote, ran npm test without skips, pushed master as a new GitHub branch (no force push) and verified remote master equals local master at `b4de13cd5ce3b84334712c003a376c2d27fd9be6`.

A fresh network clone from GitHub, not the local repository, passed step 4a: all 9 commits have only the specified no-reply author/committer emails; git grep -F across all commits found zero old-email matches; the 85 reachable objects enumerated through cat-file --batch-all-objects metadata and read with --batch contained zero old-email matches; fsck passed. No .env content read.

The earlier no-push/manual-handoff sections record the pre-confirmation checkpoint and are superseded by this completion entry. A follow-up documentation commit closes the W3 open item and records this evidence; it changes no product source or rewritten historical commit. The original 8-commit mapping remains unchanged. This documentation commit is also pushed only through tools/push.sh and its fresh GitHub clone is checked before the final response.

Remaining human cleanup: delete the safety mirror after go-live, empty the ZIP quarantine yourself, and decide key rotation unless those ZIPs never left the PC.
