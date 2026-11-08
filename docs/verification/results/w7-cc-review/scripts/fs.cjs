"use strict";
// Fullscreen behaviour: entries/exits (incl. a real Escape key), idle timing, reveal, focusability,
// long-title readout, long tokens, reload. Usage: node fs.cjs headed|headless [width height]
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,runtime,openAt,settle}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev/runs");
const mode=process.argv[2]||"headless",W=Number(process.argv[3]||1400),H=Number(process.argv[4]||950);
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
const LONG_TITLE="An exceptionally long source title that keeps going well past any sensible header width so that ellipsis must engage";
(async()=>{
 const {playwright,executable}=runtime();
 const browser=await playwright.chromium.launch({executablePath:executable,headless:mode!=="headed",
  args:["--disable-background-networking","--disable-component-update","--disable-sync","--no-first-run","--disable-quic","--window-size="+W+","+(H+90)]});
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port;
 const res={mode,viewport:[W,H],chrome:browser.version(),steps:[]};
 const log=(k,v)=>{res.steps.push([k,v]);console.log(k,JSON.stringify(v));};
 try{
  const ctx=await browser.newContext(mode==="headed"?{viewport:null}:{viewport:{width:W,height:H},screen:{width:W,height:H}});
  const page=await openAt(ctx,origin,null);const errs=[];page.on("pageerror",e=>errs.push(e.message));
  const fsOn=()=>page.evaluate(()=>({native:document.fullscreenElement===document.querySelector(".reader-panel"),cls:document.querySelector(".reader-panel").classList.contains("is-fullscreen")}));
  const waitFs=async on=>{try{await page.waitForFunction(on=>(document.fullscreenElement===document.querySelector(".reader-panel"))===on&&document.querySelector(".reader-panel").classList.contains("is-fullscreen")===on,on,{timeout:4000});return true;}catch{return false;}};
  await page.locator("#sample-button").click();await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();await settle(page);
  log("start",await fsOn());
  await page.locator("#fullscreen-button").click();log("enter via button",{ok:await waitFs(true),...await fsOn()});
  await page.locator("#play-button").focus();await page.keyboard.press("f");log("exit via F",{ok:await waitFs(false),...await fsOn()});
  await page.locator("#reader-fullscreen").click();log("enter via icon",{ok:await waitFs(true),...await fsOn()});
  await page.keyboard.press("Escape");log("exit via real Escape key",{ok:await waitFs(false),...await fsOn()});
  if((await fsOn()).native){await page.evaluate(()=>document.exitFullscreen());await waitFs(false);}
  await page.locator("#play-button").focus();await page.keyboard.press("f");log("enter via F",{ok:await waitFs(true),...await fsOn()});
  await page.locator("#fullscreen-exit").click();log("exit via Exit button",{ok:await waitFs(false),...await fsOn()});
  // idle timing
  await page.locator("#fullscreen-button").click();await waitFs(true);await settle(page);
  log("panel size in fullscreen",await page.evaluate(()=>{const r=document.querySelector(".reader-panel").getBoundingClientRect();return [r.width,r.height,innerWidth,innerHeight];}));
  await page.waitForTimeout(3200);
  log("paused 3.2 s: hidden?",await page.evaluate(()=>document.querySelector(".reader-panel").classList.contains("controls-hidden")));
  await page.evaluate(()=>{window.__t={};new MutationObserver(()=>{const h=document.querySelector(".reader-panel").classList.contains("controls-hidden");const k=h?"hid":"shown";(window.__t[k]=window.__t[k]||[]).push(performance.now());}).observe(document.querySelector(".reader-panel"),{attributes:true,attributeFilter:["class"]});});
  await page.evaluate(()=>setWpm(150));
  await page.locator("#play-button").click();
  await page.waitForFunction(()=>state.playing&&!state.countdownActive,null,{timeout:8000});
  const t0=await page.evaluate(()=>performance.now());
  await page.waitForFunction(()=>document.querySelector(".reader-panel").classList.contains("controls-hidden"),null,{timeout:8000});
  const t=await page.evaluate(()=>window.__t);log("hide delay after playback start (ms)",{delay:t.hid[0]-t0});
  log("focusable during the 200 ms fade (immediately after hide)",await page.evaluate(()=>{const e=document.querySelector("#play-button");e.focus();const ok=document.activeElement===e;document.activeElement.blur();return ok;}));
  await page.waitForTimeout(450);
  // focusability while hidden
  log("hidden bars focusable?",await page.evaluate(()=>{const p=document.querySelector(".reader-panel");
   const f=[...p.querySelectorAll("button,input,[tabindex]")].filter(e=>e.closest(".reader-heading,.reader-controls")&&!e.disabled);
   const out=f.map(e=>{e.focus();const ok=document.activeElement===e;const cs=getComputedStyle(e);return {id:e.id||e.className,focused:ok,vis:cs.visibility,disp:cs.display};});
   document.activeElement.blur();return out.filter(o=>o.focused);}));
  const tabbed=[];for(let i=0;i<8;i++){await page.keyboard.press("Tab");tabbed.push(await page.evaluate(()=>{const e=document.activeElement;return {id:e.id||e.tagName,inBars:!!e.closest(".reader-heading,.reader-controls")};}));}
  log("Tab stops while (re)shown by Tab",tabbed.slice(0,3));
  // reveal via pointer
  for(const how of ["pointer","keyboard","touch"]){
   await page.waitForFunction(()=>document.querySelector(".reader-panel").classList.contains("controls-hidden"),null,{timeout:8000}).catch(()=>{});
   const was=await page.evaluate(()=>document.querySelector(".reader-panel").classList.contains("controls-hidden"));
   const ts=await page.evaluate(()=>performance.now());
   if(how==="pointer")await page.mouse.move(200+Math.random()*50,200);
   if(how==="keyboard")await page.keyboard.press("Shift");
   if(how==="touch"){const cdp=await ctx.newCDPSession(page);await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:300,y:300}]});await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await cdp.detach();}
   const ok=await page.waitForFunction(()=>!document.querySelector(".reader-panel").classList.contains("controls-hidden"),null,{timeout:2000}).then(()=>true,()=>false);
   log("reveal via "+how,{wasHidden:was,revealed:ok,playing:await page.evaluate(()=>state.playing)});
  }
  await page.evaluate(()=>pause());await settle(page);
  log("after pause hidden?",await page.evaluate(()=>document.querySelector(".reader-panel").classList.contains("controls-hidden")));
  // long title readout
  await page.evaluate(t=>{loadText(document.querySelector("#text-input").value||"A focused reading rhythm can make dense text feel lighter.",t,t);seekTo(3);},LONG_TITLE);await settle(page);
  log("long-title readout",await page.evaluate(()=>{const p=document.querySelector(".reader-panel").getBoundingClientRect(),pos=document.querySelector("#fullscreen-position"),r=pos.getBoundingClientRect(),
   rng=document.createRange();rng.selectNodeContents(pos);const ir=rng.getBoundingClientRect(),t=document.querySelector("#reading-title");
   let clipped=false;for(let e=pos.parentElement;e&&e!==document.body;e=e.parentElement){const b=e.getBoundingClientRect();if(getComputedStyle(e).overflow!=="visible"&&(ir.left<b.left-0.5||ir.right>b.right+0.5||ir.top<b.top-0.5||ir.bottom>b.bottom+0.5))clipped=true;}
   return {text:pos.textContent,inside:ir.left>=p.left&&ir.right<=p.right&&ir.top>=p.top&&ir.bottom<=p.bottom,clippedByAncestor:clipped,
    posOverflow:pos.scrollWidth>pos.clientWidth,titleEllipsis:t.scrollWidth>t.clientWidth||t.parentElement.scrollWidth>t.parentElement.clientWidth,rect:[ir.left,ir.top,ir.right,ir.bottom],panel:[p.left,p.top,p.right,p.bottom]};}));
  await page.screenshot({path:path.join(OUT,"fs-"+mode+"-"+W+"-longtitle.png")});
  // long tokens in fullscreen
  for(const token of [REAL,"W".repeat(2000)]){
   await page.evaluate(token=>{pause();loadText("Lead "+token+" Tail End.","Reader fixture","Reader fixture");seekTo(1);},token);await settle(page);await settle(page);
   log("token in fullscreen "+token.length,await page.evaluate(()=>{const d=els.wordDisplay,f=d.closest(".reader-frame"),fr=f.getBoundingClientRect(),x=fr.left+f.clientLeft,y=fr.top+f.clientTop;
    const sc=d.classList.contains("scrolling-long-word"),rg=document.createRange();rg.selectNodeContents(d);const v=sc?d.getBoundingClientRect():rg.getBoundingClientRect();
    return {font:getComputedStyle(d).fontSize,wrapped:d.classList.contains("wrapped-long-word"),scrolling:sc,inside:v.left>=x&&v.right<=x+f.clientWidth&&v.top>=y&&v.bottom<=y+f.clientHeight,
     text:d.textContent.length,frame:[f.clientWidth,f.clientHeight],noOverflow:f.scrollWidth===f.clientWidth&&f.scrollHeight===f.clientHeight};}));
   await page.screenshot({path:path.join(OUT,"fs-"+mode+"-"+W+"-token"+token.length+".png")});
  }
  await page.evaluate(()=>document.fullscreenElement&&document.exitFullscreen());await waitFs(false);
  await page.reload({waitUntil:"networkidle"});await settle(page);log("after reload",await fsOn());
  log("page errors",errs);
  await ctx.close();
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.join(OUT,"fullscreen-"+mode+"-"+W+".json"),JSON.stringify(res,null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
