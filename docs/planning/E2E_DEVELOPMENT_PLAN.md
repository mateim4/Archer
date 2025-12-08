# Archer ITSM: End-to-End Development Plan

**Document Status:** Strategic Roadmap  
**Created:** December 2025  
**Reference:** `CMO_FMO_GAP_ANALYSIS.md`

---

## Executive Summary

This document outlines a **16-week development plan** to transform Archer from its current state (infrastructure-focused tooling with mocked ITSM features) into a **production-ready ITSM platform** that delivers on the "Modern ServiceNow Alternative" vision.

### Strategic Priorities

1. **Foundation First:** Authentication, RBAC, and data integrity before features
2. **Mock → Real:** Connect existing UIs to real backend data
3. **Core ITSM Pillars:** Tickets, KB, SLA, Workflows must all work E2E
4. **AI as Augmentation:** AI features enhance but don't replace core functionality

---

## Development Phases Overview

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 0** | Week 1-2 | Foundation | Auth, RBAC, Audit Logging |
| **Phase 1** | Week 3-6 | Core ITSM | Tickets E2E, SLA Engine, KB |
| **Phase 2** | Week 7-10 | Automation | Workflows, Notifications, Catalog |
| **Phase 3** | Week 11-14 | Integration | Monitoring, Reporting, AI Integration |
| **Phase 4** | Week 15-16 | Polish | Testing, Performance, Documentation |

---

## Phase 0: Foundation (Week 1-2)

**Theme:** "You can't build a house on sand"

### 0.1 Authentication System

**Why Critical:** Every other feature depends on knowing who the user is.

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| User model + migration | Create `users` table schema | — | 2h |
| Password hashing (Argon2) | Implement in Rust | — | 2h |
| JWT token generation | Session management | — | 3h |
| Login API | `POST /api/v1/auth/login` | LoginView | 4h |
| Token refresh | `POST /api/v1/auth/refresh` | AuthContext | 2h |
| Logout | `POST /api/v1/auth/logout` | Integration | 1h |
| Protected route middleware | Axum middleware | Route guards | 3h |

**Deliverable:** Users can login, receive JWT, and access protected routes.

### 0.2 Role-Based Access Control (RBAC)

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| Role model | `roles` table: Admin, Manager, Agent, Viewer | — | 2h |
| Permission model | `permissions` table with resource/action pairs | — | 3h |
| User-Role assignment | Many-to-many relation | — | 2h |
| Permission check middleware | Check permissions per endpoint | — | 4h |
| Role management UI | — | RoleManagementView | 4h |
| User management UI | — | UserManagementView | 4h |

**Deliverable:** Admins can create users, assign roles, and permissions are enforced.

### 0.3 Audit Logging

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| AuditLog model | `audit_log` table with who/what/when | — | 2h |
| Audit middleware | Auto-log all mutations | — | 3h |
| Audit API | `GET /api/v1/audit` with filters | — | 2h |
| Audit viewer UI | — | AuditLogView | 3h |

**Deliverable:** All data changes are logged with user attribution.

### Phase 0 Total: ~43 hours (2 weeks at 20h/week)

---

## Phase 1: Core ITSM (Week 3-6)

**Theme:** "Make the mockups real"

### 1.1 Ticket System Enhancement

**Current State:** Basic CRUD exists, falls back to mock data  
**Target State:** Full ticket lifecycle with real data

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Ticket Comments** | | | |
| TicketComment model | `ticket_comments` table | — | 2h |
| Comments CRUD API | `POST/GET /tickets/{id}/comments` | — | 3h |
| Comments UI | — | Conversation thread in TicketDetailView | 4h |
| **Ticket Attachments** | | | |
| Attachment model | `ticket_attachments` table + file storage | — | 3h |
| File upload API | `POST /tickets/{id}/attachments` | — | 4h |
| Attachment UI | — | File upload component | 3h |
| **Ticket Assignment** | | | |
| Assignment rules model | `assignment_rules` table | — | 2h |
| Auto-assign logic | Match rules on create | — | 3h |
| Assignment UI | — | Assignee picker in ticket form | 2h |
| **Remove Mock Data** | | | |
| Connect ServiceDeskView | — | Replace MOCK_TICKETS with API | 2h |
| Connect DashboardView | — | Replace MOCK_STATS with API | 3h |

