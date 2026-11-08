"use strict";
// Shared review helpers. CLONE = fresh --no-local clone at 51e22d0. Baseline pages serve the
// four frontend files (incl. the SVG) from a given SHA through routing; the server is the clone's.
const path=require("node:path"),fs=require("node:fs"),{execFileSync}=require("node:child_process");
const CLONE=path.resolve(__dirname,"../wf");
const {start,stop}=require(path.join(CLONE,"tests/helpers.cjs"));
const {launch,runtime}=require(path.join(CLONE,"tests/browser-helper.cjs"));
const FILES=["index.html","app.js","styles.css","assets/wordflow-mark.svg"];
const blobsAt=sha=>Object.fromEntries(FILES.map(f=>["/"+f,execFileSync("git",["show",sha+":"+f],{cwd:CLONE})]));
async function openAt(context,origin,sha){
 const page=await context.newPage();
 if(sha){
  const blobs=blobsAt(sha);
  await page.route("**/*",async route=>{
   const u=new URL(route.request().url()),key=u.pathname==="/"?"/index.html":u.pathname;
   if(u.origin===origin&&blobs[key])return route.fulfill({response:await route.fetch(),body:blobs[key]});
   return route.continue();
  });
 }
 await page.goto(origin,{waitUntil:"networkidle"});
 return page;
}
const settle=async page=>{await page.evaluate(()=>document.fonts.ready);for(let i=0;i<3;i++)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
module.exports={CLONE,start,stop,launch,runtime,openAt,settle,blobsAt};
