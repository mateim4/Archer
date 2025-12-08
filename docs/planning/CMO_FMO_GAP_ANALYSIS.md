# Archer ITSM: CMO vs FMO Gap Analysis

**Document Status:** Strategic Planning  
**Created:** December 2025  
**Purpose:** Bridge the gap between Current Mode of Operation (CMO) and Future Mode of Operation (FMO) for core ITSM features

---

## Executive Summary

Archer has made significant progress on **infrastructure-focused workflows** (VMware migration, hardware lifecycle, RVTools analysis) and the **AI Engine foundation**. However, the core ITSM capabilities that position Archer as "The Modern ServiceNow Alternative" remain **largely incomplete or mocked**.

This document provides a comprehensive gap analysis comparing:
- **CMO (Current):** What's actually implemented and functional
- **FMO (Target):** MoSCoW Phase 1 Must-Haves from strategic planning

**Key Finding:** Approximately 30% of Phase 1 Must-Haves are implemented. The remaining 70% consists of mocked UIs, missing backend APIs, or entirely missing features.

---

## 1. Feature-by-Feature Gap Analysis

### Legend
| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully implemented, backend + frontend connected |
| 🟡 Partial | UI exists but backend is mocked or incomplete |
| ❌ Missing | Not implemented at all |
| 🔜 Designed | Architecture exists but no code |

---

### 1.1 Incident & Service Request Management

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Ticket CRUD** | Must | ✅ Complete | `tickets.rs` has list, get, create, update, delete |
| **Multi-channel intake (Email)** | Must | ❌ Missing | No email integration, no inbound email parsing |
| **Multi-channel intake (Portal)** | Must | 🟡 Partial | ServiceDeskView UI exists but uses `MOCK_TICKETS` fallback |
| **Multi-channel intake (Chat)** | Must | ❌ Missing | No chat/messaging integration |
| **Ticket types (Incident, Problem, Change, Service Request)** | Must | ✅ Complete | Enum defined in `ticket.rs` |
| **Priority levels (P1-P4)** | Must | ✅ Complete | Enum defined in `ticket.rs` |
| **Status workflow (New → Closed)** | Must | ✅ Complete | Basic enum defined |
| **SLA tracking & timers** | Must | ❌ Missing | UI shows SLA badges but no backend logic |
| **SLA escalation rules** | Must | ❌ Missing | No escalation engine |
| **Assignment/routing rules** | Must | ❌ Missing | No assignment logic, manual only |
| **Ticket comments/worklog** | Must | ❌ Missing | No comments model or API |
| **Attachments** | Must | ❌ Missing | No file attachment support |
| **Related tickets/linking** | Should | ❌ Missing | No ticket relationship model |

**Gap Score: 4/13 features complete (31%)**

---

### 1.2 Knowledge Base

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Article CRUD** | Must | ❌ Missing | No KB model or API |
| **Category/folder structure** | Must | ❌ Missing | No hierarchical KB |
| **Full-text search** | Must | ❌ Missing | No search implementation |
| **Rich text editor** | Must | ❌ Missing | No WYSIWYG for articles |
| **Version history** | Should | ❌ Missing | No versioning |
| **Article templates** | Should | ❌ Missing | No templates |
| **User ratings/feedback** | Should | ❌ Missing | No rating system |
| **Integration with tickets** | Must | ❌ Missing | Can't link KB to tickets |

**Gap Score: 0/8 features complete (0%)**

---

### 1.3 Service Catalog

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Catalog item definitions** | Must | ❌ Missing | No service catalog model |
| **Request forms** | Must | ❌ Missing | No dynamic form builder |
| **Approval workflows** | Must | ❌ Missing | No approval engine |
| **Catalog categories** | Must | ❌ Missing | No categorization |
| **Pricing/costs** | Should | ❌ Missing | No cost tracking |
| **Service bundles** | Should | ❌ Missing | No bundling |

**Gap Score: 0/6 features complete (0%)**

---

### 1.4 CMDB / Asset Management

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Asset CRUD** | Must | ✅ Complete | `assets.rs` API exists |
| **Asset types/classes** | Must | 🟡 Partial | Basic types defined, not comprehensive |
| **Relationships (CI links)** | Must | 🟡 Partial | SurrealDB graph relations designed but limited use |
| **Auto-discovery** | Must | ❌ Missing | No discovery agents |
| **VMware inventory import** | Must | ✅ Complete | RVTools parser is mature |
| **Hardware catalog** | Must | ✅ Complete | Hardware pool/basket management works |
| **Lifecycle tracking** | Must | 🟡 Partial | Lifecycle planner view exists, backend incomplete |
| **Impact analysis** | Should | ❌ Missing | No dependency impact calculation |
| **Change tracking/audit** | Must | ❌ Missing | No CI audit log |

**Gap Score: 3/9 features complete (33%)**

---

