-- ============================================================
-- LARIS HUB - Complete Security & RLS Migration (v2)
-- Replaces: 20260727000000_optimize_and_rls.sql
-- Run this via Supabase SQL Editor or CLI migrations.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- SECTION 1: ENFORCE NOT NULL on critical FK columns
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.transactions
  ALTER COLUMN recorded_by SET NOT NULL;

ALTER TABLE public.transaction_items
  ALTER COLUMN transaction_id SET NOT NULL;

-- ────────────────────────────────────────────────────────────
-- SECTION 2: PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────

-- Transactions: kasir filter and range queries
CREATE INDEX IF NOT EXISTS idx_transactions_recorded_by
  ON public.transactions (recorded_by);

CREATE INDEX IF NOT EXISTS idx_transactions_at
  ON public.transactions (transaction_at DESC);

-- Functional index for date queries in Jakarta timezone
CREATE INDEX IF NOT EXISTS idx_transactions_date_tz
  ON public.transactions (DATE(transaction_at AT TIME ZONE 'Asia/Jakarta'));

-- Transaction items: join and lookup indexes
CREATE INDEX IF NOT EXISTS idx_ti_transaction_id
  ON public.transaction_items (transaction_id);

CREATE INDEX IF NOT EXISTS idx_ti_product_id
  ON public.transaction_items (product_id);

-- ────────────────────────────────────────────────────────────
-- SECTION 3: DAILY SUMMARY VIEW - enforce security_invoker
-- so RLS from the calling user's context is respected
-- ────────────────────────────────────────────────────────────
ALTER VIEW IF EXISTS public.daily_summary SET (security_invoker = true);

-- ────────────────────────────────────────────────────────────
-- SECTION 4: RLS POLICIES - PROFILES
-- ────────────────────────────────────────────────────────────

-- Drop old policies
DROP POLICY IF EXISTS "profiles_select_admin"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_safe"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"      ON public.profiles;

-- Admin: full read of all profiles (for kasir management page)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- User: can read their own profile (needed for kasir dashboard load)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin: can update any profile (e.g. suspend/activate/role change)
CREATE POLICY "profiles_update_admin_only"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- User: can update their own profile BUT cannot change role or is_active
-- This prevents self-privilege escalation via PATCH /profiles
CREATE POLICY "profiles_update_own_safe"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    -- Freeze role and is_active to current values - no escalation possible
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Admin: only admin can insert new profiles (kasir accounts created via Edge Function)
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ────────────────────────────────────────────────────────────
-- SECTION 5: RLS POLICIES - PRODUCTS
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "products_select_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_select_kasir"     ON public.products;
DROP POLICY IF EXISTS "products_insert_admin"     ON public.products;
DROP POLICY IF EXISTS "products_update_admin"     ON public.products;
DROP POLICY IF EXISTS "products_delete_admin"     ON public.products;

-- Admin: sees all products (active + inactive)
-- Kasir: sees only active products
CREATE POLICY "products_select_all_roles"
  ON public.products FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'kasir'
      AND is_active = true
    )
  );

CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ────────────────────────────────────────────────────────────
-- SECTION 6: RLS POLICIES - TRANSACTIONS
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "transactions_select_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_own"   ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_kasir" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_admin" ON public.transactions;

-- Admin: all transactions; Kasir: only own
CREATE POLICY "transactions_select"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    recorded_by = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Kasir can only insert transactions recorded as themselves
-- Admin can insert for anyone (manual corrections)
CREATE POLICY "transactions_insert"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "transactions_update_admin"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "transactions_delete_admin"
  ON public.transactions FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ────────────────────────────────────────────────────────────
-- SECTION 7: RLS POLICIES - TRANSACTION ITEMS
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "ti_select_policy" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_insert_own"    ON public.transaction_items;
DROP POLICY IF EXISTS "ti_update_admin"  ON public.transaction_items;
DROP POLICY IF EXISTS "ti_delete_admin"  ON public.transaction_items;

-- Can read items belonging to own transactions or admin
CREATE POLICY "ti_select"
  ON public.transaction_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
        AND (
          t.recorded_by = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

-- Can only insert items into own transactions
CREATE POLICY "ti_insert"
  ON public.transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
        AND (
          t.recorded_by = auth.uid()
          OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        )
    )
  );

CREATE POLICY "ti_update_admin"
  ON public.transaction_items FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "ti_delete_admin"
  ON public.transaction_items FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ────────────────────────────────────────────────────────────
-- SECTION 8: TRIGGER - Sync profile.role → auth JWT
-- SECURITY DEFINER with search_path prevents injection attacks
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role)
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

DROP TRIGGER IF EXISTS sync_role_on_profile_update ON public.profiles;
CREATE TRIGGER sync_role_on_profile_update
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- ────────────────────────────────────────────────────────────
-- CONFIRMATION QUERY - verify all policies are in place
-- ────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
