const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");

const { handleRead } = require("./lib/read-proxy.mjs");
const root = __dirname;
const startPort = Number(process.env.PORT) || 8080;
// RULING 59 part 1: loopback unless HOST names another interface explicitly.
const listenHost = String(process.env.HOST || "").trim() || "127.0.0.1";
// RULING 59 part 6a: the Host header check is on whenever the listen host is loopback, including a
// loopback HOST, and off only for a non-loopback HOST. Decided here, from listenHost and before
// any routing; environment files are never read.
const checkHostHeader = isLoopbackHost(listenHost);


const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".md", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);


const STATIC_FILES = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "assets/wordflow-mark.svg",
  "file-extractors.mjs",
  "404.html",
  "api/read",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "vendor/pdfjs/LICENSE",
  "vendor/pdfjs/cmaps/78-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/78-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/78-H.bcmap",
  "vendor/pdfjs/cmaps/78-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/78-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/78-V.bcmap",
  "vendor/pdfjs/cmaps/78ms-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/78ms-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/83pv-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/90ms-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/90ms-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/90msp-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/90msp-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/90pv-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/90pv-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/Add-H.bcmap",
  "vendor/pdfjs/cmaps/Add-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/Add-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/Add-V.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-0.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-1.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-3.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-4.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-5.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-6.bcmap",
  "vendor/pdfjs/cmaps/Adobe-CNS1-UCS2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-0.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-1.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-3.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-4.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-5.bcmap",
  "vendor/pdfjs/cmaps/Adobe-GB1-UCS2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-0.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-1.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-3.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-4.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-5.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-6.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Japan1-UCS2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Korea1-0.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Korea1-1.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Korea1-2.bcmap",
  "vendor/pdfjs/cmaps/Adobe-Korea1-UCS2.bcmap",
  "vendor/pdfjs/cmaps/B5-H.bcmap",
  "vendor/pdfjs/cmaps/B5-V.bcmap",
  "vendor/pdfjs/cmaps/B5pc-H.bcmap",
  "vendor/pdfjs/cmaps/B5pc-V.bcmap",
  "vendor/pdfjs/cmaps/CNS-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/CNS-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/CNS1-H.bcmap",
  "vendor/pdfjs/cmaps/CNS1-V.bcmap",
  "vendor/pdfjs/cmaps/CNS2-H.bcmap",
  "vendor/pdfjs/cmaps/CNS2-V.bcmap",
  "vendor/pdfjs/cmaps/ETHK-B5-H.bcmap",
  "vendor/pdfjs/cmaps/ETHK-B5-V.bcmap",
  "vendor/pdfjs/cmaps/ETen-B5-H.bcmap",
  "vendor/pdfjs/cmaps/ETen-B5-V.bcmap",
  "vendor/pdfjs/cmaps/ETenms-B5-H.bcmap",
  "vendor/pdfjs/cmaps/ETenms-B5-V.bcmap",
  "vendor/pdfjs/cmaps/EUC-H.bcmap",
  "vendor/pdfjs/cmaps/EUC-V.bcmap",
  "vendor/pdfjs/cmaps/Ext-H.bcmap",
  "vendor/pdfjs/cmaps/Ext-RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/Ext-RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/Ext-V.bcmap",
  "vendor/pdfjs/cmaps/GB-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GB-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/GB-H.bcmap",
  "vendor/pdfjs/cmaps/GB-V.bcmap",
  "vendor/pdfjs/cmaps/GBK-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GBK-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/GBK2K-H.bcmap",
  "vendor/pdfjs/cmaps/GBK2K-V.bcmap",
  "vendor/pdfjs/cmaps/GBKp-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GBKp-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/GBT-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GBT-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/GBT-H.bcmap",
  "vendor/pdfjs/cmaps/GBT-V.bcmap",
  "vendor/pdfjs/cmaps/GBTpc-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GBTpc-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/GBpc-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/GBpc-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/H.bcmap",
  "vendor/pdfjs/cmaps/HKdla-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKdla-B5-V.bcmap",
  "vendor/pdfjs/cmaps/HKdlb-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKdlb-B5-V.bcmap",
  "vendor/pdfjs/cmaps/HKgccs-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKgccs-B5-V.bcmap",
  "vendor/pdfjs/cmaps/HKm314-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKm314-B5-V.bcmap",
  "vendor/pdfjs/cmaps/HKm471-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKm471-B5-V.bcmap",
  "vendor/pdfjs/cmaps/HKscs-B5-H.bcmap",
  "vendor/pdfjs/cmaps/HKscs-B5-V.bcmap",
  "vendor/pdfjs/cmaps/Hankaku.bcmap",
  "vendor/pdfjs/cmaps/Hiragana.bcmap",
  "vendor/pdfjs/cmaps/KSC-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/KSC-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/KSC-H.bcmap",
  "vendor/pdfjs/cmaps/KSC-Johab-H.bcmap",
  "vendor/pdfjs/cmaps/KSC-Johab-V.bcmap",
  "vendor/pdfjs/cmaps/KSC-V.bcmap",
  "vendor/pdfjs/cmaps/KSCms-UHC-H.bcmap",
  "vendor/pdfjs/cmaps/KSCms-UHC-HW-H.bcmap",
  "vendor/pdfjs/cmaps/KSCms-UHC-HW-V.bcmap",
  "vendor/pdfjs/cmaps/KSCms-UHC-V.bcmap",
  "vendor/pdfjs/cmaps/KSCpc-EUC-H.bcmap",
  "vendor/pdfjs/cmaps/KSCpc-EUC-V.bcmap",
  "vendor/pdfjs/cmaps/Katakana.bcmap",
  "vendor/pdfjs/cmaps/LICENSE",
  "vendor/pdfjs/cmaps/NWP-H.bcmap",
  "vendor/pdfjs/cmaps/NWP-V.bcmap",
  "vendor/pdfjs/cmaps/RKSJ-H.bcmap",
  "vendor/pdfjs/cmaps/RKSJ-V.bcmap",
  "vendor/pdfjs/cmaps/Roman.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UCS2-H.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UCS2-V.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF16-H.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF16-V.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF8-H.bcmap",
  "vendor/pdfjs/cmaps/UniCNS-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UCS2-H.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UCS2-V.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF16-H.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF16-V.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF8-H.bcmap",
  "vendor/pdfjs/cmaps/UniGB-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UCS2-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UCS2-HW-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UCS2-HW-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UCS2-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF16-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF16-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF8-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF16-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF16-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF8-H.bcmap",
  "vendor/pdfjs/cmaps/UniJIS2004-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/UniJISPro-UCS2-HW-V.bcmap",
  "vendor/pdfjs/cmaps/UniJISPro-UCS2-V.bcmap",
  "vendor/pdfjs/cmaps/UniJISPro-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/UniJISX0213-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniJISX0213-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniJISX02132004-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniJISX02132004-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UCS2-H.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UCS2-V.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF16-H.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF16-V.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF32-H.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF32-V.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF8-H.bcmap",
  "vendor/pdfjs/cmaps/UniKS-UTF8-V.bcmap",
  "vendor/pdfjs/cmaps/V.bcmap",
  "vendor/pdfjs/cmaps/WP-Symbol.bcmap",
  "vendor/pdfjs/pdf.mjs",
  "vendor/pdfjs/pdf.worker.mjs",
  "vendor/pdfjs/standard_fonts/FoxitDingbats.pfb",
  "vendor/pdfjs/standard_fonts/FoxitFixed.pfb",
  "vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb",
  "vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb",
  "vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb",
  "vendor/pdfjs/standard_fonts/FoxitSerif.pfb",
  "vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb",
  "vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb",
  "vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb",
  "vendor/pdfjs/standard_fonts/FoxitSymbol.pfb",
  "vendor/pdfjs/standard_fonts/LICENSE_FOXIT",
  "vendor/pdfjs/standard_fonts/LICENSE_LIBERATION",
  "vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf",
  "vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf",
  "vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf",
  "vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf"
]);

