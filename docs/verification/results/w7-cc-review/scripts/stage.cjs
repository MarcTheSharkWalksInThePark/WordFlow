"use strict";
// Stage review evidence into <dest>, scrubbing absolute profile/scratch paths (W4.1).
const fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib"),os=require("node:os");
const SP=path.resolve(__dirname,".."),dest=process.argv[2];
const home=os.homedir();
const variants=s=>{const f=s.replace(/\\/g,"/");const c="/"+f[0].toLowerCase()+f.slice(2);return [s,s.replace(/\\/g,"\\\\"),f,c,s.replace(/\\/g,"\\\\\\\\")];};
const scrub=t=>{for(const v of variants(SP))t=t.split(v).join("<scratch>");for(const v of variants(home))t=t.split(v).join("<home>");return t;};
const copy=(src,rel,{gz=false}={})=>{const out=path.join(dest,rel+(gz?".gz":""));fs.mkdirSync(path.dirname(out),{recursive:true});
 const buf=fs.readFileSync(path.join(SP,src));const isText=/\.(json|txt|cjs|sh|md)$/.test(src);
 let data=isText?Buffer.from(scrub(buf.toString("utf8"))):buf;if(gz)data=zlib.gzipSync(data,{level:9});fs.writeFileSync(out,data);return out;};
const P="ev/runs/parity/docs_verification_results_post-review_";
const list=[
 ...["rv.cjs","geom.cjs","spec.cjs","contrast2.cjs","fs.cjs","flicker.cjs","flicker2.cjs","fade.cjs","focus.cjs","shots.cjs","sheet.cjs","mutants.cjs","exposure.cjs","widths.cjs","refit.cjs","stage.cjs","absent.sh"].map(f=>["scripts/"+f,"scripts/"+f]),
 ...["npmtest.txt","npmtest-2a37644.txt","absent.txt","parity.txt","mutations.txt","exposure.json","geometry.txt","geometry.json","spec.json","contrast.txt","contrast.json","widths.txt","widths.json",
   "fs-headless-1400.txt","fs-headless-390.txt","fs-headed-1400.txt","fullscreen-headless-1400.json","fullscreen-headless-390.json","fullscreen-headed-1400.json",
   "flicker-headless.txt","flicker-headless.json","flicker-headed.txt","flicker-headed.json","flicker2-headed.json","fade.txt","fade.json","focus.json","refit.txt",
   "build-base.txt","build-cand.txt","ids-2a37644.txt","ids-51e22d0.txt"].map(f=>["ev/runs/"+f,"runs/"+f]),
 ["ev/runs/mutations.json","runs/mutations.json",{gz:true}],
 ...["static-smoke.json","browser-parity.json","portal-1400-dark.json","portal-1400-light.json","portal-390-dark.json","portal-390-light.json","reader-1400.json","reader-390.json"].map(f=>[P+f,"runs/parity/"+f]),
 ...["reader-finished.json","reader-round2.json","wide-controls.json"].map(f=>[P+f,"runs/parity/"+f,{gz:true}]),
 ...["m1.json","m1b.json","m2.json","m3.json","m4.json","m1.log","m1b.log","m2.log","m3.log","m4.log"].map(f=>["ev/mutants/"+f,"mutants/"+f]),
 ...["sheet-1400-dark.png","sheet-1400-light.png","sheet-390.png","sheet-390-full.png","sheet-focus.png","sheet-finished.png","sheet-320.png","overflow-320-base.png","overflow-320-cand.png","m9-390-reading.png","codex-1400.png","codex-390.png"].map(f=>["ev/shots/"+f,"shots/"+f])
];
let n=0;for(const [s,r,o] of list){if(!fs.existsSync(path.join(SP,s))){console.log("MISSING",s);continue;}copy(s,r,o||{});n++;}
// verify no profile path remains in staged text
const bad=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else{
 let t=fs.readFileSync(p);if(p.endsWith(".gz"))t=zlib.gunzipSync(t);t=t.toString("latin1");
 const user=path.basename(home),probe=new RegExp("Users[\\\\/]+"+user+"\\b|/c/Users/|AppData|@gmail\\.","i");if(probe.test(t))bad.push(p);}}};walk(dest);
console.log("staged",n,"files; files still containing a profile path or gmail:",bad.length,bad.slice(0,5));
