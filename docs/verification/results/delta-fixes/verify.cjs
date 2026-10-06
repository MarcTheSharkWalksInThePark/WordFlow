"use strict";
// Builder verification: no install, push or external request.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),assert=require("node:assert/strict");
const {spawnSync,execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"../../../.."),out=__dirname;
const sanitize=s=>String(s).replaceAll(root,"<repo>").replaceAll(root.replaceAll("\\","/"),"<repo>")
 .replaceAll(os.tmpdir(),"<temp>").replaceAll(os.tmpdir().replaceAll("\\","/"),"<temp>")
 .replace(/C:[\\/]Users[\\/][^\\/\s"']+/gi,"<home>");
function run(command,args,cwd=root,env=process.env) {
 const r=spawnSync(command,args,{cwd,env,encoding:"utf8",windowsHide:true,maxBuffer:16*1024*1024});
 if(r.error)throw r.error;
 const result={exit:r.status,stdout:sanitize(r.stdout),stderr:sanitize(r.stderr)};
 assert.equal(r.status,0,result.stdout+result.stderr);return result;
}
const npmCli=["node_modules/npm/bin/npm-cli.js","../node_modules/npm/bin/npm-cli.js"]
 .map(p=>path.resolve(path.dirname(process.execPath),p)).find(p=>fs.existsSync(p));assert(npmCli);
const args=[npmCli,"test","--","--out",path.join(out,"post-review-tests.json")];
const result={node:process.version,normal:run(process.execPath,args),absent:run(process.execPath,args,root,{...process.env,
 NODE_OPTIONS:'--require "'+path.join(root,"tests/no-browser-preload.cjs").replaceAll("\\","/")+'"',
 WORDFLOW_PLAYWRIGHT_DIR:path.join(root,"deliberately-absent-playwright"),WORDFLOW_CHROME:path.join(root,"deliberately-absent-chrome")})};
assert.equal(result.normal.stdout,result.absent.stdout);
require(path.join(root,"tools/test-output.cjs")).assertNoSkips(result.normal.stdout);
result.noBrowserProbe="Every Node child denies Playwright/browser-helper module imports and Chrome executable probes";
result.counts={static:223,proxy:162,r59:32,postReview:74,total:491,skipped:0};
for(const [suite,count] of [["static-regression",223],["proxy",162],["post-review",74]])assert(result.normal.stdout.includes('"suite":"'+suite+'","passed":'+count));
assert(result.normal.stdout.includes("32 checks passed"));
fs.writeFileSync(path.join(out,"node-tests.json"),JSON.stringify(result,null,2)+"\n");
run(process.execPath,["tests/proxy.test.mjs","--out",path.join(out,"proxy.json")]);
const previous=JSON.parse(execFileSync("git",["show","3cdcc43:tools/r59.spec.json"],{cwd:root,encoding:"utf8"}));
const current=JSON.parse(fs.readFileSync(path.join(root,"tools/r59.spec.json")));
assert.deepEqual(current.mutations.slice(0,58),previous.mutations);
const earlier=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/post-review/mutations.json")));
const mutations=JSON.parse(fs.readFileSync(path.join(out,"mutations.json")));
assert.deepEqual(mutations.rows.slice(0,58).map(r=>[r.id,r.verdict]),earlier.rows.map(r=>[r.id,r.verdict]));
assert(mutations.rows.slice(58).every(r=>r.verdict==="KILLED" && r.failingChecks.length && r.restoredSha256===r.beforeSha256));
const diff=execFileSync("git",["diff","3cdcc43","--"],{cwd:root,encoding:"utf8",maxBuffer:16*1024*1024});
const added=diff.split(/\r?\n/).filter(l=>l.startsWith("+")&&!l.startsWith("+++"));
assert(!added.some(l=>/C:[\\/]Users[\\/]|\/Users\//i.test(l)),"new content contains profile paths");
const changed=execFileSync("git",["diff","--name-only","3cdcc43"],{cwd:root,encoding:"utf8"}).trim().split(/\r?\n/);
assert(!changed.some(f=>f.includes("cc-delta-review") || f.includes("_cc_")),"CC evidence changed");
const final={earlierDefinitionsUnchanged:58,earlierVerdictsUnchanged:58,newRows:mutations.rows.length-58,
 allNewRowsAssertionKilled:true,allRestoredHashesMatch:true,ccReportsAndEvidenceUntouched:true,addedProfilePaths:0};
fs.writeFileSync(path.join(out,"final-checks.json"),JSON.stringify(final,null,2)+"\n");
console.log(JSON.stringify({tests:491,skips:0,noBrowser:true,...final}));
