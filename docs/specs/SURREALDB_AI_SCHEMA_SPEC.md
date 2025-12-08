# SurrealDB AI Schema Specification

**Status:** Ready for Implementation  
**Phase:** 1 - Foundation  
**Priority:** High  

## Overview

Extend the existing SurrealDB schema with AI-specific tables for RAG (Retrieval-Augmented Generation), vector search, and AI audit logging.

## Schema Location

Create new schema file: `backend/schemas/ai_schema.surql`

## Tables

### 1. Document Table

Tracks source documents for RAG ingestion.

```sql
-- Document source tracking
DEFINE TABLE document SCHEMAFULL;
DEFINE FIELD source ON TABLE document TYPE string;          -- "upload", "confluence", "sharepoint", etc.
DEFINE FIELD path ON TABLE document TYPE string;            -- Original file path or URL
DEFINE FIELD filename ON TABLE document TYPE string;        -- Original filename
DEFINE FIELD mime_type ON TABLE document TYPE string;       -- MIME type
DEFINE FIELD content_hash ON TABLE document TYPE string;    -- SHA-256 for change detection
DEFINE FIELD file_size ON TABLE document TYPE int;          -- Size in bytes
DEFINE FIELD last_indexed ON TABLE document TYPE datetime;  -- When last processed
DEFINE FIELD status ON TABLE document TYPE string;          -- "pending", "indexed", "failed"
DEFINE FIELD permissions ON TABLE document TYPE array;      -- Access control list
DEFINE FIELD metadata ON TABLE document TYPE object;        -- Flexible metadata
DEFINE FIELD created_at ON TABLE document TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE document TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_document_hash ON TABLE document COLUMNS content_hash UNIQUE;
DEFINE INDEX idx_document_status ON TABLE document COLUMNS status;
DEFINE INDEX idx_document_source ON TABLE document COLUMNS source;
```

### 2. Chunk Table

Stores document chunks with vector embeddings for semantic search.

```sql
-- Document chunks with embeddings
DEFINE TABLE chunk SCHEMAFULL;
DEFINE FIELD document ON TABLE chunk TYPE record<document>; -- Parent document
DEFINE FIELD content ON TABLE chunk TYPE string;            -- Chunk text content
DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;    -- Vector embedding (1536 dim for OpenAI)
DEFINE FIELD chunk_index ON TABLE chunk TYPE int;           -- Order within document
DEFINE FIELD start_char ON TABLE chunk TYPE int;            -- Start position in original
DEFINE FIELD end_char ON TABLE chunk TYPE int;              -- End position in original
DEFINE FIELD token_count ON TABLE chunk TYPE int;           -- Approximate token count
DEFINE FIELD created_at ON TABLE chunk TYPE datetime DEFAULT time::now();

-- Vector index for semantic search
DEFINE INDEX idx_chunk_embedding ON TABLE chunk COLUMNS embedding MTREE DIMENSION 1536;

-- Regular indexes
DEFINE INDEX idx_chunk_document ON TABLE chunk COLUMNS document;
```

### 3. AI Thought Log Table

Stores Chain of Thought for transparency and debugging.

```sql
-- AI thought log for transparency
DEFINE TABLE ai_thought_log SCHEMAFULL;
DEFINE FIELD session_id ON TABLE ai_thought_log TYPE string;       -- Conversation session
DEFINE FIELD agent ON TABLE ai_thought_log TYPE string;            -- "librarian", "ticket_assistant", etc.
DEFINE FIELD user ON TABLE ai_thought_log TYPE option<record<user>>; -- User who triggered (optional)
DEFINE FIELD input ON TABLE ai_thought_log TYPE string;            -- User input/query
DEFINE FIELD chain_of_thought ON TABLE ai_thought_log TYPE string; -- Reasoning steps
DEFINE FIELD output ON TABLE ai_thought_log TYPE string;           -- Final response
DEFINE FIELD model ON TABLE ai_thought_log TYPE string;            -- Model used
DEFINE FIELD tokens_input ON TABLE ai_thought_log TYPE int;        -- Input tokens
DEFINE FIELD tokens_output ON TABLE ai_thought_log TYPE int;       -- Output tokens
DEFINE FIELD latency_ms ON TABLE ai_thought_log TYPE int;          -- Response time
DEFINE FIELD context_chunks ON TABLE ai_thought_log TYPE array;    -- Chunk IDs used
DEFINE FIELD feedback ON TABLE ai_thought_log TYPE option<string>; -- "positive", "negative"
DEFINE FIELD created_at ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_thought_session ON TABLE ai_thought_log COLUMNS session_id;
DEFINE INDEX idx_thought_agent ON TABLE ai_thought_log COLUMNS agent;
DEFINE INDEX idx_thought_user ON TABLE ai_thought_log COLUMNS user;
DEFINE INDEX idx_thought_created ON TABLE ai_thought_log COLUMNS created_at;
```

