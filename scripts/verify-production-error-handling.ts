import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import express from "express";
import { productionErrorHandler, redactDiagnostic, sendSafeError } from "../server/error-handling";

const app = express();
app.get("/boom", (_req, _res, next) => {
  const error = new Error("Provider failure: api_key=live-secret password=hunter2");
  (error as any).status = 502;
  next(error);
});
app.get("/bad-request", (_req, _res, next) => {
  const error = new Error("Internal parser detail should never be sent");
  (error as any).status = 400;
  next(error);
});
app.get("/explicit", (_req, res) => sendSafeError(res, 503));
app.use(productionErrorHandler);

const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to bind production error test server.");
const origin = `http://127.0.0.1:${address.port}`;

try {
  const providerFailure = await fetch(`${origin}/boom`);
  const providerBody = await providerFailure.json();
  assert.equal(providerFailure.status, 502, "provider failure should preserve the safe status code");
  assert.deepEqual(providerBody, { message: "We could not complete your request. Please try again.", code: "INTERNAL_ERROR" });
  assert.doesNotMatch(JSON.stringify(providerBody), /provider|api_key|secret|hunter2|stack/i, "client provider error must not disclose diagnostics");

  const clientFailure = await fetch(`${origin}/bad-request`);
  const clientBody = await clientFailure.json();
  assert.equal(clientFailure.status, 400, "client error status should be retained");
  assert.deepEqual(clientBody, { message: "Request could not be completed.", code: "REQUEST_REJECTED" });
  assert.doesNotMatch(JSON.stringify(clientBody), /parser|detail|stack/i, "client error response must not reflect implementation details");

  const explicitFailure = await fetch(`${origin}/explicit`);
  assert.deepEqual(await explicitFailure.json(), { message: "We could not complete your request. Please try again.", code: "INTERNAL_ERROR" });
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

const redacted = redactDiagnostic("Provider failure: api_key=live-secret password=hunter2");
assert.match(redacted, /\[REDACTED\]/, "private logs must redact sensitive key/value fragments");
assert.doesNotMatch(redacted, /live-secret|hunter2/, "private logs must not retain test secret values");

const [index, routes, audioRoutes, helper] = await Promise.all([
  readFile("server/index.ts", "utf8"),
  readFile("server/routes.ts", "utf8"),
  readFile("server/replit_integrations/audio/routes.ts", "utf8"),
  readFile("server/error-handling.ts", "utf8"),
]);

assert.match(index, /app\.use\(productionErrorHandler\)/, "global production error handler must be installed last");
assert.match(helper, /res\.status\(status\)\.json\(\{ message, code:/, "safe error helper must return only stable client fields");
assert.match(helper, /errorStack:/, "private diagnostics must retain stack context for server logs");
assert.doesNotMatch(routes, /message:\s*err\??\.message/, "main routes must not reflect exception messages to clients");
assert.doesNotMatch(routes, /message:\s*error\.message/, "main routes must not reflect validation exception internals to clients");
assert.match(routes, /logPrivateError\("didit_start_failed"/, "KYC provider errors must use private logging");
assert.match(routes, /logPrivateError\("chatbot_request_failed"/, "AI provider errors must use private logging");
assert.doesNotMatch(audioRoutes, /error:\s*error\.message/, "audio route must not reflect parser exception messages");

console.log("Verified generic production error responses, redacted private diagnostics, safe provider failure handling, and no reflected exception messages in active error paths.");
