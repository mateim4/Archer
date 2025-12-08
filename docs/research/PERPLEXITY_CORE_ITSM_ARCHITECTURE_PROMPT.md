# Perplexity Deep Research Prompt: Archer Core ITSM Architecture

**Purpose:** Generate comprehensive architectural documentation for the non-AI components of Archer ITSM platform.

---

## PRIMARY DELIVERABLES REQUESTED

Based on your research and analysis of the existing documentation, produce these **two primary documents**:

### 1. **PRODUCT_ROADMAP.md** (Strategic)
A comprehensive product roadmap that includes:
- **Phase definitions** with clear milestones and success criteria
- **Feature prioritization** aligned with MoSCoW analysis
- **Timeline estimates** for each phase
- **Dependencies** between features and modules
- **Business value** justification for prioritization
- **Risk assessment** for each phase

### 2. **FULLSTACK_DEVELOPMENT_PLAN.md** (Technical)
An in-depth full-stack development plan covering:
- **System architecture** diagrams and component interactions
- **Data model specifications** (SurrealDB schemas for all entities)
- **API specifications** (all endpoints with request/response formats)
- **Frontend architecture** (state management, routing, component patterns)
- **Integration architecture** (how modules connect)
- **Security architecture** (auth, RBAC, audit logging)
- **Implementation order** with dependencies

### 3. **Updates to Existing Documentation**
After reviewing the existing docs, update or flag for update:
- Correct any outdated information
- Align with the new **Core ITSM / AI Module separation** (this is a NEW architectural concept)
- Ensure consistency across all documents
- Mark deprecated sections clearly

---

## IMPORTANT ARCHITECTURAL CONCEPT

**NEW: Core ITSM vs AI Module Separation**

The project has evolved to have a clear architectural boundary:

| Domain | Scope | Independence |
|--------|-------|--------------|
| **Core ITSM** | Service Desk, CMDB, Monitoring, Workflows, RBAC, KB, Catalog, Reports | MUST work standalone |
| **AI Module** | LLM Gateway, Agents, RAG, Suggestions, Autonomous Ops | Optional enhancement |

This separation was NOT present in the original documentation. Your research output should:
1. Respect this boundary in all architectural decisions
2. Ensure Core ITSM documentation is complete without AI references
3. Document integration points where AI enhances (not enables) Core ITSM

---

## RESEARCH REQUEST

I need you to conduct deep research and produce comprehensive architectural documentation for **Archer**, a modern IT Service Management (ITSM) platform being built as an alternative to ServiceNow. 

**Critical Context:** This is NOT a greenfield project. Significant progress has been made, and the goal is to **bridge the gap** between the current implementation and the target state, NOT to redesign from scratch. The existing architecture decisions, design system, and technology choices must be respected and built upon.

---

## PART 1: PROJECT CONTEXT & VISION

### What is Archer?

Archer is positioned as "The Modern ServiceNow Alternative" — a unified ITSM platform that combines:
- **IT Service Management** (Incidents, Problems, Changes, Service Requests)
- **Configuration Management Database (CMDB)** with asset lifecycle tracking
- **Infrastructure Monitoring** with alert-to-ticket correlation
- **Project Portfolio Management** for IT projects
- **AI-Augmented Operations** (optional module, documented separately)

### Target Market
- Mid-market enterprises (500-5000 employees)
- Organizations frustrated with ServiceNow complexity and cost
- IT teams seeking modern, fast, keyboard-driven interfaces

### Key Differentiators (from competitive analysis)
1. **Speed-First UX:** Sub-100ms interactions, keyboard shortcuts, minimal clicks
2. **Modern Stack:** React + Rust + SurrealDB (vs legacy Java/Oracle)
3. **Glassmorphic UI:** "Purple Glass" design system with Fluent UI 2
4. **Graph-Native CMDB:** SurrealDB graph relationships vs traditional relational
5. **AI as Enhancement:** AI features are modular and optional, core ITSM works without them

---

## PART 2: CURRENT IMPLEMENTATION STATE

### Technology Stack (Implemented)

| Layer | Technology | Status |
|-------|------------|--------|
| **Frontend** | React 18 + TypeScript + Vite | ✅ Production-ready |
| **UI Framework** | Fluent UI 2 + Purple Glass Design System | ✅ Production-ready |
| **Backend** | Rust + Axum (async) | ✅ Production-ready |
| **Database** | SurrealDB (multi-model) | ✅ Operational |
| **AI Engine** | Python FastAPI (sidecar) | ✅ Phase 1 complete |

### What's Built and Working

