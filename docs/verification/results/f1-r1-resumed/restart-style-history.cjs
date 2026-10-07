"use strict";
const fs=require("fs"),path=require("path"),assert=require("assert/strict"),root=path.resolve(__dirname,"../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare}=require(path.join(root,"tests/reader-round2.cjs")),{settle}=require(path.join(root,"tests/reader-smoke.cjs"));
(async()=>{let server,browser;const rows={};try{
 server=await start(root);browser=await launch();const context=await browser.newContext({viewport:{width:1708,height:950}}),origin="http://127.0.0.1:"+server.port;
 for(const [name,ref]of [["master","master"],["startingHead","8ae3d54"],["candidate",null]]){
  const p=ref?await baseline(context,origin,root,ref):await context.newPage();if(!ref)await p.goto(origin);
  await prepare(p,"Pneumonoultramicroscopicsilicovolcanoconiosis",{final:true,size:"comfortable"});
  await p.evaluate(()=>completeReading());await p.bringToFront();await settle(p);
  await p.evaluate(()=>els.finishRestartButton.click());await settle(p);
  rows[name]=await p.evaluate(()=>{const d=els.wordDisplay,r=d.getBoundingClientRect();return {
   outerHTML:d.outerHTML,styleAttribute:d.getAttribute("style"),font:getComputedStyle(d).fontSize,
   rectangle:{left:r.left,top:r.top,width:r.width,height:r.height},index:state.index,finished:state.finished,
   playing:state.playing,countdown:state.countdownActive,status:els.status.textContent};});
  await p.close();
 }
 assert.deepEqual(rows.candidate,rows.startingHead,"must reproduce on the starting head");
 const normalize=row=>{const {styleAttribute,outerHTML,...rest}=row;return {...rest,outerHTML:outerHTML.replace(' style=""','')};};
 assert.deepEqual(normalize(rows.candidate),normalize(rows.master));
 fs.writeFileSync(path.join(__dirname,"restart-style-history.json"),JSON.stringify({rows,existingOnStartingHead:true,emptyStyleOnly:true},null,2)+"\n");
 console.log("Restart empty-style artifact reproduces on starting 8ae3d54; all other fields equal master.");
}finally{if(browser)await browser.close();if(server)await stop(server);}})().catch(e=>{console.error(e);process.exitCode=1;});
