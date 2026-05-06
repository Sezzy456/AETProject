-- ═══════════════════════════════════════════════════
--  AET PROJECT — SCHEMA MIGRATION: Dashboard Support
--  Run in Supabase SQL Editor AFTER schema v4.2
-- ═══════════════════════════════════════════════════

-- 1. Add CC_filter column to tbl_Content_Card
ALTER TABLE tbl_content_card ADD COLUMN IF NOT EXISTS cc_filter VARCHAR;
COMMENT ON COLUMN tbl_content_card.cc_filter IS 'Filter keyword for link cards: upcoming, recent, in_progress, completed, objectives, etc.';

-- 2. Add variation columns to tbl_Content_Page
ALTER TABLE tbl_content_page ADD COLUMN IF NOT EXISTS cp_variation INTEGER DEFAULT 1;
ALTER TABLE tbl_content_page ADD COLUMN IF NOT EXISTS cp_variation_group VARCHAR;
ALTER TABLE tbl_content_page ADD COLUMN IF NOT EXISTS cp_variation_label VARCHAR;
COMMENT ON COLUMN tbl_content_page.cp_variation IS 'Variation number within a group (1=default)';
COMMENT ON COLUMN tbl_content_page.cp_variation_group IS 'Groups pages that share the same tab bar: dashboard, strategy, etc.';
COMMENT ON COLUMN tbl_content_page.cp_variation_label IS 'Tab label displayed in the UI: Overview, Retrospective, etc.';

-- Tag existing pages
UPDATE tbl_content_page SET cp_variation = 1, cp_variation_group = 'strategy', cp_variation_label = 'Comms' WHERE cp_id = 1;
UPDATE tbl_content_page SET cp_variation = 1, cp_variation_group = NULL, cp_variation_label = NULL WHERE cp_id = 2;
UPDATE tbl_content_page SET cp_variation = 1, cp_variation_group = 'dashboard', cp_variation_label = 'Overview' WHERE cp_id = 3;

-- 3. Create Retrospective dashboard page (variation 2)
INSERT INTO tbl_content_page
  (cp_code, cp_slug, cp_title, cp_variation, cp_variation_group, cp_variation_label, cp_active, cp_created, cp_created_by, cp_modified, cp_modified_by)
VALUES
  ('DB', 'dashboard-retro', 'Dashboard – Retrospective', 2, 'dashboard', 'Retrospective', true, NOW(), 1, NOW(), 1);

-- Insert Retrospective cards (page = the one we just created)
-- Executive Summary card
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (
  (SELECT cp_id FROM tbl_content_page WHERE cp_slug = 'dashboard-retro' LIMIT 1),
  'card', 'Retrospective Summary', 'AI-generated summary of recent completed work, key decisions made, and outcomes achieved.', 'full', 1, true, NOW(), 1, NOW(), 1
);

-- Completed Actions
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (
  (SELECT cp_id FROM tbl_content_page WHERE cp_slug = 'dashboard-retro' LIMIT 1),
  'actions_link', 'Completed Actions', 'full', 2, 'completed', true, NOW(), 1, NOW(), 1
);

-- Recent Interactions
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (
  (SELECT cp_id FROM tbl_content_page WHERE cp_slug = 'dashboard-retro' LIMIT 1),
  'interactions_link', 'Recent Interactions', 'full', 3, 'recent', true, NOW(), 1, NOW(), 1
);

-- 4. New junction table: Content Page ↔ Content (links pages to pages)
CREATE TABLE IF NOT EXISTS tbl_content_page_content (
  cpc_id              SERIAL PRIMARY KEY,
  cpc_source_page_id  INTEGER REFERENCES tbl_content_page(cp_id),
  cpc_target_page_id  INTEGER REFERENCES tbl_content_page(cp_id),
  cpc_content_card_id INTEGER REFERENCES tbl_content_card(cc_id),
  cpc_filter          VARCHAR,

  -- Audit
  cpc_active       BOOLEAN,
  cpc_created      TIMESTAMPTZ,
  cpc_created_by   INTEGER REFERENCES tbl_user(us_id),
  cpc_modified     TIMESTAMPTZ,
  cpc_modified_by  INTEGER REFERENCES tbl_user(us_id)
);

COMMENT ON TABLE tbl_content_page_content IS 'Junction: links one content page to another via a card.';

-- Enable RLS
ALTER TABLE tbl_content_page_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON tbl_content_page_content;
CREATE POLICY "Allow all" ON tbl_content_page_content FOR ALL USING (true) WITH CHECK (true);