const server = http.createServer(serverOptions(checkHostHeader), async (req, res) => {
  // RULING 59, 2026-10-05 amendment. These checks run before any URL parsing and before routing, so
  // they cover static and API routes alike. None can throw, so they sit outside the try.
  // B3: more than one Host field line is invalid HTTP (RFC 9112 section 3.2), and Node keeps only
  // the first in req.headers.host. Refused with 400 whether or not the Host check is on.
  if (req.rawHeaders.filter((value, index) => index % 2 === 0 && value.toLowerCase() === "host").length > 1) {
    sendText(res, 400, "Bad request");
    return;
  }
  // Part 6: while bound to loopback, Host must be a loopback name at the port actually bound.
  if (checkHostHeader) {
    const bound = server.address();
    const port = bound && bound.port;
    const host = String(req.headers.host || "").toLowerCase();
    if (!isAllowedHostHeader(host, port)) {
      sendText(res, 403, "Forbidden");
      return;
    }
  }
  // B2: only an origin-form target is routed. "//x" and "/\x" would parse as a network-path
  // reference whose host swallows the first segment; an absolute-form target does not start "/".
  if (!req.url.startsWith("/") || req.url[1] === "/" || req.url[1] === "\\") {
    sendText(res, 404, "Not found");
    return;
  }

  try {
    const requestUrl = new URL(req.url, "http://localhost");

    if (requestUrl.pathname === "/api/read") {
      const incoming = new Request(new URL(req.url, "http://" + req.headers.host), { method: req.method, headers: req.headers.origin === undefined ? {} : { origin: req.headers.origin } });
      const response = await handleRead(incoming);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }

    await serveStaticFile(requestUrl, res);
  } catch (error) {
    sendJson(res, 500, { error: "Server error" });
  }
});

