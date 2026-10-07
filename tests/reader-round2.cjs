"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {execFileSync}=require("node:child_process");
const {settle,noCollisions,cleared}=require("./reader-smoke.cjs");
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
const layouts=[[390,844,false],[390,600,false],[844,390,false],[1400,950,false],
 [1708,950,false],[1920,1080,false],[996,950,true],[1400,950,true],[390,844,true]];
async function prepare(page,token,cfg={}) {
 await page.bringToFront();
 await page.evaluate(({token,cfg})=>{
  pause();switchTab("paste");hideSourceReview();state.focusLetter=cfg.letter??true;
  state.contextWords=cfg.context??true;state.wordSize=cfg.size??"large";
  state.focusMode=cfg.focus??false;document.body.classList.toggle("focus-mode",state.focusMode);
  state.wpm=100;state.smartPacing=false;state.sentencePause=false;state.commaPause=false;state.paragraphPause=false;
  loadText("Lead "+token+(cfg.final?"":" Tail End."),"Reader fixture","Reader fixture");seekTo(cfg.index??1);
  window.scrollTo(0,0);
 },{token,cfg});await page.evaluate(()=>document.fonts.ready);await settle(page);await settle(page);
}
async function measure(page) {
 return page.evaluate(()=>{
  const d=els.wordDisplay,f=d.closest(".reader-frame");
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,bottom:r.bottom};};
  const area={clientWidth:d.clientWidth,scrollWidth:d.scrollWidth,clientHeight:d.clientHeight,scrollHeight:d.scrollHeight,scrollTop:d.scrollTop};
  const scrolling=d.classList.contains("scrolling-long-word"),wrapped=d.classList.contains("wrapped-long-word");
  const word=rect(d),frame={...rect(f),clientWidth:f.clientWidth,scrollWidth:f.scrollWidth,clientHeight:f.clientHeight,scrollHeight:f.scrollHeight};
  const context=[els.previousContext,els.nextContext].map(e=>({hidden:e.hidden,rect:rect(e)}));
  const note={hidden:els.longTextNote?.hidden??true,rect:els.longTextNote?rect(els.longTextNote):null};
  const scrollTop=d.scrollTop;d.classList.remove("scrolling-long-word");f.classList.remove("scrolling-long-text");
  const naturalHeight=Math.max(d.scrollHeight,d.getBoundingClientRect().height);
  // Independent strip measurement (also works against master and the prior build).
  const center=f.getBoundingClientRect().top+f.clientTop+f.clientHeight/2;
  const bounds=[els.previousContext,els.nextContext].map((e,i)=>{
   const hidden=e.hidden,text=e.textContent;e.hidden=false;e.textContent=state.words[state.index+(i?1:-1)]||"\u00a0";
   const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const ink=range.getBoundingClientRect();
   const b={top:Math.min(r.top,ink.top),bottom:Math.max(r.bottom,ink.bottom)};e.hidden=hidden;e.textContent=text;return b;
  });const threshold=2*Math.min(center-bounds[0].bottom,bounds[1].top-center);
  d.classList.toggle("scrolling-long-word",scrolling);f.classList.toggle("scrolling-long-text",scrolling);d.scrollTop=scrollTop;
  const range=document.createRange();range.selectNodeContents(d);const content=range.getBoundingClientRect();
  const innerLeft=f.getBoundingClientRect().left+f.clientLeft;
  return {word,frame,area,context,note,bounds,threshold,naturalHeight,scrolling,wrapped,font:getComputedStyle(d).fontSize,
   classes:d.className,length:d.textContent.length,contentWidth:content.width,
   ink:{left:content.left,right:content.right,innerLeft,innerRight:innerLeft+f.clientWidth,
    fullyVisible:content.left>=innerLeft&&content.right<=innerLeft+f.clientWidth},
   outerHTML:d.outerHTML,playing:state.playing,index:state.index};
 });
}
function compact(m) {const {outerHTML,...rest}=m;return rest;}
async function baseline(context,origin,root,ref) {
 const page=await context.newPage();
 const blobs=Object.fromEntries(["index.html","app.js","styles.css"].map(f=>["/"+f,execFileSync("git",["show",ref+":"+f],{cwd:root})]));
 await page.route("**/*",async route=>{
  const u=new URL(route.request().url()),key=u.pathname==="/"?"/index.html":u.pathname;
  if(u.origin===origin&&blobs[key])return route.fulfill({response:await route.fetch(),body:blobs[key]});
  return route.continue();
 });await page.goto(origin,{waitUntil:"networkidle"});return page;
}
async function data(page) {
 return page.evaluate(async()=>{
  await copyCurrentWord();const record=JSON.parse(localStorage.getItem(STORAGE_KEY));
  const savedAtType=typeof record.savedAt;delete record.savedAt;
  return {text:els.wordDisplay.textContent,word:currentWord(),words:state.words,index:state.index,sourceText:state.sourceText,
   count:els.wordCount.textContent,position:els.positionLabel.textContent,percent:els.percentLabel.textContent,
   time:els.timeLeft.textContent,slider:[els.progressSlider.max,els.progressSlider.value],clipboard:await navigator.clipboard.readText(),record,savedAtType};
 });
}
async function browserPredicateChecks(page,verify) {
 // Exact boundaries unreachable in CC's rendered fixtures. These execute the real
 // production predicates in Chrome and are distinct from layout assertions.
 for(const [id,args,expected] of [["B2",[10,342,342],false],["B3/B5",[11,1000,342],false],
  ["B1/B4",[10,343,342],true]])await verify("W6 browser predicate "+id,async()=>{
   assert.equal(await page.evaluate(a=>shouldBreakWord(...a),args),expected);
  });
 for(const [id,args,expected] of [["S1",[true,278,278],false],["S2",[false,1000,278],false],
  ["S3",[true,278.01,278],true]])await verify("W6 browser predicate "+id,async()=>{
   assert.equal(await page.evaluate(a=>shouldScrollWord(...a),args),expected);
  });
}
async function round2Checks({page,context,origin,root,out,verify}) {
 const master=await baseline(context,origin,root,"master"),before=await baseline(context,origin,root,"fc98d1e");
 const evidence={master:"b9d3d9e",before:"fc98d1e",matrix:[],controls:[],data:[],play:[],preservation:[]};
 let flatBackground=false;
 // Isolate token pixels from Chrome's history-dependent dithering of the unchanged
 // translucent frame gradients. Actual production backgrounds are used by geometry,
 // collision, data and interaction checks. No product stylesheet is changed.
 const identityRoutes=new Map();
 for(const [p,css] of [[master,execFileSync("git",["show","master:styles.css"],{cwd:root})],
  [page,fs.readFileSync(path.join(root,"styles.css"))]]) {
  const handler=async route=>{
   if(!flatBackground)return route.fallback();
   return route.fulfill({response:await route.fetch(),body:css.toString()+"\n.reader-frame { background: #fffdfa; }\n"});
  };identityRoutes.set(p,handler);await p.route("**/styles.css",handler);
 }
 const errors=[];for(const p of [master,before])p.on("pageerror",e=>errors.push(e.message));
 try {
  for(const [width,height,focus] of layouts) {
   const viewport={width,height};for(const p of [page,master,before])await p.setViewportSize(viewport);
   for(const contextWords of [true,false])for(const letter of [true,false]) {
    const cfg={focus,context:contextWords,letter},label=JSON.stringify({width,height,...cfg});
    await verify("W6.7 boundary and no collisions "+label,async()=>{
     let low=1,high=10000;
     while(low<high) {
      const mid=Math.floor((low+high)/2);await prepare(page,"W".repeat(mid),cfg);
      if((await measure(page)).scrolling)high=mid;else low=mid+1;
     }
     const row={viewport,cfg,firstScrollLength:low,samples:[]};
     for(const length of [low-1,low,2000,10000]) {
      const token="W".repeat(length);await prepare(before,token,cfg);const old=await measure(before);
      await prepare(page,token,cfg);const m=await measure(page);
      assert.equal(m.scrolling,m.wrapped&&m.naturalHeight>m.threshold);
      if(length===low-1)assert(m.wrapped&&!m.scrolling);
      if(length===low)assert(m.scrolling);
      assert.equal(m.frame.scrollWidth,m.frame.clientWidth);assert.equal(m.frame.scrollHeight,m.frame.clientHeight);
      await noCollisions(page);
      if(m.scrolling)assert(m.area.clientHeight>=31.5,"STOP: fewer than three lines");
      row.samples.push({length,before:compact(old),after:compact(m)});
     }evidence.matrix.push(row);
     if(contextWords&&letter&&[390,1920].includes(width)&&!focus&&height!==600)
      await page.screenshot({path:path.join(out,"round2-normal-"+width+".png"),fullPage:true});
    });
    await verify("W6.12 fitting and master identity "+label,async()=>{
     flatBackground=true;
     for(const token of ["Hello",REAL,"W".repeat(135),"W".repeat(2000),REAL.repeat(45)]) {
      // Equal initial document/capture history on both sides. Chrome's prior full-page
      // capture/scroll history can change frame rasterisation even on unchanged master.
      await master.reload();await page.reload();
      await prepare(master,token,cfg);const old=await measure(master);
      await prepare(page,token,cfg);const m=await measure(page);
      assert(m.ink.fullyVisible,"clipped frame "+JSON.stringify(compact(m)));
      const fitsMaster=old.ink.fullyVisible;
      if(fitsMaster) {
       // CSSOM leaves an empty style attribute after a previously fitted token;
       // the baseline and candidate have different preceding long-token histories.
       assert.equal(m.outerHTML.replace(' style=""',''),old.outerHTML.replace(' style=""',''),"STOP: master-fitting token DOM changed");
       for(const key of ["word","frame","context","font","classes"])assert.deepEqual(m[key],old[key],"STOP: master-fitting token "+key);
       const shot=async(p,r)=>{await p.bringToFront();await p.evaluate(()=>window.scrollTo(0,0));await settle(p);
        return p.screenshot({clip:{x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)}});};
       const a=await shot(master,old.frame),b=await shot(page,m.frame);
       if(!a.equals(b)) {
        fs.writeFileSync(path.join(out,"identity-master.png"),a);fs.writeFileSync(path.join(out,"identity-candidate.png"),b);
        fs.writeFileSync(path.join(out,"identity-mismatch.json"),JSON.stringify({viewport,cfg,token,before:compact(old),after:compact(m)},null,2));
       }
       assert(a.equals(b),"STOP: master-fitting token pixels differ: "+token);
       evidence.controls.push({viewport,cfg,length:token.length,byteIdentical:true,differingPixels:0,background:"flat test backdrop"});
      }else evidence.controls.push({viewport,cfg,length:token.length,masterClipped:true,after:compact(m)});
     }flatBackground=false;
    });
    await verify("W6 whole word data and resume "+label,async()=>{
     // Real paste/review UI, including the clipboard and all 13 v1 fields.
     const token="W".repeat(2000);
     for(const p of [master,page]) {
      await prepare(p,"Hello",{...cfg,focus:false});await p.locator("#text-input").fill("Lead "+token+" Tail End.");
      await p.locator("#load-text-button").click();await p.locator("#apply-source-button").click();
      await p.locator("#review-back-button").click();await p.locator("#next-button").click();await settle(p);
      if(cfg.focus) {await p.locator("#focus-mode-button").click();await settle(p);}
     }
     assert.deepEqual(await data(page),await data(master));
     for(const p of [master,page]) {await p.reload();await p.locator("#resume-button").click();await settle(p);}
     assert.deepEqual(await data(page),await data(master));
     evidence.data.push({viewport,cfg,length:2000,pasteNext:true,resume:true,fields:13,savedAt:"number; clock values excluded"});
    });
   }
  }
  await page.setViewportSize({width:390,height:844});
  for(const arrival of ["auto","next","previous","seek","resume"])await verify("W6.9 one Play from "+arrival,async()=>{
   const token="W".repeat(10000);await prepare(page,token,{index:arrival==="previous"?2:0});
   if(arrival==="auto") {await page.evaluate(()=>startReading());await page.waitForFunction(()=>state.index===1&&!state.playing);}
   if(arrival==="next")await page.locator("#next-button").click();
   if(arrival==="previous")await page.locator("#prev-button").click();
   if(arrival==="seek")await page.locator("#progress-slider").evaluate(el=>{el.value=1;el.dispatchEvent(new Event("input",{bubbles:true}));});
   if(arrival==="resume") {await page.evaluate(()=>seekTo(1));await page.reload();await page.locator("#resume-button").click();}
   await settle(page);assert.equal(await page.evaluate(()=>state.index),1);assert((await measure(page)).scrolling);
   assert.notEqual(await page.evaluate(()=>document.activeElement.id),"word-display","no auto-focus");
   await page.locator("#play-button").click();assert.equal(await page.evaluate(()=>state.index),2);
   for(const n of [3,2,1])await page.waitForFunction(n=>state.countdownValue===n,n);
   await page.waitForFunction(()=>state.playing&&state.index===2);await page.evaluate(()=>pause());await cleared(page);
   evidence.play.push({arrival,onePress:true,countdown:[3,2,1],index:2});
  });
  await verify("W6.9 final finish and restart equals master",async()=>{
   await master.setViewportSize({width:390,height:844});
   for(const p of [master,page]) {await prepare(p,REAL,{final:true});await p.evaluate(()=>completeReading());}
   const finish=p=>p.evaluate(()=>({finished:state.finished,index:state.index,playing:state.playing,countdown:state.countdownActive,
    status:els.status.textContent,summary:els.finishSummary.outerHTML,controls:els.playButton.outerHTML}));
   const normal=await finish(master);
   await prepare(page,"W".repeat(10000),{final:true,index:0});await page.evaluate(()=>startReading());
   await page.waitForFunction(()=>state.index===1&&!state.playing);await page.locator("#play-button").click();await settle(page);
   assert.deepEqual(await finish(page),normal);await require("./reader-finished.cjs").finishedInert(page);
   for(const p of [master,page])await p.locator("#play-button").click();
   for(const p of [master,page]) {assert.equal(await p.evaluate(()=>state.index),0);assert.equal(await p.evaluate(()=>state.countdownValue),3);await p.evaluate(()=>pause());}
   evidence.play.push({arrival:"final",finishEqualsMaster:true,restartCountdown:true});
  });
  await verify("W6.10 native Space scroll and external toggle; no auto-focus",async()=>{
   await prepare(page,"W".repeat(10000));assert.notEqual(await page.evaluate(()=>document.activeElement.id),"word-display");
   await page.locator("#word-display").focus();await page.keyboard.press("Space");await page.waitForFunction(()=>els.wordDisplay.scrollTop>0);
   assert.equal(await page.evaluate(()=>state.index),1);assert.equal(await page.evaluate(()=>state.playing||state.countdownActive),false);
   await page.locator("#play-button").focus();await page.keyboard.press("Space");assert.equal(await page.evaluate(()=>state.index),2);
   assert.equal(await page.evaluate(()=>state.countdownActive),true);await page.keyboard.press("Space");assert.equal(await page.evaluate(()=>state.countdownActive),false);
  });
  await verify("W6 focus and scroll preservation on persistent region",async()=>{
   await prepare(page,"W".repeat(10000));await page.locator("#word-display").focus();await page.locator("#word-display").evaluate(el=>{el.scrollTop=300;});
   const actions=[
    ["resize 1400",()=>page.setViewportSize({width:1400,height:950})],
    ["resize 390",()=>page.setViewportSize({width:390,height:844})],
    ["same index seek",()=>page.evaluate(()=>seekTo(state.index))],
    ["copy",()=>page.evaluate(()=>copyCurrentWord())],
    ["focus letter off",()=>page.evaluate(()=>{state.focusLetter=false;render();saveSession();})],
    ["context off",()=>page.evaluate(()=>{state.contextWords=false;render();saveSession();})],
    ["focus mode",()=>page.evaluate(()=>toggleFocusMode())],
    ["word size",()=>page.evaluate(()=>setWordSize("compact"))],
    ["pacing",()=>page.evaluate(()=>{state.smartPacing=true;render();saveSession();})]
   ];
   for(const [action,run] of actions) {
    const offset=await page.locator("#word-display").evaluate(el=>el.scrollTop);await run();await settle(page);
    const m=await measure(page);assert(m.scrolling);assert.equal(await page.evaluate(()=>document.activeElement.id),"word-display",action);
    assert.equal(m.area.scrollTop,Math.min(offset,m.area.scrollHeight-m.area.clientHeight),action);evidence.preservation.push({action,offset,after:m.area.scrollTop,focused:true});
   }
   await page.screenshot({path:path.join(out,"round2-phone-scroll.png"),fullPage:true});
  });
  assert.equal(errors.length,0);
  fs.writeFileSync(path.join(out,"reader-round2.json"),JSON.stringify(evidence,null,2)+"\n");
 }finally{
  await page.unroute("**/styles.css",identityRoutes.get(page));
  await page.evaluate(()=>{pause();state.focusMode=false;document.body.classList.remove("focus-mode");render();});
  await master.close();await before.close();
 }
}
module.exports={round2Checks,browserPredicateChecks,prepare,measure,baseline};
