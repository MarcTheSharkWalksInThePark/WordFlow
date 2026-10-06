// Run after every Cloudflare master deployment; no dependencies or account access.
import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
export const LIVE_SITE = "https://wordflow-reader.pages.dev/";
export async function liveSmoke(site = LIVE_SITE, fetchImpl = fetch) {
  const base = new URL(site);
  assert(base.protocol === "https:" && !base.username && !base.password &&
    base.pathname === "/" && !base.search && !base.hash, "Supply an HTTPS site origin");
  const checks = [];
  for (const [name, target, expected] of [
    ["public HTML", "https://example.com/", 200],
    ["private refusal", "http://192.168.1.1/", 403],
    ["self refusal", base.href, 403]
  ]) {
    const endpoint = new URL("/api/read", base);
    endpoint.searchParams.set("url", target);
    const response = await fetchImpl(endpoint.href, {
      redirect: "manual", signal: AbortSignal.timeout(15000),
      headers: { accept: "application/json" }
    });
    assert.equal(response.status, expected, name + " HTTP status");
    assert.match(response.headers.get("content-type") || "", /^application\/json\b/i, name + " JSON response");
    const data = await response.json();
    if (expected === 200) {
      assert.match(data.contentType || "", /^text\/html\b/i, "public HTML content type");
      assert.equal(typeof data.body, "string");
      assert.match(data.body, /<html(?:\s|>)/i, "public HTML body");
      assert.match(data.body, /Example Domain/, "known public page content");
    } else assert.deepEqual(data, { error: "URL not allowed" }, name + " error contract");
    checks.push({ name, target, status: response.status, passed: true });
  }
  return { site: base.href, at: new Date().toISOString(), passed: checks.length, checks };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2), outIndex = args.indexOf("--out");
    if (outIndex >= 0) assert(args[outIndex + 1], "--out requires a filename");
    const positional = outIndex >= 0 ? args.slice(0, outIndex) : args;
    assert(positional.length <= 1 && (outIndex < 0 || outIndex + 2 === args.length),
      "Usage: node tools/live-smoke.mjs [https://site/] [--out result.json]");
    const result = await liveSmoke(positional[0]);
    if (outIndex >= 0) fs.writeFileSync(args[outIndex + 1], JSON.stringify(result, null, 2) + "\n");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error("Live smoke FAILED: " + error.message); process.exitCode = 1; }
}
