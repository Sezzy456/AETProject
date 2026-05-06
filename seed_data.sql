-- ═══════════════════════════════════════════════════
--  AET PROJECT — SEED DATA v4.2
--  Insert order respects FK constraints
-- ═══════════════════════════════════════════════════

-- ─── CONTACTS (3 internal, 2 external) ───
INSERT INTO tbl_Contact (CO_first_name, CO_last_name, CO_email, CO_phone, CO_avatar_colour, CO_photo_url, CO_is_internal, CO_organisation, CO_role, CO_notes, CO_active, CO_created, CO_modified)
VALUES
  ('Matt',    'Griffin',  'matt@aet.org.au',       '0412000001', '#4A90D9', NULL, TRUE,  'AET',  'CEO',            'Project lead',              TRUE, NOW(), NOW()),
  ('Sarah',   'Chen',    'sarah@aet.org.au',       '0412000002', '#E57373', NULL, TRUE,  'AET',  'Comms Manager',  'Handles stakeholder comms', TRUE, NOW(), NOW()),
  ('James',   'Okafor',  'james@aet.org.au',       '0412000003', '#81C784', NULL, TRUE,  'AET',  'Web Developer',  'Portal development',        TRUE, NOW(), NOW()),
  ('Linda',   'Murray',  'linda@cogb.vic.gov.au',  '0412000004', '#FFB74D', NULL, FALSE, 'CoGB', 'Mayor',          'Key decision maker',        TRUE, NOW(), NOW()),
  ('David',   'Tran',    'david@vant.com.au',      '0412000005', '#BA68C8', NULL, FALSE, 'Vant', 'Director',       'External partner',          TRUE, NOW(), NOW());

-- ─── USERS (2 internal users: admin + member) ───
INSERT INTO tbl_User (US_contact_ID, US_password_hash, US_is_admin, US_active, US_created, US_modified)
VALUES
  (1, '$2b$10$fakehashMattGriffinAdmin000000000000000000000000', TRUE,  TRUE, NOW(), NOW()),
  (2, '$2b$10$fakehashSarahChenMember000000000000000000000000', FALSE, TRUE, NOW(), NOW());

-- Update contact audit created_by now that users exist
UPDATE tbl_Contact SET CO_created_by = 1, CO_modified_by = 1;

-- ─── CONTACT RELATIONSHIPS ───
INSERT INTO tbl_Contact_Relationship (CR_contact_a_ID, CR_contact_b_ID, CR_type, CR_notes, CR_active, CR_created, CR_created_by, CR_modified, CR_modified_by)
VALUES
  (4, 5, 'works_with', 'Linda and David collaborate on regional projects', TRUE, NOW(), 1, NOW(), 1),
  (2, 4, 'ally',       'Sarah has built good rapport with Linda',          TRUE, NOW(), 1, NOW(), 1);

-- ─── TEAMS ───
INSERT INTO tbl_Team (TE_name, TE_active, TE_created, TE_created_by, TE_modified, TE_modified_by)
VALUES
  ('Core Comms Team', TRUE, NOW(), 1, NOW(), 1);

-- ─── TEAM USERS ───
INSERT INTO tbl_Team_User (TU_team_ID, TU_user_ID, TU_role, TU_active, TU_created, TU_created_by, TU_modified, TU_modified_by)
VALUES
  (1, 1, '1', TRUE, NOW(), 1, NOW(), 1),
  (1, 2, '2', TRUE, NOW(), 1, NOW(), 1);

-- ─── ASSETS ───
INSERT INTO tbl_Asset (AS_description, AS_active, AS_created, AS_created_by, AS_modified, AS_modified_by)
VALUES
  ('Community engagement brochure PDF', TRUE, NOW(), 1, NOW(), 1),
  ('Stakeholder map diagram v2',        TRUE, NOW(), 1, NOW(), 1);

-- ─── STRATEGY OBJECTIVES ───
INSERT INTO tbl_Strategy_Objective (SO_strategy_ID, SO_text, SO_order, SO_active, SO_created, SO_created_by, SO_modified, SO_modified_by)
VALUES
  (1, 'Build community trust and transparency around AET operations',       1, TRUE, NOW(), 1, NOW(), 1),
  (1, 'Secure council endorsement for Phase 2 expansion',                   2, TRUE, NOW(), 1, NOW(), 1),
  (1, 'Establish AET as a credible voice in regional energy transformation', 3, TRUE, NOW(), 1, NOW(), 1);

