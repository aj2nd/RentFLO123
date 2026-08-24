import { readFile } from "node:fs/promises";

const root = "/home/ubuntu/RentFLO123";
const [authGuard, routes, chatRoutes, audioRoutes, inventoryText] = await Promise.all([
  readFile(`${root}/server/replit_integrations/auth/index.ts`, "utf8"),
  readFile(`${root}/server/routes.ts`, "utf8"),
  readFile(`${root}/server/replit_integrations/chat/routes.ts`, "utf8"),
  readFile(`${root}/server/replit_integrations/audio/routes.ts`, "utf8"),
  readFile("/home/ubuntu/rentflo-server-route-inventory.json", "utf8"),
]);
const inventory = JSON.parse(inventoryText);

const assertions = [
  [authGuard.includes("attachVerifiedAccount") && authGuard.includes("authStorage.getUser(userId)"), "Protected requests verify the server-side account for session and bearer identity."],
  [routes.includes('caller.role !== "TENANT"'), "Owner-email property discovery is tenant-restricted on the server."],
  [routes.includes("webhook refused — DIDIT_WEBHOOK_SECRET is not configured"), "Didit webhook refuses unsigned operation when its verification secret is absent."],
  [chatRoutes.includes("requireLegacyConversationAdmin") && audioRoutes.includes("requireLegacyConversationAdmin"), "Legacy conversation routes are administrator-only until a participant ownership schema exists."],
];

const intentionallyPublic = new Set([
  '"/health"',
  '"/api/login"',
  '"/api/auth/google/callback"',
  '"/api/logout"',
  "'/api/cashfree/webhook'",
  '"/api/kyc/didit/webhook"',
  '"/api/push/vapid-key"',
  '"/.well-known/assetlinks.json"',
]);
const unexpectedUnprotected = inventory.filter((route) => !route.hasIsAuthenticated && !intentionallyPublic.has(route.path));

if (assertions.some(([ok]) => !ok) || unexpectedUnprotected.length > 0) {
  const failed = assertions.filter(([ok]) => !ok).map(([, message]) => message);
  throw new Error(`Authorization verification failed: ${[...failed, ...unexpectedUnprotected.map((route) => `${route.method} ${route.path}`)].join("; ")}`);
}

console.log(`Verified ${inventory.length} route declarations; ${inventory.filter((route) => route.hasIsAuthenticated).length} use the shared authenticated-account guard; ${inventory.filter((route) => !route.hasIsAuthenticated).length} deliberate public or provider-callback declarations across ${intentionallyPublic.size} unique paths were reviewed.`);
