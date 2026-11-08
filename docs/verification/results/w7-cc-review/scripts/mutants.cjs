"use strict";
// Hand mutants. Usage: node mutants.cjs <cloneDir> <outJson> <id,id,...>
// Each mutant: exact replacements (each old string must occur exactly once). "\n" in anchors is
// converted to the file's own EOL. Node suites first; if all pass, the full Chrome smoke
// (tools/static_smoke.cjs stops at its first failing check). Original bytes restored and verified.
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),{spawnSync}=require("node:child_process");
const [clone,outFile,ids]=process.argv.slice(2);
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const M={
 M1:["theme toggle writes localStorage","app.js",[['root.dataset.theme = effectiveTheme(root.dataset.theme, systemTheme.matches) === "dark" ? "light" : "dark";','root.dataset.theme = effectiveTheme(root.dataset.theme, systemTheme.matches) === "dark" ? "light" : "dark"; localStorage.setItem("wordflow-theme", root.dataset.theme);']]],
 M2a:["theme in saveSession payload (always defined)","app.js",[["      wordSize: state.wordSize,\n","      wordSize: state.wordSize,\n      theme: effectiveTheme(document.documentElement.dataset.theme, systemTheme.matches),\n"]]],
 M2b:["theme in saveSession payload (only after a manual toggle)","app.js",[["      wordSize: state.wordSize,\n","      wordSize: state.wordSize,\n      theme: document.documentElement.dataset.theme,\n"]]],
 M3:["F toggles fullscreen while a field is focused","app.js",[["  if (editable) return;","  if (editable && !fullscreenShortcut(event)) return;"]]],
 M4:["F toggles fullscreen with Ctrl held","app.js",[['(event.key === "f" || event.key === "F") && !event.ctrlKey && !event.metaKey','(event.key === "f" || event.key === "F") && !event.metaKey']]],
 M5:["fullscreen -/+ step 10 instead of 25","app.js",[['"#fullscreen-slower").addEventListener("click", () => setWpm(state.wpm - 25)','"#fullscreen-slower").addEventListener("click", () => setWpm(state.wpm - 10)'],['"#fullscreen-faster").addEventListener("click", () => setWpm(state.wpm + 25)','"#fullscreen-faster").addEventListener("click", () => setWpm(state.wpm + 10)']]],
 M6:["fallback does not turn on Focus mode","app.js",[["  if (!state.focusMode) toggleFocusMode();\n  setStatus(\"Fullscreen","  setStatus(\"Fullscreen"]]],
 M7:["fallback status text changed by one character","app.js",[["focus mode is on instead.\");","focus mode is on instead!\");"]]],
 M8:["auto-hide also while paused","app.js",[["if (!isReaderFullscreen() || !state.playing || state.countdownActive || state.finished) {","if (!isReaderFullscreen() || state.countdownActive || state.finished) {"]]],
 M9:["fullscreenchange no longer re-fits","app.js",[["  syncFullscreenControls();\n  fitDisplayedWord();\n}","  syncFullscreenControls();\n}"]]],
 M10:["one word of the privacy note changed","index.html",[["never uploaded. Links you load","never shared. Links you load"]]],
 M11:["style=\"\" attribute added in index.html","index.html",[['<div class="ticker">','<div class="ticker" style="">']]],
 M12:["ticker text changed","index.html",[["Press F for fullscreen.</span>","Press F for full screen.</span>"]]],
 M13:["light/dark label logic inverted","app.js",[['dark ? "Lights on" : "Lights off"','dark ? "Lights off" : "Lights on"']]],
 M14:["Large word size 128px -> 120px","styles.css",[[".word-display.large {\n  font-size: clamp(4rem, 10vw, 8rem);",".word-display.large {\n  font-size: clamp(4rem, 10vw, 7.5rem);"]]],
 M16:["extra: local server Permissions-Policy blocks fullscreen (native request rejects)","server.js",[['"permissions-policy": "accelerometer=(), ','"permissions-policy": "fullscreen=(), accelerometer=(), ']]],
 M15:["F1 floor 10px -> 9px","app.js",[["    let low = 10;","    let low = 9;"],["Math.max(10, Math.floor(low))","Math.max(9, Math.floor(low))"]]]
};
const results=fs.existsSync(outFile)?JSON.parse(fs.readFileSync(outFile,"utf8")):{};
const run=(args,label,timeout)=>{const t=Date.now();const r=spawnSync(process.execPath,args,{cwd:clone,encoding:"utf8",timeout,windowsHide:true,maxBuffer:256*1024*1024});
 const out=(r.stdout||"")+(r.stderr||"");return {label,status:r.status,signal:r.signal,ms:Date.now()-t,tail:out.split(/\r?\n/).filter(l=>/not ok|fail|error|assert|✗|FAIL|STOP|expected|Error:/i.test(l)).slice(0,12).map(l=>l.slice(0,400)),last:out.split(/\r?\n/).slice(-6)};};
for(const id of ids.split(",")){
 const [desc,file,reps]=M[id];const p=path.join(clone,file);const orig=fs.readFileSync(p);let text=orig.toString("utf8");
 const eol=text.includes("\r\n")?"\r\n":"\n";
 for(const [a,b] of reps){const A=a.replace(/\n/g,eol),B=b.replace(/\n/g,eol);const n=text.split(A).length-1;if(n!==1)throw new Error(id+": anchor occurs "+n+" times: "+a);text=text.replace(A,B);}
 const rec={id,desc,file,transform:reps,before:sha(orig),started:new Date().toISOString()};
 try{
  fs.writeFileSync(p,text);rec.mutated=sha(fs.readFileSync(p));
  const node=[];for(const s of ["tests/regression.cjs","tests/proxy.test.mjs","tests/server_exposure.test.js","tests/post-review.test.cjs"]){const r=run([s],s,900000);node.push(r);if(r.status!==0)break;}
  rec.node=node;const nodeRed=node.find(r=>r.status!==0);
  if(nodeRed){rec.verdict="KILLED";rec.caughtBy="Node "+nodeRed.label;}
  else{const out=path.join(path.dirname(outFile),"mut-out-"+id);fs.mkdirSync(out,{recursive:true});
   const r=run(["tools/static_smoke.cjs","--out-dir",out],"chrome smoke",5400000);rec.smoke=r;
   if(r.status!==0){rec.verdict="KILLED";rec.caughtBy="Chrome smoke";}else rec.verdict="SURVIVED";}
 }finally{fs.writeFileSync(p,orig);rec.restored=sha(fs.readFileSync(p));rec.restoredOk=rec.restored===rec.before;rec.finished=new Date().toISOString();}
 results[id]=rec;fs.writeFileSync(outFile,JSON.stringify(results,null,1));
 console.log(id,rec.verdict,rec.caughtBy||"",rec.restoredOk?"restored":"RESTORE FAILED",rec.smoke?Math.round(rec.smoke.ms/1000)+"s":"",(rec.smoke||rec.node.at(-1)).tail[0]||"");
}