-- ─── CONTENT PAGES ───
INSERT INTO tbl_Content_Page (CP_code, CP_slug, CP_title, CP_active, CP_created, CP_created_by, CP_modified, CP_modified_by)
VALUES
  ('CS', 'strategy-comms',  'Communications Strategy', TRUE, NOW(), 1, NOW(), 1),
  ('KB', 'knowledge-bank',  'Knowledge Bank',          TRUE, NOW(), 1, NOW(), 1),
  ('DB', 'dashboard',       'Dashboard',               TRUE, NOW(), 1, NOW(), 1);

-- ─── CONTENT CARDS ───
INSERT INTO tbl_Content_Card (CC_page_ID, CC_card_type, CC_title, CC_content, CC_is_collapsible, CC_width, CC_order, CC_parent_card_ID, CC_stakeholder_original_ID, CC_active, CC_created, CC_created_by, CC_modified, CC_modified_by)
VALUES
  -- Strategy page cards
  (1, 'section', 'Strategic Pillars', NULL,                                           FALSE, 'full', 1, NULL, NULL,      TRUE, NOW(), 1, NOW(), 1),
  (1, 'card',    'Community Trust',   'Build genuine relationships through consistent, transparent communication', TRUE, 'half', 2, NULL, NULL, TRUE, NOW(), 1, NOW(), 1),
  (1, 'card',    'Economic Impact',   'Demonstrate tangible economic benefits: jobs, investment, local procurement', TRUE, 'half', 3, NULL, NULL, TRUE, NOW(), 1, NOW(), 1),
  -- Knowledge bank cards
  (2, 'card', 'Council Messaging', 'Key messages for council audience: #Focus on jobs and revenue#', FALSE, 'full', 1, NULL, 'sta-001', TRUE, NOW(), 1, NOW(), 1),
  -- Dashboard card
  (3, 'card', 'Active Actions',    '5 actions in progress, 2 overdue', FALSE, 'third', 1, NULL, NULL, TRUE, NOW(), 1, NOW(), 1);

-- ─── PAGE ACCESS ───
INSERT INTO tbl_Page_Access (PAC_page_ID, PAC_user_ID, PAC_can_view, PAC_can_edit, PAC_user_hidden, PAC_active, PAC_created, PAC_created_by, PAC_modified, PAC_modified_by)
VALUES
  (1, 1, TRUE, TRUE,  FALSE, TRUE, NOW(), 1, NOW(), 1),
  (1, 2, TRUE, TRUE,  FALSE, TRUE, NOW(), 1, NOW(), 1),
  (2, 1, TRUE, TRUE,  FALSE, TRUE, NOW(), 1, NOW(), 1),
  (2, 2, TRUE, FALSE, FALSE, TRUE, NOW(), 1, NOW(), 1),
  (3, 1, TRUE, TRUE,  FALSE, TRUE, NOW(), 1, NOW(), 1),
  (3, 2, TRUE, FALSE, TRUE,  TRUE, NOW(), 1, NOW(), 1);

-- ─── PRIVACY RULES ───
INSERT INTO tbl_Privacy_Rule (PR_target_type, PR_target_original_ID, PR_grantee_type, PR_grantee_ID, PR_permission, PR_active, PR_created, PR_created_by, PR_modified, PR_modified_by)
VALUES
  ('stakeholder', 'sta-001', 'everyone', NULL, 'viewer', TRUE, NOW(), 1, NOW(), 1);

-- ─── OBJECTIVE ↔ CONTENT CARD ───
INSERT INTO tbl_Objective_Content_Card (OCC_objective_ID, OCC_content_card_ID, OCC_active, OCC_created, OCC_created_by, OCC_modified, OCC_modified_by)
VALUES
  (1, 2, TRUE, NOW(), 1, NOW(), 1),
  (2, 3, TRUE, NOW(), 1, NOW(), 1);

