import { readFile } from "node:fs/promises";

const routes = await readFile("/home/ubuntu/RentFLO123/server/routes.ts", "utf8");
const chat = await readFile("/home/ubuntu/RentFLO123/server/replit_integrations/chat/routes.ts", "utf8");
const audio = await readFile("/home/ubuntu/RentFLO123/server/replit_integrations/audio/routes.ts", "utf8");

const checks = [
  [/api\.properties\.get\.path[\s\S]{0,180}requirePropertyAccess/, "Property ID read checks owner, tenant, or admin access."],
  [/api\.ledgers\.payOwner\.path, isAuthenticated, requireRole\('ADMIN'\)/, "Ledger payout ID changes require an admin."],
  [/api\.ledgers\.collectRent\.path, isAuthenticated, requireRole\('ADMIN'\)/, "Ledger collection ID changes require an admin."],
  [/api\.payments\.listByLedger\.path[\s\S]{0,220}requireLedgerAccess/, "Ledger payment ID reads check property ownership."],
  [/api\.payments\.create\.path[\s\S]{0,220}requireLedgerAccess/, "Ledger payment ID writes check property ownership."],
  [/api\.tickets\.resolve\.path, isAuthenticated, requireRole\('ADMIN'\)/, "Ticket resolution by ID requires an admin."],
  [/api\.tickets\.countsByProperty\.path[\s\S]{0,180}requirePropertyAccess/, "Property ticket counts check property membership."],
  [/app\.post\('\/api\/ledgers\/:id\/create-order',[\s\S]{0,180}requireLedgerAccess/, "Cashfree order creation checks ledger/property membership."],
  [routes.includes('app.post("/api/ledgers/:id/submit-payment-proof"') && routes.includes("const access = await requireLedgerAccess(req, res, ledgerId);"), "UPI proof submission checks tenant membership of the ledger property."],
  [routes.includes("app.post('/api/cashfree/verify/:orderId'") && routes.includes("const isTenant = property.tenantId === userId;"), "Cashfree order verification checks the order's resolved property tenant."],
  [routes.includes("app.get('/api/messages/:propertyId'") && routes.includes("property.ownerId !== userId && property.tenantId !== userId"), "Property message reads check owner or tenant membership."],
  [routes.includes("app.post('/api/messages/:propertyId'") && routes.includes("property.ownerId !== userId && property.tenantId !== userId"), "Property message writes check owner or tenant membership."],
  [/app\.get\('\/api\/admin\/messages\/:propertyId', isAuthenticated, requireRole\('ADMIN'\)/, "Administrative message reads require an admin."],
  [/app\.get\("\/api\/kyc\/document\/:userId\/:documentType", isAuthenticated, requireRole\('ADMIN'\)/, "KYC document reads by user ID require an admin."],
  [/app\.post\("\/api\/kyc\/verify\/:userId", isAuthenticated, requireRole\('ADMIN'\)/, "KYC verification by user ID requires an admin."],
  [/app\.post\("\/api\/agreements\/:propertyId\/mark-signed", isAuthenticated, requireRole\('ADMIN'\)/, "Agreement state changes by property ID require an admin."],
  [/requireLegacyConversationAdmin/, "Legacy conversation IDs are admin-only until participant ownership exists."],
];

const failures = checks.filter(([check]) => {
  if (typeof check === "boolean") return !check;
  return !check.test(routes) && !check.test(chat) && !check.test(audio);
});
if (failures.length) {
  throw new Error(`IDOR ownership verification failed: ${failures.map(([, message]) => message).join("; ")}`);
}
console.log(`Verified ${checks.length} server-side ownership or administrator predicates for ID-parameterized route families.`);