#### Frontend Views (Real Data)
- **Project Management:** Projects, Activities, Timeline, Dependencies
- **Hardware Lifecycle:** Hardware Pool, Baskets, Vendor Catalogs (Dell, Lenovo)
- **VMware Migration:** RVTools parsing, cluster analysis, wave planning
- **Cluster Strategy:** Destination cluster configuration
- **Settings:** Global application settings

#### Frontend Views (Mock Data / Incomplete)
- **Service Desk:** Ticket list/kanban exists, falls back to mock data
- **Dashboard:** Stats widgets use mock data
- **Monitoring:** Metrics/topology views use mock data
- **Inventory (CMDB):** Basic asset views, limited functionality

#### Backend APIs (Implemented - /api/v1/)
- `/tickets/*` - Basic CRUD
- `/assets/*` - Asset management
- `/monitoring/*` - Routes exist, limited logic
- `/hardware-pool/*` - Full implementation
- `/rvtools/*` - RVTools parsing
- `/project-lifecycle/*` - Project management
- `/project-workflow/*` - Activities/workflows
- `/migration-wizard/*` - VMware migration
- `/cluster-strategy/*` - Cluster planning
- `/settings/*` - Configuration

#### Backend APIs (Missing)
- `/auth/*` - No authentication
- `/users/*`, `/roles/*` - No user management
- `/knowledge-base/*` - Not implemented
- `/service-catalog/*` - Not implemented
- `/sla/*` - Not implemented
- `/workflows/*` (generic) - Not implemented
- `/approvals/*` - Not implemented
- `/notifications/*` - Not implemented
- `/reports/*` - Not implemented

### Data Models (Implemented in Rust)

```
backend/src/models/
├── ticket.rs          # Ticket, TicketType, TicketPriority, TicketStatus
├── workflow.rs        # ProjectWorkflow, Workflow, WorkflowType, WizardState
├── project_models.rs  # Project-related models
├── migration_models.rs# VMware migration models
├── settings.rs        # Application settings
└── hld.rs             # High-level design documents
```

### Design System (Implemented)

The "Purple Glass" design system is fully tokenized:
- **Colors:** CSS variables for all colors, dark/light themes
- **Typography:** Poppins font family, fluid scaling
- **Spacing:** 4px/8px grid system
- **Components:** 8 Purple Glass components (PurpleGlassCard, PurpleGlassButton, etc.)
- **Glassmorphism:** Backdrop blur, transparency, subtle borders

---

## PART 3: GAP ANALYSIS (What's Missing)

### Critical Gaps for ITSM Platform

| Feature | Current State | Required State |
|---------|---------------|----------------|
| **Authentication** | None | JWT-based auth with sessions |
| **RBAC** | None | Roles, permissions, teams |
| **Ticket Comments** | None | Threaded comments on tickets |
| **Ticket Attachments** | None | File uploads on tickets |
| **SLA Management** | UI badges only | Full SLA engine with timers |
| **Escalation Rules** | None | Auto-escalate on SLA breach |
| **Knowledge Base** | None | Article CRUD, search, versioning |
| **Service Catalog** | None | Catalog items, request forms |
| **Workflow Automation** | Project-specific only | Generic workflow engine |
| **Approval Workflows** | None | Multi-stage approvals |
| **Notifications** | None | Email + in-app notifications |
| **Reporting** | Mock data | Real analytics, exports |

### Implementation Gap Score

Based on MoSCoW Phase 1 Must-Haves:
- **Incident Management:** 31% complete
- **Knowledge Base:** 0% complete
- **Service Catalog:** 0% complete
- **CMDB/Assets:** 33% complete
- **Monitoring:** 0% complete (real data)
- **Workflow Automation:** 29% complete
- **User Management:** 0% complete
- **Reporting:** 0% complete

---

## PART 4: RESEARCH DELIVERABLES REQUESTED

Please produce comprehensive architectural documentation covering:

### 1. Core ITSM Architecture Document

**Scope:** System architecture for the non-AI components

**Sections needed:**
- System Overview & Component Diagram
- Data Flow Architecture (Frontend ↔ Backend ↔ Database)
- API Design Principles & Conventions
- Error Handling Strategy
- Security Architecture (Auth, RBAC, Audit)
- Integration Points (how modules connect)

### 2. Data Model Specification

**Scope:** Complete database schema for core ITSM entities

**Entities to define:**
- User, Role, Permission, Team (RBAC)
- Ticket extensions (Comments, Attachments, History)
- SLAPolicy, SLATimer, EscalationRule
- KnowledgeArticle, KnowledgeCategory
- ServiceCatalogItem, RequestForm
- WorkflowDefinition, WorkflowStep, WorkflowInstance
- ApprovalRequest, ApprovalChain
- Notification, NotificationPreference
- AuditLog
- Alert, AlertRule

