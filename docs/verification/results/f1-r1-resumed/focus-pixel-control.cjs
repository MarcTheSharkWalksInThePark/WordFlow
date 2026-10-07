"use strict";
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),root=path.resolve(__dirname,"../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare}=require(path.join(root,"tests/reader-round2.cjs")),{settle}=require(path.join(root,"tests/reader-smoke.cjs"));
const {finishedSnapshot}=require(path.join(root,"tests/reader-finished.cjs"));
async function diff(p,a,b){return p.evaluate(async({a,b})=>{
 const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src="data:image/png;base64,"+s;});const imgs=await Promise.all([load(a),load(b)]);
 const data=imgs.map(i=>{const c=document.createElement("canvas");c.width=i.width;c.height=i.height;const x=c.getContext("2d");x.drawImage(i,0,0);return x.getImageData(0,0,c.width,c.height).data;});
 let changed=0,maxChannelDifference=0;for(let i=0;i<data[0].length;i+=4){let d=Math.max(...Array.from(data[0].slice(i,i+4)).map((v,k)=>Math.abs(v-data[1][i+k])));if(d){changed++;maxChannelDifference=Math.max(maxChannelDifference,d);}}return {changed,maxChannelDifference};
},{a:a.toString("base64"),b:b.toString("base64")});}
(async()=>{let server,browser;try{
 server=await start(root);browser=await launch();const c=await browser.newContext({viewport:{width:996,height:950}}),origin="http://127.0.0.1:"+server.port,images=[],rows=[];
 for(let i=0;i<16;i++){
  const isMaster=i<12,p=isMaster?await baseline(c,origin,root,"master"):await c.newPage();if(!isMaster)await p.goto(origin);
  const css=isMaster?cp.execFileSync("git",["show","master:styles.css"],{cwd:root}):fs.readFileSync(path.join(root,"styles.css"));
  await p.route("**/styles.css",async route=>route.fulfill({response:await route.fetch(),body:css.toString()+"\n.reader-frame { background: #fffdfa; }\n.finish-summary { box-shadow: none; }\n"}));await p.reload();
  await prepare(p,"understanding.",{final:true,size:"large",focus:true,context:false});await p.evaluate(()=>completeReading());await p.bringToFront();await settle(p);await settle(p);
  const snapshot=await finishedSnapshot(p);
  if(!isMaster)await p.evaluate(()=>{const d=els.wordDisplay,pointer=d.style.pointerEvents,inert=d.inert;d.inert=false;d.style.pointerEvents="auto";document.elementsFromPoint(498,475);d.inert=inert;d.style.pointerEvents=pointer;if(!d.getAttribute("style"))d.removeAttribute("style");});
  const clip=await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(els.wordDisplay);const b=r.getBoundingClientRect();return {x:Math.floor(b.left),y:Math.floor(b.top),width:Math.ceil(b.right)-Math.floor(b.left),height:Math.ceil(b.bottom)-Math.floor(b.top)};});
  const image=await p.screenshot({clip});images.push(image);fs.writeFileSync(path.join(__dirname,"focus-control-"+i+".png"),image);
  rows.push({i,source:isMaster?"master":"candidate",snapshot,clip,...(i?await diff(p,images[0],image):{changed:0,maxChannelDifference:0})});await p.close();
 }
 fs.writeFileSync(path.join(__dirname,"focus-pixel-control.json"),JSON.stringify({rows},null,2)+"\n");console.log(rows.map(({i,source,changed,maxChannelDifference})=>({i,source,changed,maxChannelDifference})));
}finally{if(browser)await browser.close();if(server)await stop(server);}})().catch(e=>{console.error(e);process.exitCode=1;});
