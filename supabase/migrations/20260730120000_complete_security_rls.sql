


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_transaction_item_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Menghitung subtotal = harga jual * kuantitas
  NEW.subtotal := NEW.selling_price * NEW.quantity;
  -- Menghitung profit = (harga jual - hpp) * kuantitas
  NEW.profit := (NEW.selling_price - NEW.product_hpp) * NEW.quantity;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_transaction_item_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products"("period" "text") RETURNS TABLE("product_id" "uuid", "product_name" "text", "total_qty" bigint, "total_revenue" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.product_id,
    ti.product_name,
    SUM(ti.quantity) as total_qty,
    SUM(ti.quantity * ti.selling_price) as total_revenue
  FROM transaction_items ti
  JOIN transactions t ON t.id = ti.transaction_id
  WHERE t.type = 'penjualan'
  AND (
    (period = 'today' AND DATE(t.transaction_at) = CURRENT_DATE) OR
    (period = 'week' AND t.transaction_at >= date_trunc('week', CURRENT_DATE)) OR
    (period = 'month' AND t.transaction_at >= date_trunc('month', CURRENT_DATE)) OR
    (period = 'all')
  )
  GROUP BY ti.product_id, ti.product_name
  ORDER BY total_qty DESC
  LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."get_top_products"("period" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products"("start_date" "date", "end_date" "date", "limit_n" integer) RETURNS TABLE("product_id" "uuid", "product_name" "text", "total_qty" bigint, "total_revenue" numeric, "total_profit" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.product_id,
    ti.product_name,
    SUM(ti.quantity) AS total_qty,
    -- Kast hasil perhitungan integer ke numeric agar sesuai dengan deklarasi RETURNS TABLE
    SUM(ti.quantity * ti.selling_price)::numeric AS total_revenue,
    SUM(ti.quantity * (ti.selling_price - ti.product_hpp))::numeric AS total_profit
  FROM transactions t
  JOIN transaction_items ti ON t.id = ti.transaction_id
  WHERE t.type = 'penjualan'
    AND DATE(t.transaction_at) >= start_date
    AND DATE(t.transaction_at) <= end_date
  GROUP BY ti.product_id, ti.product_name
  ORDER BY total_qty DESC
  LIMIT limit_n;
END;
$$;


ALTER FUNCTION "public"."get_top_products"("start_date" "date", "end_date" "date", "limit_n" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_profile_role_to_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_profile_role_to_auth"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "total_amount" integer DEFAULT 0 NOT NULL,
    "total_profit" integer DEFAULT 0 NOT NULL,
    "expense_category" "text",
    "expense_items" "jsonb",
    "notes" "text",
    "recorded_by" "uuid" NOT NULL,
    "transaction_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transactions_expense_category_check" CHECK (("expense_category" = ANY (ARRAY['operasional'::"text", 'bahan_baku'::"text", 'lainnya'::"text"]))),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['penjualan'::"text", 'pengeluaran'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."transactions"."expense_items" IS 'Detail item pengeluaran: [{name,qty,unit_price}]';



CREATE OR REPLACE VIEW "public"."daily_summary" WITH ("security_invoker"='true') AS
 WITH "sales" AS (
         SELECT "date"("transactions"."transaction_at") AS "date",
            "count"("transactions"."id") AS "total_sales_count",
            COALESCE("sum"("transactions"."total_amount"), (0)::bigint) AS "total_revenue",
            COALESCE("sum"("transactions"."total_profit"), (0)::bigint) AS "total_gross_profit"
           FROM "public"."transactions"
          WHERE ("transactions"."type" = 'penjualan'::"text")
          GROUP BY ("date"("transactions"."transaction_at"))
        ), "expenses" AS (
         SELECT "date"("transactions"."transaction_at") AS "date",
            COALESCE("sum"("transactions"."total_amount"), (0)::bigint) AS "total_expense"
           FROM "public"."transactions"
          WHERE ("transactions"."type" = 'pengeluaran'::"text")
          GROUP BY ("date"("transactions"."transaction_at"))
        ), "all_dates" AS (
         SELECT "sales"."date"
           FROM "sales"
        UNION
         SELECT "expenses"."date"
           FROM "expenses"
        )
 SELECT "d"."date",
    COALESCE("s"."total_sales_count", (0)::bigint) AS "total_sales_count",
    (COALESCE("s"."total_revenue", (0)::bigint))::numeric AS "total_revenue",
    (COALESCE("s"."total_gross_profit", (0)::bigint))::numeric AS "total_gross_profit",
    (COALESCE("e"."total_expense", (0)::bigint))::numeric AS "total_expense",
    ((COALESCE("s"."total_revenue", (0)::bigint) - COALESCE("e"."total_expense", (0)::bigint)))::numeric AS "net_cashflow"
   FROM (("all_dates" "d"
     LEFT JOIN "sales" "s" ON (("s"."date" = "d"."date")))
     LEFT JOIN "expenses" "e" ON (("e"."date" = "d"."date")));


ALTER VIEW "public"."daily_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sku" "text",
    "hpp" integer DEFAULT 0 NOT NULL,
    "selling_price" integer DEFAULT 0 NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "created_by" "uuid"
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'kasir'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_name" "text" NOT NULL,
    "product_hpp" integer NOT NULL,
    "selling_price" integer NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subtotal" numeric DEFAULT 0,
    "profit" numeric DEFAULT 0
);


ALTER TABLE "public"."transaction_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ti_product_id" ON "public"."transaction_items" USING "btree" ("product_id");



CREATE INDEX "idx_ti_transaction_id" ON "public"."transaction_items" USING "btree" ("transaction_id");



CREATE INDEX "idx_transactions_at" ON "public"."transactions" USING "btree" ("transaction_at" DESC);



CREATE INDEX "idx_transactions_date_tz" ON "public"."transactions" USING "btree" ("date"(("transaction_at" AT TIME ZONE 'Asia/Jakarta'::"text")));



CREATE INDEX "idx_transactions_recorded_by" ON "public"."transactions" USING "btree" ("recorded_by");



CREATE OR REPLACE TRIGGER "sync_role_on_profile_update" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_profile_role_to_auth"();



CREATE OR REPLACE TRIGGER "trg_calculate_transaction_item_totals" BEFORE INSERT OR UPDATE ON "public"."transaction_items" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_transaction_item_totals"();



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_items"
    ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "Admin can delete transactions" ON "public"."transactions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can manage products" ON "public"."products" TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can manage transaction items" ON "public"."transaction_items" TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can modify products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can modify transactions" ON "public"."transactions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can update/delete transactions" ON "public"."transactions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view all products" ON "public"."products" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view all transaction items" ON "public"."transaction_items" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view all transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin view all transactions" ON "public"."transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Authenticated users can view profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Kasir can view active products" ON "public"."products" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Kasir view own transactions" ON "public"."transactions" FOR SELECT USING (("recorded_by" = "auth"."uid"()));



CREATE POLICY "Products viewable by authenticated users" ON "public"."products" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Profiles are viewable by authenticated users" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert items" ON "public"."transaction_items" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can insert own transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("recorded_by" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert transaction items" ON "public"."transaction_items" FOR INSERT TO "authenticated" WITH CHECK (("transaction_id" IN ( SELECT "transactions"."id"
   FROM "public"."transactions"
  WHERE ("transactions"."recorded_by" = "auth"."uid"()))));



