"use strict";
const fs = require('node:fs'), cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  const sha = cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assert.equal(sha,'131713ed8ba6bb8b53d036340046010ebf2abb6c');
  const result = {sha,at:new Date().toISOString(), explanation:'Git blobs contain LF; .gitattributes prescribes CRLF checkout bytes for these four production assets.',rows:[]};
  try {
    for (const file of ['app.js','index.html','styles.css','assets/wordflow-mark.svg']) {
      const raw = cp.execFileSync('git',['show',sha+':'+file]);
      const checkout = fs.readFileSync(file);
      assert.deepEqual(checkout,Buffer.from(raw.toString('utf8').replace(/\r?\n/g,'\r\n')),file+' checkout must equal prescribed committed content');
      const response = await fetch('https://wordflow-reader.pages.dev/'+file);
      const production = Buffer.from(await response.arrayBuffer());
      const row = {file,status:response.status,rawGitBlobSha256:hash(raw),checkoutSha256:hash(checkout),productionSha256:hash(production),matchesCheckout:production.equals(checkout)};
      result.rows.push(row); assert.equal(row.status,200); assert(row.matchesCheckout,file+' production mismatch');
    }
    result.passed = true;
  } catch (e) {result.passed=false;result.failure=e.stack;process.exitCode=1;}
  fs.writeFileSync(__dirname+'/deployment-assets-resumed.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})();
