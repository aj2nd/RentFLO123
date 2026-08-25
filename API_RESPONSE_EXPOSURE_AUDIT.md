# API Response Exposure Audit

## Result

RentFLO now uses explicit server-side response DTOs for the main entity families instead of returning raw database rows. The audit found no password hashes because RentFLO uses Google OIDC and has no local password column. Session data, OAuth tokens, payment-provider secrets, KYC document values, push-subscription keys, and encrypted PII remain server-side and are not serialized in these API responses.

| Response family and endpoints trimmed | Fields retained for the client | Removed or withheld fields |
| --- | --- | --- |
| Properties: list, mine, get, create, join | ID, address, rent, payout day, creation time; relationship IDs only for owner/admin views that use them | Pending tenant email; relationship IDs for tenant views; owner ID outside admin views |
| Ledgers: list and administrative mutations | IDs, balances, status, month, timestamps, minimal property summary | Transfer proof URL and `processedBy` account ID |
| Payments: scoped list, list by ledger, manual submission, admin review, verify/reject | Amount, status, method, creation time; proof/UTR/order ID only in the admin review scope | Gateway payment ID, verifier ID, proof/UTR and provider order fields for non-admins |
| Maintenance tickets: list, create, resolve | Ticket content, permitted image, status/timestamps, property ID/address | Tenant ID and resolver ID |
| Agreements: mine, all, signing mutations | Status, property ID, signing timestamps, minimal property and party display details for admin | Signature URLs and legacy Leegality document IDs/URLs/timestamps |
| Notifications | ID, title, body, type, read state, safe internal URL, time | Recipient `userId` |
| Property messages and admin message summaries | Message ID, property ID, sender ID, body, read state, time | Receiver ID and raw property rows |
| User and KYC responses | Explicit profile fields plus masked financial/KYC values and document-presence flags | Encrypted document values, Didit/Digilocker request/session IDs and completion metadata, any unknown future database fields |
| Legacy admin conversations | Conversation/message IDs, titles/content, role, and timestamps | Raw-record spread behavior; no credentials or user profiles are returned |

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-response-exposure.ts
```

The check exercises each DTO with deliberately sensitive fields and asserts that user relationship identifiers, invitation emails, transfer proofs, provider payment IDs, verification account IDs, signature links, notification recipient IDs, and message receiver IDs do not appear unless an administrator needs a narrowly scoped field.
