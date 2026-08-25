import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { verifyCashfreeWebhookSignature } from "../server/payment-webhook-security";

const secret = "test-cashfree-webhook-secret";
const timestamp = "1760000000000";
const version = "2023-08-01";
const rawBody = Buffer.from(JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "order_1" } } }), "utf8");
const signature = crypto.createHmac("sha256", secret).update(timestamp, "utf8").update(rawBody).digest("base64");

assert.equal(verifyCashfreeWebhookSignature({ signature, timestamp, version }, rawBody, secret), true, "valid raw payload signature must be accepted");
assert.equal(verifyCashfreeWebhookSignature({ signature: `${signature.slice(0, -2)}AA`, timestamp, version }, rawBody, secret), false, "tampered signature must be rejected");
assert.equal(verifyCashfreeWebhookSignature({ signature, timestamp, version }, Buffer.from(`${rawBody} `), secret), false, "tampered raw payload must be rejected");
assert.equal(verifyCashfreeWebhookSignature({ signature, timestamp, version: undefined }, rawBody, secret), false, "missing webhook version must be rejected");
assert.equal(verifyCashfreeWebhookSignature({ signature, timestamp: "not-a-timestamp", version }, rawBody, secret), false, "malformed timestamp must be rejected");
assert.equal(verifyCashfreeWebhookSignature({ signature, timestamp, version }, rawBody, undefined), false, "missing server secret must fail closed");

const [routes, index] = await Promise.all([readFile("server/routes.ts", "utf8"), readFile("server/index.ts", "utf8")]);
const webhookStart = routes.indexOf("app.post('/api/cashfree/webhook'");
const parseStart = routes.indexOf("JSON.parse(rawBody.toString('utf8'))", webhookStart);
const mutationStart = routes.indexOf("storage.updatePayment", webhookStart);
const verificationStart = routes.indexOf("verifyCashfreeWebhookSignature", webhookStart);
assert.ok(webhookStart >= 0 && verificationStart > webhookStart, "Cashfree webhook must call the verifier");
assert.ok(verificationStart < parseStart, "signature must be verified before parsing webhook JSON");
assert.ok(verificationStart < mutationStart, "signature must be verified before payment mutation");
assert.match(routes.slice(webhookStart, parseStart), /status\(401\).*Invalid webhook signature/s, "failed signatures must return 401");
assert.match(index, /req\.rawBody = buf/, "raw body must be captured before route handling");

console.log("Verified Cashfree raw-payload HMAC, mandatory headers, fail-closed rejection, and pre-mutation verification ordering.");
