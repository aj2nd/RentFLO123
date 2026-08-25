import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import express from "express";
import { createRentfloSecurityHeaders } from "../server/security-headers";

async function startHeaderServer(production: boolean) {
  const app = express();
  app.use(createRentfloSecurityHeaders({
    production,
    cspReportEndpoint: "/api/csp-report",
    inlineScriptHashes: ["'sha256-testHash='"],
  }));
  app.get("/", (_req, res) => res.status(204).end());
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to bind security header test server.");
  return { server, url: `http://127.0.0.1:${address.port}/` };
}

const production = await startHeaderServer(true);
try {
  const response = await fetch(production.url);
  const csp = response.headers.get("content-security-policy") || "";
  assert.equal(response.headers.get("x-frame-options"), "DENY", "X-Frame-Options must prevent framing");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", "X-Content-Type-Options must prevent MIME sniffing");
  assert.match(response.headers.get("strict-transport-security") || "", /max-age=31536000; includeSubDomains/, "production HSTS must persist HTTPS for one year and subdomains");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", "Referrer-Policy must limit cross-origin referrer disclosure");
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin", "COOP must isolate top-level browsing contexts");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin", "CORP must protect same-origin resources");
  assert.match(csp, /default-src 'self'/, "CSP must default to same-origin resources");
  assert.match(csp, /frame-ancestors 'none'/, "CSP must prohibit framing independently of X-Frame-Options");
  assert.match(csp, /object-src 'none'/, "CSP must disable legacy embedded plugin content");
  assert.match(csp, /report-uri \/api\/csp-report/, "CSP must retain its report collector");
  assert.doesNotMatch(csp, /\bws:/, "production CSP must not allow insecure WebSocket transport");
} finally {
  await new Promise<void>((resolve, reject) => production.server.close((error) => error ? reject(error) : resolve()));
}

const development = await startHeaderServer(false);
try {
  const response = await fetch(development.url);
  assert.equal(response.headers.get("strict-transport-security"), null, "HSTS must remain disabled for HTTP local development");
  assert.match(response.headers.get("content-security-policy") || "", /\bws:/, "development CSP may retain local Vite WebSocket support");
} finally {
  await new Promise<void>((resolve, reject) => development.server.close((error) => error ? reject(error) : resolve()));
}

const [index, helper] = await Promise.all([
  readFile("server/index.ts", "utf8"),
  readFile("server/security-headers.ts", "utf8"),
]);
assert.match(index, /createRentfloSecurityHeaders\(/, "server bootstrap must install the shared security-header policy");
assert.match(helper, /frameguard: \{ action: "deny" \}/, "X-Frame-Options must be explicitly configured");
assert.match(helper, /noSniff: true/, "X-Content-Type-Options must be explicitly configured");
assert.match(helper, /strictTransportSecurity: options\.production/, "HSTS must be limited to production HTTPS hosting");
assert.match(helper, /frameAncestors: \["'none'"\]/, "CSP must independently prevent framing");

console.log("Verified CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, production HSTS, Referrer-Policy, COOP, CORP, and development-safe exceptions.");
