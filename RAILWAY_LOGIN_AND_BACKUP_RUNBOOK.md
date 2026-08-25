# Railway Login Recovery and Backup Runbook

## Login incident: resolved in code

The 25 August 2026 Railway log showed `PII_ENCRYPTION_KEY` during a `GET /api/login` failure. The encrypted-session rollout made the existing server secret necessary as soon as a user logged in, which turned a deployment configuration compatibility problem into a visible `500` response.

The repair keeps AES-256-GCM encryption enabled. It accepts the documented 32-byte hex/Base64 key formats unchanged and also derives a stable 32-byte AES key from an existing server-only Railway secret that is at least 32 characters long. Missing or short keys are still rejected. Do **not** delete or replace the current `PII_ENCRYPTION_KEY`; keep it attached to `RentFLO123` in the `production` environment and seal it in Railway.

After the repair deploys, test Login once. A new encrypted session should be written without changing the existing secret. If the error persists, inspect the latest Railway log line for the complete redacted `errorMessage`; do not share variable values, cookies, database URLs, or OAuth tokens.

## Database backups: current Railway Trial constraint

The Railway **Postgres → Backups** screen in the supplied screenshot explicitly states that volume backups and point-in-time recovery are available only on the Pro plan. The database currently has no native backups, so a restore cannot yet be confirmed.

| Option | What it provides | Restore safety | What remains to be done |
|---|---|---|---|
| Railway Pro native protection | Daily, weekly, and monthly volume backups plus point-in-time recovery. | PITR creates a new sibling Postgres service, leaving the source running while data is checked. | Upgrade the Railway plan; enable daily + weekly + monthly schedules and PITR in **Postgres → Backups**; perform a non-production restore drill. |
| Offsite logical dumps | Provider-independent `pg_dump` files in separate object storage. | Restore into a scratch database with `pg_restore`; never restore directly into production as the first test. | Choose an object-storage provider and authorize a least-privilege backup job. This is not yet configured. |

Railway documents daily backups retained for 6 days, weekly for 1 month, and monthly for 3 months. Its PITR archive has an approximately four-week window after the first base backup completes. [Railway backup and restore guide](https://docs.railway.com/guides/postgres-backups-restores) and [PITR reference](https://docs.railway.com/volumes/point-in-time-recovery) describe the provider flow.

> Do not use a production restore merely to test recovery. First restore to a newly created PITR sibling service or a scratch database, compare row counts and several recent records, record the restoration time, and only then decide whether a production cutover is needed.