CREATE POLICY "Users can insert transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "recorded_by"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own transaction items" ON "public"."transaction_items" FOR SELECT TO "authenticated" USING (("transaction_id" IN ( SELECT "transactions"."id"
   FROM "public"."transactions"
  WHERE ("transactions"."recorded_by" = "auth"."uid"()))));



CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("recorded_by" = "auth"."uid"()));



CREATE POLICY "View items if can view transaction" ON "public"."transaction_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."transactions"
  WHERE ("transactions"."id" = "transaction_items"."transaction_id"))));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete_admin" ON "public"."products" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "products_insert_admin" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "products_select_all_roles" ON "public"."products" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text") OR (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'kasir'::"text") AND ("is_active" = true))));



CREATE POLICY "products_update_admin" ON "public"."products" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_admin" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "profiles_select_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_admin_only" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "profiles_update_own_safe" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") <> 'admin'::"text"))) WITH CHECK ((("id" = "auth"."uid"()) AND ("role" = ( SELECT "p"."role"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))) AND ("is_active" = ( SELECT "p"."is_active"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "ti_delete_admin" ON "public"."transaction_items" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "ti_insert" ON "public"."transaction_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_items"."transaction_id") AND (("t"."recorded_by" = "auth"."uid"()) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "ti_select" ON "public"."transaction_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."transactions" "t"
  WHERE (("t"."id" = "transaction_items"."transaction_id") AND (("t"."recorded_by" = "auth"."uid"()) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"))))));



CREATE POLICY "ti_update_admin" ON "public"."transaction_items" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."transaction_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transactions_delete_admin" ON "public"."transactions" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "transactions_insert" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK ((("recorded_by" = "auth"."uid"()) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "transactions_select" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((("recorded_by" = "auth"."uid"()) OR ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "transactions_update_admin" ON "public"."transactions" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."calculate_transaction_item_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_transaction_item_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_transaction_item_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products"("period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products"("period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products"("period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products"("start_date" "date", "end_date" "date", "limit_n" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products"("start_date" "date", "end_date" "date", "limit_n" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products"("start_date" "date", "end_date" "date", "limit_n" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_profile_role_to_auth"() TO "service_role";


















GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_summary" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_items" TO "anon";
GRANT ALL ON TABLE "public"."transaction_items" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































