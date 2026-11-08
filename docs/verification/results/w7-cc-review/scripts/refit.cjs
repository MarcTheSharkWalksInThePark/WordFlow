"use strict";
// Consequence of M9: enter fullscreen at 390x844 with an ordinary word on screen, with the real
// fullscreenchange handler and with an in-page copy that omits fitDisplayedWord().
const path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();
 try{for(const variant of ["real handler","handler without re-fit (M9)"])for(const word of ["reading","rhythm","comprehension;"]){
  const ctx=await browser.newContext({viewport:{width:390,height:844},screen:{width:390,height:844}});const p=await openAt(ctx,origin,null);
  if(variant.includes("M9"))await p.evaluate(()=>{document.removeEventListener("fullscreenchange",fullscreenChanged);
   document.addEventListener("fullscreenchange",()=>{const a=isReaderFullscreen();els.readerPanel.classList.toggle("is-fullscreen",a);els.fullscreenButton.textContent=a?"Exit fullscreen":"Fullscreen";syncFullscreenControls();});});
  await p.evaluate(w=>{loadText("Lead "+w+" Tail End.","T","T");setWordSize("large");seekTo(1);},word);await settle(p);
  const m=()=>p.evaluate(()=>{const d=els.wordDisplay,f=d.closest(".reader-frame"),fr=f.getBoundingClientRect(),r=document.createRange();r.selectNodeContents(d);const v=r.getBoundingClientRect();
   return {font:getComputedStyle(d).fontSize,text:Math.round(v.width),inner:f.clientWidth,inside:v.left>=fr.left+f.clientLeft&&v.right<=fr.left+f.clientLeft+f.clientWidth};});
  const before=await m();await p.locator("#fullscreen-button").click();await p.waitForFunction(()=>document.fullscreenElement);await settle(p);await settle(p);
  const after=await m();console.log(variant.padEnd(28),word.padEnd(15),"normal",JSON.stringify(before),"fullscreen",JSON.stringify(after));
  if(variant.includes("M9")&&word==="reading")await p.screenshot({path:path.resolve(__dirname,"../ev/shots/m9-390-reading.png")});
  await ctx.close();}}
 finally{await browser.close();await stop(server);}
})().catch(e=>{console.error(e);process.exitCode=1;});