**Requirements:**
- Must use SurrealDB conventions (graph relations, SCHEMAFULL)
- Must support multi-tenancy via namespaces
- Must include relationship definitions (edges)

### 3. API Architecture Specification

**Scope:** REST API design for all core ITSM endpoints

**Topics to cover:**
- URL structure and versioning (`/api/v1/...`)
- Request/Response formats (JSON conventions)
- Pagination, filtering, sorting patterns
- Error response format
- Authentication header requirements
- Rate limiting considerations

**Endpoints to define:**
- Authentication APIs
- User/Role/Team management APIs
- Ticket extensions (comments, attachments)
- SLA management APIs
- Knowledge Base APIs
- Service Catalog APIs
- Workflow/Approval APIs
- Notification APIs
- Reporting/Analytics APIs

### 4. Frontend Architecture Specification

**Scope:** React application architecture patterns

**Topics to cover:**
- State management strategy
- Routing structure
- API client patterns
- Component hierarchy
- Feature module organization
- Form handling patterns
- Error boundary strategy

**Constraints:**
- Must use existing Fluent UI 2 + Purple Glass design system
- Must follow existing patterns in codebase
- Must support both dark and light themes

### 5. Integration Architecture

**Scope:** How ITSM modules interconnect

**Integrations to document:**
- Ticket ↔ Asset (affected assets)
- Ticket ↔ KB (suggested articles)
- Alert ↔ Ticket (auto-creation)
- Asset ↔ Monitoring (health metrics)
- Workflow ↔ All entities (automation triggers)
- SLA ↔ Ticket (timer management)

---

## PART 5: ARCHITECTURAL CONSTRAINTS

When designing, respect these existing decisions:

### Technology Constraints
- **Frontend:** React + TypeScript + Vite (no framework change)
- **Backend:** Rust + Axum (no language change)
- **Database:** SurrealDB (leverage graph capabilities)
- **Styling:** CSS variables + design tokens (no CSS-in-JS)

### Design Constraints
- **UI Framework:** Fluent UI 2 components
- **Design System:** Purple Glass (glassmorphism aesthetic)
- **Typography:** Poppins font family
- **Spacing:** 4px/8px grid
- **Interactions:** Keyboard-first, <100ms response

### API Constraints
- RESTful design (no GraphQL for now)
- JSON request/response
- Versioned endpoints (`/api/v1/`)
- Consistent error format

### Security Constraints
- JWT-based authentication
- RBAC with granular permissions
- Audit logging for all mutations
- Multi-tenant isolation via SurrealDB namespaces

---

## PART 6: REFERENCE DOCUMENTS

The following documents exist and should be referenced/aligned with:

### Strategic Documents (Obsidian Vault)
1. `00_Executive_Summary.md` - Vision, positioning, market opportunity
2. `01_AI_Roadmap_and_Business_Case.md` - AI phasing (reference only)
3. `02_Feature_Prioritization_MoSCoW.md` - Must/Should/Could/Won't features

### Architecture Documents (AI-focused, for reference)
4. `01_Comprehensive_Architecture.md` - System overview (AI-heavy)
5. `02_RAG_Architecture.md` - Knowledge ingestion (AI-specific)
6. `03_Data_Model_SurrealDB.md` - AI database schemas
7. `04_AI_Agent_Specifications.md` - Agent definitions

### Implementation Documents
8. `ITSM_PLATFORM_SPECIFICATION.md` - Module specs (Service Desk, CMDB, Monitoring)
9. `COMPONENT_LIBRARY_GUIDE.md` - Purple Glass component API
10. `DESIGN_TOKEN_DOCUMENTATION.md` - Design system tokens
11. `CMO_FMO_GAP_ANALYSIS.md` - Current vs Future state analysis
12. `E2E_DEVELOPMENT_PLAN.md` - 16-week implementation roadmap

### Product Documents
13. `01_DATA_MODEL_AND_APP_DESIGN.md` - Data model overview
14. `04_PRODUCT_ROADMAP.md` - Phase-based roadmap
15. `05_FEATURES_AND_BUSINESS_DRIVERS.md` - Business value

### UX Documents
16. `00_UX_and_IA_Recommendations.md` - Comprehensive UX spec (4700+ lines)

---

## PART 7: OUTPUT FORMAT

Structure your research output as **two primary documents** plus supporting analysis:

### Primary Document 1: PRODUCT_ROADMAP.md

