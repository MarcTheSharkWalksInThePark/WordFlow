"use strict";
// Full feature smoke, installed Chrome, offline deterministic proxy fixture.
const fs=require("node:fs"),path=require("node:path");
const {start,stop,assert,sha}=require("../tests/helpers.cjs"),{launch}=require("../tests/browser-helper.cjs");
const root=path.join(__dirname,".."),outIndex=process.argv.indexOf("--out-dir"),out=outIndex>=0?path.resolve(process.argv[outIndex+1]):path.join(root,"docs/verification/results");
const LIMIT="URL loading has reached today's free limit. It resets at 00:00 UTC. Paste the text instead.";
(async()=>{
 let browser,server;const result={browserPlugin:"not available; existing Playwright drives installed Chrome",viewports:[],errors:[],blocked:[],uploads:0};
 try {
  server=await start(root,{preload:path.join(root,"tests/proxy-fixture.cjs")});browser=await launch();result.chrome=browser.version();
  const origin="http://127.0.0.1:"+server.port;
  for(const viewport of [{width:1400,height:950},{width:390,height:844}]) {
   const context=await browser.newContext({viewport,permissions:["clipboard-read","clipboard-write"]});
   let mode="normal",fallback=false;
   await context.route("**/*",route=>{
    const u=new URL(route.request().url());
    if(u.origin===origin) {
     if(u.pathname==="/api/read" && mode!=="normal") {
      if(mode==="article1027")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({url:"https://public-fixture.example",contentType:"text/plain",body:"Article number 1027 mentions WORDFLOW_FREE_LIMIT."})});
      if(mode==="marker")return route.fulfill({status:200,contentType:"application/json",body:fs.readFileSync(path.join(root,"api/read"),"utf8")});
      return route.fulfill({status:503,contentType:"text/html",body:"<!doctype html><h1>Error 1027</h1><p>Worker exceeded free tier daily request limit</p>"});
     }
     return route.continue();
    }
    if(u.hostname==="public-fixture.example" && fallback)return route.fulfill({status:200,contentType:"text/plain",headers:{"access-control-allow-origin":"*"},body:"Direct fallback text."});
    if(u.hostname==="public-fixture.example")return route.abort();
    result.blocked.push(u.origin);return route.abort();
   });
   const page=await context.newPage();const checks=[];
   page.on("pageerror",e=>result.errors.push(e.message));
   page.on("console",m=>{if(m.type()==="error" && !/Failed to load resource|net::ERR_FAILED/.test(m.text()))result.errors.push(m.text());});
   page.on("request",r=>{if(r.method()==="POST")result.uploads++;});
   const verify=async(name,fn)=>{try{await fn();checks.push({name,passed:true});}catch(e){throw new Error(name+": "+e.message,{cause:e});}};
   const value=id=>page.locator("#"+id).inputValue();
   const stateValue=key=>page.evaluate(key=>state[key],key);
   const inputRange=async(id,n)=>page.locator("#"+id).evaluate((el,n)=>{el.value=n;el.dispatchEvent(new Event("input",{bubbles:true}));},String(n));
   const use=async()=>{await page.locator("#apply-source-button").click();assert((await stateValue("words")).length>0);await page.locator("#review-back-button").click();};
   await page.goto(origin,{waitUntil:"networkidle"});
   await verify("identity, meaningful UI, no overlay, privacy",async()=>{assert.equal(await page.title(),"WordFlow Reader");assert((await page.locator("body").innerText()).includes("Files are read in your browser"));assert(await page.locator("#sample-button").isVisible());});
   await verify("sample and clear",async()=>{await page.locator("#sample-button").click();assert((await value("review-text")).includes("A focused reading rhythm"));await use();await page.locator("#clear-button").click();assert.equal(await stateValue("words").then(x=>x.length),0);});
   const raw="Menu\nJournal header\n## Introduction\nA hyphen-\nated word.\nNext line.\nPage 1\nJournal header\n\n## Chapter 2\nLast paragraph, with a sentence.";
   await verify("paste, title and counts",async()=>{await page.locator("#text-input").fill(raw);await page.locator("#load-text-button").click();assert.equal(await page.locator("#source-title").textContent(),"Pasted text");assert(Number((await page.locator("#review-word-count").textContent()).replaceAll(",",""))>0);assert(Number((await page.locator("#review-char-count").textContent()).replaceAll(",",""))>0);});
   await verify("all four cleanup toggles and raw source",async()=>{
    await page.locator("#raw-source-button").click();assert.equal(await value("review-text"),raw);
    for(const id of ["cleanup-linebreaks","cleanup-hyphens","cleanup-boilerplate","cleanup-page-noise"])assert.equal(await page.locator("#"+id).isChecked(),false);
    await page.locator("#cleanup-hyphens").check();assert((await value("review-text")).includes("hyphenated"));
    await page.locator("#cleanup-boilerplate").check();assert(!(await value("review-text")).includes("Menu"));
    await page.locator("#cleanup-page-noise").check();assert(!(await value("review-text")).includes("Page 1"));assert(!(await value("review-text")).includes("Journal header"));
    await page.locator("#cleanup-linebreaks").check();assert((await value("review-text")).includes("hyphenated word. Next line."));
   });
   await verify("review back and use source",async()=>{await page.locator("#review-back-button").click();assert(await page.locator("#text-input").isVisible());await page.locator("#load-text-button").click();await use();assert((await stateValue("words")).length>5);});
   await verify("WPM slider and ±25 bounded 100–900",async()=>{await inputRange("wpm-slider",100);await page.locator("#slower-button").click();assert.equal(await stateValue("wpm"),100);await page.locator("#faster-button").click();assert.equal(await stateValue("wpm"),125);await inputRange("wpm-slider",900);await page.locator("#faster-button").click();assert.equal(await stateValue("wpm"),900);await page.locator("#slower-button").click();assert.equal(await stateValue("wpm"),875);await inputRange("wpm-slider",300);});
   await verify("sentence, comma, paragraph pauses and smart pacing affect delay",async()=>{
    for(const [id,key,word,paragraph] of [["sentence-pause-toggle","sentencePause","end.",false],["comma-pause-toggle","commaPause","comma,",false],["paragraph-pause-toggle","paragraphPause","plain",true],["smart-pacing-toggle","smartPacing","extraordinarilylong",false]]) {
     await page.locator("#"+id).check();
     const on=await page.evaluate(({word,paragraph})=>{state.paragraphBreaks.delete(0);if(paragraph)state.paragraphBreaks.add(0);return wordDelay(word,0);},{word,paragraph});
     await page.locator("#"+id).uncheck();assert.equal(await stateValue(key),false);
     const off=await page.evaluate(word=>wordDelay(word,0),word);assert(on>off,id+" must affect delay");await page.locator("#"+id).check();
    }
   });
   await verify("focus letter, context and all word sizes",async()=>{assert(await page.locator(".word-focus").count());await page.locator("#focus-toggle").uncheck();assert.equal(await page.locator(".word-focus").count(),0);await page.locator("#focus-toggle").check();await page.locator("#context-toggle").uncheck();assert(await page.locator("#next-context").isHidden());await page.locator("#context-toggle").check();assert(await page.locator("#next-context").isVisible());for(const size of ["large","compact","comfortable"]){await page.locator('[data-size="'+size+'"]').click();assert.equal(await stateValue("wordSize"),size);}});
   await verify("progress, previous/next, sentence rewind, section selection and restart",async()=>{
    await inputRange("progress-slider",3);assert.equal(await stateValue("index"),3);
    await page.locator("#prev-button").click();assert.equal(await stateValue("index"),2);
    await page.locator("#next-button").click();assert.equal(await stateValue("index"),3);
    await page.locator("#sentence-back-button").click();assert((await stateValue("index"))<3);
    const options=await page.locator("#section-select option").count();assert(options>=2);
    const last=await page.locator("#section-select option").last().getAttribute("value");await page.locator("#section-select").selectOption(last);assert((await stateValue("index"))>0);
    await page.locator("#restart-button").click();assert.equal(await stateValue("index"),0);
   });
   await verify("copy current word",async()=>{await page.locator("#copy-word-button").click();assert.equal(await page.locator("#reader-status").textContent(),"Copied current word");assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await page.evaluate(()=>currentWord()));});
   await verify("3–2–1 countdown and Space/arrow shortcuts",async()=>{
    await page.locator("#play-button").focus();await page.keyboard.press("Space");assert.equal(await page.locator(".countdown-word").textContent(),"3");
    await page.waitForFunction(()=>state.countdownValue===2);assert.equal(await page.locator(".countdown-word").textContent(),"2");
    await page.waitForFunction(()=>state.countdownValue===1);assert.equal(await page.locator(".countdown-word").textContent(),"1");
    await page.waitForFunction(()=>state.playing);await page.keyboard.press("Space");assert.equal(await stateValue("playing"),false);
    await page.locator("#restart-button").click();await page.locator("#play-button").focus();await page.keyboard.press("ArrowRight");assert.equal(await stateValue("index"),1);await page.keyboard.press("ArrowLeft");assert.equal(await stateValue("index"),0);
   });
   await verify("focus mode",async()=>{await page.locator("#focus-mode-button").click();assert(await page.locator("body").evaluate(el=>el.classList.contains("focus-mode")));assert(await page.locator(".source-panel").isHidden());await page.locator("#focus-mode-button").click();});
   await verify("existing v1 resume compatibility",async()=>{
    await page.evaluate(()=>localStorage.setItem("wordflow-reader-session-v1",JSON.stringify({text:"Legacy first. Legacy second.",title:"Legacy session",index:2,wpm:450,punctuationPause:false,wordSize:"compact",contextWords:false})));
    await page.reload();await page.locator("#resume-button").click();assert.equal(await stateValue("index"),2);assert.equal(await stateValue("wpm"),450);assert.equal(await stateValue("sentencePause"),false);assert.equal(await stateValue("commaPause"),false);assert.equal(await stateValue("sourceTitle"),"Legacy session");
   });
   await verify("long-word fitting under CSP",async()=>{
    await page.locator("#text-input").fill("Pneumonoultramicroscopicsilicovolcanoconiosis done.");await page.locator("#load-text-button").click();await use();await page.locator('[data-size="large"]').click();
    await page.waitForFunction(()=>document.querySelector("#word-display").classList.contains("fitted-long-word"));
    const dimensions=await page.locator("#word-display").evaluate(el=>({word:el.getBoundingClientRect().width,frame:el.closest(".reader-frame").clientWidth}));
    assert(dimensions.word<=dimensions.frame,JSON.stringify(dimensions));
   });
   await verify("finish summary and restart",async()=>{
    await page.locator("#text-input").fill("Finish now.");await page.locator("#load-text-button").click();await use();await inputRange("wpm-slider",900);
    await page.locator("#play-button").click();await page.locator("#finish-summary").waitFor({state:"visible"});assert.equal(await page.locator("#finish-words").textContent(),"2");
    await page.locator("#finish-restart-button").click();assert.equal(await stateValue("index"),0);assert(await page.locator("#finish-summary").isHidden());
   });
   await verify("text, markdown, HTML and other text uploads",async()=>{
    for(const [name,mimeType,text] of [["fixture.txt","text/plain","Text file content."],["fixture.md","text/markdown","## Markdown\nBody content."],["fixture.csv","text/csv","Name,Value\nWordFlow,1"],["fixture.html","text/html","<html><title>HTML title</title><nav>Discard</nav><article><h1>HTML heading</h1><p>HTML body.</p></article></html>"],["fixture.htm","text/html","<p>HTM body.</p>"]]) {
     await page.locator("#tab-file").click();await page.locator("#file-input").setInputFiles({name,mimeType,buffer:Buffer.from(text)});
     await page.locator("#source-review").waitFor({state:"visible"});assert((await value("review-text")).length>0);
     if(name==="fixture.html"){assert.equal(await page.locator("#source-title").textContent(),"HTML heading");assert(!(await value("review-text")).includes("Discard"));}await use();
    }
   });
   await verify("PDF and DOCX uploads stay in browser",async()=>{
    for(const name of ["fixture.pdf","semantics.docx"]) {
     await page.locator("#tab-file").click();await page.locator("#file-input").setInputFiles(path.join(root,"tests/fixtures",name));
     await page.locator("#source-review").waitFor({state:"visible"});
     assert((await value("review-text")).includes(name.endsWith("pdf")?"WordFlow PDF fixture text.":"Character style heading"));await use();
    }
   });
   await verify("empty/encrypted warning review",async()=>{
    for(const name of ["empty.docx","encrypted.pdf"]) {
     await page.locator("#tab-file").click();await page.locator("#file-input").setInputFiles(path.join(root,"tests/fixtures",name));await page.locator("#source-review").waitFor({state:"visible"});
     assert((await page.locator("#source-warning").textContent()).includes(name.endsWith("docx")?"No readable text found in this DOCX.":"This PDF is encrypted and could not be read."));
     await page.locator("#review-back-button").click();
    }
   });
   await verify("24 MiB upload cap",async()=>{
    await page.locator("#file-input").setInputFiles({name:"large.txt",mimeType:"text/plain",buffer:Buffer.alloc(24*1024*1024+1)});
    await page.waitForFunction(()=>document.querySelector("#reader-status").textContent==="Upload is too large");
   });
   await verify("URL through local server, normalizeUrl and sourceFromHtml",async()=>{
    await page.locator("#tab-url").click();await page.locator("#url-input").fill("public-fixture.example/html");await page.locator("#load-url-button").click();await page.locator("#source-review").waitFor({state:"visible"});
    assert.equal(await page.locator("#source-title").textContent(),"Local fixture");assert((await value("review-text")).includes("WordFlow local HTML."));await use();
   });
   await verify("quota Error 1027 and fail-open marker keep site working",async()=>{
    for(const kind of ["1027","marker"]) {mode=kind;fallback=false;await page.locator("#tab-url").click();await page.locator("#url-input").fill("https://public-fixture.example/html");await page.locator("#load-url-button").click();await page.waitForFunction(message=>document.querySelector("#reader-status").textContent===message,LIMIT);assert.equal(await page.locator("#load-url-button").isEnabled(),true);assert(await page.locator("#word-display").isVisible());}
   });
   await verify("article text containing 1027 and the marker stays readable",async()=>{mode="article1027";await page.locator("#load-url-button").click();await page.locator("#source-review").waitFor({state:"visible"});assert.equal(await value("review-text"),"Article number 1027 mentions WORDFLOW_FREE_LIMIT.");await use();mode="marker";await page.locator("#load-url-button").click();await page.waitForFunction(message=>document.querySelector("#reader-status").textContent===message,LIMIT);});
   const quotaShot="static-quota-"+viewport.width+".png";await page.screenshot({path:path.join(out,quotaShot),fullPage:true});
   await verify("direct-fetch fallback succeeds after quota",async()=>{fallback=true;await page.locator("#load-url-button").click();await page.locator("#source-review").waitFor({state:"visible"});assert.equal(await value("review-text"),"Direct fallback text.");await use();mode="normal";fallback=false;});
   await page.locator("#sample-button").click();await use();
   await verify("responsive page has no horizontal overflow",async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)));
   const screenshot="static-reader-"+viewport.width+".png";await page.screenshot({path:path.join(out,screenshot),fullPage:true});
   result.viewports.push({viewport,checks,screenshots:[screenshot,quotaShot].map(file=>({file,sha256:sha(fs.readFileSync(path.join(out,file)))}))});
   await context.close();
  }
  assert.equal(result.errors.length,0);assert.equal(result.blocked.length,0);assert.equal(result.uploads,0);
  result.passed=result.viewports.reduce((n,v)=>n+v.checks.length,0);result.skipped=0;
 }finally{if(browser)await browser.close();await stop(server);}
 fs.writeFileSync(path.join(out,"static-smoke.json"),JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({passed:result.passed,viewports:result.viewports.length,errors:result.errors.length,uploadRequests:result.uploads}));
})().catch(e=>{console.error(e);process.exitCode=1;});
