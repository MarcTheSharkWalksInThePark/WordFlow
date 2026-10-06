"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
function runtime() {
 const candidates=[process.env.WORDFLOW_CHROME,path.join(process.env.ProgramFiles || "C:/Program Files","Google/Chrome/Application/chrome.exe"),"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].filter(Boolean);
 const executable=candidates.find(f=>fs.existsSync(f));if(!executable)throw new Error("Chrome is required; tests fail closed, no skips");
 let playwright;try{playwright=require("playwright");}catch{playwright=require(process.env.WORDFLOW_PLAYWRIGHT_DIR || path.join(os.homedir(),".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"));}
 return {playwright,executable};
}
async function launch() {
 const {playwright,executable}=runtime();
 const browser=await playwright.chromium.launch({executablePath:executable,headless:true,args:["--disable-background-networking","--disable-component-update","--disable-sync","--no-first-run","--disable-quic"]});
 return browser;
}
module.exports={runtime,launch};
