const fs=require("node:fs");
const file="app.js";
fs.writeFileSync(file,fs.readFileSync(file,"utf8").replace(/\r?\n/g,"\r\n"));
const path=require("node:path");
function logs(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 const p=path.join(dir,e.name);if(e.isDirectory())logs(p);
 else if(e.name.endsWith(".txt"))fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace(/\r\n/g,"\n").replace(/[ \t]+$/gm,"").trimEnd()+"\n");
}}
logs(__dirname);
