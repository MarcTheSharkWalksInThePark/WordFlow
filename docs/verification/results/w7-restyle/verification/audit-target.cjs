"use strict";
const path=require("node:path"),fs=require("node:fs");
const root=path.resolve(__dirname,"../../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs"));
const {launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {prepare,measure}=require(path.join(root,"tests/reader-round2.cjs"));
const real="Pneumonoultramicroscopicsilicovolcanoconiosis";
async function widths(page) {
  return page.evaluate(()=>{
    const d=els.wordDisplay,f=d.closest(".reader-frame"),style=d.getAttribute("style"),
      classes=d.className,frameClasses=f.className,scroll=d.scrollTop;
    const range=document.createRange();range.selectNodeContents(d);
    try {
      d.classList.remove("fitted-long-word","wrapped-long-word","scrolling-long-word");
      f.classList.remove("scrolling-long-text");
      const at=size=>{d.style.fontSize=size;return {font:getComputedStyle(d).fontSize,width:range.getBoundingClientRect().width};};
      return {base:at(""),floor:at("10px")};
    }finally{
      d.className=classes;f.className=frameClasses;
      if(style===null)d.removeAttribute("style");else d.setAttribute("style",style);
      d.scrollTop=scroll;
    }
  });
}
(async()=>{
 const server=await start(root);let browser;
 try{
  browser=await launch();const ctx=await browser.newContext(),page=await ctx.newPage();
  await page.goto("http://127.0.0.1:"+server.port);
  const rows=[];
  for(const [width,height,focus] of [[390,844,false],[390,600,false],[844,390,false],[1400,950,false],
    [1708,950,false],[1920,1080,false],[996,950,true],[1400,950,true],[390,844,true]]) {
    await page.setViewportSize({width,height});
    for(const context of [true,false])for(const letter of [true,false]){
      for(const token of [real,"W".repeat(135),"W".repeat(2000),real.repeat(45),
        ...Array.from({length:5},(_,i)=>"W".repeat(Math.floor(width===390?342/10:width/10)+i))]) {
        await prepare(page,token,{focus,context,letter});
        const m=await measure(page),{base,floor}=await widths(page);
        const frameWidth=m.frame.clientWidth,target=.9*frameWidth;
        rows.push({width,height,focus,context,letter,
          kind:token===real?"real45":token[0]==="W"?"W":"real-repeated",n:token.length,
          base,floor,renderedFont:m.font,renderedWidth:m.contentWidth,frameWidth,target,
          percentage:100*m.contentWidth/frameWidth,fullyVisible:m.ink.fullyVisible,
          wrapped:m.wrapped,scrolling:m.scrolling,applies:base.width>frameWidth,
          passed:base.width<=frameWidth || m.contentWidth<=target});
      }
    }
  }
  const misses=rows.filter(r=>!r.passed);
  const summary={rows:rows.length,applies:rows.filter(r=>r.applies).length,
    misses:misses.length,allVisible:rows.every(r=>r.fullyVisible),
    missesAtFloor:misses.filter(r=>Number.parseFloat(r.renderedFont)===10).length,
    missesUnwrappedDueToFloor:misses.filter(r=>!r.wrapped&&r.floor.width>r.target&&r.floor.width<=r.frameWidth).length,
    missesWrapped:misses.filter(r=>r.wrapped).length,
    missesAboveFloor:misses.filter(r=>Number.parseFloat(r.renderedFont)>10).length};
  fs.writeFileSync(path.join(__dirname,"wide-target-audit.json"),JSON.stringify({summary,rows},null,2)+"\n");
  console.log(JSON.stringify(summary));console.log(JSON.stringify(misses.filter(r=>r.context&&r.letter).map(r=>[r.width,r.height,r.focus,r.kind,r.n,r.renderedFont,r.floor.width,r.renderedWidth,r.target,r.frameWidth,r.wrapped])));
 }finally{if(browser)await browser.close();await stop(server);}
})().catch(error=>{console.error(error);process.exitCode=1;});
