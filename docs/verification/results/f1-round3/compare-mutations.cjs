const fs=require("node:fs"),assert=require("node:assert/strict");
const prior=JSON.parse(fs.readFileSync("docs/verification/results/f1-round2/mutations.json")),current=JSON.parse(fs.readFileSync("docs/verification/results/f1-round3/mutations.json"));
const fields=["id","origin","source","file","suite","transform","sourceSpec","sourceCommit","targetCommand","adaptation","verdict","expected","beforeSha256","mutatedSha256","restoredSha256"];
const comparable=row=>Object.fromEntries(fields.map(k=>[k,row[k]]));
assert.equal(current.rows.length,78);assert.deepEqual(current.rows.map(comparable),prior.rows.map(comparable));
assert.equal(current.rows.filter(r=>r.verdict==="KILLED").length,77);
for(const row of current.rows)assert.equal(row.beforeSha256,row.restoredSha256);
fs.writeFileSync("docs/verification/results/f1-round3/mutation-comparison.json",JSON.stringify({rows:78,equal:true,killed:77,equivalent:"M9",comparedFields:fields,hashRestorations:true,runOutput:"fresh run logs retained; volatile temp names/timing are not equality fields"},null,2)+"\n");
console.log("78 rows identical to round 2; 77 KILLED + equivalent M9.");
