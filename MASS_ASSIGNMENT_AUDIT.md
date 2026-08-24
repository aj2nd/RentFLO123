# RentFLO Create and Update Field-Allowlist Audit

**Audit date:** 24 August 2026  
**Result:** Every browser-facing create or update action now parses an explicit field allowlist or constructs the persistence payload from explicit values. No route spreads `req.body` into a database create or update call.

## Newly locked down endpoints

| Endpoint | Browser-permitted fields | Server-controlled or rejected fields |
|---|---|---|
| `POST /api/properties` | `address`, `monthlyRent`, `payoutDay`, optional `tenantEmail` | `id`, `ownerId`, `tenantId`, `pendingTenantEmail`, timestamps, role-like fields, and arbitrary extras are rejected. Owner ID comes from the verified session. Tenant assignment is resolved by server email lookup and only when the account has `TENANT` role. |
| `POST /api/tickets` | `propertyId`, `title`, `description`, optional image URL/data | `tenantId`, status, resolver, resolution time, timestamps, and arbitrary extras are rejected. Tenant ID is set from the verified session. |
| `POST /api/kyc/submit` | Legal name, PAN/Aadhaar, KYC document, bank account, IFSC, and cheque document | Unknown fields are rejected. `isVerified` is always set to `false` server-side; a user cannot self-approve KYC or submit role/account fields. |
| `POST /api/push/subscribe` | `endpoint`, `p256dh`, `auth` | Unknown fields are rejected. `userId` is derived from the verified session. |
| `POST /api/push/unsubscribe` | `endpoint` | Unknown fields are rejected; deletion is scoped to the verified caller’s subscription. |
| `POST /api/chatbot` | Bounded messages and optional display context | Unknown root, message, and context fields are rejected. This endpoint does not write account or business records. |

## Existing safe create and update actions

| Endpoint group | Field boundary |
|---|---|
| Property join | No body; the server sets tenant ID from the authenticated session after invitation-email verification. |
| Ledger payout/collection | Narrow amount/proof schemas; status, processor, timestamps, and ledger identifiers are server-set and admin-restricted. |
| Cashfree and manual payments | Narrow amount/UTR/proof schemas; payment method, order identifiers, verified-by, status, and ledger totals are server-controlled. |
| Payment verify/reject | Only bounded `rejectionReason` is accepted; verification metadata and status are server-set for admins. |
| Ticket resolve | No body; server derives resolver and timestamps. |
| KYC verification and Didit webhook | User ID/status changes are set only by admin or signature-verified provider flow. |
| Agreements | No browser-controlled update payload; signature states are set by the permitted server workflow. |
| Messages | Only bounded message body is accepted; property, sender, receiver, read state, and timestamps are server-derived. |
| Auth profile and role selection | Profile accepts only bounded first/last names. Onboarding permits only `TENANT` or `OWNER`; `ADMIN` cannot be self-assigned. |
| Legacy chat/audio | Only title, text, or audio is read from the body; routes remain administrator-only until participant ownership exists. |

## Internal persistence helpers

`storage.updateLedger`, `storage.updatePayment`, `storage.updateTicket`, and `authStorage.updateUser` remain generic internal helpers. They are not API endpoints and are called by current routes only with server-constructed allowlists. Any future route must not pass an unvalidated request body to these helpers; `scripts/verify-mass-assignment.ts` checks for raw `req.body` spreading.
