"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm");
const {spawnSync}=require("node:child_process"),assert=require("node:assert/strict");
const repo=path.join(__dirname,".."),root=process.env.WORDFLOW_TEST_REPO || repo;
const stampModule=require(path.join(root,"tools/parity-stamp.cjs"));
let passed=0;const cases=[];
async function check(name,fn) {try{await fn();passed++;cases.push({name,passed:true});}catch(e){console.error("FAIL "+name);throw e;}}
(async()=>{
 const app=fs.readFileSync(path.join(repo,"app.js"),"utf8");
 const source=/async function fetchViaLocalReader\(url\) \{[\s\S]*?^\}/m.exec(app)[0];
 const rows=[
  ["HTML Error 1027 at 429",429,"text/html","<h1>Error 1027</h1>","quota"],
  ["split HTML Error 1027 at 200",200,"text/html","<h1>Error <span>1027</span></h1>","quota"],
  ["plain-text error code regardless of type",503,"text/plain","error code: 1027","quota"],
  ["plain-text error code with JSON type",503,"application/json","error code: 1027","quota"],
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
  for(const dir of ["vendor","tests/fixtures","tools"])fs.mkdirSync(path.join(scratch,dir),{recursive:true});
  for(const file of ["file-extractors.mjs","app.js","index.html","styles.css","vendor/test.txt","tests/fixtures/test.docx"])fs.writeFileSync(path.join(scratch,file),"synthetic\n");
  fs.copyFileSync(path.join(root,"tools/parity-stamp.cjs"),path.join(scratch,"tools/parity-stamp.cjs"));
  stampModule.record(scratch,"test-Chrome","test-Playwright");
  const push=fs.readFileSync(path.join(root,"tools/push.sh"),"utf8");
  const block=push.split("# BEGIN PARITY STAMP CHECK")[1]?.split("# END PARITY STAMP CHECK")[0];assert(block);
  const bash=process.platform==="win32"?"C:/Program Files/Git/bin/bash.exe":"bash";
  const run=()=>spawnSync(bash,["-c",'fail() { echo "REFUSED: $*" >&2; exit 1; };'+block],{cwd:scratch,encoding:"utf8",windowsHide:true});
  await check("push stamp block accepts matching hashes",()=>assert.equal(run().status,0));
  await check("push stamp block refuses changed fixture",()=>{
   fs.appendFileSync(path.join(scratch,"tests/fixtures/test.docx"),"changed");
   const result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/npm run parity/);
  });
  await check("stamp detects additions and deletions",()=>{
   stampModule.record(scratch,"test-Chrome","test-Playwright");fs.writeFileSync(path.join(scratch,"vendor/extra.txt"),"new");
   assert.throws(()=>stampModule.verify(scratch));fs.unlinkSync(path.join(scratch,"vendor/extra.txt"));
   assert.doesNotThrow(()=>stampModule.verify(scratch));fs.unlinkSync(path.join(scratch,"vendor/test.txt"));assert.throws(()=>stampModule.verify(scratch));
  });
 }finally{assert.equal(path.dirname(scratch),os.tmpdir());fs.rmSync(scratch,{recursive:true,force:true});}
 const result={suite:"post-review",passed,skipped:0,cases};
 const i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({suite:result.suite,passed,skipped:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
