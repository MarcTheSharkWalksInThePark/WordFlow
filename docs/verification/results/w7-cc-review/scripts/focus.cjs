"use strict";
// Keyboard focus rings: crop screenshots of focused controls in both themes + computed ring styles.
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev/shots/focus");fs.mkdirSync(OUT,{recursive:true});
const IDS=["#theme-button","#fullscreen-button","#sample-button","#tab-file","#text-input","#play-button","#progress-slider","#reader-fullscreen","#wpm-slider","#focus-toggle"];
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();const res=[];
 try{for(const scheme of ["dark","light"]){
  const ctx=await browser.newContext({viewport:{width:1400,height:950},colorScheme:scheme});const page=await openAt(ctx,origin,null);
  await page.locator("#sample-button").click();await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();await settle(page);
  for(const id of IDS){
   const el=page.locator(id);if(!(await el.count()))continue;
   // keyboard-originated focus: focus previous element then Tab
   await page.evaluate(id=>{const t=document.querySelector(id);const all=[...document.querySelectorAll("button,input,textarea,select,[tabindex='0']")].filter(e=>!e.disabled&&e.offsetParent);const i=all.indexOf(t);(all[i-1]||document.body).focus();},id);
   await page.keyboard.press("Tab");await settle(page);
   const info=await page.evaluate(id=>{const e=document.activeElement,cs=getComputedStyle(e);return {wanted:id,active:"#"+e.id,fv:e.matches(":focus-visible"),outline:cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor+" off "+cs.outlineOffset,shadow:cs.boxShadow};},id);
   const box=await page.locator(info.active).boundingBox().catch(()=>null);
   if(box){const f=scheme+"-"+id.slice(1)+".png";await page.screenshot({path:path.join(OUT,f),clip:{x:Math.max(0,box.x-12),y:Math.max(0,box.y-12),width:Math.min(box.width+24,400),height:Math.min(box.height+24,200)}});info.file=f;}
   res.push({scheme,...info});
  }
  await ctx.close();}}
 finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.resolve(__dirname,"../ev/runs/focus.json"),JSON.stringify(res,null,1));
 for(const r of res)console.log(r.scheme,r.wanted,r.active,r.fv,r.outline,"|",r.shadow.slice(0,80));
})().catch(e=>{console.error(e);process.exitCode=1;});