listen(startPort);

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < startPort + 20) {
      listen(port + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.listen(port, listenHost, () => {
    // A failed attempt's callback also fires when a retry binds; only the bound port's one reports.
    if (server.address().port !== port) return;
    console.log(`WordFlow: http://localhost:${port} (host ${listenHost}, bound ${server.address().address})`);
    const warning = startupWarning(listenHost);
    if (warning) console.warn(warning);
  });
}

function startupWarning(listenHost) {
  if (!isLoopbackHost(listenHost)) {
    return `WARNING: HOST=${listenHost} - listening on a non-loopback interface. Other machines that can reach it can use this server. The Host header check is off (HOST names a non-loopback address).`;
  }
  return null;
}

function serverOptions(checkHostHeader) {
  return { requireHostHeader: !checkHostHeader };
}

function isAllowedHostHeader(host, port) {
  if (host !== `localhost:${port}` && host !== `127.0.0.1:${port}` && host !== `[::1]:${port}`) {
    return port === 80 && (host === "localhost" || host === "127.0.0.1" || host === "[::1]");
  }
  return true;
}

function isLoopbackHost(host) {
  const value = String(host).toLowerCase();
  const ipv4 = value.startsWith("::ffff:") ? value.slice("::ffff:".length) : value;
  return value === "localhost" || value === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipv4);
}

async function serveStaticFile(requestUrl, res) {
  const relativePath = resolveStaticPath(requestUrl.pathname);
  if (!relativePath) {
    sendText(res, 404, "Not found");
    return;
  }

  const filePath = path.join(root, ...relativePath.split("/"));

  let content;
  try {
    content = await fs.readFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendText(res, 404, "Not found");
      return;
    }

    throw error;
  }

  const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
  res.writeHead(200, {
    "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https:; worker-src 'self' blob:; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "content-type": contentType,
    "cache-control": "no-store"
  });
  res.end(content);
}

function resolveStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (error) {
    return null;
  }

  if (isRefusedStaticPath(decoded)) return null;

  const normalized = path.posix.normalize("/" + decoded.replace(/\\/g, "/")).replace(/^\/+/, "");
  const relativePath = normalized === "" ? "index.html" : normalized;
  return STATIC_FILES.has(relativePath) ? relativePath : null;
}

function isRefusedStaticPath(decodedPath) {
  return decodedPath.split(/[\\/]/).some((segment) => segment.startsWith(".") || /^\.env/i.test(segment));
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(text);
}