-- ─── STAKEHOLDERS (2 versions of sta-001 to show versioning, 1 of sta-002) ───
INSERT INTO tbl_Stakeholder (STA_original_ID, STA_name, STA_role, STA_narrative_hook, STA_status, STA_influence, STA_interest, STA_decision_authority, STA_values, STA_posture_current, STA_posture_desired, STA_posture_next_step, STA_posture_target_date, STA_barriers, STA_engagement_approach, STA_comm_preference, STA_email_tone, STA_elevator_pitch, STA_owner_contact_ID, STA_audience_message_card_ID, STA_note, STA_active, STA_created, STA_created_by, STA_modified, STA_modified_by)
VALUES
  -- sta-001 v1 (old version — inactive)
  ('sta-001', 'City of Greater Bendigo', 'Local Government Authority',
   'Council controls planning approvals and community sentiment',
   2, 3, 3, 'Final approval authority on planning permits',
   '["job creation","regional development","community wellbeing"]',
   'Cautious', 'Champion', 'Present economic impact report', '2026-06',
   'Election cycle concerns, competing priorities',
   'Regular briefings with Mayor and CEO',
   'Formal correspondence, face-to-face meetings', 'Professional, data-driven',
   'AET is bringing 200 jobs and $40M investment to the region with full community backing',
   2, 4, 'Initial engagement phase',
   FALSE, '2026-01-15T09:00:00+11:00', 1, '2026-01-15T09:00:00+11:00', 1),

  -- sta-001 v2 (current version — active)
  ('sta-001', 'City of Greater Bendigo', 'Local Government Authority',
   'Council controls planning approvals and community sentiment',
   1, 3, 3, 'Final approval authority on planning permits',
   '["job creation","regional development","community wellbeing","sustainability"]',
   'Supportive', 'Champion', 'Formalise partnership MOU', '2026-09',
   'Some councillor turnover expected in October elections',
   'Monthly briefings, quarterly impact reports',
   'Formal correspondence, face-to-face meetings', 'Professional, data-driven',
   'AET is bringing 200 jobs and $40M investment to the region with full community backing',
   2, 4, 'Upgraded to Supportive after Feb briefing',
   TRUE, '2026-01-15T09:00:00+11:00', 1, '2026-03-20T14:00:00+11:00', 1),

  -- sta-002 (single version — active)
  ('sta-002', 'Vant Energy Partners', 'Industry Partner',
   'Strategic partner for grid connection and technical delivery',
   1, 2, 3, 'Technical advisory role, no veto power',
   '["innovation","commercial return","industry reputation"]',
   'Supportive', 'Advocate', 'Co-author thought leadership piece', '2026-07',
   'Competing internal priorities may slow response times',
   'Fortnightly catch-ups, shared project tracker',
   'Email, video calls', 'Collaborative, informal',
   'Together we''re delivering the region''s first community-scale energy project',
   1, NULL, NULL,
   TRUE, '2026-02-01T10:00:00+11:00', 1, '2026-02-01T10:00:00+11:00', 1);

-- ─── STAKEHOLDER ↔ CONTACT ───
INSERT INTO tbl_Stakeholder_Contact (STC_stakeholder_original_ID, STC_contact_ID, STC_is_lead, STC_active, STC_created, STC_created_by, STC_modified, STC_modified_by)
VALUES
  ('sta-001', 4, TRUE,  TRUE, NOW(), 1, NOW(), 1),
  ('sta-002', 5, TRUE,  TRUE, NOW(), 1, NOW(), 1);

