-- Drop old RLS policies for profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

-- Create new RLS policies for profiles (using JWT app_metadata)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Drop old RLS policies for products
DROP POLICY IF EXISTS "products_select_admin_all" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

-- Create new RLS policies for products (using JWT app_metadata)
CREATE POLICY "products_select_admin_all"
  ON public.products FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

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

-- Drop old RLS policies for transactions
DROP POLICY IF EXISTS "transactions_select_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_admin" ON public.transactions;

-- Create new RLS policies for transactions (using JWT app_metadata)
CREATE POLICY "transactions_select_admin"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "transactions_update_admin"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "transactions_delete_admin"
  ON public.transactions FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Drop old RLS policies for transaction_items
DROP POLICY IF EXISTS "ti_select_policy" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_update_admin" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_delete_admin" ON public.transaction_items;

-- Create new RLS policies for transaction_items
CREATE POLICY "ti_select_policy"
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

CREATE POLICY "ti_update_admin"
  ON public.transaction_items FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "ti_delete_admin"
  ON public.transaction_items FOR DELETE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Add Functional Index for transactions date
CREATE INDEX IF NOT EXISTS idx_transactions_date_tz 
  ON public.transactions (DATE(transaction_at AT TIME ZONE 'Asia/Jakarta'));

-- Create a function and trigger to keep auth.users app_metadata in sync with profiles.role
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_role_on_profile_update ON public.profiles;
CREATE TRIGGER sync_role_on_profile_update
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- One-time script to sync all existing profiles to auth.users raw_app_meta_data
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM public.profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(r.role)
    )
    WHERE id = r.id;
  END LOOP;
END;
$$;
