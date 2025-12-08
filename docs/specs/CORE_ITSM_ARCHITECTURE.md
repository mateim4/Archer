# Archer ITSM - Base Platform Target Architecture

**Document Version:** 1.1  
**Last Updated:** December 9, 2025  
**Status:** Core Architecture Specification  
**Classification:** Technical Architecture (Non-AI)

---

> ⚠️ **IMPORTANT: SurrealDB Syntax Note**
> 
> This document uses **pseudo-code notation** for database schemas to improve readability.
> The schema examples shown are conceptual and must be translated to proper SurrealDB syntax.
> 
> **Project uses SurrealDB v1.0.0-beta.9** - See `docs/planning/DELTA_TRACKING.md` for 
> correct syntax patterns and translation guide.
> 
> **Backend API runs on port 3001** (not 3000 as some examples may show).

---

## Executive Summary

This document defines the complete system architecture for the **Archer Core ITSM Platform**—the non-AI, self-contained ITSM solution that works independently. This architecture respects existing technology choices (React 18, Rust/Axum, SurrealDB) and fills critical gaps in authentication, RBAC, data modeling, and API design.

**Key Architectural Principles:**
1. **Core ITSM First:** Complete functionality without AI dependencies
2. **Security by Default:** RBAC, audit logging, multi-tenancy from foundation
3. **Graph-Native Design:** Leverage SurrealDB's native graph capabilities
4. **Speed-First UX:** Sub-100ms interactions enabled by efficient data access
5. **Modular Integration:** Clean boundaries where AI can enhance (not replace) Core ITSM

---

## 1. System Architecture Overview

