"use strict";
// Exact named asset list shared with localhost. Never copy the repository wholesale.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const root=path.join(__dirname,".."), out=path.join(root,"dist");
const source=fs.readFileSync(path.join(root,"server.js"),"utf8");
const declaration=/const STATIC_FILES = new Set\(\[[\s\S]*?\]\);/.exec(source);
if(!declaration) throw new Error("Static allowlist missing");
const files=vm.runInNewContext(declaration[0]+"\n[...STATIC_FILES]");
// Verified fixed workspace target before recursive removal.
if(path.dirname(out)!==root || path.basename(out)!=="dist") throw new Error("Unsafe output directory");
fs.rmSync(out,{recursive:true,force:true}); fs.mkdirSync(out);
for(const file of [...files,"_headers","_routes.json"]) {
  if(file.split("/").some(s=>s.startsWith(".")) || path.isAbsolute(file)) throw new Error("Unsafe asset name");
  fs.mkdirSync(path.dirname(path.join(out,file)),{recursive:true});
  fs.copyFileSync(path.join(root,file),path.join(out,file));
}
console.log(JSON.stringify({output:"dist",assets:files.length,configuration:["_headers","_routes.json"]}));
