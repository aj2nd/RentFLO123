import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { api } from "../shared/routes";
import { submitPaymentProofSchema } from "../shared/schema";
import { outstandingRent, ownerPayout, payoutFeeBasisPoints } from "../server/pricing";

const property = { monthlyRent: 20_000 };

assert.equal(outstandingRent(property, []), 20_000, "a new ledger must charge its configured monthly rent");
assert.equal(
  outstandingRent(property, [
    { amount: 5_000, status: "SUCCESS" },
    { amount: 2_000, status: "PENDING" },
    { amount: 1_000, status: "PENDING_VERIFICATION" },
  ]),
  15_000,
  "only completed payments may reduce the authoritative Cashfree balance",
);
assert.equal(outstandingRent(property, [{ amount: 25_000, status: "SUCCESS" }]), 0, "outstanding rent must never be negative");
assert.equal(payoutFeeBasisPoints(), 500, "the default payout fee must be five percent");
assert.equal(ownerPayout(property), 19_000, "owner payout must derive from server rent and server fee configuration");
process.env.RENTFLO_PAYOUT_FEE_BPS = "750";
assert.equal(ownerPayout(property), 18_500, "configured server payout fee must be honored");
process.env.RENTFLO_PAYOUT_FEE_BPS = "not-a-number";
assert.equal(payoutFeeBasisPoints(), 500, "invalid fee configuration must fail safely to the default");
delete process.env.RENTFLO_PAYOUT_FEE_BPS;

assert.equal(api.payments.create.input.safeParse({}).success, true, "Cashfree order creation accepts no browser amount");
assert.equal(api.payments.create.input.safeParse({ amount: 1 }).success, false, "Cashfree order creation must reject a browser amount");
assert.equal(api.ledgers.payOwner.input.safeParse({}).success, true, "owner payout accepts optional evidence only");
assert.equal(api.ledgers.payOwner.input.safeParse({ amountAdvanced: 1 }).success, false, "owner payout must reject a browser amount");
assert.equal(api.ledgers.collectRent.input.safeParse({}).success, true, "manual collection accepts no browser amount");
assert.equal(api.ledgers.collectRent.input.safeParse({ amountCollected: 1 }).success, false, "manual collection must reject a browser amount");
assert.equal(
  submitPaymentProofSchema.safeParse({ transactionRef: "ABC123", amount: 1 }).success,
  false,
  "manual proof must reject a browser amount",
);

const [routes, hook, payRentButton, adminDashboard] = await Promise.all([
  readFile("server/routes.ts", "utf8"),
  readFile("client/src/hooks/use-ledgers.ts", "utf8"),
  readFile("client/src/components/PayRentButton.tsx", "utf8"),
  readFile("client/src/pages/AdminDashboard.tsx", "utf8"),
]);

const createOrderStart = routes.indexOf("app.post('/api/ledgers/:id/create-order'");
const webhookStart = routes.indexOf("app.post('/api/cashfree/webhook'");
const createOrder = routes.slice(createOrderStart, webhookStart);
assert.ok(createOrderStart >= 0 && webhookStart > createOrderStart, "standard Cashfree order handler must remain present");
assert.match(createOrder, /const amountDue = outstandingRent\(property, existing\)/, "standard order must use trusted outstanding rent");
assert.match(createOrder, /order_amount: amountDue/, "standard provider order must use the trusted amount");
assert.match(createOrder, /amount: amountDue/, "standard pending payment must persist the trusted amount");
assert.match(createOrder, /status: "PENDING"/, "standard provider order must create a pending server payment");

const webhook = routes.slice(webhookStart, routes.indexOf("// Authenticated verification route", webhookStart));
assert.match(webhook, /providerAmount !== pendingPayment\.amount \|\| pendingPayment\.amount !== expectedAmount/, "webhook must compare provider, pending, and expected amounts");
assert.match(webhook, /amountPaid !== expectedAmount/, "webhook fallback must reject a provider amount that differs from outstanding rent");

const verifyStart = routes.indexOf("app.post('/api/cashfree/verify/:orderId'");
const verify = routes.slice(verifyStart, routes.indexOf("// === PARTIAL PAYMENTS", verifyStart));
assert.match(verify, /amount !== pending\.amount \|\| pending\.amount !== expectedAmount/, "reconciliation must compare provider, pending, and expected amounts");
assert.match(verify, /amount !== expectedAmount/, "reconciliation fallback must reject a non-authoritative provider amount");

const partialStart = routes.indexOf("app.post(api.payments.create.path");
const partial = routes.slice(partialStart, routes.indexOf("// Tenant: submit UPI", partialStart));
assert.match(partial, /api\.payments\.create\.input\.parse\(req\.body\)/, "payment request body must still be strictly parsed");
assert.doesNotMatch(partial, /input\.amount/, "payment handler must not use a client amount");
assert.match(partial, /const amountDue = outstandingRent\(property, existing\)/, "payment handler must derive outstanding rent");
assert.match(partial, /amount: amountDue/, "payment handler must persist the derived amount");

const proofStart = routes.indexOf('app.post("/api/ledgers/:id/submit-payment-proof"');
const proof = routes.slice(proofStart, routes.indexOf("// Admin: verify a payment", proofStart));
assert.doesNotMatch(proof, /input\.amount/, "manual proof handler must not use a client amount");
assert.match(proof, /amount: remaining/, "manual proof must persist the server-calculated remaining balance");

const payoutStart = routes.indexOf("app.post(api.ledgers.payOwner.path");
const payout = routes.slice(payoutStart, routes.indexOf("app.post(api.ledgers.collectRent.path", payoutStart));
assert.match(payout, /const amountAdvanced = ownerPayout\(prop\)/, "payout must use server rent and fee configuration");
assert.doesNotMatch(payout, /input\.amountAdvanced/, "payout handler must not use a browser amount");
assert.match(routes, /const newAmountCollected = property\.monthlyRent/, "manual collection must derive the full rent from property records");

assert.match(hook, /mutationFn: async \(\{ ledgerId \}: \{ ledgerId: string \}\)/, "client order helper must not accept an amount");
assert.match(hook, /body: JSON\.stringify\(\{\}\)/, "client order helper must post an amount-free body");
assert.doesNotMatch(payRentButton, /submit-payment-proof[\s\S]{0,260}amount,/, "manual proof browser request must omit amount");
assert.doesNotMatch(adminDashboard, /register\("amountAdvanced"\)/, "admin payout UI must not expose an editable amount field");
assert.doesNotMatch(adminDashboard, /amountAdvanced: Number\(data\.amountAdvanced\)/, "admin payout UI must not submit an amount");

console.log("Verified strict amount-free browser contracts, server-calculated rent/payouts, and Cashfree reconciliation against trusted pending and ledger records.");
