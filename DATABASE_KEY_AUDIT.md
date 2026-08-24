# RentFLO Database-Key Boundary Audit

**Audit date:** 24 August 2026

## Result

The RentFLO frontend uses **no database key at all**. It does not contain a Supabase client, an anon/public database key, a database URL, a PostgreSQL driver, or a direct database connection. Browser requests use RentFLO same-origin `/api/*` routes.

| Check | Result |
|---|---|
| Supabase client or configuration | Not present in frontend source or production bundle. |
| Public/anon database key | Not used. |
| Service-role or admin key | Not present in frontend source, production bundle, or scanned client/public history. |
| Direct browser database driver | Not present. |
| Database connection string | Server-only via `DATABASE_URL` or `RAILWAY_DATABASE_URL` in `server/db.ts`. |

The only scan match was the **public VAPID push key** fetched from RentFLO’s `/api/push/vapid-key` endpoint. This is a web-push public key, not a database credential; the VAPID private key remains server-side.

> Because the frontend has no privileged database key, no client-key replacement, service-role rotation, or row-level-security bypass remediation is required from this audit.