### 1.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Web Browser (React 18 + TypeScript)                     │  │
│  │  - Fluent UI 2 Components + Purple Glass Design System  │  │
│  │  - State: Zustand (global) + React Context (local)      │  │
│  │  - Keyboard-First Interactions (<100ms)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY / PROXY TIER                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Rate Limiting (100 req/sec per user)                   │  │
│  │  Request/Response Logging (audit trail)                 │  │
│  │  TLS Termination + Certificate Management               │  │
│  │  Request Routing to Backend Services                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                  APPLICATION TIER (Rust/Axum)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/auth/*              Auth Service               │  │
│  │    - JWT issuance, validation, refresh                  │  │
│  │    - Session management                                 │  │
│  │    - MFA/2FA (future)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/users/*             User Service               │  │
│  │  /api/v1/roles/*             Role Service               │  │
│  │  /api/v1/permissions/*       Permission Service         │  │
│  │  /api/v1/teams/*             Team Service               │  │
│  │    - RBAC enforcement via middleware                    │  │
│  │    - Tenant isolation validation                        │  │
│  │    - Permission caching (5min TTL)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/tickets/*           Ticket Service             │  │
│  │  /api/v1/tickets/{id}/comments/*   Comment Subsystem    │  │
│  │  /api/v1/tickets/{id}/attachments/* Attachment Mgmt    │  │
│  │    - State machine enforcement                          │  │
│  │    - SLA timer management                               │  │
│  │    - Escalation rule evaluation                         │  │
│  │    - Full-text search integration                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/assets/*            Asset Service              │  │
│  │  /api/v1/cmdb/*              CMDB Service               │  │
│  │    - Asset lifecycle management                         │  │
│  │    - CI relationship traversal                          │  │
│  │    - Dependency graph queries                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/knowledge/*         Knowledge Base Service      │  │
│  │    - Article CRUD + versioning                          │  │
│  │    - Full-text search (SurrealDB native)                │  │
│  │    - Category hierarchy traversal                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/sla/*               SLA Service                │  │
│  │    - SLA policy evaluation                              │  │
│  │    - Timer management (background jobs)                 │  │
│  │    - Breach detection + notifications                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/workflows/*         Workflow Service            │  │
│  │  /api/v1/approvals/*         Approval Service            │  │
│  │    - Workflow definition compilation                    │  │
│  │    - Instance execution (async)                         │  │
│  │    - State transition validation                        │  │
│  │    - Approval chain routing                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/alerts/*            Alert Service              │  │
│  │    - Alert ingestion (webhook)                          │  │
│  │    - Correlation + grouping                             │  │
│  │    - Rule evaluation                                    │  │
│  │    - Auto-ticket creation                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/catalog/*           Service Catalog Service     │  │
│  │  /api/v1/requests/*          Service Request Service     │  │
│  │    - Catalog item management                            │  │
│  │    - Dynamic form rendering                             │  │
│  │    - Request submission + tracking                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/reports/*           Reporting Service           │  │
│  │  /api/v1/dashboards/*        Dashboard Service           │  │
│  │    - Report generation (SQL queries)                    │  │
│  │    - Dashboard data aggregation                         │  │
│  │    - Export (CSV, PDF)                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/v1/audit/*             Audit Service               │  │
│  │    - Audit log query API                                │  │
│  │    - Compliance export                                  │  │
│  │    - User activity history                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CROSS-CUTTING CONCERNS:                                │  │
│  │    - Auth Middleware (JWT validation, tenant isolation) │  │
│  │    - Error Handling (standard error response format)    │  │
│  │    - Logging (structured, with request context)         │  │
│  │    - Request/Response Validation (JSON Schema)          │  │
│  │    - Rate Limiting (per-user, per-endpoint)             │  │
│  │    - Request Tracing (correlation IDs)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         ↓ Native Protocol
┌─────────────────────────────────────────────────────────────────┐
│                    DATA TIER (SurrealDB)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Multi-Model Database:                                  │  │
│  │    - Relational tables for structured data              │  │
│  │    - Graph edges for relationships                      │  │
│  │    - Document flexibility for extensibility             │  │
│  │                                                          │  │
│  │  SCHEMAFULL Mode: Type safety at database level         │  │
│  │                                                          │  │
│  │  Namespaces: Multi-tenancy isolation                    │  │
│  │    - Tenant A: namespace:a / users, tickets, assets... │  │
│  │    - Tenant B: namespace:b / users, tickets, assets... │  │
│  │                                                          │  │
│  │  Key Tables:                                            │  │
│  │    - Users, Roles, Permissions, Teams (RBAC)           │  │
│  │    - Tickets, Comments, Attachments (Service Desk)     │  │
│  │    - Assets, CI, Relationships (CMDB)                  │  │
│  │    - KnowledgeArticles, Categories (KB)                │  │
│  │    - SLAPolicy, SLATimer, EscalationRule (SLA)         │  │
│  │    - WorkflowDefinition, WorkflowInstance (Workflows)  │  │
│  │    - ApprovalRequest, ApprovalChain (Approvals)        │  │
│  │    - ServiceCatalogItem, RequestForm (Catalog)         │  │
│  │    - Alert, AlertRule (Monitoring)                     │  │
│  │    - AuditLog (compliance)                             │  │
│  │    - Notification, NotificationPreference (comms)      │  │
│  │                                                          │  │
│  │  Key Edges (Graph Relationships):                       │  │
│  │    - User → Role (assignment)                           │  │
│  │    - Ticket → Asset (affected CI)                       │  │
│  │    - Asset → Asset (contains, depends-on, hosts)       │  │
│  │    - Ticket → KnowledgeArticle (solution)              │  │
│  │    - WorkflowInstance → WorkflowDefinition (tracks)    │  │
│  │    - ApprovalRequest → User (approver)                 │  │
│  │    - Alert → Ticket (triggered by)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         ↓ Cache Hits
┌─────────────────────────────────────────────────────────────────┐
│                    CACHE TIER                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  In-Process: Moka (RBAC decisions, user profiles)       │  │
│  │  Redis (future): Session tokens, rate limit counters    │  │
│  │  Browser Cache: Static assets, design tokens            │  │
│  │                                                          │  │
│  │  Cache Invalidation:                                    │  │
│  │    - RBAC: TTL 5 minutes (user permission changes)      │  │
│  │    - Assets: TTL 1 hour (CI data relatively static)     │  │
│  │    - Articles: TTL 24 hours (KB articles stable)        │  │
│  │    - Workflow definitions: On-deploy invalidation       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         ↓ Background Jobs
┌─────────────────────────────────────────────────────────────────┐
│                  BACKGROUND JOB TIER                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SLA Timer Service (runs every 5 minutes):               │  │
│  │    - Check all active SLA timers                         │  │
│  │    - Trigger escalation rules if breached                │  │
│  │    - Send notifications                                 │  │
│  │                                                          │  │
│  │  Workflow Execution Service (event-driven):              │  │
│  │    - Dequeue workflow tasks                             │  │
│  │    - Execute state transitions                          │  │
│  │    - Trigger next steps (async)                         │  │
│  │                                                          │  │
│  │  Notification Service (event-driven):                    │  │
│  │    - Send emails, in-app notifications                  │  │
│  │    - Batch processing (e.g., daily digests)             │  │
│  │                                                          │  │
│  │  Alert Correlation Service (real-time):                 │  │
│  │    - Group related alerts                               │  │
│  │    - Deduplicate alert streams                          │  │
│  │    - Auto-create tickets from alert groups              │  │
│  │                                                          │  │
│  │  Reporting Service (scheduled):                          │  │
│  │    - Generate scheduled reports                         │  │
│  │    - Email report delivery                              │  │
│  │    - Archive historical data                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction Map

**Critical Data Flows:**

```
Incident Creation Flow:
User submits ticket
    ↓
Frontend validation (form schema)
    ↓
POST /api/v1/tickets (with auth JWT)
    ↓
Backend: Auth middleware validates JWT
    ↓
Backend: Extract tenant from JWT claims
    ↓
Backend: Check RBAC permission (user.roles | "create:ticket")
    ↓
Backend: Validate request schema
    ↓
Backend: Create Ticket record in SurrealDB (tenant namespace)
    ↓
Backend: Store in AuditLog (who created, when, what)
    ↓
Backend: Evaluate matching SLA policy (impact × urgency matrix)
    ↓
Backend: Create SLATimer record (start time, deadline)
    ↓
Backend: Return ticket ID to frontend
    ↓
Frontend: Display ticket with status, SLA deadline
    ↓
Background Job: SLA service monitors timer, escalates if needed


SLA Breach Escalation Flow:
Background SLA service (every 5 min):
    ↓
SELECT * FROM SLATimer WHERE status = 'active'
    ↓
For each timer:
    - Calculate time remaining
    - If remaining < 0 and status != 'escalated':
        ↓
        Fetch EscalationRule matching ticket priority/impact
        ↓
        Route to next support tier (queue assignment)
        ↓
        Send notification to assignee
        ↓
        Update ticket status to 'escalated'
        ↓
        Log escalation to AuditLog


Ticket Comment & Collaboration:
User types comment on ticket
    ↓
Frontend (Zustand): Add to local state with optimistic UI
    ↓
POST /api/v1/tickets/{id}/comments (with JWT)
    ↓
Backend: Validate user has access to ticket (via Ticket.created_by or team assignment)
    ↓
Backend: Create TicketComment record
    ↓
Backend: Parse @mentions, extract usernames
    ↓
Backend: Create Notification for mentioned users
    ↓
Background notification service: Send email/in-app notif
    ↓
Frontend: Server-sent events (SSE) notifies other users viewing ticket
    ↓
Display comment in real-time (via WebSocket or polling)


Knowledge Base Search & Suggestion:
User creates ticket with description
    ↓
Frontend triggers GET /api/v1/knowledge/search?q={title + description}
    ↓
Backend: Run full-text search (SurrealDB FTS)
    ↓
Backend: Return ranked results (relevance scoring)
    ↓
Frontend: Display "Suggested Solutions" side panel
    ↓
User clicks article, frontend logs interaction
    ↓
If user marks as solution, link Ticket → KnowledgeArticle edge


Asset Dependency Graph Query:
Frontend: View ticket → click "Affected CIs" section
    ↓
GET /api/v1/tickets/{id}/affected-assets
    ↓
Backend: Fetch Ticket.affected_ci_ids
    ↓
For each asset: Traverse graph edges (depends-on, contains, hosts)
    ↓
Build dependency tree (max depth = 3 for performance)
    ↓
Return with impact summary (e.g., "10 servers affected")
    ↓
Frontend: Display dependency graph visualization


Workflow Approval Chain:
Ticket transitions to state requiring approval (e.g., "implement")
    ↓
Backend: Check if WorkflowDefinition defines approval for this state
    ↓
If approval needed:
    - Create ApprovalRequest record
    - Create ApprovalChain (sequential or parallel approvers)
    - Send notifications to approvers
    ↓
Approvers receive notification with approval link
    ↓
Approver clicks "Approve" or "Reject"
    ↓
Backend: POST /api/v1/approvals/{id}/approve
    - Update ApprovalRequest.status
    - Check if all approvals in chain complete
    - If yes, trigger ticket state transition
    - If no, wait for next approver or timeout
    ↓
Ticket auto-transitions on approval completion
```

### 1.3 Technology Stack Justification

| Component | Technology | Why | Constraints |
|-----------|-----------|-----|-------------|
| **Frontend Framework** | React 18 | Component reusability, large ecosystem, TypeScript support | No framework swap allowed |
| **Frontend Styling** | CSS Variables + Design Tokens | Dark/light theme support, no runtime overhead | No CSS-in-JS (performance) |
| **UI Components** | Fluent UI 2 | Enterprise-grade, accessibility (WCAG 2.1 AA), Microsoft backing | Adheres to Purple Glass design system |
| **State Management** | Zustand (global) + React Context (local) | Lightweight, no boilerplate, tree-shaking friendly | Context for auth context only |
| **Backend Language** | Rust | Memory safety, zero-cost abstractions, excellent async story | No language swap allowed |
| **Backend Framework** | Axum | Typed middleware, composable handlers, <100ms response time | Async-first requirement |
| **Database** | SurrealDB 1.x | Graph relationships native, multi-model, SCHEMAFULL safety | Leverage graph for CMDB. **Note:** Project uses v1.0.0-beta.9 |
| **Authentication** | JWT (HS256/RS256) | Stateless, scalable, standard in industry | No session-based auth (stateless requirement) |
| **Message Queue** | Redis (Phase 4+) | Alert ingestion, background job coordination | Future addition for scalability |
| **Caching** | Moka (in-process) | Lock-free, performant, no external dependency | TTL-based expiration for RBAC |

---

## 2. Data Architecture (SurrealDB Core Schema)

### 2.1 RBAC Foundation (Phase 0)

```
TABLE users {
    id: string,                    // UUID or username
    namespace: string,             // Tenant isolation
    email: string,                 // Unique per namespace
    password_hash: string,         // bcrypt, never plaintext
    display_name: string,
    is_active: bool,
    last_login: datetime,
    created_at: datetime,
    updated_at: datetime,
    deleted_at: datetime,          // Soft delete
    mfa_enabled: bool,             // Future: 2FA support
    
    // Relationships
    assigned_roles: [Role],        // Via edge
    team_memberships: [Team],      // Via edge
}

TABLE roles {
    id: string,                    // UUID
    namespace: string,
    name: string,                  // "incident_manager", "support_agent"
    description: string,
    is_system: bool,               // True = immutable (built-in roles)
    permissions: [Permission],     // Via edge
    created_at: datetime,
    updated_at: datetime,
}

TABLE permissions {
    id: string,
    namespace: string,
    action: string,                // "create", "read", "update", "delete"
    resource: string,              // "ticket", "asset", "user", "*"
    conditions: object,            // Optional: { status: "open" } for conditional perms
    description: string,
    created_at: datetime,
}

EDGE user_has_role {
    from: User,
    to: Role,
    assigned_at: datetime,
    assigned_by: User,             // Who assigned this role
}

EDGE role_has_permission {
    from: Role,
    to: Permission,
    granted_at: datetime,
}

EDGE user_in_team {
    from: User,
    to: Team,
    joined_at: datetime,
    role_in_team: string,          // "manager", "member"
}

TABLE teams {
    id: string,
    namespace: string,
    name: string,                  // "L1 Support", "Infrastructure"
    description: string,
    parent_team: Team,             // Optional: for team hierarchy
    queue_assignment: string,      // Default ticket assignment queue
    escalation_group: bool,        // Can receive escalated tickets
    created_at: datetime,
    updated_at: datetime,
}

TABLE audit_log {
    id: string,
    namespace: string,
    user_id: User,
    action: string,                // "ticket:create", "user:update", etc.
    resource_type: string,         // "Ticket", "User", "Role"
    resource_id: string,           // ID of affected resource
    changes: object,               // { "status": { "old": "open", "new": "closed" } }
    ip_address: string,
    user_agent: string,
    timestamp: datetime,
    
    // For compliance: immutable
}
```

### 2.2 Service Desk (Phase 1)

```
TABLE tickets {
    id: string,                    // UUID, unique per namespace
    namespace: string,
    number: int,                   // Auto-incrementing display number
    
    // Core fields
    title: string,
    description: string,           // Rich text (Markdown)
    type: string,                  // "incident", "request", "problem", "change"
    status: string,                // State machine controlled
    priority: int,                 // 1-5 (1=highest)
    urgency: int,                  // 1-5 (impact × urgency matrix)
    impact: int,                   // 1-5
    
    // Assignment
    assigned_to: User,
    assigned_team: Team,
    created_by: User,
    updated_by: User,
    
    // Timing
    created_at: datetime,
    updated_at: datetime,
    closed_at: datetime,           // For SLA calculation
    
    // Relationships
    related_assets: [Asset],       // Affected CIs (via edge)
    related_tickets: [Ticket],     // Parent/child (duplicate of, blocks, etc.)
    related_kb_articles: [KnowledgeArticle],  // Suggested solutions
    comments: [TicketComment],     // Via edge
    attachments: [TicketAttachment], // Via edge
    
    // SLA tracking
    sla_timer_id: SLATimer,
    escalation_count: int,
    
    // Audit
    change_log: [object],          // { timestamp, user, field, old_value, new_value }
}

TABLE ticket_comments {
    id: string,
    namespace: string,
    ticket_id: Ticket,
    author: User,
    body: string,                  // Markdown
    is_internal: bool,             // Internal notes (not visible to requester)
    mentions: [User],              // @mentioned users
    created_at: datetime,
    updated_at: datetime,
    deleted_at: datetime,          // Soft delete
}

TABLE ticket_attachments {
    id: string,
    namespace: string,
    ticket_id: Ticket,
    filename: string,
    mime_type: string,
    file_size_bytes: int,
    storage_path: string,          // S3 or local storage path
    uploaded_by: User,
    created_at: datetime,
    scanned_for_malware: bool,     // Security: scan on upload
}

EDGE ticket_has_comment {
    from: Ticket,
    to: TicketComment,
    // For traversal: Ticket ← comments → TicketComment
}

EDGE ticket_has_attachment {
    from: Ticket,
    to: TicketAttachment,
}

EDGE ticket_affects_asset {
    from: Ticket,
    to: Asset,
    confidence: float,             // 0.0-1.0 (ML prediction score)
    manual_link: bool,             // True if user manually linked
}

EDGE ticket_related_to {
    from: Ticket,
    to: Ticket,
    relationship_type: string,     // "blocks", "duplicates", "parent_of"
}

EDGE ticket_references_kb {
    from: Ticket,
    to: KnowledgeArticle,
    link_type: string,             // "suggests_solution", "related_info"
    ranking: int,                  // Order in suggested list
}
```

### 2.3 SLA Management (Phase 1)

```
TABLE sla_policies {
    id: string,
    namespace: string,
    name: string,                  // "Standard Incident SLA"
    description: string,
    is_active: bool,
    
    // Scope
    applies_to_types: [string],    // ["incident", "problem"]
    
    // Matrix: impact × urgency → response/resolution times
    sla_matrix: object,
    // {
    //   "1,1": { response_minutes: 15, resolution_minutes: 60 },
    //   "1,2": { response_minutes: 30, resolution_minutes: 120 },
    //   ...
    // }
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE sla_timers {
    id: string,
    namespace: string,
    ticket_id: Ticket,
    sla_policy_id: SLAPolicy,
    
    // Timeline
    timer_type: string,            // "response", "resolution"
    start_time: datetime,
    target_time: datetime,         // deadline
    pause_time: datetime,          // NULL if not paused
    paused_duration: int,          // In minutes
    
    // Status
    status: string,                // "active", "paused", "completed", "breached"
    breached_at: datetime,         // When SLA first breached
    escalated_at: datetime,        // When escalation was triggered
    escalation_rule_id: EscalationRule,
    
    updated_at: datetime,
}

TABLE escalation_rules {
    id: string,
    namespace: string,
    name: string,                  // "High-Urgency Escalation"
    description: string,
    
    // Trigger conditions
    trigger_priority_gte: int,     // Priority ≥ this value
    trigger_urgency_gte: int,      // Urgency ≥ this value
    trigger_sla_breach: bool,      // On SLA breach
    trigger_minutes_open: int,     // After N minutes open
    
    // Actions
    escalate_to_team: Team,        // Route to escalation team
    escalate_to_role: Role,        // Require someone with this role
    notify_teams: [Team],          // Send notifications
    notify_users: [User],
    add_priority: int,             // Increase priority by this
    add_urgency: int,
    change_status: string,         // Optional state change
    
    // Execution
    is_active: bool,
    max_escalations: int,          // Prevent infinite loops
    cooldown_minutes: int,         // Don't re-trigger for N minutes
    
    created_at: datetime,
    updated_at: datetime,
}
```

### 2.4 Knowledge Base (Phase 1.5)

```
TABLE knowledge_articles {
    id: string,
    namespace: string,
    
    // Metadata
    title: string,
    slug: string,                  // URL-friendly identifier
    description: string,           // Short summary
    body: string,                  // Full content (Markdown)
    status: string,                // "draft", "published", "archived"
    
    // Organization
    category: KnowledgeCategory,
    tags: [string],                // ["networking", "incident", "urgent"]
    
    // Audience
    is_internal: bool,             // Internal only (staff)
    visible_to_roles: [Role],      // Additional role-based visibility
    
    // Versions
    current_version: int,
    version_history: [object],     // { version, created_by, created_at, body }
    
    // SEO & Discovery
    author: User,
    created_at: datetime,
    updated_at: datetime,
    published_at: datetime,
    view_count: int,
    helpful_count: int,            // Feedback: was this helpful?
    
    // Linking
    related_articles: [KnowledgeArticle],  // Via edge
    solution_for_tickets: [Ticket],       // Via edge
}

TABLE knowledge_categories {
    id: string,
    namespace: string,
    name: string,                  // "Incident Management", "Networking"
    slug: string,
    description: string,
    parent_category: KnowledgeCategory,  // Hierarchy
    icon: string,                  // For UI
    display_order: int,
    created_at: datetime,
    updated_at: datetime,
}

EDGE article_in_category {
    from: KnowledgeArticle,
    to: KnowledgeCategory,
}

EDGE article_related_to {
    from: KnowledgeArticle,
    to: KnowledgeArticle,
    relationship_type: string,     // "see_also", "prerequisite"
}
```

### 2.5 CMDB & Assets (Phase 2)

```
TABLE assets {
    id: string,
    namespace: string,
    
    // Identity
    name: string,
    display_label: string,
    asset_type: string,           // "server", "database", "application", "network"
    serial_number: string,        // Optional
    
    // Classification
    category: string,             // "compute", "storage", "networking", "software"
    status: string,               // "active", "inactive", "retired", "in_maintenance"
    owner_team: Team,
    owner_user: User,
    
    // Lifecycle
    acquired_date: datetime,      // When purchased/provisioned
    warranty_expires: datetime,
    depreciation_months: int,     // Accounting
    lifecycle_stage: string,      // "new", "stable", "deprecated"
    
    // Location & Environment
    location: string,             // Data center, office
    environment: string,          // "production", "staging", "development"
    
    // Technical Specs
    specs: object,                // {
                                  //   "cpu": "Intel Xeon E5",
                                  //   "ram_gb": 64,
                                  //   "os": "Ubuntu 22.04"
                                  // }
    
    // Relationships (via edges)
    contained_in: Asset,          // Parent asset (e.g., server in rack)
    contains: [Asset],            // Child assets
    depends_on: [Asset],          // Runtime dependencies
    hosts: [Asset],               // VMs on this host
    
    // Monitoring
    monitoring_enabled: bool,
    monitoring_agent_id: string,
    health_status: string,        // "healthy", "degraded", "critical"
    last_health_check: datetime,
    
    // Audit
    created_at: datetime,
    updated_at: datetime,
    created_by: User,
    updated_by: User,
}

EDGE asset_contained_in {
    from: Asset,
    to: Asset,
    // Represents: this asset is inside/part of another asset
}

EDGE asset_depends_on {
    from: Asset,
    to: Asset,
    // Represents: this asset requires this other asset to function
}

EDGE asset_hosts {
    from: Asset,
    to: Asset,
    // Represents: this asset (hypervisor) runs this other asset (VM)
}

TABLE asset_relationships_custom {
    id: string,
    namespace: string,
    from_asset: Asset,
    to_asset: Asset,
    relationship_name: string,    // Custom: "uses", "manages", "monitors"
    metadata: object,             // Custom properties for this relationship
}
```

### 2.6 Workflows & Approvals (Phase 3)

```
TABLE workflow_definitions {
    id: string,
    namespace: string,
    name: string,                 // "Standard Change Workflow"
    description: string,
    version: int,                 // Versioning
    
    // Scope
    applies_to_types: [string],   // ["change", "request"]
    
    // Definition (stored as JSON/serialized)
    states: [object],             // Array of workflow states
    // [
    //   { id: "draft", name: "Draft", type: "start" },
    //   { id: "approvalneeded", name: "Approval Needed", type: "wait" },
    //   { id: "approved", name: "Approved", type: "normal" },
    //   { id: "implemented", name: "Implemented", type: "end" }
    // ]
    
    transitions: [object],        // State transitions with guards
    // [
    //   {
    //     from: "draft", to: "approvalneeded",
    //     action: "submit_for_approval",
    //     guards: [{ type: "permission", action: "submit:change" }],
    //     on_enter: [{ type: "create_approval", approvers: ["change_manager"] }]
    //   }
    // ]
    
    is_active: bool,
    created_at: datetime,
    updated_at: datetime,
}

TABLE workflow_instances {
    id: string,
    namespace: string,
    definition_id: WorkflowDefinition,
    definition_version: int,      // Snapshot of definition at creation time
    
    // Scope
    entity_type: string,          // "ticket", "request"
    entity_id: string,            // ID of entity this workflow is running on
    
    // Execution
    current_state: string,
    current_state_entered_at: datetime,
    
    // History
    state_history: [object],      // [{ state, entered_at, exited_at, action_taken }]
    
    // Status
    status: string,               // "running", "completed", "failed"
    completed_at: datetime,
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE approval_requests {
    id: string,
    namespace: string,
    
    // Context
    ticket_id: Ticket,
    workflow_instance_id: WorkflowInstance,
    reason: string,               // Why approval needed
    
    // Approval chain
    approval_chain_id: ApprovalChain,
    current_step: int,            // Which step in the chain
    approvers: [User],            // Who needs to approve
    
    // Status
    status: string,               // "pending", "approved", "rejected", "expired"
    approved_by: User,            // Who approved
    approval_comment: string,
    approved_at: datetime,
    
    // Timeline
    created_at: datetime,
    expires_at: datetime,         // SLA for approval
    completed_at: datetime,
}

TABLE approval_chains {
    id: string,
    namespace: string,
    name: string,                 // "Change Advisory Board"
    description: string,
    
    // Workflow
    chain_type: string,           // "sequential", "parallel"
    steps: [object],              // Array of approval steps
    // [
    //   {
    //     step: 1,
    //     approvers: ["change_manager"],
    //     required_approvals: 1,
    //     timeout_hours: 24
    //   },
    //   {
    //     step: 2,
    //     approvers: ["director", "cto"],
    //     required_approvals: 2,
    //     timeout_hours: 48
    //   }
    // ]
    
    is_active: bool,
    created_at: datetime,
}
```

### 2.7 Monitoring & Alerts (Phase 4)

```
TABLE alerts {
    id: string,
    namespace: string,
    
    // Identity
    external_id: string,          // ID from monitoring source (Prometheus, Grafana)
    source_system: string,        // "prometheus", "grafana", "custom"
    source_name: string,          // "prod-prometheus-1"
    
    // Content
    title: string,
    description: string,
    severity: string,             // "critical", "warning", "info"
    
    // Mapping to ITSM
    urgency: int,                 // 1-5 (mapped from severity)
    impact: int,                  // Estimated impact (auto or manual)
    
    // Context
    resource_type: string,        // "server", "database", "application"
    resource_id: string,          // "prod-db-01"
    asset_id: Asset,              // Link to CMDB asset
    
    // Timeline
    triggered_at: datetime,       // When alert first fired
    resolved_at: datetime,        // NULL if still active
    acknowledged_at: datetime,    // When operator acknowledged
    acknowledged_by: User,
    
    // Correlation
    correlation_group_id: string, // Groups related alerts
    correlation_reason: string,   // Why grouped together
    
    // Ticket linking
    ticket_id: Ticket,            // Auto-created or manually linked
    ticket_created: bool,
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE alert_rules {
    id: string,
    namespace: string,
    
    // Matcher
    name: string,                 // "High CPU Alert"
    description: string,
    
    // Condition
    metric_name: string,          // "cpu_usage_percent"
    operator: string,             // ">", ">=", "<", "=", "!="
    threshold: float,             // 85.0
    duration_seconds: int,        // Alert if metric is bad for N seconds
    
    // Scope
    applies_to_resource_types: [string],  // ["server", "database"]
    resource_tags: object,        // Filter by tags: { env: "prod" }
    
    // Actions
    severity_level: string,       // "critical", "warning"
    auto_create_ticket: bool,     // Auto-create incident
    notify_teams: [Team],
    notify_users: [User],
    escalation_minutes: int,      // Auto-escalate if not acknowledged
    
    is_active: bool,
    created_at: datetime,
    updated_at: datetime,
}

EDGE alert_related_to {
    from: Alert,
    to: Alert,
    // Represents: these alerts are related/grouped
}

EDGE alert_triggers_ticket {
    from: Alert,
    to: Ticket,
}
```

### 2.8 Service Catalog & Requests (Phase 5)

```
TABLE service_catalog_items {
    id: string,
    namespace: string,
    
    // Identity
    name: string,                 // "Laptop Provision"
    description: string,
    category: string,             // "Hardware", "Software", "Access"
    
    // Availability
    is_published: bool,
    available_to_roles: [Role],   // Who can request
    available_to_teams: [Team],   // Optional: restrict to teams
    
    // Workflow
    fulfillment_workflow_id: WorkflowDefinition,
    approval_chain_id: ApprovalChain,  // Required approvals
    
    // SLA
    target_fulfillment_hours: int,
    
    // Configuration
    request_form_id: RequestForm,
    icon: string,
    display_order: int,
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE request_forms {
    id: string,
    namespace: string,
    
    // Definition
    title: string,
    fields: [object],             // Form fields with validation
    // [
    //   {
    //     id: "device_type",
    //     label: "Device Type",
    //     type: "select",
    //     options: ["Laptop", "Desktop", "Tablet"],
    //     required: true
    //   },
    //   {
    //     id: "os_preference",
    //     label: "OS Preference",
    //     type: "select",
    //     options: ["Windows", "MacOS", "Linux"],
    //     depends_on: { field: "device_type", values: ["Laptop"] }
    //   }
    // ]
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE service_requests {
    id: string,
    namespace: string,
    number: int,                  // Display number
    
    // Request
    catalog_item_id: ServiceCatalogItem,
    requester: User,
    
    // Data
    form_responses: object,       // User's answers to request form
    // {
    //   "device_type": "Laptop",
    //   "os_preference": "MacOS",
    //   "ram_gb": "16"
    // }
    
    // Fulfillment
    assigned_to_team: Team,
    assigned_to_user: User,
    
    workflow_instance_id: WorkflowInstance,
    status: string,               // "submitted", "in_progress", "fulfilled", "cancelled"
    
    target_completion: datetime,
    completed_at: datetime,
    
    # Linking
    linked_ticket_id: Ticket,     // If created as incident
    
    created_at: datetime,
    updated_at: datetime,
}

TABLE service_request_items {
    id: string,                   // For shopping cart (multiple items)
    namespace: string,
    request_id: ServiceRequest,
    catalog_item_id: ServiceCatalogItem,
    quantity: int,
    form_responses: object,       // Per-item customization
}
```

### 2.9 Notifications (All Phases)

```
TABLE notifications {
    id: string,
    namespace: string,
    
    // Recipient
    recipient_user: User,
    recipient_team: Team,         // Optional: broadcast to team
    
    // Content
    type: string,                 // "sla_breach", "approval_needed", "assignment"
    title: string,
    message: string,
    action_url: string,           // Link in notification
    
    // Status
    read: bool,
    read_at: datetime,
    dismissed: bool,
    
    # Delivery
    delivery_channels: [string],  // ["in_app", "email", "sms"]
    email_sent: bool,
    email_sent_at: datetime,
    sms_sent: bool,
    sms_sent_at: datetime,
    
    created_at: datetime,
    expires_at: datetime,         // Auto-delete old notifications
}

TABLE notification_preferences {
    id: string,
    namespace: string,
    user_id: User,
    
    # By notification type
    sla_breach: object,           // { channels: ["email", "in_app"], enabled: true }
    approval_needed: object,
    assignment: object,
    comment_mention: object,
    ticket_assignment: object,
    
    # Digest preferences
    email_digest_frequency: string,  // "immediately", "daily", "weekly"
    quiet_hours_enabled: bool,
    quiet_hours_start: string,    // "18:00"
    quiet_hours_end: string,      // "09:00"
}
```

### 2.10 Reporting (Phase 6)

```
TABLE reports {
    id: string,
    namespace: string,
    
    // Identity
    name: string,                 // "Monthly SLA Compliance"
    description: string,
    
    // Definition
    report_type: string,          // "standard", "custom", "adhoc"
    query: string,                // SQL query (SurrealDB)
    filters: object,              // { date_range: "last_30_days", team: "L1_support" }
    
    # Visualization
    chart_type: string,           // "line", "bar", "pie", "table"
    group_by: [string],           // Grouping dimensions
    
    // Scheduling
    schedule: string,             // "weekly", "monthly", null for adhoc
    next_run: datetime,
    recipients: [User],           // Email recipients
    
    # Results
    last_generated: datetime,
    last_generated_by: User,
    result_file_path: string,     // CSV export location
    
    is_favorite: bool,
    created_at: datetime,
    updated_at: datetime,
}

TABLE dashboards {
    id: string,
    namespace: string,
    
    // Identity
    name: string,                 // "Service Desk Overview"
    description: string,
    
    // Configuration
    layout: object,               // { columns: 3, rows: 4 }
    widgets: [object],            // Array of widget definitions
    // [
    //   {
    //     id: "widget-1",
    //     type: "metric",
    //     title: "Avg MTTR",
    //     metric_query: "SELECT avg(resolution_minutes) FROM tickets...",
    //     refresh_interval: 300  // seconds
    //   },
    //   {
    //     id: "widget-2",
    //     type: "chart",
    //     title: "Incidents by Priority",
    //     chart_type: "bar"
    //   }
    // ]
    
    is_published: bool,
    visible_to_roles: [Role],
    
    created_at: datetime,
    updated_at: datetime,
}
```

### 2.11 Audit Log (All Phases)

```
TABLE audit_log (Immutable)
{
    id: string,
    namespace: string,
    
    # Actor
    user_id: User,
    user_email: string,           // Snapshot at time of action
    session_id: string,           // Track session
    
    # Action
    action: string,               // "ticket:create", "role:update", "permission:grant"
    entity_type: string,          // "Ticket", "User", "Role"
    entity_id: string,
    
    # Changes
    operation_type: string,       // "CREATE", "UPDATE", "DELETE"
    old_values: object,           // Before state
    new_values: object,           // After state
    
    # Context
    ip_address: string,
    user_agent: string,
    request_id: string,           // Correlation ID
    
    # Timestamp (immutable)
    timestamp: datetime,
    
    # Compliance fields
    is_sensitive: bool,           // Redact in reports
    data_classification: string,  // "public", "confidential"
}

// Immutable: All audit_log records created with DEFINE TABLE ... SCHEMAFULL
// Soft deletes not allowed; records never modified or deleted
```

---

## 3. API Architecture

### 3.1 Design Principles

**URL Structure:**
```
/api/v1/{resource}/{id}/{subresource}/{subid}/...

Examples:
  GET    /api/v1/tickets                    # List tickets
  POST   /api/v1/tickets                    # Create ticket
  GET    /api/v1/tickets/TICK-123           # Get specific ticket
  PATCH  /api/v1/tickets/TICK-123           # Update ticket
  DELETE /api/v1/tickets/TICK-123           # Delete (soft) ticket
  
  GET    /api/v1/tickets/TICK-123/comments          # List comments
  POST   /api/v1/tickets/TICK-123/comments          # Add comment
  PATCH  /api/v1/tickets/TICK-123/comments/COMM-1   # Edit comment
  
  GET    /api/v1/assets/ASSET-1/depends-on         # Asset dependencies
  GET    /api/v1/assets/ASSET-1/hosted-on          # What this asset hosts
```

**Request Format:**
```json
POST /api/v1/tickets
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Database connection timeout",
  "description": "Production database unreachable from app servers",
  "type": "incident",
  "priority": 2,
  "assigned_to": "user-123",
  "tags": ["database", "critical"]
}
```

**Response Format (Success):**
```json
HTTP 201 Created
Content-Type: application/json

{
  "status": "success",
  "data": {
    "id": "TICK-456",
    "number": 456,
    "title": "Database connection timeout",
    "type": "incident",
    "status": "open",
    "priority": 2,
    "created_at": "2025-12-08T22:45:00Z",
    "sla_deadline": "2025-12-08T23:45:00Z"
  },
  "meta": {
    "request_id": "req-xyz789",
    "timestamp": "2025-12-08T22:45:01Z"
  }
}
```

**Response Format (Error):**
```json
HTTP 400 Bad Request
Content-Type: application/json

{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "priority",
        "message": "Priority must be between 1 and 5"
      }
    ]
  },
  "meta": {
    "request_id": "req-xyz789",
    "timestamp": "2025-12-08T22:45:01Z"
  }
}
```

**Error Codes:**
```
2xx: Success
  200 OK                    # Successful GET, PATCH, DELETE
  201 Created              # Successful POST (created new resource)
  204 No Content           # Successful DELETE (no response body)

4xx: Client Error
  400 Bad Request          # Validation failed
  401 Unauthorized         # Missing/invalid JWT
  403 Forbidden            # User lacks permission
  404 Not Found            # Resource doesn't exist
  409 Conflict             # State machine violation (e.g., can't close already-closed ticket)
  429 Too Many Requests    # Rate limit exceeded

5xx: Server Error
  500 Internal Server Error
  503 Service Unavailable  # Database down, maintenance
```

### 3.2 Pagination, Filtering, Sorting

**Query Parameters:**
```
GET /api/v1/tickets?page=2&limit=25&sort=-created_at&filter=status:open&filter=priority:1,2

Query params:
  page              # Page number (1-based), default: 1
  limit             # Items per page, default: 25, max: 100
  sort              # Field to sort by; prefix with '-' for descending
  filter            # Comma-separated filters; can be specified multiple times
  search            # Full-text search across title + description

Response includes pagination metadata:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 25,
    "total": 543,
    "total_pages": 22,
    "has_next": true,
    "has_prev": true
  }
}
```

**Filter Syntax:**
```
# Equality
status:open              → tickets where status = "open"

# Multiple values (OR)
status:open,in_progress  → status = "open" OR status = "in_progress"

# Comparison operators
priority>=2              → priority >= 2
created_at>2025-12-01    → created_at > 2025-12-01T00:00:00Z

# Nested field
assigned_team.name:L1Support  → tickets in team named "L1Support"
```

### 3.3 Authentication & Authorization

**JWT Token Structure:**
```json
// Header
{
  "alg": "RS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "user-123",
  "email": "alice@company.com",
  "tenant_id": "tenant-abc",
  "roles": ["incident_manager", "approver"],
  "permissions": ["create:ticket", "approve:change", "view:knowledge"],
  "iat": 1733711100,
  "exp": 1733797500,  // 24 hours
  "iss": "https://archer.company.com",
  "jti": "token-xyz789"  // Token ID for revocation tracking
}

// Signature
RSASHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  private_key
)
```

**Request Authentication:**
```
GET /api/v1/tickets
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

// Backend flow:
1. Extract token from Authorization header
2. Validate signature (using public key)
3. Check expiration (exp claim)
4. Check blacklist (if token revoked)
5. Extract tenant_id and user_id from claims
6. Add to request context for later authorization checks
```

**Refresh Token Flow:**
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh-token-here"
}

// Response
{
  "status": "success",
  "data": {
    "access_token": "new-jwt-token",
    "refresh_token": "new-refresh-token",  // Rotated
    "expires_in": 86400  // seconds until expiration
  }
}
```

**Role-Based Access Control (RBAC) Middleware:**
```
// Check permission before handler executes
#[post("/api/v1/tickets")]
#[requires_permission("create:ticket")]
async fn create_ticket(...) -> ... {
  // Only executed if user has "create:ticket" permission
}

// Permission structure
Permission {
  action: "create" | "read" | "update" | "delete",
  resource: "ticket" | "asset" | "user" | "*",
  conditions: Optional<Map<String, String>>
}

// Examples:
"create:ticket"           → Can create any ticket
"read:ticket"             → Can read any ticket
"delete:ticket"           → Can delete any ticket (soft delete)
"approve:change"          → Can approve change requests
"*:*"                     → Admin (all permissions)
"read:ticket:status=open" → Can only read open tickets
```

### 3.4 Core API Endpoints

**Authentication:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/validate
POST   /api/v1/auth/mfa/setup       (Phase 2+)
POST   /api/v1/auth/mfa/verify      (Phase 2+)
```

**Users & Teams:**
```
GET    /api/v1/users               # List all users
POST   /api/v1/users               # Create user (admin only)
GET    /api/v1/users/me            # Get current user
GET    /api/v1/users/{id}          # Get user details
PATCH  /api/v1/users/{id}          # Update user
DELETE /api/v1/users/{id}          # Soft delete user

GET    /api/v1/teams               # List teams
POST   /api/v1/teams               # Create team
GET    /api/v1/teams/{id}          # Get team details
PATCH  /api/v1/teams/{id}          # Update team
POST   /api/v1/teams/{id}/members  # Add team member
DELETE /api/v1/teams/{id}/members/{user_id}  # Remove member
```

**Roles & Permissions:**
```
GET    /api/v1/roles               # List roles
POST   /api/v1/roles               # Create role
GET    /api/v1/roles/{id}          # Get role details
PATCH  /api/v1/roles/{id}          # Update role
DELETE /api/v1/roles/{id}          # Delete role

GET    /api/v1/roles/{id}/permissions    # List permissions for role
POST   /api/v1/roles/{id}/permissions    # Grant permission to role
DELETE /api/v1/roles/{id}/permissions/{perm_id}  # Revoke

GET    /api/v1/permissions         # List all permissions
POST   /api/v1/permissions         # Create permission
GET    /api/v1/permissions/{id}    # Get permission details

POST   /api/v1/users/{id}/assign-role     # Assign role to user
DELETE /api/v1/users/{id}/revoke-role     # Revoke role from user
```

**Tickets (Incidents, Problems, Changes, Requests):**
```
GET    /api/v1/tickets             # List all tickets (filterable, sortable, paginated)
POST   /api/v1/tickets             # Create new ticket
GET    /api/v1/tickets/{id}        # Get ticket details
PATCH  /api/v1/tickets/{id}        # Update ticket (status, priority, assignment, etc.)
DELETE /api/v1/tickets/{id}        # Soft delete ticket

# Comments
GET    /api/v1/tickets/{id}/comments      # List comments
POST   /api/v1/tickets/{id}/comments      # Add comment
PATCH  /api/v1/tickets/{id}/comments/{cid}  # Edit comment
DELETE /api/v1/tickets/{id}/comments/{cid}  # Delete comment

# Attachments
GET    /api/v1/tickets/{id}/attachments     # List attachments
POST   /api/v1/tickets/{id}/attachments     # Upload attachment
DELETE /api/v1/tickets/{id}/attachments/{aid}  # Delete attachment

# State transitions
POST   /api/v1/tickets/{id}/transition     # POST with action + comment
# e.g., { action: "escalate", comment: "Escalating to L2" }

# Linking
POST   /api/v1/tickets/{id}/relate          # Link to another ticket
POST   /api/v1/tickets/{id}/affected-assets # Link affected CI
```

**SLA Management:**
```
GET    /api/v1/sla/policies        # List SLA policies
POST   /api/v1/sla/policies        # Create SLA policy
GET    /api/v1/sla/policies/{id}   # Get policy details
PATCH  /api/v1/sla/policies/{id}   # Update policy

GET    /api/v1/sla/timers          # List active SLA timers
GET    /api/v1/sla/timers/{id}     # Get timer details (shows countdown)

GET    /api/v1/escalation-rules    # List escalation rules
POST   /api/v1/escalation-rules    # Create rule
PATCH  /api/v1/escalation-rules/{id}  # Update rule
DELETE /api/v1/escalation-rules/{id}  # Delete rule
```

**Knowledge Base:**
```
GET    /api/v1/knowledge           # List articles
POST   /api/v1/knowledge           # Create article
GET    /api/v1/knowledge/{id}      # Get article
PATCH  /api/v1/knowledge/{id}      # Update article (new version)
DELETE /api/v1/knowledge/{id}      # Soft delete article

GET    /api/v1/knowledge/{id}/versions    # Article version history
GET    /api/v1/knowledge/{id}/versions/{v} # Specific version
POST   /api/v1/knowledge/{id}/restore    # Restore to previous version

GET    /api/v1/knowledge/categories      # List categories
POST   /api/v1/knowledge/categories      # Create category
GET    /api/v1/knowledge/search?q=...    # Full-text search
GET    /api/v1/knowledge/{id}/related    # Related articles
```

**Assets & CMDB:**
```
GET    /api/v1/assets              # List assets (filterable by type, status, team)
POST   /api/v1/assets              # Create asset
GET    /api/v1/assets/{id}         # Get asset details
PATCH  /api/v1/assets/{id}         # Update asset
DELETE /api/v1/assets/{id}         # Soft delete asset

GET    /api/v1/assets/{id}/depends-on     # Assets this one depends on
GET    /api/v1/assets/{id}/contained-in   # Parent asset (if any)
GET    /api/v1/assets/{id}/contains       # Child assets
GET    /api/v1/assets/{id}/hosts          # VMs on this host
GET    /api/v1/assets/{id}/related-tickets # Associated incidents
GET    /api/v1/assets/{id}/health         # Health status + metrics

POST   /api/v1/assets/{id}/relationships  # Create custom relationship
DELETE /api/v1/assets/{from}/relationships/{to}  # Delete relationship

GET    /api/v1/cmdb/graph/{id}     # Get asset with full dependency graph
GET    /api/v1/cmdb/impact/{id}    # What's affected if this asset goes down
```

**Workflows & Approvals:**
```
GET    /api/v1/workflows           # List workflow definitions
POST   /api/v1/workflows           # Create workflow
GET    /api/v1/workflows/{id}      # Get workflow details
PATCH  /api/v1/workflows/{id}      # Update workflow (creates new version)
DELETE /api/v1/workflows/{id}      # Soft delete workflow

GET    /api/v1/workflows/{id}/instances     # List instances
GET    /api/v1/workflows/{id}/instances/{i} # Get instance execution history

POST   /api/v1/approvals            # List approval requests for current user
GET    /api/v1/approvals/{id}       # Get approval details
POST   /api/v1/approvals/{id}/approve  # Approve (with optional comment)
POST   /api/v1/approvals/{id}/reject    # Reject (with required reason)
```

**Alerts & Monitoring:**
```
GET    /api/v1/alerts              # List alerts (filterable by severity, status)
GET    /api/v1/alerts/{id}         # Get alert details
PATCH  /api/v1/alerts/{id}         # Acknowledge or resolve alert

POST   /api/v1/alerts/ingest       # Webhook for alert ingestion (no auth required? or special token?)
GET    /api/v1/alerts/correlations # List alert groups

GET    /api/v1/alert-rules         # List alert rules
POST   /api/v1/alert-rules         # Create rule
PATCH  /api/v1/alert-rules/{id}    # Update rule
DELETE /api/v1/alert-rules/{id}    # Delete rule
POST   /api/v1/alert-rules/{id}/test  # Test rule (dry run)
```

**Service Catalog & Requests:**
```
GET    /api/v1/catalog             # List catalog items (visible to requester)
GET    /api/v1/catalog/{id}        # Get item details (with form schema)

GET    /api/v1/requests            # List user's requests
POST   /api/v1/requests            # Submit new request
GET    /api/v1/requests/{id}       # Get request details
PATCH  /api/v1/requests/{id}       # Update request (e.g., cancel)

GET    /api/v1/requests/{id}/history  # Fulfillment progress
```

**Reporting & Analytics:**
```
GET    /api/v1/reports             # List reports
POST   /api/v1/reports             # Create report (custom query)
GET    /api/v1/reports/{id}        # Get report definition
GET    /api/v1/reports/{id}/run    # Execute report (returns data)
POST   /api/v1/reports/{id}/export # Export as CSV/PDF

GET    /api/v1/dashboards          # List dashboards
GET    /api/v1/dashboards/{id}     # Get dashboard definition
GET    /api/v1/dashboards/{id}/data # Get widget data (for rendering)

# Built-in metrics (always available)
GET    /api/v1/metrics/sla-compliance         # SLA % over time
GET    /api/v1/metrics/mttr                   # Mean time to resolve
GET    /api/v1/metrics/tickets-by-priority    # Ticket volume breakdown
GET    /api/v1/metrics/asset-health          # Asset status overview
```

**Audit & Compliance:**
```
GET    /api/v1/audit-logs          # Get audit log (filterable by action, user, date)
GET    /api/v1/audit-logs?action=ticket:create&user=user-123&since=2025-12-01

GET    /api/v1/compliance/export   # Export compliance data (JSON/CSV)
POST   /api/v1/compliance/report   # Generate compliance report
```

---

## 4. Frontend Architecture

### 4.1 Application Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── design-tokens.css         # Purple Glass tokens
│
├── src/
│   ├── index.tsx                 # App entry point
│   ├── App.tsx                   # Root component + routing
│   │
│   ├── config/
│   │   ├── api.config.ts         # API base URL, defaults
│   │   ├── auth.config.ts        # JWT settings, token refresh interval
│   │   └── theme.config.ts       # Dark/light theme config
│   │
│   ├── types/
│   │   ├── index.ts              # Barrel export
│   │   ├── api.ts                # API response shapes
│   │   ├── domain.ts             # Business domain types (Ticket, Asset, etc.)
│   │   ├── ui.ts                 # UI component props
│   │   └── auth.ts               # JWT payload, user context
│   │
│   ├── state/
│   │   ├── auth.store.ts         # Zustand: auth state (user, jwt, permissions)
│   │   ├── notifications.store.ts # In-app notifications
│   │   ├── ui.store.ts           # Theme, sidebar state, modals
│   │   └── cache.store.ts        # Local cache of frequently-accessed data
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Access auth context
│   │   ├── useApi.ts             # API client with error handling
│   │   ├── useForm.ts            # Form state + validation
│   │   ├── useTicketForm.ts      # Ticket-specific form logic
│   │   ├── usePagination.ts      # List pagination
│   │   ├── useNotifications.ts    # Toast/notification management
│   │   └── useDebounce.ts        # Debounce hook for search
│   │
│   ├── api/
│   │   ├── client.ts             # Axios instance with auth interceptor
│   │   ├── endpoints.ts          # API URL constants
│   │   ├── auth.api.ts           # Auth endpoints
│   │   ├── tickets.api.ts        # Ticket endpoints
│   │   ├── assets.api.ts         # Asset endpoints
│   │   ├── knowledge.api.ts      # KB endpoints
│   │   └── ... (one per domain)
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MainContent.tsx
│   │   │   │
│   │   │   ├── Form/
│   │   │   │   ├── TextInput.tsx
│   │   │   │   ├── SelectInput.tsx
│   │   │   │   ├── TextArea.tsx
│   │   │   │   ├── DateInput.tsx
│   │   │   │   └── FormGroup.tsx
│   │   │   │
│   │   │   ├── Table/
│   │   │   │   ├── Table.tsx       # Generic sortable, paginated table
│   │   │   │   ├── Column.tsx
│   │   │   │   └── TablePagination.tsx
│   │   │   │
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── Drawer.tsx
│   │   │   │
│   │   │   ├── Filters/
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── FilterChip.tsx
│   │   │   │   └── DateRangePicker.tsx
│   │   │   │
│   │   │   ├── Card/
│   │   │   │   └── PurpleGlassCard.tsx  # Purple Glass design
│   │   │   │
│   │   │   └── Notifications/
│   │   │       ├── Toast.tsx
│   │   │       ├── Toast Container.tsx
│   │   │       └── InlineAlert.tsx
│   │   │
│   │   ├── ServiceDesk/
│   │   │   ├── TicketList.tsx      # List/Kanban toggle
│   │   │   ├── TicketCard.tsx      # Single ticket card
│   │   │   ├── TicketDetail.tsx    # Full ticket view
│   │   │   ├── TicketForm.tsx      # Create/edit ticket
│   │   │   ├── CommentThread.tsx   # Comments section
│   │   │   ├── AttachmentUpload.tsx
│   │   │   └── SLABadge.tsx        # Visual SLA status
│   │   │
│   │   ├── CMDB/
│   │   │   ├── AssetList.tsx
│   │   │   ├── AssetDetail.tsx
│   │   │   ├── DependencyGraph.tsx # Visualization
│   │   │   ├── AssetForm.tsx
│   │   │   └── AssetRelationships.tsx
│   │   │
│   │   ├── KnowledgeBase/
│   │   │   ├── ArticleSearch.tsx
│   │   │   ├── ArticleDetail.tsx
│   │   │   ├── ArticleEditor.tsx
│   │   │   ├── ArticleList.tsx
│   │   │   └── CategoryBrowser.tsx
│   │   │
│   │   ├── Approvals/
│   │   │   ├── ApprovalList.tsx
│   │   │   ├── ApprovalDetail.tsx
│   │   │   └── ApprovalActions.tsx
│   │   │
│   │   ├── Catalog/
│   │   │   ├── CatalogBrowser.tsx
│   │   │   ├── RequestForm.tsx
│   │   │   └── RequestList.tsx
│   │   │
│   │   ├── Reports/
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── Widget.tsx
│   │   │   ├── Chart.tsx
│   │   │   └── ReportBuilder.tsx
│   │   │
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── MFASetup.tsx (future)
│   │   │
│   │   └── Admin/
│   │       ├── UserManagement.tsx
│   │       ├── RoleManagement.tsx
│   │       ├── PermissionMatrix.tsx
│   │       └── AuditLogViewer.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── ServiceDesk.tsx
│   │   ├── CMDB.tsx
│   │   ├── KnowledgeBase.tsx
│   │   ├── Catalog.tsx
│   │   ├── Approvals.tsx
│   │   ├── Reporting.tsx
│   │   ├── Admin.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   └── Unauthorized.tsx
│   │
│   ├── utils/
│   │   ├── format.ts              # Formatting (dates, numbers, etc.)
│   │   ├── validation.ts          # Form/input validation
│   │   ├── shortcuts.ts           # Keyboard shortcut handling
│   │   ├── permissions.ts         # Permission checking helpers
│   │   └── api-errors.ts          # Error handling utilities
│   │
│   ├── styles/
│   │   ├── index.css              # Global styles
│   │   ├── variables.css          # Design tokens, theme variables
│   │   ├── purple-glass.css       # Glassmorphism styles
│   │   └── responsive.css         # Media queries
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Auth guard for routes
│   │   └── permission.middleware.ts # Permission checking
│   │
│   └── Context/
│       ├── AuthContext.tsx        # Auth context (user, isAuthenticated)
│       └── NotificationContext.tsx # Notification context
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### 4.2 State Management Strategy

**Zustand Stores:**

```typescript
// auth.store.ts
import { create } from 'zustand';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  permissions: string[];
  roles: Role[];
  tenant_id: string;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  setUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  permissions: [],
  roles: [],
  tenant_id: localStorage.getItem('tenant_id') || '',
  
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('tenant_id', user.namespace);
    
    set({
      isAuthenticated: true,
      user,
      token: access_token,
      refreshToken: refresh_token,
      permissions: user.permissions,
      roles: user.roles,
      tenant_id: user.namespace
    });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false, user: null, token: null });
  },
  
  hasPermission: (permission: string) => {
    return get().permissions.includes(permission);
  },
  
  hasRole: (role: string) => {
    return get().roles.some(r => r.name === role);
  }
}));
```

**Context API (Auth Context Only):**

```typescript
// AuthContext.tsx
// Use for: user data that needs to be accessed deeply nested
// Avoid: every piece of state (performance issues)

export const AuthContext = createContext<{
  isLoading: boolean;
  error: Error | null;
} | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Load user from localStorage on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Validate token
      validateToken(token)
        .then(() => setIsLoading(false))
        .catch(err => {
          setError(err);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Local Component State:**

```typescript
// TicketForm.tsx
// Use React.useState for: form field values, form validation state, modals

const [formData, setFormData] = useState<TicketFormData>({
  title: '',
  description: '',
  type: 'incident',
  priority: 3
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    await ticketsApi.create(formData);
    // Success feedback
  } catch (error) {
    setErrors(parseErrors(error));
  } finally {
    setIsSubmitting(false);
  }
};
```

### 4.3 Routing Structure

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingScreen />;
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          {/* Layout wrapper */}
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            {/* Service Desk */}
            <Route path="/service-desk" element={<ServiceDeskPage />} />
            <Route path="/service-desk/tickets/:id" element={<TicketDetail />} />
            
            {/* CMDB */}
            <Route path="/cmdb/assets" element={<AssetListPage />} />
            <Route path="/cmdb/assets/:id" element={<AssetDetailPage />} />
            
            {/* Knowledge Base */}
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/knowledge/articles/:id" element={<ArticleDetailPage />} />
            
            {/* Catalog */}
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/request/:itemId" element={<RequestFormPage />} />
            <Route path="/requests" element={<MyRequestsPage />} />
            
            {/* Approvals */}
            <Route path="/approvals" element={<ApprovalsPage />} />
            
            {/* Reporting */}
            <Route path="/reports" element={<ReportingPage />} />
            
            {/* Admin */}
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </Route>
        </Route>
        
        {/* Error routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4.4 API Client Pattern

```typescript
// api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../state/auth.store';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token to all requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add request ID for tracing
  config.headers['X-Request-ID'] = generateRequestId();
  
  return config;
});

// Response interceptor: Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await useAuthStore.getState().refreshAccessToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Typed wrapper for common patterns
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiClient.get<{ status: 'success'; data: T }>(url);
  return response.data.data;
}

export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  const response = await apiClient.post<{ status: 'success'; data: T }>(url, data);
  return response.data.data;
}

export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const response = await apiClient.patch<{ status: 'success'; data: T }>(url, data);
  return response.data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await apiClient.delete(url);
}
```

### 4.5 Component Pattern: Tickets List

```typescript
// TicketList.tsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../state/auth.store';
import { ticketsApi } from '../api/tickets.api';
import { useNotifications } from '../hooks/useNotifications';
import { Table, FilterPanel, Pagination } from '../components/shared';

interface TicketListProps {
  viewMode?: 'list' | 'kanban';
}

export function TicketList({ viewMode = 'list' }: TicketListProps) {
  // State
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useNotifications();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    status: ['open', 'in_progress'],
    priority: [1, 2, 3],
    assigned_to: null as string | null
  });
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  
  const [sortBy, setSortBy] = useState('-created_at');
  
  // Effects
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchTickets();
  }, [isAuthenticated, filters, page, sortBy]);
  
  // API Call
  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ticketsApi.list({
        ...filters,
        page,
        limit: pageSize,
        sort: sortBy
      });
      
      setTickets(response.data);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
      addNotification('error', 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handlers
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
  };
  
  const handleSort = (column: string) => {
    setSortBy(sortBy === column ? `-${column}` : column);
  };
  
  const handleSelectTicket = (ticketId: string) => {
    // Navigate to ticket detail
    window.location.href = `/service-desk/tickets/${ticketId}`;
  };
  
  // Render
  if (error && !isLoading) {
    return <InlineAlert type="error" message={error} />;
  }
  
  return (
    <div className="ticket-list">
      <FilterPanel
        filters={filters}
        onChange={handleFilterChange}
        isLoading={isLoading}
      />
      
      {viewMode === 'list' ? (
        <>
          <Table
            columns={[
              { key: 'number', label: 'ID', sortable: true, width: '100px' },
              { key: 'title', label: 'Title', sortable: true },
              { key: 'status', label: 'Status', sortable: true, width: '120px' },
              { key: 'priority', label: 'Priority', sortable: true, width: '100px' },
              { key: 'assigned_to', label: 'Assigned', sortable: true, width: '150px' },
              { key: 'sla_deadline', label: 'SLA Deadline', sortable: true, width: '150px' }
            ]}
            data={tickets}
            isLoading={isLoading}
            onSort={handleSort}
            onRowClick={(row) => handleSelectTicket(row.id)}
          />
          
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      ) : (
        <KanbanView tickets={tickets} onTicketClick={handleSelectTicket} />
      )}
    </div>
  );
}
```

---

## 5. Security Architecture

### 5.1 Authentication & Token Management

**JWT Lifecycle:**
```
User logs in
  ↓
POST /api/v1/auth/login { email, password }
  ↓
Backend validates credentials (bcrypt check)
  ↓
Generate access token (RS256, 24h expiry)
  ↓
Generate refresh token (longer TTL, stored in DB)
  ↓
Return both tokens to frontend
  ↓
Frontend stores in localStorage (secure, HttpOnly not possible in browser)
  ↓
All subsequent requests include Authorization: Bearer <access_token>
  ↓
If access token expires (401 response):
  - POST /api/v1/auth/refresh { refresh_token }
  - Backend validates refresh token
  - Issue new access token
  - Optionally rotate refresh token
  ↓
On logout:
  - Frontend deletes localStorage tokens
  - Backend blacklists refresh token (optional, for security)
```

### 5.2 RBAC Implementation

**Permission Resolution:**
```
Request arrives with JWT token containing:
{
  "sub": "user-123",
  "roles": ["incident_manager", "approver"],
  "permissions": ["create:ticket", "approve:change"]
}

Before executing handler, middleware checks:

1. Is user authenticated?
   - Valid JWT? ✓
   - Token not expired? ✓
   - Token not revoked? ✓

2. Extract tenant from token (prevents cross-tenant access)
   - All subsequent queries scoped to tenant

3. Does user have required permission?
   - @requires_permission("create:ticket")
   - Check user.permissions contains "create:ticket" ✓
   
4. Any conditional permission?
   - @requires_permission("read:ticket", conditions: { status: "open" })
   - At runtime, apply filters: WHERE status = "open"
```

### 5.3 Audit Logging

**Every mutation logged:**
```
User creates ticket:
  ↓
INSERT INTO ticket { ... }
  ↓
INSERT INTO audit_log {
  user_id: "user-123",
  action: "ticket:create",
  entity_type: "Ticket",
  entity_id: "TICK-456",
  old_values: null,  // No old state for create
  new_values: {
    title: "Database timeout",
    status: "open",
    priority: 2,
    ...
  },
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0...",
  timestamp: "2025-12-08T22:45:00Z"
}
  ↓
Audit log is immutable (never deleted/updated)

Compliance check: SELECT * FROM audit_log WHERE action = 'ticket:delete'
  → Shows who deleted what, when, from which IP
```

### 5.4 Data Protection

**Encryption:**
```
- Passwords: bcrypt (Rust bcrypt crate)
- Sensitive fields in transit: HTTPS/TLS 1.3
- Attachments: Store in S3 (encrypted at rest)
- Database: SurrealDB with TLS connections
- Session tokens: Sent over HTTPS only
```

**Multi-Tenancy Isolation:**
```
Every query includes tenant_id filter:

// Correct
SELECT * FROM tickets WHERE namespace = :tenant_id AND status = 'open'

// NEVER
SELECT * FROM tickets WHERE status = 'open'  // Would leak tenant B data

// Enforce at middleware level
async fn require_tenant(
  tenant_from_jwt: &str,
  tenant_from_query: &str
) -> Result<(), Error> {
  if tenant_from_jwt != tenant_from_query {
    return Err(Error::TenantMismatch);  // Fail fast
  }
  Ok(())
}
```

---

## 6. Integration Architecture

### 6.1 Module Integration Map

```
CMDB / Assets
    ↑
    └─→ linked to Tickets (affected CI)
        └─→ links to Monitoring (health status)
        
Tickets (Service Desk)
    ├─→ linked to Assets (affected CI)
    ├─→ linked to KnowledgeArticles (suggested solutions)
    ├─→ triggers Workflow (state transitions)
    ├─→ uses SLA (timers, escalation)
    ├─→ triggers Alert → Ticket (auto-creation)
    └─→ can become Service Request
    
Workflows
    ├─→ trigger Notifications
    ├─→ route to Approvals
    └─→ can auto-transition Tickets
    
Approvals
    ├─→ linked to Workflows
    ├─→ trigger Notifications
    └─→ block Workflow until complete
    
KnowledgeBase
    ├─→ linked to Tickets (solution)
    └─→ linked to other Articles (related)
    
Alerts (Monitoring)
    ├─→ auto-create Tickets
    ├─→ link to Assets
    └─→ correlation groups
    
Service Catalog
    ├─→ requests use Workflows
    ├─→ requests become Tickets
    └─→ requests use Approvals
    
Reporting
    └─→ aggregates all the above
```

### 6.2 Event System Design

**Event Types & Flows:**

```
Phase 1 Events:
- ticket.created          → Trigger SLA timer creation
                         → Check KB for similar articles
                         → Notify assigned team
                         
- ticket.status_changed   → Update related workflows
                         → Check SLA milestone (e.g., moved to "resolved")
                         → Notify stakeholders
                         
- ticket.assigned         → Send notification to assignee
                         → Update team queue

Phase 3 Events:
- workflow.state_changed  → If state requires approval: create ApprovalRequest
                         → If state has on_enter actions: execute them
                         
- approval.approved       → Move workflow to next state
                         → Trigger workflow.state_changed event (chain)

Phase 4 Events:
- alert.triggered         → Check correlation rules
                         → If no related alert: create new ticket
                         → Notify on-call engineer
                         
- alert.correlated        → Update alert group
                         → Link all to same ticket
                         → Escalate if group reaches critical threshold

Phase 1.5 Events:
- kb_article.created      → Reindex for FTS
                         → Notify subscribers if in their interest area
                         
- kb_article.updated      → Create version record
                         → Reindex FTS
                         → Notify subscribers (optional)
```

**Event Handling Pattern (Async):**

```
Rust backend using channels/queues:

1. Event published (e.g., ticket.created)
2. Event handler receives: { type, entity_id, data, timestamp }
3. Handlers are async, non-blocking:
   - SLA handler: Create SLATimer record
   - KB handler: Search for similar articles, link if found
   - Notification handler: Queue email/in-app notification
4. Frontend (optional): Subscribe to WebSocket for real-time updates
   - Other users viewing same ticket see changes live
```

---

## 7. Implementation Order & Dependencies

### 7.1 Critical Path

```
MUST DO FIRST (Phase 0):
  1. Auth endpoints (login, logout, refresh)
  2. User/Role/Permission models + CRUD
  3. RBAC middleware (check permissions on every endpoint)
  4. Audit logging for all mutations
  
CAN DO NEXT (Phase 1):
  5. Ticket CRUD (already partially done)
  6. Ticket status state machine
  7. SLA policy + SLA timer engine
  8. Escalation rules + background job
  9. Comments + attachments for tickets
  10. Service Desk UI
  
THEN (Phase 2+):
  11. Assets/CMDB relationships
  12. Knowledge Base
  13. Workflows + approvals
  14. Alerts + monitoring integration
  15. Service catalog + requests
  16. Reporting + dashboards
```

### 7.2 Dependency Graph

```
Phase 0 (Auth/RBAC) ←── EVERYTHING else depends on this
    ↓
Phase 1 (Tickets + SLA) ←── Knowledge Base, Assets, Approvals
    ├── Phase 1.5 (KB)
    ├── Phase 2 (Assets/CMDB)
    │   └── Phase 4 (Monitoring/Alerts)
    ├── Phase 3 (Workflows/Approvals)
    │   └── Phase 5 (Catalog/Requests)
    └── Phase 6 (Reporting) ←── All others (aggregates all data)
```

---

## Appendix: Design Tokens (Purple Glass)

**Color Palette:**
```css
:root {
  /* Backgrounds */
  --color-bg-primary: #0d1117;      /* Dark: darkest bg */
  --color-bg-secondary: #161b22;    /* Dark: raised surfaces */
  --color-bg-tertiary: #21262d;     /* Dark: card backgrounds */
  --color-bg-glass: rgba(33, 38, 45, 0.8);  /* Glassmorphism: semi-transparent */
  
  /* Foreground */
  --color-fg-primary: #c9d1d9;      /* Text: primary */
  --color-fg-secondary: #8b949e;    /* Text: secondary/muted */
  --color-fg-tertiary: #6e7681;     /* Text: very muted */
  
  /* Brand Purple */
  --color-purple-primary: #a371f7;  /* Purple main */
  --color-purple-light: #d2a8ff;    /* Purple light */
  --color-purple-dark: #6f42c1;     /* Purple dark */
  
  /* Status Colors */
  --color-status-error: #f85149;    /* Red: errors, critical */
  --color-status-warning: #d29922;  /* Yellow: warnings */
  --color-status-success: #3fb950;  /* Green: success */
  --color-status-info: #58a6ff;     /* Blue: informational */
  
  /* Borders */
  --color-border-primary: #30363d;
  --color-border-secondary: #21262d;
  
  /* SLA Status */
  --color-sla-healthy: #3fb950;     /* Green: on-track */
  --color-sla-warning: #d29922;     /* Yellow: at-risk */
  --color-sla-breached: #f85149;    /* Red: breached */
}

