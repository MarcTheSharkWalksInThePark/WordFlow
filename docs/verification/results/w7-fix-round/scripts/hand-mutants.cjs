"use strict";
// Exact transforms loaded from the independent review's recorded mutant evidence.
// Fresh local clone only; no mutation of the canonical working tree.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto"),assert=require("node:assert/strict"),{spawnSync,execFileSync}=require("node:child_process");
const root=process.cwd(),out=path.resolve(__dirname,"../hand-mutants");fs.mkdirSync(out,{recursive:true});
const home=os.homedir(),sha=b=>crypto.createHash("sha256").update(b).digest("hex"),source=path.join(root,"docs/verification/results/w7-cc-review/mutants");
const records={};for(const file of fs.readdirSync(source).filter(f=>f.endsWith(".json"))){const rows=JSON.parse(fs.readFileSync(path.join(source,file)));for(const [id,row] of Object.entries(rows)){if(records[id])assert.deepEqual(records[id].record.transform,row.transform);records[id]={file,record:row};}}
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"wordflow-w713-mutants-")),clone=path.join(scratch,"clone");
const redact=s=>s.split(clone).join("<clone>").split(scratch).join("<scratch>").split(home).join("<home>");
execFileSync("git",["clone","--no-local","--quiet",root,clone],{windowsHide:true});
const head=execFileSync("git",["rev-parse","HEAD"],{cwd:clone,encoding:"utf8"}).trim();
const result={head,clone:"<scratch>/clone",reviewSource:"docs/verification/results/w7-cc-review/mutants/",requested:["M2b","M9","M10","M12","M14"],rows:[],otherTwelve:"not rerun, per Marcus 2026-11-09 resumption authorization"};
const run=(args,label,id)=>{const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:clone,encoding:"utf8",windowsHide:true,timeout:5400000,maxBuffer:128*1024*1024});const output=redact((r.stdout||"")+(r.stderr||""));fs.writeFileSync(path.join(out,id+"-"+label+".txt"),output);return {label,status:r.status,signal:r.signal,error:r.error?String(r.error):null,ms:Date.now()-start,diagnostics:output.split(/\r?\n/).filter(l=>/FAIL|AssertionError|Error:/.test(l)).slice(0,12)};};
for(const id of result.requested){const {file:sourceFile,record}=records[id];assert(record,"missing review mutant "+id);const file=path.join(clone,record.file),original=fs.readFileSync(file),eol=original.includes(Buffer.from("\r\n"))?"\r\n":"\n";let text=original.toString("utf8");
for(const [a,b] of record.transform){const A=a.replace(/\n/g,eol),B=b.replace(/\n/g,eol);assert.equal(text.split(A).length-1,1,"nonunique review transform "+id);text=text.replace(A,B);}
const row={id,description:record.desc,file:record.file,sourceFile,transform:record.transform,beforeSha256:sha(original),reviewerBeforeSha256:record.before,node:[]};
try{fs.writeFileSync(file,text);row.mutatedSha256=sha(fs.readFileSync(file));for(const [suite,label] of [["tests/regression.cjs","static"],["tests/proxy.test.mjs","proxy"],["tests/server_exposure.test.js","exposure"],["tests/post-review.test.cjs","post-review"]]){const r=run([suite],label,id);row.node.push(r);assert(!r.error&&r.status!==null,"harness error "+id);if(r.status!==0){row.caughtBy="Node "+label;row.diagnostics=r.diagnostics;break;}}
if(!row.caughtBy){const browserOut=path.join(out,id);fs.mkdirSync(browserOut,{recursive:true});row.smoke=run(["tools/static_smoke.cjs","--out-dir",browserOut],"smoke",id);assert(!row.smoke.error&&row.smoke.status!==null,"Chrome harness error "+id);if(row.smoke.status!==0){row.caughtBy="Chrome smoke";row.diagnostics=row.smoke.diagnostics;}}
row.verdict=row.caughtBy?"KILLED":"SURVIVED";
}finally{fs.writeFileSync(file,original);row.restoredSha256=sha(fs.readFileSync(file));row.restoredOk=row.beforeSha256===row.restoredSha256;assert(row.restoredOk);result.rows.push(row);fs.writeFileSync(path.join(out,"verdicts.json"),JSON.stringify(result,null,2)+"\n");}
assert.equal(row.verdict,"KILLED",id+" survived");console.log(id+": "+row.verdict+"; "+row.caughtBy+"; restored="+row.restoredOk+"; "+row.diagnostics.join(" | "));
}
result.sourceStatus=execFileSync("git",["status","--porcelain=v1"],{cwd:clone,encoding:"utf8"});assert.equal(result.sourceStatus,"");fs.writeFileSync(path.join(out,"verdicts.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({total:result.rows.length,killed:result.rows.filter(r=>r.verdict==="KILLED").length,restored:result.rows.every(r=>r.restoredOk),cloneRetained:redact(clone)}));
