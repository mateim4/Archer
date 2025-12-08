# Archer AI Engine: Comprehensive Architecture Documentation

**Status:** Draft - Based on Perplexity Chat Log Synthesis
**Owner:** Archer Architecture Team
**Related Documents:** [[00_AI_Engine_Specification.md]], [[02_RAG_Architecture.md]], [[03_Data_Model_SurrealDB.md]], [[04_AI_Agent_Specifications.md]], [[../02_Implementation/00_Coding_Implementation_Guide.md]]

---

## 1. Executive Summary: Unified AI Architecture

The Archer AI Engine is designed as a modular, agent-based system that integrates natively with the core Archer ITSM platform. Its architecture supports flexible deployment (sidecar, VM, container) and pluggable LLM backends (local or cloud). The core principle is a unified intelligence layer that drives automation, provides contextual insights, and ensures data sovereignty. SurrealDB's multi-model capabilities are central to managing the integrated data, including knowledge graphs, vector embeddings, and audit trails.

---

## 2. High-Level System Architecture

```mermaid
graph TD
    subgraph Archer ITSM Core (Rust App)
        A[Frontend: React/TS] --> B(API Gateway: Axum/Rust)
        B -- ITSM, CMDB, Monitoring Data --> C(SurrealDB: Core Data)
    end

    subgraph AI Engine (Python Microservice / VM / Container)
        D[LLM Router/Orchestrator] --> E1(Librarian Agent)
        D --> E2(Ticket Assistant)
        D --> E3(Monitoring Analyst)
        D --> E4(Operations Agent)
        E1 -- Ingestion --> F[Document Sources]
        E1 -- Embeddings, Metadata --> G(SurrealDB: Knowledge Graph/Vector DB)
        E2 -- Ticket Context --> C
        E3 -- Metrics, Alerts --> C
        E4 -- Infrastructure Access --> H[External Infrastructure: VMs, K8s, Cloud APIs]
        E4 -- Audit Log --> G
        G -- RAG Data --> E1
        G -- CoT, Prompts --> E2
        G -- CoT, Prompts --> E3
        G -- CoT, Prompts --> E4
        D -- LLM Calls --> I[LLM Backend: Local / API]
    end

    B -- AI API Calls --> D
    C -- AI Context, Data --> E2
    C -- AI Context, Data --> E3
    C -- AI Context, Data --> E4
    C -- Audit Log Storage --> G
```

### 2.1 Core Application (Archer ITSM)
*   **Frontend:** React + TypeScript + Vite, using Fluent UI 2 and the "Purple Glass" design system for a modern, fast user experience.
*   **Backend:** Rust (Axum framework) providing high-performance APIs (GraphQL/tRPC, WebSockets) for core ITSM, CMDB, and Monitoring functionalities.
*   **Database:** SurrealDB, acting as the primary data store for all core application data, leveraging its graph, document, and time-series capabilities.

### 2.2 AI Engine (Python Microservice)
This component is the brain of Archer's AI capabilities, designed for modularity and scalability. It can be deployed as a sidecar, dedicated VM, or container.

#### 2.2.1 LLM Router/Orchestrator
*   **Function:** Acts as the central entry point for AI requests from the Archer core. It determines user intent and routes the request to the most appropriate specialized AI Agent.
*   **Communication:** Interacts with Archer's core via REST/gRPC APIs and forwards requests to various LLM Backends.

#### 2.2.2 Specialized AI Agents
Five core agents drive Archer's intelligence, each with distinct roles and system prompts:

1.  **Librarian Agent (The "Archivist"):**
    *   **Role:** Manages the entire RAG knowledge lifecycle.
    *   **Key Views/Features:**
        *   **Ingestion Pipeline:** Handles various document sources (Confluence, GitHub, SharePoint, Google Drive, OneDrive, local files). Supports push-based (webhooks) and pull-based (crawlers) ingestion.
        *   **Delta-Update Mechanism:** Efficiently re-indexes only changed document sections using content hashing, saving compute resources.
        *   **OCR & Visual Data Processing:** Extracts text from images/diagrams using Tesseract (default) or pluggable Vision LLMs, embedding descriptions for semantic search.
        *   **Permissions Management:** Enforces "Need-to-Know" access control, mapping Archer Agent Roles to specific documents (managed via SurrealDB graph edges).
        *   **Knowledge Freshness:** Tracks document versions and last modification dates for chunk validity.
        *   **Feedback Loop:** Processes user feedback on RAG suggestions, initiating document review for outdated/incorrect information.
