-- ═══════════════════════════════════════════════════
--  AET PROJECT — MESSAGING & Q&As PAGE CONTENT CARDS
--  Populate tbl_content_card for Content Page 2 (Knowledge Bank / Messaging)
--  Run in Supabase SQL Editor AFTER schema + seed data
-- ═══════════════════════════════════════════════════
--
--  Card types used:
--    'section'  – section heading
--    'card'     – standard content block
--
--  Special columns used:
--    cc_parent_card_id          – links child card to parent (e.g. proof points → key message)
--    cc_stakeholder_original_id – links audience card to stakeholder
--    cc_is_collapsible          – accordion toggle
-- ═══════════════════════════════════════════════════

-- Idempotent cleanup: remove all cards for page 2
-- First, nullify any stakeholder FK references to these cards
UPDATE tbl_stakeholder SET sta_audience_message_card_id = NULL
  WHERE sta_audience_message_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2);
-- Then remove junction table references
DELETE FROM tbl_objective_content_card WHERE occ_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2);
DELETE FROM tbl_content_card_actions WHERE cca_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2);
DELETE FROM tbl_content_card_interactions WHERE cci_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2);
DELETE FROM tbl_content_card_stakeholders WHERE ccs_content_card_id IN (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2);
-- Delete children first (they reference parent), then parents
DELETE FROM tbl_content_card WHERE cc_page_id = 2 AND cc_parent_card_id IS NOT NULL;
DELETE FROM tbl_content_card WHERE cc_page_id = 2;


-- ═══════════════════════════════════════════════════
-- SECTION 1: PROJECT KEY MESSAGES
-- ═══════════════════════════════════════════════════

-- Order 1: Section heading
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'section', 'Project Key Messages', NULL,
   false, 'full', 1, true, NOW(), 1, NOW(), 1);

-- Order 2: Environmental Outcomes (Key Message)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Environmental Outcomes',
   'The Advanced Resource Recovery Centre (ARRC) will reduce landfill and help create a cleaner, healthier environment.',
   false, 'half', 2, true, NOW(), 1, NOW(), 1);

-- Order 3: Proof Points for Environmental Outcomes (child, collapsible)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by,
   cc_parent_card_id)
VALUES
  (2, 'card', 'Proof Points',
   'The project significantly reduces greenhouse gas emissions, with the potential to avoid around 80,000 tonnes of CO₂e annually.
Line about reducing landfill and why this is critical
The ARRC will produce high-quality materials that can be reused by local industries and help improve soil health and land management.
Processing materials locally at the ARRC will reduce long-distance transport and associated emissions.
The project directly supports Victoria''s Recycling Victoria 80% diversion target and aligns with the National Circular Economy Framework.',
   true, 'full', 3, true, NOW(), 1, NOW(), 1,
   (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2 AND cc_title = 'Environmental Outcomes' AND cc_order = 2 LIMIT 1));

-- Order 4: Regional Economic Benefits (Key Message)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Regional Economic Benefits',
   'The ARRC will create jobs, attract investment and build new circular industries, strengthening the local economy.',
   false, 'half', 4, true, NOW(), 1, NOW(), 1);

-- Order 5: Proof Points for Regional Economic Benefits (child, collapsible)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by,
   cc_parent_card_id)
VALUES
  (2, 'card', 'Proof Points',
   'The project will create up to 80 direct jobs and 150 indirect roles across operations, logistics, maintenance and R&D, with training pathways through local tertiary partner.
It will help establish new circular industries such as plastics reprocessing, organics, soil products and biochar.
The project will attract private investment and strengthen local supply chains, supporting long-term regional growth.
The project keeps economic value local by processing waste in the region rather than transporting materials - and the economic opportunity tied to them - elsewhere.
Recovering valuable materials creates additional revenue streams, helping make the regional waste system more financially stable over time.',
   true, 'full', 5, true, NOW(), 1, NOW(), 1,
   (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2 AND cc_title = 'Regional Economic Benefits' AND cc_order = 4 LIMIT 1));

-- Order 6: Circular Leadership and Innovation (Key Message)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Circular Leadership and Innovation',
   'The project brings the latest, AI-enabled recovery technology to the Loddon Mallee - positioning the region as a national leader in modern resource recovery and circular innovation.',
   false, 'half', 6, true, NOW(), 1, NOW(), 1);

-- Order 7: Proof Points for Circular Leadership (child, collapsible)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by,
   cc_parent_card_id)
VALUES
  (2, 'card', 'Proof Points',
   'State of the art sorting facility.
AI systems adapt to waste streams.',
   true, 'full', 7, true, NOW(), 1, NOW(), 1,
   (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2 AND cc_title = 'Circular Leadership and Innovation' AND cc_order = 6 LIMIT 1));

