"use strict";
const fs=require("node:fs");
function assertNoSkips(output) {
 for(const line of output.split(/\r?\n/)) {
  // Zero summaries are allowed; TAP directives and all other skip wordings fail closed.
  const rest=line.replace(/"(?:skipped(?:Count)?|skips)"\s*:\s*(?:"0"|0)(?=\s*[,}])/gi,"")
   .replace(/^(?:ℹ\s+)?skipped\s*:?\s*0\s*$/i,"");
  if(/\b(?:skip|skips|skipped|skippedCount|skipping)\b/i.test(rest))
   throw new Error("npm test skipped tests: "+line);
 }
}
if(require.main===module) {
 try {assertNoSkips(fs.readFileSync(process.argv[2],"utf8"));}
 catch(error) {console.error(error.message);process.exitCode=1;}
}
module.exports={assertNoSkips};