**Deliverable:** ServiceDeskView shows real tickets with comments and attachments.

### 1.2 SLA Management Engine

**Current State:** UI shows SLA badges, no backend logic  
**Target State:** Automated SLA tracking with escalations

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **SLA Definitions** | | | |
| SLAPolicy model | `sla_policies` table | — | 3h |
| Priority-based SLA rules | P1=1h, P2=4h, etc. configurable | — | 2h |
| SLA management API | CRUD for policies | — | 3h |
| SLA config UI | — | SLAManagementView | 4h |
| **SLA Timer** | | | |
| SLATimer model | `sla_timers` table tracking breach time | — | 3h |
| Timer calculation | Account for business hours | — | 4h |
| Timer update service | Background job updating timers | — | 4h |
| SLA status API | Get SLA status for ticket | — | 2h |
| **Escalation Engine** | | | |
| EscalationRule model | `escalation_rules` table | — | 2h |
| Escalation logic | Trigger on SLA breach % | — | 4h |
| Escalation actions | Reassign, notify, change priority | — | 3h |
| Escalation config UI | — | Within SLAManagementView | 3h |

**Deliverable:** Tickets have real SLA timers, auto-escalate when breaching.

### 1.3 Knowledge Base

**Current State:** Not implemented  
**Target State:** Functional KB with article management

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **KB Data Model** | | | |
| KnowledgeArticle model | `knowledge_articles` table | — | 2h |
| KnowledgeCategory model | `knowledge_categories` table | — | 2h |
| Article versioning | `article_versions` table | — | 3h |
| **KB APIs** | | | |
| Article CRUD | Full REST API | — | 4h |
| Category management | Hierarchical categories | — | 3h |
| Full-text search | SurrealDB text search | — | 4h |
| Article ratings | Rating/feedback API | — | 2h |
| **KB Frontend** | | | |
| KnowledgeBaseView | — | Article list/grid view | 4h |
| ArticleDetailView | — | Article reader with rich content | 4h |
| ArticleEditorView | — | Rich text editor for authoring | 6h |
| KB search component | — | Search bar with suggestions | 3h |
| **Ticket Integration** | | | |
| Link KB to tickets | Suggest articles in ticket view | — | 3h |
| Quick KB lookup | — | KB widget in ServiceDeskView | 3h |

**Deliverable:** Users can create, search, and link KB articles to tickets.

### Phase 1 Total: ~112 hours (4 weeks at 28h/week)

---

## Phase 2: Automation (Week 7-10)

**Theme:** "Reduce manual work"

### 2.1 Generic Workflow Engine

**Current State:** Project-specific workflows only  
**Target State:** Configurable workflow engine for all entities

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Workflow Models** | | | |
| WorkflowDefinition model | BPMN-like definition storage | — | 4h |
| WorkflowStep model | Steps with conditions/actions | — | 3h |
| WorkflowInstance model | Running workflow instances | — | 3h |
| **Workflow Engine** | | | |
| Step executor | Execute actions based on step type | — | 6h |
| Condition evaluator | Evaluate step conditions | — | 4h |
| Trigger system | Trigger workflows on events | — | 4h |
| **Workflow Actions** | | | |
| Update field action | Change entity fields | — | 2h |
| Send notification action | Trigger notifications | — | 2h |
| Create task action | Create follow-up tasks | — | 2h |
| Approval action | Request approval | — | 4h |
| **Workflow UI** | | | |
| WorkflowBuilderView | — | Visual workflow designer | 12h |
| Workflow instance viewer | — | Track running workflows | 4h |

**Deliverable:** Admins can create visual workflows that automate ticket handling.

