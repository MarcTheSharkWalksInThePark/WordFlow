"use strict";
// Production writer: tools/parity.cjs, after both browser suites succeed.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const STAMP="tests/parity-stamp.json";
function hashes(root) {
 const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{
  const name=dir+"/"+e.name;
  if(e.isSymbolicLink())throw new Error("Parity inputs must be regular files");
  return e.isDirectory()?walk(name):[name];
 });
 const files=["file-extractors.mjs","app.js","index.html","styles.css",...walk("vendor"),...walk("tests/fixtures")].sort();
 return Object.fromEntries(files.map(file=>[file,crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex")]));
}
function verify(root) {
 const stamp=JSON.parse(fs.readFileSync(path.join(root,STAMP),"utf8"));
 if(stamp.schema!==1 || !stamp.chrome || !stamp.playwright || JSON.stringify(stamp.hashes)!==JSON.stringify(hashes(root)))
  throw new Error("Parity inputs differ from the successful browser run");
 return stamp;
}
function record(root,chrome,playwright,inputs=hashes(root)) {
 fs.writeFileSync(path.join(root,STAMP),JSON.stringify({schema:1,chrome,playwright,hashes:inputs},null,2)+"\n");
}
if(require.main===module) {
 try {verify(path.join(__dirname,".."));console.log("PASS: browser parity stamp matches");}
 catch {console.error("REFUSED: parity stamp missing or stale; run npm run parity and commit the generated stamp");process.exitCode=1;}
}
module.exports={STAMP,hashes,verify,record};
