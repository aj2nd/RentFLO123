import crypto from "node:crypto";

const BASE64_SIGNATURE = /^[A-Za-z0-9+/]+={0,2}$/;
const MILLIS_TIMESTAMP = /^\d{13}$/;
const WEBHOOK_VERSION = /^[A-Za-z0-9._-]{1,64}$/;

function singleHeader(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, "utf8");
  const rightBytes = Buffer.from(right, "utf8");
  return leftBytes.length === rightBytes.length && crypto.timingSafeEqual(leftBytes, rightBytes);
}

export type CashfreeWebhookHeaders = {
  signature: unknown;
  timestamp: unknown;
  version: unknown;
};

/**
 * Cashfree signs the exact string `${x-webhook-timestamp}${rawBody}` with the
 * PG secret key using HMAC-SHA256 and Base64 encoding. Header and payload
 * checks happen before JSON parsing or any payment state mutation.
 */
export function verifyCashfreeWebhookSignature(
  headers: CashfreeWebhookHeaders,
  rawBody: unknown,
  secret: string | undefined,
): boolean {
  const signature = singleHeader(headers.signature);
  const timestamp = singleHeader(headers.timestamp);
  const version = singleHeader(headers.version);
  if (!secret || !Buffer.isBuffer(rawBody) || rawBody.length === 0) return false;
  if (!signature || !BASE64_SIGNATURE.test(signature) || signature.length > 512) return false;
  if (!timestamp || !MILLIS_TIMESTAMP.test(timestamp)) return false;
  if (!version || !WEBHOOK_VERSION.test(version)) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp, "utf8")
    .update(rawBody)
    .digest("base64");
  return constantTimeEqual(expected, signature);
}

export function cashfreeWebhookSecret(): string | undefined {
  // Cashfree's payment-gateway secret key is the documented HMAC key. The
  // dedicated variable lets deployments isolate webhook credentials if needed.
  return process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY;
}