```markdown
# Archer ITSM - Product Roadmap

## Executive Summary
[Vision, market position, strategic goals]

## Phase Overview
| Phase | Timeline | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 0 | Week 1-2 | Foundation | Auth, RBAC, Audit |
| 1 | Week 3-6 | Core ITSM | Tickets E2E, SLA, KB |
| ... | ... | ... | ... |

## Phase 0: Foundation
### Goals
### Features
### Success Criteria
### Dependencies
### Risks

## Phase 1: Core ITSM
[... same structure ...]

## Phase N: [Future]
[... same structure ...]

## Feature Prioritization Matrix
[MoSCoW alignment with business justification]

## Risk Register
[Risks, probability, impact, mitigation]

## Success Metrics
[KPIs for each phase]
```

### Primary Document 2: FULLSTACK_DEVELOPMENT_PLAN.md

```markdown
# Archer ITSM - Full-Stack Development Plan

## 1. System Architecture
### 1.1 Component Diagram
### 1.2 Data Flow
### 1.3 Deployment Architecture
### 1.4 Technology Stack Rationale

## 2. Data Architecture (SurrealDB)
### 2.1 Core ITSM Entities
[Complete schemas for: User, Role, Permission, Team, Ticket, Comment, 
Attachment, SLAPolicy, SLATimer, EscalationRule, KnowledgeArticle, 
ServiceCatalogItem, WorkflowDefinition, ApprovalRequest, Notification, 
AuditLog, Alert, AlertRule, Report]
### 2.2 Relationship Model (Graph Edges)
### 2.3 Multi-tenancy Strategy
### 2.4 Migration Scripts

## 3. API Architecture
### 3.1 Design Principles
### 3.2 Authentication Flow
### 3.3 Endpoint Specifications
[All endpoints with method, URL, request/response, auth requirements]
### 3.4 Error Handling Standard
### 3.5 Pagination/Filtering Patterns

## 4. Frontend Architecture
### 4.1 Application Structure
### 4.2 State Management Strategy
### 4.3 Routing Configuration
### 4.4 Component Patterns
### 4.5 API Client Implementation
### 4.6 Form Handling Patterns

## 5. Integration Architecture
### 5.1 Module Integration Map
### 5.2 Event System Design
### 5.3 Cross-Module Data Flow
### 5.4 AI Module Integration Hooks (future)

## 6. Security Architecture
### 6.1 Authentication (JWT)
### 6.2 Authorization (RBAC)
### 6.3 Audit Logging
### 6.4 Data Protection

## 7. Implementation Order
### 7.1 Critical Path
### 7.2 Dependency Graph
### 7.3 Sprint Breakdown
```

### Supporting Analysis: Documentation Updates

After producing the primary documents, provide a list of updates needed for existing documentation to align with:
1. The new Core ITSM / AI Module separation
2. Current implementation progress
3. New architectural decisions

---

## PART 8: RESEARCH APPROACH

### Recommended Research Sources

1. **ITSM Best Practices:**
   - ITIL v4 Framework documentation
   - ServiceNow architecture patterns (for reference, not copying)
   - Jira Service Management patterns
   - Freshservice/Zendesk modern ITSM approaches

2. **Technical Architecture:**
   - Rust web service patterns (Axum best practices)
   - SurrealDB schema design patterns
   - React application architecture (2024-2025 patterns)
   - REST API design (Microsoft REST API Guidelines)

3. **Security:**
   - OWASP API Security guidelines
   - JWT best practices
   - RBAC implementation patterns

4. **Database:**
   - Graph database modeling
   - Multi-tenant SaaS database patterns
   - Audit logging best practices

### Research Priorities

1. **Highest Priority:** Data Model (this unlocks everything else)
2. **High Priority:** Authentication/RBAC (security foundation)
3. **Medium Priority:** API specifications (implementation guide)
4. **Medium Priority:** Frontend architecture (patterns already established)

---

## FINAL NOTES

**Remember:** The goal is to COMPLETE an existing application, not redesign it. The architecture should:

1. **Build on existing patterns** - Don't invalidate what's working
2. **Fill the gaps** - Focus on what's missing, not what's done
3. **Stay pragmatic** - 16-week implementation timeline
4. **Prioritize core ITSM** - AI features are separate and optional
5. **Respect the design system** - Purple Glass aesthetic must be maintained

The output should be implementable by a development team familiar with Rust, React, and SurrealDB. Avoid theoretical or overly abstract documentation — be specific and actionable.

---

*Prompt prepared: December 8, 2025*
*Project: Archer ITSM Platform*
*Context: Bridging CMO to FMO for core ITSM features*
