-- ═══════════════════════════════════════════════════
--  AET PROJECT — DATABASE SCHEMA v4.2
--  Supabase / PostgreSQL migration
--  Inline versioning · Composable content cards · Page access control
--  Standard audit fields on ALL tables · Content Card entity junctions
-- ═══════════════════════════════════════════════════


-- ─────────────────────────────────────────────────
--  CONTACTS
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Contact (
  CO_ID            SERIAL PRIMARY KEY,
  CO_first_name    VARCHAR,
  CO_last_name     VARCHAR,
  CO_email         VARCHAR,
  CO_phone         VARCHAR,
  CO_avatar_colour VARCHAR,       -- Hex colour for UI badge
  CO_photo_url     VARCHAR,       -- Avatar / profile photo path
  CO_is_internal   BOOLEAN,       -- true = internal team member
  CO_organisation  VARCHAR,       -- e.g. CoGB, Vant, AET
  CO_role          VARCHAR,       -- e.g. Comms, CEO, Web Developer (within Organisation)
  CO_notes         TEXT,

  -- Audit
  CO_active        BOOLEAN,
  CO_created       TIMESTAMPTZ,
  CO_created_by    INTEGER,       -- FK added after tbl_User exists
  CO_modified      TIMESTAMPTZ,
  CO_modified_by   INTEGER        -- FK added after tbl_User exists
);


