import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string) => readFile(path.join(root, relativePath), "utf8");

process.env.JWT_SECRET = "session-security-verification-secret";

const authServer = await read("server/replit_integrations/auth/index.ts");
const authToken = await read("server/replit_integrations/auth/token.ts");
const browserTokenAdapter = await read("client/src/lib/auth-token.ts");
const authHook = await read("client/src/hooks/use-auth.ts");

const requiredServerFragments = [
  'const SESSION_COOKIE_NAME = "__Host-rentflo.sid"',
  "httpOnly: true",
  "secure: true",
  'sameSite: "lax"',
  'path: "/"',
  "maxAge: SESSION_MAX_AGE_MS",
  "rolling: false",
  "const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000",
  "const SESSION_TTL_SECONDS = SESSION_MAX_AGE_MS / 1000",
  "ttl: SESSION_TTL_SECONDS",
  "authIssuedAt",
  "nowMs - issuedAt <= SESSION_MAX_AGE_MS",
  "rejectExpiredSession",
  "function hasUsableWebSession",
  "function regenerateSession",
  "await regenerateSession(req)",
  "encryptPII(JSON.stringify(stored))",
];

for (const fragment of requiredServerFragments) {
  if (!authServer.includes(fragment)) {
    throw new Error(`Missing required server-session protection: ${fragment}`);
  }
}

if (/ttl:\s*SESSION_MAX_AGE_MS/.test(authServer)) {
  throw new Error("Database session TTL must be expressed in seconds, not milliseconds.");
}

if (!browserTokenAdapter.includes("clearLegacyBrowserAuthStorage")) {
  throw new Error("Legacy browser authentication storage must be removed on app startup.");
}

if (/\.(getItem|setItem)\(AUTH_TOKEN_KEY/.test(browserTokenAdapter)) {
  throw new Error("The browser token adapter must never read or write authentication material through web storage.");
}

if (!/\.removeItem\(AUTH_TOKEN_KEY\)/.test(browserTokenAdapter)) {
  throw new Error("The browser token adapter must only remove, never persist, legacy browser credentials.");
}

if (!browserTokenAdapter.includes("if (!Capacitor.isNativePlatform()) return null")) {
  throw new Error("Web builds must never read the native bearer-token adapter.");
}

if (!authHook.includes('credentials: "include"')) {
  throw new Error("Browser identity requests must explicitly include the HTTP-only session cookie.");
}

if (!authHook.includes("clearLegacyBrowserAuthStorage();")) {
  throw new Error("The browser startup path must clear a legacy authentication key.");
}

if (!authHook.includes('window.location.assign(`${API_BASE}/api/login`)')) {
  throw new Error("Browser OAuth must use the current browsing context so the callback session is available immediately.");
}

if (!authHook.includes('url: `${API_BASE}/api/login?platform=android`')) {
  throw new Error("The native OAuth deep-link flow must remain isolated from browser session login.");
}

if (!authServer.includes("if (hasUsableWebSession(req))")) {
  throw new Error("A valid authenticated session must retain the safe login shortcut.");
}

if (!authToken.includes("NATIVE_AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60")) {
  throw new Error("The Android fallback token must share the seven-day maximum lifetime.");
}

const { signAuthToken, verifyAuthToken, NATIVE_AUTH_TOKEN_TTL_SECONDS } = await import("../server/replit_integrations/auth/token");
const nativeClaims = verifyAuthToken(signAuthToken({ sub: "verification-user" }));
if (!nativeClaims || nativeClaims.exp - nativeClaims.iat !== NATIVE_AUTH_TOKEN_TTL_SECONDS) {
  throw new Error("Native fallback token runtime lifetime verification failed.");
}

console.log("Verified secure HTTP-only web session cookies, same-tab browser OAuth, seven-day session enforcement, encrypted session storage, legacy browser-token removal, and native fallback-token expiry.");
