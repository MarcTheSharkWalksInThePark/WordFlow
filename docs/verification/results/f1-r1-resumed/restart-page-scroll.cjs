"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),root=path.resolve(__dirname,"../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare}=require(path.join(root,"tests/reader-round2.cjs")),{settle}=require(path.join(root,"tests/reader-smoke.cjs"));
async function snapshot(p){return p.evaluate(()=>{const d=els.wordDisplay,r=d.getBoundingClientRect();return {pageScroll:scrollY,regionScroll:d.scrollTop,top:r.top,documentTop:r.top+scrollY,left:r.left,width:r.width,height:r.height,font:getComputedStyle(d).fontSize,word:d.outerHTML.replace(' style=""',''),index:state.index,finished:state.finished,status:els.status.textContent};});}
(async()=>{let server,browser;try{
 server=await start(root);browser=await launch();const c=await browser.newContext({viewport:{width:390,height:600}}),origin="http://127.0.0.1:"+server.port;
 const master=await baseline(c,origin,root,"master"),candidate=await c.newPage();await candidate.goto(origin);
 for(const p of [master,candidate]){await prepare(p,"W".repeat(2000),{final:true,size:"comfortable"});await p.evaluate(()=>completeReading());await p.bringToFront();await settle(p);}
 await candidate.locator("#play-button").focus();for(let i=0;i<40;i++)await candidate.keyboard.press("Tab");
 await candidate.locator("#word-display").evaluate(el=>el.focus());await candidate.locator("#play-button").focus();
 await candidate.mouse.move(195,595);await candidate.mouse.wheel(0,300);await settle(candidate);
 await candidate.locator("#word-display").evaluate(el=>el.scrollTop=300);
 const before={master:await snapshot(master),candidate:await snapshot(candidate)};
 for(const p of [master,candidate])await p.evaluate(()=>els.finishRestartButton.click());
 const after={master:await snapshot(master),candidate:await snapshot(candidate)};
 const normalize=({pageScroll,top,...r})=>r;assert.deepEqual(normalize(after.candidate),normalize(after.master));
 for(const p of [master,candidate])await p.evaluate(()=>window.scrollTo(0,0));
 const aligned={master:await snapshot(master),candidate:await snapshot(candidate)};assert.deepEqual(aligned.candidate,aligned.master);
 fs.writeFileSync(path.join(__dirname,"restart-page-scroll.json"),JSON.stringify({before,after,aligned,documentGeometryIdentical:true,alignedGeometryIdentical:true},null,2)+"\n");console.log("Restart document geometry identical; candidate-only probes scroll the page, not the inert word. Aligned viewport geometry identical.");
}finally{if(browser)await browser.close();if(server)await stop(server);}})().catch(e=>{console.error(e);process.exitCode=1;});
