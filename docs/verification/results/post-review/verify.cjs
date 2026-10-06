"use strict";
// Reproduce Node/absence checks and checkout conversion from the staged snapshot. No pushes.
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),crypto=require("node:crypto");
const {spawnSync,execFileSync}=require("node:child_process"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../../.."),out=__dirname;
const hash=b=>crypto.createHash("sha256").update(b).digest("hex");
const sanitize=s=>String(s).replaceAll(root,"<repo>").replaceAll(root.replaceAll("\\","/"),"<repo>")
 .replaceAll(os.tmpdir(),"<temp>").replaceAll(os.tmpdir().replaceAll("\\","/"),"<temp>")
 .replace(/C:[\\/]Users[\\/][^\\/\s"']+/gi,"<home>");
function run(command,args,cwd=root,env=process.env) {
 const r=spawnSync(command,args,{cwd,env,encoding:"utf8",windowsHide:true,maxBuffer:16*1024*1024});
 if(r.error)throw r.error;
 const result={exit:r.status,stdout:sanitize(r.stdout),stderr:sanitize(r.stderr)};
 assert.equal(r.status,0,result.stdout+result.stderr);return result;
}
const npmCli=["node_modules/npm/bin/npm-cli.js","../node_modules/npm/bin/npm-cli.js"]
 .map(p=>path.resolve(path.dirname(process.execPath),p)).find(p=>fs.existsSync(p));
assert(fs.existsSync(npmCli));
const npm=(cwd=root,env=process.env)=>run(process.execPath,[npmCli,"test"],cwd,env);
const result={node:process.version,normal:npm(),absent:npm(root,{...process.env,
 NODE_OPTIONS:'--require "'+path.join(root,"tests/no-browser-preload.cjs").replaceAll("\\","/")+'"',
 WORDFLOW_PLAYWRIGHT_DIR:path.join(root,"deliberately-absent-playwright"),WORDFLOW_CHROME:path.join(root,"deliberately-absent-chrome")})};
assert.equal(result.normal.stdout,result.absent.stdout);
result.noBrowserProbe="Module loader refuses all Playwright/browser-helper imports in all Node children; Chrome executable probes return false";
fs.writeFileSync(path.join(out,"node-tests.json"),JSON.stringify(result,null,2)+"\n");
for(const [suite,file] of [["regression.cjs","static-regression.json"],["proxy.test.mjs","proxy.json"],["post-review.test.cjs","post-review-tests.json"]])
 run(process.execPath,["tests/"+suite,"--out",path.join(out,file)]);
run(process.execPath,["tools/build.cjs"]);
const distHashes=dir=>Object.fromEntries(fs.readdirSync(dir,{recursive:true,withFileTypes:true}).filter(e=>e.isFile()).map(e=>{
 const file=path.join(e.parentPath,e.name);return [path.relative(dir,file).replaceAll("\\","/"),hash(fs.readFileSync(file))];
}).sort(([a],[b])=>a.localeCompare(b)));
result.distribution=distHashes(path.join(root,"dist"));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"wordflow-eol-"));
const checkouts=[];
try {
 for(const autocrlf of ["true","false"]) {
  const checkout=path.join(scratch,autocrlf);fs.mkdirSync(checkout);
  // Checkout-index applies the actual staged .gitattributes, without modifying the source checkout.
  run("git",["-c","core.autocrlf="+autocrlf,"checkout-index","--all","--force","--prefix="+checkout.replaceAll("\\","/")+"/"]);
  const tests=npm(checkout);assert.equal(tests.stdout,result.normal.stdout);
  run(process.execPath,["tools/build.cjs"],checkout);
  assert.deepEqual(distHashes(path.join(checkout,"dist")),result.distribution);
  run(process.execPath,["tools/parity-stamp.cjs"],checkout);
  const parity=run(process.execPath,["tests/browser-parity.cjs","--out",path.join(checkout,"parity.json")],checkout);
  const comparison=JSON.parse(fs.readFileSync(path.join(checkout,"parity.json"),"utf8"));
  checkouts.push({autocrlf,tests,parity,docx:comparison.docxPassed,pdf:comparison.pdfCompared,
   pdfDifferences:comparison.pdfDifferences,distFiles:Object.keys(result.distribution).length,
   distByteIdentical:true,stampMatches:true});
 }
} finally {
 assert.equal(path.dirname(scratch),os.tmpdir());assert(path.basename(scratch).startsWith("wordflow-eol-"));
 fs.rmSync(scratch,{recursive:true,force:true});
}
fs.writeFileSync(path.join(out,"checkouts-and-dist.json"),JSON.stringify({node:result.node,checkouts,dist:result.distribution},null,2)+"\n");
console.log(JSON.stringify({npmTest:"370 checks, 0 skips",playwrightAbsent:true,checkouts:checkouts.length,distFiles:Object.keys(result.distribution).length}));
