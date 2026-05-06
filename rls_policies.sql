-- ═══════════════════════════════════════════════════
--  AET PROJECT — RLS POLICIES (Read-Only for Publishable Key)
--  Run this in Supabase SQL Editor AFTER schema + seed data
--  Allows reads for everyone, writes require authenticated user
-- ═══════════════════════════════════════════════════

-- For the prototype, we allow full access (read + write) via the
-- publishable key. Before going to production, change these to
-- restrict writes to authenticated users only.

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename LIKE 'tbl_%'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        -- Drop existing policy if it exists (for re-runs)
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON %I', tbl);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        EXECUTE format('CREATE POLICY "Allow all" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
        RAISE NOTICE 'RLS enabled on %', tbl;
    END LOOP;
END $$;
