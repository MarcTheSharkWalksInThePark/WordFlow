"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {start,stop,request,sha,assert}=require("./helpers.cjs");
const root=path.join(__dirname,"..");
(async()=>{
 let server;const cases=[];
 async function check(name,method,target,status,verify,headers={}) {
   const r=await request(server.port,method,target,undefined,headers);
   assert.equal(r.status,status,name);if(verify)verify(r);
   cases.push({name,method,target,status,sha256:sha(r.body)});
 }
 try {
  server=await start(root,{preload:path.join(__dirname,"proxy-fixture.cjs")});
  const source=fs.readFileSync(path.join(root,"server.js"),"utf8");
  const declaration=/const STATIC_FILES = new Set\(\[[\s\S]*?\]\);/.exec(source)[0];
  const files=vm.runInNewContext(declaration+"\n[...STATIC_FILES]");
  for(const file of files.filter(f=>f!=="api/read")) await check("static "+file,"GET","/"+file,200,r=>assert(r.body.equals(fs.readFileSync(path.join(root,file)))));
  await check("homepage","GET","/",200);
  await check("HEAD homepage","HEAD","/",200,r=>assert.equal(r.body.length,0));
  await check("homepage query","GET","/?fixture=1",200);
  await check("encoded static","GET","/assets%5Cwordflow-mark.svg",200);
  for(const target of ["/unknown","/server.js","/package.json","/extract_text.py","/.env.local","/%2Eenv.local","/lib/read-proxy.mjs","/vendor/manifest.json","/docs/DECISIONS.md","/_headers","/_routes.json"])
   await check("refused "+target,"GET",target,404,r=>assert.equal(r.body.toString(),"Not found"));
  for(const method of ["GET","POST"]) await check("removed upload "+method,method,"/api/extract-file",404);
  const json=r=>JSON.parse(r.body);
  for(const target of ["/api/read","/api/read?url=http%3A%2F%2F%5B"]) await check("missing/invalid URL","GET",target,400,r=>assert.deepEqual(json(r),{error:"Missing URL"}));
  const origin="https://public-fixture.example";
  for(const [suffix,status] of [["/html",200],["/redirect",200],["/plain",200],["/missing",404],["/large",500]]) {
   await check("proxy contract "+suffix,"GET","/api/read?url="+encodeURIComponent(origin+suffix),status,r=>{
    const p=json(r);
    if(suffix==="/large") {assert.deepEqual(p,{error:"Response too large"});return;}
    assert.equal(p.url,origin+(suffix==="/redirect"?"/html":suffix));
    assert.equal(typeof p.contentType,"string");assert.equal(typeof p.body,"string");
    if(suffix==="/html" || suffix==="/redirect") {assert.equal(p.body,"<html><title>Local fixture</title><p>WordFlow local HTML.</p></html>");assert.equal(p.contentType,"text/html; charset=utf-8");}
    if(suffix==="/plain")assert.equal(p.body,"Non-HTML fixture. Æøå\n");
    if(suffix==="/missing")assert.equal(p.body,"Fixture not found");
   });
  }
  await check("POST now forbidden by W2","POST","/api/read?url="+encodeURIComponent(origin+"/plain"),405,r=>assert.deepEqual(json(r),{error:"GET required"}));
  await check("loopback now forbidden by W2","GET","/api/read?url=http://127.0.0.1",403,r=>assert.deepEqual(json(r),{error:"URL not allowed"}));
  await check("Origin forbidden","GET","/api/read?url="+encodeURIComponent(origin),403,r=>assert.deepEqual(json(r),{error:"Forbidden"}),{origin:"https://foreign.example"});
  const headers=(await request(server.port,"GET","/")).headers;
  assert.equal(headers["x-content-type-options"],"nosniff");assert.equal(headers["referrer-policy"],"no-referrer");
  assert(headers["content-security-policy"].includes("style-src 'self'"));assert(!headers["content-security-policy"].includes("unsafe-inline"));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,"vendor/manifest.json"),"utf8"));
  for(const entry of manifest.files)assert.equal(sha(fs.readFileSync(path.join(root,entry.file))),entry.sha256,entry.file);
  const capture=JSON.parse(fs.readFileSync(path.join(root,"tests/fixtures/capture.json"),"utf8"));
  for(const entry of capture.records) {if(entry.sha256)assert.equal(sha(fs.readFileSync(path.join(root,"tests/fixtures",entry.file))),entry.sha256);if(entry.goldenSha256)assert.equal(sha(fs.readFileSync(path.join(root,"tests/fixtures",entry.file+".golden.json"))),entry.goldenSha256);}
  const result={suite:"static-regression",passed:cases.length,skipped:0,vendorHashes:manifest.files.length,fixtureHashes:capture.records.length,cases,
   intentionalContractChanges:["/api/extract-file removed","/api/read GET only","non-public destinations refused"]};
  const i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(result,null,2)+"\n");
  console.log(JSON.stringify({suite:result.suite,passed:result.passed,skipped:0,vendorHashes:manifest.files.length}));
 }finally{await stop(server);}
})().catch(e=>{console.error(e);process.exitCode=1;});
