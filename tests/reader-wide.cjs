"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
const {baseline,prepare,measure}=require("./reader-round2.cjs"),{settle}=require("./reader-smoke.cjs");
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
async function floorMeasure(page) {
 return page.evaluate(()=>{
  const d=els.wordDisplay,f=d.closest(".reader-frame"),classes=d.className,font=d.style.fontSize,scroll=d.scrollTop,
   frameClasses=f.className;
  d.classList.remove("wrapped-long-word","scrolling-long-word");f.classList.remove("scrolling-long-text");d.style.fontSize="10px";
  const range=document.createRange();range.selectNodeContents(d);const width=range.getBoundingClientRect().width;
  d.className=classes;f.className=frameClasses;d.style.fontSize=font;d.scrollTop=scroll;
  return {width,innerWidth:f.clientWidth,exceeds:width>f.clientWidth};
 });
}
async function wideChecks({page,context,origin,root,out,verify}) {
 const master=await baseline(context,origin,root,"master"),rows=[],clipped=[],floor=[];
 const oldRows=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/f1-round2/wide-controls.json")));
 const css=execFileSync("git",["show","master:styles.css"],{cwd:root});
 let flat=false;
 const handlers=new Map();
 for(const [p,body] of [[master,css],[page,fs.readFileSync(path.join(root,"styles.css"))]]) {
  const handler=async route=>flat?route.fulfill({response:await route.fetch(),body:body.toString()+"\n.reader-frame { background: #fffdfa; }\n"}):route.fallback();
  handlers.set(p,handler);await p.route("**/styles.css",handler);
 }
 const clean=m=>{const {outerHTML,...r}=m;return r;};
 async function pair(token,cfg,viewport) {
  for(const p of [master,page]) {await p.setViewportSize(viewport);await p.reload();await prepare(p,token,cfg);}
  return [await measure(master),await measure(page)];
 }
 async function checkFloor(token,cfg,viewport,after) {
  const atFloor=await floorMeasure(page);
  assert.equal(after.wrapped,parseFloat(after.font)<=10&&atFloor.exceeds,"floor break iff rendered width exceeds inner frame");
  return {viewport,cfg,length:token.length,font:after.font,wrapped:after.wrapped,...atFloor};
 }
 try {
  flat=true;
  for(const oldRow of oldRows)await verify("W6.12 cap probe "+[oldRow.w,oldRow.focus,oldRow.n].join("/"),async()=>{
   const viewport={width:oldRow.w,height:oldRow.h},cfg={focus:oldRow.focus},token="W".repeat(oldRow.n);
   const [before,after]=await pair(token,cfg,viewport);
   assert.equal(before.ink.fullyVisible,oldRow.ink.fullyVisible,"same master classification as round 2");
   assert(after.ink.fullyVisible,"clipped case remains outside inner frame");
   const row={viewport,cfg,n:oldRow.n,before:clean(before),after:clean(after)};
   if(before.ink.fullyVisible) {
    for(const key of ["outerHTML","word","frame","context","font","classes","ink"])
     assert.deepEqual(after[key],before[key],"STOP: fully visible master token changed: "+key);
    const shot=async(p,m)=>{await p.bringToFront();await p.evaluate(()=>window.scrollTo(0,0));await settle(p);
     return p.screenshot({clip:{x:Math.floor(m.frame.x),y:Math.floor(m.frame.y),width:Math.ceil(m.frame.width),height:Math.ceil(m.frame.height)}});};
    const a=await shot(master,before),b=await shot(page,after);
    if(!a.equals(b)){fs.writeFileSync(path.join(out,"wide-master-mismatch.png"),a);fs.writeFileSync(path.join(out,"wide-candidate-mismatch.png"),b);}
    assert(a.equals(b),"STOP: fully visible master pixels differ");
    row.byteIdentical=true;row.differingPixels=0;row.backdrop="test-only #fffdfa";
   }else {assert(after.contentWidth<=after.frame.clientWidth*.9);row.target=after.frame.clientWidth*.9;}
   row.floor=await checkFloor(token,cfg,viewport,after);rows.push(row);
  });
  flat=false;
  for(const [width,height,focus] of [[390,844,false],[390,600,false],[844,390,false],[1400,950,false],
   [1708,950,false],[1920,1080,false],[996,950,true],[1400,950,true],[390,844,true]])
   for(const contextWords of [true,false])for(const letter of [true,false])
    await verify("W6.12 clipped and floor "+JSON.stringify({width,height,focus,contextWords,letter}),async()=>{
     const viewport={width,height},cfg={focus,context:contextWords,letter};
     for(const token of [REAL,"W".repeat(135),"W".repeat(2000),REAL.repeat(45),...Array.from({length:5},(_,i)=>"W".repeat(Math.floor(width===390?342/10:width/10)+i))]) {
      const [before,after]=await pair(token,cfg,viewport);
      assert(after.ink.fullyVisible,"rendered text must stay inside frame");
      const row={viewport,cfg,kind:token===REAL?"real45":token[0]==="W"?"W":"real-repeated",length:token.length,before:clean(before),after:clean(after)};
      row.floor=await checkFloor(token,cfg,viewport,after);floor.push(row.floor);
      if(!before.ink.fullyVisible) {
       if(!after.wrapped&&before.word.width<=before.frame.clientWidth*.9&&before.word.height<=before.frame.clientHeight*.58)
        assert(after.contentWidth<=after.frame.clientWidth*.9,"new wide fit targets 90% of frame");
       clipped.push(row);
      }
     }
    });
  fs.writeFileSync(path.join(out,"wide-controls.json"),JSON.stringify({rows,clipped,floor},null,2)+"\n");
 }finally{
  await page.unroute("**/styles.css",handlers.get(page));
  await page.evaluate(()=>{pause();state.focusMode=false;document.body.classList.remove("focus-mode");render();});
  await master.close();
 }
}
module.exports={wideChecks};
