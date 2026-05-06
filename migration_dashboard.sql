-- ═══════════════════════════════════════════════════
--  AET PROJECT — SCHEMA MIGRATION: Dashboard Support
--  Run in Supabase SQL Editor AFTER schema v4.2
-- ═══════════════════════════════════════════════════

-- 1. Add CC_filter column to tbl_Content_Card
ALTER TABLE tbl_content_card ADD COLUMN IF NOT EXISTS cc_filter VARCHAR;
COMMENT ON COLUMN tbl_content_card.cc_filter IS 'Filter keyword for link cards: upcoming, recent, in_progress, objectives, etc.';

-- 2. New junction table: Content Page ↔ Content (links pages to pages)
CREATE TABLE IF NOT EXISTS tbl_content_page_content (
  cpc_id              SERIAL PRIMARY KEY,
  cpc_source_page_id  INTEGER REFERENCES tbl_content_page(cp_id),  -- page containing the link
  cpc_target_page_id  INTEGER REFERENCES tbl_content_page(cp_id),  -- page being linked to
  cpc_content_card_id INTEGER REFERENCES tbl_content_card(cc_id),  -- card that does the linking
  cpc_filter          VARCHAR,  -- optional filter for what to show from target page

  -- Audit
  cpc_active       BOOLEAN,
  cpc_created      TIMESTAMPTZ,
  cpc_created_by   INTEGER REFERENCES tbl_user(us_id),
  cpc_modified     TIMESTAMPTZ,
  cpc_modified_by  INTEGER REFERENCES tbl_user(us_id)
);

COMMENT ON TABLE tbl_content_page_content IS 'Junction: links one content page to another via a card. Generic — dashboard→strategy, KB→strategy, etc.';

-- Enable RLS
ALTER TABLE tbl_content_page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_content_page_content FOR ALL USING (true) WITH CHECK (true);
