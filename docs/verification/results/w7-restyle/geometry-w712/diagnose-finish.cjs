const path = require("node:path"), fs = require("node:fs");
const root=path.resolve(__dirname,"../../../../..");
const {start,stop}=require(path.join(root,"tests/helpers.cjs"));
const {launch}=require(path.join(root,"tests/browser-helper.cjs"));
const {baseline,prepare}=require(path.join(root,"tests/reader-round2.cjs"));
const {settle,PRE_F1}=require(path.join(root,"tests/reader-smoke.cjs"));
const real="Pneumonoultramicroscopicsilicovolcanoconiosis";
const snapshot=page=>page.evaluate(()=>({
  finished:state.finished,index:state.index,playing:state.playing,countdown:state.countdownActive,
  status:els.status.textContent,summary:els.finishSummary.outerHTML,controls:els.playButton.outerHTML
}));
const nodes=page=>page.locator("#play-button").evaluate(button=>[...button.childNodes].map(n=>
  n.nodeType===3 ? {kind:"text",content:n.textContent} : {kind:"element",content:n.outerHTML}));
(async()=>{
 const server=await start(root);let browser;
 try{
  browser=await launch();const origin="http://127.0.0.1:"+server.port;
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const old=await baseline(context,origin,root,PRE_F1),page=await context.newPage();
  await page.goto(origin,{waitUntil:"networkidle"});
  for(const p of [old,page]) {await prepare(p,real,{final:true});await p.evaluate(()=>completeReading());}
  const expected=await snapshot(old);
  await prepare(page,"W".repeat(10000),{final:true,index:0});
  await page.evaluate(()=>startReading());await page.waitForFunction(()=>state.index===1&&!state.playing);
  await page.locator("#play-button").click();await settle(page);
  const actual=await snapshot(page);
  const result={baseline:PRE_F1, viewport:[390,844],expected,actual,
    differingKeys:Object.keys(expected).filter(k=>expected[k]!==actual[k]),
    baselineChildren:await nodes(old),candidateChildren:await nodes(page)};
  fs.writeFileSync(path.join(__dirname,"finish-comparison.json"),JSON.stringify(result,null,2)+"\n");
  console.log(JSON.stringify({differingKeys:result.differingKeys,baselineChildren:result.baselineChildren,candidateChildren:result.candidateChildren}));
 }finally{if(browser)await browser.close();await stop(server);}
})().catch(error=>{console.error(error);process.exitCode=1;});