### 2.2 Approval System

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| ApprovalRequest model | `approval_requests` table | — | 3h |
| Approval chains | Sequential/parallel approvers | — | 4h |
| Approval APIs | Request, approve, reject | — | 4h |
| ApprovalQueueView | — | Pending approvals dashboard | 4h |
| Approval notifications | Email/in-app notifications | — | 3h |

**Deliverable:** Changes/requests can require approval before proceeding.

### 2.3 Notification System

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Notification Infrastructure** | | | |
| Notification model | `notifications` table | — | 2h |
| Notification preferences | User notification settings | — | 3h |
| Notification API | Get notifications, mark read | — | 3h |
| **Email Integration** | | | |
| SMTP configuration | Configurable SMTP settings | — | 2h |
| Email templates | Handlebars/Tera templates | — | 4h |
| Email sender service | Async email sending | — | 4h |
| **Frontend Integration** | | | |
| Notification bell | — | Header notification icon | 3h |
| Notification panel | — | Notification dropdown/panel | 4h |
| Notification settings | — | User preferences page | 3h |

**Deliverable:** Users receive email and in-app notifications for relevant events.

### 2.4 Service Catalog (Basic)

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| ServiceCatalogItem model | `service_catalog_items` table | — | 3h |
| Catalog categories | Hierarchical categories | — | 2h |
| Catalog CRUD API | Full REST API | — | 4h |
| ServiceCatalogView | — | Catalog browsing UI | 5h |
| Request form builder | Dynamic form fields | — | 6h |
| Service request creation | Create ticket from catalog | — | 3h |

**Deliverable:** Users can browse service catalog and submit requests.

### Phase 2 Total: ~119 hours (4 weeks at 30h/week)

---

## Phase 3: Integration (Week 11-14)

**Theme:** "Connect the dots"

### 3.1 Monitoring Integration

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Real Monitoring Data** | | | |
| Replace mock data | Connect MonitoringView to real APIs | — | 4h |
| Metrics storage | Time-series data model | — | 4h |
| Metrics API | Query metrics with time range | — | 4h |
| **Alert System** | | | |
| Alert model | `alerts` table | — | 2h |
| AlertRule model | `alert_rules` table with conditions | — | 3h |
| Alert evaluation job | Check rules against metrics | — | 6h |
| Alert-to-ticket | Auto-create ticket from alert | — | 4h |
| **External Adapters** | | | |
| Prometheus adapter | Pull metrics from Prometheus | — | 6h |
| Generic webhook receiver | Receive alerts via webhook | — | 4h |

**Deliverable:** Real metrics, alerts that auto-create tickets.

### 3.2 Reporting & Analytics

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Analytics APIs** | | | |
| Uncomment analytics.rs | Fix compilation issues | — | 2h |
| Dashboard stats API | Real stats for DashboardView | — | 4h |
| Ticket analytics API | SLA compliance, resolution time | — | 4h |
| **Report Engine** | | | |
| Report model | `reports` table with definitions | — | 3h |
| Report execution | Generate report data | — | 6h |
| PDF export | Generate PDF reports | — | 6h |
| Excel export | Generate Excel exports | — | 4h |
| **Report UI** | | | |
| ReportsView | — | Report list and generation | 5h |
| Report builder | — | Basic report configuration | 6h |

**Deliverable:** Standard ITSM reports with export capability.

### 3.3 AI Integration (Enhancement)

| Task | Backend | Frontend | Estimate |
|------|---------|----------|----------|
| **Connect AI to Core** | | | |
| AI context from tickets | Feed ticket data to AI | — | 4h |
| AI context from KB | RAG over knowledge base | — | 6h |
| AI suggestions in UI | — | Integrate AIFeatureGate in views | 4h |
| **Ticket Assistant** | | | |
| Similar ticket detection | Vector search for duplicates | — | 6h |
| KB suggestion | Suggest articles for tickets | — | 4h |
| Auto-categorization | Suggest priority/category | — | 4h |

