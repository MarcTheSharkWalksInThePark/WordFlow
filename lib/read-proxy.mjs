// One implementation for Pages Functions, localhost and offline tests. No Node APIs or logging.
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12000;
// Add custom domains here; the Pages project name is derived from the request automatically.
export const SITE_HOSTNAMES = [];
const canonicalHost = host => host.toLowerCase().replace(/\.+$/, "");
const HEADERS = {
  "content-type": "application/json; charset=utf-8", "cache-control": "no-store",
  "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()"
};
const json = (status, payload) => new Response(JSON.stringify(payload), { status, headers: HEADERS });
const deny = () => { throw new Error("URL not allowed"); };

function ipv4Number(value) {
  const parts = value.split(".");
  if (parts.length !== 4 || parts.some(p => !/^\d{1,3}$/.test(p) || Number(p) > 255)) return null;
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}
export function isPublicIP(value) {
  const host = value.toLowerCase().replace(/^\[|\]$/g, "");
  const v4 = ipv4Number(host);
  if (v4 !== null) {
    const denied = [
      ["0.0.0.0",8], ["10.0.0.0",8], ["100.64.0.0",10], ["127.0.0.0",8],
      ["169.254.0.0",16], ["172.16.0.0",12], ["192.0.0.0",24], ["192.0.2.0",24],
      ["192.88.99.0",24], ["192.168.0.0",16], ["198.18.0.0",15],
      ["198.51.100.0",24], ["203.0.113.0",24], ["224.0.0.0",4], ["240.0.0.0",4]
    ];
    return !denied.some(([base,bits]) => Math.floor(v4 / 2 ** (32-bits)) === Math.floor(ipv4Number(base) / 2 ** (32-bits)));
  }
  if (!host.includes(":") || host.includes("%")) return false;
  // Only ordinary global unicast. Conservatively refuse all IPv4 translation/tunnel forms,
  // including mapped, compatible, NAT64, 6to4, Teredo and special-purpose 2001::/23.
  let normalized;
  try { normalized = new URL("http://[" + host + "]/").hostname.slice(1,-1); } catch { return false; }
  const split = normalized.split("::");
  if (split.length > 2) return false;
  const left = split[0] ? split[0].split(":") : [];
  const right = split.length === 2 && split[1] ? split[1].split(":") : [];
  const groups = split.length === 2 ? [...left, ...Array(8-left.length-right.length).fill("0"), ...right] : left;
  if (groups.length !== 8) return false;
  const n = groups.reduce((a, g) => (a << 16n) + BigInt(parseInt(g,16)), 0n);
  const inRange = (base,bits) => n >> BigInt(128-bits) === base >> BigInt(128-bits);
  // IANA global allocations, checked 2026-10-06; unallocated space is reserved.
  // First 32 bits + prefix length. New allocations require a reviewed policy update.
  const allocated = [
    [0x20010200,23],[0x20010400,23],[0x20010600,23],[0x20010800,22],
    [0x20010c00,23],[0x20010e00,23],[0x20011200,23],[0x20011400,22],
    [0x20011800,23],[0x20011a00,23],[0x20011c00,22],[0x20012000,19],
    [0x20014000,23],[0x20014200,23],[0x20014400,23],[0x20014600,23],
    [0x20014800,23],[0x20014a00,23],[0x20014c00,23],[0x20015000,20],
    [0x20018000,19],[0x2001a000,20],[0x2001b000,20],[0x20030000,18],
    [0x24000000,12],[0x24100000,12],[0x26000000,12],[0x26100000,23],
    [0x26200000,23],[0x26300000,12],[0x28000000,12],[0x2a000000,12],
    [0x2a100000,12],[0x2c000000,12]
  ];
  return allocated.some(([base,bits]) => inRange(BigInt(base)<<96n,bits))
    && !inRange(0x20010000000000000000000000000000n,23)
    && !inRange(0x20010db8000000000000000000000000n,32)
    && !inRange(0x20020000000000000000000000000000n,16)
    && !inRange(0x3fff0000000000000000000000000000n,20);
}

