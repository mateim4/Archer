-- ============================================================================
-- ARCHER AI ENGINE SCHEMA
-- RAG, Vector Search, and AI Audit Logging
-- ============================================================================
-- Version: 1.0
-- Date: December 8, 2025
-- Description: AI-specific tables for RAG (Retrieval-Augmented Generation),
--              vector search, and AI audit logging for transparency
-- 
-- This file defines:
--   1. Document management for RAG ingestion
--   2. Chunk storage with vector embeddings
--   3. AI thought log for Chain of Thought transparency
--   4. Agent action tracking for autonomous operations
--   5. Knowledge Base articles (optional enhancement)
-- ============================================================================

-- ============================================================================
-- DOCUMENT SOURCE TRACKING
-- ============================================================================
-- Tracks source documents for RAG ingestion (uploads, Confluence, SharePoint, etc.)
-- ============================================================================

DEFINE TABLE document SCHEMAFULL;

-- Source information
DEFINE FIELD source ON TABLE document TYPE string;          -- "upload", "confluence", "sharepoint", etc.
DEFINE FIELD path ON TABLE document TYPE string;            -- Original file path or URL
DEFINE FIELD filename ON TABLE document TYPE string;        -- Original filename
DEFINE FIELD mime_type ON TABLE document TYPE string;       -- MIME type (text/plain, application/pdf, etc.)

-- Content tracking
DEFINE FIELD content_hash ON TABLE document TYPE string;    -- SHA-256 for change detection
DEFINE FIELD file_size ON TABLE document TYPE int;          -- Size in bytes
DEFINE FIELD last_indexed ON TABLE document TYPE datetime;  -- When last processed

-- Status and permissions
DEFINE FIELD status ON TABLE document TYPE string;          -- "pending", "indexed", "failed"
DEFINE FIELD permissions ON TABLE document TYPE array;      -- Access control list
DEFINE FIELD metadata ON TABLE document TYPE object;        -- Flexible metadata

-- Timestamps
DEFINE FIELD created_at ON TABLE document TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE document TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_document_hash ON TABLE document COLUMNS content_hash UNIQUE;
DEFINE INDEX idx_document_status ON TABLE document COLUMNS status;
DEFINE INDEX idx_document_source ON TABLE document COLUMNS source;

-- ============================================================================
-- DOCUMENT CHUNKS WITH VECTOR EMBEDDINGS
-- ============================================================================
-- Stores document chunks with vector embeddings for semantic search
-- Uses MTREE index for efficient vector similarity search
-- ============================================================================

DEFINE TABLE chunk SCHEMAFULL;

-- Parent document relationship
DEFINE FIELD document ON TABLE chunk TYPE record<document>; -- Parent document reference

-- Chunk content
DEFINE FIELD content ON TABLE chunk TYPE string;            -- Chunk text content
DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;    -- Vector embedding (1536 dimensions for OpenAI)

-- Position tracking
DEFINE FIELD chunk_index ON TABLE chunk TYPE int;           -- Order within document
DEFINE FIELD start_char ON TABLE chunk TYPE int;            -- Start position in original document
DEFINE FIELD end_char ON TABLE chunk TYPE int;              -- End position in original document
DEFINE FIELD token_count ON TABLE chunk TYPE int;           -- Approximate token count

-- Timestamp
DEFINE FIELD created_at ON TABLE chunk TYPE datetime DEFAULT time::now();

-- Vector index for semantic search (MTREE with 1536 dimensions for OpenAI embeddings)
DEFINE INDEX idx_chunk_embedding ON TABLE chunk COLUMNS embedding MTREE DIMENSION 1536;

-- Regular indexes
DEFINE INDEX idx_chunk_document ON TABLE chunk COLUMNS document;

-- ============================================================================
-- AI THOUGHT LOG
-- ============================================================================
-- Stores Chain of Thought for transparency and debugging
-- Provides full auditability of AI reasoning and decision-making
-- ============================================================================

DEFINE TABLE ai_thought_log SCHEMAFULL;

-- Session and agent identification
DEFINE FIELD session_id ON TABLE ai_thought_log TYPE string;       -- Conversation session ID
DEFINE FIELD agent ON TABLE ai_thought_log TYPE string;            -- "librarian", "ticket_assistant", etc.
DEFINE FIELD user ON TABLE ai_thought_log TYPE option<record<user>>; -- User who triggered (optional)

-- Input/Output
DEFINE FIELD input ON TABLE ai_thought_log TYPE string;            -- User input/query
DEFINE FIELD chain_of_thought ON TABLE ai_thought_log TYPE string; -- Reasoning steps (transparent)
DEFINE FIELD output ON TABLE ai_thought_log TYPE string;           -- Final response

-- Model information
DEFINE FIELD model ON TABLE ai_thought_log TYPE string;            -- Model used (e.g., "gpt-4", "llama-3")

