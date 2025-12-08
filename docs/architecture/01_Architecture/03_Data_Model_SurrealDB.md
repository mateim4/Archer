# Archer Data Model - SurrealDB Schemas

**Status:** Draft
**Database:** SurrealDB
**Context:** Core App + AI Engine

## 1. Tenancy Setup
Every query is scoped to a namespace.

DEFINE NAMESPACE tenant_acme;
USE NAMESPACE tenant_acme;
DEFINE DATABASE archer_core;

## 2. RAG & Knowledge Graph

### 2.1 Document Metadata
Stores the "File" concept.

DEFINE TABLE document SCHEMAFULL;

DEFINE FIELD title ON TABLE document TYPE string;
DEFINE FIELD source_type ON TABLE document TYPE string; -- 'confluence', 'pdf_upload', 'sharepoint'
DEFINE FIELD source_url ON TABLE document TYPE string;
DEFINE FIELD version_hash ON TABLE document TYPE string; -- File level hash
DEFINE FIELD last_synced ON TABLE document TYPE datetime;
DEFINE FIELD sensitivity_level ON TABLE document TYPE int; -- 1=Public, 5=Top Secret
DEFINE FIELD status ON TABLE document TYPE string; -- 'indexed', 'processing', 'error', 'deprecated'

-- Graph Edges
DEFINE TABLE has_chunk SCHEMAFULL TYPE RELATION;
DEFINE TABLE accessible_by SCHEMAFULL TYPE RELATION;

### 2.2 Vector Chunks
Stores the "Content" and Embeddings.

DEFINE TABLE chunk SCHEMAFULL;

DEFINE FIELD content ON TABLE chunk TYPE string;
DEFINE FIELD embedding ON TABLE chunk TYPE array<float>; -- Dimension depends on model (e.g., 384 or 1536)
DEFINE FIELD token_count ON TABLE chunk TYPE int;
DEFINE FIELD page_number ON TABLE chunk TYPE int;
DEFINE FIELD section_hash ON TABLE chunk TYPE string; -- For delta updates

-- Vector Index (HNSW for speed)
DEFINE INDEX idx_embedding ON TABLE chunk COLUMNS embedding TYPE M-TREE DIMENSION 384 DIST COSINE;

## 3. AI Audit & Context

### 3.1 Chain of Thought (CoT)
Immutable log of AI reasoning.

DEFINE TABLE ai_thought_log SCHEMAFULL;

DEFINE FIELD trace_id ON TABLE ai_thought_log TYPE string; -- Links a whole conversation/action chain
DEFINE FIELD agent_role ON TABLE ai_thought_log TYPE string;
DEFINE FIELD timestamp ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();
DEFINE FIELD input_context ON TABLE ai_thought_log TYPE string;
DEFINE FIELD raw_thought ON TABLE ai_thought_log TYPE string; -- The "Hidden" reasoning
DEFINE FIELD final_decision ON TABLE ai_thought_log TYPE string;
DEFINE FIELD risk_score ON TABLE ai_thought_log TYPE float;
DEFINE FIELD user_feedback ON TABLE ai_thought_log TYPE string; -- 'thumbs_up', 'thumbs_down'

### 3.2 Operations "Action" Log
For Stage 3 Autonomous Actions.

DEFINE TABLE agent_action SCHEMAFULL;

DEFINE FIELD intent ON TABLE agent_action TYPE string; -- "Restart VM-01"
DEFINE FIELD target_asset ON TABLE agent_action TYPE record<asset>;
DEFINE FIELD command_executed ON TABLE agent_action TYPE string;
DEFINE FIELD approval_status ON TABLE agent_action TYPE string; -- 'auto_approved', 'human_approved', 'rejected'
DEFINE FIELD rollback_possible ON TABLE agent_action TYPE bool;
DEFINE FIELD output_log ON TABLE agent_action TYPE string;

## 4. Permissions (RBAC for Agents)

-- Define an Agent Role
DEFINE TABLE agent_role SCHEMAFULL;
DEFINE FIELD name ON TABLE agent_role TYPE string; -- 'ops_agent', 'support_agent'

-- Define Access
RELATE agent_role:ops_agent->accessible_by->document:network_diagram_01;

## 5. Asset & Inventory (simplified)

DEFINE TABLE asset SCHEMAFULL;
DEFINE FIELD hostname ON TABLE asset TYPE string;
DEFINE FIELD ip_address ON TABLE asset TYPE string;
DEFINE FIELD os_type ON TABLE asset TYPE string;
DEFINE FIELD criticality ON TABLE asset TYPE string; -- Used for Risk Assessment