# Archer Architecture Bridge Plan

**Status:** Active Planning Document  
**Created:** December 2025  
**Purpose:** Bridge current implementation to AI-enabled target architecture

---

## 1. Current State Assessment

### What Exists Today ✅

| Layer | Technology | Status |
|-------|------------|--------|
| **Frontend** | React 18 + TypeScript + Vite | Production-ready |
| **UI System** | Purple Glass + Fluent UI 2 | Production-ready (8 components) |
| **Backend** | Rust + Axum | Functional (tickets, projects, hardware) |
| **Database** | SurrealDB | Functional (relational mode) |
| **Desktop** | Tauri | Functional |

### Current Capabilities
- ✅ Project Portfolio Management (PPM)
- ✅ Activity-driven workflows with cluster strategies
- ✅ Ticket CRUD (Incidents, Problems, Changes, Service Requests)
- ✅ Hardware basket parsing (Dell, Lenovo)
- ✅ Dark/light mode with CSS variables
- ✅ Gantt chart timeline with drag-and-drop

### What's Missing for AI ❌

| Component | Current | Required |
|-----------|---------|----------|
| Python Runtime | None | FastAPI sidecar for AI logic |
| Vector Search | None | SurrealDB vector indexes |
| LLM Integration | None | Pluggable LLM gateway |
| RAG Pipeline | None | Document ingestion + embeddings |
| AI Agents | None | Orchestrator + 4 specialized agents |
| AI UI Components | None | Chat interface, ghost text, approvals |

---

## 2. Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Frontend + AI Components (Chat, Suggestions, Approvals)│
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     RUST CORE           │     │    PYTHON AI SIDECAR    │
│     (Port 3001)         │     │    (Port 8000)          │
├─────────────────────────┤     ├─────────────────────────┤
│ • Tickets API           │ ◄──►│ • Orchestrator          │
│ • Projects API          │     │ • Librarian Agent       │
│ • Hardware Baskets      │     │ • Ticket Assistant      │
│ • CMDB/Assets           │     │ • Monitoring Analyst    │
│ • Auth/Permissions      │     │ • Operations Agent      │
└─────────────────────────┘     │ • LLM Gateway           │
              │                 │ • Context Manager       │
              │                 └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SURREALDB                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Core Tables  │  │ Vector Index │  │ AI Audit Tables  │   │
│  │ (tickets,    │  │ (chunks,     │  │ (ai_thought_log, │   │
│  │  projects,   │  │  embeddings) │  │  agent_actions)  │   │
│  │  assets)     │  │              │  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LLM BACKEND (Pluggable)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │  Local:    │  │  Cloud:    │  │  Hybrid:               │ │
│  │  Ollama    │  │  OpenAI    │  │  Route by sensitivity  │ │
│  │  vLLM      │  │  Anthropic │  │  and complexity        │ │
│  │  Llama 3.x │  │  Gemini    │  │                        │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Phases

### Phase 1: Foundation (Weeks 1-8)
**Goal:** Establish Python sidecar, SurrealDB vectors, and basic RAG

#### Week 1-2: Project Structure
- [ ] Create `archer-ai-engine/` Python project
  - FastAPI application structure
  - Docker configuration
  - Redis for job queue
- [ ] Set up inter-service communication
  - Define REST API contracts between Rust core and Python sidecar
  - Implement health check endpoints

#### Week 3-4: SurrealDB Vector Configuration
- [ ] Enable vector capabilities in SurrealDB
  - Define `chunk` table with `embedding` column
  - Create M-TREE vector index
  - Test semantic search queries
- [ ] Create AI-specific schemas
  - `document` table for source documents
  - `ai_thought_log` for Chain of Thought storage
  - `agent_action` for autonomous action tracking

#### Week 5-6: RAG Ingestion Pipeline
- [ ] Implement document ingestion
  - File watcher (Rust side) → Redis queue
  - Python processors for PDF, DOCX, MD
  - Tesseract OCR integration
- [ ] Build embedding generation
  - Sentence transformers integration
  - Chunking strategy (512 tokens with overlap)
  - Delta-update with SHA-256 hashing

#### Week 7-8: Librarian Agent MVP
- [ ] Implement basic Q&A capability
  - Query embedding → vector search → context retrieval
  - LLM call with context injection
  - Response streaming to frontend
- [ ] Create simple chat API endpoint

### Phase 2: The "Brain" (Weeks 9-16)
**Goal:** LLM Gateway, Ticket Assistant, frontend AI integration

