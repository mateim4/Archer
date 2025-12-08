# Archer AI - Implementation Roadmap

**Status:** Draft
**Target:** MVP (Stage 2) -> Operations (Stage 3)

## 1. Directory Structure (Monorepo)

/archer-core (Rust)
/src
/api (Axum REST/gRPC)
/db (SurrealDB connector)
/agents (Orchestrator logic)
/archer-ai-engine (Python Sidecar)
/src
/ingestors (LlamaIndex wrappers)
/ocr (Tesseract/Vision bindings)
/models (Local LLM loaders - vLLM/Ollama)
/archer-frontend (React)
/components/ai (Chat, Inline Suggestions)

## 2. Phase 1: Core Foundation & RAG (Months 1-2)
**Goal:** Ingest docs, store vectors, basic Q&A.

1.  **SurrealDB Setup:**
    - Implement schemas from `04_Data_Model_SurrealDB.md`.
    - Enable vector capabilities in SurrealDB configuration.
2.  **Ingestion Pipeline (Rust):**
    - Build `crate::ingestion::watcher`: Monitors folders/webhooks.
    - Build `crate::ingestion::hasher`: Implements the Delta-Update logic.
3.  **Python Sidecar:**
    - Build simple Flask/FastAPI wrapper around `langchain` or `llama_index` to handle PDF/Docx parsing if Rust crates prove insufficient for complex layouts.
4.  **Librarian Logic:**
    - Implement the "Sensitivity Tagging" workflow.

## 3. Phase 2: The "Brain" & Stage 2 Integrations (Months 3-4)
**Goal:** Auto-complete and Context awareness.

1.  **LLM Gateway:**
    - Create the "Model Switcher" trait in Rust.
    - Implement adapters for: OpenAI API, Anthropic API, and Local (Ollama API).
2.  **Frontend Integration:**
    - Implement "Ghost Text" in React inputs (Shadow DOM) for suggestions.
    - Build the "Accept/Reject" UI pattern (Tab to accept).
3.  **Context Window Manager:**
    - Build logic to fetch `Last 5 Tickets` + `Relevant RAG Chunks` -> Inject into System Prompt.

## 4. Phase 3: Operations Agent & Security (Months 5-6)
**Goal:** Stage 3 functionality (Human-in-the-loop actions).

1.  **Secure Vault Integration:**
    - Integrate `hashicorp_vault` crate.
    - Ensure Agent never sees raw password, only handles Reference IDs.
2.  **The "Red Button" (Approval Workflow):
    - Build the Risk Assessment Calculator.
    - Create the "Approval Request" UI card.
3.  **SSH/WinRM Wrappers:**
    - Sandbox the execution environment. The Agent generates the script -> User reviews -> System executes (not the LLM directly).

## 5. Technology Choices
- **Backend:** Rust (Axum, Tokio, SurrealDB Client)
- **AI Sidecar:** Python 3.11 (FastAPI, Pydantic, LlamaIndex) or Rust (Candle) if feasible.
- **Queue:** Redis (for decoupling Ingestion jobs from User queries).
- **OCR:** Tesseract (Local) or Azure Vision (Cloud).
- **LLM Hosting (Local):** vLLM (best throughput) or Ollama (easiest deploy).