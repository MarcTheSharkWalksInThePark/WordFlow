"use strict";
// Independent spec checks: storage, CSP, SVG, contrast, accessibility, selectors, texts.
const fs=require("node:fs"),path=require("node:path"),http=require("node:http"),{execFileSync}=require("node:child_process");
const {CLONE,start,stop,launch,openAt,settle,blobsAt}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev/runs");
const NOTE="Long text paused — scroll to read, then press play.";
const PRIVACY="Files are read in your browser and never uploaded. Links you load are fetched through WordFlow's proxy on Cloudflare. Cloudflare and the website you load can see the request, including your IP address. If the proxy fails, your browser contacts the website directly. Nothing is stored except your own resume session in this browser.";
const TICKER="Press Space to play or pause. Use the arrow keys to step one word. Press F for fullscreen.";
const FALLBACK="Fullscreen isn't available in this browser; focus mode is on instead.";
const contrastFn=()=>{
 const parse=c=>{
  let m=c.match(/rgba?\(([^)]+)\)/);
  if(m){const v=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return [v[0],v[1],v[2],v.length>3?v[3]:1];}
  m=c.match(/color\(srgb ([^)]+)\)/);
  if(m){const v=m[1].split(/[ \/]+/).filter(Boolean).map(Number);return [v[0]*255,v[1]*255,v[2]*255,v.length>3?v[3]:1];}
  return null;
 };
 const colorsIn=s=>(s.match(/(rgba?\([^)]*\)|color\(srgb [^)]*\))/g)||[]).map(parse).filter(Boolean);
 const over=(top,bot)=>{const a=top[3];return [top[0]*a+bot[0]*(1-a),top[1]*a+bot[1]*(1-a),top[2]*a+bot[2]*(1-a),1];};
 const lum=c=>{const l=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*l[0]+.7152*l[1]+.0722*l[2];};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 // Background candidates: walk up; collect layers until an opaque layer is found.
 const backgrounds=el=>{
  const layers=[];
  for(let e=el;e;e=e.parentElement){
   const cs=getComputedStyle(e),bg=parse(cs.backgroundColor),img=cs.backgroundImage!=="none"?colorsIn(cs.backgroundImage):[];
   const opts=[...img];if(bg&&bg[3]>0)opts.push(bg);
   if(opts.length){layers.push(opts);if(opts.some(c=>c[3]>=1)&&(!img.length||img.every(c=>c[3]>=1)||bg&&bg[3]>=1))break;}
  }
  let acc=[[255,255,255,1]];
  for(const opts of layers.reverse()){const next=[];for(const b of acc)for(const o of opts)next.push(over(o,b));acc=next;}
  return acc;
 };
 return (selector,label)=>{
  const el=document.querySelector(selector);if(!el)return {label,selector,missing:true};
  const cs=getComputedStyle(el);const fg=parse(cs.color);const bgs=backgrounds(el);
  const rs=bgs.map(b=>ratio(over(fg,b),b));
  return {label,selector,color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight,min:Math.min(...rs),max:Math.max(...rs),nBg:bgs.length};
 };
};
const SAMPLES=[["body text",".toggle-row"],["textarea","#text-input"],["muted tagline",".tagline"],["muted status","#reader-status"],["muted field label",".field-label"],
 ["muted privacy",".privacy-note"],["muted stats caption",".quick-stats small"],["progress meta",".progress-meta"],["panel head h2",".panel-heading h2"],
 ["legend (link colour)","legend"],["gel primary","#theme-button"],["gel active tab",".tab.active"],["inactive tab","#tab-file"],["chrome button","#fullscreen-button"],
 ["subtle button","#sample-button"],["LCD wpm","#reader-wpm"],["LCD words","#word-count"],["LCD time","#time-left"],["ticker text",".ticker span"],["ticker TIP",".ticker strong"],
 ["badge left",".badges b"],["badge right",".badges b + b"],["reader word","#word-display"],["focus letter","#word-display .word-focus"],["context word",".context-word.previous"],
 ["now reading",".now-reading"],["reading title","#reading-title"]];
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();
 const res={chrome:browser.version()};
 try{
  // CSP header served locally vs production _headers
  const headers=await new Promise((ok,ko)=>http.get(origin+"/",r=>{r.resume();ok(r.headers);}).on("error",ko));
  const prodCsp=/Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(CLONE,"_headers"),"utf8"))[1].trim();
  res.csp={served:headers["content-security-policy"],production:prodCsp,equal:headers["content-security-policy"]===prodCsp,
   permissions:headers["permissions-policy"]};
  for(const scheme of ["dark","light"]){
   const r=res[scheme]={};
   const ctx=await browser.newContext({viewport:{width:1400,height:950},colorScheme:scheme,permissions:["clipboard-read","clipboard-write"]});
   await ctx.addInitScript(()=>{window.__csp=[];document.addEventListener("securitypolicyviolation",e=>window.__csp.push(e.violatedDirective+" "+e.blockedURI));});
   const page=await ctx.newPage();const errs=[];page.on("pageerror",e=>errs.push(e.message));page.on("console",m=>{if(m.type()==="error"||m.type()==="warning")errs.push(m.type()+": "+m.text());});
   await page.goto(origin,{waitUntil:"networkidle"});await settle(page);
   const keys=()=>page.evaluate(()=>({local:Object.keys(localStorage).sort(),session:Object.keys(sessionStorage).sort(),cookie:document.cookie,localValues:{...localStorage}}));
   r.storage={initial:await keys()};
   await page.locator("#sample-button").click();await page.locator("#apply-source-button").click();await page.locator("#review-back-button").click();await settle(page);
   r.storage.afterLoad=await keys();
   r.themeLabel0=await page.locator("#theme-button").textContent();
   await page.locator("#theme-button").click();await settle(page);
   r.themeLabel1=await page.locator("#theme-button").textContent();r.dataTheme1=await page.evaluate(()=>document.documentElement.dataset.theme);
   r.storage.afterToggle=await keys();
   await page.locator("#theme-button").click();await settle(page);r.themeLabel2=await page.locator("#theme-button").textContent();
   r.storage.afterToggle2=await keys();
   await page.locator("#fullscreen-button").click();
   await page.waitForFunction(()=>document.fullscreenElement===document.querySelector(".reader-panel"),null,{timeout:5000}).catch(()=>{});
   r.fullscreenNative=await page.evaluate(()=>document.fullscreenElement===document.querySelector(".reader-panel"));
   r.storage.inFullscreen=await keys();
   await page.evaluate(()=>document.exitFullscreen&&document.fullscreenElement&&document.exitFullscreen());await settle(page);
   r.storage.afterExit=await keys();
   // idb
   r.indexedDB=await page.evaluate(async()=>indexedDB.databases?(await indexedDB.databases()).map(d=>d.name):"n/a");
   // texts
   r.texts=await page.evaluate(()=>({h1:document.querySelector("h1").getAttribute("aria-label"),tagline:document.querySelector(".tagline").textContent,
    ticker:document.querySelector(".ticker span").textContent,tip:document.querySelector(".ticker strong").textContent,
    badges:[...document.querySelectorAll(".badges > span")].map(s=>[...s.querySelectorAll("b")].map(b=>b.textContent).join(" | ")),
    privacy:document.querySelector(".privacy-note").textContent,note:els.longTextNote.textContent,
    plate:document.querySelector(".brand-plate").textContent,exit:document.querySelector("#fullscreen-exit").textContent,
    hint:[...document.querySelectorAll(".reader-panel *")].map(e=>e.childElementCount===0?e.textContent:"").filter(t=>/Esc exit/.test(t))}));
   r.textChecks={ticker:r.texts.ticker===TICKER,privacy:r.texts.privacy===PRIVACY,note:r.texts.note===NOTE,tagline:r.texts.tagline==="one word at a time"};
   r.h1Name=await page.getByRole("heading",{level:1,name:"WordFlow Reader",exact:true}).count();
   r.a11yH1=await page.locator("h1").evaluate(h=>h.outerHTML);
   r.iconButtons=await page.locator("button").evaluateAll(bs=>bs.filter(b=>!b.textContent.trim()).map(b=>({id:b.id,label:b.getAttribute("aria-label"),title:b.title})));
   r.labelInName=await page.locator("button[aria-label]").evaluateAll(bs=>bs.filter(b=>b.textContent.trim()).map(b=>({id:b.id,text:b.textContent.trim(),label:b.getAttribute("aria-label")})));
   // contrast
   const fn=contrastFn.toString();
   r.contrast=await page.evaluate(({fn,samples})=>{const c=eval("("+fn+")")();return samples.map(([l,s])=>c(s,l));},{fn,samples:SAMPLES});
   // finished screen contrast
   await page.evaluate(()=>{seekTo(state.words.length-1);completeReading();});await settle(page);
   r.contrastFinished=await page.evaluate(({fn})=>{const c=eval("("+fn+")")();return [["finish title",".finish-summary strong"],["finish metric",".finish-metrics span"],["finish button","#finish-restart-button"]].map(([l,s])=>c(s,l));},{fn});
   await page.locator("#finish-restart-button").click();await page.evaluate(()=>pause());
   // focus-visible: tab through first 12 stops
   r.focusRings=[];
   await page.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0);});
   for(let i=0;i<14;i++){await page.keyboard.press("Tab");r.focusRings.push(await page.evaluate(()=>{const e=document.activeElement,cs=getComputedStyle(e);
    return {el:e.id||e.className||e.tagName,fv:e.matches(":focus-visible"),outline:cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor,shadow:cs.boxShadow==="none"?"none":"set"};}));}
   // overflow
   r.overflow=[];
   for(const [w,h] of [[390,844],[390,600],[768,1024],[1400,900],[1400,950],[1708,950],[1920,1080],[320,640]]){await page.setViewportSize({width:w,height:h});await settle(page);
    r.overflow.push({w,h,sw:await page.evaluate(()=>document.documentElement.scrollWidth)});}
   await page.setViewportSize({width:1400,height:950});
   // selectors used by app.js at both SHAs exist in the candidate DOM
   const sels=new Set();
   for(const sha of ["2a37644","51e22d0"]){const src=execFileSync("git",["show",sha+":app.js"],{cwd:CLONE}).toString();for(const m of src.matchAll(/querySelector(?:All)?\("([^"]+)"\)/g))sels.add(m[1]);for(const m of src.matchAll(/getElementById\("([^"]+)"\)/g))sels.add("#"+m[1]);}
   r.selectors=await page.evaluate(sels=>sels.map(s=>[s,document.querySelectorAll(s).length]),[...sels]);
   r.missingSelectors=r.selectors.filter(([,n])=>n===0);
   // SVG
   r.svg=await page.evaluate(async()=>{const t=await (await fetch("/assets/wordflow-mark.svg")).text();const d=new DOMParser().parseFromString(t,"image/svg+xml");
    return {parseError:!!d.querySelector("parsererror"),root:d.documentElement.nodeName,ns:d.documentElement.namespaceURI,
     tags:[...new Set([...d.querySelectorAll("*")].map(e=>e.nodeName))],script:!!d.querySelector("script"),text:!!d.querySelector("text"),
     externalRefs:[...d.querySelectorAll("*")].flatMap(e=>[...e.attributes].filter(a=>/href|src/i.test(a.name)||/url\((?!#)/.test(a.value)).map(a=>a.name+"="+a.value))};});
   r.favicon=await page.evaluate(()=>[...document.querySelectorAll("link[rel~=icon]")].map(l=>l.getAttribute("href")));
   r.cspViolations=await page.evaluate(()=>window.__csp);r.consoleErrors=errs;
   await ctx.close();
  }
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.join(OUT,"spec.json"),JSON.stringify(res,null,1));
 console.log(JSON.stringify(res,null,1).slice(0,200));
})().catch(e=>{console.error(e);process.exitCode=1;});