-- Performance metrics
DEFINE FIELD tokens_input ON TABLE ai_thought_log TYPE int;        -- Input tokens
DEFINE FIELD tokens_output ON TABLE ai_thought_log TYPE int;       -- Output tokens
DEFINE FIELD latency_ms ON TABLE ai_thought_log TYPE int;          -- Response time in milliseconds

-- Context tracking
DEFINE FIELD context_chunks ON TABLE ai_thought_log TYPE array;    -- Chunk IDs used for RAG context

-- Feedback
DEFINE FIELD feedback ON TABLE ai_thought_log TYPE option<string>; -- "positive", "negative", null

-- Timestamp
DEFINE FIELD created_at ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_thought_session ON TABLE ai_thought_log COLUMNS session_id;
DEFINE INDEX idx_thought_agent ON TABLE ai_thought_log COLUMNS agent;
DEFINE INDEX idx_thought_user ON TABLE ai_thought_log COLUMNS user;
DEFINE INDEX idx_thought_created ON TABLE ai_thought_log COLUMNS created_at;

-- ============================================================================
-- AGENT ACTION TRACKING
-- ============================================================================
-- Tracks autonomous actions for audit and approval workflows
-- Enables human-in-the-loop control for risky operations
-- ============================================================================

DEFINE TABLE agent_action SCHEMAFULL;

-- Agent and action identification
DEFINE FIELD agent ON TABLE agent_action TYPE string;              -- "operations", "monitoring", etc.
DEFINE FIELD action_type ON TABLE agent_action TYPE string;        -- "restart_service", "clear_logs", etc.
DEFINE FIELD target ON TABLE agent_action TYPE string;             -- Target system/resource

-- Action configuration
DEFINE FIELD parameters ON TABLE agent_action TYPE object;         -- Action parameters

-- Risk assessment
DEFINE FIELD risk_score ON TABLE agent_action TYPE int;            -- 1-100 risk assessment
DEFINE FIELD risk_factors ON TABLE agent_action TYPE array;        -- Reasons for risk score

-- Status and approval workflow
DEFINE FIELD status ON TABLE agent_action TYPE string;             -- "pending", "approved", "rejected", "executed", "failed"
DEFINE FIELD requires_approval ON TABLE agent_action TYPE bool;    -- Needs human approval?
DEFINE FIELD approver ON TABLE agent_action TYPE option<record<user>>; -- Who approved
DEFINE FIELD approved_at ON TABLE agent_action TYPE option<datetime>;
DEFINE FIELD executed_at ON TABLE agent_action TYPE option<datetime>;

-- Results
DEFINE FIELD result ON TABLE agent_action TYPE option<string>;     -- Execution result
DEFINE FIELD error ON TABLE agent_action TYPE option<string>;      -- Error message if failed

-- ITSM integration
DEFINE FIELD related_ticket ON TABLE agent_action TYPE option<record<itsm_ticket>>; -- Related ticket

-- Timestamp
DEFINE FIELD created_at ON TABLE agent_action TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_action_status ON TABLE agent_action COLUMNS status;
DEFINE INDEX idx_action_agent ON TABLE agent_action COLUMNS agent;
DEFINE INDEX idx_action_risk ON TABLE agent_action COLUMNS risk_score;
DEFINE INDEX idx_action_created ON TABLE agent_action COLUMNS created_at;

-- ============================================================================
-- KNOWLEDGE BASE ARTICLES (Optional Enhancement)
-- ============================================================================
-- For structured KB articles separate from raw documents
-- Provides semantic search over curated knowledge base content
-- ============================================================================

DEFINE TABLE kb_article SCHEMAFULL;

-- Article content
DEFINE FIELD title ON TABLE kb_article TYPE string;
DEFINE FIELD content ON TABLE kb_article TYPE string;
DEFINE FIELD embedding ON TABLE kb_article TYPE array<float>;      -- For semantic search (1536 dimensions)

-- Classification
DEFINE FIELD category ON TABLE kb_article TYPE string;
DEFINE FIELD tags ON TABLE kb_article TYPE array;

-- Authorship
DEFINE FIELD author ON TABLE kb_article TYPE option<record<user>>;

-- Analytics
DEFINE FIELD views ON TABLE kb_article TYPE int DEFAULT 0;
DEFINE FIELD helpful_count ON TABLE kb_article TYPE int DEFAULT 0;

-- Status
DEFINE FIELD status ON TABLE kb_article TYPE string;               -- "draft", "published", "archived"

-- Timestamps
DEFINE FIELD created_at ON TABLE kb_article TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE kb_article TYPE datetime DEFAULT time::now();

-- Vector index for semantic search
DEFINE INDEX idx_kb_embedding ON TABLE kb_article COLUMNS embedding MTREE DIMENSION 1536;

-- Regular indexes
DEFINE INDEX idx_kb_category ON TABLE kb_article COLUMNS category;
DEFINE INDEX idx_kb_status ON TABLE kb_article COLUMNS status;

-- ============================================================================
-- END OF AI SCHEMA
-- ============================================================================
