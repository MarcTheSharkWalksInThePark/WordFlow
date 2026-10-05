"use strict";
// Test-only: reject non-loopback traffic BEFORE DNS or a kernel bind/connect.
const net = require("node:net");
const dns = require("node:dns");
const fs = require("node:fs");
function loopback(host) {
  return typeof host === "string" && (host.toLowerCase() === "localhost" || host === "::1" || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) || /^::ffff:127\./i.test(host));
}
function record(kind, host) {
  if (process.env.WORDFLOW_NETWORK_LOG) fs.appendFileSync(process.env.WORDFLOW_NETWORK_LOG, JSON.stringify({ kind, host }) + "\n");
}
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  let host = typeof args[0] === "object" ? args[0].host : args[1];
  if (host === "192.0.2.1" && process.env.WORDFLOW_TEST_REDIRECT === "1") {
    record("redirect-test-bind", host);
    if (typeof args[0] === "object") args[0] = { ...args[0], host: "127.0.0.1" };
    else args[1] = "127.0.0.1";
    host = "127.0.0.1";
  }
  if (!loopback(host)) {
    record("blocked-bind", String(host));
    throw new Error("TEST_REFUSED_NON_LOOPBACK_BIND: " + String(host));
  }
  record("loopback-bind", host);
  return listen.apply(this, args);
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let options = args[0];
  if (Array.isArray(options)) options = options[0];
  const host = typeof options === "object" ? options.host : typeof args[1] === "string" ? args[1] : "localhost";
  if (!loopback(host || "localhost")) {
    record("blocked-connect", String(host));
    throw new Error("TEST_REFUSED_OUTBOUND_CONNECT: " + String(host));
  }
  record("loopback-connect", host || "localhost");
  return connect.apply(this, args);
};
const lookup = dns.lookup;
dns.lookup = function (host, ...args) {
  if (!loopback(host)) {
    record("blocked-dns", String(host));
    throw new Error("TEST_REFUSED_OUTBOUND_DNS: " + String(host));
  }
  record("loopback-dns", host);
  return lookup.call(this, host, ...args);
};
const lookupPromise = dns.promises.lookup;
dns.promises.lookup = async function (host, ...args) {
  if (!loopback(host)) {
    record("blocked-dns", String(host));
    throw new Error("TEST_REFUSED_OUTBOUND_DNS: " + String(host));
  }
  return lookupPromise.call(this, host, ...args);
};
