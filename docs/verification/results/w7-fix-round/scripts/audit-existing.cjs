"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const root=process.cwd(),read=file=>fs.readFileSync(path.join(root,file),"utf8"),at=file=>execFileSync("git",["show","e2b212d:"+file],{cwd:root,encoding:"utf8"});
let current=read("tests/reader-portal.cjs");const helperStart=current.indexOf("async function portalRegressionChecks("),oldStart=current.indexOf("async function portalChecks(");assert(helperStart>=0&&oldStart>helperStart);
current=current.slice(0,helperStart)+current.slice(oldStart);
current=current.replace('const { measure, baseline, prepare } = require("./reader-round2.cjs");','const { measure } = require("./reader-round2.cjs");')
 .replace('async function portalChecks({ browser, origin, width, verify, out, root, newChecksOrder = "before" }) {\n  assert(["before", "after"].includes(newChecksOrder), "unknown new-check order");','async function portalChecks({ browser, origin, width, verify, out, root }) {')
 .replace('    if (newChecksOrder === "before") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });\n','')
 .replace('    if (newChecksOrder === "after") await portalRegressionChecks({ browser, origin, width, verify, out, root, colorScheme });\n','');
assert.equal(current,at("tests/reader-portal.cjs"));
let post=read("tests/post-review.test.cjs");const start=post.indexOf(' await check("W4.6 whole approved privacy paragraph is exact",()=>{'),end=post.indexOf('\n });',start)+6;assert(start>=0&&end>start);post=post.slice(0,start)+post.slice(end);assert.equal(post,at("tests/post-review.test.cjs"));
const sha=s=>crypto.createHash("sha256").update(s).digest("hex");
const result={reference:"e2b212d7e249dfb515da419f1727bcec7754190f",existingPortalByteIdentical:true,existingPostReviewByteIdentical:true,portalReconstructedSha256:sha(current),postReviewReconstructedSha256:sha(post),productDiffSinceResumption:execFileSync("git",["diff","e2b212d","--","styles.css","app.js","index.html","assets/wordflow-mark.svg"],{cwd:root,encoding:"utf8"})};assert.equal(result.productDiffSinceResumption,"");fs.writeFileSync(path.join(__dirname,"../existing-code-audit.json"),JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify(result));
