# HTTPS Transport Security Audit

RentFLO now has two layers of public transport enforcement. **Railway’s public edge** redirects HTTP to HTTPS before requests reach the application, and the Express server adds a production-only `308` redirect as a defense-in-depth fallback if an HTTP request is forwarded to the app. The redirect target is derived only from `PUBLIC_APP_URL` after HTTPS validation, with `https://rentflo.in` as the safe fallback; it never reflects the request `Host` header.

| Surface | Enforcement | Result |
|---|---|---|
| Public `http://rentflo.in/` | Railway edge | Verified on 25 Aug 2026: `301` to `https://rentflo.in/`. |
| Public `http://rentflo.in/health` | Railway edge | Verified on 25 Aug 2026: `301` to `https://rentflo.in/health`. |
| HTTP reaching Express in production | `createHttpsRedirectMiddleware` behind one trusted Railway proxy | `308` to the canonical HTTPS origin while preserving path and query. |
| Public HTTPS pages and APIs | Railway TLS edge plus Helmet | HTTPS was live and returned a one-year HSTS policy with `includeSubDomains` during the audit. The app now explicitly maintains that same production HSTS policy. |
| OAuth callback and provider callbacks | Application configuration | Google callback is HTTPS; `PUBLIC_APP_URL` is rejected unless it is HTTPS before provider callback URLs are built. |
| Android/native backend calls | Client configuration | The only absolute production API base is `https://rentflo.in`. |
| Dynamic external links and proof URLs | Existing validation | Sensitive/provider URLs require HTTPS. |

## Application protections added

The production application enables `Strict-Transport-Security: max-age=31536000; includeSubDomains` through Helmet. It no longer allows `ws:` in the production content-security policy or `http://localhost` as a production CORS origin. Both remain development-only because local Vite and emulator workflows require them.

The `/health` handler is intentionally exempt from the application redirect because Railway may probe it internally over its private hop. Railway’s public edge still redirects the public HTTP health URL to HTTPS, as verified above. This exemption does not expose a browser-facing HTTP application page.

## Hosting confirmation and remaining boundary

The repository has no Railway configuration file, Dockerfile, or custom reverse-proxy configuration; TLS certificates and public HTTP redirection are therefore controlled by Railway and its configured custom domain. The live `rentflo.in` edge was verified to redirect HTTP and serve HTTPS with HSTS. No insecure public application response was observed for the canonical domain.

Every additional custom domain or subdomain must be added through Railway’s domain settings with an active certificate and should be tested for the same HTTP redirect and HTTPS HSTS response. `PUBLIC_APP_URL` must remain an HTTPS canonical domain. Plain `http://localhost`, `ws:`, and Capacitor development origins are intentional local-development exceptions only and are not allowed for the public production web app.

Run `pnpm exec tsx scripts/verify-https-transport.ts` after transport or hosting changes. The verifier proves the fallback redirect, prevents HTTPS redirect loops, preserves the health check, and checks the production header/configuration rules.
