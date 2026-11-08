"use strict";
// Corrected WCAG contrast: composite each element's background-color, then its gradient stops,
// from the nearest opaque ancestor down to the text element (worst case over gradient stops).
// Also: horizontal overflow at 320 px on both SHAs.
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const BASE="2a376445ceb1b98a1b4c943cf8834e77e0578120";
const fn=()=>{
 const parse=c=>{let m=c.match(/rgba?\(([^)]+)\)/);if(m){const v=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return [v[0],v[1],v[2],v.length>3?v[3]:1];}
  m=c.match(/color\(srgb ([^)]+)\)/);if(m){const v=m[1].split(/[ \/]+/).filter(Boolean).map(Number);return [v[0]*255,v[1]*255,v[2]*255,v.length>3?v[3]:1];}return null;};
 const stops=s=>(s.match(/(rgba?\([^)]*\)|color\(srgb [^)]*\))/g)||[]).map(parse).filter(Boolean);
 const over=(t,b)=>{const a=t[3];return [t[0]*a+b[0]*(1-a),t[1]*a+b[1]*(1-a),t[2]*a+b[2]*(1-a),1];};
 const lum=c=>{const l=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 return (sel,label)=>{
  const el=document.querySelector(sel);if(!el)return {label,missing:true};
  const chain=[];for(let e=el;e;e=e.parentElement){chain.push(e);const cs=getComputedStyle(e),bg=parse(cs.backgroundColor),im=cs.backgroundImage!=="none"?stops(cs.backgroundImage):[];
   if((bg&&bg[3]>=1)||(im.length&&im.every(c=>c[3]>=1)))break;}
  let acc=[[255,255,255,1]];
  for(const e of chain.reverse()){const cs=getComputedStyle(e),bg=parse(cs.backgroundColor),im=cs.backgroundImage!=="none"?stops(cs.backgroundImage):[];
   if(bg&&bg[3]>0)acc=acc.map(b=>over(bg,b));if(im.length)acc=acc.flatMap(b=>im.map(s=>over(s,b)));}
  const cs=getComputedStyle(el),fg=parse(cs.color),op=Number(cs.opacity);
  const rs=acc.map(b=>ratio(over([fg[0],fg[1],fg[2],fg[3]*op],b),b));
  return {label,sel,color:cs.color,size:cs.fontSize,weight:cs.fontWeight,min:+Math.min(...rs).toFixed(2)};
 };
};
const NORMAL=[["body/panel text",".toggle-row"],["textarea","#text-input"],["muted tagline",".tagline"],["muted status","#reader-status"],["muted field label",".field-label"],
 ["muted privacy",".privacy-note"],["muted LCD caption",".quick-stats small"],["progress meta",".progress-meta"],["panel head h2",".panel-heading h2"],["legend (link)","legend"],
 ["gel primary","#theme-button"],["gel active tab",".tab.active"],["inactive tab","#tab-file"],["chrome button","#fullscreen-button"],["subtle button","#sample-button"],
 ["LCD wpm","#reader-wpm"],["LCD words","#word-count"],["LCD time","#time-left"],["ticker text",".ticker span"],["ticker TIP",".ticker strong"],["badge left",".badges b"],
 ["badge right",".badges b + b"],["reader word","#word-display"],["focus letter","#word-display .word-focus"],["context word",".context-word.previous"],["now reading",".now-reading"]];
const FULL=[["fs title","#reading-title"],["fs position","#fullscreen-position"],["fs exit button","#fullscreen-exit"],["fs LCD","#reader-wpm"],["fs hint",".shortcut-hint"],["fs progress meta",".progress-meta"],["fs word","#word-display"]];
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();const res={};
 try{
  for(const scheme of ["dark","light"]){
   const ctx=await browser.newContext({viewport:{width:1400,height:950},colorScheme:scheme});const page=await openAt(ctx,origin,null);
   await page.locator("#sample-button").click();await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();await page.evaluate(()=>seekTo(4));await settle(page);
   const run=list=>page.evaluate(({f,list})=>{const c=eval("("+f+")")();return list.map(([l,s])=>c(s,l));},{f:fn.toString(),list});
   res[scheme]={normal:await run(NORMAL)};
   await page.locator("#fullscreen-button").click();await page.waitForFunction(()=>document.fullscreenElement);await settle(page);res[scheme].fullscreen=await run(FULL);
   await page.evaluate(()=>document.exitFullscreen());await page.waitForFunction(()=>!document.fullscreenElement);
   await page.evaluate(()=>{seekTo(state.words.length-1);completeReading();});await settle(page);
   res[scheme].finished=await run([["finish title",".finish-summary strong"],["finish metric",".finish-metrics span"],["finish restart","#finish-restart-button"],["finish new source","#finish-new-source-button"]]);
   await ctx.close();
  }
  res.overflow320={};
  for(const [k,sha] of [["base",BASE],["cand",null]]){const ctx=await browser.newContext({viewport:{width:320,height:640}});const p=await openAt(ctx,origin,sha);await settle(p);
   res.overflow320[k]=await p.evaluate(()=>{const W=document.documentElement.clientWidth;const wide=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.right>W+0.5&&r.width>0&&getComputedStyle(e).position!=="absolute";}).slice(0,8).map(e=>(e.id?"#"+e.id:e.className||e.tagName)+":"+Math.round(e.getBoundingClientRect().right));return {scrollWidth:document.documentElement.scrollWidth,clientWidth:W,wide};});
   await p.screenshot({path:path.resolve(__dirname,"../ev/shots/overflow-320-"+k+".png"),fullPage:false});await ctx.close();}
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.resolve(__dirname,"../ev/runs/contrast.json"),JSON.stringify(res,null,1));
 for(const s of ["dark","light"])for(const g of ["normal","fullscreen","finished"])console.log(s,g,res[s][g].map(c=>c.missing?c.label+"=MISSING":c.label+"="+c.min).join("; "));
 console.log("320:",JSON.stringify(res.overflow320));
})().catch(e=>{console.error(e);process.exitCode=1;});
