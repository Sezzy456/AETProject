-- ═══════════════════════════════════════════════════
--  AET PROJECT — DASHBOARD CONTENT CARDS
--  Dashboard = Content Page 3
--  Run AFTER migration_dashboard.sql
-- ═══════════════════════════════════════════════════

-- Clear existing dashboard cards (page 3)
DELETE FROM tbl_content_page_content WHERE cpc_source_page_id = 3;
DELETE FROM tbl_objective_content_card WHERE occ_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 3);
DELETE FROM tbl_content_card_actions WHERE cca_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 3);
DELETE FROM tbl_content_card_interactions WHERE cci_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 3);
DELETE FROM tbl_content_card_stakeholders WHERE ccs_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 3);
DELETE FROM tbl_content_card WHERE cc_page_id = 3;

-- ─── OVERVIEW CARDS (order 1-3) ───
-- Stakeholders overview
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'overview_card', 'Stakeholders', 'third', 1, true, NOW(), 1, NOW(), 1);

-- Interactions overview
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'overview_card', 'Interactions', 'third', 2, true, NOW(), 1, NOW(), 1);

-- Actions overview
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'overview_card', 'Actions', 'third', 3, true, NOW(), 1, NOW(), 1);

-- ─── CONTENT CARDS (order 4-5) ───
-- Focus Area
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'card', 'Focus Area', 'Whole company focus area goes here', 'half', 4, true, NOW(), 1, NOW(), 1);

-- Executive Summary
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'card', 'Executive Summary', 'AI summary of what you specifically should be doing goes here', 'half', 5, true, NOW(), 1, NOW(), 1);

-- ─── LINK CARDS (order 6-8) ───
-- Actions link (3 most recent)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'actions_link', 'Actions', 'full', 6, NULL, true, NOW(), 1, NOW(), 1);

-- Upcoming Interactions
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'interactions_link', 'Upcoming Interactions', 'full', 7, 'upcoming', true, NOW(), 1, NOW(), 1);

-- Recent Interactions
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'interactions_link', 'Recent Interactions', 'full', 8, 'recent', true, NOW(), 1, NOW(), 1);

-- ─── PAGE LINK (order 9) ───
-- Strategy Room link card
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_width, cc_order, cc_filter, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES (3, 'page_link', 'Strategy Room', 'full', 9, 'objectives', true, NOW(), 1, NOW(), 1);

-- Link the page_link card to the Strategy page (cp_id = 1)
-- We need the cc_id of the card we just inserted, so use a subquery
INSERT INTO tbl_content_page_content
  (cpc_source_page_id, cpc_target_page_id, cpc_content_card_id, cpc_filter, cpc_active, cpc_created, cpc_created_by, cpc_modified, cpc_modified_by)
VALUES (
  3,  -- Dashboard
  1,  -- Strategy page
  (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 3 AND cc_card_type = 'page_link' AND cc_order = 9 LIMIT 1),
  'objectives',
  true, NOW(), 1, NOW(), 1
);
