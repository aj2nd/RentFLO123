# Payment Webhook Signature Verification Audit

## Incoming payment webhooks

RentFLO currently receives payment webhooks only from **Cashfree** at `POST /api/cashfree/webhook`. Payment creation and browser-side payment verification are authenticated application routes, not provider webhooks; no other payment-provider inbound callback is registered.

Cashfree requires a Base64 HMAC-SHA256 signature over the exact string formed by `x-webhook-timestamp` followed by the unmodified raw request payload. Cashfree documents `x-webhook-signature`, `x-webhook-timestamp`, and `x-webhook-version` as required headers and advises validation before processing. [1] [2]

| Control | Enforcement |
| --- | --- |
| Signing secret | Uses `CASHFREE_WEBHOOK_SECRET` when set, otherwise the existing server-only `CASHFREE_SECRET_KEY`. Missing configuration fails closed with `503`; no payment data is processed. |
| Mandatory headers | Requires single string values for `x-webhook-signature`, 13-digit `x-webhook-timestamp`, and a bounded `x-webhook-version`. Missing, duplicate, malformed, or oversized values fail. |
| Raw-payload signing | Captures `req.rawBody` before JSON parsing or sanitization and calculates HMAC-SHA256 over `timestamp + rawBody` using the Cashfree PG secret key. |
| Comparison | Uses Node’s timing-safe byte comparison after a length check. |
| Failure behavior | Every failed signature/header/raw-body check returns **401** before JSON parsing, provider calls, payment writes, ledger updates, or notifications. |
| Post-verification behavior | Only a valid, schema-checked `PAYMENT_SUCCESS_WEBHOOK` with `SUCCESS` status can mutate a payment/ledger. Existing database uniqueness and status checks make duplicate valid deliveries idempotent. |

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-payment-webhook-security.ts
```

The test signs a known raw payload and proves that valid HMAC is accepted while tampered signatures, altered bytes, missing version, malformed timestamp, and missing secret are rejected. It also verifies that the route invokes signature verification before JSON parsing and before any payment state mutation.

## References

[1]: https://www.cashfree.com/docs/payments/online/webhooks/signature-verification "Cashfree Payment Webhook Signature Verification"
[2]: https://www.cashfree.com/docs/payments/online/webhooks/security-checklist "Cashfree Payment Webhook Security Checklist"
