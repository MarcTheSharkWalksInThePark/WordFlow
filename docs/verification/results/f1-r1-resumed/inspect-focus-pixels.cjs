"use strict";
const fs=require("node:fs"),path=require("node:path"),root=path.resolve(__dirname,"../../../..");
const {launch}=require(path.join(root,"tests/browser-helper.cjs"));
(async()=>{const browser=await launch();try{
 const p=await browser.newPage(),files=["focus-master-mismatch.png","focus-candidate-mismatch.png"];
 const images=files.map(f=>fs.readFileSync(path.join(__dirname,f)).toString("base64"));
 const result=await p.evaluate(async images=>{
  const load=s=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src="data:image/png;base64,"+s;});
  const imgs=await Promise.all(images.map(load)),data=imgs.map(i=>{const c=document.createElement("canvas");c.width=i.width;c.height=i.height;const x=c.getContext("2d");x.drawImage(i,0,0);return x.getImageData(0,0,c.width,c.height).data;});
  const samples=[];let changed=0,maxChannelDifference=0;for(let i=0;i<data[0].length;i+=4){const a=Array.from(data[0].slice(i,i+4)),b=Array.from(data[1].slice(i,i+4)),delta=Math.max(...a.map((v,k)=>Math.abs(v-b[k])));if(delta){changed++;maxChannelDifference=Math.max(maxChannelDifference,delta);if(samples.length<100)samples.push({x:(i/4)%imgs[0].width,y:Math.floor(i/4/imgs[0].width),a,b});}}
  return {width:imgs[0].width,height:imgs[0].height,changed,maxChannelDifference,samples};
 },images);
 fs.writeFileSync(path.join(__dirname,"focus-pixel-mismatch.json"),JSON.stringify(result,null,2)+"\n");console.log({width:result.width,height:result.height,changed:result.changed,maxChannelDifference:result.maxChannelDifference,samples:result.samples.slice(0,5)});
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
