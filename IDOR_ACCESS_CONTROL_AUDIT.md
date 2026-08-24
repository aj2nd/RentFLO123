# RentFLO ID-Based Access-Control Audit

**Audit date:** 24 August 2026  
**Result:** No remaining reachable ID-based route was found that relies on authentication alone. Every read or state change using a target identifier has a server-side property/ledger relationship check or verified administrator guard.

## Ownership and authorization predicates

| Endpoint | Target record | Server-side check |
|---|---|---|
| `GET /api/properties/:id` | Property | `requirePropertyAccess`: caller must be the property owner, assigned tenant, or verified admin. |
| `POST /api/properties/:id/join` | Property | Caller must be a verified `TENANT`; property must be vacant and its stored invitation email must equal the authenticated caller’s email. |
| `GET /api/ledgers?propertyId=:id` | Property ledgers | `requirePropertyAccess` runs before ledger lookup. |
| `POST /api/ledgers/:id/pay-owner` | Ledger | Verified `ADMIN` role only. |
| `POST /api/ledgers/:id/collect-rent` | Ledger | Verified `ADMIN` role only. |
| `POST /api/ledgers/:id/create-order` | Ledger | `requireLedgerAccess` resolves the ledger’s property; caller must be its tenant or an admin. |
| `POST /api/ledgers/:id/submit-payment-proof` | Ledger | `requireLedgerAccess` plus tenant-only role. |
| `GET /api/ledgers/:ledgerId/payments` | Ledger payments | `requireLedgerAccess` resolves owner/tenant/admin access. |
| `POST /api/ledgers/:ledgerId/payments` | Ledger payments | `requireLedgerAccess` plus tenant-or-admin payment role. |
| `POST /api/cashfree/verify/:orderId` | Gateway order / resolved ledger | Server resolves the order to a ledger and property, then requires the assigned tenant or verified admin. |
| `POST /api/payments/:id/verify` | Payment | Verified `ADMIN` role only. |
| `POST /api/payments/:id/reject` | Payment | Verified `ADMIN` role only. |
| `POST /api/tickets/:id/resolve` | Maintenance ticket | Verified `ADMIN` role only. |
| `GET /api/properties/:id/ticket-counts` | Property tickets | `requirePropertyAccess` validates owner, tenant, or admin relationship. |
| `GET /api/kyc/document/:userId/:documentType` | KYC document | Verified `ADMIN` role only. |
| `POST /api/kyc/verify/:userId` | KYC record | Verified `ADMIN` role only. |
| `POST /api/agreements/:propertyId/mark-signed` | Agreement / property | Verified `ADMIN` role only. |
| `POST /api/agreements/:propertyId/mark-owner-signed` | Agreement / property | Verified `ADMIN` role only. |
| `POST /api/agreements/:propertyId/mark-tenant-signed` | Agreement / property | Verified `ADMIN` role only. |
| `GET /api/messages/:propertyId` | Property messages | Server checks the caller is that property’s owner or tenant before reading and marking messages read. |
| `POST /api/messages/:propertyId` | Property messages | Server checks owner/tenant membership and derives `senderId` and `receiverId` itself. |
| `GET /api/admin/messages/:propertyId` | Property message thread | Verified `ADMIN` role only. |
| Legacy `/api/conversations/:id*` | Legacy conversations | The legacy schema has no participant relation, so routes are administrator-only until a participant ownership migration exists. |

## Protection added during this audit sequence

The shared authenticated-route middleware now rejects a valid session or bearer token unless it maps to an existing server-side account. Legacy chat and audio routes, which previously accepted arbitrary conversation IDs after authentication, are now administrator-only. These protections ensure a user cannot claim another identity through client input or operate on cross-user legacy conversation records.

> The owner/tenant relationship predicates derive identity from the verified session or bearer token (`req.user.claims.sub`) and fetch the target property or ledger server-side. They do not trust owner ID, tenant ID, sender ID, or receiver ID values sent by the browser.
