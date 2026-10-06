// Temporary, secret-free build-time switch. Remove this route with the production fix.
import { checkDNS, limitedText } from "../../lib/read-proxy.mjs";
const ENABLE_DIAGNOSTIC = true;
const TARGETS = ["https://example.com/", "https://en.wikipedia.org/"];
const headers = {
  "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
  "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
};
const errorInfo = error => ({ name: error.name, message: error.message });
export async function onRequest({ request }) {
  // No query, body, headers or caller-controlled destination is used by the diagnostic.
  if (!ENABLE_DIAGNOSTIC || request.method !== "GET" || new URL(request.url).search) {
    return new Response(null, { status: 404, headers });
  }
  const results = [];
  for (const target of TARGETS) {
    const steps = [];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const observedFetch = async (url, options) => {
      const step = { step: "doh-fetch", type: new URL(url).searchParams.get("type") };
      steps.push(step);
      try {
        const response = await fetch(url, options);
        step.status = response.status;
        return response;
      } catch (error) { step.error = errorInfo(error); throw error; }
    };
    try {
      // Same DNS fetch options, bounded reader and IP classification as /api/read.
      await checkDNS(new URL(target).hostname, observedFetch, controller.signal);
      steps.push({ step: "doh-read-and-validate", status: "ok" });
      const response = await fetch(target, {
        redirect: "manual", signal: controller.signal,
        headers: { "user-agent": "WordFlow Reader/1.0" }
      });
      steps.push({ step: "target-fetch", status: response.status });
      const body = await limitedText(response, 3 * 1024 * 1024, controller.signal);
      steps.push({ step: "target-read", status: "ok", characters: body.length });
      results.push({ target, steps });
    } catch (error) { results.push({ target, steps, error: errorInfo(error) }); }
    finally { clearTimeout(timer); }
  }
  return new Response(JSON.stringify({ diagnostic: "live-url-2026-10-06", results }), { headers });
}