#### Week 9-10: LLM Gateway
- [ ] Implement model switcher
  - OpenAI adapter
  - Anthropic adapter
  - Ollama adapter (local)
- [ ] Build Orchestrator routing logic
  - Intent detection
  - Agent selection
  - Context assembly

#### Week 11-12: Ticket Assistant
- [ ] Intelligent triage
  - Category prediction
  - Priority suggestion
  - Assignment recommendation
- [ ] Similar ticket detection
  - Embedding comparison
  - Relevance scoring
- [ ] Knowledge base suggestions
  - RAG search integration
  - Inline suggestions

#### Week 13-14: Frontend AI Components
- [ ] Chat interface component
  - Message history
  - Streaming responses
  - Markdown rendering
- [ ] Ghost text suggestions
  - Inline predictions in ticket fields
  - Tab to accept, Escape to reject
- [ ] Feedback mechanism
  - Thumbs up/down on suggestions
  - Verbatim feedback collection

#### Week 15-16: Context Manager
- [ ] Dynamic context assembly
  - Recent tickets (last 5)
  - Related assets from CMDB
  - RAG chunks
- [ ] Prompt template management
  - System prompts per agent
  - User-customizable templates

### Phase 3: Autonomous Operations (Weeks 17-24)
**Goal:** Operations Agent, security, approval workflows

#### Week 17-18: Security Infrastructure
- [ ] HashiCorp Vault integration
  - Credential storage
  - Secret retrieval for agents
- [ ] Risk assessment calculator
  - Impact scoring
  - Reversibility check
  - Business criticality factors

#### Week 19-20: Operations Agent Core
- [ ] Infrastructure connectors
  - SSH wrapper
  - PowerShell/WinRM wrapper
  - Kubernetes exec
- [ ] Pre-approved script library
  - Restart service
  - Clear logs
  - Health checks

#### Week 21-22: Approval Workflow UI
- [ ] "Red Button" component
  - Risk score display
  - Action preview
  - Approve/Reject buttons
- [ ] Approval routing
  - Low risk: Auto-execute
  - Medium risk: Notify + execute
  - High risk: Require approval
  - Critical: Multi-person approval

#### Week 23-24: Monitoring Analyst
- [ ] Anomaly detection integration
  - Prometheus/Zabbix data ingestion
  - Baseline learning
  - Alert generation
- [ ] Automated RCA
  - Topology-aware analysis
  - Root cause suggestions

---

## 4. Technical Specifications

### Python AI Sidecar Structure
```
archer-ai-engine/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── routes/
│   │   │   ├── chat.py          # Chat endpoints
│   │   │   ├── suggest.py       # Suggestion endpoints
│   │   │   └── actions.py       # Autonomous action endpoints
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── orchestrator.py      # Main router
│   │   ├── librarian.py         # RAG/Knowledge agent
│   │   ├── ticket_assistant.py  # Ticket helper
│   │   ├── monitoring.py        # Alert analyst
│   │   └── operations.py        # Infrastructure agent
│   ├── llm_gateway/
│   │   ├── __init__.py
│   │   ├── base.py              # Abstract LLM interface
│   │   ├── openai_adapter.py
│   │   ├── anthropic_adapter.py
│   │   └── ollama_adapter.py
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── file_processor.py
│   │   ├── chunker.py
│   │   └── embedder.py
│   ├── context/
│   │   ├── __init__.py
│   │   └── manager.py           # Context assembly
│   └── security/
│       ├── __init__.py
│       ├── vault.py             # HashiCorp Vault client
│       └── risk.py              # Risk calculator
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── tests/
```

