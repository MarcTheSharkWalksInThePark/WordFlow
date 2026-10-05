const http = require("node:http");
const fs = require("node:fs/promises");
const fsSync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { URL } = require("node:url");

const root = __dirname;
const startPort = Number(process.env.PORT) || 8080;
// RULING 59 part 1: loopback unless HOST names another interface explicitly.
const listenHost = String(process.env.HOST || "").trim() || "127.0.0.1";
// RULING 59 part 6a: the Host header check is on whenever the listen host is loopback, including a
// loopback HOST, and off only for a non-loopback HOST. Decided here, from listenHost and before
// loadLocalEnv, so a HOST written only in an env file changes neither.
const checkHostHeader = isLoopbackHost(listenHost);
const maxRemoteBytes = 3 * 1024 * 1024;
const maxUploadBytes = 24 * 1024 * 1024;

loadLocalEnv();

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

const textExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".csv", ".json", ".rtf"]);
const extractableExtensions = new Set([".pdf", ".docx"]);

const STATIC_FILES = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "assets/wordflow-mark.svg"
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
      await readRemoteUrl(requestUrl, res);
      return;
    }

    if (requestUrl.pathname === "/api/extract-file") {
      await extractUploadedFile(req, res);
      return;
    }

    await serveStaticFile(requestUrl, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || "Server error" });
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

function loadLocalEnv() {
  [".env.local", ".env"].forEach((filename) => {
    const envPath = path.join(root, filename);
    if (!fsSync.existsSync(envPath)) return;
    const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
    lines.forEach((line) => {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!match) return;
      const key = match[1];
      if (process.env[key]) return;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
  });
}

async function readRemoteUrl(requestUrl, res) {
  const target = normalizeRemoteUrl(requestUrl.searchParams.get("url"));
  if (!target) {
    sendJson(res, 400, { error: "Missing URL" });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(target.href, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "WordFlow Reader/1.0"
      }
    });

    const contentType = response.headers.get("content-type") || "text/plain; charset=utf-8";
    const body = await readLimitedText(response, maxRemoteBytes);

    sendJson(res, response.ok ? 200 : response.status, {
      url: response.url,
      contentType,
      body
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function extractUploadedFile(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "POST required" });
    return;
  }

  const file = await readMultipartFile(req);
  if (!file) {
    sendJson(res, 400, { error: "No file uploaded" });
    return;
  }

  const extension = path.extname(file.filename).toLowerCase();
  if (textExtensions.has(extension) || file.contentType.startsWith("text/")) {
    sendJson(res, 200, {
      title: file.filename,
      contentType: file.contentType || "text/plain",
      body: decodeUploadedText(file.content),
      warnings: []
    });
    return;
  }

  if (!extractableExtensions.has(extension)) {
    sendJson(res, 415, { error: "Supported files: PDF, DOCX, and text files" });
    return;
  }

  const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "wordflow-"));
  const safeFilename = sanitizeFilename(file.filename) || `source${extension}`;
  const filePath = path.join(uploadDir, safeFilename);

  try {
    await fs.writeFile(filePath, file.content);
    const extracted = await runExtractor(filePath, file.filename, file.contentType);
    sendJson(res, 200, extracted);
  } finally {
    await fs.rm(uploadDir, { recursive: true, force: true });
  }
}

function normalizeRemoteUrl(value) {
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch (error) {
    return null;
  }
}

async function readLimitedText(response, byteLimit) {
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    total += value.byteLength;
    if (total > byteLimit) {
      throw new Error("Response too large");
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function readLimitedBuffer(req, byteLimit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let rejected = false;

    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > byteLimit) {
        rejected = true;
        reject(new Error("Upload is too large"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!rejected) resolve(Buffer.concat(chunks));
    });

    req.on("error", (error) => {
      if (!rejected) reject(error);
    });
  });
}

async function readMultipartFile(req) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) throw new Error("Missing multipart boundary");

  const body = await readLimitedBuffer(req, maxUploadBytes);
  const parts = parseMultipart(body, boundary);
  return parts.find((part) => part.filename);
}

function parseMultipart(body, boundary) {
  const raw = body.toString("latin1");
  const sections = raw.split(`--${boundary}`);

  return sections
    .map((section) => section.replace(/^\r\n/, ""))
    .filter((section) => section && section !== "--\r\n" && section !== "--")
    .map((section) => {
      const headerEnd = section.indexOf("\r\n\r\n");
      if (headerEnd === -1) return null;

      const headerText = section.slice(0, headerEnd);
      let content = section.slice(headerEnd + 4);
      content = content.replace(/\r\n$/, "").replace(/--$/, "");

      const headers = parsePartHeaders(headerText);
      const disposition = headers["content-disposition"] || "";
      const name = extractDispositionValue(disposition, "name");
      const filename = extractDispositionValue(disposition, "filename");

      return {
        name,
        filename,
        contentType: headers["content-type"] || "application/octet-stream",
        content: Buffer.from(content, "latin1")
      };
    })
    .filter(Boolean);
}

function parsePartHeaders(headerText) {
  const headers = {};
  headerText.split("\r\n").forEach((line) => {
    const separator = line.indexOf(":");
    if (separator === -1) return;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    headers[key] = value;
  });
  return headers;
}

function extractDispositionValue(disposition, key) {
  const quoted = new RegExp(`${key}="([^"]*)"`, "i").exec(disposition);
  if (quoted) return quoted[1];

  const plain = new RegExp(`${key}=([^;]+)`, "i").exec(disposition);
  return plain ? plain[1].trim() : "";
}

function decodeUploadedText(buffer) {
  const utf8 = buffer.toString("utf8");
  if (!utf8.includes("\uFFFD")) return utf8;
  return buffer.toString("latin1");
}

function sanitizeFilename(filename) {
  return path.basename(filename || "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function runExtractor(filePath, filename, contentType) {
  return new Promise((resolve, reject) => {
    const python = resolvePythonPath();
    const script = path.join(root, "extract_text.py");
    const child = spawn(python, [script, filePath, filename, contentType || ""], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1"
      },
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "Could not extract file text"));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error("Extractor returned unreadable output"));
      }
    });
  });
}

function resolvePythonPath() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push(process.env.PYTHON);
  if (process.env.USERPROFILE) {
    candidates.push(path.join(
      process.env.USERPROFILE,
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "python",
      "python.exe"
    ));
  }
  candidates.push("python");

  return candidates.find((candidate) => candidate === "python" || fsSync.existsSync(candidate)) || "python";
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
