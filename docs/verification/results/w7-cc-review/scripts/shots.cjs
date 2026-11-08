"use strict";
// Own screenshots: 1400x950 and 390x844, both themes, six states each (+ full-page normal).
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev/shots");fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();const notes=[];
 try{
  for(const [w,h] of [[1400,950],[390,844]])for(const scheme of ["dark","light"]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},screen:{width:w,height:h},colorScheme:scheme});
   const page=await openAt(ctx,origin,null);const shot=async(name,full)=>{await settle(page);await page.screenshot({path:path.join(OUT,w+"-"+scheme+"-"+name+".png"),fullPage:!!full});};
   await page.locator("#sample-button").click();await page.locator("#source-review").scrollIntoViewIfNeeded();await shot("review");
   await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();
   await page.evaluate(()=>{seekTo(5);window.scrollTo(0,0);});await shot("normal");await shot("normal-full",true);
   await page.locator("#focus-mode-button").click();await page.evaluate(()=>window.scrollTo(0,0));await shot("focus");await shot("focus-full",true);
   await page.locator("#focus-mode-button").click();await page.evaluate(()=>window.scrollTo(0,0));
   await page.locator("#fullscreen-button").click();
   const native=await page.waitForFunction(()=>document.fullscreenElement===document.querySelector(".reader-panel")).then(()=>true,()=>false);
   await shot("fullscreen-paused");
   await page.evaluate(()=>setWpm(120));await page.locator("#play-button").click();
   await page.waitForFunction(()=>state.playing&&document.querySelector(".reader-panel").classList.contains("controls-hidden"),null,{timeout:10000});
   await page.waitForFunction(()=>getComputedStyle(document.querySelector(".reader-controls")).visibility==="hidden");await page.waitForTimeout(300);
   await shot("fullscreen-playing");await page.evaluate(()=>pause());
   await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);await page.waitForTimeout(500);
   await page.evaluate(()=>{seekTo(state.words.length-1);completeReading();window.scrollTo(0,0);});await shot("finished");
   notes.push({w,h,scheme,native});
   await ctx.close();
  }
 }finally{await browser.close();await stop(server);}
 console.log(JSON.stringify(notes));
})().catch(e=>{console.error(e);process.exitCode=1;});
