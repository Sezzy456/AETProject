-- Enable pgvector extension for semantic retrieval
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────
--  AI INGESTION (Phase 2): Embedding sidecar tables
-- ─────────────────────────────────────────────────

-- Sidecar table for Action embeddings
CREATE TABLE tbl_Action_Embedding (
  ACE_ID                  SERIAL PRIMARY KEY,
  ACE_action_original_ID  VARCHAR,
  ACE_embedding           vector(1536)
);

CREATE INDEX idx_action_embedding_original_id ON tbl_Action_Embedding(ACE_action_original_ID);

-- Sidecar table for Interaction embeddings
CREATE TABLE tbl_Interaction_Embedding (
  INE_ID                       SERIAL PRIMARY KEY,
  INE_interaction_original_ID  VARCHAR,
  INE_embedding                vector(1536)
);

CREATE INDEX idx_interaction_embedding_original_id ON tbl_Interaction_Embedding(INE_interaction_original_ID);

-- ─────────────────────────────────────────────────
--  TEAM STRATEGY COMPASS (Phase 2)
-- ─────────────────────────────────────────────────

-- Add persistent strategy context to Team table
ALTER TABLE tbl_Team ADD COLUMN TE_strategy_context TEXT;
