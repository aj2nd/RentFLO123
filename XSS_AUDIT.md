# Cross-Site Scripting Audit

## Result

RentFLO now renders user-generated text through ordinary React text nodes, which do not interpret string values as HTML. The server-side input boundary also strips HTML from ordinary user-controlled strings before validation and persistence. Signed webhooks remain raw only until signature verification, and their consumed fields are subsequently schema-validated.

The audit removed the remaining client-side raw HTML injection APIs and added client and server URL allowlists for navigation and media sinks.

| Rendering or navigation surface | Finding | Protection now in place |
| --- | --- | --- |
| Property addresses, profile names, ticket titles/descriptions, message bodies, KYC labels, payment references, and notification text | Rendered as React children. | React escapes the values; server-side HTML sanitization and strict length/type validation run before storage. |
| `ReceiptModal` print window | Used `document.write` with interpolated property and tenant data. | Rebuilt with `document.createElement` and `textContent`; no raw HTML string is written. |
| `Agreement` print window | Used `document.write` with interpolated property address and tenant name. | Rebuilt with DOM nodes and `textContent`; no raw HTML string is written. |
| Generic chart component | Used `dangerouslySetInnerHTML` to emit CSS variables. | Replaced with React-managed CSS custom properties and safe variable-name filtering. |
| Notification cards | Database-backed URL was passed directly to the router. | Client only accepts a same-origin absolute path; invalid values render as a non-link card. |
| Push notifications and service-worker clicks | Notification URL could reach `navigate` or `openWindow`. | Server stores and pushes only bounded internal paths; worker rechecks the path before navigation. |
| Didit verification redirect | Provider-returned URL was passed directly to `location.assign`. | Client accepts only credential-free HTTPS URLs on `didit.me` or its subdomains. |
| Profile avatars, ticket photos, payment-proof previews and links | Dynamic media URLs reached `<img>` or `<a>`. | Client allows only HTTPS media and PNG/JPEG/WebP base64 image data; external proof links require HTTPS. |

## Explicitly avoided patterns

The client has no remaining uses of `dangerouslySetInnerHTML`, `document.write`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `DOMParser`, `eval`, or `new Function` in application rendering code.

## Verification

Run:

```bash
pnpm exec tsx scripts/verify-xss-protection.ts
```

The verification checks trusted internal paths, Didit-only HTTPS redirects, safe image formats, rejection of JavaScript/SVG data URLs, absence of raw HTML APIs in the remediated render paths, and notification URL guards in the client, service worker, and server.
