#!/usr/bin/env bash
# WordFlow push gate: the ONLY sanctioned way to push this repository.
#
# Fail-closed. It refuses unless ALL of these hold, checked in this order:
#   1. the versioned pre-push hook is active (git config core.hooksPath = .githooks);
#   2. the current branch is master;
#   3. the working tree is clean (tracked and untracked; ignored files do not count);
#   4. git ls-files tracks no .env* file, at any depth;
#   5. master is not behind origin/master (a failed fetch is a refusal, not a pass);
#   6. the Node test suites (npm test) exit 0 AND report no skipped test;
#   7. the generated browser parity stamp matches current inputs.
# Then it writes a single-use marker holding HEAD's sha, pushes master, checks that the remote
# master equals HEAD, and appends timestamped lines to tools/push.log.
#
# tools/push.log is tracked, so a successful push leaves it modified. Commit it with the next
# change (the same pattern as MarcDeck's session_close.log).
# Never bypass this with `git push --no-verify`.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
MARKER=$(git rev-parse --git-path WORDFLOW_PUSH_OK)
LOG="tools/push.log"
now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
fail() {
  rm -f "$MARKER"
  echo "REFUSED: $*" >&2
  exit 1
}
rm -f "$MARKER"

# 1. The hook that enforces this gate must be the one git runs.
[ "$(git config --get core.hooksPath || true)" = ".githooks" ] \
  || fail "core.hooksPath is not .githooks. Run: git config core.hooksPath .githooks"
[ -f .githooks/pre-push ] || fail ".githooks/pre-push is missing"
echo "PASS: pre-push hook active (.githooks)"

# 2. Branch.
BRANCH=$(git symbolic-ref --quiet --short HEAD || true)
[ "$BRANCH" = "master" ] || fail "current branch is '${BRANCH:-detached HEAD}', not master"
echo "PASS: on branch master"

# 3. Clean tree.
DIRTY=$(git status --porcelain)
[ -z "$DIRTY" ] || fail "working tree is not clean:
$DIRTY"
echo "PASS: working tree is clean"

# 4. No tracked .env* file (names only are printed).
ENV_TRACKED=$(git ls-files -- '.env*' ':(glob)**/.env*')
[ -z "$ENV_TRACKED" ] || fail "git tracks .env file(s): $ENV_TRACKED"
echo "PASS: no tracked .env* file"

# 5. Not behind origin. An unreachable remote refuses.
git remote get-url origin >/dev/null 2>&1 || fail "no remote named origin"
git fetch --quiet origin || fail "git fetch origin failed"
if git rev-parse --verify --quiet refs/remotes/origin/master >/dev/null; then
  BEHIND=$(git rev-list --count master..origin/master)
  [ "$BEHIND" -eq 0 ] || fail "master is $BEHIND commit(s) behind origin/master; integrate them first"
  echo "PASS: master is not behind origin/master"
else
  echo "PASS: origin has no master yet (first push)"
fi

# 6. Full test suite: exit 0 and no skipped test.
TEST_OUT=$(mktemp)
if ! npm test >"$TEST_OUT" 2>&1; then
  tail -n 30 "$TEST_OUT" >&2
  rm -f "$TEST_OUT"
  fail "npm test failed"
fi
if grep -qiE '"skipped"[[:space:]]*:[[:space:]]*[1-9]|(^|[[:space:]])skipped([[:space:]:]|$)|[1-9][0-9]*[[:space:]]+(skips|skipped)' "$TEST_OUT"; then
  grep -iE '"skipped"[[:space:]]*:[[:space:]]*[1-9]|(^|[[:space:]])skipped([[:space:]:]|$)|[1-9][0-9]*[[:space:]]+(skips|skipped)' "$TEST_OUT" >&2
  rm -f "$TEST_OUT"
  fail "npm test skipped tests; all Node suites must run without skips"
fi
rm -f "$TEST_OUT"
echo "PASS: npm test (no skips)"

# BEGIN PARITY STAMP CHECK
node tools/parity-stamp.cjs || fail "browser parity stamp is stale; run npm run parity"
# END PARITY STAMP CHECK

# Push, through the hook's marker.
HEAD_SHA=$(git rev-parse HEAD)
echo "$(now) gates=PASS pushing=$HEAD_SHA" >> "$LOG"
echo "$HEAD_SHA" > "$MARKER"
if ! git push origin master; then
  rm -f "$MARKER"
  echo "$(now) push-failed=$HEAD_SHA" >> "$LOG"
  echo "FAIL: git push failed" >&2
  exit 1
fi
rm -f "$MARKER"

REMOTE_SHA=$(git ls-remote origin refs/heads/master | cut -f1)
if [ "$REMOTE_SHA" != "$HEAD_SHA" ]; then
  echo "$(now) verify-failed local=$HEAD_SHA remote=${REMOTE_SHA:-none}" >> "$LOG"
  echo "FAIL post-push: origin master ($REMOTE_SHA) != local HEAD ($HEAD_SHA)" >&2
  exit 1
fi
echo "$(now) pushed=$HEAD_SHA OK" >> "$LOG"
echo "PASS post-push: origin master = $HEAD_SHA"
