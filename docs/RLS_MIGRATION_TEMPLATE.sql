-- RENTFLO RLS MIGRATION TEMPLATE — DO NOT APPLY BEFORE COMPLETING
-- docs/RLS_POLICY_PLAN.md and verifying the live Railway schema.
--
-- This template intentionally does not contain `USING (true)` policies.
-- It also intentionally does not enable/force RLS yet: the current backend
-- must first set a trusted transaction-local app.user_id/app.user_role context.

BEGIN;

CREATE SCHEMA IF NOT EXISTS rentflo;

CREATE OR REPLACE FUNCTION rentflo.current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$;

CREATE OR REPLACE FUNCTION rentflo.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.user_role', true) = 'ADMIN'
$$;

-- Preconditions that must pass against the live schema before policies exist.
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'property_id'
     ) THEN
    RAISE EXCEPTION 'messages does not have property_id; resolve legacy chat schema before applying RLS';
  END IF;

  IF to_regclass('public.conversations') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id'
     ) THEN
    RAISE EXCEPTION 'conversations lacks user_id; add ownership before applying RLS';
  END IF;
END $$;

-- Add table-specific ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY and
-- CREATE POLICY statements only after the request-context integration and
-- staging verification documented in RLS_POLICY_PLAN.md.

COMMIT;
