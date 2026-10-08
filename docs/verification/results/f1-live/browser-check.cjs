"use strict";
// Scoped post-deployment check; existing Playwright and installed Chrome only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {launch,runtime}=require('../../../../tests/browser-helper.cjs');
const {start,stop,sha}=require('../../../../tests/helpers.cjs');
const root=path.resolve(__dirname,'../../../..'),site='https://wordflow-reader.pages.dev/';
const out=__dirname,REAL='Pneumonoultramicroscopicsilicovolcanoconiosis';
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function paste(p,text){
 await p.locator('[data-tab="paste"]').click();
 await p.locator('#text-input').fill(text);await p.locator('#load-text-button').click();
 await p.locator('#apply-source-button').click();await p.locator('#review-back-button').click();await settle(p);
 await p.locator('#wpm-slider').evaluate(e=>{e.value='900';e.dispatchEvent(new Event('input',{bubbles:true}));});
}
async function measure(p){return p.evaluate(()=>{
 const e=els.wordDisplay,f=e.closest('.reader-frame'),range=document.createRange();range.selectNodeContents(e);
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const r=rect(range),b=rect(f),s=getComputedStyle(f),inner={left:b.x+parseFloat(s.borderLeftWidth),top:b.y+parseFloat(s.borderTopWidth),right:b.right-parseFloat(s.borderRightWidth),bottom:b.bottom-parseFloat(s.borderBottomWidth)};
 return {text:e.textContent,font:getComputedStyle(e).fontSize,word:rect(e),content:r,inner,classes:e.className,finished:state.finished,playing:state.playing,index:state.index,noteHidden:els.longTextNote.hidden,note:els.longTextNote.textContent,inside:r.x>=inner.left-.1&&r.right<=inner.right+.1&&r.y>=inner.top-.1&&r.bottom<=inner.bottom+.1};
});}
(async()=>{let browser,server;const result={site,at:new Date().toISOString(),browserPlugin:'not available; Marcus explicitly requested existing Playwright and installed Chrome',playwright:runtime().playwrightVersion,rows:[],errors:[],pageLoads:0};
 try{
  server=await start(root);browser=await launch();result.chrome=browser.version();
  for(const viewport of (process.argv.includes('--desktop-only')?[{width:1920,height:1080}]:[{width:390,height:844},{width:1920,height:1080}])){
   const row={viewport};
   for(const [label,url] of [['local','http://127.0.0.1:'+server.port+'/'],['live',site]]){
    const context=await browser.newContext({viewport});const p=await context.newPage();
    p.on('pageerror',e=>result.errors.push({label,message:e.message}));
    p.on('console',m=>{if(m.type()==='error')result.errors.push({label,message:m.text()});});
    await p.goto(url);result.pageLoads++;assert.match(await p.title(),/WordFlow/i);assert(await p.locator('#text-input').isVisible());
    await paste(p,'A short text ending in understanding.');await p.locator('#play-button').click();
    await p.waitForFunction(()=>state.finished,{timeout:15000});await settle(p);
    row[label]=await measure(p);assert.equal(row[label].text,'understanding.');assert(row[label].inside);assert(row[label].noteHidden);
    await p.screenshot({path:path.join(out,`finished-${label}-${viewport.width}.png`),fullPage:false});
    if(label==='live'){
     const response=await context.request.get(site+'app.js');assert.equal(response.status(),200);assert.equal(sha(await response.body()),sha(fs.readFileSync(path.join(root,'app.js'))));
     if(viewport.width===1920){await paste(p,'Lead '+REAL+' Tail.');await p.locator('[data-size="large"]').click();await p.locator('#next-button').click();await settle(p);row.real45=await measure(p);assert.equal(row.real45.text,REAL);assert(row.real45.inside);}
     await paste(p,'Lead '+'W'.repeat(2000)+' Tail End.');await p.locator('#play-button').click();
     await p.waitForFunction(()=>state.index===1&&els.wordDisplay.classList.contains('wrapped-long-word'),null,{timeout:15000});await p.evaluate(()=>window.scrollTo(0,0));await settle(p);
     if(viewport.width===1920){row.w2000=await measure(p);assert(row.w2000.classes.includes('wrapped-long-word'));assert(row.w2000.noteHidden);assert(row.w2000.inside);row.w2000Behavior='wraps within available height; no scroll pause required under W6.7';await p.locator('#play-button').click();}
     else {
     row.w2000=await measure(p);assert(row.w2000.classes.includes('wrapped-long-word'));assert(!row.w2000.noteHidden);assert.equal(row.w2000.note,'Long text paused — scroll to read, then press play.');
     await p.screenshot({path:path.join(out,`w2000-live-${viewport.width}.png`),fullPage:false});
     await p.locator('#play-button').click();row.onePlay=await p.evaluate(()=>({index:state.index,countdown:state.countdownActive}));assert.equal(row.onePlay.index,2);assert(row.onePlay.countdown);
     await p.waitForFunction(()=>state.finished,null,{timeout:15000});row.continued=true;
     }
    }
    await context.close();
   }
   assert.deepEqual(row.live,row.local,'live finished result must match reviewed local branch');result.rows.push(row);
  }
  assert.deepEqual(result.errors,[]);result.passed=true;fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }catch(e){result.passed=false;result.failure=e.message;fs.writeFileSync(path.join(out,'browser-check.json'),JSON.stringify(result,null,2)+'\n');throw e;}
 finally{if(browser)await browser.close();if(server)await stop(server);}
})().catch(e=>{console.error(e);process.exitCode=1;});
