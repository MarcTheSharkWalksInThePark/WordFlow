"use strict";
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare}=require(path.join(root,"tests/reader-round2.cjs")),{settle}=require(path.join(root,"tests/reader-smoke.cjs"));
async function diff(p,a,b){return p.evaluate(async({a,b})=>{
 const load=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src="data:image/png;base64,"+s;});const imgs=await Promise.all([load(a),load(b)]);
 const bytes=imgs.map(i=>{const c=document.createElement("canvas");c.width=i.width;c.height=i.height;const x=c.getContext("2d");x.drawImage(i,0,0);return x.getImageData(0,0,c.width,c.height).data;});
 let n=0;for(let i=0;i<bytes[0].length;i+=4)if(bytes[0].slice(i,i+4).some((x,k)=>x!==bytes[1][i+k]))n++;return n;
},{a:a.toString("base64"),b:b.toString("base64")});}
(async()=>{let server,browser;try{
 server=await start(root);browser=await launch();const c=await browser.newContext({viewport:{width:1400,height:950}}),origin="http://127.0.0.1:"+server.port,images=[],rows=[];
 for(let i=0;i<4;i++){
  const p=i%2?await c.newPage():await baseline(c,origin,root,"master");if(i%2)await p.goto(origin);
  await prepare(p,"kommunikasjon.",{final:true,size:"comfortable"});await p.evaluate(()=>completeReading());await p.bringToFront();await settle(p);
  const before=await p.evaluate(()=>els.wordDisplay.outerHTML);
  if(i%2)await p.evaluate(()=>{const d=els.wordDisplay,p=d.style.pointerEvents;d.inert=false;d.style.pointerEvents="auto";d.getBoundingClientRect();document.elementsFromPoint(700,375);d.inert=false;d.style.pointerEvents=p;});
  const clip=await p.evaluate(()=>{const r=document.createRange();r.selectNodeContents(els.wordDisplay);const b=r.getBoundingClientRect();return {x:Math.floor(b.left),y:Math.floor(b.top),width:Math.ceil(b.right)-Math.floor(b.left),height:Math.ceil(b.bottom)-Math.floor(b.top)};});
  const image=await p.screenshot({clip});images.push(image);fs.writeFileSync(path.join(__dirname,"fresh-control-"+i+".png"),image);
  rows.push({i,source:i%2?"candidate":"master",pointerToggle:!!(i%2),before,after:await p.evaluate(()=>els.wordDisplay.outerHTML),clip,diffFromFirst:i?await diff(p,images[0],image):0});await p.close();
 }
 fs.writeFileSync(path.join(__dirname,"fresh-pixel-control.json"),JSON.stringify({rows},null,2)+"\n");console.log(rows.map(r=>({i:r.i,source:r.source,toggle:r.pointerToggle,diff:r.diffFromFirst,domEqual:r.before===r.after})));
}finally{if(browser)await browser.close();if(server)await stop(server);}})().catch(e=>{console.error(e);process.exitCode=1;});
