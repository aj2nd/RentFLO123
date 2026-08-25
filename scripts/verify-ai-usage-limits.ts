import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import express from "express";
import { createAiUsageLimiter, type AiUsageLimitOptions } from "../server/ai-usage-limit";

const options: AiUsageLimitOptions = {
  feature: "test_chat",
  windowMs: 24 * 60 * 60 * 1000,
  max: 2,
  message: "Your daily test AI limit has been reached.",
};
const usageByAccount = new Map<string, number>();
const testLimiter = createAiUsageLimiter(options, async (accountId, limit) => {
  const count = (usageByAccount.get(accountId) || 0) + 1;
  usageByAccount.set(accountId, count);
  const resetAt = new Date("2030-01-02T00:00:00.000Z");
  return count <= limit.max
    ? { allowed: true, remaining: limit.max - count, resetAt }
    : { allowed: false, remaining: 0, resetAt };
});

const app = express();
app.set("trust proxy", 1);
app.use((req: any, _res, next) => {
  req.currentUser = { id: req.header("x-test-account") || "anonymous" };
  next();
});
app.post("/paid-ai", testLimiter, (_req, res) => res.status(204).end());

const server = createServer(app);
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("Unable to bind AI quota test server.");
const url = `http://127.0.0.1:${address.port}/paid-ai`;

async function call(account: string, forwardedIp: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "x-test-account": account, "x-forwarded-for": forwardedIp },
  });
  return { status: response.status, headers: response.headers, body: await response.json().catch(() => null) };
}

try {
  const first = await call("account-a", "203.0.113.10");
  const second = await call("account-a", "203.0.113.11");
  const blocked = await call("account-a", "203.0.113.12");
  const otherAccount = await call("account-b", "203.0.113.12");

  assert.equal(first.status, 204, "first paid AI request must be allowed");
  assert.equal(first.headers.get("x-ai-usage-remaining"), "1", "response must expose remaining daily requests");
  assert.equal(second.status, 204, "second paid AI request must be allowed");
  assert.equal(blocked.status, 429, "third request from the same account must be blocked even after changing IP");
  assert.equal(blocked.body?.code, "AI_USAGE_LIMIT_REACHED", "cap response must provide a machine-readable code");
  assert.match(blocked.body?.message || "", /daily test AI limit has been reached/i, "cap response must clearly explain the limit");
  assert.equal(otherAccount.status, 204, "a different account must have an independent quota");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

const [quotaSource, routes, legacyChat, audioRoutes, imageRoutes] = await Promise.all([
  readFile("server/ai-usage-limit.ts", "utf8"),
  readFile("server/routes.ts", "utf8"),
  readFile("server/replit_integrations/chat/routes.ts", "utf8"),
  readFile("server/replit_integrations/audio/routes.ts", "utf8"),
  readFile("server/replit_integrations/image/routes.ts", "utf8"),
]);

assert.match(quotaSource, /CREATE TABLE IF NOT EXISTS "ai_usage_limits"/, "quota records must be durable in PostgreSQL");
assert.match(quotaSource, /ON CONFLICT \("account_id", "feature", "window_started_at"\)/, "quota counter must update atomically");
assert.match(quotaSource, /WHERE "ai_usage_limits"\."request_count" < \$4/, "atomic increment must stop at the configured cap");
assert.match(quotaSource, /status\(429\)/, "reached quotas must return HTTP 429");
assert.match(quotaSource, /AI_USAGE_LIMIT_REACHED/, "reached quotas must have a stable response code");
assert.match(routes, /chatbotDailyUsageLimiter/, "primary chatbot must have a durable daily quota");
assert.match(routes, /app\.post\("\/api\/chatbot", isAuthenticated, aiAccountLimiter, validateRequest\(\{ body: chatSchema \}\), chatbotDailyUsageLimiter/, "chatbot must validate before its server-side quota and model invocation");
assert.match(legacyChat, /legacyTextChatDailyUsageLimiter/, "legacy text chat must have a daily quota if enabled");
assert.match(audioRoutes, /legacyVoiceChatDailyUsageLimiter/, "voice chat must have a daily quota if enabled");
assert.match(imageRoutes, /imageGenerationDailyUsageLimiter/, "image generation must have a daily quota if enabled");

console.log("Verified durable per-account paid-AI quotas, clear 429 cap responses, IP-change resistance, and coverage of chatbot, text, voice, and image model routes.");
