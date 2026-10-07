"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),{execFileSync}=require("node:child_process");
const vault=path.join(os.homedir(),"Documents/AI brain/AI brain"),head=execFileSync("git",["rev-parse","HEAD"]).toString().trim();
const time=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Oslo",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date());
const status="F1 candidate (W6.1-W6.12) committed on fix/f1-long-token, pending CC re-review; not yet fixed (W6.11).";
const smoke=JSON.parse(fs.readFileSync(path.join(__dirname,"parity/static-smoke.json"))),summary=status+" W6.12 recorded verbatim before code in ce27e09; local head "+head+". Master b9d3d9e untouched; nothing merged, pushed, deployed or installed. 505 Node checks / 0 skips; full parity 9 exact DOCX / 7 PDFs / "+smoke.passed+" smoke, 0 errors/uploads. All 36 cap probes rerun: 21 fully visible master controls (including eight round-2 counterexamples) byte/pixel identical on the controlled backdrop, 15 clipped cases fitted. 36 matrix combinations, 72 collision boundaries, 72 data/resume comparisons and nine preservation actions pass. 78 registered mutations unchanged (77 KILLED + equivalent M9); all eight CC hand-mutants KILLED in Node and Chrome. Scratch: 243 files inventoried; six cited/unclear unmatched files require retaining the entire folder. Generated 225-input stamp committed, only app.js changes from starting branch. No product STOP; harness cleanup and clipboard-wait repairs are documented. Report: <repo>/docs/verification/2026-10-07_codex_f1_round3.md.";
const handoff="\n\n## AI Handoff — WordFlow F1 round 3\n\n- Current objective: independent review of the W6.1-W6.12 candidate.\n- Last completed step: W6.12 ruling, candidate, complete verification, generated stamp and local commit.\n- Next: one CC re-review, then Marcus's merge/push decision via tools/push.sh; npm run smoke:live after deployment.\n- Blockers: no product STOP; CC acceptance pending; six retained scratch files await Marcus's disposition.\n- Human input: merge/push decision after review and scratch value/deletion decision.\n";
function appendFirst(relative,block,refresh) {
 const file=path.join(vault,relative);let s=fs.readFileSync(file,"utf8");
 fs.appendFileSync(file,"\n\n"+block+"\n");
 if(refresh){s=fs.readFileSync(file,"utf8");const next=refresh(s);if(next!==s)fs.writeFileSync(file,next);}
}
const heading="### 2026-10-07 "+time+" +02:00 - codex - WordFlow F1 round 3 candidate; CC re-review next";
appendFirst("03_Projects/Active/WordFlow.md",heading+"\n\n"+summary+handoff,s=>s
 .replace(/^phase:.*$/m,'phase: "Live; F1 candidate pending CC re-review"')
 .replace(/^milestone_current:.*$/m,'milestone_current: "Independent CC re-review of W6.1-W6.12 candidate"')
 .replace(/^decision_prompt:.*$/m,'decision_prompt: "One CC re-review, then Marcus decides merge/push; retained scratch value needs Marcus."')
 .replace(/^next_action:.*$/m,'next_action: "One CC re-review; Marcus merge/push decision; post-deploy smoke:live."')
 .replace(/^- \*\*F1 \/ W6\.7-W6\.11:\*\*.*$/m,"- **F1 / W6.1-W6.12:** "+status+" Master b9d3d9e unchanged. Report: <repo>/docs/verification/2026-10-07_codex_f1_round3.md. Scratch retained under Marcus's value test."));
appendFirst("04_Knowledge/LLM_Wiki/hot-cache.md",heading+"\n\n"+summary,s=>s
 .replace(/^- \*\*WordFlow:\*\*.*$/gm,"- **WordFlow:** "+status+" One CC re-review, then Marcus's merge/push decision; post-deploy smoke:live. Six scratch files retained for Marcus. Other project lanes remain unchanged.")
 .replace(/^- \*\*Current WordFlow task:\*\*.*$/m,"- **Current WordFlow task:** "+status+" W6.12 resolves the round-2 STOP; all tested visible tokens remain unchanged. Nothing pushed/deployed.")
 .replace(/^- \*\*WordFlow W6\.8 STOP:\*\*.*$/m,"- **WordFlow review gate:** candidate verified by builder; CC re-review pending. Scratch retained because six cited/unclear files differ from committed bytes. Platform runtime checks remain unverified.")
 .replace(/### Current WordFlow handoff — 2026-10-07[\s\S]*?(?=### Retained MarcDeck guard context)/,"### Current WordFlow handoff — 2026-10-07\n\n- Current objective: independent CC re-review of the W6.1-W6.12 candidate.\n- Last completed step: ruling ce27e09, verified candidate, generated stamp, local commit "+head+".\n- Next: one CC re-review, Marcus's merge/push decision, then post-deploy smoke:live.\n- Blockers: not yet fixed (W6.11); scratch retained for Marcus; platform checks unverified.\n- Files: WordFlow round-3 report/evidence, project, worklogs and current-state.\n- Human input: merge/push after review and retained scratch disposition.\n\n"));
appendFirst("04_Knowledge/LLM_Wiki/current-state.md",heading+"\n\n"+summary+handoff,s=>s.replace("## Snapshot\n","## Snapshot\n\n"+heading+"\n\n"+status+" Local head "+head+"; prior dated STOP entries below are historical and superseded by Marcus's W6.12. Next: one CC re-review, Marcus merge/push decision, then smoke:live after deployment. Scratch retained; nothing pushed/deployed.\n"));
appendFirst("09_AI_Worklog/Codex/2026-10-07_codex-log.md","### "+time+" - WordFlow F1 round 3 (Codex gpt-6.1-sol, high)\n\n"+summary+"\n\nRequested 19:15 Claude relay appended verbatim. Vault project/cache/state/index/log synchronized append-first. Daily note absent; none created."+handoff);
appendFirst("04_Knowledge/LLM_Wiki/index.md",heading+"\n\nWordFlow catalog refreshed for the W6.12 candidate and next review; other project rows retained.",s=>s.replace(/^- \[\[03_Projects\/Active\/WordFlow\|WordFlow\]\].*$/m,"- [[03_Projects/Active/WordFlow|WordFlow]] - "+status+" Builder verification passes; one CC re-review next. Scratch retained; no merge/push/deploy."));
appendFirst("04_Knowledge/LLM_Wiki/log.md",heading+"\n\n"+summary+" Project, cache, current-state, index and worklogs refreshed; prior dated history and other project state retained.");
const daily=path.join(vault,"01_Daily/2026/2026-10-07.md");
if(fs.existsSync(daily)) {
 let s=fs.readFileSync(daily,"utf8");if(!s.includes("## AI Activity"))fs.appendFileSync(daily,"\n\n## AI Activity\n");
 s=fs.readFileSync(daily,"utf8");fs.writeFileSync(daily,s.replace("## AI Activity\n","## AI Activity\n\n- "+time+" - Codex: WordFlow W6.12 candidate committed/verified; vault synchronized; one CC re-review next; scratch retained for Marcus.\n"));
 console.log("Existing daily note updated.");
}else console.log("Daily note absent; not created.");
console.log("Vault project/cache/state/index/log and Codex worklog updated append-first.");
