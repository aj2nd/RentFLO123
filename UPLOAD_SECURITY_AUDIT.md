# File Upload Security Audit

## Active upload flows

RentFLO does **not** accept multipart uploads or write customer files into a web-served `uploads/` directory. The application receives a narrow set of base64 data URLs in JSON, validates them on the server, and persists the values in PostgreSQL. KYC document values are encrypted at rest before persistence. Legacy audio is written only to a randomized operating-system temporary file for conversion and is removed in a `finally` block.

| Flow | Formats accepted by server | Maximum decoded size | Validation and storage controls |
| --- | --- | --- | --- |
| KYC identity document | PNG, JPEG, WebP, PDF | 1.5 MB | MIME declaration and binary signature must match. Canonical data URL is encrypted at rest in PostgreSQL. |
| Cancelled cheque | PNG, JPEG, WebP, PDF | 1.5 MB | Same signature/size validation and encrypted database storage as KYC documents. |
| Maintenance ticket photo | PNG, JPEG, WebP | 1.5 MB | MIME declaration and image signature must match; stored as a validated data URL in PostgreSQL. PDF and SVG are not accepted. |
| Manual payment proof | HTTPS URL only | 2,048 characters | This is a link field, not a binary upload; no local file is stored. Client and server require HTTPS. |
| Legacy administrator voice message | WebM, MP4/M4A/MOV, WAV, MP3, OGG | 10 MB | Canonical base64 plus actual container signature are required before temporary conversion and AI processing. Temporary files use randomized OS-temp paths and are deleted. |

## Server enforcement

The validator rejects non-canonical base64, files over the decoded byte limit, SVG content, PDFs supplied where an image is required, MIME declarations that do not match binary magic bytes, and unsupported data URLs. Browser `accept` attributes now mirror these restrictions, but they are only usability hints; the server performs the authoritative checks.

KYC document delivery is restricted to authenticated administrators. Before delivery, the encrypted stored value is revalidated. It is sent with `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, a sandbox CSP, and `Content-Disposition: attachment`, preventing a document from being executed or rendered as application content. Arbitrary external document redirects are no longer permitted.

The production static server exposes only the built application directory; it has no route that serves a user upload directory. This avoids executable-file placement under the app origin.

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-upload-security.ts
```

The verification exercises valid and mismatched binary signatures, SVG and oversize rejection, RIFF/WebP audio misclassification prevention, KYC delivery headers, absence of external redirect behavior, no static uploads directory, and the audio temporary-file cleanup path.