2.  **Ticket Assistant (The "Scribe"):**
    *   **Role:** Provides AI assistance within ticketing workflows (Phase 1/2 AI).
    *   **Key Views/Features:**
        *   **Intelligent Triage:** Auto-classification of tickets based on natural language input.
        *   **Similar Ticket Detection:** Suggests similar past tickets and their resolutions.
        *   **Knowledge Base Suggestions:** Provides relevant KB articles based on ticket context.
        *   **Auto-completion:** Suggests technical details for ticket description fields.
        *   **Conversational Ticket Creation:** Guides users through ticket creation via natural language (Phase 2).
3.  **Monitoring Analyst (The "Watchdog"):**
    *   **Role:** Focuses on event correlation and anomaly detection.
    *   **Key Views/Features:**
        *   **Anomaly Detection:** Identifies unusual patterns in monitoring metrics.
        *   **Automated Root Cause Analysis (RCA):** Correlates alerts with CMDB topology, recent changes, and other events to suggest root causes.
        *   **Predictive Alerting:** Forecasts potential issues before they impact services (Phase 2).
        *   **Alert to Ticket Automation:** Automatically generates tickets from monitoring alerts with rich context.
4.  **Operations Agent (The "Engineer"):**
    *   **Role:** Performs Stage 3 autonomous or human-in-the-loop actions on infrastructure.
    *   **Key Views/Features:**
        *   **Secure Infrastructure Access:** Manages authentication to external systems (VMs, K8s, Cloud APIs) via encrypted vaults, service accounts, or user credential passthrough.
        *   **Command Execution Interface:** Executes pre-approved scripts or user-confirmed commands (SSH, PowerShell/WinRM, Cloud CLIs, Kubectl).
        *   **Risk Assessment Framework:** Calculates a risk score for each proposed action based on impact, reversibility, criticality, etc.
        *   **Approval Workflow:** Triggers human approval for high-risk actions.
        *   **Rollback Capabilities:** Tracks actions and enables "undo" functionality where applicable.
        *   **Auditing & Logging:** Comprehensive immutable log of all actions and AI reasoning.
5.  **Correlation Engine (Implicit):**
    *   **Role:** Analyzes relationships across tickets, assets, alerts, and documents to find patterns and establish context. This is more of an underlying capability leveraging SurrealDB's graph features rather than a standalone agent view.

#### 2.2.3 LLM Backend
*   **Pluggable Architecture:** Allows users to select between local, API-based, or hybrid LLM solutions.
*   **Local Models:** Ollama, vLLM, TGI for self-hosted open-source models (e.g., Llama, Mistral).
*   **API Models:** Integrates with commercial providers (OpenAI, Anthropic, Gemini, OpenRouter).
*   **Air-gapped Support:** Design supports disconnected environments for high data sovereignty.

#### 2.2.4 Vector Database
*   **Primary Store:** SurrealDB, leveraging its native vector search capabilities for efficient storage and retrieval of document embeddings (for RAG).
*   **Data Model:** Defined in `03_Data_Model_SurrealDB.md`, establishing schemas for `document` metadata, `chunk` data (with embeddings and section hashes), `ai_thought_log`, `agent_action`, and RBAC.

### 2.3 User Interface (Frontend Integration)
*   **Inline AI Suggestions:** "Ghost text" or context-aware suggestions within input fields (e.g., ticket description).
*   **Accept/Reject UI:** Clear mechanisms for users to accept, reject, or provide feedback on AI suggestions (e.g., "Tab to accept," thumbs up/down).
*   **AI Audit Log/Transparency:** Expandable accordion elements in relevant UI sections (e.g., tickets, alerts) to display AI's Chain of Thought. Dedicated AI Audit Log page.
*   **Admin Panel:** Centralized configuration for LLM choice, prompt management, security settings, deployment options, RAG source integration, and data retention policies.
*   **Approval Cards:** UI cards for human review and approval of high-risk AI actions.

---

## 3. Deployment Models

The AI Engine is designed to support a range of deployment models, accommodating different customer sizes, resource availability, and data sovereignty requirements.

### 3.1 Plugin/Sidecar Deployment
*   **Description:** The AI Engine runs as a Python microservice alongside the Archer core application, potentially sharing a host or running in a co-located container.
*   **Benefit:** Simpler deployment for smaller instances, reduced overhead for inter-service communication.

### 3.2 Self-Contained VM or Container Appliance
*   **Description:** The AI Engine is packaged as a dedicated VM or container appliance, offering stronger isolation.
*   **Benefit:** Enhanced security, easier resource allocation (especially for GPU-backed LLMs), ideal for air-gapped or regulated environments.

### 3.3 Scalability Tiers
*   **Small (10-50 users):** Single VM, CPU-only LLM (e.g., Llama 3.2 3B).
*   **Medium (50-500 users):** 2 VMs (one for Archer core, one for AI Engine), GPU recommended, mid-size LLM (e.g., Llama 3.1 8B).
*   **Large (500-5000 users):** Kubernetes-orchestrated, multiple AI replicas, large LLM (e.g., Llama 3.1 70B or API-based).
*   **Enterprise (5000+):** Multi-region, dedicated GPU clusters, hybrid LLM strategy.

