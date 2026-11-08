"use strict";
// Contact sheet: node sheet.cjs out.png cols width img1 img2 ...
const fs=require("node:fs"),path=require("node:path");
const {launch}=require("./rv.cjs");
(async()=>{
 const [out,cols,width,...imgs]=process.argv.slice(2);
 const cells=imgs.map(f=>`<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${path.basename(f)}</figcaption></figure>`).join("");
 const html=`<!doctype html><style>body{margin:0;background:#888;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;padding:6px}
 figure{margin:0;background:#fff}img{width:100%;display:block}figcaption{padding:2px 4px}</style><main>${cells}</main>`;
 const browser=await launch();const page=await browser.newPage({viewport:{width:Number(width),height:600}});
 await page.setContent(html);await page.screenshot({path:out,fullPage:true});await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
