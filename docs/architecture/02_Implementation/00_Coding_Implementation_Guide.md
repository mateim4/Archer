# Archer AI Engine: Coding Implementation Guide

**Status:** Draft - Based on Perplexity Chat Log Synthesis & Low-Level Plan
**Owner:** Archer Development Team
**Related Documents:** [[../01_Architecture/00_AI_Engine_Specification.md]], [[../01_Architecture/01_Comprehensive_Architecture.md]], [[../01_Architecture/02_RAG_Architecture.md]], [[../01_Architecture/03_Data_Model_SurrealDB.md]], [[../01_Architecture/04_AI_Agent_Specifications.md]]

---

## 1. Executive Summary: Phased Development Approach

This guide outlines the lower-level coding implementation plan for the Archer AI Engine, adopting a phased development approach. The implementation prioritizes the core foundation and RAG system, followed by advanced AI integrations for context awareness, and finally, autonomous operations with robust security and human-in-the-loop mechanisms. The focus is on Rust for performance and Python for AI-specific tooling, all integrated with SurrealDB.

---

## 2. Technology Stack & Monorepo Structure

### 2.1 Core Technologies
*   **Backend (Archer Core & AI Orchestration):** Rust (Axum, Tokio, SurrealDB Client) for performance, safety, and asynchronous operations.
*   **AI Sidecar (Ingestion, OCR, LLM Interfaces):** Python 3.11 (FastAPI, Pydantic, LlamaIndex/Langchain) or potentially Rust-based solutions like Candle for direct LLM interaction if feasible and performant.
*   **Database:** SurrealDB (multi-model) for core application data, knowledge graph, and vector embeddings.
*   **Frontend:** React + TypeScript + Vite, utilizing Fluent UI 2 and "Purple Glass" design for UI components.
*   **Queue:** Redis (for decoupling ingestion jobs and managing asynchronous tasks).
*   **OCR:** Tesseract (local default) or cloud-based (e.g., Azure Vision) for visual data processing.
*   **LLM Hosting (Local):** vLLM (for high-throughput inference) or Ollama (for ease of deployment) as local LLM providers.

### 2.2 Monorepo Directory Structure (Conceptual)

```
/archer-monorepo/
├── archer-core/                         # Main Rust application
│   ├── src/
│   │   ├── api/                         # Axum REST/gRPC endpoints (e.g., for AI communication)
│   │   ├── db/                          # SurrealDB client and schema definitions (core app)
│   │   ├── agents/                      # Orchestrator logic within Rust (initial routing)
│   │   └── ... (other core modules)
│   ├── Cargo.toml
│   └── Cargo.lock
├── archer-ai-engine/                    # Python Microservice (AI sidecar)
│   ├── src/
│   │   ├── orchestrator/                # LLM Router/Orchestrator implementation (Python side)
│   │   ├── agents/                      # Implementations of Librarian, Ticket, Monitoring, Ops Agents
│   │   │   ├── librarian_agent.py
│   │   │   ├── ticket_assistant.py
│   │   │   ├── monitoring_analyst.py
│   │   │   └── operations_agent.py
│   │   ├── llm_gateway/                 # Model Switcher trait and adapters (OpenAI, Anthropic, Ollama, etc.)
│   │   ├── ingestion/                   # Document ingestion logic (source connectors, delta-update, OCR)
│   │   ├── security/                    # Vault integration, risk assessment logic
│   │   ├── context_manager/             # Logic for fetching context for agents
│   │   └── api/                         # FastAPI endpoints for communication with archer-core
│   ├── requirements.txt                 # Python dependencies
│   └── Dockerfile                       # For containerized deployment
├── archer-frontend/                     # React application
│   ├── src/
│   │   ├── components/ai/               # UI components for AI interaction (chat, suggestions, feedback)
│   │   ├── pages/                       # Views for admin panel, AI audit log
│   │   └── ... (other frontend modules)
│   ├── package.json
│   └── ...
├── docs/                                # Project-wide documentation
└── scripts/                             # Setup and utility scripts
```

