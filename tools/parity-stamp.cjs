"use strict";
// Production writer: tools/parity.cjs, after both browser suites succeed.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {execFileSync}=require("node:child_process");
const STAMP="tests/parity-stamp.json";
const NAMED=["file-extractors.mjs","app.js","index.html","styles.css"];
const isInput=file=>NAMED.includes(file) || file.startsWith("vendor/") || file.startsWith("tests/fixtures/");
const sha=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
function git(root,args,input) {
 return execFileSync("git",args,{cwd:root,input,windowsHide:true,maxBuffer:64*1024*1024,stdio:["pipe","pipe","pipe"]});
}
function entries(output,tree=false) {
 return output.toString("utf8").split("\0").filter(Boolean).map(row=>{
  const tab=row.indexOf("\t"),[mode,middle,last]=row.slice(0,tab).split(" ");
  if(!tree && last!=="0")throw new Error("Unmerged parity input");
  return {mode,oid:tree?last:middle,file:row.slice(tab+1)};
 }).filter(e=>isInput(e.file)).sort((a,b)=>a.file<b.file?-1:a.file>b.file?1:0);
}
function regular(list) {
 if(NAMED.some(file=>!list.some(e=>e.file===file)))throw new Error("Missing named parity input");
 if(list.some(e=>!["100644","100755"].includes(e.mode)))throw new Error("Parity inputs must be regular files");
}
function refuseFlags(root) {
 for(const row of git(root,["ls-files","-v","-z"]).toString("utf8").split("\0").filter(Boolean)) {
  if(isInput(row.slice(2)) && (row[0]==="S" || /[a-z]/.test(row[0])))
   throw new Error("Stamped path has skip-worktree or assume-unchanged flag: "+row.slice(2));
 }
}
function hashes(root) {
 // Only tracked inputs; ignored scratch files cannot poison or change a stamp.
 const list=entries(git(root,["ls-files","--stage","-z"]));regular(list);refuseFlags(root);
 const attrs=git(root,["check-attr","-z","--stdin","text","eol"],list.map(e=>e.file).join("\0")+"\0").toString("utf8").split("\0");
 const text=new Set();
 for(let i=0;i<attrs.length-1;i+=3)if(attrs[i+2]!=="unset" && attrs[i+2]!=="unspecified")text.add(attrs[i]);
 return Object.fromEntries(list.map(({file})=>{
  const full=path.join(root,file);
  if(!fs.lstatSync(full).isFile())throw new Error("Parity inputs must be regular files");
  const bytes=fs.readFileSync(full);
  // Match Git's normalized text blobs while preserving binary vendoring and fixtures.
  return [file,sha(text.has(file)?Buffer.from(bytes.toString("utf8").replace(/\r\n/g,"\n")):bytes)];
 }));
}
function committedHashes(root,commit) {
 const list=entries(git(root,["ls-tree","-r","-z","--full-tree",commit]),true);regular(list);
 const blobs=git(root,["cat-file","--batch"],list.map(e=>e.oid).join("\n")+"\n");
 let offset=0;
 return Object.fromEntries(list.map(({file,oid})=>{
  const end=blobs.indexOf(10,offset),[actual,type,size]=blobs.subarray(offset,end).toString().split(" ");
  if(actual!==oid || type!=="blob" || !/^\d+$/.test(size))throw new Error("Invalid committed parity blob");
  offset=end+1;const bytes=blobs.subarray(offset,offset+Number(size));offset+=Number(size)+1;
  return [file,sha(bytes)];
 }));
}
function verify(root,commit="HEAD") {
 refuseFlags(root);
 const stamp=JSON.parse(git(root,["cat-file","blob",commit+":"+STAMP]).toString("utf8"));
 const inputs=committedHashes(root,commit);
 if(stamp.schema!==1 || typeof stamp.chrome!=="string" || !stamp.chrome ||
    typeof stamp.playwright!=="string" || !stamp.playwright || JSON.stringify(stamp.hashes)!==JSON.stringify(inputs))
  throw new Error("Parity inputs differ from the successful browser run");
 return stamp;
}
function record(root,chrome,playwright,inputs=hashes(root)) {
 fs.writeFileSync(path.join(root,STAMP),JSON.stringify({schema:1,chrome,playwright,hashes:inputs},null,2)+"\n");
}
if(require.main===module) {
 try {verify(path.join(__dirname,".."),process.env.WORDFLOW_PUSH_SHA || "HEAD");console.log("PASS: browser parity stamp matches committed inputs");}
 catch(error) {console.error("REFUSED: "+error.message+"; run npm run parity and commit the generated stamp");process.exitCode=1;}
}
module.exports={STAMP,hashes,committedHashes,refuseFlags,verify,record};
