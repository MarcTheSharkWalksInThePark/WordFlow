"use strict";
// Mandatory npm run parity, preserving the preceding reports' evidence verbatim.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),{spawnSync}=require("node:child_process");
const root=path.resolve(__dirname,"../../../.."),out=path.join(root,"docs/verification/results/post-review");
const files=["browser-parity.json","static-smoke.json","static-reader-1400.png","static-reader-390.png","static-quota-1400.png","static-quota-390.png","reader-1400.json","reader-390.json","f1-scroll-1400.png","f1-scroll-390.png","reader-round2.json","round2-phone-scroll.png","round2-normal-390.png","round2-normal-1920.png"];
const originals=new Map(files.map(f=>[f,fs.existsSync(path.join(out,f))?fs.readFileSync(path.join(out,f)):null]));
const evidence=path.join(__dirname,"baseline-parity");fs.mkdirSync(evidence,{recursive:true});
try {
 const run=spawnSync(process.env.ComSpec||"cmd.exe",["/d","/s","/c","npm run parity"],{cwd:root,encoding:"utf8",windowsHide:true});
 const output=((run.stdout||"")+(run.stderr||"")).replaceAll(root,"<repo>").replaceAll(os.homedir(),"<home>");
 fs.writeFileSync(path.join(evidence,"run.txt"),output);console.log(output);
 if(run.status!==0)throw new Error("npm run parity failed; no successful stamp");
 for(const f of files)if(fs.existsSync(path.join(out,f)))fs.copyFileSync(path.join(out,f),path.join(evidence,f));
}finally{
 for(const [f,b] of originals) {if(b!==null)fs.writeFileSync(path.join(out,f),b);else if(fs.existsSync(path.join(out,f)))fs.unlinkSync(path.join(out,f));}
}