### SurrealDB AI Schema Additions
```sql
-- Document source tracking
DEFINE TABLE document SCHEMAFULL;
DEFINE FIELD source ON TABLE document TYPE string;
DEFINE FIELD path ON TABLE document TYPE string;
DEFINE FIELD content_hash ON TABLE document TYPE string;
DEFINE FIELD last_indexed ON TABLE document TYPE datetime;
DEFINE FIELD permissions ON TABLE document TYPE array;

-- Document chunks with embeddings
DEFINE TABLE chunk SCHEMAFULL;
DEFINE FIELD document ON TABLE chunk TYPE record(document);
DEFINE FIELD content ON TABLE chunk TYPE string;
DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;
DEFINE FIELD start_char ON TABLE chunk TYPE int;
DEFINE FIELD end_char ON TABLE chunk TYPE int;
DEFINE INDEX idx_embedding ON TABLE chunk COLUMNS embedding MTREE DIMENSION 1536;

-- AI thought log for transparency
DEFINE TABLE ai_thought_log SCHEMAFULL;
DEFINE FIELD agent ON TABLE ai_thought_log TYPE string;
DEFINE FIELD user ON TABLE ai_thought_log TYPE record(user);
DEFINE FIELD input ON TABLE ai_thought_log TYPE string;
DEFINE FIELD chain_of_thought ON TABLE ai_thought_log TYPE string;
DEFINE FIELD output ON TABLE ai_thought_log TYPE string;
DEFINE FIELD model ON TABLE ai_thought_log TYPE string;
DEFINE FIELD tokens_used ON TABLE ai_thought_log TYPE int;
DEFINE FIELD created_at ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();

-- Autonomous action tracking
DEFINE TABLE agent_action SCHEMAFULL;
DEFINE FIELD agent ON TABLE agent_action TYPE string;
DEFINE FIELD action_type ON TABLE agent_action TYPE string;
DEFINE FIELD target ON TABLE agent_action TYPE string;
DEFINE FIELD risk_score ON TABLE agent_action TYPE int;
DEFINE FIELD status ON TABLE agent_action TYPE string; -- pending, approved, rejected, executed, failed
DEFINE FIELD approver ON TABLE agent_action TYPE option<record(user)>;
DEFINE FIELD result ON TABLE agent_action TYPE option<string>;
DEFINE FIELD created_at ON TABLE agent_action TYPE datetime DEFAULT time::now();
```

### API Contract: Rust ↔ Python
```yaml
# POST /api/ai/chat
request:
  message: string
  context:
    current_ticket?: TicketId
    current_project?: ProjectId
response:
  stream: true
  content_type: text/event-stream
  
# POST /api/ai/suggest/triage
request:
  title: string
  description: string
response:
  category: string
  priority: P1|P2|P3|P4
  suggested_assignee?: UserId
  similar_tickets: TicketId[]
  kb_articles: DocumentId[]
  confidence: float

# POST /api/ai/action/request
request:
  agent: string
  action_type: string
  target: string
  parameters: object
response:
  action_id: string
  risk_score: int
  requires_approval: boolean
  preview: string
```

---

## 5. Dependencies & Prerequisites

### Infrastructure Requirements
- **Redis** - Job queue for async processing
- **Docker** - Containerized AI sidecar deployment
- **GPU (Optional)** - For local LLM inference (vLLM/Ollama)

### Python Dependencies
```txt
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.6.0
redis>=5.0.0
surrealdb>=0.3.0
sentence-transformers>=2.5.0
openai>=1.12.0
anthropic>=0.18.0
pytesseract>=0.3.10
python-multipart>=0.0.9
httpx>=0.26.0
```

### Environment Variables
```env
# AI Sidecar Config
AI_SIDECAR_PORT=8000
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NS=archer
SURREALDB_DB=main

# LLM Configuration
LLM_PROVIDER=ollama  # ollama|openai|anthropic
OLLAMA_HOST=http://localhost:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Security
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=...
```

---

## 6. Success Metrics

### Phase 1 Success Criteria
- [ ] Python sidecar starts and communicates with Rust backend
- [ ] Vector search returns relevant documents with <200ms latency
- [ ] Librarian Agent answers basic questions about ingested docs
- [ ] 100 documents can be ingested and indexed

### Phase 2 Success Criteria
- [ ] LLM Gateway routes to 3+ providers
- [ ] Ticket Assistant achieves >80% triage accuracy
- [ ] Ghost text suggestions appear in <500ms
- [ ] User feedback is captured and stored

### Phase 3 Success Criteria
- [ ] Operations Agent can execute pre-approved scripts
- [ ] Risk assessment correctly classifies action severity
- [ ] Approval workflow functions for high-risk actions
- [ ] All autonomous actions are logged with Chain of Thought

---

## 7. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SurrealDB vector performance | Fall back to Qdrant/Weaviate if needed |
| Local LLM quality | Use cloud APIs for complex tasks |
| Python ↔ Rust latency | Optimize with gRPC if REST is slow |
| Security of autonomous actions | Conservative defaults, multi-approval required |
| Token costs for cloud LLMs | Implement caching, use local for common queries |

---

## 8. Next Immediate Actions

1. **Create Python project structure** - Set up `archer-ai-engine/` with FastAPI
2. **Define API contracts** - OpenAPI spec for Rust ↔ Python communication
3. **Enable SurrealDB vectors** - Test vector index creation and queries
4. **Set up development environment** - Docker compose for local development
5. **Implement health check endpoints** - Ensure services can communicate

---

*This document should be updated as implementation progresses. Each completed phase should trigger a documentation update.*
