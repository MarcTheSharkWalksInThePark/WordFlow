"use strict";
// Run the mandatory parity command and keep prior reports' evidence intact.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),{spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"../../../.."),out=path.join(root,"docs/verification/results/post-review");
const files=["browser-parity.json","static-smoke.json","static-reader-1400.png","static-reader-390.png","static-quota-1400.png","static-quota-390.png","reader-1400.json","reader-390.json","f1-scroll-1400.png","f1-scroll-390.png"];
const originals=new Map(files.map(file=>[file,fs.existsSync(path.join(out,file))?fs.readFileSync(path.join(out,file)):null]));
const evidence=path.join(__dirname,"parity");fs.mkdirSync(evidence,{recursive:true});
try {
 const run=process.platform==="win32"
  ?spawnSync(process.env.ComSpec||"cmd.exe",["/d","/s","/c","npm run parity"],{cwd:root,encoding:"utf8",windowsHide:true})
  :spawnSync("npm",["run","parity"],{cwd:root,encoding:"utf8"});
 const output=((run.stdout||"")+(run.stderr||"")).replaceAll(root,"<repo>").replaceAll(os.homedir(),"<home>");
 fs.writeFileSync(path.join(evidence,"run.txt"),output);console.log(output);
 if(run.status!==0)throw new Error("npm run parity failed; no successful stamp");
 for(const file of files)fs.copyFileSync(path.join(out,file),path.join(evidence,file));
}finally{
 for(const [file,bytes] of originals) {
  if(bytes!==null)fs.writeFileSync(path.join(out,file),bytes);
  else if(fs.existsSync(path.join(out,file)))fs.unlinkSync(path.join(out,file));
 }
}
