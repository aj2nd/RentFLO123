import { createServer } from "node:http";
import express from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAccountRateLimiter } from "../server/rate-limit";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath: string) => readFile(path.join(root, relativePath), "utf8");

const serverIndex = await read("server/index.ts");
const routes = await read("server/routes.ts");
const accountLimiter = await read("server/rate-limit.ts");

const requiredIndexFragments = [
  'app.set("trust proxy", 1)',
  "const globalLimiter",
  "max: 240",
  'app.use("/api/login", loginLimiter)',
  'app.use("/api/auth/google/callback", oauthCallbackLimiter)',
  'app.use("/api/kyc/didit/start", diditStartLimiter)',
  'app.use("/api/ledgers/:ledgerId/payments", paymentProviderLimiter)',
  'app.use("/api/cashfree/verify", paymentProviderLimiter)',
  'app.use("/api/chatbot", aiLimiter)',
  'app.use("/api/cashfree/webhook", webhookLimiter)',
  'app.use("/api/kyc/didit/webhook", webhookLimiter)',
];

for (const fragment of requiredIndexFragments) {
  if (!serverIndex.includes(fragment)) {
    throw new Error(`Missing required server rate-limit control: ${fragment}`);
  }
}

const requiredRouteFragments = [
  "paymentOrderAccountLimiter",
  "paymentVerificationAccountLimiter",
  "diditStartAccountLimiter",
  "diditPollAccountLimiter",
  "aiAccountLimiter",
  "notificationTriggerAccountLimiter",
  'app.post("/api/chatbot", isAuthenticated, aiAccountLimiter',
  'app.post("/api/kyc/didit/start", isAuthenticated, diditStartAccountLimiter',
];
for (const fragment of requiredRouteFragments) {
  if (!routes.includes(fragment)) {
    throw new Error(`Missing required per-account rate-limit control: ${fragment}`);
  }
}

if (!accountLimiter.includes("ipKeyGenerator") || !accountLimiter.includes("account:")) {
  throw new Error("Per-account limiter must use a safe IP fallback and a server-derived account key.");
}

const app = express();
app.set("trust proxy", 1);
app.use((req: any, _res, next) => {
  req.currentUser = { id: req.header("x-test-account") || "anonymous" };
  next();
});
app.post("/paid-operation", createAccountRateLimiter({
  windowMs: 60_000,
  max: 2,
  message: "Rate limit test",
}), (_req, res) => res.status(204).end());

const httpServer = createServer(app);
await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
const address = httpServer.address();
if (!address || typeof address === "string") throw new Error("Unable to bind rate-limit test server.");
const url = `http://127.0.0.1:${address.port}/paid-operation`;

async function call(account: string, forwardedIp: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-test-account": account,
      "x-forwarded-for": forwardedIp,
    },
  });
  return response.status;
}

try {
  const statuses = await Promise.all([
    call("account-a", "203.0.113.10"),
    call("account-a", "203.0.113.11"),
    call("account-a", "203.0.113.12"),
    call("account-b", "203.0.113.13"),
  ]);
  if (statuses[0] !== 204 || statuses[1] !== 204 || statuses[2] !== 429 || statuses[3] !== 204) {
    throw new Error(`Per-account rate-limit enforcement failed: ${statuses.join(", ")}`);
  }
} finally {
  await new Promise<void>((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve()));
}

console.log("Verified layered API rate limits and a server-derived per-account cap that resists client IP changes.");
