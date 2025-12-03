# Archer ITSM Platform - Comprehensive Specification

> **Version**: 1.0  
> **Date**: December 2, 2025  
> **Status**: Planning Phase  

---

## Executive Summary

Archer is evolving from a Migration Planner into a full-featured **IT Service Management (ITSM) Platform** that bridges the gap between ERP systems, monitoring tools, and service management. The goal is to provide a unified, modern alternative to legacy platforms like ServiceNow.

---

# Module 1: Service Desk

## 1.1 Purpose
Centralized ticket management for Incidents, Problems, Changes, and Service Requests following ITIL v4 best practices.

## 1.2 Key Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Ticket CRUD** | Create, Read, Update, Delete tickets | P0 |
| **Kanban Board** | Visual workflow with drag-and-drop | P0 |
| **List View** | Sortable, filterable table view | P0 |
| **Priority Matrix** | P1-P4 classification with visual indicators | P0 |
| **SLA Tracking** | Response/Resolution time tracking with alerts | P1 |
| **Assignment** | Assign tickets to users/teams | P1 |
| **Comments/Worklog** | Threaded discussions on tickets | P1 |
| **Related Tickets** | Link parent/child, related tickets | P2 |
| **Knowledge Base** | Link KB articles to tickets | P2 |
| **Approval Workflow** | Change approvals with multi-stage gates | P2 |

## 1.3 Ticket Types

| Type | Use Case | Default SLA |
|------|----------|-------------|
| **Incident** | Something is broken | P1: 1h, P2: 4h, P3: 8h, P4: 24h |
| **Problem** | Root cause analysis | N/A (linked to Incidents) |
| **Change** | Planned modification | CAB approval required |
| **Service Request** | Standard fulfillment | 3 business days |

## 1.4 Ticket Lifecycle (State Machine)

```
[NEW] → [TRIAGE] → [IN_PROGRESS] → [WAITING] → [RESOLVED] → [CLOSED]
                         ↑              ↓
                         └──────────────┘ (reopen)
```

## 1.5 User Flows

### 1.5.1 Create Incident
1. User clicks "New Ticket" → Modal opens
2. Select Type: "Incident"
3. Enter Title, Description
4. Select Priority (auto-suggested based on impact/urgency matrix)
5. **Link Affected Asset** (from CMDB) ← Integration Point
6. Assign to self or team
7. Submit → Ticket created, SLA timer starts

### 1.5.2 Work on Ticket
1. Technician opens ticket from queue
2. Reviews linked asset health (from Monitoring) ← Integration Point
3. Adds worklog entry
4. Updates status to "In Progress"
5. Resolves with resolution notes
6. User confirms → Ticket closed

### 1.5.3 Escalation Path
1. SLA breach imminent → Visual warning (yellow)
2. SLA breached → Visual alert (red) + notification
3. Auto-escalate to manager if P1 breaches

## 1.6 UI Components

| Component | Description |
|-----------|-------------|
| `TicketList` | Paginated table with inline actions |
| `TicketKanban` | Drag-drop columns by status |
| `TicketCard` | Compact card with priority, type, SLA status |
| `TicketDetail` | Full-page view with all fields, comments, history |
| `TicketModal` | Create/Edit form in modal |
| `SLAIndicator` | Visual timer (green/yellow/red) |
| `LinkedAssetBadge` | Clickable link to CMDB asset |

## 1.7 Navigation

- **Sidebar**: Service Desk (icon: ClipboardTask)
  - My Tickets (filtered to assigned)
  - All Tickets (team view)
  - Unassigned Queue
  - SLA Dashboard (metrics)

## 1.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tickets` | List tickets (with filters) |
| POST | `/api/v1/tickets` | Create ticket |
| GET | `/api/v1/tickets/:id` | Get ticket details |
| PATCH | `/api/v1/tickets/:id` | Update ticket |
| DELETE | `/api/v1/tickets/:id` | Delete ticket |
| POST | `/api/v1/tickets/:id/comments` | Add comment |
| GET | `/api/v1/tickets/:id/history` | Audit trail |