-- Order 8: Partnerships (Key Message)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Partnerships',
   'AET values councils, communities and industry as genuine long-term partners, with open and transparent communication and engagement at the heart of the project.',
   false, 'half', 8, true, NOW(), 1, NOW(), 1);

-- Order 9: Proof Points for Partnerships (child, collapsible)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by,
   cc_parent_card_id)
VALUES
  (2, 'card', 'Proof Points',
   'Community Reference Groups.
Transparent reporting structures.',
   true, 'full', 9, true, NOW(), 1, NOW(), 1,
   (SELECT cc_id FROM tbl_content_card WHERE cc_page_id = 2 AND cc_title = 'Partnerships' AND cc_order = 8 LIMIT 1));


-- ═══════════════════════════════════════════════════
-- SECTION 2: FAQs
-- ═══════════════════════════════════════════════════

-- Order 10: Section heading
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'section', 'FAQs', NULL,
   false, 'full', 10, true, NOW(), 1, NOW(), 1);

-- Order 11: FAQ — Who is AET?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Who is AET?',
   'AET develops smart projects that turn everyday waste into valuable resources - reducing landfill, cutting emissions and keeping value in the region.

We help regional communities move toward a circular economy by designing systems that recover materials, support local industry and create long-term environmental benefits.

AET''s Pyramid Hill R&D facility plays a critical role in this work. It allows the team to test how organic waste can be transformed into valuable carbon products and, by working with local businesses, identify practical ways to return these materials to industry. These proven methods will be applied at the Advanced Resource Recovery Centre (ARRC) to ensure as much waste as possible is put to good use.',
   true, 'full', 11, true, NOW(), 1, NOW(), 1);

-- Order 12: FAQ — What does AET do?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'What does AET do?',
   'AET develops smart projects that turn everyday waste into valuable resources. Our systems use advanced sorting and processing technology to recover materials that would otherwise go to landfill, supporting regional economies and reducing environmental impact.',
   true, 'full', 12, true, NOW(), 1, NOW(), 1);

-- Order 13: FAQ — What is the ARRC project?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'What is the ARRC project?',
   'The Advanced Resource Recovery Centre (ARRC) is a proposed state-of-the-art facility in the Loddon Mallee region that will process mixed waste streams using AI-enabled sorting technology. It aims to divert up to 80% of waste from landfill by recovering high-quality recyclable materials and converting organic waste into valuable products like biochar and compost.',
   true, 'full', 13, true, NOW(), 1, NOW(), 1);

-- Order 14: FAQ — What stage is the project at?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'What stage is the project at?',
   'The project is currently in the feasibility and planning stage. AET is working with councils, government agencies and community stakeholders to refine the design, secure approvals and build the partnerships needed to bring the ARRC to life.',
   true, 'full', 14, true, NOW(), 1, NOW(), 1);

-- Order 15: FAQ — What technology will the ARRC use?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'What technology will the ARRC use?',
   'The ARRC will use AI and machine learning systems to identify and sort materials with high accuracy. This technology continuously adapts to changing waste streams, maximising recovery rates. The facility will also incorporate advanced organic processing to convert food and garden waste into soil products and renewable energy feedstock.',
   true, 'full', 15, true, NOW(), 1, NOW(), 1);

-- Order 16: FAQ — Will AI reduce the number of local jobs at the ARRC?
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'card', 'Will AI reduce the number of local jobs at the ARRC?',
   'No. AI augments the resource recovery process rather than replacing workers. The technology handles repetitive sorting tasks with higher precision, while creating new skilled roles in facility management, system maintenance, data analysis and quality assurance. The project is expected to create up to 80 direct jobs and 150 indirect roles in the region.',
   true, 'full', 16, true, NOW(), 1, NOW(), 1);


-- ═══════════════════════════════════════════════════
-- SECTION 3: KEY AUDIENCE SPECIFIC MESSAGES
-- ═══════════════════════════════════════════════════

-- Order 17: Section heading
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by)
VALUES
  (2, 'section', 'Key Audience Specific Messages', NULL,
   false, 'full', 17, true, NOW(), 1, NOW(), 1);

-- Order 18: Audience — City of Greater Bendigo (linked to stakeholder sta-001)
INSERT INTO tbl_content_card
  (cc_page_id, cc_card_type, cc_title, cc_content, cc_is_collapsible, cc_width, cc_order, cc_active, cc_created, cc_created_by, cc_modified, cc_modified_by,
   cc_stakeholder_original_id)
VALUES
  (2, 'card', 'City of Greater Bendigo (CoGB)',
   'The Advanced Resource Recovery Centre (ARRC) delivers long-term stability and value for the region - keeping jobs, skills and investment local, while reducing landfill and future cost pressures.',
   false, 'half', 18, true, NOW(), 1, NOW(), 1,
   'sta-001');
