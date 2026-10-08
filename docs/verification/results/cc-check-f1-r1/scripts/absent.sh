#!/usr/bin/env bash
# Run the four npm-test suites under Node's permission model so Chrome and Playwright are unreadable.
set -u
SP="$(cd "$(dirname "$0")/.." && pwd -W)"
CLONE="$SP/wf"
REALHOME="$(cygpath -m "$USERPROFILE")"
NODEDIR="$(dirname "$(cygpath -w "$(which node)")")"
mkdir -p "$SP/tmp"; export TEMP="$(cygpath -w "$SP/tmp")" TMP="$(cygpath -w "$SP/tmp")"; TMPW="$SP/tmp"
EMPTY="$SP/emptyhome"
mkdir -p "$EMPTY"
export USERPROFILE="$EMPTY" HOME="$EMPTY"
unset WORDFLOW_CHROME WORDFLOW_PLAYWRIGHT_DIR NODE_PATH
export NODE_OPTIONS="--permission --allow-child-process --allow-fs-read=$CLONE/* --allow-fs-read=$TMPW/* \"--allow-fs-read=$NODEDIR\*\" --allow-fs-read=$SP/* --allow-fs-write=$SP/*"
cd "$CLONE"
node -e 'try{require("node:fs").statSync("C:/Program Files/Google/Chrome/Application/chrome.exe");console.log("chrome: VISIBLE")}catch(e){console.log("chrome:",e.code)}'
node -e 'try{require(require("node:path").join(process.env.USERPROFILE,".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));console.log("pw: VISIBLE")}catch(e){console.log("pw-home-redirected:",e.code)}'
REALHOME="$REALHOME" node -e 'try{require(process.env.REALHOME+"/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");console.log("pw real path: VISIBLE")}catch(e){console.log("pw real path:",e.code)}'
node -e 'try{require("playwright");console.log("bare: VISIBLE")}catch(e){console.log("bare:",e.code)}'
node -e 'try{require("./tests/browser-helper.cjs").runtime();console.log("runtime: VISIBLE")}catch(e){console.log("runtime:",e.code||e.message)}'
rc=0
node tests/regression.cjs || rc=1
node tests/proxy.test.mjs || rc=1
node tests/server_exposure.test.js || rc=1
node tests/post-review.test.cjs || rc=1
echo "overall rc=$rc"