-- ─── ACTIONS (2 versions of act-001, 1 of act-002) ───
INSERT INTO tbl_Action (AC_original_ID, AC_title, AC_description, AC_status, AC_status_detail, AC_priority, AC_complexity, AC_phase, AC_tags, AC_objective_ID, AC_desired_outcome, AC_desired_outcome_type, AC_outcome_stakeholder_original_ID, AC_desired_posture, AC_success_criteria, AC_kpi_target, AC_due_date_granularity, AC_due_date, AC_due_date_display, AC_due_detail, AC_start_date, AC_predicted_length, AC_resource_requirement, AC_todos, AC_note, AC_recent_progress, AC_current_blockers, AC_date_completed, AC_active, AC_created, AC_created_by, AC_modified, AC_modified_by)
VALUES
  -- act-001 v1 (old)
  (1, 'Council Economic Impact Briefing', 'Prepare and deliver economic impact presentation to CoGB council',
   'In Progress', 'Underway', 'High', 3, 1,
   '["Comms","Strategy"]', 2,
   'Council acknowledges economic benefits', 'stakeholder_posture', 'sta-001', 'Supportive',
   'Council minutes reflect positive reception', '1 briefing delivered',
   'month', '2026-03-01', 'March 2026', 'Targeting March ordinary meeting', '2026-01-20', '6 weeks',
   'Sarah + Matt, economic data from finance team',
   '[{"id":"t1","detail":"Gather employment projections","completed":true,"order":1},{"id":"t2","detail":"Draft slide deck","completed":false,"order":2}]',
   NULL, 'Employment data collected from finance', NULL, NULL,
   FALSE, '2026-01-20T09:00:00+11:00', 1, '2026-01-20T09:00:00+11:00', 1),

  -- act-001 v2 (current)
  (1, 'Council Economic Impact Briefing', 'Prepare and deliver economic impact presentation to CoGB council',
   'Completed', NULL, 'High', 3, 1,
   '["Comms","Strategy"]', 2,
   'Council acknowledges economic benefits', 'stakeholder_posture', 'sta-001', 'Supportive',
   'Council minutes reflect positive reception', '1 briefing delivered',
   'month', '2026-03-01', 'March 2026', 'Delivered at March ordinary meeting', '2026-01-20', '6 weeks',
   'Sarah + Matt, economic data from finance team',
   '[{"id":"t1","detail":"Gather employment projections","completed":true,"order":1},{"id":"t2","detail":"Draft slide deck","completed":true,"order":2}]',
   NULL, 'Briefing delivered successfully, positive reception', NULL, '2026-03-05T16:00:00+11:00',
   TRUE, '2026-01-20T09:00:00+11:00', 1, '2026-03-06T09:00:00+11:00', 1),

  -- act-002 (single version)
  (2, 'Draft Community Newsletter #1', 'Write and distribute first community newsletter covering project milestones',
   'Planned', NULL, 'Medium', 2, 1,
   '["Comms"]', 1,
   'Community awareness of project progress', 'text', NULL, NULL,
   'Newsletter distributed to 500+ households', '500 distributions',
   'week', '2026-04-14', 'Mid-April 2026', NULL, '2026-03-15', '4 weeks',
   'Sarah, design contractor',
   '[{"id":"t1","detail":"Write draft copy","completed":false,"order":1},{"id":"t2","detail":"Design layout","completed":false,"order":2},{"id":"t3","detail":"Print and distribute","completed":false,"order":3}]',
   'May need to coordinate with council comms team', NULL, NULL, NULL,
   TRUE, '2026-03-10T10:00:00+11:00', 2, '2026-03-10T10:00:00+11:00', 2);

-- ─── ACTION ↔ AUDIENCE ───
INSERT INTO tbl_Action_Audience (AA_action_original_ID, AA_stakeholder_original_ID, AA_active, AA_created, AA_created_by, AA_modified, AA_modified_by)
VALUES
  ('1', 'sta-001', TRUE, NOW(), 1, NOW(), 1),
  ('2', 'sta-001', TRUE, NOW(), 2, NOW(), 2),
  ('2', 'sta-002', TRUE, NOW(), 2, NOW(), 2);

-- ─── ACTION ↔ OWNERS ───
INSERT INTO tbl_Action_Owner (AO_action_original_ID, AO_contact_ID, AO_active, AO_created, AO_created_by, AO_modified, AO_modified_by)
VALUES
  ('1', 2, TRUE, NOW(), 1, NOW(), 1),
  ('1', 1, TRUE, NOW(), 1, NOW(), 1),
  ('2', 2, TRUE, NOW(), 2, NOW(), 2);

-- ─── ACTION ↔ PREDECESSORS ───
INSERT INTO tbl_Action_Predecessor (AP_action_original_ID, AP_predecessor_original_ID, AP_active, AP_created, AP_created_by, AP_modified, AP_modified_by)
VALUES
  ('2', '1', TRUE, NOW(), 1, NOW(), 1);

-- ─── ACTION ↔ ASSETS ───
INSERT INTO tbl_Action_Asset (AAS_action_original_ID, AAS_asset_ID, AAS_is_outcome, AAS_active, AAS_created, AAS_created_by, AAS_modified, AAS_modified_by)
VALUES
  ('1', 2, FALSE, TRUE, NOW(), 1, NOW(), 1),
  ('2', 1, TRUE,  TRUE, NOW(), 2, NOW(), 2);

