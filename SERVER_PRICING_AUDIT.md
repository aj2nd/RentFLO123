# Server-Authoritative Pricing Audit

RentFLO now treats the `properties.monthlyRent` record as the trusted rent source. A browser may display a price for usability, but no payment, proof, collection, or payout handler accepts that display value as the final price.

| Former client-controlled source | Previous risk | Trusted replacement | Current behavior |
|---|---|---|---|
| `POST /api/ledgers/:ledgerId/payments` body `amount` | A tenant could choose the Cashfree order and stored payment amount. | `outstandingRent(property, successfulPayments)` | The strict body is `{}`; the server creates one Cashfree order for the entire unpaid balance and records a `PENDING` payment with that amount. |
| `POST /api/ledgers/:id/submit-payment-proof` body `amount` | A manual-proof record could claim an arbitrary amount. | Monthly rent minus `SUCCESS` and `PENDING_VERIFICATION` payments. | The strict proof body carries only evidence metadata; the stored amount is the server-calculated remaining balance. |
| `POST /api/ledgers/:id/pay-owner` body `amountAdvanced` | An admin browser could set its own owner payout. | `ownerPayout(property)`, using `RENTFLO_PAYOUT_FEE_BPS` or the secure 500-bps default. | The strict request accepts optional transfer evidence only; the server calculates and stores the payout. |
| `POST /api/ledgers/:id/collect-rent` body `amountCollected` | A browser could manually set the collected total. | `property.monthlyRent`. | The strict body is `{}`; the administrative action records the configured full monthly rent only. |
| Cashfree webhook or verification fallback provider amount | A valid provider payload could create a row with an amount not tied to RentFLO’s ledger. | Matching server-created `PENDING` row plus current `outstandingRent`; fallback uses current `outstandingRent`. | Provider, pending-row, and server-calculated amounts must agree before mutation. |

## Payment lifecycle controls

Before creating either standard or legacy payment-route Cashfree orders, the server rejects a ledger that already has a `PENDING` or `PENDING_VERIFICATION` payment. This removes arbitrary partial amount entry. If RentFLO later needs installments, it should add server-owned installment plans with fixed identifiers and amounts, not restore a raw amount field.

Cashfree amounts are integer rupees because both `properties.monthlyRent` and `payments.amount` are integer database columns. The provider’s signed amount must be a positive integer and exactly match the expected server value. The webhook still requires the existing raw-body HMAC verification before parsing or state mutation.

## Configuration and review

`RENTFLO_PAYOUT_FEE_BPS` is server-only configuration. If absent or invalid, RentFLO applies the safe default of `500` basis points (5%). The owner dashboard’s displayed payout is informational only; the response from the server is authoritative.

Run `pnpm exec tsx scripts/verify-server-pricing.ts` after payment-flow changes. The verifier covers strict request schemas, pricing calculations, client request bodies, server order creation, payout and collection derivation, and Cashfree webhook/reconciliation comparisons.
