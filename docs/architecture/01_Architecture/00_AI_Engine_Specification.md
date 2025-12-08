# Archer AI Engine Specification Sheet

**Status:** Draft - Based on Perplexity Chat Log Synthesis
**Owner:** Archer Product/Architecture Team

---

## 1. Executive Summary: Archer's AI Vision

Archer's AI Engine is designed to be a transparent, controllable, and deeply integrated intelligence layer within the next-generation ITSM platform. It aims to unify ITSM, CMDB, and Monitoring, providing advanced automation, predictive insights, and proactive problem resolution. Prioritizing user trust and data sovereignty, the AI will offer flexible deployment (local/cloud) and strict adherence to regulatory standards.

---

## 2. Core Principles & Business Case

### 2.1 AI Principles
*   **Transparency:** Always explain AI reasoning (Chain of Thought visible to users).
*   **Controllability:** Easy override of AI suggestions/actions, configurable settings.
*   **Trust:** Start conservative, build trust through consistent performance and clear explanations.
*   **Inclusivity:** AI features are always included, not an expensive add-on.
*   **Data Sovereignty:** Support for local LLM hosting, air-gapped environments, and strict tenant data separation.

### 2.2 Business Case
*   **Cost Reduction:** Aim for 30-50% ticket deflection and faster resolution times, mirroring competitor success (e.g., Freshservice's 76% time reduction).
*   **Improved Efficiency:** Automate routine tasks, intelligent triage, and proactive issue resolution.
*   **Enhanced User Satisfaction:** Intuitive AI assistance and reduced manual effort.
*   **Competitive Differentiation:** Offer unified AI across ITSM, CMDB, Monitoring as a core platform feature.

---

## 3. Architecture Vision (High-Level)

The AI Engine will operate as a Python Microservice (sidecar or separate VM/container) alongside the core Rust Archer application. It will communicate via APIs (REST/gRPC) and interact with a pluggable LLM Backend and a Vector DB for Retrieval-Augmented Generation (RAG).

### 3.1 Components
*   **Archer ITSM (Rust Core):** The primary application housing Ticketing, CMDB, Monitoring, Projects, Knowledge modules.
*   **AI Plugin (Python Microservice):** Orchestrates AI logic, contains specialized AI Agents, LLM Router.
*   **LLM Backend (Pluggable):**
    *   **Option A (Local):** Ollama, vLLM, TGI for self-hosted models (e.g., Llama 3.2 3B, Llama 3.1 8B/70B).
    *   **Option B (API):** Integration with public providers like OpenRouter, OpenAI, Anthropic, Gemini.
    *   **Option C (Hybrid):** Local for sensitive data/tasks, API for complex/resource-intensive tasks.
*   **Vector DB (RAG for Docs):**
    *   **Primary:** SurrealDB (leveraging its native vector search capabilities for unified data storage).
    *   **Alternative:** Separate vector DBs like Qdrant, Weaviate, Milvus (if SurrealDB proves insufficient).

### 3.2 Data Model Principles (SurrealDB-centric)
*   **Graph Database:** Main app data stored in SurrealDB.
*   **AI Context:** Stored as graph relationships (tickets ↔ assets ↔ alerts ↔ docs).
*   **Vector Embeddings:** For RAG document search.
*   **Audit Log:** Every AI thought, decision, action immutably logged for transparency and auditing.
*   **Prompt Templates:** Versioned and customizable per feature/team.
*   **Risk Scores:** Calculated for each proposed action by autonomous agents.
*   **Tenant Isolation:** Multi-tenant support with strict data separation via SurrealDB namespaces.

---

## 4. AI Agents & Capabilities (Phased Roadmap)

Archer's AI Engine comprises specialized agents orchestrated by a central router.

### 4.1 Agent Roles & Core Responsibilities
1.  **Orchestrator (The Router):**
    *   **Role:** Front-door interface, determines user intent, routes tasks to appropriate sub-agents.
    *   **Capabilities:** Stateless, pure routing logic.
2.  **Librarian Agent (The "Archivist"):**
    *   **Role:** Manages the RAG system, knowledge lifecycle (ingestion, classification, permissions, freshness, retirement).
    *   **Access:** Read-only on source docs, write on SurrealDB.
    *   **Key Features:** Source connectors (push/pull), Delta-Update mechanism (compute-saving re-indexing), OCR/Visual data processing, granular access control ("Need-to-Know").
3.  **Ticket Assistant (The "Scribe"):**
    *   **Role:** Enhances ticketing workflows (Stage 2).
    *   **Access:** Ticket DB.
    *   **Key Features:** Intelligent triage (auto-classify), similar ticket detection, knowledge base suggestions, auto-completion of ticket fields.
4.  **Monitoring Analyst (The "Watchdog"):**
    *   **Role:** Correlates events, analyzes metrics.
    *   **Access:** Metric streams (Prometheus/Zabbix), RAG Topology docs.
    *   **Key Features:** Anomaly detection, automated Root Cause Analysis (RCA - topology-aware), predictive alerting.
5.  **Operations Agent (The "Engineer"):**
    *   **Role:** Performs Stage 3 autonomous infrastructure interaction.
    *   **Access:** Read/Write via CLI tools (SSH, PowerShell/WinRM, Cloud APIs, Kubernetes exec).
    *   **Key Features:** Secure infrastructure access (vaulted credentials, service accounts), pre-approved script execution, risk assessment for actions, human-in-the-loop for high-risk operations, rollback capabilities.

### 4.2 Phased AI Feature Rollout
*   **Phase 1 (Foundation):** Intelligent triage, similar ticket detection, anomaly detection (monitoring).
*   **Phase 2 (Advanced):** Automated RCA (topology-aware), conversational ticket creation, predictive alerting.
*   **Phase 3 (Autonomous):** Auto-remediation, intelligent automation.

---

## 5. Deployment & Scalability

### 5.1 Deployment Options
*   **Local LLM Hosting:** Control over data, air-gapped environments.
*   **Public API Providers:** Leverages external expertise, scales on demand.
*   **Hybrid:** Local for sensitive data, cloud for complex tasks.
*   **Standalone Instance:** AI engine as a separate VM/container, connected to the app.
*   **Plugin Integration:** Direct integration for capacity optimization.

### 5.2 Scaling & Sizing
*   **Small (10-50 users):** Single VM, CPU-only LLM (Llama 3.2 3B).
*   **Medium (50-500 users):** 2 VMs (app + AI), GPU recommended, mid-size LLM (Llama 3.1 8B).
*   **Large (500-5000 users):** Kubernetes, multiple AI replicas, large LLM (Llama 3.1 70B or API).
*   **Enterprise (5000+):** Multi-region, GPU cluster, mixed model usage.

### 5.3 Multi-Tenancy
*   **Isolation:** Strict tenant separation via SurrealDB Namespaces.
*   **Knowledge Sharing:** Configurable per-tenant, not allowed by default.

---

## 6. Security & Governance

### 6.1 Authentication & Infrastructure Access (Operations Agent)
*   **Authentication:** Encrypted vault (HashiCorp Vault preferred), user credential passthrough, service accounts with limited permissions (for read-only/Stage 3).
*   **Protocols/Tools:** SSH, PowerShell/WinRM, Cloud provider APIs (AWS, Azure, GCP, OCI), Kubernetes exec.
*   **Execution Boundaries:** Read-only, pre-approved scripts, user permission for any command (Gemini-CLI/GH Copilot style), different permission levels based on risk.

### 6.2 Risk Assessment Framework
*   **Risk Factors:** Impact scope (1 vs 100 servers), reversibility, business criticality (prod vs dev), cost, compliance.
*   **Risk Levels:** Low (auto-execute), Medium (execute with notification), High (require approval), Critical (block, always require approval).
*   **Approval Workflow:** Ticket assignee, team lead, specific "AI Approver" role, multi-person approval for critical actions (Change Management + Operations + TL for ITILv4 based teams).

### 6.3 Rollback Mechanisms (Stage 3 Autonomous Actions)
*   **Reversibility Check:** Agent must assess if an action is revertible.
*   **Backup/Snapshot Verification:** Agent checks for valid backups/snapshots before high-risk actions.
*   **User Interface:** "Undo last AI action," time-travel view, batch rollback.
*   **Detailed Logging:** Agent tracks its to-do tasks for step-by-step rollback selection.

### 6.4 Prompt Management & Customization
*   **Granularity:** System-wide prompts, per-feature/agent prompts, per-team/user prompts.
*   **Versioning:** Track changes, A/B testing, rollback to previous versions.
*   **Templates:** Provide presets for common scenarios (ITIL, DevOps).

### 6.5 Auditing & Observability
*   **Chain of Thought (CoT) Storage:** Raw LLM response including thinking steps, parsed structure (Thought > Actionable Conclusion).
*   **CoT Retention:** Configurable policy (default 90 days), auto-cleanup.
*   **UI Presentation:** Expandable accordion, separate AI Audit Log, inline annotations.
*   **Feedback Loops:** User feedback (thumbs up/down, verbatim comments) on all AI suggestions/interactions, triggering document review for RAG.
*   **Metrics:** AI suggestion acceptance rate, AI action success rate, response time, cost, token usage.
*   **Alerting:** On low acceptance rates, budget overruns, errors/failures.

---

## 7. RAG System Clarifications (Librarian Agent)

### 7.1 Document Source Integration
*   **Primary Sources:** Confluence, GitHub, SharePoint, OneDrive, Google Drive, local file servers, local uploads.
*   **Version Management:** Sources with proper version tracking are preferred.
*   **Sync Frequency:** Automatic scheduled (for non-change tracking), on-change (if audit/system detects), manual.
*   **Permissions:** Archer's own permission system (need-to-know basis), not solely relying on source system permissions.

### 7.2 Semantic Search & Indexing
*   **Librarian Agent's Role:** Initial assessment, indexing, chunking.
*   **Chunking:** Configurable size/overlap (industry standard defaults).
*   **Embedding Model:** Preference for open-source, self-hosted (e.g., Sentence-transformers). SurrealDB vector search as primary storage.
*   **Change Tracking:** Section-level granularity. Compute-efficient delta-updates, re-indexing only changed sections.

### 7.3 OCR for Images
*   **Trigger:** Configurable (e.g., if PDF contains < 5% text, assume scan).
*   **Technology:** Tesseract (default, self-hosted), pluggable Vision LLM (e.g., Llava) for diagram description.
*   **Scope:** Extract all text, retrieve information from charts/diagrams, transcribe into words for indexing and future reference.

### 7.4 Knowledge Freshness & Accuracy
*   **Chunk Metadata:** Attach creation timestamp and document version/last modified date.
*   **Feedback Loop:** User flagging incorrect RAG suggestions triggers document review; system suggests latest version.

---

## 8. Next Research / Documentation Priorities

Based on Perplexity's last interaction and the user's initial request:

1.  **Comprehensive documentation of the AI Engine Plugin/Self-contained VM or container appliance (`01_Comprehensive_Architecture.md`).**
2.  **Lower-level coding implementation plan/architecture for the AI engine (`../02_Implementation/00_Coding_Implementation_Guide.md`).**
3.  Continue populating the detailed competitive analysis, user sentiment, and feature mapping within the designated Linear issues (SQU-6 through SQU-11, if those are still the intended storage).
4.  Further research into Rust Crate selection for CLI wrappers or React Component specs for the AI feedback loop, as suggested by Perplexity.

This specification sheet serves as the foundational overview for all subsequent detailed documentation.
