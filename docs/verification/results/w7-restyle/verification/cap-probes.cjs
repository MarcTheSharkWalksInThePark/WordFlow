"use strict";
const path=require("node:path"),fs=require("node:fs");
const root=path.resolve(__dirname,"../../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs"));
const {launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare,measure}=require(path.join(root,"tests/reader-round2.cjs"));
const {PRE_F1}=require(path.join(root,"tests/reader-smoke.cjs"));
async function baseGeometry(p) {
  return p.evaluate(()=>{
    const d=els.wordDisplay,f=d.closest(".reader-frame");
    const font=d.style.fontSize;
    try {
      d.style.fontSize="";
      const r=document.createRange();r.selectNodeContents(d);
      const rect=d.getBoundingClientRect(),ink=r.getBoundingClientRect(),innerLeft=f.getBoundingClientRect().left+f.clientLeft;
      return {font:getComputedStyle(d).fontSize,fontFamily:getComputedStyle(d).fontFamily,
        innerWidth:f.clientWidth,widthTarget:f.clientWidth*.9,heightTarget:f.clientHeight*.58,
        displayWidth:rect.width,displayHeight:rect.height,textWidth:ink.width,
        leftClearance:ink.left-innerLeft,rightClearance:innerLeft+f.clientWidth-ink.right};
    } finally {d.style.fontSize=font;}
  });
}
(async()=>{
 const server=await start(root);let browser;
 try {
   browser=await launch();const origin="http://127.0.0.1:"+server.port,context=await browser.newContext();
   const pre=await baseline(context,origin,root,PRE_F1);
   const before=await baseline(context,origin,root,"2a376445ceb1b98a1b4c943cf8834e77e0578120");
   const live=await context.newPage();await live.goto(origin);
   const rows=[];
   const cases=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/f1-round2/wide-controls.json")));
   for (const item of cases) {
     const record={width:item.w,height:item.h,focus:item.focus,n:item.n};
     for(const [label,p] of [["preF1",pre],["preRestyle",before],["candidate",live]]) {
       await p.setViewportSize({width:item.w,height:item.h});
       await prepare(p,"W".repeat(item.n),{focus:item.focus});
       const m=await measure(p);
       record[label]={base:await baseGeometry(p),rendered:{fit:m.classes.includes("fitted-long-word"),font:m.font,width:m.contentWidth,
         visible:m.ink.fullyVisible,leftClearance:m.ink.left-m.ink.innerLeft,rightClearance:m.ink.innerRight-m.ink.right}};
       if(item.w===1920 && !item.focus && item.n===9)await p.locator(".reader-frame").screenshot({path:path.join(__dirname,label+"-W9.png")});
     }
     rows.push(record);
   }
   const mismatches=rows.filter(r=>!r.preF1.rendered.visible&&r.candidate.rendered.width>r.candidate.base.widthTarget);
   const clipped=rows.filter(r=>!r.candidate.rendered.visible);
   fs.writeFileSync(path.join(__dirname,"cap-probes.json"),JSON.stringify({rows,mismatches:mismatches.map(r=>[r.width,r.focus,r.n]),clipped:clipped.map(r=>[r.width,r.focus,r.n])},null,2)+"\n");
   console.log(JSON.stringify({rows:rows.length,mismatches:mismatches.length,clipped:clipped.length,offenders:mismatches},null,2));
 }finally{if(browser)await browser.close();await stop(server);}
})().catch(e=>{console.error(e);process.exitCode=1});