### 1.5 Monitoring & Alerting

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Metrics dashboard** | Must | 🟡 Partial | MonitoringView exists but uses mock data |
| **Alert rules engine** | Must | ❌ Missing | No alerting logic |
| **Alert-to-ticket creation** | Must | ❌ Missing | No integration |
| **Topology visualization** | Should | 🟡 Partial | NetworkVisualizerView exists, mock data |
| **Capacity planning** | Must | 🟡 Partial | CapacityVisualizerView exists, RVTools data only |
| **External integrations (Prometheus, Zabbix)** | Should | ❌ Missing | No external monitoring adapters |

**Gap Score: 0/6 features complete (0%)**

---

### 1.6 Workflow Automation

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Workflow engine** | Must | ❌ Missing | No generic workflow executor |
| **No-code workflow builder** | Must | ❌ Missing | No visual workflow designer |
| **Approval chains** | Must | ❌ Missing | No approval workflow |
| **Notification triggers** | Must | ❌ Missing | No notification system |
| **SLA-based automation** | Must | ❌ Missing | No SLA-triggered actions |
| **Project workflow** | Must | ✅ Complete | `workflow.rs` models are comprehensive |
| **Activity/task management** | Must | ✅ Complete | Activity wizard integration done |

**Gap Score: 2/7 features complete (29%)**

---

### 1.7 User Management & RBAC

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **User authentication** | Must | ❌ Missing | No auth system |
| **Role definitions** | Must | ❌ Missing | No RBAC model |
| **Permission matrix** | Must | ❌ Missing | No permissions |
| **Team/group management** | Must | ❌ Missing | No teams |
| **SSO integration** | Should | ❌ Missing | No SSO |
| **Audit logging** | Must | ❌ Missing | No user audit trail |

**Gap Score: 0/6 features complete (0%)**

---

### 1.8 Reporting & Analytics

| Feature | MoSCoW | CMO Status | Gap Description |
|---------|--------|------------|-----------------|
| **Dashboard widgets** | Must | 🟡 Partial | DashboardView exists with `MOCK_STATS` |
| **Standard ITSM reports** | Must | ❌ Missing | No report definitions |
| **Custom report builder** | Should | ❌ Missing | No report builder |
| **Export (PDF, Excel)** | Must | ❌ Missing | No export functionality |
| **Scheduled reports** | Should | ❌ Missing | No scheduling |
| **Analytics API** | Must | 🟡 Partial | `analytics.rs` commented out, TODO |

**Gap Score: 0/6 features complete (0%)**

---

## 2. Backend API Inventory

### Currently Implemented APIs (`/api/v1/`)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/tickets/*` | ✅ Active | Basic CRUD only |
| `/assets/*` | ✅ Active | Basic asset management |
| `/monitoring/*` | 🟡 Active | Routes exist, limited functionality |
| `/integration/*` | 🟡 Active | Integration hub, partially complete |
| `/settings/*` | ✅ Active | Global settings |
| `/hardware-pool/*` | ✅ Active | Hardware catalog management |
| `/rvtools/*` | ✅ Active | RVTools parsing and analysis |
| `/enhanced-rvtools/*` | ✅ Active | Extended RVTools features |
| `/project-lifecycle/*` | ✅ Active | Project management |
| `/project-workflow/*` | ✅ Active | Workflow/activity management |
| `/migration-wizard/*` | ✅ Active | VMware migration wizard |
| `/wizard/*` | ✅ Active | Activity wizard |
| `/cluster-strategy/*` | ✅ Active | Cluster planning |
| `/destination-clusters/*` | ✅ Active | Target cluster management |
| `/capacity/*` | ✅ Active | Capacity planning |
| `/vm-placement/*` | ✅ Active | VM placement logic |
| `/network-templates/*` | ✅ Active | Network configuration |
| `/hld/*` | ✅ Active | High-level design docs |

### Missing APIs (Required for FMO)

| Endpoint | Priority | Purpose |
|----------|----------|---------|
| `/auth/*` | Critical | Authentication, sessions |
| `/users/*` | Critical | User management |
| `/roles/*` | Critical | RBAC management |
| `/knowledge-base/*` | Must | KB articles CRUD |
| `/service-catalog/*` | Must | Service catalog management |
| `/workflows/*` (generic) | Must | Workflow engine |
| `/approvals/*` | Must | Approval workflows |
| `/sla/*` | Must | SLA definitions and tracking |
| `/escalations/*` | Must | Escalation rules |
| `/notifications/*` | Must | Notification management |
| `/reports/*` | Must | Report generation |
| `/analytics/*` | Must | Analytics (currently commented out) |
| `/audit/*` | Must | Audit logging |
| `/alerts/*` | Must | Alert management |

---

## 3. Frontend View Status

### Active Views with Real Backend Integration

| View | Backend Connection | Data Quality |
|------|-------------------|--------------|
| HardwarePoolView | ✅ Connected | Real data |
| HardwareBasketView | ✅ Connected | Real data |
| ProjectWorkspaceView | ✅ Connected | Real data |
| ProjectTimelineView | ✅ Connected | Real data |
| EnhancedRVToolsReportView | ✅ Connected | Real data (parsed) |
| SettingsView | ✅ Connected | Real data |
| ClusterStrategyManagerView | ✅ Connected | Real data |

