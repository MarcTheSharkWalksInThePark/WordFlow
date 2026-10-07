"use strict";
// Reproduce CC's eight exact hand transforms (not a new mutation registry/harness).
// Use the unchanged post-review Node guard and the real full Chrome smoke entry point.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),os=require("node:os");
const {spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"../../../.."),app=path.join(root,"app.js");
const definitions=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/cc-review-f1-w6/runs/predicate-mutants.json"))).rows;
const sha=b=>crypto.createHash("sha256").update(b).digest("hex"),original=fs.readFileSync(app),before=sha(original),rows=[];
const redact=s=>s.replaceAll(root,"<repo>").replaceAll(os.homedir(),"<home>");
function run(args,id,label) {
 const r=spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:600000});
 const output=redact((r.stdout||"")+(r.stderr||""));
 fs.writeFileSync(path.join(__dirname,id+"-"+label+".txt"),output);
 return {status:r.status,error:r.error?String(r.error):null,redChecks:output.split(/\r?\n/).filter(l=>/^FAIL |^Error: /.test(l))};
}
try {
 for(const def of definitions) {
  const id=def.id.split(" ")[0],source=original.toString("utf8");
  if(source.split(def.find).length!==2)throw new Error("CC anchor is not unique: "+id);
  fs.writeFileSync(app,source.replace(def.find,def.replace));
  const mutated=sha(fs.readFileSync(app));
  const node=run(["tests/post-review.test.cjs"],id,"node");
  const afterNode=sha(fs.readFileSync(app));
  const browser=run(["tools/static_smoke.cjs","--out-dir",path.join(__dirname,"hand-"+id)],id,"browser");
  const afterBrowser=sha(fs.readFileSync(app));
  fs.writeFileSync(app,original);const restored=sha(fs.readFileSync(app));
  const row={id,find:def.find,replace:def.replace,before,mutated,afterNode,afterBrowser,restored,node,browser,
   nodeVerdict:node.status!==0&&!node.error?"KILLED":"SURVIVED",browserVerdict:browser.status!==0&&!browser.error?"KILLED":"SURVIVED"};
  if(afterNode!==mutated||afterBrowser!==mutated||restored!==before||row.nodeVerdict!=="KILLED"||row.browserVerdict!=="KILLED")throw new Error("Hand mutant guard failed: "+id);
  rows.push(row);fs.writeFileSync(path.join(__dirname,"hand-mutants.json"),JSON.stringify({before,rows},null,2)+"\n");
  console.log(id+": Node KILLED; Chrome KILLED; restored hash matches");
 }
}finally{fs.writeFileSync(app,original);}
