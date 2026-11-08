"use strict";
// After hidden fullscreen controls, does leaving fullscreen leave the heading/transport faded?
// Samples computed opacity/visibility of .reader-heading and .reader-controls after exit.
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev");
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();const res={};
 try{
  const flows={
   "pause() then exitFullscreen() (my screenshot flow)":async p=>{await p.evaluate(()=>pause());await p.evaluate(()=>document.exitFullscreen());},
   "exitFullscreen() while playing (as Esc would)":async p=>{await p.evaluate(()=>document.exitFullscreen());},
   "F key while playing":async p=>{await p.keyboard.press("f");},
   "Space (pause) then F":async p=>{await p.keyboard.press("Space");await p.keyboard.press("f");},
   "Space (pause), wait 1 s, then exitFullscreen()":async p=>{await p.keyboard.press("Space");await p.waitForTimeout(1000);await p.evaluate(()=>document.exitFullscreen());},
   "click Exit button while playing":async p=>{await p.locator("#fullscreen-exit").click({force:true});}
  };
  for(const scheme of ["light"])for(const [name,exit] of Object.entries(flows)){
   const ctx=await browser.newContext({viewport:{width:1400,height:950},screen:{width:1400,height:950},colorScheme:scheme});const p=await openAt(ctx,origin,null);
   await p.locator("#sample-button").click();await p.locator("#apply-source-button").click();await p.locator("#review-back-button").click();
   await p.evaluate(()=>setWpm(100));await p.locator("#fullscreen-button").click();await p.waitForFunction(()=>document.fullscreenElement);
   await p.mouse.move(5,5);await p.evaluate(()=>document.activeElement.blur());await p.keyboard.press("Space");
   await p.waitForFunction(()=>getComputedStyle(document.querySelector(".reader-controls")).visibility==="hidden",null,{timeout:10000});
   await p.waitForTimeout(400);
   const t0=Date.now();await exit(p);
   await p.waitForFunction(()=>!document.fullscreenElement,null,{timeout:5000}).catch(()=>{});
   const samples=[];
   for(const wait of [0,150,400,1000,3000]){await p.waitForTimeout(wait?wait-(samples.length?[0,150,400,1000,3000][samples.length-1]:0):0);
    samples.push(await p.evaluate(()=>{const g=s=>{const c=getComputedStyle(document.querySelector(s));return +(+c.opacity).toFixed(2)+"/"+c.visibility;};
     const pn=document.querySelector(".reader-panel");return {fs:!!document.fullscreenElement,cls:pn.className,heading:g(".reader-heading"),controls:g(".reader-controls"),playing:state.playing,
      anims:document.getAnimations().map(a=>a.transitionProperty+":"+a.playState+":"+Math.round(a.currentTime||0)).join(",")};}));}
   await p.screenshot({path:path.join(OUT,"shots","fade-"+Object.keys(flows).indexOf(name)+".png")});
   // does a mouse move restore it?
   await p.mouse.move(600,400);await p.waitForTimeout(300);
   const afterMove=await p.evaluate(()=>{const c=getComputedStyle(document.querySelector(".reader-controls"));return +(+c.opacity).toFixed(2)+"/"+c.visibility;});
   res[name]={samples,afterMove,ms:Date.now()-t0};
   console.log(name,"\n  ",samples.map(s=>"fs="+s.fs+" heading="+s.heading+" controls="+s.controls+" playing="+s.playing+(s.anims?" anims="+s.anims:"")).join("\n   "),"\n   after mouse move:",afterMove,"cls:",samples.at(-1).cls);
   await ctx.close();
  }
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.join(OUT,"runs","fade.json"),JSON.stringify(res,null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
