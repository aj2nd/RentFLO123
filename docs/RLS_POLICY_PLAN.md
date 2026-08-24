# RentFLO Row-Level Security Plan

**Status:** Policy design complete; **not applied automatically**. The Railway database could not be inspected from this workspace, and the application currently uses a single server-side PostgreSQL connection rather than a user-scoped database JWT.

> Enabling `FORCE ROW LEVEL SECURITY` before the backend sets a trusted per-request database identity would deny legitimate application queries. Enabling RLS without forcing it would allow the database owner to bypass the policies. Neither outcome is an acceptable production rollout.

## Required runtime contract

Before enabling the policies, authenticated requests must begin a database transaction and set both values with `set_config(..., true)`, using the verified server session only:

```sql
SELECT set_config('app.user_id',  '<authenticated user id>', true);
SELECT set_config('app.user_role','<TENANT|OWNER|ADMIN>', true);
```

The values **must not** come from browser headers, request bodies, or query parameters. A dedicated non-owner application database role must be used after the transition; the migration should then use `FORCE ROW LEVEL SECURITY`.

## Policy helper predicates

```sql
CREATE SCHEMA IF NOT EXISTS rentflo;

CREATE OR REPLACE FUNCTION rentflo.current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION rentflo.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.user_role', true) = 'ADMIN'
$$;
```

## Table-by-table policy map

| Table | Read policy | Change policy | Status |
|---|---|---|---|
| `users` | `id = rentflo.current_user_id()` or trusted admin context | A user updates only `id = current_user_id()`; role and PII column privileges remain server-only | Ready after context integration |
| `properties` | Owner or assigned tenant may read; trusted admin may read | Owner changes own property. Tenant may only join an unassigned property matching their verified pending email; requires column-level grants or a controlled server route | Requires join-flow validation |
| `ledgers` | Owner or tenant of the linked property; trusted admin | Normal users have no direct writes; payment and settlement writes remain controlled server actions | Ready after context integration |
| `payments` | Owner or tenant of linked property; trusted admin | Tenant inserts only a payment for their own property. Verification/rejection remains admin-controlled | Ready after context integration |
| `maintenance_tickets` | Tenant, owner, or admin for linked property | Tenant creates for own property; tenant updates own ticket; owner/admin resolves linked-property tickets | Requires column-level update grants to prevent status manipulation |
| `agreements` | Owner or tenant of linked property; trusted admin | Signature workflow stays server-controlled; no general direct write policy | Ready after context integration |
| `push_subscriptions` | `user_id = current_user_id()` | Insert, update, and delete require `user_id = current_user_id()` | Ready after context integration |
| `notifications` | `user_id = current_user_id()` | User may mark only their own notifications read; inserts remain server-controlled | Ready after context integration |
| `messages` (`property_id`, `sender_id`, `receiver_id`) | Sender or receiver, with property-membership check; trusted admin | Sender inserts only as self to a linked-property counterparty; receiver marks only their own rows read | **Blocked pending schema confirmation** |
| `sessions` | No normal-user access | No normal-user access; the session-store system role needs a narrowly scoped bypass path | Requires dedicated system-role decision |
| `conversations` (legacy chat model) | No safe predicate: table has no `user_id`/participant relation | No safe direct-write policy | **Blocked: add `user_id` or participant table first** |
| `messages` (`conversation_id`, legacy chat model) | No safe predicate until `conversations` is owned by a user | No safe direct-write policy | **Blocked and conflicts with property-message schema** |

## Mandatory schema uncertainty

The source contains **two incompatible definitions named `messages`**. The active property messaging definition uses `property_id`, `sender_id`, and `receiver_id`; the legacy chat definition uses `conversation_id`, `role`, and `content`. PostgreSQL cannot safely receive policies for both under one table name. The live Railway schema must determine which definition exists before any `messages` policy is executed.

## Policy shape examples

These examples deliberately use ownership predicates only—never `USING (true)` or other allow-all conditions.

```sql
-- properties: owner or assigned tenant can read the row
USING (
  owner_id = rentflo.current_user_id()
  OR tenant_id = rentflo.current_user_id()
  OR rentflo.is_admin()
)

-- notifications: a user can see only their own notification rows
USING (user_id = rentflo.current_user_id())
WITH CHECK (user_id = rentflo.current_user_id())

-- property messages: only a participant may read the row
USING (
  sender_id = rentflo.current_user_id()
  OR receiver_id = rentflo.current_user_id()
  OR rentflo.is_admin()
)
```

## Safe activation sequence

First, resolve the actual `messages` schema and add ownership to legacy conversations if that feature remains active. Next, implement request-scoped database transactions and the trusted `app.user_id`/`app.user_role` context. Then apply table policies in a staging database, test tenant, owner, admin, webhook, and session-store paths, and only then enable and force RLS in Railway.
