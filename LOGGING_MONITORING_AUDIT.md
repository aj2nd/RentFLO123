# Logging and Monitoring Audit

RentFLO now emits **structured JSON operational and security events** to the server process logs. The app runs on Railway, so production stdout and stderr are available through the Railway service’s **Logs** view. These events do not create a new client-facing API, database table, or external monitoring account.

| Event | When it is recorded | Fields retained | Fields deliberately excluded |
|---|---|---|---|
| `api_request_completed` | Every completed `/api` response. | Timestamp, method, normalized route, status, duration, pseudonymous account/network hashes. | Query strings, request body, cookies, authorization headers, raw account ID, IP address. |
| `authentication_rejected` | `401` API response. | Same pseudonymous request context and status. | Login credentials, tokens, session data. |
| `authorization_denied` | `403` API response. | Same pseudonymous request context and status. | Roles/permissions payload and resource data. |
| `rate_limit_triggered` | `429` API response. | Same pseudonymous request context and status. | IP address and body. |
| `provider_callback_rejected` | Failed webhook or Cashfree verification response. | Normalized path and status. | Raw provider webhook body, signature, timestamp, payment data. |
| `csp_violation` | CSP report collector receives a valid report. | Effective and violated directive only. | Blocked/document URLs, which can contain query data. |
| Named private errors | Unexpected errors, provider failures, startup failures, AI/KYC/payment failures. | Event name, safe context, error type, redacted message and stack. | Request body, cookies, authorization header, provider response bodies; credential-like values are redacted. |

## Privacy controls

The logging layer recursively redacts values whose keys or message fragments indicate API keys, authorization, bearer values, cookies, passwords, secrets, tokens, sessions, credentials, or private keys. Raw account IDs and IP addresses are not logged; an HMAC-derived short hash lets you correlate repeated activity without storing the original identifier. Route parameters resembling UUIDs or long numeric IDs are normalized to `:id`.

The server installs a console safety net during startup. Existing `console.log`, `console.warn`, and `console.error` calls are converted into structured `legacy_console` records before reaching Railway logs, so legacy provider diagnostics receive the same redaction treatment. The app preserves native console methods internally to avoid recursive logging.

## Where to see the logs

Open the **Railway project → RentFLO service → Logs** screen. Filter the JSON lines by `"level":"error"` for operational failures or by `"level":"warn"` for security/suspicious activity. Search event names such as `authentication_rejected`, `rate_limit_triggered`, `provider_callback_rejected`, `csp_violation`, or `unhandled_request_error`.

> The application now records events but does not yet configure external paging, Slack, email, or SIEM alerts. Railway log retention and alerting behavior are governed by the Railway plan and service settings. Add an external alerting integration only after selecting the destination and retention policy.

## Verification

Run `pnpm exec tsx scripts/verify-logging-monitoring.ts`. It simulates successful, denied, rate-limited, and rejected-webhook requests plus a credential-bearing provider exception. The verifier confirms the expected events are emitted while raw identifiers, passwords, tokens, authorization values, bodies, headers, and cookies never appear in captured logs.
