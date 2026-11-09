"use strict";
const fs=require("node:fs"),path=require("node:path"),root=process.cwd();
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const out=path.resolve(process.argv[2]||path.join(__dirname,"../portal"));fs.mkdirSync(out,{recursive:true});
(async()=>{const server=await start(root),browser=await launch(),checks=[];try{for(const width of [1400,390])await require(path.join(root,"tests/reader-portal.cjs")).portalChecks({browser,origin:"http://127.0.0.1:"+server.port,width,root,out,verify:async(name,fn)=>{try{await fn();checks.push({name,passed:true});console.log("PASS "+name);}catch(e){console.error("FAIL "+name);throw e;}}});}finally{await browser.close();await stop(server);fs.writeFileSync(path.join(out,"checks.json"),JSON.stringify(checks,null,2)+"\n");}console.log(JSON.stringify({passed:checks.length,skipped:0}));})().catch(e=>{console.error(e);process.exitCode=1;});