---

# Module 2: Inventory (CMDB)

## 2.1 Purpose
Single Source of Truth for all IT assets and their relationships. Acts as the foundation for incident correlation, change impact analysis, and capacity planning.

## 2.2 Key Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Asset Registry** | Central catalog of all CIs | P0 |
| **Asset Types** | Clusters, Hosts, VMs, Network Devices, Storage | P0 |
| **Search & Filter** | Multi-faceted search | P0 |
| **Asset 360 View** | Full detail + relationships + health | P0 |
| **Relationship Graph** | Visual dependency mapping | P1 |
| **Discovery Integration** | Auto-populate from scans | P1 |
| **Lifecycle Status** | Active, Decommissioned, Planned | P1 |
| **Custom Attributes** | Extensible metadata | P2 |
| **Audit Trail** | Track all changes to assets | P2 |
| **Bulk Import/Export** | CSV/Excel support | P2 |

## 2.3 Asset Types (CI Classes)

| Class | Icon | Typical Fields |
|-------|------|----------------|
| **Cluster** | Cube | Name, Type (HCI, vSphere, AHV), Node Count |
| **Host** | Server | Hostname, IP, CPU, RAM, OS, Serial |
| **VM** | Desktop | Name, vCPU, RAM, OS, Parent Host |
| **Network Device** | Router | Hostname, Type (Switch/Router/FW), Ports |
| **Storage** | Database | Type, Capacity, RAID Level |
| **Application** | Apps | Name, Version, Owner, Criticality |

## 2.4 Asset Relationships

```
Datacenter
   └── Rack
       └── Cluster
           └── Host
               └── VM
                   └── Application
```

Relationship Types:
- **Contains**: Parent/Child (Cluster contains Hosts)
- **Runs On**: VM runs on Host
- **Connects To**: Network adjacency
- **Depends On**: Application dependencies

## 2.5 User Flows

### 2.5.1 Browse Inventory
1. Navigate to Inventory
2. See tree view on left (by Location or Type)
3. Click asset → Details panel opens on right
4. View: Specs, Health, Open Tickets, Related Assets

### 2.5.2 View Asset 360
1. Select asset from list
2. Dashboard shows:
   - **Header**: Name, Type, Status, Last Scan
   - **KPI Row**: Uptime, Open Incidents, Age
   - **Specs Card**: Technical details
   - **Relationships Card**: Parent, Children, Dependencies
   - **Tickets Card**: Open/Recent incidents ← Integration Point
   - **Metrics Card**: CPU/Memory sparklines ← Integration Point

### 2.5.3 Add Asset Manually
1. Click "Add Asset"
2. Select Type (Cluster, Host, VM, etc.)
3. Fill required fields
4. Optionally link to parent
5. Save

### 2.5.4 Auto-Discovery
1. Go to Settings → Integrations
2. Configure Nutanix/VMware/Azure credentials
3. Run Discovery Scan
4. Review discovered assets
5. Import selected

## 2.6 UI Components

| Component | Description |
|-----------|-------------|
| `AssetTree` | Hierarchical navigation (left pane) |
| `AssetList` | Flat table with type icons |
| `Asset360` | Full detail dashboard (right pane) |
| `RelationshipGraph` | Interactive D3/ReactFlow diagram |
| `AssetCard` | Compact card for grid view |
| `DiscoveryWizard` | Multi-step import flow |

## 2.7 Navigation

- **Sidebar**: Inventory (CMDB) (icon: Server)
  - All Assets
  - By Type (Clusters, Hosts, VMs, Network)
  - Recently Added
  - Decommissioned

## 2.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assets` | List assets (filters: type, status) |
| POST | `/api/v1/assets` | Create asset |
| GET | `/api/v1/assets/:id` | Get asset details |
| PATCH | `/api/v1/assets/:id` | Update asset |
| DELETE | `/api/v1/assets/:id` | Delete asset |
| GET | `/api/v1/assets/:id/relationships` | Get related assets |
| GET | `/api/v1/assets/:id/tickets` | Get linked tickets |
| GET | `/api/v1/assets/:id/metrics` | Get performance data |