/* Light theme (optional) */
@media (prefers-color-scheme: light) {
  :root {
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f6f8fa;
    --color-fg-primary: #24292f;
    --color-fg-secondary: #57606a;
    /* ... etc */
  }
}
```

**Typography:**
```css
body {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }
h4 { font-size: 1rem; font-weight: 600; }
```

**Spacing Scale:**
```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 40px;
--space-8: 48px;
```

---

## Next Steps & Review Checklist

**Complete Before Starting Development:**
- [ ] Obtain stakeholder approval on phasing
- [ ] Design detailed SurrealDB schema (test for query performance)
- [ ] Create API contract document (OpenAPI/Swagger)
- [ ] Review RBAC role templates (incident_manager, approver, kb_admin, etc.)
- [ ] Design state machines for all ticket types
- [ ] Plan monitoring/observability (logging, tracing, metrics)

**Success Criteria:**
- ✅ Phase 0 allows only authenticated users to access system
- ✅ RBAC enforces all permission checks
- ✅ All mutations logged to audit_log
- ✅ Zero security vulnerabilities in auth flow
- ✅ <50ms permission check overhead

---

**End of Target Architecture Document**

---

This document provides the complete system architecture blueprint. The companion document **FULLSTACK_DEVELOPMENT_PLAN.md** contains low-level implementation details, sprint breakdowns, and SQL schema definitions.

