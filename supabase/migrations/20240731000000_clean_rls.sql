-- Drop all existing RLS policies to clean up duplicates
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

DROP POLICY IF EXISTS "Admin can modify products" ON public.products;
DROP POLICY IF EXISTS "products_select_all_roles" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
DROP POLICY IF EXISTS "Kasir can view active products" ON public.products;
DROP POLICY IF EXISTS "Admin can view all products" ON public.products;
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Products viewable by authenticated users" ON public.products;

DROP POLICY IF EXISTS "Admin view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can modify transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can update/delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Kasir view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_admin" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;

DROP POLICY IF EXISTS "View items if can view transaction" ON public.transaction_items;
DROP POLICY IF EXISTS "Users can view own transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Admin can view all transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Users can insert transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Admin can manage transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_select" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_insert" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_update_admin" ON public.transaction_items;
DROP POLICY IF EXISTS "ti_delete_admin" ON public.transaction_items;

-- Recreate Clean Policies

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- PRODUCTS
-- Kasir can only see active products, Admin can see all
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (
  is_active = true OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- TRANSACTIONS
-- Kasir can see own transactions, Admin can see all
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT TO authenticated USING (
  recorded_by = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT TO authenticated WITH CHECK (
  recorded_by = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- TRANSACTION_ITEMS
-- Cascade view from transactions
CREATE POLICY "transaction_items_select" ON public.transaction_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id AND (t.recorded_by = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  )
);
CREATE POLICY "transaction_items_insert" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id AND (t.recorded_by = auth.uid() OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  )
);
CREATE POLICY "transaction_items_update" ON public.transaction_items FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "transaction_items_delete" ON public.transaction_items FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
