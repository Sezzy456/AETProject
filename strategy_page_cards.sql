-- ═══════════════════════════════════════════════════
--  AET PROJECT — STRATEGY PAGE CONTENT CARDS
--  Populate tbl_content_card for Content Page 1 (Strategy Spine)
--  Run in Supabase SQL Editor AFTER schema + seed data
-- ═══════════════════════════════════════════════════
--
--  Card types used:
--    'card'               – standard content block
--    'section'            – section divider / heading
--    'objectives_link'    – displays all linked objectives
--    'stakeholder_link'   – links to stakeholder page
--    'actions_link'       – links to actions page
--    'interactions_link'  – links to interactions page
-- ═══════════════════════════════════════════════════

-- First, remove junction references and existing cards for page 1 (idempotent re-run)
DELETE FROM tbl_objective_content_card WHERE occ_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 1);
DELETE FROM tbl_content_card_actions WHERE cca_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 1);
DELETE FROM tbl_content_card_interactions WHERE cci_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 1);
DELETE FROM tbl_content_card_stakeholders WHERE ccs_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 1);
DELETE FROM tbl_content_card WHERE cc_page_id = 1;

-- Order 1: Header card — Comms Strategy Core
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'card', 'Comms Strategy Core',
   'The single source of truth for AET''s Communication & Engagement Strategy (Phase 1).',
   false, 'full', 1, true, NOW(), 1, NOW(), 1);

-- Order 2: Section — Objectives
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'section', 'Objectives', NULL,
   false, 'full', 2, true, NOW(), 1, NOW(), 1);

-- Order 3: Objectives link card — displays all objectives
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'objectives_link', 'Strategy Objectives', NULL,
   false, 'full', 3, true, NOW(), 1, NOW(), 1);

-- Order 4: Section — Core Narrative
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'section', 'Core Narrative', NULL,
   false, 'full', 4, true, NOW(), 1, NOW(), 1);

-- Order 5: Core Narrative content card
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'card', 'Core Narrative',
   'AET is turning regional waste into regional opportunity – keeping value, jobs and skills in the Loddon Mallee through one of Australia''s most advanced resource recovery projects.

Simple: We take household waste, clean it, sort it, and recover useful materials. Local businesses turn those materials into new products. It''s smart recycling that keeps value in the region.',
   false, 'full', 5, true, NOW(), 1, NOW(), 1);

-- Order 6: Section — Strategic Pillars
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'section', 'Strategic Pillars', NULL,
   false, 'full', 6, true, NOW(), 1, NOW(), 1);

-- Order 7-11: Pillar cards (one per pillar)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (1, 'card', 'Regional Value',
   'AET''s ARRC keeps jobs, skills, and investment in the Loddon Mallee.

• 250 construction jobs
• New circular industries
• Local supply chains',
   false, NULL, 7, true, NOW(), 1, NOW(), 1),

  (1, 'card', 'Circular Leadership',
   'Positioning the region as a national leader in modern resource recovery.

• AI-enabled precision sorting
• Scalable design (30k-80k tonnes)
• High-quality material recovery',
   false, NULL, 8, true, NOW(), 1, NOW(), 1),

  (1, 'card', 'Partnership and Trust',
   'Genuine long-term partners with open and transparent communication.

• Community Reference Group
• Clear governance channels
• Strong CoGB engagement',
   false, NULL, 9, true, NOW(), 1, NOW(), 1),

  (1, 'card', 'Environmental Responsibility',
   'Turning waste into value for a cleaner, healthier environment.

• 80,000 tonnes CO₂e avoidance
• Supports 80% diversion target
• Reduced transport emissions',
   false, NULL, 10, true, NOW(), 1, NOW(), 1),

  (1, 'card', 'Economic Resilience',
   'A stable, reliable waste system providing long-term cost certainty.

• Predictable pricing
• Reduced metro dependence
• Diversified revenue streams',
   false, NULL, 11, true, NOW(), 1, NOW(), 1);
