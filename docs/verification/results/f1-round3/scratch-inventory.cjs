"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const root=process.cwd(),base=path.join(os.homedir(),"AppData/Local/Temp/claude"),session=path.join(base,"C--Users-Marcu-Documents-WordFlow/b5e64aff-57bf-4527-a98a-7b6d342bad63"),scratch=path.join(session,"scratchpad");
const report=fs.readFileSync("docs/verification/2026-10-07_cc_review_f1_w6.md","utf8");
const blobs=new Map();
for(const record of execFileSync("git",["ls-tree","-rz","HEAD"],{maxBuffer:2000000}).toString().split("\0").filter(Boolean)) {
 const [meta,file]=record.split("\t"),id=meta.split(" ")[2];
 if(path.basename(file).toLowerCase().startsWith(".env"))throw Error("Tracked environment file; refuse inventory comparison");
 if(!blobs.has(id))blobs.set(id,[]);blobs.get(id).push(file);
}
const files=[],directories=[];
function walk(dir) {
 for(const e of fs.readdirSync(dir,{withFileTypes:true})) {
  const file=path.join(dir,e.name),relative=path.relative(scratch,file).replaceAll("\\","/");
  if(e.isSymbolicLink()){files.push({path:relative,size:fs.lstatSync(file).size,sha256:null,value:"unclear",reason:"symbolic link; not followed"});continue;}
  if(e.isDirectory()){directories.push(relative);walk(file);continue;}
  const size=fs.statSync(file).size;
  if(e.name.toLowerCase().startsWith(".env")){files.push({path:relative,size,sha256:null,value:"unclear",reason:"environment file: not opened or hashed"});continue;}
  const bytes=fs.readFileSync(file),sha256=crypto.createHash("sha256").update(bytes).digest("hex"),blob=crypto.createHash("sha1").update(Buffer.from("blob "+bytes.length+"\0")).update(bytes).digest("hex");
  const matches=blobs.get(blob)||[],cited=report.includes(e.name)||report.includes(relative);
  const evidence=relative.startsWith("ev/")&&cited;
  files.push({path:relative,size,sha256,committedMatches:matches,cited,
   value:matches.length?"no value":evidence?"retain evidence":cited?"unclear":"no value",
   reason:matches.length?"identical committed blob":evidence?"CC-cited raw evidence differs from committed bytes":cited?"CC-cited output/script is not byte-identical to a committed file":"uncited temporary probe/test output or scaffolding"});
 }
}
const resolved=fs.realpathSync(scratch),safe=resolved.toLowerCase().startsWith(fs.realpathSync(base).toLowerCase()+path.sep)&&!resolved.toLowerCase().startsWith(fs.realpathSync(root).toLowerCase()+path.sep);
if(!safe)throw Error("Scratch path safety check failed");walk(scratch);
const retain=files.filter(f=>f.value!=="no value");
fs.writeFileSync(path.join(__dirname,"scratch-inventory.json"),JSON.stringify({scratch:"<home>/AppData/Local/Temp/claude/<project>/b5e64aff-57bf-4527-a98a-7b6d342bad63/scratchpad",safe,files,directories,outcome:retain.length?"DELETE NOTHING: cited or unclear unmatched files":"eligible for deletion",retain},null,2)+"\n");
console.log(JSON.stringify({files:files.length,retain:retain.length,outcome:retain.length?"DELETE NOTHING":"eligible for deletion",unmatched:retain.map(f=>({path:f.path,reason:f.reason}))},null,2));
