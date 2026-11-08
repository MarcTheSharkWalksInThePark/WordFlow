"use strict";
// Horizontal overflow scan 300..430 px (both SHAs, both themes, normal + loaded text + fullscreen-off).
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const BASE="2a376445ceb1b98a1b4c943cf8834e77e0578120";
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();const out=[];
 try{for(const scheme of ["dark","light"])for(const [k,sha] of [["base",BASE],["cand",null]]){
  const ctx=await browser.newContext({viewport:{width:430,height:844},colorScheme:scheme});const p=await openAt(ctx,origin,sha);
  await p.locator("#sample-button").click();await p.locator("#apply-source-button").click();await p.locator("#review-back-button").click();
  const row={scheme,k,over:[]};
  for(let w=300;w<=430;w+=5){await p.setViewportSize({width:w,height:844});await settle(p);const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>w)row.over.push(w+":"+sw);}
  out.push(row);console.log(scheme,k,row.over.join(" ")||"none");await ctx.close();}}
 finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.resolve(__dirname,"../ev/runs/widths.json"),JSON.stringify(out,null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