### 4. Agent Action Table

Tracks autonomous actions for audit and approval workflows.

```sql
-- Autonomous action tracking
DEFINE TABLE agent_action SCHEMAFULL;
DEFINE FIELD agent ON TABLE agent_action TYPE string;              -- "operations", "monitoring", etc.
DEFINE FIELD action_type ON TABLE agent_action TYPE string;        -- "restart_service", "clear_logs", etc.
DEFINE FIELD target ON TABLE agent_action TYPE string;             -- Target system/resource
DEFINE FIELD parameters ON TABLE agent_action TYPE object;         -- Action parameters
DEFINE FIELD risk_score ON TABLE agent_action TYPE int;            -- 1-100 risk assessment
DEFINE FIELD risk_factors ON TABLE agent_action TYPE array;        -- Reasons for risk score
DEFINE FIELD status ON TABLE agent_action TYPE string;             -- "pending", "approved", "rejected", "executed", "failed"
DEFINE FIELD requires_approval ON TABLE agent_action TYPE bool;    -- Needs human approval?
DEFINE FIELD approver ON TABLE agent_action TYPE option<record<user>>; -- Who approved
DEFINE FIELD approved_at ON TABLE agent_action TYPE option<datetime>;
DEFINE FIELD executed_at ON TABLE agent_action TYPE option<datetime>;
DEFINE FIELD result ON TABLE agent_action TYPE option<string>;     -- Execution result
DEFINE FIELD error ON TABLE agent_action TYPE option<string>;      -- Error message if failed
DEFINE FIELD related_ticket ON TABLE agent_action TYPE option<record<ticket>>; -- Related ticket
DEFINE FIELD created_at ON TABLE agent_action TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_action_status ON TABLE agent_action COLUMNS status;
DEFINE INDEX idx_action_agent ON TABLE agent_action COLUMNS agent;
DEFINE INDEX idx_action_risk ON TABLE agent_action COLUMNS risk_score;
DEFINE INDEX idx_action_created ON TABLE agent_action COLUMNS created_at;
```

### 5. Knowledge Base Article Table (Optional Enhancement)

For structured KB articles separate from raw documents.

```sql
-- Knowledge Base articles
DEFINE TABLE kb_article SCHEMAFULL;
DEFINE FIELD title ON TABLE kb_article TYPE string;
DEFINE FIELD content ON TABLE kb_article TYPE string;
DEFINE FIELD embedding ON TABLE kb_article TYPE array<float>;      -- For semantic search
DEFINE FIELD category ON TABLE kb_article TYPE string;
DEFINE FIELD tags ON TABLE kb_article TYPE array;
DEFINE FIELD author ON TABLE kb_article TYPE option<record<user>>;
DEFINE FIELD views ON TABLE kb_article TYPE int DEFAULT 0;
DEFINE FIELD helpful_count ON TABLE kb_article TYPE int DEFAULT 0;
DEFINE FIELD status ON TABLE kb_article TYPE string;               -- "draft", "published", "archived"
DEFINE FIELD created_at ON TABLE kb_article TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON TABLE kb_article TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_kb_embedding ON TABLE kb_article COLUMNS embedding MTREE DIMENSION 1536;
DEFINE INDEX idx_kb_category ON TABLE kb_article COLUMNS category;
DEFINE INDEX idx_kb_status ON TABLE kb_article COLUMNS status;
```

## Rust Backend Integration

### Schema Loader

Add to `backend/src/db/mod.rs`:
- Load `ai_schema.surql` on startup
- Add migration version tracking

### API Endpoints (Future)

```rust
// Document management
POST /api/documents      // Upload document for indexing
GET  /api/documents      // List documents
GET  /api/documents/:id  // Get document details

// Vector search (proxied to Python)
POST /api/search/semantic  // Semantic search

// AI logs (admin only)
GET /api/ai/logs         // List thought logs
GET /api/ai/actions      // List agent actions
```

## Acceptance Criteria

- [ ] Schema file created at `backend/schemas/ai_schema.surql`
- [ ] All tables define successfully in SurrealDB
- [ ] Vector index (MTREE) creates without errors
- [ ] Sample data can be inserted into all tables
- [ ] Vector search query returns results
- [ ] Schema is loaded automatically on backend startup
- [ ] Existing schemas remain unaffected

## Testing Commands

```bash
# Connect to SurrealDB
surreal sql --conn http://localhost:8000 --ns archer --db main

# Test vector search (after inserting data)
SELECT * FROM chunk WHERE embedding <|10|> $query_embedding;

# Verify tables exist
INFO FOR DB;
```

## Notes

- Vector dimension (1536) matches OpenAI embeddings - can be changed for other models
- MTREE index is recommended for SurrealDB vector search
- Foreign key relationships use `record<table>` syntax
- All timestamps use `datetime` with `time::now()` default
- Status fields use strings for flexibility (could be enums)
