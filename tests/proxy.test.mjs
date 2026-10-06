import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {liveSmoke} from "../tools/live-smoke.mjs";
const root=process.env.WORDFLOW_TEST_REPO || path.resolve(import.meta.dirname,"..");
const {handleRead,isPublicIP,validateTarget,SITE_HOSTNAMES}=await import(pathToFileURL(path.join(root,"lib/read-proxy.mjs")));
let passed=0; const cases=[];
async function check(name,fn) { try {await fn();cases.push({name,passed:true});passed++;} catch(e) {console.error("FAIL "+name);throw e;} }
const make=(url="https://public.example/article",init={})=>new Request("https://wordflow.example/api/read?url="+encodeURIComponent(url),init);
const dns=(address="93.184.216.34",v6="2606:4700:4700::1111")=>({Status:0,Answer:[{type:1,data:address},{type:28,data:v6}]});
function fake(handler=()=>new Response("hello",{headers:{"content-type":"text/plain"}}),answer=dns()) {
 const calls=[];
 const fetchImpl=async (value,options)=>{
   const url=new URL(value); calls.push({url:url.href,options});
   if(url.hostname==="cloudflare-dns.com") return Response.json(answer);
   return handler(url,options,calls);
 };
 return {fetchImpl,calls};
}
for(const ip of ["0.0.0.0","0.4.5.6","10.1.2.3","100.64.0.1","100.127.255.255","127.2.3.4","169.254.1.1","172.16.0.1","172.31.255.255","192.0.0.8","192.0.2.1","192.88.99.1","192.168.1.1","198.18.0.1","198.19.255.255","198.51.100.1","203.0.113.1","224.0.0.1","239.255.255.255","240.0.0.1","255.255.255.255","::","::1","fe80::1","fc00::1","fdff::1","ff02::1","2001:db8::1","3fff::1","::ffff:127.0.0.1","::ffff:7f00:1","::127.0.0.1","64:ff9b::a00:1","64:ff9b:1::a00:1","2002:0a00:0001::1","2001:0000:4136:e378:8000:63bf:3fff:fdd2","100::1","2001:20::1"]) {
 await check("deny IP "+ip,async()=>{
  assert.equal(isPublicIP(ip),false);
  const f=fake(); const res=await handleRead(make("https://"+(ip.includes(":")?"["+ip+"]":ip)+"/"),f.fetchImpl);
  assert.equal(res.status,403); assert.equal(f.calls.length,0,"no request reaches forbidden IP");
 });
}
for(const ip of ["1.1.1.1","8.8.8.8","93.184.216.34","100.63.255.255","100.128.0.1","172.15.255.255","172.32.0.1","198.20.0.1","223.255.255.255","2606:4700:4700::1111","2001:4860:4860::8888"]) {
 await check("allow public IP "+ip,()=>assert.equal(isPublicIP(ip),true));
}
for(const host of ["localhost","foo.localhost","foo.local","foo.internal","foo.arpa","LOCALHOST.","127.1","2130706433","0x7f000001"]) {
 await check("deny hostname "+host,async()=>{const f=fake();const r=await handleRead(make("http://"+host),f.fetchImpl);assert.equal(r.status,403);assert.equal(f.calls.length,0);});
}
for(const url of ["file:///etc/passwd","ftp://public.example/x","https://user:password@public.example","https://public.example:8080","http://public.example:22"]) {
 await check("deny syntax "+url,async()=>{const f=fake();assert.equal((await handleRead(make(url),f.fetchImpl)).status,403);assert.equal(f.calls.length,0);});
}
for(const scheme of ["file:","data:","javascript:","ftp:","ws:"]) {
 await check("redirect protocol refused by validateTarget "+scheme,async()=>{
  // Public host isolates the protocol guard from the empty/private hostname guards.
  const destination=new URL(scheme+"//public.example/path");
  assert.throws(()=>validateTarget(destination),/URL not allowed/);
  const f=fake(()=>new Response(null,{status:302,headers:{location:destination.href}}));
  assert.equal((await handleRead(make(),f.fetchImpl)).status,403);
  assert.equal(f.calls.filter(c=>new URL(c.url).hostname!=="cloudflare-dns.com").length,1);
 });
}
await check("GET only",async()=>{for(const method of ["POST","PUT","DELETE","OPTIONS","HEAD"]) {const f=fake();assert.equal((await handleRead(make(undefined,{method}),f.fetchImpl)).status,405);assert.equal(f.calls.length,0);}});
await check("Origin guard",async()=>{for(const origin of ["null","https://foreign.example","https://wordflow.example:443/"]) {const f=fake();assert.equal((await handleRead(make(undefined,{headers:{origin}}),f.fetchImpl)).status,403);assert.equal(f.calls.length,0);}});
await check("same Origin and no client header forwarding",async()=>{
 const f=fake();const r=await handleRead(make(undefined,{headers:{origin:"https://wordflow.example",cookie:"secret",authorization:"Bearer secret","x-forwarded-for":"10.0.0.1"}}),f.fetchImpl);
 assert.equal(r.status,200);
 const outbound=f.calls.filter(c=>new URL(c.url).hostname!=="cloudflare-dns.com");
 assert.deepEqual(outbound[0].options.headers,{"user-agent":"WordFlow Reader/1.0"});
 assert.equal(outbound[0].options.redirect,"manual");
 assert.deepEqual(await r.json(),{url:"https://public.example/article",contentType:"text/plain",body:"hello"});
});
for(const answer of [dns("10.0.0.1"),dns("93.184.216.34","::ffff:192.168.1.1"),{Status:0,Answer:[{type:1,data:"93.184.216.34"},{type:1,data:"127.0.0.1"}]},{Status:0,Answer:[]},{Status:3,Answer:[]},{Status:0,Answer:[{type:28,data:"invalid"}]}]) {
 await check("DNS fail closed "+JSON.stringify(answer),async()=>{const f=fake(undefined,answer);const r=await handleRead(make(),f.fetchImpl);assert([403,500].includes(r.status));assert(f.calls.every(c=>new URL(c.url).hostname==="cloudflare-dns.com"));assert.equal(f.calls.length,2);});
}
await check("DoH transport failures are generic",async()=>{const r=await handleRead(make(),async()=>{throw new Error("secret internal path");});assert.equal(r.status,500);assert.deepEqual(await r.json(),{error:"Could not load website"});});
await check("DoH redirects refused before following",async()=>{
 let destinations=0;const options=[];
 const r=await handleRead(make(),async(u,o)=>{
  if(new URL(u).hostname!=="cloudflare-dns.com") {destinations++;return new Response("unsafe");}
  options.push(o);
  return new Response(null,{status:302,headers:{location:"https://unvalidated.example/dns-query"}});
 });
 assert.equal(r.status,500);assert.equal(destinations,0);
 assert.equal(options.length,2);
 for(const o of options) {assert.equal(o.redirect,"manual");assert.deepEqual(o.headers,{accept:"application/dns-json"});}
});
// Workerd Request::tryParseRedirect accepts only follow/manual, unlike Node fetch.
// Pin: cloudflare/workerd ebd90312bff06ae5c7689a23a3589c898f4b7618, api/http.c++.
await check("Workers fetch options and byte-stream APIs accept the real proxy path",async()=>{
 const calls=[];let readers=0,reads=0,releases=0;
 const body="<html><body>café 🙂</body></html>";
 const byteResponse=(text,contentType)=>{
  const bytes=new TextEncoder().encode(text);
  const response=new Response(new ReadableStream({start(c){
   // One byte per chunk also exercises split multibyte UTF-8 without string chunks.
   for(const byte of bytes)c.enqueue(Uint8Array.of(byte));c.close();
  }}),{headers:{"content-type":contentType}});
  const stream=response.body, getReader=stream.getReader.bind(stream);
  stream.getReader=()=>{
   readers++;const reader=getReader();
   return {
    read:()=>{reads++;return reader.read();},
    cancel:reason=>reader.cancel(reason),
    releaseLock:()=>{releases++;reader.releaseLock();}
   };
  };
  return response;
 };
 const workersFetch=async(value,options)=>{
  // Source-backed runtime constraint; this intentionally rejects the old Node-valid mode.
  if(!["follow","manual"].includes(options.redirect))throw new TypeError("Invalid redirect value");
  const request=new Request(value,options);
  assert.equal(request.redirect,"manual");
  assert(options.signal instanceof AbortSignal);
  assert.equal(typeof options.signal.throwIfAborted,"function");
  assert.equal(options.signal.aborted,false);
  calls.push({request,options});
  if(new URL(value).hostname==="cloudflare-dns.com")
   return byteResponse(JSON.stringify(dns()),"application/dns-json");
  return byteResponse(body,"text/html; charset=utf-8");
 };
 const response=await handleRead(make(),workersFetch);
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{url:"https://public.example/article",contentType:"text/html; charset=utf-8",body});
 assert.equal(calls.length,3);
 assert.equal(readers,3);assert.equal(releases,3);assert(reads>body.length);
 assert(calls.every(c=>c.options.signal===calls[0].options.signal));
 assert.deepEqual(calls.slice(0,2).map(c=>Object.fromEntries(c.request.headers)),[
  {accept:"application/dns-json"},{accept:"application/dns-json"}
 ]);
 assert.deepEqual(Object.fromEntries(calls[2].request.headers),{"user-agent":"WordFlow Reader/1.0"});
});
for(const status of [301,302,303,307,308]) await check("DoH "+status+" with Location fails closed before any target fetch",async()=>{
 const calls=[];
 const response=await handleRead(make(),async(value,options)=>{
  const url=new URL(value);calls.push({url,options});
  assert.equal(url.hostname,"cloudflare-dns.com","no redirect destination or target fetch");
  assert.equal(options.redirect,"manual");
  // A valid DNS answer in the redirect body must not bypass the HTTP-status refusal.
  return Response.json(dns(),{status,headers:{location:"http://127.0.0.1/dns-query"}});
 });
 assert.equal(response.status,500);assert.deepEqual(await response.json(),{error:"Could not load website"});
 assert.equal(calls.length,2);
});
for(const [name,response] of [
 ["HTTP 500 with otherwise valid answers",()=>Response.json(dns(),{status:500})],
 ["SERVFAIL with otherwise valid answers",()=>Response.json({...dns(),Status:2})],
 ["NXDOMAIN with otherwise valid answers",()=>Response.json({...dns(),Status:3})],
 ["invalid JSON",()=>new Response("not JSON")],
 ["non-array Answer",()=>Response.json({Status:0,Answer:{}})],
 ["over 64 KiB",()=>new Response(JSON.stringify({...dns(),padding:"x".repeat(65536)}))]
]) await check("DoH fails closed: "+name,async()=>{
 let destinations=0;
 const r=await handleRead(make(),async u=>new URL(u).hostname==="cloudflare-dns.com"?response():(destinations++,new Response("unsafe")));
 assert.equal(r.status,500);assert.equal(destinations,0);assert.deepEqual(await r.json(),{error:name==="over 64 KiB"?"Response too large":"Could not load website"});
});
await check("DoH AAAA failure refuses a successful A",async()=>{
 let destinations=0;
 const r=await handleRead(make(),async u=>{
  const url=new URL(u);
  if(url.hostname!=="cloudflare-dns.com"){destinations++;return new Response("unsafe");}
  return url.searchParams.get("type")==="A"?Response.json(dns()):Response.json(dns(),{status:500});
 });
 assert.equal(r.status,500);assert.equal(destinations,0);
});
for(const host of ["wordflow.example",...SITE_HOSTNAMES,"reader.production.example"]) {
 await check("self and configured hostname refusal "+host,async()=>{
  const configured=[...SITE_HOSTNAMES,"reader.production.example"];
  for(const target of ["https://"+host+"/api/read","http://"+host.toUpperCase()+".:80/article"]) {
   const f=fake();assert.equal((await handleRead(make(target),f.fetchImpl,configured)).status,403);assert.equal(f.calls.length,0);
   const redirect=fake(()=>new Response(null,{status:302,headers:{location:target}}));
   assert.equal((await handleRead(make(),redirect.fetchImpl,configured)).status,403);
   assert.equal(redirect.calls.filter(c=>new URL(c.url).hostname!=="cloudflare-dns.com").length,1);
  }
 });
}
await check("redirect rechecks private IP",async()=>{
 const f=fake(()=>new Response(null,{status:302,headers:{location:"http://10.0.0.1/"}}));const r=await handleRead(make(),f.fetchImpl);
 assert.equal(r.status,403);assert.equal(f.calls.filter(c=>new URL(c.url).hostname!=="cloudflare-dns.com").length,1);
});
await check("redirect rechecks DNS hostname",async()=>{
 const f=fake(url=>new Response(null,{status:302,headers:{location:"https://second.example/"}}));
 const fetchImpl=async (u,o)=>new URL(u).hostname==="cloudflare-dns.com" && new URL(u).searchParams.get("name")==="second.example" ? Response.json(dns("10.0.0.1")) : f.fetchImpl(u,o);
 assert.equal((await handleRead(make(),fetchImpl)).status,403);assert.equal(f.calls.filter(c=>new URL(c.url).hostname==="second.example").length,0);
});
await check("five redirects accepted; sixth refused",async()=>{
 for(const n of [5,6]) {
  let count=0;
  const f=fake(()=>count++<n?new Response(null,{status:302,headers:{location:"/hop"+count}}):new Response("done"));
  const r=await handleRead(make(),f.fetchImpl);assert.equal(r.status,n===5?200:500);
  assert.equal(f.calls.filter(c=>new URL(c.url).hostname==="cloudflare-dns.com").length,12);
 }
});
await check("streamed 3 MiB boundary and overflow",async()=>{
 for(const bytes of [3*1024*1024,3*1024*1024+1]) {const f=fake(()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(bytes));c.close();}})));const r=await handleRead(make(),f.fetchImpl);assert.equal(r.status,bytes===3*1024*1024?200:500);if(r.status===500)assert.deepEqual(await r.json(),{error:"Response too large"});}
});
await check("missing and malformed URL contract",async()=>{
 for(const url of ["https://wordflow.example/api/read","https://wordflow.example/api/read?url=http%3A%2F%2F%5B"]) {const r=await handleRead(new Request(url),fake().fetchImpl);assert.equal(r.status,400);assert.deepEqual(await r.json(),{error:"Missing URL"});}
});
await check("scheme-less target and remote status contract",async()=>{
 const f=fake(()=>new Response("Fixture not found",{status:404,headers:{"content-type":"text/plain"}}));
 const r=await handleRead(make("public.example/missing"),f.fetchImpl);assert.equal(r.status,404);assert.deepEqual(await r.json(),{url:"https://public.example/missing",contentType:"text/plain",body:"Fixture not found"});
});
await check("12 second deadline includes streamed body",async()=>{
 const set=globalThis.setTimeout,clear=globalThis.clearTimeout;let trigger;
 globalThis.setTimeout=(fn,ms)=>{assert.equal(ms,12000);trigger=fn;return 1;};
 globalThis.clearTimeout=()=>{};
 try {
  const f=fake(()=>new Response(new ReadableStream({start(){}})));
  const pending=handleRead(make(),f.fetchImpl);
  await new Promise(resolve=>setImmediate(resolve));trigger();
  const r=await pending;assert.equal(r.status,500);assert.deepEqual(await r.json(),{error:"Website request timed out"});
 }finally{globalThis.setTimeout=set;globalThis.clearTimeout=clear;}
});
for(const requestHost of ["reader-demo.pages.dev","abc123.reader-demo.pages.dev","MASTER.READER-DEMO.PAGES.DEV...:80"]) {
 const request=target=>new Request("https://"+requestHost+"/api/read?url="+encodeURIComponent(target));
 for(const target of ["https://abc123.reader-demo.pages.dev/api/read","https://master.reader-demo.pages.dev/",
  "https://reader-demo.pages.dev/","https://HASH.READER-DEMO.PAGES.DEV/","https://hash.reader-demo.pages.dev.../",
  "https://hash.reader-demo.pages.dev:443/","http://hash.reader-demo.pages.dev:80/",
  "https://hash%2Ereader-demo%2Epages%2Edev/","https://ｈａｓｈ.reader-demo。pages.dev/",
  "master.reader-demo.pages.dev"]) {
  for(const redirect of [false,true]) await check("Pages project suffix "+requestHost+" -> "+target+" redirect="+redirect,async()=>{
   const f=fake(()=>new Response(null,{status:302,headers:{location:new URL(target.startsWith("http")?target:"https://"+target).href}}));
   const response=await handleRead(request(redirect?"https://public.example/":target),f.fetchImpl,["wrong.pages.dev"]);
   assert.equal(response.status,403);
   // Only the initial public hop may perform DNS/fetch; the refused hop performs neither.
   assert.equal(f.calls.length,redirect?3:0);
   assert(f.calls.every(c=>["public.example","cloudflare-dns.com"].includes(new URL(c.url).hostname)));
  });
 }
 await check("unrelated Pages site allowed from "+requestHost,async()=>{
  const f=fake();assert.equal((await handleRead(request("https://unrelated.pages.dev/"),f.fetchImpl)).status,200);
  assert.equal(f.calls.length,3);
 });
}
await check("IDNA/punycode Pages project derived on deployment alias",async()=>{
 for(const target of ["https://bücher.pages.dev/","https://next.xn--bcher-kva.pages.dev/","https://next.b%C3%BCcher.pages.dev/"]) {
  const f=fake();const request=new Request("https://hash.bücher.pages.dev/api/read?url="+encodeURIComponent(target));
  assert.equal((await handleRead(request,f.fetchImpl)).status,403);assert.equal(f.calls.length,0);
 }
});
await check("third party former default is allowed",async()=>{
 const f=fake();assert.equal((await handleRead(make("https://wordflow.pages.dev/"),f.fetchImpl)).status,200);
 assert.deepEqual(SITE_HOSTNAMES,[]);
});
await check("Pages suffix boundary does not block similar domains",async()=>{
 for(const target of ["https://not-reader-demo.pages.dev/","https://reader-demo.pages.dev.public.example/"]) {
  const f=fake();assert.equal((await handleRead(new Request("https://reader-demo.pages.dev/api/read?url="+encodeURIComponent(target)),f.fetchImpl)).status,200);
 }
});
await check("reserved unallocated IPv6 denied",async()=>{for(const ip of ["3000::1","3ffe::1","2d00::1","2001:1000::1","2001:f000::1"])assert.equal(isPublicIP(ip),false);});
await check("post-deploy smoke rejects broken public loading and guard regressions",async()=>{
 const healthy=async value=>{
  const target=new URL(value).searchParams.get("url");
  return target==="https://example.com/"?Response.json({contentType:"text/html",body:"<html>Example Domain</html>"}):
   Response.json({error:"URL not allowed"},{status:403});
 };
 const result=await liveSmoke(undefined,healthy);assert.equal(result.passed,3);
 for(const [name,override] of [
  ["public 500",value=>new URL(value).searchParams.get("url")==="https://example.com/"?Response.json({error:"Could not load website"},{status:500}):healthy(value)],
  ["quota marker at 200",()=>new Response("WORDFLOW_FREE_LIMIT")],
  ["private accepted",()=>Response.json({contentType:"text/html",body:"<html>Example Domain</html>"})],
  ["non-HTML success",value=>new URL(value).searchParams.get("url")==="https://example.com/"?Response.json({contentType:"text/plain",body:"Example Domain"}):healthy(value)]
 ]) await assert.rejects(()=>liveSmoke(undefined,override),undefined,name);
});
const output={passed,skipped:0,cases};
const i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(output,null,2)+"\n");
console.log(JSON.stringify({suite:"proxy",passed,skipped:0}));
