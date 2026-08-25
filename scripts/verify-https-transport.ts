import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import express from "express";
import { createHttpsRedirectMiddleware } from "../server/transport-security";

async function startTestServer(production: boolean) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(createHttpsRedirectMiddleware({ production, publicAppUrl: "https://rentflo.in" }));
  app.get("/health", (_req, res) => res.status(204).end());
  app.get("/secure", (_req, res) => res.status(204).end());
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to bind HTTPS redirect test server.");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

const production = await startTestServer(true);
try {
  const redirected = await fetch(`${production.url}/secure?source=http`, {
    headers: { "x-forwarded-proto": "http" },
    redirect: "manual",
  });
  assert.equal(redirected.status, 308, "production HTTP must receive a permanent HTTPS redirect");
  assert.equal(redirected.headers.get("location"), "https://rentflo.in/secure?source=http", "redirect target must use the trusted canonical HTTPS origin");

  const secure = await fetch(`${production.url}/secure`, { headers: { "x-forwarded-proto": "https" } });
  assert.equal(secure.status, 204, "HTTPS requests must reach the application without a redirect loop");

  const health = await fetch(`${production.url}/health`, {
    headers: { "x-forwarded-proto": "http" },
    redirect: "manual",
  });
  assert.equal(health.status, 204, "internal health endpoint must stay available to the hosting platform");
} finally {
  await new Promise<void>((resolve, reject) => production.server.close((error) => error ? reject(error) : resolve()));
}

const development = await startTestServer(false);
try {
  const local = await fetch(`${development.url}/secure`, {
    headers: { "x-forwarded-proto": "http" },
    redirect: "manual",
  });
  assert.equal(local.status, 204, "local development must not force HTTPS");
} finally {
  await new Promise<void>((resolve, reject) => development.server.close((error) => error ? reject(error) : resolve()));
}

const [index, routes, auth, nativeAuth, staticServer] = await Promise.all([
  readFile("server/index.ts", "utf8"),
  readFile("server/routes.ts", "utf8"),
  readFile("server/replit_integrations/auth/index.ts", "utf8"),
  readFile("client/src/lib/auth-token.ts", "utf8"),
  readFile("server/static.ts", "utf8"),
]);

assert.match(index, /app\.set\("trust proxy", 1\)/, "Railway reverse proxy must be explicitly trusted");
assert.match(index, /createHttpsRedirectMiddleware\(/, "application must install the production HTTPS redirect middleware");
assert.match(index, /strictTransportSecurity: IS_PRODUCTION \? \{ maxAge: 31_536_000, includeSubDomains: true \} : false/, "production must enable one-year HSTS for subdomains");
assert.match(index, /IS_PRODUCTION \? \[\] : \["ws:"\]/, "production CSP must not permit insecure WebSocket transport");
assert.match(index, /IS_PRODUCTION \? \[\] : \["http:\/\/localhost"\]/, "production CORS must not allow a plain-HTTP browser origin");
assert.match(routes, /url\.protocol !== "https:"/, "PUBLIC_APP_URL must be HTTPS before provider callbacks are built");
assert.match(auth, /callbackURL: `https:\/\/rentflo\.in\/api\/auth\/google\/callback`/, "OAuth callback must remain HTTPS");
assert.match(nativeAuth, /"https:\/\/rentflo\.in"/, "native clients must target the HTTPS backend");
assert.doesNotMatch(staticServer, /http:\/\//, "production static serving must not introduce an HTTP origin");

console.log("Verified production HTTP-to-HTTPS redirection, no redirect loop for HTTPS, health-check availability, HSTS, and HTTPS-only production browser/provider targets.");
