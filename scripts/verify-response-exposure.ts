import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  agreementResponse,
  ledgerResponse,
  notificationResponse,
  paymentResponse,
  propertyMessageResponse,
  propertyResponse,
  ticketResponse,
} from "../server/response-serializers";

const property = { id: "p1", address: "1 Example Street", monthlyRent: 50000, payoutDay: 5, createdAt: new Date(), ownerId: "owner", tenantId: "tenant", pendingTenantEmail: "tenant@example.com" };
const tenantProperty = propertyResponse(property, "TENANT") as Record<string, unknown>;
assert.equal(tenantProperty.ownerId, undefined);
assert.equal(tenantProperty.tenantId, undefined);
assert.equal(tenantProperty.pendingTenantEmail, undefined);
assert.equal((propertyResponse(property, "ADMIN") as Record<string, unknown>).pendingTenantEmail, undefined);

const ledger = ledgerResponse({ id: "l1", propertyId: "p1", amountAdvanced: 1, amountCollected: 2, status: "ARREARS", monthYear: "2026-08", createdAt: new Date(), updatedAt: new Date(), proofOfTransferUrl: "https://private.example/proof", processedBy: "admin", property }, "TENANT") as Record<string, unknown>;
assert.equal(ledger.proofOfTransferUrl, undefined);
assert.equal(ledger.processedBy, undefined);
assert.equal((ledger.property as Record<string, unknown>).ownerId, undefined);

const payment = { id: "pay1", ledgerId: "l1", amount: 10, paymentMethod: "CASHFREE", status: "SUCCESS", rejectionReason: null, createdAt: new Date(), razorpayOrderId: "gateway-order", razorpayPaymentId: "gateway-payment", transactionRef: "UTR", proofScreenshotUrl: "https://proof", verifiedBy: "admin", verifiedAt: new Date() };
const tenantPayment = paymentResponse(payment, "TENANT") as Record<string, unknown>;
for (const field of ["razorpayOrderId", "razorpayPaymentId", "transactionRef", "proofScreenshotUrl", "verifiedBy", "verifiedAt"]) assert.equal(tenantPayment[field], undefined, `${field} must not be exposed to non-admins`);
const adminPayment = paymentResponse(payment, "ADMIN") as Record<string, unknown>;
assert.equal(adminPayment.razorpayOrderId, "gateway-order");
assert.equal(adminPayment.razorpayPaymentId, undefined);
assert.equal(adminPayment.verifiedBy, undefined);

const ticket = ticketResponse({ id: "t1", propertyId: "p1", tenantId: "tenant", resolvedBy: "admin", title: "Leak", description: "Fix", photoUrl: null, status: "OPEN", createdAt: new Date(), updatedAt: new Date(), property });
assert.equal((ticket as Record<string, unknown>).tenantId, undefined);
assert.equal((ticket as Record<string, unknown>).resolvedBy, undefined);
const agreement = agreementResponse({ id: "a1", propertyId: "p1", status: "PENDING", ownerSignatureUrl: "https://signature", tenantSignatureUrl: "https://signature", leegalityDocumentId: "provider-doc", leegalitySignedUrl: "https://provider", createdAt: new Date() }) as Record<string, unknown>;
for (const field of ["ownerSignatureUrl", "tenantSignatureUrl", "leegalityDocumentId", "leegalitySignedUrl"]) assert.equal(agreement[field], undefined, `${field} must not be exposed`);
assert.equal((notificationResponse({ id: "n1", userId: "user", title: "Notice", body: "Body", type: "RENT_DUE", read: false, url: "/tenant", createdAt: new Date() }) as Record<string, unknown>).userId, undefined);
assert.equal((propertyMessageResponse({ id: "m1", propertyId: "p1", senderId: "sender", receiverId: "receiver", body: "Hi", read: false, createdAt: new Date() }) as Record<string, unknown>).receiverId, undefined);

const [routes, security] = await Promise.all([readFile("server/routes.ts", "utf8"), readFile("server/security.ts", "utf8")]);
for (const expected of ["propertyResponse", "ledgerResponse", "paymentResponse", "ticketResponse", "agreementResponse", "notificationResponse", "propertyMessageResponse"]) assert.match(routes, new RegExp(expected));
assert.doesNotMatch(security, /\.\.\.rest/, "publicUser must use an explicit field allowlist");
assert.doesNotMatch(security, /diditSessionId/, "publicUser must not expose Didit session identifiers");
assert.doesNotMatch(security, /digilockerRequestId/, "publicUser must not expose Digilocker request identifiers");

console.log("Verified response DTO allowlists remove private relationship, payment, document, notification, and message fields.");
