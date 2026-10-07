"use strict";
// CC's original eight transforms, using the existing Node guard and full Chrome entry point.
// Require an isolated temp clone; never mutate the checkout serving parity.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto");
const {spawnSync}=require("node:child_process");
const source=path.resolve(__dirname,"../../../.."),root=fs.realpathSync(process.argv[2]);
if(!root.startsWith(fs.realpathSync(os.tmpdir())+path.sep))throw Error("Require isolated temp clone");
const definitions=JSON.parse(fs.readFileSync(path.join(source,"docs/verification/results/cc-review-f1-w6/runs/predicate-mutants.json"))).rows;
const app=path.join(root,"app.js"),original=fs.readFileSync(app),sha=b=>crypto.createHash("sha256").update(b).digest("hex"),before=sha(original),rows=[];
if(before!==sha(fs.readFileSync(path.join(source,"app.js"))))throw Error("Clone does not contain candidate bytes");
const redact=s=>s.replaceAll(root,"<clone>").replaceAll(source,"<repo>").replaceAll(os.homedir(),"<home>");
function run(args,id,label){
 const r=spawnSync(process.execPath,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:600000});
 const output=redact((r.stdout||"")+(r.stderr||""));fs.writeFileSync(path.join(__dirname,id+"-"+label+".txt"),output);
 return {status:r.status,error:r.error?String(r.error):null,redChecks:output.split(/\r?\n/).filter(l=>/^FAIL |^Error: /.test(l))};
}
try {
 for(const def of definitions){
  const id=def.id.split(" ")[0],text=original.toString("utf8");if(text.split(def.find).length!==2)throw Error("Anchor: "+id);
  fs.writeFileSync(app,text.replace(def.find,def.replace));const mutated=sha(fs.readFileSync(app));
  const node=run(["tests/post-review.test.cjs"],id,"node"),afterNode=sha(fs.readFileSync(app));
  const browser=run(["tools/static_smoke.cjs","--out-dir",path.join(__dirname,"hand-"+id)],id,"browser"),afterBrowser=sha(fs.readFileSync(app));
  fs.writeFileSync(app,original);const restored=sha(fs.readFileSync(app));
  const row={id,find:def.find,replace:def.replace,before,mutated,afterNode,afterBrowser,restored,node,browser,
   nodeVerdict:node.status!==0&&!node.error?"KILLED":"SURVIVED",browserVerdict:browser.status!==0&&!browser.error?"KILLED":"SURVIVED"};
  if(afterNode!==mutated||afterBrowser!==mutated||restored!==before||row.nodeVerdict!=="KILLED"||row.browserVerdict!=="KILLED"
   ||!node.redChecks.some(s=>s.startsWith("FAIL reader:"))||!browser.redChecks.some(s=>s.includes("W6 browser predicate")))throw Error("Guard failed: "+id);
  rows.push(row);fs.writeFileSync(path.join(__dirname,"hand-mutants.json"),JSON.stringify({before,rows},null,2)+"\n");
  console.log(id+": Node KILLED; Chrome KILLED; restored hash matches");
 }
}finally{fs.writeFileSync(app,original);if(sha(fs.readFileSync(path.join(source,"app.js")))!==before)throw Error("Real app changed during run");}
