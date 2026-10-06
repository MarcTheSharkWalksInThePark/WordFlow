"use strict";
const fs=require("node:fs"),path=require("node:path");
const {start,stop,assert,sha}=require("./helpers.cjs"),{launch}=require("./browser-helper.cjs");
const root=path.join(__dirname,".."),fixtures=path.join(__dirname,"fixtures");
(async()=>{
 let browser,server;const result={docx:[],pdf:[],errors:[],nativeDeflateRaw:false};
 try {
  server=await start(root);browser=await launch();
  const context=await browser.newContext(),origin="http://127.0.0.1:"+server.port;
  await context.route("**/*",route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  const page=await context.newPage();page.on("pageerror",e=>result.errors.push(e.message));
  await page.goto(origin);result.chrome=browser.version();
  result.nativeDeflateRaw=await page.evaluate(()=>{new DecompressionStream("deflate-raw");return true;});
  for(const name of fs.readdirSync(fixtures).filter(f=>/\.(pdf|docx)$/.test(f)).sort()) {
   const raw=fs.readFileSync(path.join(fixtures,name)),goldenFile=path.join(fixtures,name+".golden.json");
   const actual=await page.evaluate(async ({name,base64})=>{
    const {extractDocx,extractPdf}=await import("./file-extractors.mjs");
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    return name.endsWith(".docx")?extractDocx(bytes,name):extractPdf(bytes,name);
   },{name,base64:raw.toString("base64")});
   const golden=fs.existsSync(goldenFile)?JSON.parse(fs.readFileSync(goldenFile,"utf8")):null;
   const pyBytes=Buffer.from("{"+Object.entries(actual).map(([k,v])=>JSON.stringify(k)+": "+JSON.stringify(v)).join(", ")+"}\n");
   // Array warnings spacing matters if more than one; DOCX has at most one.
   const same=golden && pyBytes.equals(fs.readFileSync(goldenFile));
   const entry={file:name,actual,golden,identical:same,actualPayloadSha256:sha(pyBytes),
    differences:golden?Object.keys(actual).filter(k=>JSON.stringify(actual[k])!==JSON.stringify(golden[k])).map(field=>({field,pypdf:golden[field],pdfjs:actual[field]})):[{field:"baseline",pypdf:"FileNotDecryptedError: File has not been decrypted",pdfjs:actual}]};
   if(name.endsWith(".docx")) {result.docx.push(entry);assert(same,"DOCX byte parity "+name+"\n"+JSON.stringify(entry));}
   else {
    result.pdf.push(entry);
    if(name==="encrypted.pdf") {
     assert.equal(golden,null);
     assert.deepEqual(actual,{title:"encrypted.pdf",contentType:"application/pdf",body:"",warnings:["This PDF is encrypted and could not be read."]});
     const capture=JSON.parse(fs.readFileSync(path.join(fixtures,"capture.json"),"utf8"));
     assert.equal(capture.records.find(r=>r.file===name).baselineError,"FileNotDecryptedError: File has not been decrypted");
    } else if(name==="hyphenation.pdf") {
     assert.deepEqual(golden,{title:"Hyphenated article",contentType:"application/pdf",body:"A word is hyphen-\nated across lines.\nWide    spacing remains.",warnings:[]});
     assert.deepEqual(actual,{...golden,body:"A word is hyphen-\nated across lines.\nWide spacing remains."});
    } else assert(same,"PDF byte parity "+name+"\n"+JSON.stringify(entry));
   }
  }
  assert.equal(result.errors.length,0);
  result.docxPassed=result.docx.filter(r=>r.identical).length;
  result.docxMismatches=result.docx.filter(r=>!r.identical).length;
  result.pdfCompared=result.pdf.length;result.pdfDifferences=result.pdf.filter(r=>r.differences.length).length;
  assert.equal(result.pdfCompared,7);assert.equal(result.pdfDifferences,2);
  result.passed=true;
 }finally{if(browser)await browser.close();await stop(server);}
 const i=process.argv.indexOf("--out");if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({suite:"browser-parity",docx:result.docxPassed,mismatches:result.docxMismatches,pdfCompared:result.pdfCompared,pdfDifferences:result.pdfDifferences,skipped:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
