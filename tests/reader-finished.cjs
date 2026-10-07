"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {execFileSync}=require("node:child_process");
const {baseline,prepare}=require("./reader-round2.cjs"),{settle:frames}=require("./reader-smoke.cjs");
// Chrome throttles inactive tabs' animation frames. This suite compares visible layouts.
async function settle(page){await page.bringToFront();await frames(page);}
const layouts=[[390,844,false],[390,600,false],[844,390,false],[1400,950,false],
 [1708,950,false],[1920,1080,false],[996,950,true],[1400,950,true],[390,844,true]];
const tokens=["understanding.","kommunikasjon.","Kommune","here.","Tail",
 "Pneumonoultramicroscopicsilicovolcanoconiosis","W".repeat(135),"W".repeat(2000)];
async function finishedSnapshot(page) {
 return page.evaluate(()=>{
  const d=els.wordDisplay,f=d.closest(".reader-frame"),panel=els.finishSummary;
  const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
  const word=rect(d),frame=rect(f),range=document.createRange();range.selectNodeContents(d);
  const text=rect({getBoundingClientRect:()=>range.getBoundingClientRect()});
  const inner={left:frame.left+f.clientLeft,top:frame.top+f.clientTop};
  inner.right=inner.left+f.clientWidth;inner.bottom=inner.top+f.clientHeight;
  const scrolling=d.classList.contains("scrolling-long-word");
  // Natural content extends below a scroll/clip area. Test its painted aperture separately.
  const visible=scrolling?{left:Math.max(word.left,text.left),right:Math.min(word.right,text.right),
   top:Math.max(word.top,text.top),bottom:Math.min(word.bottom,text.bottom)}:text;
  const inside=r=>r.left>=inner.left-.001&&r.right<=inner.right+.001&&r.top>=inner.top-.001&&r.bottom<=inner.bottom+.001;
  const style=getComputedStyle(d),renderStyle=Object.fromEntries(["fontFamily","fontWeight","fontStyle","color","lineHeight","letterSpacing"].map(k=>[k,style[k]]));
  return {font:style.fontSize,renderStyle,classes:d.className,outerHTML:d.outerHTML,text,word,inner,visible,
   fullyVisible:inside(text),paintInside:inside(visible)&&(!scrolling||inside(word)),scrolling,
   overflow:getComputedStyle(d).overflow,inert:d.inert,tabindex:d.getAttribute("tabindex"),role:d.getAttribute("role"),
   label:d.getAttribute("aria-label"),description:d.getAttribute("aria-describedby"),marker:d.dataset.longTextPaused??null,
   scrollTop:d.scrollTop,clientHeight:d.clientHeight,scrollHeight:d.scrollHeight,
   noteHidden:els.longTextNote?.hidden??true,finished:state.finished,playing:state.playing,countdown:state.countdownActive,
   status:els.status.textContent,index:state.index,wordText:d.textContent,frame,
   panel:rect(panel),panelHidden:panel.hidden,panelZ:getComputedStyle(panel).zIndex,
   finishPauseCalls:window.__finishPauseCalls??0};
 });
}
async function finishedInert(page) {
 const m=await finishedSnapshot(page);
 assert(m.finished&&!m.playing&&!m.countdown&&m.noteHidden);assert.equal(m.status,"Finished");
 assert.equal(m.marker,null);assert.equal(m.tabindex,null);assert.equal(m.role,null);
 assert.equal(m.label,null);assert.equal(m.description,null);assert.equal(m.finishPauseCalls,0,"finished screen auto-paused");
 if(m.scrolling){assert(m.inert);assert.equal(m.overflow,"clip");}
 return m;
}
async function orderCheck(page) {
 assert(await page.evaluate(()=>{
  const d=els.wordDisplay,panel=els.finishSummary,box=d.getBoundingClientRect();
  // Remove hit-test suppression only while querying paint order; immediately restore it.
  const inert=d.inert,pointer=d.style.pointerEvents;d.inert=false;d.style.pointerEvents="auto";
  try {
   return [panel,...document.querySelectorAll("button,input,select,textarea")].filter(e=>{
    const r=e.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(e).visibility!=="hidden";
   }).every(e=>{
    const r=e.getBoundingClientRect(),left=Math.max(box.left,r.left),right=Math.min(box.right,r.right),
     top=Math.max(box.top,r.top),bottom=Math.min(box.bottom,r.bottom);
    if(left>=right||top>=bottom)return true;
    const stack=document.elementsFromPoint((left+right)/2,(top+bottom)/2);
    const wordIndex=stack.findIndex(x=>x===d||d.contains(x)),controlIndex=stack.findIndex(x=>x===e||e.contains(x));
    return wordIndex<0||(controlIndex>=0&&controlIndex<wordIndex);
   });
  } finally {d.inert=inert;d.style.pointerEvents=pointer;if(!d.getAttribute("style"))d.removeAttribute("style");}
 }),"STOP: finished word above panel/control");
}
async function inertInputs(page,m) {
 if(!m.scrolling)return;
 // A full Tab cycle skips the area, even though it retains its scroll geometry.
 await page.locator("#play-button").focus();
 for(let i=0;i<40;i++) {await page.keyboard.press("Tab");assert.notEqual(await page.evaluate(()=>document.activeElement.id),"word-display");}
 await page.locator("#word-display").evaluate(el=>el.focus());
 assert.notEqual(await page.evaluate(()=>document.activeElement.id),"word-display");
 await page.locator("#play-button").focus();
 const y=Math.max(1,Math.min(m.word.bottom-5,await page.evaluate(()=>innerHeight-5)));
 await page.mouse.move((m.word.left+m.word.right)/2,y);await page.mouse.wheel(0,300);await settle(page);
 assert.equal(await page.evaluate(()=>els.wordDisplay.scrollTop),m.scrollTop,"finished wheel scroll");
 await page.locator("#word-display").evaluate(el=>{el.scrollTop=300;});
 assert.equal(await page.evaluate(()=>els.wordDisplay.scrollTop),m.scrollTop,"finished clip must not scroll programmatically");
}
async function restartState(page,button) {
 return page.evaluate(button=>{
  document.querySelector(button).click();
  const d=els.wordDisplay,r=d.getBoundingClientRect();
  return {index:state.index,finished:state.finished,playing:state.playing,countdown:state.countdownActive,
  countdownValue:state.countdownValue,status:els.status.textContent,
  // CC O-1: fitting leaves an empty CSSOM style attribute after clearing the font.
  // It also reproduces on the starting head. Normalize only that empty attribute.
  word:d.outerHTML.replace(' style=""',''),font:getComputedStyle(d).fontSize,
  rectangle:{left:r.left,top:r.top,width:r.width,height:r.height},
  panelHidden:els.finishSummary.hidden,play:els.playButton.outerHTML};
 },button);
}
async function compareRestart(master,page) {
 // Candidate-only focus/wheel inertness probes can scroll the document. Compare
 // restart at equal page scroll positions, without changing the word's scroll area.
 for(const p of [master,page])await p.evaluate(()=>window.scrollTo(0,0));
 for(const button of ["#finish-restart-button","#play-button"]) {
  // Capture immediately in each real click handler's task. Sequential Playwright
  // actionability waits can let one page finish its countdown before the other clicks.
  const [a,b]=await Promise.all([restartState(master,button),restartState(page,button)]);
  assert.deepEqual(b,a,"STOP: restart differs from master");
  assert.equal(b.index,0);assert.equal(b.finished,false);
  if(button==="#play-button"){assert(b.countdown);assert.equal(b.countdownValue,3);}
  for(const p of [master,page])await p.evaluate(()=>{pause();seekTo(state.words.length-1);completeReading();});
  for(const p of [master,page])await settle(p);
 }
}
async function finishedBatch({context,origin,root,out,verify,selected}) {
 const master=await baseline(context,origin,root,"master"),page=await context.newPage(),before=await baseline(context,origin,root,"8ae3d54");
 const evidence={direct:[],natural:[],restoration:[],errors:[],uploads:0};
 let flat=false;
 for(const [p,css]of [[master,execFileSync("git",["show","master:styles.css"],{cwd:root})],[page,fs.readFileSync(path.join(root,"styles.css"))]])
  await p.route("**/styles.css",async route=>flat?route.fulfill({response:await route.fetch(),
   body:css.toString()+"\n.reader-frame { background: #fffdfa; }\n.finish-summary { box-shadow: none; }\n"}):route.fallback());
 for(const p of [master,page,before]){
  p.on("pageerror",e=>evidence.errors.push(e.message));
  p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR_FAILED/.test(m.text()))evidence.errors.push(m.text());});
  p.on("request",r=>{if(r.method()==="POST")evidence.uploads++;});
 }
 const save=()=>fs.writeFileSync(path.join(out,"reader-finished.json"),JSON.stringify(evidence,null,2)+"\n");
 async function setup(p,token,cfg,index) {
  await p.reload({waitUntil:"networkidle"});await prepare(p,token,{...cfg,final:true,index});
  await p.evaluate(()=>{window.__finishPauseCalls=0;const original=pause;pause=function(){if(state.finished)window.__finishPauseCalls++;return original();};});
 }
 async function compare(token,cfg,viewport,kind,reading) {
  const a=await finishedSnapshot(master),b=await finishedInert(page);
  assert(b.paintInside,"STOP: painted last word outside inner frame");assert.equal(b.wordText,token);
  for(const key of ["frame","panel","panelHidden"])assert.deepEqual(b[key],a[key]);
  if(a.fullyVisible)for(const key of ["font","renderStyle","classes","outerHTML","word","text"])
   assert.deepEqual(b[key],a[key],"STOP: master-visible finished word changed: "+key);
  if(reading.scrolling){assert(b.scrolling);assert.deepEqual(b.word,reading.word,"scroll geometry changed on finish");}
  await orderCheck(page);await inertInputs(page,b);
  const row={viewport,cfg,token:token.length>45?"W x "+token.length:token,master:a,after:b,reading};
  if(kind==="direct"&&a.fullyVisible) {
   // Compare every pixel in the full text Range, including its ascent/descent.
   // Whole-frame captures can dither the unchanged centre rail outside this word.
   const clip={x:Math.floor(a.text.left),y:Math.floor(a.text.top),
    width:Math.ceil(a.text.right)-Math.floor(a.text.left),height:Math.ceil(a.text.bottom)-Math.floor(a.text.top)};
   const shot=async p=>{await p.bringToFront();await p.evaluate(()=>window.scrollTo(0,0));await settle(p);return p.screenshot({clip});};
   const captureState=[await finishedSnapshot(master),await finishedSnapshot(page)];
   let left=await shot(master),right=await shot(page);
   if(!left.equals(right)) {
    // Chrome occasionally varies translucent compositing between captures even
    // with unchanged DOM/font/geometry. Require an exact second pair; no tolerance.
    const name=[viewport.width,viewport.height,cfg.focus,cfg.context,cfg.size,row.token].join("-").replace(/[^a-z0-9.-]/gi,"_");
    const firstMaster="recapture-"+name+"-master.png",firstCandidate="recapture-"+name+"-candidate.png";
    fs.writeFileSync(path.join(out,firstMaster),left);fs.writeFileSync(path.join(out,firstCandidate),right);
    for(const [i,p]of [master,page].entries()) {
     await settle(p);const current=await finishedSnapshot(p);
     for(const key of ["font","renderStyle","classes","outerHTML","word","text"])
      assert.deepEqual(current[key],captureState[i][key],"STOP: word changed between pixel captures");
    }
    left=await shot(master);right=await shot(page);
    row.pixelRecapture={firstMaster,firstCandidate,domAndGeometryUnchanged:true};
   }
   if(!left.equals(right)){fs.writeFileSync(path.join(out,"finish-master-mismatch.png"),left);fs.writeFileSync(path.join(out,"finish-candidate-mismatch.png"),right);}
   assert(left.equals(right),"STOP: master-visible finished word pixels changed");row.pixelIdentical=true;row.pixelClip=clip;
   row.pixelBackdrop="test-only flat frame and no panel shadow";
  }
  if(viewport.width===390&&viewport.height===844&&!cfg.focus&&cfg.context&&cfg.size==="comfortable"&&kind==="natural"
   &&["understanding.","kommunikasjon.","W".repeat(2000)].includes(token)) {
   const name=token.length>45?"W2000":token.replace(/\W/g,"");
   await setup(before,token,cfg,1);await before.evaluate(()=>completeReading());await settle(before);
   row.before=await finishedSnapshot(before);
   for(const [label,p] of [["master",master],["before",before],["after",page]]){
    await p.evaluate(()=>window.scrollTo(0,0));await p.locator(".reader-frame").screenshot({path:path.join(out,"finish-390-"+name+"-"+label+".png")});
   }
  }
  await compareRestart(master,page);row.restartEqualsMaster=true;evidence[kind].push(row);
 }
 try {
  await page.goto(origin,{waitUntil:"networkidle"});
  for(const [width,height,focus]of selected)for(const contextWords of [true,false])for(const size of ["comfortable","large"]) {
   const viewport={width,height},cfg={focus,context:contextWords,size};
   for(const p of [master,page,before])await p.setViewportSize(viewport);
   for(const token of tokens) {
    const label=JSON.stringify({width,height,...cfg,token:token.length>45?"W"+token.length:token});
    await verify("W6.14 finished master comparison "+label,async()=>{
     flat=true;
     for(const p of [master,page])await setup(p,token,cfg,1);
     const reading=await finishedSnapshot(page);
     for(const p of [master,page])await p.evaluate(()=>completeReading());
     for(const p of [master,page]){await settle(p);await settle(p);}
     await compare(token,cfg,viewport,"direct",reading);
    });
    await verify("W6.14 natural playback and finished restart "+label,async()=>{
     flat=false;
     for(const p of [master,page])await setup(p,token,cfg,0);
     const playToEnd=async p=>{
      await p.locator("#wpm-slider").evaluate(el=>{el.value="900";el.dispatchEvent(new Event("input",{bubbles:true}));});
      await p.locator("#play-button").click();
      await p.waitForFunction(()=>state.finished||(!state.countdownActive&&!state.playing&&state.index===state.words.length-1
       &&els.wordDisplay.classList.contains("scrolling-long-word")),null,{timeout:15000});
      const last=await finishedSnapshot(p);
      if(!last.finished){await p.locator("#play-button").click();await p.waitForFunction(()=>state.finished);}
      await settle(p);await settle(p);return last;
     };
     const [,reading]=await Promise.all([playToEnd(master),playToEnd(page)]);
     await compare(token,cfg,viewport,"natural",reading);
    });
   }
   await verify("W6.14 region restored only on leaving Finished "+JSON.stringify({viewport,cfg}),async()=>{
    for(const action of ["seek","load","restart"]){
     await setup(page,"W".repeat(2000),cfg,1);const reading=await finishedSnapshot(page);
     await page.evaluate(()=>completeReading());await settle(page);await finishedInert(page);
     await page.evaluate(action=>{if(action==="seek")seekTo(state.index);else if(action==="load")loadText("Lead "+"W".repeat(2000),"Reader fixture","Reader fixture");else els.finishRestartButton.click();},action);
     await settle(page);assert.equal(await page.evaluate(()=>els.wordDisplay.inert),false);
     if(action!=="seek") {await page.evaluate(()=>seekTo(1));await settle(page);}
     const returned=await finishedSnapshot(page);assert.equal(returned.scrolling,reading.scrolling);
     if(reading.scrolling){assert.equal(returned.role,"region");assert.equal(returned.tabindex,"0");assert.equal(returned.description,"long-text-note");assert.equal(returned.noteHidden,false);}
     evidence.restoration.push({viewport,cfg,action,scrolling:reading.scrolling});
    }
   });
   console.log("Finished matrix: "+evidence.direct.length+" direct / "+evidence.natural.length+" natural");
  }
  assert.equal(evidence.errors.length,0);assert.equal(evidence.uploads,0);save();
 }finally{await page.close();await master.close();await before.close();}
 return evidence;
}
async function finishedChecks(args) {
 // Each independent layout group gets its own storage and pages. Tests and timers
 // use the unchanged production code; only scheduling across groups is parallel.
 const contexts=[],batches=[],blocked=[];
 try {
  for(let i=0;i<4;i++) {
   const context=await args.context.browser().newContext({permissions:["clipboard-read","clipboard-write"]});contexts.push(context);
   const out=path.join(args.out,"finished-"+i);fs.mkdirSync(out,{recursive:true});
   await context.route("**/*",route=>{
    if(new URL(route.request().url()).origin===args.origin)return route.continue();
    blocked.push(new URL(route.request().url()).origin);
    return route.abort();
   });
   batches.push(finishedBatch({...args,context,out,selected:layouts.filter((_,n)=>n%4===i)}));
  }
  const parts=await Promise.all(batches),evidence={direct:[],natural:[],restoration:[],errors:[],uploads:0,contexts:4,blocked};
  assert.equal(blocked.length,0,"unexpected external origin in finished matrix");
  for(let i=0;i<parts.length;i++) {
   for(const key of ["direct","natural","restoration","errors"])evidence[key].push(...parts[i][key]);
   evidence.uploads+=parts[i].uploads;
   for(const file of fs.readdirSync(path.join(args.out,"finished-"+i)))if(file.endsWith(".png"))
    fs.copyFileSync(path.join(args.out,"finished-"+i,file),path.join(args.out,file));
  }
  const key=r=>JSON.stringify([r.viewport,r.cfg,r.token??r.action]);
  for(const k of ["direct","natural","restoration"])evidence[k].sort((a,b)=>key(a).localeCompare(key(b)));
  fs.writeFileSync(path.join(args.out,"reader-finished.json"),JSON.stringify(evidence,null,2)+"\n");
 }finally{for(const context of contexts)await context.close();}
}
module.exports={finishedChecks,finishedInert,finishedSnapshot};