-- ─────────────────────────────────────────────────
--  USERS & TEAMS
--  Created before Contact FKs so audit refs can resolve
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_User (
  US_ID            SERIAL PRIMARY KEY,
  US_contact_ID    INTEGER UNIQUE REFERENCES tbl_Contact(CO_ID),  -- One-to-one: every user IS a contact
  US_password_hash VARCHAR,       -- bcrypt hash — never store plaintext passwords
  US_is_admin      BOOLEAN,       -- true = can manage users, page access, and system settings

  -- Audit
  US_active        BOOLEAN,
  US_created       TIMESTAMPTZ,
  US_created_by    INTEGER REFERENCES tbl_User(US_ID),
  US_modified      TIMESTAMPTZ,
  US_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

-- Now add Contact audit FKs
ALTER TABLE tbl_Contact
  ADD CONSTRAINT fk_contact_created_by  FOREIGN KEY (CO_created_by)  REFERENCES tbl_User(US_ID),
  ADD CONSTRAINT fk_contact_modified_by FOREIGN KEY (CO_modified_by) REFERENCES tbl_User(US_ID);


CREATE TABLE tbl_Contact_Relationship (
  CR_ID            SERIAL PRIMARY KEY,
  CR_contact_a_ID  INTEGER REFERENCES tbl_Contact(CO_ID),
  CR_contact_b_ID  INTEGER REFERENCES tbl_Contact(CO_ID),
  CR_type          VARCHAR,       -- reports_to, works_with, tension, ally
  CR_notes         TEXT,

  -- Audit
  CR_active        BOOLEAN,
  CR_created       TIMESTAMPTZ,
  CR_created_by    INTEGER REFERENCES tbl_User(US_ID),
  CR_modified      TIMESTAMPTZ,
  CR_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


CREATE TABLE tbl_Team (
  TE_ID            SERIAL PRIMARY KEY,
  TE_name          VARCHAR,

  -- Audit
  TE_active        BOOLEAN,
  TE_created       TIMESTAMPTZ,
  TE_created_by    INTEGER REFERENCES tbl_User(US_ID),
  TE_modified      TIMESTAMPTZ,
  TE_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Team_User (
  TU_ID            SERIAL PRIMARY KEY,
  TU_team_ID       INTEGER REFERENCES tbl_Team(TE_ID),
  TU_user_ID       INTEGER REFERENCES tbl_User(US_ID),
  TU_role          VARCHAR,       -- Team permissions | 1 create, 2 edit, 3 view

  -- Audit
  TU_active        BOOLEAN,
  TU_created       TIMESTAMPTZ,
  TU_created_by    INTEGER REFERENCES tbl_User(US_ID),
  TU_modified      TIMESTAMPTZ,
  TU_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  ASSETS
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Asset (
  AS_ID            SERIAL PRIMARY KEY,
  AS_description   TEXT,

  -- Audit
  AS_active        BOOLEAN,
  AS_created       TIMESTAMPTZ,
  AS_created_by    INTEGER REFERENCES tbl_User(US_ID),
  AS_modified      TIMESTAMPTZ,
  AS_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  STRATEGY SPINE
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Strategy_Objective (
  SO_ID            SERIAL PRIMARY KEY,
  SO_strategy_ID   INTEGER,
  SO_text          VARCHAR,
  SO_order         INTEGER,

  -- Audit
  SO_active        BOOLEAN,
  SO_created       TIMESTAMPTZ,
  SO_created_by    INTEGER REFERENCES tbl_User(US_ID),
  SO_modified      TIMESTAMPTZ,
  SO_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  CONTENT PAGES & CARDS
--  Created before Stakeholder/Action so FK refs resolve
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Content_Page (
  CP_ID            SERIAL PRIMARY KEY,
  CP_code          VARCHAR,       -- Short human-readable prefix, e.g. PA
  CP_slug          VARCHAR,       -- URL-friendly identifier
  CP_title         VARCHAR,       -- Display title

  -- Audit
  CP_active        BOOLEAN,
  CP_created       TIMESTAMPTZ,
  CP_created_by    INTEGER REFERENCES tbl_User(US_ID),
  CP_modified      TIMESTAMPTZ,
  CP_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Content_Card (
  CC_ID                       SERIAL PRIMARY KEY,
  CC_page_ID                  INTEGER REFERENCES tbl_Content_Page(CP_ID),
  CC_card_type                VARCHAR,       -- card, section, link
  CC_title                    VARCHAR,
  CC_content                  TEXT,          -- Rich text with markup: #bold#, - bullets, |csv|
  CC_is_collapsible           BOOLEAN,       -- true = renders as expandable/collapsible dropdown
  CC_width                    VARCHAR,       -- full, half, third — controls card width on the page
  CC_order                    INTEGER,       -- Display order on the page
  CC_parent_card_ID           INTEGER REFERENCES tbl_Content_Card(CC_ID),  -- Self-reference for sub-items
  CC_stakeholder_original_ID  VARCHAR,       -- For audience-specific messages (FK added after tbl_Stakeholder)

  -- Audit
  CC_active        BOOLEAN,
  CC_created       TIMESTAMPTZ,
  CC_created_by    INTEGER REFERENCES tbl_User(US_ID),
  CC_modified      TIMESTAMPTZ,
  CC_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  PAGE ACCESS
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Page_Access (
  PAC_ID           SERIAL PRIMARY KEY,
  PAC_page_ID      INTEGER REFERENCES tbl_Content_Page(CP_ID),  -- Which page
  PAC_user_ID      INTEGER REFERENCES tbl_User(US_ID),          -- Which user
  PAC_can_view     BOOLEAN,       -- Admin-set: user can see this page
  PAC_can_edit     BOOLEAN,       -- Admin-set: user can edit content on this page
  PAC_user_hidden  BOOLEAN,       -- Self-managed: user has chosen to hide this from their navigation

  -- Audit
  PAC_active       BOOLEAN,
  PAC_created      TIMESTAMPTZ,
  PAC_created_by   INTEGER REFERENCES tbl_User(US_ID),  -- Admin who set this access
  PAC_modified     TIMESTAMPTZ,
  PAC_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  PRIVACY RULES
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Privacy_Rule (
  PR_ID                  SERIAL PRIMARY KEY,
  PR_target_type         VARCHAR,       -- action, interaction, stakeholder
  PR_target_original_ID  VARCHAR,       -- AC_original_ID, IN_original_ID, or STA_original_ID (polymorphic)
  PR_grantee_type        VARCHAR,       -- everyone, team, user
  PR_grantee_ID          INTEGER,       -- TE_ID or US_ID (polymorphic, NULL if everyone)
  PR_permission          VARCHAR,       -- viewer, editor

  -- Audit
  PR_active        BOOLEAN,
  PR_created       TIMESTAMPTZ,
  PR_created_by    INTEGER REFERENCES tbl_User(US_ID),
  PR_modified      TIMESTAMPTZ,
  PR_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  OBJECTIVE ↔ CONTENT CARD junction
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Objective_Content_Card (
  OCC_ID               SERIAL PRIMARY KEY,
  OCC_objective_ID     INTEGER REFERENCES tbl_Strategy_Objective(SO_ID),
  OCC_content_card_ID  INTEGER REFERENCES tbl_Content_Card(CC_ID),

  -- Audit
  OCC_active       BOOLEAN,
  OCC_created      TIMESTAMPTZ,
  OCC_created_by   INTEGER REFERENCES tbl_User(US_ID),
  OCC_modified     TIMESTAMPTZ,
  OCC_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  STAKEHOLDERS (inline versioning)
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Stakeholder (
  STA_ID                        SERIAL PRIMARY KEY,  -- Version-specific PK
  STA_original_ID               VARCHAR,             -- Entity UUID — groups all versions
  STA_name                      VARCHAR,
  STA_role                      VARCHAR,
  STA_narrative_hook            TEXT,
  STA_status                    INTEGER,             -- Operational, Stable, Friction Points, Strained, Critical/At Risk, Dormant
  STA_influence                 INTEGER,             -- 1=Low, 2=Medium, 3=High
  STA_interest                  INTEGER,             -- 1=Low, 2=Medium, 3=High
  STA_decision_authority        TEXT,
  STA_values                    JSONB,               -- e.g. ["job creation","budget savings"]
  STA_posture_current           VARCHAR,
  STA_posture_desired           VARCHAR,
  STA_posture_next_step         VARCHAR,
  STA_posture_target_date       VARCHAR,
  STA_barriers                  TEXT,
  STA_engagement_approach       TEXT,
  STA_comm_preference           TEXT,
  STA_email_tone                TEXT,
  STA_elevator_pitch            TEXT,
  STA_owner_contact_ID          INTEGER REFERENCES tbl_Contact(CO_ID),   -- Primary owner
  STA_audience_message_card_ID  INTEGER REFERENCES tbl_Content_Card(CC_ID),  -- Linked audience message card
  STA_note                      TEXT,

  -- Audit
  STA_active       BOOLEAN,
  STA_created      TIMESTAMPTZ,   -- Date the entity was first created — copied forward on every version
  STA_created_by   INTEGER REFERENCES tbl_User(US_ID),
  STA_modified     TIMESTAMPTZ,   -- Date this specific version was created
  STA_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);

-- NOTE: CC_stakeholder_original_ID → STA_original_ID is an application-enforced
-- reference, NOT a FK constraint. STA_original_ID is non-unique by design
-- (multiple version rows share the same value for inline versioning).
-- The same applies to all _original_ID references in junction tables below.

CREATE INDEX idx_stakeholder_original_id  ON tbl_Stakeholder(STA_original_ID);
CREATE INDEX idx_stakeholder_active       ON tbl_Stakeholder(STA_active);


CREATE TABLE tbl_Stakeholder_Contact (
  STC_ID                       SERIAL PRIMARY KEY,
  STC_stakeholder_original_ID  VARCHAR,       -- Relationship is to the entity, not a version
  STC_contact_ID               INTEGER REFERENCES tbl_Contact(CO_ID),
  STC_is_lead                  BOOLEAN,       -- Primary contact for this stakeholder

  -- Audit
  STC_active       BOOLEAN,
  STC_created      TIMESTAMPTZ,
  STC_created_by   INTEGER REFERENCES tbl_User(US_ID),
  STC_modified     TIMESTAMPTZ,
  STC_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  ACTIONS (inline versioning)
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Action (
  AC_ID                              SERIAL PRIMARY KEY,  -- Version-specific PK
  AC_original_ID                     INTEGER,             -- Entity UUID — groups all versions
  AC_title                           VARCHAR,
  AC_description                     TEXT,
  AC_status                          VARCHAR,             -- Pending, Planned, In Progress, Completed
  AC_status_detail                   VARCHAR,             -- Free-text detail e.g. At Risk, Underway
  AC_priority                        VARCHAR,             -- ASAP, High, Medium, Low
  AC_complexity                      INTEGER,             -- 1–5
  AC_phase                           INTEGER,             -- Phase number
  AC_tags                            JSONB,               -- e.g. ["Comms","Strategy","Legal"]
  AC_objective_ID                    INTEGER REFERENCES tbl_Strategy_Objective(SO_ID),  -- Nullable
  AC_desired_outcome                 TEXT,
  AC_desired_outcome_type            VARCHAR,             -- text, asset, stakeholder_posture
  AC_outcome_stakeholder_original_ID VARCHAR,             -- If outcome type = stakeholder_posture
  AC_desired_posture                 VARCHAR,
  AC_success_criteria                TEXT,
  AC_kpi_target                      VARCHAR,
  AC_due_date_granularity            VARCHAR,             -- month, week, day, datetime
  AC_due_date                        TIMESTAMPTZ,
  AC_due_date_display                VARCHAR,
  AC_due_detail                      VARCHAR,
  AC_start_date                      TIMESTAMPTZ,
  AC_predicted_length                VARCHAR,
  AC_resource_requirement            TEXT,
  AC_todos                           JSONB,               -- e.g. [{"id":"t1","detail":"Draft pillars","completed":false,"order":1}]
  AC_note                            TEXT,
  AC_recent_progress                 TEXT,
  AC_current_blockers                TEXT,
  AC_date_completed                  TIMESTAMPTZ,

  -- Audit
  AC_active        BOOLEAN,
  AC_created       TIMESTAMPTZ,   -- Date the entity was first created — copied forward on every version
  AC_created_by    INTEGER REFERENCES tbl_User(US_ID),
  AC_modified      TIMESTAMPTZ,   -- Date this specific version was created
  AC_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE INDEX idx_action_original_id  ON tbl_Action(AC_original_ID);
CREATE INDEX idx_action_active       ON tbl_Action(AC_active);


CREATE TABLE tbl_Action_Audience (
  AA_ID                       SERIAL PRIMARY KEY,
  AA_action_original_ID       VARCHAR,
  AA_stakeholder_original_ID  VARCHAR,

  -- Audit
  AA_active        BOOLEAN,
  AA_created       TIMESTAMPTZ,
  AA_created_by    INTEGER REFERENCES tbl_User(US_ID),
  AA_modified      TIMESTAMPTZ,
  AA_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Action_Owner (
  AO_ID                  SERIAL PRIMARY KEY,
  AO_action_original_ID  VARCHAR,
  AO_contact_ID          INTEGER REFERENCES tbl_Contact(CO_ID),

  -- Audit
  AO_active        BOOLEAN,
  AO_created       TIMESTAMPTZ,
  AO_created_by    INTEGER REFERENCES tbl_User(US_ID),
  AO_modified      TIMESTAMPTZ,
  AO_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Action_Predecessor (
  AP_ID                      SERIAL PRIMARY KEY,
  AP_action_original_ID      VARCHAR,       -- The action
  AP_predecessor_original_ID VARCHAR,       -- The predecessor action

  -- Audit
  AP_active        BOOLEAN,
  AP_created       TIMESTAMPTZ,
  AP_created_by    INTEGER REFERENCES tbl_User(US_ID),
  AP_modified      TIMESTAMPTZ,
  AP_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Action_Asset (
  AAS_ID                  SERIAL PRIMARY KEY,
  AAS_action_original_ID  VARCHAR,
  AAS_asset_ID            INTEGER REFERENCES tbl_Asset(AS_ID),
  AAS_is_outcome          BOOLEAN,       -- true = this asset defines the success/outcome criteria

  -- Audit
  AAS_active       BOOLEAN,
  AAS_created      TIMESTAMPTZ,
  AAS_created_by   INTEGER REFERENCES tbl_User(US_ID),
  AAS_modified     TIMESTAMPTZ,
  AAS_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  INTERACTIONS (inline versioning)
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Interaction (
  IN_ID              SERIAL PRIMARY KEY,   -- Version-specific PK
  IN_original_ID     VARCHAR,              -- Entity UUID — groups all versions
  IN_title           VARCHAR,
  IN_date            TIMESTAMPTZ,
  IN_type            VARCHAR,              -- Phone, Email, In-Person, Video, Other
  IN_purpose         VARCHAR,
  IN_description     TEXT,
  IN_outcome_score   INTEGER,              -- 1–5
  IN_outcome_notes   TEXT,
  IN_follow_up_date  TIMESTAMPTZ,

  -- Audit
  IN_active        BOOLEAN,
  IN_created       TIMESTAMPTZ,   -- Date the entity was first created — copied forward on every version
  IN_created_by    INTEGER REFERENCES tbl_User(US_ID),
  IN_modified      TIMESTAMPTZ,   -- Date this specific version was created
  IN_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE INDEX idx_interaction_original_id  ON tbl_Interaction(IN_original_ID);
CREATE INDEX idx_interaction_active       ON tbl_Interaction(IN_active);


CREATE TABLE tbl_Interaction_Attendee (
  IA_ID                       SERIAL PRIMARY KEY,
  IA_interaction_original_ID  VARCHAR,
  IA_contact_ID               INTEGER REFERENCES tbl_Contact(CO_ID),

  -- Audit
  IA_active        BOOLEAN,
  IA_created       TIMESTAMPTZ,
  IA_created_by    INTEGER REFERENCES tbl_User(US_ID),
  IA_modified      TIMESTAMPTZ,
  IA_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Interaction_Agenda_Item (
  IAI_ID                       SERIAL PRIMARY KEY,
  IAI_interaction_original_ID  VARCHAR,
  IAI_type                     VARCHAR,       -- discuss, edit, add, link
  IAI_linked_action_original_ID VARCHAR,      -- Linked action if applicable
  IAI_linked_objective_ID      INTEGER REFERENCES tbl_Strategy_Objective(SO_ID),
  IAI_details                  TEXT,
  IAI_order                    INTEGER,

  -- Audit
  IAI_active       BOOLEAN,
  IAI_created      TIMESTAMPTZ,
  IAI_created_by   INTEGER REFERENCES tbl_User(US_ID),
  IAI_modified     TIMESTAMPTZ,
  IAI_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  RISK / ISSUES
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Risk (
  RI_ID              SERIAL PRIMARY KEY,
  RI_type            VARCHAR,       -- stakeholder_friction, action_blocker, general
  RI_stakeholder_ID  INTEGER,
  RI_description     TEXT,
  RI_severity        INTEGER,       -- 1–5
  RI_status          VARCHAR,       -- open, mitigated, resolved
  RI_resolved_date   TIMESTAMPTZ,

  -- Audit
  RI_active        BOOLEAN,
  RI_created       TIMESTAMPTZ,
  RI_created_by    INTEGER REFERENCES tbl_User(US_ID),
  RI_modified      TIMESTAMPTZ,
  RI_modified_by   INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  CONTENT CARD ↔ ENTITY JUNCTION TABLES
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_Content_Card_Actions (
  CCA_ID                  SERIAL PRIMARY KEY,
  CCA_content_card_ID     INTEGER REFERENCES tbl_Content_Card(CC_ID),
  CCA_action_original_ID  VARCHAR,

  -- Audit
  CCA_active       BOOLEAN,
  CCA_created      TIMESTAMPTZ,
  CCA_created_by   INTEGER REFERENCES tbl_User(US_ID),
  CCA_modified     TIMESTAMPTZ,
  CCA_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Content_Card_Interactions (
  CCI_ID                       SERIAL PRIMARY KEY,
  CCI_content_card_ID          INTEGER REFERENCES tbl_Content_Card(CC_ID),
  CCI_interaction_original_ID  VARCHAR,

  -- Audit
  CCI_active       BOOLEAN,
  CCI_created      TIMESTAMPTZ,
  CCI_created_by   INTEGER REFERENCES tbl_User(US_ID),
  CCI_modified     TIMESTAMPTZ,
  CCI_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);

CREATE TABLE tbl_Content_Card_Stakeholders (
  CCS_ID                       SERIAL PRIMARY KEY,
  CCS_content_card_ID          INTEGER REFERENCES tbl_Content_Card(CC_ID),
  CCS_stakeholder_original_ID  VARCHAR,

  -- Audit
  CCS_active       BOOLEAN,
  CCS_created      TIMESTAMPTZ,
  CCS_created_by   INTEGER REFERENCES tbl_User(US_ID),
  CCS_modified     TIMESTAMPTZ,
  CCS_modified_by  INTEGER REFERENCES tbl_User(US_ID)
);


-- ─────────────────────────────────────────────────
--  COMMENTS (table-level documentation)
-- ─────────────────────────────────────────────────

COMMENT ON TABLE tbl_Contact              IS 'Unified contactable person — all identity data lives here';
COMMENT ON TABLE tbl_Contact_Relationship IS 'Relationships between contacts: reports_to, works_with, tension, ally';
COMMENT ON TABLE tbl_User                 IS 'Auth/security only — identity data lives on tbl_Contact';
COMMENT ON TABLE tbl_Team                 IS 'Named team groupings';
COMMENT ON TABLE tbl_Team_User            IS 'Team membership with role-based permissions';
COMMENT ON TABLE tbl_Page_Access          IS 'Per-user, per-page permissions (parent gate)';
COMMENT ON TABLE tbl_Privacy_Rule         IS 'Entity-level privacy rules (child gate) — polymorphic target';
COMMENT ON TABLE tbl_Asset                IS 'Uploaded assets / files';
COMMENT ON TABLE tbl_Strategy_Objective   IS 'Strategic objectives that Actions can reference';
COMMENT ON TABLE tbl_Objective_Content_Card IS 'Junction: Objective ↔ Content Card';
COMMENT ON TABLE tbl_Stakeholder          IS 'Inline-versioned stakeholders — _original_ID groups versions, _active marks live';
COMMENT ON TABLE tbl_Stakeholder_Contact  IS 'Junction: Stakeholder entity ↔ Contact (references _original_ID)';
COMMENT ON TABLE tbl_Action               IS 'Inline-versioned actions — _original_ID groups versions, _active marks live';
COMMENT ON TABLE tbl_Action_Audience      IS 'Junction: Action ↔ Stakeholder audience (references _original_IDs)';
COMMENT ON TABLE tbl_Action_Owner         IS 'Junction: Action ↔ Contact owners (references _original_ID)';
COMMENT ON TABLE tbl_Action_Predecessor   IS 'Junction: Action ↔ predecessor Actions (references _original_IDs)';
COMMENT ON TABLE tbl_Action_Asset         IS 'Junction: Action ↔ Asset — AAS_is_outcome marks success-criteria assets';
COMMENT ON TABLE tbl_Interaction          IS 'Inline-versioned interactions — _original_ID groups versions, _active marks live';
COMMENT ON TABLE tbl_Interaction_Attendee IS 'Junction: Interaction ↔ Contact attendees (references _original_ID)';
COMMENT ON TABLE tbl_Interaction_Agenda_Item IS 'Agenda items for an interaction — can link to Actions and Objectives';
COMMENT ON TABLE tbl_Risk                 IS 'Formally tracked risks/issues with severity and resolution status';
COMMENT ON TABLE tbl_Content_Page         IS 'Lightweight page container — access controlled by tbl_Page_Access';
COMMENT ON TABLE tbl_Content_Card         IS 'Composable content cards — card, section, or link type';
COMMENT ON TABLE tbl_Content_Card_Actions IS 'Junction: Content Card ↔ Action (references _original_ID)';
COMMENT ON TABLE tbl_Content_Card_Interactions IS 'Junction: Content Card ↔ Interaction (references _original_ID)';
COMMENT ON TABLE tbl_Content_Card_Stakeholders IS 'Junction: Content Card ↔ Stakeholder (references _original_ID)';

-- ─────────────────────────────────────────────────
--  CORE TRUTHS
-- ─────────────────────────────────────────────────

CREATE TABLE tbl_core_truth (
  ct_id            SERIAL PRIMARY KEY,
  ct_type          VARCHAR,
  ct_domain        VARCHAR,
  ct_statement     TEXT,

  -- Audit
  ct_active        BOOLEAN DEFAULT TRUE,
  ct_created       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  ct_modified      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tbl_core_truth IS 'Project Core Truths: Constraints, Rules, and Learned Patterns used for AI generation';

