"use strict";
// W7.12 frame table + word/context clearances, and an independent floor-case cross-check.
const fs=require("node:fs"),path=require("node:path");
const {CLONE,start,stop,launch,openAt,settle}=require("./rv.cjs");
const OUT=path.resolve(__dirname,"../ev/runs");
const BASE="2a376445ceb1b98a1b4c943cf8834e77e0578120";
const VIEWPORTS=[[390,844],[390,600],[768,1024],[1400,900],[1400,950],[1708,950],[1920,1080]];
const REAL="Pneumonoultramicroscopicsilicovolcanoconiosis";
async function prepare(page,token,{focus=false,context=true,letter=true,size="large"}={}){
 await page.evaluate(({token,context,letter,size})=>{
  pause();switchTab("paste");hideSourceReview();state.focusLetter=letter;state.contextWords=context;
  state.wpm=100;state.smartPacing=false;state.sentencePause=false;state.commaPause=false;state.paragraphPause=false;
  loadText("Lead "+token+" Tail End.","Reader fixture","Reader fixture");setWordSize(size);seekTo(1);window.scrollTo(0,0);
 },{token,context,letter,size});
 const on=await page.evaluate(()=>state.focusMode);
 if(on!==focus){await page.locator("#focus-mode-button").click();}
 await page.evaluate(()=>window.scrollTo(0,0));
 await settle(page);
 const now=await page.evaluate(()=>[state.focusMode,document.body.classList.contains("focus-mode")]);
 if(now[0]!==focus||now[1]!==focus)throw new Error("focus mode not applied");
}
const measure=page=>page.evaluate(()=>{
 const d=els.wordDisplay,f=d.closest(".reader-frame"),fr=f.getBoundingClientRect();
 const box=e=>e.getBoundingClientRect();
 const ink=e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect();};
 const w=box(d),wi=ink(d),p=box(els.previousContext),pi=ink(els.previousContext),n=box(els.nextContext),ni=ink(els.nextContext);
 return {frameW:fr.width,frameH:fr.height,innerW:f.clientWidth,innerH:f.clientHeight,font:getComputedStyle(d).fontSize,
  prevHidden:els.previousContext.hidden,nextHidden:els.nextContext.hidden,text:d.textContent,
  boxTop:w.top-p.bottom,boxBottom:n.top-w.bottom,inkTop:wi.top-pi.bottom,inkBottom:ni.top-wi.bottom,
  docScrollW:document.documentElement.scrollWidth,vw:innerWidth};
});
const floorMeasure=page=>page.evaluate(()=>{
 const d=els.wordDisplay,f=d.closest(".reader-frame"),fr=f.getBoundingClientRect();
 const range=()=>{const r=document.createRange();r.selectNodeContents(d);return r.getBoundingClientRect();};
 const scrolling=d.classList.contains("scrolling-long-word"),wrapped=d.classList.contains("wrapped-long-word");
 const rr=range(),bx=d.getBoundingClientRect(),vis=scrolling?bx:rr;
 const x=fr.left+f.clientLeft,y=fr.top+f.clientTop;
 const inside=vis.left>=x&&vis.right<=x+f.clientWidth&&vis.top>=y&&vis.bottom<=y+f.clientHeight;
 const cls=d.className,font=d.style.fontSize,fcls=f.className,st=d.scrollTop;
 d.classList.remove("wrapped-long-word","scrolling-long-word","fitted-long-word");f.classList.remove("scrolling-long-text");d.style.fontSize="10px";
 const w10=range().width;d.style.fontSize="";const wBase=range().width;
 d.className=cls;d.style.fontSize=font;f.className=fcls;d.scrollTop=st;
 return {font:getComputedStyle(d).fontSize,wrapped,scrolling,fitted:cls.includes("fitted-long-word"),rangeW:rr.width,boxW:bx.width,
  innerW:f.clientWidth,pct:100*rr.width/f.clientWidth,unwrapped10:w10,unfittedBase:wBase,inside,overhang:rr.width-bx.width};
});
(async()=>{
 const server=await start(CLONE),origin="http://127.0.0.1:"+server.port,browser=await launch();
 const res={chrome:browser.version(),frames:[],floor:[]};
 try{
  for(const scheme of ["dark","light"]){
   const ctx=await browser.newContext({viewport:{width:1400,height:950},colorScheme:scheme});
   const pages={base:await openAt(ctx,origin,BASE),cand:await openAt(ctx,origin,null)};
   for(const [w,h] of VIEWPORTS)for(const focus of [false,true]){
    const row={viewport:w+"x"+h,theme:scheme,mode:focus?"Focus":"Normal"};
    for(const [k,p] of Object.entries(pages)){
     await p.bringToFront();await p.setViewportSize({width:w,height:h});await p.reload({waitUntil:"networkidle"});
     row[k]={};
     for(const size of ["large","comfortable","compact"]){await prepare(p,"Hello",{focus,size});row[k][size]=await measure(p);}
    }
    const L=row.cand.large,B=row.base.large;
    row.ratioW=L.frameW/B.frameW;row.ratioH=L.frameH/B.frameH;
    row.minBoxClear=Math.min(...["large","comfortable","compact"].flatMap(s=>[row.cand[s].boxTop,row.cand[s].boxBottom]));
    row.minInkClear=Math.min(...["large","comfortable","compact"].flatMap(s=>[row.cand[s].inkTop,row.cand[s].inkBottom]));
    row.frameConstAcrossSizes=["comfortable","compact"].every(s=>row.cand[s].frameW===L.frameW&&row.cand[s].frameH===L.frameH);
    row.fontsEqualBase=["large","comfortable","compact"].every(s=>row.cand[s].font===row.base[s].font);
    row.fonts=["large","comfortable","compact"].map(s=>row.cand[s].font+"/"+row.base[s].font).join(" ");
    res.frames.push(row);
    console.log(row.viewport,scheme,row.mode,"base",B.frameW.toFixed(2)+"x"+B.frameH.toFixed(2),"cand",L.frameW.toFixed(2)+"x"+L.frameH.toFixed(2),
     (100*row.ratioW).toFixed(2)+"%",(100*row.ratioH).toFixed(2)+"%","box",row.minBoxClear.toFixed(2),"ink",row.minInkClear.toFixed(2),row.fonts,"overflow",L.docScrollW>L.vw);
   }
   await ctx.close();
  }
  // Floor cross-check: wide-suite default context (no colorScheme -> light), large size.
  const cases=[];
  for(const c of [true,false])for(const l of [true,false])cases.push({vp:[844,390],focus:false,context:c,letter:l,token:REAL.repeat(45),name:"Real x 45"});
  for(const n of [35,36,37])cases.push({vp:[390,844],focus:false,context:true,letter:true,token:"W".repeat(n),name:"W x "+n});
  cases.push({vp:[390,600],focus:false,context:false,letter:false,token:"W".repeat(37),name:"W x 37"});
  cases.push({vp:[390,844],focus:true,context:true,letter:true,token:"W".repeat(36),name:"W x 36"});
  for(const n of [99,102])cases.push({vp:[996,950],focus:true,context:true,letter:false,token:"W".repeat(n),name:"W x "+n});
  for(const n of [135,144])cases.push({vp:[1400,950],focus:true,context:false,letter:true,token:"W".repeat(n),name:"W x "+n});
  for(const scheme of ["light","dark"]){
   const ctx=await browser.newContext({viewport:{width:1400,height:950},colorScheme:scheme});
   const pages={base:await openAt(ctx,origin,BASE),cand:await openAt(ctx,origin,null)};
   for(const cs of cases){
    if(scheme==="dark"&&cs.name!=="Real x 45")continue;
    const row={theme:scheme,viewport:cs.vp.join("x"),mode:cs.focus?"Focus":"normal",context:cs.context,letter:cs.letter,token:cs.name};
    for(const [k,p] of Object.entries(pages)){
     await p.bringToFront();await p.setViewportSize({width:cs.vp[0],height:cs.vp[1]});await p.reload({waitUntil:"networkidle"});
     await prepare(p,cs.token,cs);row[k]=await floorMeasure(p);
    }
    res.floor.push(row);
    const f=x=>x.font+" "+x.rangeW+"/"+x.innerW+" "+x.pct.toFixed(3)+"% wrap="+x.wrapped+" in="+x.inside+" u10="+x.unwrapped10+" over="+x.overhang;
    console.log("FLOOR",scheme,row.viewport,row.mode,cs.context,cs.letter,cs.name,"| base",f(row.base),"| cand",f(row.cand));
   }
   await ctx.close();
  }
 }finally{await browser.close();await stop(server);}
 fs.writeFileSync(path.join(OUT,"geometry.json"),JSON.stringify(res,null,1));
})().catch(e=>{console.error(e);process.exitCode=1;});
