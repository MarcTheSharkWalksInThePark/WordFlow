"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm");
const {spawnSync,execFileSync}=require("node:child_process"),assert=require("node:assert/strict");
const repo=path.join(__dirname,".."),root=process.env.WORDFLOW_TEST_REPO || repo;
const stampModule=require(path.join(root,"tools/parity-stamp.cjs"));
let passed=0;const cases=[];
async function check(name,fn) {try{await fn();passed++;cases.push({name,passed:true});}catch(e){console.error("FAIL "+name);throw e;}}
(async()=>{
 const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
 const {functionText}=require("./helpers.cjs");
 const breakWord=vm.runInNewContext(functionText(app,"shouldBreakWord")+"\nshouldBreakWord");
 const scrollWord=vm.runInNewContext(functionText(app,"shouldScrollWord")+"\nshouldScrollWord");
 await check("reader: no break above the floor",()=>assert.equal(breakWord(11,1000,342),false));
 await check("reader: floor word fitting frame does not break",()=>assert.equal(breakWord(10,342,342),false));
 await check("reader: floor word wider than frame breaks",()=>assert.equal(breakWord(10,343,342),true));
 await check("reader: unwrapped token never enables vertical state",()=>assert.equal(scrollWord(false,1000,278),false));
 await check("reader: wrapped token at frame height does not scroll",()=>assert.equal(scrollWord(true,278,278),false));
 await check("reader: strict excess height enables vertical state",()=>assert.equal(scrollWord(true,278.01,278),true));
 await check("reader: measured real 45-character word has neither state",()=>{
  for(const [font,width,height,frameWidth,frameHeight] of [[23,522.71875,24.828125,604,625],[13,295.46875,14.03125,342,278]]) {
   const wrapped=breakWord(font,width,frameWidth);assert.equal(wrapped,false);assert.equal(scrollWord(wrapped,height,frameHeight),false);
  }
 });
 const source=/async function fetchViaLocalReader\(url\) \{[\s\S]*?^\}/m.exec(app)[0];
 const rows=[
  ["HTML Error 1027 at 429",429,"text/html","<h1>Error 1027</h1>","quota"],
  ["split HTML Error 1027 at 200",200,"text/html","<h1>Error <span>1027</span></h1>","quota"],
  ["plain-text error code regardless of type",503,"text/plain","error code: 1027","quota"],
  ["plain-text error code with JSON type",503,"application/json","error code: 1027","quota"],
  ["HTML nonbreaking space",503,"text/html","Error&nbsp;1027","quota"],
  ["plain-text error code without colon",503,"text/plain","error code 1027","quota"],
  ["colon after Error",503,"text/plain","Error: 1027","quota"],
  ["underscore error code",503,"text/plain","error_code: 1027","quota"],
  ["numeric HTML entity",503,"text/html","ERROR&#160;1027","quota"],
  ["hex HTML entity",503,"text/html","Error&#xa0;1027","quota"],
  ["JSON-shaped Cloudflare error (unconfirmed)",503,"application/json",'{"errors":[{"code":1027}]}',"error"],
  ["bare number (unconfirmed)",503,"text/plain","1027","error"],
  ["IPv6 group in 1102 page",503,"text/html","<h1>Error 1102</h1><p>2001:db8:1027::1</p>","error"],
  ["Ray ID containing 1027",503,"text/html","<h1>Error 1102</h1><p>Ray: ab1027cd</p>","error"],
  ["standalone Ray ID 1027",503,"text/html","<h1>Error 1102</h1><p>Ray: 1027</p>","error"],
  ["CSS width",500,"text/html","<h1>Error 1101</h1><style>p{width:1027px}</style>","error"],
  ["link fragment",503,"text/html",'<h1>Error 500</h1><a href="#1027">More</a>',"error"],
  ["JSON article containing quota words",200,"application/json",JSON.stringify({url:"https://public.example",contentType:"text/plain",body:"Error 1027 and WORDFLOW_FREE_LIMIT"}),"source"],
  ["static marker at 200 octet-stream",200,"application/octet-stream",fs.readFileSync(path.join(repo,"api/read"),"utf8"),"quota"],
  ["Function absent plus marker (indistinguishable)",200,"application/json",fs.readFileSync(path.join(repo,"api/read"),"utf8"),"quota"],
  ["Function JSON refusal",403,"application/json",'{"error":"URL not allowed"}',"error"],
  ["Function missing without marker",404,"text/html",fs.readFileSync(path.join(repo,"404.html"),"utf8"),"error"]
 ];
 for(const [name,status,type,body,expected] of rows) await check("quota: "+name,async()=>{
  const sandbox={URL,location:{href:"https://wordflow.example/"},fetch:async()=>new Response(body,{status,headers:{"content-type":type}}),cleanText:x=>x};
  const read=vm.runInNewContext(source+"\nfetchViaLocalReader",sandbox);
  let outcome;try{const value=await read("https://public.example/");outcome="source";assert.equal(value.text,"Error 1027 and WORDFLOW_FREE_LIMIT");}
  catch(e){outcome=e.code==="FREE_LIMIT"?"quota":"error";if(outcome==="quota")assert.equal(e.message,"URL loading has reached today's free limit. It resets at 00:00 UTC. Paste the text instead.");}
  assert.equal(outcome,expected);
 });
 await check("Node gate has no browser suite",()=>{
  const scripts=JSON.parse(fs.readFileSync(path.join(repo,"package.json"),"utf8")).scripts;
  assert(!/browser|smoke|parity|playwright|chrome/i.test(scripts.test));
  assert.equal(scripts.parity,"node tools/parity.cjs");
 });
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"wordflow-stamp-test-"));
 try {
  const git=(args,input)=>execFileSync("git",args,{cwd:scratch,input,encoding:"utf8",windowsHide:true,stdio:["pipe","pipe","pipe"]}).trim();
  const commit=()=>{git(["add","-A"]);git(["-c","user.name=Test","-c","user.email=test@users.noreply.github.com","commit","--quiet","-m","synthetic test"]);return git(["rev-parse","HEAD"]);};
  git(["init","--quiet"]);
  for(const dir of ["vendor","tests/fixtures","tools"])fs.mkdirSync(path.join(scratch,dir),{recursive:true});
  for(const file of ["file-extractors.mjs","app.js","index.html","styles.css","vendor/test.txt","tests/fixtures/test.docx"])fs.writeFileSync(path.join(scratch,file),"synthetic\n");
  fs.writeFileSync(path.join(scratch,".gitattributes"),"* text eol=lf\napp.js text eol=crlf\n*.docx -text\n");
  fs.copyFileSync(path.join(root,"tools/parity-stamp.cjs"),path.join(scratch,"tools/parity-stamp.cjs"));
  fs.copyFileSync(path.join(root,"tools/test-output.cjs"),path.join(scratch,"tools/test-output.cjs"));
  git(["add","-A"]);
  stampModule.record(scratch,"test-Chrome","test-Playwright");
  const baseline=commit();
  const push=fs.readFileSync(path.join(root,"tools/push.sh"),"utf8");
  const block=push.split("# BEGIN PARITY STAMP CHECK")[1]?.split("# END PARITY STAMP CHECK")[0];assert(block);
  const bash=process.env.WORDFLOW_BASH || (process.platform==="win32" ? path.resolve(git(["--exec-path"]),"../../..","bin/bash.exe") : "bash");
  const run=()=>spawnSync(bash,["-c",'HEAD_SHA=$(git rev-parse HEAD); fail() { echo "REFUSED: $*" >&2; exit 1; };'+block],{cwd:scratch,encoding:"utf8",windowsHide:true});
  const reset=()=>git(["reset","--hard",baseline]);
  await check("push stamp block accepts matching hashes",()=>assert.equal(run().status,0));
  await check("push stamp block refuses changed fixture",()=>{
   fs.appendFileSync(path.join(scratch,"tests/fixtures/test.docx"),"changed");
   commit();
   const result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/npm run parity/);
  });
  reset();
  await check("stamp detects additions and deletions",()=>{
   fs.writeFileSync(path.join(scratch,"vendor/extra.txt"),"new");commit();assert.throws(()=>stampModule.verify(scratch));
   reset();assert.doesNotThrow(()=>stampModule.verify(scratch));
   fs.unlinkSync(path.join(scratch,"vendor/test.txt"));commit();assert.throws(()=>stampModule.verify(scratch));reset();
  });
  for(const file of ["file-extractors.mjs","app.js","index.html","styles.css"]) await check("committed stamp detects changed "+file,()=>{
   fs.appendFileSync(path.join(scratch,file),"changed\n");commit();assert.throws(()=>stampModule.verify(scratch));reset();
  });
  await check("hash pushed sha rather than restored working bytes",()=>{
   const file=path.join(scratch,"file-extractors.mjs"),old=fs.readFileSync(file);
   fs.appendFileSync(file,"changed\n");const pushed=commit();fs.writeFileSync(file,old);
   assert.throws(()=>stampModule.verify(scratch,pushed));
   assert.doesNotThrow(()=>stampModule.verify(scratch,baseline));reset();
  });
  for(const flag of ["skip-worktree","assume-unchanged"]) await check("refuse hidden index flag "+flag,()=>{
   const file="file-extractors.mjs",old=fs.readFileSync(path.join(scratch,file));
   fs.appendFileSync(path.join(scratch,file),"changed\n");commit();fs.writeFileSync(path.join(scratch,file),old);
   git(["update-index","--"+flag,file]);
   try {
    assert.equal(git(["status","--porcelain"]),"");
    assert.throws(()=>stampModule.refuseFlags(scratch),/flag/);
    assert.throws(()=>stampModule.verify(scratch),/flag/);assert.notEqual(run().status,0);
   }finally{git(["update-index","--no-"+flag,file]);reset();}
  });
  await check("CRLF and LF working bytes give committed normalized hashes",()=>{
   const file=path.join(scratch,"app.js");fs.writeFileSync(file,"synthetic\r\n");
   assert.deepEqual(stampModule.hashes(scratch),stampModule.committedHashes(scratch,baseline));
   fs.writeFileSync(file,"synthetic\n");
   assert.deepEqual(stampModule.hashes(scratch),stampModule.committedHashes(scratch,baseline));
   for(const setting of ["true","false"]) {git(["config","core.autocrlf",setting]);assert.doesNotThrow(()=>stampModule.verify(scratch));}
  });
  await check("ignored scratch files do not change recording or verification",()=>{
   fs.writeFileSync(path.join(scratch,".gitignore"),"vendor/ignored/\ntests/fixtures/__pycache__/\n");
   for(const dir of ["vendor/ignored","tests/fixtures/__pycache__"]) {fs.mkdirSync(path.join(scratch,dir),{recursive:true});fs.writeFileSync(path.join(scratch,dir,"stray"),"ignored");}
   assert.deepEqual(stampModule.hashes(scratch),stampModule.committedHashes(scratch,baseline));assert.doesNotThrow(()=>stampModule.verify(scratch));
   for(const dir of ["vendor/ignored","tests/fixtures/__pycache__"])fs.rmSync(path.join(scratch,dir),{recursive:true});
   fs.unlinkSync(path.join(scratch,".gitignore"));
  });
  for(const [name,edit] of [["schema",s=>s.schema=2],["Chrome version",s=>s.chrome=""],["Playwright version",s=>s.playwright=""]]) await check("stamp refuses invalid "+name,()=>{
   const s=JSON.parse(fs.readFileSync(path.join(scratch,stampModule.STAMP)));edit(s);
   // Synthetic corruption only; never edit the production stamp.
   fs.writeFileSync(path.join(scratch,stampModule.STAMP),JSON.stringify(s));commit();assert.throws(()=>stampModule.verify(scratch));reset();
  });
  await check("committed symlink mode refused even with identical checkout bytes",()=>{
   const oid=git(["hash-object","-w","--stdin"],"synthetic\n");git(["update-index","--cacheinfo","120000,"+oid+",vendor/test.txt"]);
   git(["-c","user.name=Test","-c","user.email=test@users.noreply.github.com","commit","--quiet","-m","synthetic symlink"]);
   assert.throws(()=>stampModule.verify(scratch),/regular files/);reset();
  });
  const skipBlock=push.split("# BEGIN SKIP CHECK")[1]?.split("# END SKIP CHECK")[0];assert(skipBlock);
  const lines=JSON.parse(fs.readFileSync(path.join(repo,"docs/verification/results/cc-delta-review/gate-integrity.json"))).skipGrep;
  for(const line of lines) await check("skip wording: "+line,()=>{
   const accepted=line.includes('"skipped":0') || line==="skipped: 0" || line==="ℹ skipped 0";
   fs.writeFileSync(path.join(scratch,"test-output.txt"),line+"\n");
   const result=spawnSync(bash,["-c",'TEST_OUT=test-output.txt; fail() { echo "REFUSED: $*" >&2; exit 1; };'+skipBlock],{cwd:scratch,encoding:"utf8",windowsHide:true});
   assert.equal(result.status===0,accepted,result.stderr);
  });
  const {runParity}=require(path.join(root,"tools/parity.cjs"));
  const out=path.join(scratch,"docs/verification/results/post-review");fs.mkdirSync(out,{recursive:true});
  for(const [name,scenario] of [["first suite fails",{fail:1}],["second suite fails",{fail:2}],["spawn error",{error:true}],
    ["input changed",{change:true}],["Chrome versions differ",{versions:true}],["runtime unavailable",{runtime:true}]]) await check("parity does not stamp when "+name,()=>{
   const before=fs.readFileSync(path.join(scratch,stampModule.STAMP));let suite=0,reads=0;
   assert.throws(()=>runParity(scratch,{
    runtime:()=>{if(scenario.runtime)throw new Error("unavailable");return {playwrightVersion:"test"};},
    hashes:()=>({input:scenario.change && reads++ ? "after":"before"}),
    spawnSync:()=>{suite++;fs.writeFileSync(path.join(out,"browser-parity.json"),'{"chrome":"test"}');
     fs.writeFileSync(path.join(out,"static-smoke.json"),JSON.stringify({chrome:scenario.versions?"different":"test"}));
     return {status:scenario.fail===suite?1:0,error:scenario.error?new Error("spawn"):undefined};}
   }));assert(fs.readFileSync(path.join(scratch,stampModule.STAMP)).equals(before));
  });
  await check("parity successful stub generates stamp after both suites",()=>{
   let calls=0;runParity(scratch,{runtime:()=>({playwrightVersion:"test"}),hashes:()=>({input:"same"}),spawnSync:()=>{
    calls++;for(const file of ["browser-parity.json","static-smoke.json"])fs.writeFileSync(path.join(out,file),'{"chrome":"test"}');return {status:0};
   }});assert.equal(calls,2);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(scratch,stampModule.STAMP))).hashes,{input:"same"});
  });
 }finally{assert.equal(path.dirname(scratch),os.tmpdir());fs.rmSync(scratch,{recursive:true,force:true});}
 // Run the real ZIP resource guards without needing DOMParser or a browser.
 const extractor=fs.readFileSync(path.join(root,"file-extractors.mjs"),"utf8");
 const unzipSource=/async function unzip\(bytes\) \{[\s\S]*?^\}/m.exec(extractor)[0];
 let streams=0;
 class ObservedBlob extends Blob { constructor(...args) {super(...args);streams++;} }
 const unzip=vm.runInNewContext(unzipSource+"\nunzip",{DataView,Map,TextDecoder,Uint8Array,Blob:ObservedBlob,DecompressionStream});
 function zip(parts) {
  const locals=[],central=[];let offset=0;
  for(const {name,bytes=Buffer.alloc(0),expected=bytes.length,deflate=false} of parts) {
   const data=deflate?require("node:zlib").deflateRawSync(bytes):bytes,n=Buffer.from(name);
   const local=Buffer.alloc(30),entry=Buffer.alloc(46);
   local.writeUInt32LE(0x04034b50);local.writeUInt16LE(deflate?8:0,8);local.writeUInt32LE(data.length,18);local.writeUInt32LE(expected,22);local.writeUInt16LE(n.length,26);
   entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(deflate?8:0,10);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(expected,24);entry.writeUInt16LE(n.length,28);entry.writeUInt32LE(offset,42);
   locals.push(local,n,data);central.push(entry,n);offset+=local.length+n.length+data.length;
  }
  const end=Buffer.alloc(22),directory=Buffer.concat(central);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(parts.length,8);end.writeUInt16LE(parts.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directory,end]);
 }
 await check("ZIP entry count boundary 4096 allowed, 4097 refused",async()=>{
  const parts=Array.from({length:4096},(_,i)=>({name:"part"+i}));assert.equal(await (await unzip(zip(parts)))("part0"),"");
  parts.push({name:"extra"});await assert.rejects(()=>unzip(zip(parts)));
 });
 await check("ZIP selected part 65 MiB claim refused, unused part untouched",async()=>{
  const read=await unzip(zip([{name:"large",expected:65*1024*1024},{name:"small",bytes:Buffer.from("safe")}])) ;
  assert.equal(await read("small"),"safe");const before=streams;await assert.rejects(()=>read("large"));assert.equal(streams,before,"claim refused before creating decompression stream");
 });
 await check("ZIP inflated output exceeding claim refused",async()=>{
  const read=await unzip(zip([{name:"bomb",bytes:Buffer.alloc(2*1024*1024,65),expected:1024,deflate:true}]));await assert.rejects(()=>read("bomb"));
 });
 await check("ZIP cumulative 64 MiB cap and decoded cache",async()=>{
  const bytes=Buffer.alloc(33*1024*1024,65),read=await unzip(zip([{name:"one",bytes,deflate:true},{name:"two",bytes,deflate:true}]));
  assert.equal((await read("one")).length,bytes.length);assert.equal((await read("one")).length,bytes.length);
  await assert.rejects(()=>read("two"));
 });
 await check("ZIP duplicates refused only when the ambiguous part is read",async()=>{
  const read=await unzip(zip([{name:"unused"},{name:"unused"},{name:"selected",bytes:Buffer.from("safe")}])) ;
  assert.equal(await read("selected"),"safe");await assert.rejects(()=>read("unused"));
 });
 const relSource=/function relatedPart\(text,type,source=""\) \{[\s\S]*?^\}/m.exec(extractor)[0];
 const relatedPart=vm.runInNewContext('const REL="http://schemas.openxmlformats.org/package/2006/relationships";'+relSource+"\nrelatedPart",{
  URL,decodeURIComponent,xml:text=>({getElementsByTagNameNS:()=>JSON.parse(text).map(attrs=>({getAttribute:key=>attrs[key] || null}))})
 });
 await check("DOCX relationship External and foreign origin refused",()=>{
  assert.equal(relatedPart(JSON.stringify([{Type:"main",Target:"https://foreign.example/doc",TargetMode:"External"}]),"main"),null);
  for(const target of ["https://foreign.example/doc","//foreign.example/doc","file:///doc","doc?query","doc#fragment","%E0"])
   assert.throws(()=>relatedPart(JSON.stringify([{Type:"main",Target:target}]),"main"));
 });
 await check("DOCX relationship root, relative and core paths resolved",()=>{
  for(const [target,expected] of [["/custom/core.xml","custom/core.xml"],["../props/core.xml","props/core.xml"],["part%20name.xml","word/part name.xml"]])
   assert.equal(relatedPart(JSON.stringify([{Type:"core",Target:target}]),"core","word/document2.xml"),expected);
 });
 const result={suite:"post-review",passed,skipped:0,cases};
 const i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({suite:result.suite,passed,skipped:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