---

# Module 3: Monitoring

## 3.1 Purpose
Real-time visibility into infrastructure health. Acts as the "eyes" of the platform, detecting issues before users report them.

## 3.2 Key Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dashboard Overview** | At-a-glance health summary | P0 |
| **Asset Metrics** | CPU, Memory, Disk, Network | P0 |
| **Alert Feed** | Live stream of warnings/criticals | P0 |
| **Historical Charts** | Time-series performance graphs | P0 |
| **Threshold Alerts** | Configurable alert rules | P1 |
| **One-Click Incident** | Create ticket from alert | P1 |
| **Correlation Engine** | Group related alerts | P2 |
| **Maintenance Windows** | Suppress alerts during changes | P2 |
| **SLA Reporting** | Uptime calculations | P2 |

## 3.3 Alert Severities

| Severity | Color | Example |
|----------|-------|---------|
| **Critical** | Red | Host down, Storage full >95% |
| **Warning** | Yellow | CPU >80% for 15min |
| **Info** | Blue | VM migrated, Config changed |

## 3.4 Metric Categories

| Category | Metrics | Polling Interval |
|----------|---------|------------------|
| **Compute** | CPU %, Memory %, Load | 60s |
| **Storage** | Disk Used %, IOPS, Latency | 60s |
| **Network** | Throughput, Packet Loss, Latency | 60s |
| **Availability** | Ping, Port Check, HTTP | 30s |

## 3.5 User Flows

### 3.5.1 NOC Dashboard View
1. Navigate to Monitoring
2. See summary cards:
   - Critical Alerts (count + trend)
   - Warning Alerts
   - Average Health Score
   - Active Incidents (from Service Desk) ← Integration Point
3. Below: Alert feed (real-time)
4. Click alert → Jump to asset

### 3.5.2 Drill-Down to Asset
1. Select asset from list (or click alert)
2. See real-time charts:
   - CPU (Area chart, last 24h)
   - Memory (Area chart)
   - Network (Line chart)
   - Storage (Bar chart)
3. Compare to baseline/threshold
4. Review recent alerts for this asset

### 3.5.3 Create Incident from Alert
1. Alert fires (e.g., "Host CPU >90%")
2. Click "Create Incident" button on alert
3. Modal pre-fills:
   - Title: "[ALERT] Host CPU >90% on server-01"
   - Type: Incident
   - Priority: P2 (auto-suggested)
   - Linked Asset: server-01 ← Integration Point
4. Technician adds notes, submits
5. Alert tagged as "Incident Created"

### 3.5.4 Acknowledge Alert
1. See active alert
2. Click "Acknowledge"
3. Alert moves from "Active" to "Acknowledged"
4. Timer starts for follow-up

## 3.6 UI Components

| Component | Description |
|-----------|-------------|
| `HealthSummaryCard` | Big number + icon (Critical/Warning count) |
| `AlertFeed` | Real-time scrolling list |
| `AlertCard` | Severity, Asset, Message, Time, Actions |
| `MetricChart` | Recharts Area/Line with threshold line |
| `SparklineRow` | Compact inline chart in lists |
| `ThresholdEditor` | Rule builder (if metric > X for Y minutes) |

## 3.7 Navigation

- **Sidebar**: Monitoring (icon: Diagram)
  - Dashboard (NOC view)
  - Active Alerts
  - Alert History
  - Thresholds (settings)

## 3.8 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/monitoring/dashboard` | Summary stats |
| GET | `/api/v1/monitoring/alerts` | List active alerts |
| GET | `/api/v1/monitoring/assets/:id` | Metrics for asset |
| POST | `/api/v1/monitoring/alerts/:id/acknowledge` | Ack alert |
| GET | `/api/v1/monitoring/alerts/:id/history` | Alert history |

---

# Module 4: Integration Hub (Discovery)

## 4.1 Purpose
Connect to external systems (hypervisors, cloud providers, monitoring tools) to auto-discover assets and ingest data.

