const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const {execFileSync}=require("node:child_process"),assert=require("node:assert/strict");
const root=path.join(__dirname,".."),hash=x=>crypto.createHash("sha256").update(x).digest("hex");
const source=fs.readFileSync(path.join(root,"server.js"),"utf8");
const files=vm.runInNewContext(/const STATIC_FILES = new Set\(\[[\s\S]*?\]\);/.exec(source)[0]+"\n[...STATIC_FILES]");
const baseline="57ca645d7ff62dc464df086dd81c1fe1a230f10d";
const old=execFileSync("git",["show",baseline+":server.js"],{cwd:root,encoding:"utf8"});
const functionText=(s,n)=>new RegExp("^(?:async )?function "+n+"\\([^)]*\\) \\{[\\s\\S]*?^\\}","m").exec(s.replaceAll("\r\n","\n"))[0];
const preserved=["listen","startupWarning","serverOptions","isAllowedHostHeader","isLoopbackHost","resolveStaticPath","isRefusedStaticPath","sendText"];
for(const n of preserved)assert.equal(functionText(source,n),functionText(old,n),n+" R59 preservation");
const oldSpec=JSON.parse(execFileSync("git",["show",baseline+":tools/r59.spec.json"],{cwd:root,encoding:"utf8"}));
const spec=JSON.parse(fs.readFileSync(path.join(root,"tools/r59.spec.json"),"utf8"));
for(let i=0;i<46;i++)assert.deepEqual(spec.mutations[i],oldSpec.mutations[i],"R59 original row "+i);
const app=fs.readFileSync(path.join(root,"app.js"),"utf8"),oldApp=execFileSync("git",["show",baseline+":app.js"],{cwd:root,encoding:"utf8"});
const reader=["loadText","buildReadingModel","wordDelay","focusIndexFor","renderWord","fitDisplayedWord","renderProgress","renderControls","renderCountdown","renderContextWords","renderFinishSummary","renderSections","play","startReading","pause","completeReading","seekTo","rewindSentence","startCountdown","cleanupSourceText","sourceFromHtml","normalizeUrl","fetchDirectly","readFileAsText","saveSession","readSavedSession","restoreSession","setWordSize","toggleFocusMode","copyCurrentWord"];
for(const n of reader)assert.equal(functionText(app,n),functionText(oldApp,n),n+" reader preservation");
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.relative(path.join(root,"dist"),path.join(dir,e.name)).replaceAll("\\","/")]);}
const assets=walk(path.join(root,"dist")).sort();
assert.deepEqual(assets,[...files,"_headers","_routes.json"].sort());
const routes=JSON.parse(fs.readFileSync(path.join(root,"dist/_routes.json"),"utf8"));
assert.deepEqual(routes,{version:1,include:["/api/read"],exclude:[]});
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");assert(!/\sstyle=|<style\b|<script(?![^>]*\bsrc=)/i.test(html));
assert(!files.some(f=>f.split("/").some(s=>s.startsWith(".") || s.includes("*"))));
for(const f of files)assert(fs.statSync(path.join(root,f)).size<25*1024*1024);
const mutation=JSON.parse(fs.readFileSync(path.join(root,"docs/verification/results/static-mutations.json"),"utf8"));
for(const row of mutation.rows){assert.equal(hash(fs.readFileSync(path.join(root,row.file))),row.beforeSha256);assert.equal(row.beforeSha256,row.restoredSha256);}
const tracked=execFileSync("git",["ls-files"],{cwd:root,encoding:"utf8"}).split("\n");
assert(!tracked.some(f=>f.split("/").some(s=>s.startsWith(".env"))));
const result={node:process.version,baseline,staticAssets:files.length,distFiles:assets.length,originalMutationRowsUnchanged:46,preservedR59Helpers:preserved,preservedReaderHelpers:reader,
 securityHeaders:fs.readFileSync(path.join(root,"_headers"),"utf8"),inlineStyleNeeded:false,mutationHashesMatch:true,trackedEnvPaths:0,
 serverSha256:hash(fs.readFileSync(path.join(root,"server.js"))),proxySha256:hash(fs.readFileSync(path.join(root,"lib/read-proxy.mjs"))),
 notVerified:["Cloudflare deployment","edge CPU","real quota status/body and fail-open routing","dashboard logging","other browsers","Windows 8.3 names","older Node"]};
fs.writeFileSync(path.join(root,"docs/verification/results/static-final-checks.json"),JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify({assets:files.length,distFiles:assets.length,readerHelpers:reader.length,R59Helpers:preserved.length,unchangedMutations:46,passed:true}));
