"use strict";
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const {STAMP,hashes,record}=require("./parity-stamp.cjs");
const root=path.join(__dirname,".."),out=path.join(root,"docs/verification/results/post-review");
// Resolve versions before starting, but never stamp an incomplete or failed run.
const {runtime}=require("../tests/browser-helper.cjs");
try {
 const {playwrightVersion}=runtime();
 const before=hashes(root);fs.mkdirSync(out,{recursive:true});
 for(const args of [["tests/browser-parity.cjs","--out",path.join(out,"browser-parity.json")],
                    ["tools/static_smoke.cjs","--out-dir",out]]) {
  const run=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit",windowsHide:true});
  if(run.error || run.status!==0)throw new Error("Browser suite failed; parity stamp was not written");
 }
 if(JSON.stringify(before)!==JSON.stringify(hashes(root)))throw new Error("Parity inputs changed during the run");
 const parity=JSON.parse(fs.readFileSync(path.join(out,"browser-parity.json"),"utf8"));
 const smoke=JSON.parse(fs.readFileSync(path.join(out,"static-smoke.json"),"utf8"));
 if(parity.chrome!==smoke.chrome)throw new Error("Chrome version changed between suites");
 record(root,parity.chrome,playwrightVersion,before);
 console.log("PASS: generated "+STAMP);
} catch(error) {console.error(error.message);process.exitCode=1;}
