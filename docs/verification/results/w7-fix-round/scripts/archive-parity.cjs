"use strict";
// Retain final traces once, gzip large JSON, then restore historical artifacts.
// Cleanup is restricted to individually named generated JSON/PNG files under the
// parity output directory; no recursive deletion or other source edits.
const fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib"),assert=require("node:assert/strict"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const root=process.cwd(),out=path.resolve(__dirname,".."),from=path.join(root,"docs/verification/results/post-review"),target=path.join(out,"parity"),sha=b=>crypto.createHash("sha256").update(b).digest("hex");fs.mkdirSync(target,{recursive:true});
const smoke=JSON.parse(fs.readFileSync(path.join(from,"static-smoke.json")));assert.equal(smoke.error,undefined,"parity failed");assert(smoke.viewports.length===2);
const selected=["browser-parity.json","static-smoke.json","reader-1400.json","reader-390.json","reader-round2.json","wide-controls.json","reader-finished.json",...fs.readdirSync(from).filter(f=>/^portal-(?:regressions-)?(?:1400|390)-(?:dark|light)\.json$/.test(f))];
const result={source:"docs/verification/results/post-review",archive:[],historicalRestored:[],generatedRemoved:[],omittedIntermediates:"finished-0..3 batch files are represented in the final combined reader-finished.json"};
for(const file of selected){const raw=fs.readFileSync(path.join(from,file)),gzip=raw.length>100000,stored=file+(gzip?".gz":""),bytes=gzip?zlib.gzipSync(raw,{level:9}):raw;fs.writeFileSync(path.join(target,stored),bytes);assert((gzip?zlib.gunzipSync(bytes):bytes).equals(raw));result.archive.push({source:file,file:"parity/"+stored,uncompressedBytes:raw.length,sha256:sha(raw),storedSha256:sha(bytes)});}
const screens=path.join(out,"screens");fs.mkdirSync(screens,{recursive:true});const screenFrom=path.join(root,"docs/verification/results/w7-restyle/screens");for(const file of fs.readdirSync(screenFrom).filter(f=>/^(1400|390)-(dark|light)-.*\.png$/.test(f)))fs.copyFileSync(path.join(screenFrom,file),path.join(screens,file));
// git paths are NUL-separated and relative to root. The initial tree was clean.
const status=execFileSync("git",["status","--porcelain=v1","-z","--untracked-files=all"],{cwd:root}).toString("utf8").split("\0").filter(Boolean),restore=[];
for(const row of status){const flag=row.slice(0,2),rel=row.slice(3);if(!rel.startsWith("docs/verification/results/post-review/")&&!rel.startsWith("docs/verification/results/w7-restyle/screens/"))continue;
 const full=path.resolve(root,rel),prefix=rel.startsWith("docs/verification/results/post-review/")?from:screenFrom;assert(full.startsWith(prefix+path.sep),"unsafe artifact path");assert(/\.(json|png)$/.test(rel),"unexpected artifact extension");
 if(flag==="??"){assert(full.startsWith(from+path.sep));fs.unlinkSync(full);result.generatedRemoved.push(rel);}else{assert.equal(flag," M","unexpected artifact status "+flag);restore.push(rel);result.historicalRestored.push(rel);}}
if(restore.length)execFileSync("git",["restore","--",...restore],{cwd:root,windowsHide:true});
fs.writeFileSync(path.join(out,"parity-archive.json"),JSON.stringify(result,null,2)+"\n");console.log(JSON.stringify({archivedTraces:result.archive.length,screens:fs.readdirSync(screens).length,restored:restore.length,removedGenerated:result.generatedRemoved.length}));
