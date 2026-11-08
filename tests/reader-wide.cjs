"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {baseline,prepare,measure}=require("./reader-round2.cjs"),{PRE_F1,tokenMarkup,checkTokenLayout}=require("./reader-smoke.cjs");
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
async function unwrappedMeasure(page,fontSize) {
 return page.evaluate(fontSize=>{
  const d=els.wordDisplay,f=d.closest(".reader-frame"),classes=d.className,font=d.style.fontSize,scroll=d.scrollTop,
   frameClasses=f.className;
  try {
   d.classList.remove("fitted-long-word","wrapped-long-word","scrolling-long-word");
   f.classList.remove("scrolling-long-text");
   d.style.fontSize=fontSize;
   const range=document.createRange();
   range.selectNodeContents(d);
   const width=range.getBoundingClientRect().width;
   return {width,innerWidth:f.clientWidth,exceeds:width>f.clientWidth};
  }finally{
   d.className=classes;f.className=frameClasses;d.style.fontSize=font;d.scrollTop=scroll;
  }
 },fontSize);
}
async function checkWideTarget(page,after,floor) {
 const base=await unwrappedMeasure(page,"");
 const target=base.innerWidth*.9, font=parseFloat(after.font);
 const fitted=base.exceeds || after.classes.split(" ").includes("fitted-long-word");
 const result={unfittedWidth:base.width,renderedWidth:after.contentWidth,frameWidth:base.innerWidth,
  percentage:100*after.contentWidth/base.innerWidth,targetApplied:fitted};
 if(!fitted)return result;
 if(font>10) {
  assert(after.contentWidth<=target,"wide fit exceeds 90% of frame: "+JSON.stringify(result));
 }else{
  assert.equal(font,10,"fitting must stop exactly at the floor");
  // checkFloor independently verifies that wrapping occurs iff the unwrapped
  // 10 px text exceeds the inner width. Both callers also check full containment.
  if(after.wrapped) {
   assert(after.word.width<=target,"wrapped box exceeds 90% of frame");
   assert(after.contentWidth<=after.word.width+1/64,"wrapped range overhang exceeds 1/64 CSS px");
  }else{
   assert.equal(after.contentWidth,floor.width,"unwrapped floor token has its measured 10 px width");
  }
 }
 return result;
}
async function wideChecks({page,context,origin,root,out,verify}) {
 const master=await baseline(context,origin,root,PRE_F1),rows=[],clipped=[],floor=[];
 const oldRows=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/f1-round2/wide-controls.json")));
 const clean=m=>{const {outerHTML,...r}=m;return r;};
 async function pair(token,cfg,viewport) {
  for(const p of [master,page]) {await p.setViewportSize(viewport);await p.reload();await prepare(p,token,cfg);}
  return [await measure(master),await measure(page)];
 }
 async function checkFloor(token,cfg,viewport,after) {
  const atFloor=await unwrappedMeasure(page,"10px");
  assert.equal(after.wrapped,parseFloat(after.font)<=10&&atFloor.exceeds,"floor break iff rendered width exceeds inner frame");
  return {viewport,cfg,length:token.length,font:after.font,wrapped:after.wrapped,...atFloor};
 }
 try {
  for(const oldRow of oldRows)await verify("W6.12 cap probe "+[oldRow.w,oldRow.focus,oldRow.n].join("/"),async()=>{
   const viewport={width:oldRow.w,height:oldRow.h},cfg={focus:oldRow.focus},token="W".repeat(oldRow.n);
   const [before,after]=await pair(token,cfg,viewport);
   assert.equal(before.ink.fullyVisible,oldRow.ink.fullyVisible,"same master classification as round 2");
   assert(after.ink.fullyVisible,"clipped case remains outside inner frame");
   const row={viewport,cfg,n:oldRow.n,before:clean(before),after:clean(after)};
   assert.equal(await tokenMarkup(page),await tokenMarkup(master));
   await checkTokenLayout(page);
   row.floor=await checkFloor(token,cfg,viewport,after);
   row.wideFit=await checkWideTarget(page,after,row.floor);rows.push(row);
  });
  for(const [width,height,focus] of [[390,844,false],[390,600,false],[844,390,false],[1400,950,false],
   [1708,950,false],[1920,1080,false],[996,950,true],[1400,950,true],[390,844,true]])
   for(const contextWords of [true,false])for(const letter of [true,false])
    await verify("W6.12 clipped and floor "+JSON.stringify({width,height,focus,contextWords,letter}),async()=>{
     const viewport={width,height},cfg={focus,context:contextWords,letter};
     for(const token of [REAL,"W".repeat(135),"W".repeat(2000),REAL.repeat(45),...Array.from({length:5},(_,i)=>"W".repeat(Math.floor(width===390?342/10:width/10)+i))]) {
      const [before,after]=await pair(token,cfg,viewport);
      assert(after.ink.fullyVisible,"rendered text must stay inside frame");
      const row={viewport,cfg,kind:token===REAL?"real45":token[0]==="W"?"W":"real-repeated",length:token.length,before:clean(before),after:clean(after)};
      row.floor=await checkFloor(token,cfg,viewport,after);
      row.wideFit=await checkWideTarget(page,after,row.floor);
      floor.push({...row.floor,wideFit:row.wideFit});
      if(!before.ink.fullyVisible)clipped.push(row);
     }
    });
  fs.writeFileSync(path.join(out,"wide-controls.json"),JSON.stringify({rows,clipped,floor},null,2)+"\n");
 }finally{
  await page.evaluate(()=>{pause();state.focusMode=false;document.body.classList.remove("focus-mode");render();});
  await master.close();
 }
}
module.exports={wideChecks};
