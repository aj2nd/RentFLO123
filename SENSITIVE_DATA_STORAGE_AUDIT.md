# RentFLO Sensitive Data Storage Audit

**Audit date:** 24 August 2026

## Encryption model

RentFLO now uses an AES-256-GCM envelope (`enc:v1:`) for protected values. The encryption key is supplied through the server-only `PII_ENCRYPTION_KEY` environment variable. Production rejects a missing key and short values. Standard 32-byte keys (`64` hexadecimal characters or Base64 decoding to `32` bytes) are used directly. A pre-existing server-only Railway secret of at least 32 characters is deterministically expanded with SHA-256 for compatibility with the encrypted-session rollout; this is not a plaintext or client-controlled fallback.

## Fields changed

| Store and field | Previous state | Current protection |
|---|---|---|
| `users.full_legal_name` | Readable text | AES-256-GCM encrypted; decrypted only inside trusted server flows. |
| `users.pan_number` | Already encrypted for new KYC submissions | Startup backfill encrypts legacy readable rows. |
| `users.aadhaar_number` | Already encrypted for new KYC submissions | Startup backfill encrypts legacy readable rows. |
| `users.bank_account_number` | Already encrypted for new KYC submissions | Startup backfill encrypts legacy readable rows. |
| `users.ifsc_code` | Readable text | AES-256-GCM encrypted and masked in API responses. |
| `users.kyc_document_url` | Readable URL or embedded document payload | AES-256-GCM encrypted; no longer returned in profile or admin JSON. |
| `users.cancelled_cheque_url` | Readable URL or embedded document payload | AES-256-GCM encrypted; released only by an admin-only, no-store document endpoint. |
| `sessions.sess` | Readable PostgreSQL JSON, including Passport OAuth tokens | Encrypted session envelope. Existing readable sessions are rewritten on next use. |
| Didit provider response logs | Response fragments could include document data or session tokens | Logs now contain only method, endpoint, and HTTP status. |

The startup backfill is idempotent: it encrypts only values that do not already carry the RentFLO encryption envelope. It does not print or log protected values.

## API exposure changes

`publicUser()` now omits document URLs and provider session/request identifiers. It returns boolean document-presence flags and masked PAN, Aadhaar, bank-account, and IFSC values. The admin KYC interface obtains a document through an authenticated same-origin endpoint with `Cache-Control: no-store`; it never receives the encrypted database value or a stored raw URL in JSON.

## Fields requiring a follow-up migration

| Field or category | Why it needs review | Recommended approach |
|---|---|---|
| `users.email`, `first_name`, `last_name`, and `profile_image_url` | Personal data remains readable because login, profile display, and tenant email matching need direct access. | Encrypt source values and add normalized HMAC lookup columns for email searches and tenant matching. |
| `properties.pending_tenant_email` | Personal email remains readable for automatic tenant matching. | Store an encrypted email plus a keyed HMAC lookup column; query the HMAC, not the plaintext. |
| `users.didit_session_id` | Provider session identifier is readable because the Didit webhook must look it up. | Add an encrypted value plus a keyed HMAC lookup column, then update webhook lookup. |
| Payment identifiers and proof fields (`transaction_ref`, gateway IDs, proof URLs) | UTRs, gateway IDs, and payment receipts can be sensitive and some are queried for deduplication. | Store encrypted display values and HMAC/unique lookup values for deduplication; encrypt proof URLs or move files to private object storage. |
| Push subscriptions (`endpoint`, `p256dh`, `auth`) | Subscription credentials are needed to send a push but are stored directly. | Encrypt subscription credentials and decrypt only immediately before sending a push. |
| Agreements, transfer proofs, maintenance photos, and message bodies | These can contain personal, financial, or document data. | Store private objects outside public URLs; encrypt stored URLs/metadata and define retention limits. |
| PostgreSQL backups, Railway logs, and provider dashboards | Encryption in application tables does not protect external copies or operational logs. | Enable encrypted backups, strict access controls, retention limits, and log redaction in each service. |

> The follow-up items are deliberately not auto-encrypted because their existing lookup and delivery paths would break without a separate HMAC index, private file store, or migration plan. They are the remaining review items—not claims that they are already encrypted.
