-- ═══════════════════════════════════════════════════
--  AET PROJECT — PERMISSIVE RLS POLICIES
--  Run this in Supabase SQL Editor AFTER the schema + seed data
--  Allows the publishable key full read/write access (prototype only)
-- ═══════════════════════════════════════════════════

-- Contacts
ALTER TABLE tbl_Contact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Contact FOR ALL USING (true) WITH CHECK (true);

-- Contact Relationships
ALTER TABLE tbl_Contact_Relationship ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Contact_Relationship FOR ALL USING (true) WITH CHECK (true);

-- Users
ALTER TABLE tbl_User ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_User FOR ALL USING (true) WITH CHECK (true);

-- Teams
ALTER TABLE tbl_Team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Team FOR ALL USING (true) WITH CHECK (true);

-- Team Users
ALTER TABLE tbl_Team_User ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Team_User FOR ALL USING (true) WITH CHECK (true);

-- Page Access
ALTER TABLE tbl_Page_Access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Page_Access FOR ALL USING (true) WITH CHECK (true);

-- Privacy Rules
ALTER TABLE tbl_Privacy_Rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Privacy_Rule FOR ALL USING (true) WITH CHECK (true);

-- Assets
ALTER TABLE tbl_Asset ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Asset FOR ALL USING (true) WITH CHECK (true);

-- Strategy Objectives
ALTER TABLE tbl_Strategy_Objective ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Strategy_Objective FOR ALL USING (true) WITH CHECK (true);

-- Objective Content Cards
ALTER TABLE tbl_Objective_Content_Card ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Objective_Content_Card FOR ALL USING (true) WITH CHECK (true);

-- Stakeholders
ALTER TABLE tbl_Stakeholder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Stakeholder FOR ALL USING (true) WITH CHECK (true);

-- Stakeholder Contacts
ALTER TABLE tbl_Stakeholder_Contact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Stakeholder_Contact FOR ALL USING (true) WITH CHECK (true);

-- Actions
ALTER TABLE tbl_Action ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Action FOR ALL USING (true) WITH CHECK (true);

-- Action Audiences
ALTER TABLE tbl_Action_Audience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Action_Audience FOR ALL USING (true) WITH CHECK (true);

-- Action Owners
ALTER TABLE tbl_Action_Owner ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Action_Owner FOR ALL USING (true) WITH CHECK (true);

-- Action Predecessors
ALTER TABLE tbl_Action_Predecessor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Action_Predecessor FOR ALL USING (true) WITH CHECK (true);

-- Action Assets
ALTER TABLE tbl_Action_Asset ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Action_Asset FOR ALL USING (true) WITH CHECK (true);

-- Interactions
ALTER TABLE tbl_Interaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Interaction FOR ALL USING (true) WITH CHECK (true);

-- Interaction Attendees
ALTER TABLE tbl_Interaction_Attendee ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Interaction_Attendee FOR ALL USING (true) WITH CHECK (true);

-- Interaction Agenda Items
ALTER TABLE tbl_Interaction_Agenda_Item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Interaction_Agenda_Item FOR ALL USING (true) WITH CHECK (true);

-- Risks
ALTER TABLE tbl_Risk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Risk FOR ALL USING (true) WITH CHECK (true);

-- Content Pages
ALTER TABLE tbl_Content_Page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Content_Page FOR ALL USING (true) WITH CHECK (true);

-- Content Cards
ALTER TABLE tbl_Content_Card ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Content_Card FOR ALL USING (true) WITH CHECK (true);

-- Content Card Actions
ALTER TABLE tbl_Content_Card_Actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Content_Card_Actions FOR ALL USING (true) WITH CHECK (true);

-- Content Card Interactions
ALTER TABLE tbl_Content_Card_Interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Content_Card_Interactions FOR ALL USING (true) WITH CHECK (true);

-- Content Card Stakeholders
ALTER TABLE tbl_Content_Card_Stakeholders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tbl_Content_Card_Stakeholders FOR ALL USING (true) WITH CHECK (true);
