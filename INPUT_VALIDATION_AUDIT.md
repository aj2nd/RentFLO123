# Server Input Validation and Sanitization Audit

## Enforced application-wide controls

Every JSON or form payload is limited to **2 MB** at the Express parser boundary. The server then sanitizes string fields with a no-HTML allowlist before application routes use them. Signed Cashfree and Didit webhooks are intentionally excluded from mutation before their raw signatures are verified; the fields RentFLO reads from those signed payloads are validated after signature verification.

All route schemas reject unknown keys using Zod `.strict()`, and every route parameter or query string that RentFLO consumes is validated before it reaches storage or an external provider.

| Input surface | Controls applied |
| --- | --- |
| Resource IDs in properties, ledgers, tickets, payments, KYC, agreements, and property messages | UUID format required before authorization or storage lookup. |
| Cashfree order ID | 1–128 character alphanumeric, underscore, or hyphen identifier required. |
| Ledger and ticket filters | Strict query objects; UUID property IDs and fixed status enums only. |
| Email lookup and owner invitation search | Strict query object; trimmed valid email at most 254 characters. |
| Local UPI QR data | Strict one-field query object; maximum 2,048 characters, then `upi:` URL and payee checks. |
| Property creation | Strict body; address 3–1,000 chars, integer rent 1–10,000,000, payout day 1–31, optional valid tenant email. |
| Payment amounts and proof | Strict bodies; finite positive integer amounts, bounded HTTPS URLs, and bounded alphanumeric UTR references. |
| Payment rejection | Strict optional 1–500 character reason; payment UUID required. |
| Maintenance tickets | Strict body; UUID property ID, title 1–200 chars, description 1–5,000 chars, bounded HTTPS/base64 image only. |
| KYC submission | Strict body; bounded name, PAN/Aadhaar/IFSC/account format checks, and bounded HTTPS or supported base64 document values. |
| Profile and role onboarding | Strict bodies; role enum limited to tenant/owner, profile fields 1–100 chars, at least one profile field required. |
| Push subscription | Strict body; HTTPS endpoint and bounded base64url key/auth fields. |
| Property and legacy chat messages | Strict body; sanitized non-empty text with 2,000/4,000 character limits. |
| Chatbot | Existing strict nested body schema; max 20 messages, permitted roles, 4,000-character content, and bounded context. |
| Image generation | Strict body; sanitized 1–1,000 character prompt and fixed allowed image dimensions. |
| Legacy audio | Strict body; positive integer conversation ID, base64-only audio capped at 10 MB decoded / 14 MB encoded, and fixed voice enum. |
| Login and Android bearer token | Strict login query with only optional `platform=android`; bearer header must have bounded three-segment JWT shape before verification. |
| Webhooks | Signature header size/format checks, raw signature verification, then a bounded projection of the signed payload fields RentFLO reads. |
| Bodyless state changes | Empty strict body required; unexpected JSON keys are rejected. |

## Sanitization behavior

Sanitization removes HTML tags and event-handler content from regular user-controlled strings before validation or persistence. The post-sanitization schema still enforces required minimum lengths, so a payload that becomes empty after sanitization is rejected rather than silently stored. This avoids preserving executable markup while keeping plain business text intact.

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-input-validation.ts
```

The test proves strict unknown-field rejection, invalid ID and query rejection, empty-body enforcement, HTML removal, and the preservation of signed webhook bodies for signature verification.