export function validateTarget(url) {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80","443"].includes(url.port))) deny();
  const host = canonicalHost(url.hostname);
  if (!host || /(^|\.)(localhost|local|internal|arpa)$/.test(host)) deny();
  const literal = host.includes(":") || ipv4Number(host) !== null;
  if (literal && !isPublicIP(host)) deny();
  return { host, literal };
}

async function limitedText(response, limit, signal) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = []; let total = 0;
  const abort = () => { reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new Error("Response too large"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(bytes);
  } finally { signal.removeEventListener("abort", abort); reader.releaseLock(); }
}

async function checkDNS(host, fetchImpl, signal) {
  const replies = await Promise.all(["A","AAAA"].map(async type => {
    const endpoint = new URL("https://cloudflare-dns.com/dns-query");
    endpoint.searchParams.set("name",host); endpoint.searchParams.set("type",type);
    const res = await fetchImpl(endpoint.href, { signal, redirect: "error", headers: { accept: "application/dns-json" } });
    if (!res.ok) throw new Error("Could not load website");
    const data = JSON.parse(await limitedText(res, 65536, signal));
    if (data.Status !== 0 || !Array.isArray(data.Answer || [])) throw new Error("Could not load website");
    return data.Answer || [];
  }));
  const addresses = replies.flat().filter(r => r.type === 1 || r.type === 28);
  if (!addresses.length || addresses.some(r => typeof r.data !== "string" || !isPublicIP(r.data))) deny();
}

export async function handleRead(request, fetchImpl = fetch, siteHostnames = SITE_HOSTNAMES) {
  if (request.method !== "GET") return json(405, { error: "GET required" });
  const own = new URL(request.url);
  const ownHost = canonicalHost(own.hostname);
  const pagesProject = ownHost.endsWith(".pages.dev") ? ownHost.split(".").slice(-3).join(".") : null;
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== own.origin) return json(403, { error: "Forbidden" });
  const value = own.searchParams.get("url");
  let target;
  try {
    if (!value) throw new Error();
    const trimmed = value.trim();
    // Preserve scheme-less URLs; refuse explicit non-HTTP schemes rather than prefixing them.
    if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) deny();
    target = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed);
  } catch (error) {
    return json(error.message === "URL not allowed" ? 403 : 400, { error: error.message === "URL not allowed" ? "URL not allowed" : "Missing URL" });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let hop = 0; hop <= 5; hop++) {
      const { host, literal } = validateTarget(target);
      if ([own.hostname, ...siteHostnames].some(name => canonicalHost(name) === host)) deny();
      if (pagesProject && (host === pagesProject || host.endsWith("." + pagesProject))) deny();
      if (!literal) await checkDNS(host, fetchImpl, controller.signal);
      const response = await fetchImpl(target.href, {
        redirect: "manual", signal: controller.signal,
        headers: { "user-agent": "WordFlow Reader/1.0" }
      });
      if ([301,302,303,307,308].includes(response.status) && response.headers.has("location")) {
        await response.body?.cancel();
        if (hop === 5) throw new Error("Too many redirects");
        target = new URL(response.headers.get("location"), target);
        continue;
      }
      const contentType = response.headers.get("content-type") || "text/plain; charset=utf-8";
      const body = await limitedText(response, MAX_BYTES, controller.signal);
      return json(response.ok ? 200 : response.status, { url: target.href, contentType, body });
    }
  } catch (error) {
    const known = ["URL not allowed", "Response too large", "Too many redirects"];
    const message = controller.signal.aborted ? "Website request timed out" : known.includes(error.message) ? error.message : "Could not load website";
    return json(message === "URL not allowed" ? 403 : 500, { error: message });
  } finally { clearTimeout(timeout); }
}