## 4.2 Supported Integrations

| Provider | Data Ingested | Status |
|----------|---------------|--------|
| **Nutanix Prism** | Clusters, Hosts, VMs | ✅ Implemented |
| **VMware vSphere** | Clusters, Hosts, VMs | 🔜 Planned |
| **Azure** | VMs, Storage, Network | 🔜 Planned |
| **AWS** | EC2, RDS, S3 | 🔜 Planned |
| **RVTools Export** | vSphere offline import | ✅ Implemented |

## 4.3 User Flows

### 4.3.1 Add Integration
1. Navigate to Settings → Integrations
2. Click "Add Integration"
3. Select Provider (e.g., Nutanix)
4. Enter credentials (URL, username, password)
5. Test Connection
6. Save

### 4.3.2 Run Discovery
1. Select configured integration
2. Click "Scan Now"
3. Progress indicator shows status
4. Review discovered assets
5. Select which to import
6. Confirm → Assets added to CMDB

### 4.3.3 Scheduled Sync
1. Enable auto-sync (toggle)
2. Set interval (hourly, daily)
3. System runs in background
4. New assets auto-imported, existing updated

## 4.4 UI Components

| Component | Description |
|-----------|-------------|
| `IntegrationCard` | Provider logo, status, last sync |
| `CredentialForm` | Secure input for connection details |
| `DiscoveryProgress` | Step indicator with counts |
| `AssetReviewTable` | Diff view (new, updated, removed) |

## 4.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/integration/providers` | List configured integrations |
| POST | `/api/v1/integration/providers` | Add integration |
| POST | `/api/v1/integration/providers/:id/test` | Test connection |
| POST | `/api/v1/integration/providers/:id/scan` | Run discovery |
| GET | `/api/v1/integration/providers/:id/results` | Get scan results |

---

# Overarching Integration Features

These are the **"liaison" features** that connect modules together, creating a unified experience.

## 5.1 Asset-Ticket Linking

| Source | Target | Description |
|--------|--------|-------------|
| Service Desk | CMDB | Link ticket to affected asset(s) |
| CMDB | Service Desk | View tickets for an asset |

**Implementation**:
- Ticket has `related_asset: Option<Thing>` field
- Asset 360 view fetches `/api/v1/assets/:id/tickets`
- Ticket creation modal has "Link Asset" dropdown (searchable)

**User Story**:
> As a technician, when I create an incident, I want to select the affected server so that the ticket is automatically linked to its CMDB record.

---

## 5.2 Alert-Incident Correlation

| Source | Target | Description |
|--------|--------|-------------|
| Monitoring | Service Desk | Create incident from alert |
| Service Desk | Monitoring | See triggering alert on ticket |

**Implementation**:
- Alert has "Create Incident" action button
- Incident created with `triggered_by_alert: Option<AlertId>`
- Alert marked as "Incident Created" with ticket link

**User Story**:
> As a NOC engineer, when I see a critical alert, I want to create an incident with one click, pre-filled with alert details, so I can respond quickly.

---

## 5.3 Asset Health in Ticket Context

| Source | Target | Description |
|--------|--------|-------------|
| CMDB + Monitoring | Service Desk | Show asset health on ticket |

**Implementation**:
- Ticket detail page shows `LinkedAssetHealth` component
- Component fetches real-time metrics for linked asset
- Visual indicator: green/yellow/red

**User Story**:
> As a technician working on an incident, I want to see the current health of the affected server without leaving the ticket, so I can correlate symptoms.

---

## 5.4 Impact Analysis for Changes

| Source | Target | Description |
|--------|--------|-------------|
| Service Desk (Change) | CMDB | Show downstream impact |

**Implementation**:
- Change ticket has "Affected CI" selector
- System traverses relationship graph
- Shows all dependent CIs (VMs on host, apps on VMs)

**User Story**:
> As a change manager, when I schedule maintenance on a host, I want to see all VMs and applications that will be affected, so I can notify stakeholders.

---

