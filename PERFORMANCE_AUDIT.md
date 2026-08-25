# RentFLO Performance Audit

## Measured Findings and Applied Changes

| Surface | Baseline | Applied improvement | Verified result |
|---|---:|---|---:|
| Main JavaScript entry chunk | 1,580,211 bytes; approximately 422 KB gzip | Converted route pages to React lazy imports behind a loading fallback | 581,158 bytes; approximately 178 KB gzip |
| Non-active dashboard code | Loaded with every first visit | Split admin, tenant, owner, ledger, KYC, agreement, messages, maintenance, profile, and utility routes | Loaded only when the corresponding route is opened |
| Font bootstrap | Inter, Playfair Display, Noto Sans Devanagari, and Noto Sans Kannada requested | Removed the two unused language families after the application’s translation UI was removed | Fewer external font files on the critical path |
| HTML splash | Requested a 600 KB legacy logo icon and rendered a text wordmark | Uses the existing 9 KB transparent RentFLO wordmark only | Lighter visual bootstrap, aligned with current branding |
| Static hashed assets | Already configured | Retained `public, max-age=31536000, immutable` cache policy | Repeat visits continue to reuse versioned bundles safely |

The entry JavaScript reduction is approximately **63% by raw bytes** and approximately **58% gzip-compressed**. The main bundle is smaller because inactive product areas no longer ship before a visitor reaches them. Functional page behavior is preserved behind React `Suspense`, which retains the existing loading screen during a route-chunk fetch.

## Remaining Constraint

A single public response sample before this update measured roughly 4.06 seconds to first byte. That measurement is dominated by the hosted server response path and can vary with Railway instance warmness, database availability, and network distance; client code splitting cannot remove a server cold start. The application now minimizes the browser work that occurs after the response arrives. If consistently low cold-start latency becomes a product requirement, evaluate Railway’s always-on/paid deployment options separately rather than weakening caching or security controls.

## Repeatable Verification

Run:

```bash
pnpm exec tsx scripts/verify-performance-optimization.ts
pnpm run build
```

The verifier ensures route-level lazy loading, loading fallback, leaner font bootstrap, and the lightweight current-wordmark splash remain in place.