**Deliverable:** AI provides contextual suggestions in ticket handling.

### Phase 3 Total: ~105 hours (4 weeks at 26h/week)

---

## Phase 4: Polish (Week 15-16)

**Theme:** "Make it production-ready"

### 4.1 Testing & Quality

| Task | Estimate |
|------|----------|
| Unit tests for new APIs | 8h |
| Integration tests | 8h |
| E2E tests (Playwright) | 12h |
| Performance testing | 6h |
| Security audit | 6h |

### 4.2 Documentation

| Task | Estimate |
|------|----------|
| API documentation (OpenAPI) | 6h |
| User guide | 8h |
| Admin guide | 6h |
| Update README.md | 2h |

### 4.3 DevOps & Deployment

| Task | Estimate |
|------|----------|
| Docker compose setup | 4h |
| CI/CD pipeline | 6h |
| Environment configuration | 3h |
| Monitoring & alerting setup | 4h |

### Phase 4 Total: ~79 hours (2 weeks at 40h/week)

---

## Implementation Order (Critical Path)

```
Week 1-2: Phase 0 (Foundation)
├── Auth System → Required for everything
├── RBAC → Required for user management
└── Audit Logging → Required for compliance

Week 3-4: Phase 1.1-1.2 (Tickets + SLA)
├── Ticket Comments → Core usability
├── Ticket Attachments → Core usability
├── SLA Policies → ITSM differentiator
└── SLA Timers → ITSM differentiator

Week 5-6: Phase 1.3 (Knowledge Base)
├── KB Models → Foundation
├── KB APIs → Core functionality
├── KB UI → User-facing
└── Ticket-KB Link → Integration

Week 7-8: Phase 2.1-2.2 (Workflows + Approvals)
├── Workflow Models → Foundation
├── Workflow Engine → Core
├── Approval System → Required for change management
└── Workflow UI → Admin configuration

Week 9-10: Phase 2.3-2.4 (Notifications + Catalog)
├── Notification System → Required for automation
├── Email Integration → Core communication
├── Service Catalog → Self-service portal
└── Request Forms → User-facing

Week 11-12: Phase 3.1-3.2 (Monitoring + Reports)
├── Real Monitoring Data → Remove mocks
├── Alert System → Proactive ITSM
├── Analytics APIs → Dashboard data
└── Report Engine → Business value

Week 13-14: Phase 3.3 (AI Integration)
├── AI Context → Data pipeline
├── Ticket Assistant → AI value-add
└── KB RAG → Smart suggestions

Week 15-16: Phase 4 (Polish)
├── Testing → Quality assurance
├── Documentation → User enablement
└── Deployment → Production readiness
```

---

## Resource Requirements

### Development Team

| Role | Allocation | Focus |
|------|------------|-------|
| Backend Developer (Rust) | 100% | APIs, models, engine |
| Frontend Developer (React) | 100% | Views, components |
| Full-Stack Developer | 50% | Integration, AI |
| DevOps Engineer | 25% | CI/CD, deployment |
| QA Engineer | 50% (Week 13+) | Testing |

### Infrastructure

| Resource | Purpose | Estimated Cost |
|----------|---------|----------------|
| SurrealDB | Primary database | Self-hosted |
| Redis | Queue, caching | Self-hosted |
| SMTP Service | Email notifications | ~$30/month |
| Object Storage | File attachments | ~$10/month |
| LLM API (optional) | AI features | ~$50-200/month |

---

## Success Metrics

### Phase Completion Gates

| Phase | Gate Criteria |
|-------|---------------|
| Phase 0 | User can login, admin can manage users/roles |
| Phase 1 | Ticket workflow E2E with SLA, KB searchable |
| Phase 2 | Automated workflow runs, notifications sent |
| Phase 3 | Real monitoring data, reports generated |
| Phase 4 | All tests pass, docs complete |

### KPIs