---

## 3. Phase 1: Core Foundation & RAG (Months 1-2)

**Goal:** Establish SurrealDB, implement the RAG ingestion pipeline, and enable basic knowledge Q&A.

### 3.1 SurrealDB Setup
*   **Action:** Implement all SurrealDB schemas as defined in `../01_Architecture/03_Data_Model_SurrealDB.md`.
    *   Define `document`, `chunk`, `ai_thought_log`, `agent_action`, `agent_role`, `asset` tables with `SCHEMAFULL`.
    *   Enable vector capabilities in SurrealDB configuration (e.g., `DEFINE INDEX idx_embedding ON TABLE chunk COLUMNS embedding TYPE M-TREE ...`).
    *   Configure SurrealDB Namespaces for strict multi-tenancy isolation.
*   **Rust Client:** Utilize the `surrealdb.rs` client for all database interactions from the `archer-core`.

### 3.2 RAG Ingestion Pipeline (Librarian Agent - `archer-ai-engine/src/ingestion/`)
*   **Rust-based Watcher (`archer-core/src/ingestion/watcher.rs`):**
    *   Develop a Rust module for monitoring folder changes (`notify` crate) and processing incoming webhooks.
    *   Queue ingestion jobs to Redis (`redis` crate).
*   **Python Sidecar Ingestors (`archer-ai-engine/src/ingestion/`):**
    *   Implement source connectors (e.g., `confluence_connector.py`, `github_connector.py`, `local_filesystem_connector.py`).
    *   Use `requests` for API-based sources. For complex document parsing (PDFs, DOCX), wrap `unstructured.io` or `llama_index` document loaders.
    *   **Delta-Update Logic (`hasher.py`):**
        *   Calculate `SHA-256` hashes for document sections (after text extraction).
        *   Compare new hashes with stored `section_hash` in SurrealDB.
        *   If hash differs, trigger re-embedding and update. If same, update `last_seen_timestamp`.
*   **Embedding Generation:**
    *   Integrate a Rust/Python library for generating embeddings (e.g., `sentence-transformers` via Python, or a Rust equivalent).
    *   Store `embedding` (Float32 Array) in `chunk` table.
*   **OCR & Visual Data Processing (`archer-ai-engine/src/ocr/`):**
    *   Implement Tesseract integration (`pytesseract`) for text extraction from images.
    *   Develop a pluggable interface for advanced Vision LLMs to describe diagrams.
*   **Librarian Agent Logic (`archer-ai-engine/src/agents/librarian_agent.py`):**
    *   Implement document classification, sensitivity tagging logic, and entity extraction.
    *   Develop the access control mechanism for mapping `agent_role` to `document` records in SurrealDB.

---

## 4. Phase 2: The "Brain" & Stage 2 Integrations (Months 3-4)

**Goal:** Implement the LLM gateway, integrate AI suggestions into the frontend, and build context awareness for agents.

### 4.1 LLM Gateway (`archer-ai-engine/src/llm_gateway/`)
*   **Model Switcher Trait (Rust):** Define an interface in Rust (`archer-core`) for interacting with LLMs.
*   **Python Adapters:** Implement concrete adapters in Python for:
    *   OpenAI API (`openai` library)
    *   Anthropic API (`anthropic` library)
    *   Ollama API (`requests` to Ollama local server)
    *   Potentially Gemini API (`google-generativeai` library)
*   **Orchestrator Routing (`archer-ai-engine/src/orchestrator/orchestrator.py`):**
    *   Implement the LLM Router logic to determine which agent and LLM to use based on user intent.

### 4.2 Frontend Integration (React - `archer-frontend/src/components/ai/`)
*   **Inline Suggestions (Ghost Text):**
    *   Implement "ghost text" functionality in React input fields (e.g., using a controlled component and a hidden span).
    *   Integrate with the `Ticket Assistant` via API calls.
*   **Accept/Reject UI:**
    *   Develop UI patterns (e.g., Tab key to accept, click/button for reject).
    *   Implement feedback loop to store `user_feedback` in `ai_thought_log` (SurrealDB).