-- ─── INTERACTIONS (1 entity, single version) ───
INSERT INTO tbl_Interaction (IN_original_ID, IN_title, IN_date, IN_type, IN_purpose, IN_description, IN_outcome_score, IN_outcome_notes, IN_follow_up_date, IN_active, IN_created, IN_created_by, IN_modified, IN_modified_by)
VALUES
  ('int-001', 'Council Pre-Briefing with Mayor Murray',
   '2026-02-18T10:00:00+11:00', 'In-Person',
   'Pre-brief the Mayor ahead of the March council meeting',
   'Met with Mayor Murray at council offices. Walked through the economic impact data and key messages. She was receptive and suggested we also address the sustainability angle.',
   4, 'Positive reception. Mayor will advocate internally. Suggested adding sustainability data.',
   '2026-03-01',
   TRUE, '2026-02-18T10:00:00+11:00', 2, '2026-02-18T15:00:00+11:00', 2);

-- ─── INTERACTION ↔ ATTENDEES ───
INSERT INTO tbl_Interaction_Attendee (IA_interaction_original_ID, IA_contact_ID, IA_active, IA_created, IA_created_by, IA_modified, IA_modified_by)
VALUES
  ('int-001', 2, TRUE, NOW(), 2, NOW(), 2),
  ('int-001', 4, TRUE, NOW(), 2, NOW(), 2);

-- ─── INTERACTION AGENDA ITEMS ───
INSERT INTO tbl_Interaction_Agenda_Item (IAI_interaction_original_ID, IAI_type, IAI_linked_action_original_ID, IAI_linked_objective_ID, IAI_details, IAI_order, IAI_active, IAI_created, IAI_created_by, IAI_modified, IAI_modified_by)
VALUES
  ('int-001', 'discuss', '1', 2, 'Walk through economic impact slide deck', 1, TRUE, NOW(), 2, NOW(), 2),
  ('int-001', 'discuss', NULL, 1, 'Gauge council appetite for public partnership announcement', 2, TRUE, NOW(), 2, NOW(), 2);

-- ─── RISKS ───
INSERT INTO tbl_Risk (RI_type, RI_stakeholder_ID, RI_description, RI_severity, RI_status, RI_resolved_date, RI_active, RI_created, RI_created_by, RI_modified, RI_modified_by)
VALUES
  ('stakeholder_friction', 1, 'October council elections may change key decision-makers', 3, 'open', NULL, TRUE, NOW(), 1, NOW(), 1),
  ('action_blocker', NULL, 'Design contractor availability may delay newsletter', 2, 'open', NULL, TRUE, NOW(), 2, NOW(), 2);

-- ─── CONTENT CARD ↔ ACTIONS ───
INSERT INTO tbl_Content_Card_Actions (CCA_content_card_ID, CCA_action_original_ID, CCA_active, CCA_created, CCA_created_by, CCA_modified, CCA_modified_by)
VALUES
  (5, '2', TRUE, NOW(), 1, NOW(), 1);

-- ─── CONTENT CARD ↔ INTERACTIONS ───
INSERT INTO tbl_Content_Card_Interactions (CCI_content_card_ID, CCI_interaction_original_ID, CCI_active, CCI_created, CCI_created_by, CCI_modified, CCI_modified_by)
VALUES
  (4, 'int-001', TRUE, NOW(), 1, NOW(), 1);

-- ─── CONTENT CARD ↔ STAKEHOLDERS ───
INSERT INTO tbl_Content_Card_Stakeholders (CCS_content_card_ID, CCS_stakeholder_original_ID, CCS_active, CCS_created, CCS_created_by, CCS_modified, CCS_modified_by)
VALUES
  (4, 'sta-001', TRUE, NOW(), 1, NOW(), 1);


-- ═══════════════════════════════════════════════════
--  VERIFICATION QUERIES
--  Run these after seeding to confirm data looks right
-- ═══════════════════════════════════════════════════

-- Current stakeholders only
-- SELECT STA_name, STA_status, STA_posture_current FROM tbl_Stakeholder WHERE STA_active = TRUE;

-- Stakeholder version history for sta-001
-- SELECT STA_ID, STA_posture_current, STA_active, STA_modified FROM tbl_Stakeholder WHERE STA_original_ID = 'sta-001' ORDER BY STA_modified;

-- Action version history for act-001
-- SELECT AC_ID, AC_title, AC_status, AC_active, AC_modified FROM tbl_Action WHERE AC_original_ID = 1 ORDER BY AC_modified;

-- All contacts with their user status
-- SELECT c.CO_first_name, c.CO_last_name, c.CO_is_internal, u.US_is_admin FROM tbl_Contact c LEFT JOIN tbl_User u ON u.US_contact_ID = c.CO_ID;