| Metric | Target |
|--------|--------|
| Mock data views | 0 (all connected to real APIs) |
| API endpoint coverage | 100% of MoSCoW Must-Haves |
| Test coverage | >80% |
| Load time (P95) | <2s |
| SLA accuracy | 100% (timers match reality) |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SurrealDB limitations | Medium | High | Evaluate PostgreSQL as fallback |
| Rust learning curve | Low | Medium | Leverage existing Rust expertise |
| Scope creep | High | High | Strict MoSCoW adherence |
| AI integration complexity | Medium | Medium | AI is optional, core works without |
| Timeline slippage | Medium | Medium | Weekly progress reviews |

---

## Appendix: API Endpoint Checklist

### To Implement (Phase 0-3)

```
# Authentication (Phase 0)
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# Users (Phase 0)
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}

# Roles (Phase 0)
GET    /api/v1/roles
POST   /api/v1/roles
GET    /api/v1/roles/{id}
PUT    /api/v1/roles/{id}
DELETE /api/v1/roles/{id}

# Audit (Phase 0)
GET    /api/v1/audit

# Ticket Comments (Phase 1)
GET    /api/v1/tickets/{id}/comments
POST   /api/v1/tickets/{id}/comments
PUT    /api/v1/tickets/{id}/comments/{cid}
DELETE /api/v1/tickets/{id}/comments/{cid}

# Ticket Attachments (Phase 1)
GET    /api/v1/tickets/{id}/attachments
POST   /api/v1/tickets/{id}/attachments
DELETE /api/v1/tickets/{id}/attachments/{aid}

# SLA (Phase 1)
GET    /api/v1/sla/policies
POST   /api/v1/sla/policies
PUT    /api/v1/sla/policies/{id}
DELETE /api/v1/sla/policies/{id}
GET    /api/v1/tickets/{id}/sla

# Knowledge Base (Phase 1)
GET    /api/v1/kb/articles
POST   /api/v1/kb/articles
GET    /api/v1/kb/articles/{id}
PUT    /api/v1/kb/articles/{id}
DELETE /api/v1/kb/articles/{id}
GET    /api/v1/kb/categories
POST   /api/v1/kb/categories
GET    /api/v1/kb/search?q=...

# Workflows (Phase 2)
GET    /api/v1/workflows
POST   /api/v1/workflows
GET    /api/v1/workflows/{id}
PUT    /api/v1/workflows/{id}
DELETE /api/v1/workflows/{id}
GET    /api/v1/workflows/instances

# Approvals (Phase 2)
GET    /api/v1/approvals
GET    /api/v1/approvals/pending
POST   /api/v1/approvals/{id}/approve
POST   /api/v1/approvals/{id}/reject

# Notifications (Phase 2)
GET    /api/v1/notifications
PUT    /api/v1/notifications/{id}/read
PUT    /api/v1/notifications/settings

# Service Catalog (Phase 2)
GET    /api/v1/catalog/items
POST   /api/v1/catalog/items
GET    /api/v1/catalog/items/{id}
GET    /api/v1/catalog/categories

# Alerts (Phase 3)
GET    /api/v1/alerts
GET    /api/v1/alerts/rules
POST   /api/v1/alerts/rules
PUT    /api/v1/alerts/{id}/acknowledge

# Reports (Phase 3)
GET    /api/v1/reports
POST   /api/v1/reports
GET    /api/v1/reports/{id}/execute
GET    /api/v1/reports/{id}/export?format=pdf
```

---

## Conclusion

This plan provides a structured 16-week path from current state to a production-ready ITSM platform. The key principles are:

1. **Foundation before features** - Auth and RBAC unlock everything else
2. **Real data everywhere** - Eliminate all mock data
3. **Core ITSM first** - Tickets, KB, SLA before fancy features
4. **AI as enhancement** - Works without AI, better with AI

Following this plan will transform Archer into a viable alternative to ServiceNow for mid-market customers seeking modern, cost-effective ITSM tooling.

---

*Plan created December 2025. Review and adjust bi-weekly based on progress.*
