"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {execFileSync}=require("node:child_process"),assert=require("node:assert/strict");
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
const NOTE="Long text paused — scroll to read, then press play.";
const hash=text=>crypto.createHash("sha256").update(text).digest("hex");
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function prepare(page,token,{index=1,first=false}={}) {
 await page.bringToFront();
 await page.evaluate(({token,index,first})=>{
  switchTab("paste");hideSourceReview();
  state.focusLetter=true;state.contextWords=true;state.focusMode=false;
  document.body.classList.remove("focus-mode");
  state.wpm=100;state.smartPacing=false;state.sentencePause=false;state.commaPause=false;state.paragraphPause=false;
  loadText((first?"":"Lead ")+token+" Tail End.","Reader fixture","Reader fixture");
  setWordSize("large");seekTo(index);
  window.scrollTo(0,0);
 },{token,index,first});
 await settle(page);
}
async function snapshot(page) {
 return page.evaluate(()=>{
  const el=els.wordDisplay,frame=el.closest(".reader-frame");
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  const scrolling=el.classList.contains("scrolling-long-word");
  if(scrolling)el.classList.remove("scrolling-long-word");
  const naturalHeight=Math.max(el.scrollHeight,el.getBoundingClientRect().height);
  if(scrolling)el.classList.add("scrolling-long-word");
  const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();
  const session=JSON.parse(localStorage.getItem(STORAGE_KEY));delete session.savedAt;
  return {word:rect(el),content:{x:r.x,y:r.y,width:r.width,height:r.height},font:getComputedStyle(el).fontSize,
   classes:el.className,text:el.textContent,naturalHeight,wrapped:el.classList.contains("wrapped-long-word"),scrolling,
   frame:{clientWidth:frame.clientWidth,scrollWidth:frame.scrollWidth,clientHeight:frame.clientHeight,scrollHeight:frame.scrollHeight},
   area:{clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop},
   noteHidden:els.longTextNote?.hidden??true,note:els.longTextNote?.textContent??null,
   playing:state.playing,index:state.index,count:state.words.length,wordCount:els.wordCount.textContent,
   position:els.positionLabel.textContent,percent:els.percentLabel.textContent,sourceText:state.sourceText,session};
 });
}
function publicMeasurement(s) {
 const {text,sourceText,session,...dimensions}=s;
 return {...dimensions,textLength:text.length,textSha256:hash(text),sourceSha256:hash(sourceText),sessionSha256:hash(JSON.stringify(session))};
}
function dataSame(a,b) {
 for(const key of ["text","index","count","wordCount","position","percent","sourceText","session"])assert.deepEqual(a[key],b[key],key);
}
async function scrollInputs(page,context) {
 const region=page.getByRole("region",{name:"Long text",exact:true});
 await region.focus();await page.keyboard.press("End");
 await page.waitForFunction(()=>els.wordDisplay.scrollTop+els.wordDisplay.clientHeight===els.wordDisplay.scrollHeight);
 const bottom=await region.evaluate(el=>{
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node,last;while(node=walker.nextNode())last=node;
  const range=document.createRange();range.setStart(last,last.length-1);range.setEnd(last,last.length);
  const glyph=range.getBoundingClientRect(),box=el.getBoundingClientRect();
  return {lastLineVisible:glyph.top>=box.top&&glyph.bottom<=box.bottom,scrollTop:el.scrollTop};
 });assert(bottom.lastLineVisible,"last glyph must be visible inside scroll region");
 await region.evaluate(el=>{el.scrollTop=0;});await page.keyboard.press("PageDown");
 await page.waitForFunction(()=>els.wordDisplay.scrollTop>0);
 await region.evaluate(el=>{el.scrollTop=0;});
 const box=await region.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,300);
 await page.waitForFunction(()=>els.wordDisplay.scrollTop>0);
 await region.evaluate(el=>{el.scrollTop=0;});
 const cdp=await context.newCDPSession(page);
 try {
  await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
  const x=box.x+box.width/2,y=box.y+box.height-12;
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y,id:1}]});
  for(let offset=8;offset<=80;offset+=8) {
   await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-offset,id:1}]});await settle(page);
  }
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await page.waitForFunction(()=>els.wordDisplay.scrollTop>0);
 }finally{await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:false});await cdp.detach();}
 return {keyboardEnd:true,keyboardPageDown:true,mouseWheel:true,emulatedTouch:true,lastLineVisible:true};
}
async function noCollisions(page) {
 assert(await page.evaluate(()=>{
  const area=els.wordDisplay.getBoundingClientRect();
  return [els.previousContext,els.nextContext,els.longTextNote].filter(el=>!el.hidden).every(el=>{
   const r=el.getBoundingClientRect();return r.bottom<=area.top||r.top>=area.bottom||r.right<=area.left||r.left>=area.right;
  });
 }),"context/note intersects scrolling area");
}
async function cleared(page) {
 assert(await page.evaluate(()=>els.longTextNote.hidden&&els.wordDisplay.scrollTop===0
  &&!els.wordDisplay.classList.contains("wrapped-long-word")&&!els.wordDisplay.classList.contains("scrolling-long-word")
  &&!els.wordDisplay.closest(".reader-frame").classList.contains("scrolling-long-text")
  &&!els.wordDisplay.hasAttribute("tabindex")&&!els.wordDisplay.hasAttribute("data-long-text-paused")));
}
async function readerChecks({page,context,viewport,origin,verify,out,root}) {
 const master=await context.newPage();const errors=[];master.on("pageerror",e=>errors.push(e.message));
 const blobs=Object.fromEntries(["index.html","app.js","styles.css"].map(file=>["/"+file,execFileSync("git",["show","master:"+file],{cwd:root})]));
 await master.route("**/*",async route=>{
  const u=new URL(route.request().url()),key=u.pathname==="/"?"/index.html":u.pathname;
  if(u.origin===origin&&blobs[key])return route.fulfill({response:await route.fetch(),body:blobs[key]});
  return route.continue();
 });
 const evidence={viewport,master:"b9d3d9e",measurements:[],interactionChecks:[]};
 try {
  await master.goto(origin,{waitUntil:"networkidle"});
  await verify("F1 short and real word exactly match master",async()=>{
   for(const token of ["Hello",REAL]) {
    await prepare(master,token);await prepare(page,token);
    const before=await snapshot(master),after=await snapshot(page);
    for(const key of ["font","word","classes","text","frame"])assert.deepEqual(after[key],before[key],key);
    assert(!after.wrapped&&!after.scrolling&&after.noteHidden);dataSame(after,before);
    evidence.measurements.push({kind:"control",length:token.length,before:publicMeasurement(before),after:publicMeasurement(after)});
   }
  });
  for(const kind of ["W","real-repeated"])for(const length of [135,500,2000,10000]) {
   const token=kind==="W"?"W".repeat(length):REAL.repeat(Math.ceil(length/REAL.length)).slice(0,length);
   await verify("F1 "+kind+" "+length+" geometry, playback and data",async()=>{
    await prepare(master,token);const before=await snapshot(master);
    await prepare(page,"Hello");const normal=(await snapshot(page)).frame;
    await prepare(page,token,{index:0});await page.evaluate(()=>startReading());
    await page.waitForFunction(()=>state.index===1);await settle(page);
    const after=await snapshot(page),vertical=after.wrapped&&after.naturalHeight>normal.clientHeight;
    assert.deepEqual(after.frame,normal,"frame must retain normal size and have no overflow");
    assert(after.frame.scrollWidth<=after.frame.clientWidth);
    assert.equal(after.scrolling,vertical,"scroll state "+JSON.stringify(publicMeasurement(after)));
    assert.equal(after.noteHidden,!vertical,"note state "+JSON.stringify(publicMeasurement(after)));
    assert.equal(after.playing,!vertical,"playback state "+JSON.stringify(publicMeasurement(after)));
    dataSame(after,before);
    await page.evaluate(()=>copyCurrentWord());assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),token);
    await master.evaluate(()=>copyCurrentWord());assert.equal(await master.evaluate(()=>navigator.clipboard.readText()),token);
    const record={kind,length,before:publicMeasurement(before),after:publicMeasurement(after)};
    if(vertical) {
     assert.equal(after.note,NOTE);assert(after.area.scrollHeight>after.area.clientHeight);
     assert.equal(after.area.scrollWidth,after.area.clientWidth,"no horizontal scrolling");
     await noCollisions(page);record.scrolling=await scrollInputs(page,context);
     await page.locator("#play-button").click();
     assert.equal(await page.evaluate(()=>state.index),2);await cleared(page);
     await page.waitForFunction(()=>state.playing&&state.index===2);await page.evaluate(()=>pause());await cleared(page);
    }else{await page.evaluate(()=>pause());}
    evidence.measurements.push(record);
   });
  }
  await verify("F1 manual stepping and resume preserve the whole token",async()=>{
   const token="W".repeat(10000);await prepare(page,token);
   await page.locator("#prev-button").click();await settle(page);assert.equal(await page.evaluate(()=>currentWord()),"Lead");await cleared(page);
   await page.locator("#next-button").click();await settle(page);assert.equal(await page.evaluate(()=>currentWord()),token);
   await page.locator("#next-button").click();await settle(page);assert.equal(await page.evaluate(()=>currentWord()),"Tail");await cleared(page);
   await page.locator("#prev-button").click();await settle(page);
   const saved=await page.evaluate(()=>{const record=JSON.parse(localStorage.getItem(STORAGE_KEY));delete record.savedAt;return record;});
   await page.reload();await page.locator("#resume-button").click();await settle(page);
   assert.equal(await page.evaluate(()=>currentWord()),token);assert.equal(await page.evaluate(()=>state.index),1);
   assert.deepEqual(await page.evaluate(()=>{const record=JSON.parse(localStorage.getItem(STORAGE_KEY));delete record.savedAt;return record;}),saved);
   evidence.interactionChecks.push("manual next/previous; existing v1 resume exact fields and whole token");
  });
  await verify("F1 first-word countdown then pause and Play continuation",async()=>{
   await prepare(page,"W".repeat(10000),{index:0,first:true});await page.locator("#play-button").click();
   for(const value of [3,2,1]) {
    await page.waitForFunction(value=>state.countdownValue===value,value);
    assert.equal(await page.locator(".countdown-word").textContent(),String(value));assert(await page.locator("#long-text-note").isHidden());
   }
   await page.waitForFunction(()=>!state.countdownActive&&!state.playing&&els.wordDisplay.dataset.longTextPaused==="0");
   assert.equal(await page.evaluate(()=>state.index),0);
   await page.locator("#play-button").click();assert.equal(await page.evaluate(()=>state.index),1);await cleared(page);
   await page.waitForFunction(()=>state.playing&&state.index===1);await page.evaluate(()=>pause());
   evidence.interactionChecks.push("first token: 3-2-1, auto-pause at index 0, Play to next single word");
  });
  await verify("F1 resize re-evaluates and focus/context modes stay separate",async()=>{
   await page.setViewportSize({width:1400,height:950});await prepare(page,"W".repeat(2000));
   assert.equal((await snapshot(page)).scrolling,false);
   await page.setViewportSize({width:390,height:844});await settle(page);assert.equal((await snapshot(page)).scrolling,true);await noCollisions(page);
   await page.setViewportSize({width:1400,height:950});await settle(page);assert.equal((await snapshot(page)).scrolling,false);assert(await page.locator("#long-text-note").isHidden());
   await page.setViewportSize(viewport);await prepare(page,"W".repeat(10000));
   await page.locator("#focus-mode-button").click();await settle(page);await noCollisions(page);
   await page.locator("#focus-mode-button").click();await settle(page);
   await page.locator("#context-toggle").uncheck();await settle(page);await noCollisions(page);
   await page.locator("#focus-toggle").uncheck();await settle(page);await noCollisions(page);
   await page.locator("#focus-mode-button").click();await settle(page);await noCollisions(page);
   await page.locator("#focus-mode-button").click();await settle(page);
   await page.screenshot({path:path.join(out,"f1-scroll-"+viewport.width+".png"),fullPage:true});
   evidence.interactionChecks.push("1400->390->1400 resize; focus mode, context off, focus letter off");
  });
  assert.equal(errors.length,0);
  fs.writeFileSync(path.join(out,"reader-"+viewport.width+".json"),JSON.stringify(evidence,null,2)+"\n");
 }finally{await master.close();}
}
module.exports={readerChecks};
