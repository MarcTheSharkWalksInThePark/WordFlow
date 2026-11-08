"use strict";
// Does the fullscreen idle-hide stay hidden when the pointer rests where it clicked Play?
// Logs class changes and pointer/mouse events (with isTrusted) for 9 s after playback starts.
// Variants: click Play with the mouse and leave it; click then move the mouse to the frame centre;
// start with the Space key (mouse never over the controls).
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,runtime,openAt,settle}=require("./rv.cjs");
const mode=process.argv[2]||"headless";
(async()=>{
 const {playwright,executable}=runtime();
 const browser=await playwright.chromium.launch({executablePath:executable,headless:mode!=="headed",args:["--no-first-run","--disable-sync","--window-size=1400,1040"]});
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port;const out={mode,chrome:browser.version(),variants:{}};
 try{
  for(const variant of ["mouse-click-rest-on-play","mouse-click-then-move-to-frame","space-key-mouse-outside","mouse-click-rest-on-play-normal-mode"]){
   const ctx=await browser.newContext(mode==="headed"?{viewport:null}:{viewport:{width:1400,height:950},screen:{width:1400,height:950}});
   const page=await openAt(ctx,origin,null);
   await page.locator("#sample-button").click();await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();
   await page.evaluate(()=>setWpm(100));
   if(!variant.endsWith("normal-mode")){await page.locator("#fullscreen-button").click();await page.waitForFunction(()=>document.fullscreenElement);}
   await settle(page);
   await page.evaluate(()=>{window.__log=[];const t0=performance.now();const p=document.querySelector(".reader-panel");
    new MutationObserver(()=>window.__log.push([Math.round(performance.now()-t0),p.classList.contains("controls-hidden")?"HIDE":"SHOW"])).observe(p,{attributes:true,attributeFilter:["class"]});
    for(const ev of ["pointermove","pointerdown","mousemove","keydown","touchstart","pointerover","pointerout"])document.addEventListener(ev,e=>window.__log.push([Math.round(performance.now()-t0),ev+(e.isTrusted?"":"(untrusted)")+(e.target&&e.target.id?"@"+e.target.id:"")]),{capture:true});});
   if(variant.startsWith("mouse")){await page.locator("#play-button").click();if(variant.includes("then-move"))await page.mouse.move(700,300);}
   else{await page.mouse.move(5,5);await page.evaluate(()=>document.activeElement.blur());await page.keyboard.press("Space");}
   await page.waitForTimeout(9500);
   const r=await page.evaluate(()=>({log:window.__log,hiddenNow:document.querySelector(".reader-panel").classList.contains("controls-hidden"),playing:state.playing,index:state.index,
    opacity:getComputedStyle(document.querySelector(".reader-controls")).opacity,visibility:getComputedStyle(document.querySelector(".reader-controls")).visibility}));
   r.hides=r.log.filter(x=>x[1]==="HIDE").length;r.shows=r.log.filter(x=>x[1]==="SHOW").length;
   out.variants[variant]=r;
   await page.screenshot({path:path.resolve(__dirname,"../ev/shots/flicker-"+mode+"-"+variant+".png")});
   console.log(mode,variant,"hides",r.hides,"shows",r.shows,"hiddenNow",r.hiddenNow,r.visibility,r.opacity,"playing",r.playing,"\n   ",JSON.stringify(r.log.filter(x=>!/^pointerover|^pointerout/.test(x[1])).slice(0,24)));
   await ctx.close();
  }
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.resolve(__dirname,"../ev/runs/flicker-"+mode+".json"),JSON.stringify(out,null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
