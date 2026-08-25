# Production Error Handling Audit

RentFLO now separates **safe client responses** from **private operational diagnostics** through `server/error-handling.ts`.

| Failure type | Browser response | Private server log |
|---|---|---|
| Unhandled server or provider failure (`5xx`) | The status code, `"We could not complete your request. Please try again."`, and `INTERNAL_ERROR`. No stack trace, provider body, API key, token, or raw exception message. | A structured event, method/path/status, error name, redacted message, and redacted stack. No request body, cookies, authorization header, or provider response body is attached. |
| Unexpected client-side route error (`4xx`) | The status code, `"Request could not be completed."`, and `REQUEST_REJECTED`. | Same private structured diagnostic record. |
| Expected input validation | Existing short, controlled field feedback such as an invalid field format or unsupported upload type. | No exception reflection. Upload-validation exception strings are now replaced with stable field-specific messages. |
| KYC, AI, payment, and audio provider failures | Generic service-unavailable or request-failed response only. | Named private events such as `didit_start_failed`, `chatbot_request_failed`, and `legacy_voice_message_failed`. |

## What changed

The previous global error middleware already hid `5xx` details, but it returned `err.message` for some `4xx` errors. Several route-level KYC and admin payment branches also reflected provider or storage exception text. The new policy logs diagnostics privately and returns only stable generic response contracts. Didit start/status errors now use a generic e-KYC retry message. The voice route no longer returns an upload parser exception string.

`logPrivateError` redacts common key/value fragments such as API keys, authorization values, tokens, secrets, passwords, and cookies before writing the diagnostic event. It intentionally does not attach request bodies or authentication headers, keeping personal and credential data out of normal error logs.

## Verification

Run `pnpm exec tsx scripts/verify-production-error-handling.ts`. The test throws a provider-like failure containing mock credentials, proves the client receives only the generic response, verifies the private log is redacted, checks a generic `4xx` contract, and scans active error routes for direct exception-message reflection. The production build and the broader security verification suite remain required before release.
