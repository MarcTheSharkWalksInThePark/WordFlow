"use strict";
const fs=require("node:fs"),path=require("node:path"),root=process.cwd();
const {start,stop}=require(path.join(root,"tests/helpers.cjs")),{launch}=require(path.join(root,"tests/browser-helper.cjs"));
const home=require("node:os").homedir(),redact=s=>s.split(home).join("<home>");
(async()=>{const server=await start(root),browser=await launch();try{for(const order of ["before","after"]){
const out=path.resolve(__dirname,"../isolation-"+order),result={order,chrome:browser.version(),passed:0,failed:0,skipped:0,checks:[]};fs.mkdirSync(out,{recursive:true});
try{for(const width of [1400,390])await require(path.join(root,"tests/reader-portal.cjs")).portalChecks({browser,origin:"http://127.0.0.1:"+server.port,width,root,out,newChecksOrder:order,verify:async(name,fn)=>{try{await fn();result.passed++;result.checks.push({name,passed:true});console.log(order+" PASS "+name);}catch(e){result.failed++;result.checks.push({name,passed:false,error:redact(e.stack||String(e))});throw e;}}});}
finally{fs.writeFileSync(path.join(out,"checks.json"),JSON.stringify(result,null,2)+"\n");}
console.log(JSON.stringify({order,passed:result.passed,failed:result.failed,skipped:0}));
}}finally{await browser.close();await stop(server);}})().catch(e=>{console.error(redact(e.stack||String(e)));process.exitCode=1;});
