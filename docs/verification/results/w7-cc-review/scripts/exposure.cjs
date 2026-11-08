"use strict";
// Run each SHA's own frontEndReferences()/frontEndFiles() bodies against that SHA's index.html.
const {execFileSync}=require("node:child_process"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),vm=require("node:vm");
const clone=process.argv[2],out={};
const show=(sha,f)=>execFileSync("git",["show",sha+":"+f],{cwd:clone});
for(const sha of ["2a37644","51e22d0"]){
 const src=show(sha,"tests/server_exposure.test.js").toString();
 const a=src.indexOf("function frontEndReferences()"),b=src.indexOf("function makeFixtureRoot");
 const body=src.slice(a,b);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"expo-"));fs.writeFileSync(path.join(dir,"index.html"),show(sha,"index.html"));
 const ctx={fs,path,REPO:dir,result:null};vm.createContext(ctx);
 vm.runInContext(body+"\nresult={refs:frontEndReferences(),files:frontEndFiles()};",ctx);
 const exp=src.split(/\r?\n/).find(l=>l.includes("refs.length >= 4")||l.includes("new Set([\"app.js\""));
 out[sha]={helperBodySha:require("node:crypto").createHash("sha256").update(body).digest("hex"),refs:ctx.result.refs,files:ctx.result.files.slice().sort(),assertion:exp.trim()};
}
out.helpersIdentical=out["2a37644"].helperBodySha===out["51e22d0"].helperBodySha;
out.filesIdentical=JSON.stringify(out["2a37644"].files)===JSON.stringify(out["51e22d0"].files);
console.log(JSON.stringify(out,null,1));