## 5.5 Unified Search

| Feature | Description |
|---------|-------------|
| **Global Search** | Search across Tickets, Assets, Alerts from one box |
| **Quick Actions** | "Create Incident for [asset]" from search results |

**Implementation**:
- Command palette (Ctrl+K / Cmd+K)
- Federated search across modules
- Results grouped by type with icons

**User Story**:
> As any user, I want to press Ctrl+K and search for "server-01" to instantly see its CMDB record, open tickets, and recent alerts in one view.

---

## 5.6 Activity Timeline

| Feature | Description |
|---------|-------------|
| **Asset Timeline** | Chronological view of all events for an asset |
| **Events**: | Tickets opened, alerts fired, changes made, discoveries |

**Implementation**:
- Unified `activity` table in database
- Asset 360 view has "Timeline" tab
- Each event links back to source (ticket, alert, etc.)

**User Story**:
> As a technician investigating an outage, I want to see a timeline of all events for this server (when it was discovered, when alerts fired, when tickets were opened), so I can understand the history.

---

## 5.7 Dashboard Widgets (Cross-Module)

| Widget | Data Sources |
|--------|--------------|
| **Open Incidents by Asset** | Service Desk + CMDB |
| **Assets with Most Alerts** | Monitoring + CMDB |
| **SLA Breaches This Week** | Service Desk |
| **Discovery Coverage** | CMDB + Integration Hub |
| **Change Calendar** | Service Desk (Changes) |

**Implementation**:
- Customizable home dashboard
- Widgets are draggable/resizable
- Each widget fetches from its own API

---

# Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Archer                           [Search] [User] [?]│
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ ★ Home   │  [Main Content Area]                             │
│          │                                                  │
│ ───────  │                                                  │
│ SERVICE  │                                                  │
│ ✓ Desk   │                                                  │
│   My     │                                                  │
│   All    │                                                  │
│   Queue  │                                                  │
│          │                                                  │
│ ───────  │                                                  │
│ CMDB     │                                                  │
│ ▣ Inv    │                                                  │
│   All    │                                                  │
│   Clust  │                                                  │
│   Hosts  │                                                  │
│          │                                                  │
│ ───────  │                                                  │
│ OPS      │                                                  │
│ ◉ Mon    │                                                  │
│   Alerts │                                                  │
│          │                                                  │
│ ───────  │                                                  │
│ SETUP    │                                                  │
│ ⚙ Set    │                                                  │
│   Integ  │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

# Implementation Roadmap

## Phase 1: Core ITSM (Current)
- [x] Service Desk: Ticket CRUD, List/Kanban views
- [x] CMDB: Asset list, Asset 360 view
- [x] Monitoring: Dashboard, Metrics charts
- [x] Integration Hub: Nutanix discovery

## Phase 2: Integration Layer (Next)
- [ ] Asset-Ticket Linking (UI + API)
- [ ] One-Click Incident from Alert
- [ ] Asset Health on Ticket Detail
- [ ] Unified Search (Ctrl+K)

## Phase 3: Workflow Enhancements
- [ ] SLA Engine (timers, escalation)
- [ ] Change Approval Workflow
- [ ] Impact Analysis Graph
- [ ] Activity Timeline

## Phase 4: Advanced Features
- [ ] Knowledge Base
- [ ] Reporting & Dashboards
- [ ] Mobile-Responsive Views
- [ ] Role-Based Access Control

---

# Design System Notes

- **Component Library**: Purple Glass (Fluent UI 2 based)
- **Typography**: Poppins
- **Color Palette**: Purple/Violet primary, Glass/Blur effects
- **Icons**: Fluent UI React Icons
- **Charts**: Recharts (already in use)
- **State Management**: Zustand (existing)

---

# Open Questions

1. **Multi-tenancy**: Should assets be scoped to projects, or global?
2. **User Management**: Integrate with Azure AD / LDAP?
3. **Notifications**: Email? In-app? Webhooks?
4. **Mobile**: PWA or native app?

---

*This document will be updated iteratively as we implement each phase.*
