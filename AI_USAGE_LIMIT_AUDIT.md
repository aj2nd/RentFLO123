# Paid AI Usage Limit Audit

RentFLO now enforces **server-side, per-authenticated-user daily quotas** for every route that invokes a paid model. The usage counter is stored in PostgreSQL rather than process memory, so the cap is shared across autoscaled instances and survives application restarts.

| Paid AI feature | Server route | Per-user daily cap | Existing short-window control | Cap-reached response |
|---|---|---:|---|---|
| RentFLO Assistant | `POST /api/chatbot` | 20 requests | Existing account limiter: 3 requests per 15 minutes, plus network limiter. | `429`, code `AI_USAGE_LIMIT_REACHED`, a clear message, reset timestamp, and usage headers. |
| Legacy text assistant | `POST /api/conversations/:id/messages` | 20 requests | No previous account quota; route remains admin-only and dormant unless registered. | Same `429` response contract. |
| Legacy voice assistant (audio-in/audio-out plus transcription) | `POST /api/conversations/:id/messages` in the audio module | 10 requests | No previous account quota; route remains admin-only and dormant unless registered. | Same `429` response contract. |
| Image generation | `POST /api/generate-image` | 5 requests | No previous account quota; route remains dormant unless registered. | Same `429` response contract. |

## How the cap is enforced

After authentication and before validation or model invocation, the quota middleware derives the account ID from the established server session. It atomically inserts or increments a row keyed by `(account_id, feature, window_started_at)`. The SQL increments only when the current count remains below the configured maximum, which prevents concurrent requests from exceeding the cap. The middleware deliberately fails closed with `503` when PostgreSQL is unavailable, so RentFLO does not make a paid model call without a completed quota check.

The response includes these non-sensitive headers for UI feedback: `X-AI-Usage-Limit`, `X-AI-Usage-Remaining`, and `X-AI-Usage-Reset`. At the cap, it returns:

```json
{
  "message": "Your daily RentFLO Assistant limit has been reached. Please try again after 2026-...Z.",
  "code": "AI_USAGE_LIMIT_REACHED",
  "resetAt": "2026-...Z"
}
```

## Operational behavior

The `ai_usage_limits` table is created idempotently during authenticated route setup using the application’s existing startup-table pattern. No browser value identifies the quota subject, so changing IPs or modifying client code cannot obtain a different allowance. The existing short-window account limiter remains in place to reduce bursts; the new counter provides the durable daily spending ceiling.

Run `pnpm exec tsx scripts/verify-ai-usage-limits.ts` after changing any AI route or limit. The verifier proves that a third request from the same account is blocked even after an IP change, another account retains its own allowance, the cap returns the specified clear `429` body, and all paid-AI route modules have the quota middleware.