---

## 4. Key Architectural Considerations

### 4.1 Multi-Tenancy
*   **Isolation:** Achieved through SurrealDB Namespaces, providing strict physical and logical separation of tenant data, including knowledge bases and AI context.
*   **Configurability:** Admins can configure agent access to knowledge across tenants.

### 4.2 Security & Compliance
*   **Zero Trust Principles:** Granular access control for agents.
*   **Auditability:** Immutable Chain of Thought and Action Logs.
*   **Data Sovereignty:** Local LLM options.
*   **Risk Mitigation:** Human-in-the-loop, rollback mechanisms, stringent authentication for infrastructure access.
*   **Compliance:** Designed with GDPR, SOC2, ISO 27001 requirements in mind.

### 4.3 Performance & Efficiency
*   **Rust Backend:** High-performance core application.
*   **Delta-Updates (RAG):** Reduces re-indexing overhead.
*   **Asynchronous Processing:** Non-blocking operations for AI tasks.
*   **Optimized LLM Hosting:** vLLM for high throughput with local LLMs.
*   **Compute-Saving Mechanisms:** Designed to minimize unnecessary processing, especially for RAG.

### 4.4 Extensibility & Future-Proofing
*   **Plausible LLM Backend:** Easily swap out LLMs or integrate new providers.
*   **Agent-Based Modularity:** New AI agents can be added without overhauling the core system.
*   **Configurable Prompts:** Allows for dynamic adjustment of AI behavior.
*   **API-First Design:** Facilitates integration with third-party tools and services.

---

## 5. View/Feature Overview

This section maps the architectural components to the user-facing features and administrative views.

### 5.1 End-User Features (Contextual AI Assistance)
*   **Ticket Creation/Update:**
    *   Inline AI suggestions for description fields (Ticket Assistant).
    *   Auto-classification (priority, category, team) (Ticket Assistant).
    *   Similar ticket and KB article suggestions (Ticket Assistant, Librarian Agent).
    *   Conversational interface for ticket creation (Ticket Assistant - Phase 2).
*   **Incident Management:**
    *   Anomaly detection insights on dashboards (Monitoring Analyst).
    *   Automated RCA displayed within incident tickets (Monitoring Analyst).
    *   Proactive alerts before service impact (Monitoring Analyst - Phase 2).
    *   Suggested auto-remediation actions with risk assessment (Operations Agent - Phase 3).
*   **Knowledge Base Interaction:**
    *   Semantic search across documents (Librarian Agent).
    *   Natural language querying of internal docs (Librarian Agent).
    *   Contextual knowledge surfacing based on current task (Librarian Agent).
*   **Infrastructure Troubleshooting:**
    *   Natural language interface for troubleshooting (Orchestrator -> Operations Agent).
    *   AI-suggested commands/scripts with execution boundaries (Operations Agent).
    *   Real-time feedback on command execution and verification (Operations Agent).

### 5.2 Administrative & Developer Views
*   **AI Configuration Panel:**
    *   LLM Backend Selection: Choose local, API, or hybrid.
    *   Prompt Management: View, edit, version, A/B test system/agent prompts.
    *   Deployment Settings: Configure AI Engine as plugin/VM/container.
    *   Resource Allocation: GPU settings, model sizing.
    *   Data Retention Policies: For CoT and audit logs.
*   **RAG Management:**
    *   Source Integration: Connectors for Confluence, GitHub, etc.
    *   Document Management: Manual upload, re-index triggers, version tracking.
    *   Permissions Matrix: Configure agent "Need-to-Know" access to documents.
    *   Feedback Queue: Review user-flagged RAG responses.
*   **AI Audit & Observability Dashboard:**
    *   AI Action Log: Immutable record of all agent actions, risk scores, approval status.
    *   Chain of Thought Viewer: Detailed AI reasoning for specific interactions.
    *   Performance Metrics: AI suggestion acceptance rate, action success rate, response time, cost, token usage.
    *   Alerting: Configure alerts for AI performance deviations or cost overruns.
*   **Risk Assessment Rules Engine:**
    *   Define custom risk factors and thresholds.
    *   Configure approval workflows for high-risk actions.
*   **Tenant Management (for Service Providers):**
    *   Configure tenant-specific AI settings and knowledge separation.

---

## 6. Conclusion

The Archer AI Engine is architected to be a powerful, flexible, and secure intelligence layer that differentiates Archer in the ITSM market. By focusing on modularity, data sovereignty, and user trust, it provides a robust foundation for current and future AI-driven capabilities, ensuring scalability from small to enterprise environments.
