import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import express from "express";

const captured: string[] = [];
const originalConsole = { log: console.log, warn: console.warn, error: console.error };
console.log = (value?: unknown) => captured.push(String(value));
console.warn = (value?: unknown) => captured.push(String(value));
console.error = (value?: unknown) => captured.push(String(value));

const { createApiMonitoringMiddleware, installRedactedConsoleLogging, logPrivateError } = await import("../server/error-handling");
installRedactedConsoleLogging();

const app = express();
app.use((req: any, _res, next) => {
  req.currentUser = { id: "account-private-123" };
  next();
});
app.use(createApiMonitoringMiddleware());
app.get("/api/ok", (_req, res) => res.status(204).end());
app.get("/api/denied", (_req, res) => res.status(403).end());
app.get("/api/limited", (_req, res) => res.status(429).end());
app.post("/api/cashfree/webhook", (_req, res) => res.status(401).end());

const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to bind monitoring test server.");
const origin = `http://127.0.0.1:${address.port}`;

try {
  await fetch(`${origin}/api/ok`);
  await fetch(`${origin}/api/denied`);
  await fetch(`${origin}/api/limited`);
  await fetch(`${origin}/api/cashfree/webhook`, { method: "POST" });
  logPrivateError("provider_test_failure", new Error("token=never-log-this password=hunter2"), {
    accountId: "account-private-123",
    nested: { authorization: "Bearer never-log-this" },
  });
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

console.log = originalConsole.log;
console.warn = originalConsole.warn;
console.error = originalConsole.error;

const records = captured.map((line) => JSON.parse(line));
const events = records.map((record) => record.event);
for (const event of ["api_request_completed", "authorization_denied", "rate_limit_triggered", "provider_callback_rejected", "provider_test_failure"]) {
  assert.ok(events.includes(event), `expected monitoring event not emitted: ${event}`);
}
const serialized = JSON.stringify(records);
assert.doesNotMatch(serialized, /account-private-123|never-log-this|hunter2|Bearer never-log-this/, "logs must never contain raw account identifiers, tokens, or passwords");
assert.match(serialized, /\[REDACTED\]/, "logs must record redaction rather than secret values");
assert.match(serialized, /accountHash/, "request monitoring must use a stable pseudonymous account hash");
assert.doesNotMatch(serialized, /"body"|"headers"|"cookie"/i, "monitoring records must not contain request body, headers, or cookies");

const [index, helper, routes] = await Promise.all([
  readFile("server/index.ts", "utf8"),
  readFile("server/error-handling.ts", "utf8"),
  readFile("server/routes.ts", "utf8"),
]);
assert.match(index, /installRedactedConsoleLogging\(\)/, "server startup must install the console redaction safety net");
assert.match(index, /createApiMonitoringMiddleware\(\)/, "server startup must install API monitoring");
assert.match(index, /logSecurityEvent\("csp_violation"/, "CSP violations must produce a security event without URL capture");
assert.match(helper, /rate_limit_triggered/, "monitoring must detect rate-limit responses");
assert.match(helper, /provider_callback_rejected/, "monitoring must detect rejected webhook/provider callbacks");
assert.match(routes, /Cashfree order creation failed/, "existing provider flow remains present under redacted console interception");

console.log("Verified structured monitoring events, suspicious-activity coverage, pseudonymous request identifiers, and log redaction for passwords, tokens, authorization values, headers, cookies, and bodies.");