*   **Chat Interface:** A general chat interface for interacting with the Orchestrator.

### 4.3 Context Window Manager (`archer-ai-engine/src/context_manager/`)
*   **Logic:** Develop a module to dynamically fetch relevant context for agents.
    *   Retrieve `Last 5 Tickets` from SurrealDB (core data).
    *   Perform semantic search on RAG (SurrealDB vector index) for `Relevant RAG Chunks`.
    *   Construct the system prompt by injecting fetched context.
*   **Ticket Assistant Logic (`archer-ai-engine/src/agents/ticket_assistant.py`):**
    *   Implement logic for intelligent triage, similar ticket detection, and KB suggestions.
    *   Utilize `rag_search(query)` tool for KB suggestions.

---

## 5. Phase 3: Operations Agent & Security (Months 5-6)

**Goal:** Enable Stage 3 autonomous functionality with strong security, approval workflows, and auditing.

### 5.1 Secure Vault Integration (`archer-ai-engine/src/security/vault_integration.py`)
*   **HashiCorp Vault Integration:** Implement client for `hashicorp_vault` (Python library).
*   **Credential Management:** Ensure agents retrieve references to credentials, never expose raw passwords.

### 5.2 The "Red Button" (Approval Workflow & Risk Assessment)
*   **Risk Assessment Calculator (`archer-ai-engine/src/security/risk_assessment.py`):**
    *   Develop logic to compute a risk score (0-100) based on predefined factors (impact, reversibility, criticality of target asset from CMDB).
*   **Approval Request UI (React - `archer-frontend/src/components/ai/approval/`):**
    *   Create a UI component to display proposed high-risk actions, their risk scores, and require human approval.
    *   Integrate with `agent_action` table in SurrealDB for tracking.

### 5.3 Infrastructure Access & Sandboxing (`archer-ai-engine/src/agents/operations_agent.py`)
*   **SSH/WinRM Wrappers:**
    *   Implement secure wrappers for executing commands via SSH (`paramiko` Python library) and WinRM (`winrm` Python library).
    *   **Sandboxing:** Ensure commands are executed in a controlled, isolated environment.
    *   The agent *generates* the script/command; Archer *executes* it after human review/approval (not the LLM directly).
*   **Cloud API Integrations:** Implement interfaces for AWS Boto3, Azure SDK, GCP SDK.
*   **Operations Agent Logic:**
    *   Implement the protocol: Plan, Check RAG for SOPs, Assess Risk, Execute (via tools), Verify.
    *   Store all actions in `agent_action` table.

### 5.4 Auditing & Observability
*   **Chain of Thought (CoT) Logging (`archer-ai-engine/src/agents/`):**
    *   Agents will log `raw_thought` (raw LLM response) and `final_decision` to `ai_thought_log` (SurrealDB).
    *   Implement parsing of CoT into structured format (Thought > Actionable Conclusion).
*   **Audit UI (React):** Develop a dedicated AI Audit Log page and integrate CoT display into relevant UI components.
*   **Metrics & Alerts:** Instrument AI components to push metrics (acceptance rate, success rate, cost, latency) to a monitoring system (e.g., Prometheus) and configure alerts.

---

## 6. Development Best Practices

*   **TypeScript for Frontend, Rust for Core Backend:** Adhere to language best practices.
*   **Clean Component Architecture:** Modular, reusable components.
*   **JSDoc/Rust Doc:** Document public APIs thoroughly.
*   **Unit & Integration Tests:** Maintain high test coverage (Vitest, Playwright, Rust tests).
*   **Code Review:** Mandatory for all changes.
*   **Version Control:** Utilize Git, enforce PRs for all code merges.
*   **CI/CD:** Automate builds, tests, and deployments.
*   **Security by Design:** Embed security considerations at every stage.
*   **Performance Optimization:** Profile and optimize critical paths, especially for LLM interactions.
*   **Configuration Management:** Centralize all configurable settings (LLM choice, prompts, thresholds) for admin control.
