-- ═══════════════════════════════════════════════════
--  AET PROJECT — STAKEHOLDER AUDIENCE MESSAGE MIGRATION
--  Rename sta_audience_message_card_id (FK → content card)
--  to sta_audience_message (TEXT — direct message storage)
--
--  Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Drop the foreign key constraint
ALTER TABLE tbl_stakeholder
  DROP CONSTRAINT IF EXISTS tbl_stakeholder_sta_audience_message_card_id_fkey;

-- 2. Rename the column
ALTER TABLE tbl_stakeholder
  RENAME COLUMN sta_audience_message_card_id TO sta_audience_message;

-- 3. Change type from integer to text
ALTER TABLE tbl_stakeholder
  ALTER COLUMN sta_audience_message TYPE text USING sta_audience_message::text;

-- 4. Set CoGB's audience-specific message (sta_original_id = 'sta-001')
--    Text pulled from the existing content card (cc_stakeholder_original_id = 'sta-001')
UPDATE tbl_stakeholder
SET sta_audience_message = 'The Advanced Resource Recovery Centre (ARRC) delivers long-term stability and value for the region - keeping jobs, skills and investment local, while reducing landfill and future cost pressures.'
WHERE sta_original_id = 'sta-001' AND sta_active = true;
