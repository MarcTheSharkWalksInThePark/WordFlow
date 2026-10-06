"use strict";
const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process");
const {STAMP,hashes,record}=require("./parity-stamp.cjs");
function runParity(root=path.join(__dirname,".."),deps={}) {
 const out=path.join(root,"docs/verification/results/post-review");
 // Resolve versions before starting, but never stamp an incomplete or failed run.
 const runtime=deps.runtime || require("../tests/browser-helper.cjs").runtime;
 const inputHashes=deps.hashes || hashes,runSuite=deps.spawnSync || spawnSync;
 const {playwrightVersion}=runtime();
 const before=inputHashes(root);fs.mkdirSync(out,{recursive:true});
 for(const args of [["tests/browser-parity.cjs","--out",path.join(out,"browser-parity.json")],
                    ["tools/static_smoke.cjs","--out-dir",out]]) {
  const run=runSuite(process.execPath,args,{cwd:root,stdio:"inherit",windowsHide:true});
  if(run.error || run.status!==0)throw new Error("Browser suite failed; parity stamp was not written");
 }
 if(JSON.stringify(before)!==JSON.stringify(inputHashes(root)))throw new Error("Parity inputs changed during the run");
 const parity=JSON.parse(fs.readFileSync(path.join(out,"browser-parity.json"),"utf8"));
 const smoke=JSON.parse(fs.readFileSync(path.join(out,"static-smoke.json"),"utf8"));
 if(parity.chrome!==smoke.chrome)throw new Error("Chrome version changed between suites");
 record(root,parity.chrome,playwrightVersion,before);
 return STAMP;
}
if(require.main===module) {
 try {console.log("PASS: generated "+runParity());}
 catch(error) {console.error(error.message);process.exitCode=1;}
}
module.exports={runParity};