### Views with Mock/Fallback Data

| View | Issue |
|------|-------|
| ServiceDeskView | Falls back to `MOCK_TICKETS` |
| DashboardView | Uses `MOCK_STATS` |
| MonitoringView | Mostly mock data |
| AdvancedAnalyticsDashboard | 100% mock via `getMockDashboardData()` |
| InventoryView | Partial mock |
| InfraVisualizerView | Mock topology |
| NetworkVisualizerView | Mock network data |

### Missing Views (Required for FMO)

| View | Purpose |
|------|---------|
| KnowledgeBaseView | KB article management |
| ServiceCatalogView | Service catalog browsing |
| WorkflowBuilderView | Visual workflow designer |
| ReportsView | Report generation & viewing |
| UserManagementView | User/role administration |
| SLAManagementView | SLA policy configuration |
| ApprovalQueueView | Pending approvals dashboard |

---

## 4. Data Model Gaps

### Implemented Models (in `backend/src/models/`)

| Model | File | Status |
|-------|------|--------|
| Ticket | `ticket.rs` | ✅ Basic |
| Project/Workflow | `workflow.rs` | ✅ Comprehensive |
| Settings | `settings.rs` | ✅ Complete |
| Migration | `migration_models.rs` | ✅ Complete |
| HLD | `hld.rs` | ✅ Complete |

### Missing Models (Required for FMO)

| Model | Purpose | Priority |
|-------|---------|----------|
| User | User accounts | Critical |
| Role | RBAC roles | Critical |
| Permission | Granular permissions | Critical |
| Team | User groups | Must |
| KnowledgeArticle | KB content | Must |
| KnowledgeCategory | KB organization | Must |
| ServiceCatalogItem | Service definitions | Must |
| ApprovalRequest | Approval workflow | Must |
| SLAPolicy | SLA definitions | Must |
| SLATimer | SLA tracking | Must |
| EscalationRule | Escalation logic | Must |
| WorkflowDefinition | Generic workflows | Must |
| WorkflowInstance | Workflow execution | Must |
| Notification | Notification records | Must |
| AuditLog | Audit trail | Must |
| Alert | Monitoring alerts | Must |
| AlertRule | Alert definitions | Must |
| Report | Report definitions | Should |
| TicketComment | Ticket conversations | Must |
| TicketAttachment | File attachments | Must |

---

## 5. Summary Statistics

### Overall Gap Analysis

| Category | Complete | Partial | Missing | Total | Score |
|----------|----------|---------|---------|-------|-------|
| Incident Management | 4 | 1 | 8 | 13 | 31% |
| Knowledge Base | 0 | 0 | 8 | 8 | 0% |
| Service Catalog | 0 | 0 | 6 | 6 | 0% |
| CMDB/Assets | 3 | 3 | 3 | 9 | 33% |
| Monitoring | 0 | 3 | 3 | 6 | 0% |
| Workflow Automation | 2 | 0 | 5 | 7 | 29% |
| User Management | 0 | 0 | 6 | 6 | 0% |
| Reporting | 0 | 2 | 4 | 6 | 0% |
| **TOTAL** | **9** | **9** | **43** | **61** | **15%** |

### What's Actually Working Well

1. **VMware Migration Tooling** - RVTools parsing, cluster analysis, migration waves
2. **Hardware Lifecycle Management** - Hardware pool, baskets, vendor catalogs (Dell, Lenovo)
3. **Project Management** - Projects, activities, timeline, dependencies
4. **Design System** - Purple Glass components, Fluent UI 2 integration
5. **AI Engine Foundation** - LLM Gateway with 4 providers operational

### Critical Gaps for "ServiceNow Alternative" Positioning

1. **No Authentication/RBAC** - Can't support multi-user, multi-tenant
2. **No Knowledge Base** - Core ITSM differentiator is missing entirely
3. **No Service Catalog** - No self-service portal capability
4. **No SLA Engine** - SLAs are UI-only, no enforcement
5. **No Workflow Automation** - No approval chains or automated routing
6. **No Notifications** - No email/webhook notifications

---

## 6. Risk Assessment

### High Risk (Blockers for Production)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No authentication | Cannot deploy to production | Implement basic auth first |
| Mock data in core views | Users see fake data | Connect all views to real APIs |
| No audit logging | Compliance failure | Add audit trail to all mutations |

### Medium Risk (Feature Parity)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No KB | Missing key ITSM pillar | Phase 1 priority |
| No Service Catalog | Limited self-service | Phase 2 |
| No SLA enforcement | No SLA compliance | Phase 1 priority |

### Low Risk (Enhancement)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No custom reports | Reduced analytics | Phase 3 |
| No SSO | Manual user management | Phase 3 |
| No external monitoring | Limited integrations | Phase 3 |

---

## Next Steps

See `E2E_DEVELOPMENT_PLAN.md` for the prioritized implementation roadmap to close these gaps.

---

*Document generated based on code analysis of Archer repository and cross-referenced with MoSCoW Feature Prioritization and UX Recommendations from strategic planning documentation.*
