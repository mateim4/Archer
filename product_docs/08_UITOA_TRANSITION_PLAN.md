# Archer UITOA Transition Plan: The "ITIL Swiss Knife" Evolution

**Date:** December 1, 2025
**Target Architecture:** Unified IT Operations Architecture (UITOA)
**Vision:** Transform Archer from a Project/LCM tool into a comprehensive ITIL Swiss Knife (ITAM, ITSM, Agentic Ops, Integration Hub) with a Nutanix-first focus.

---

## 1. Executive Summary

The current Archer platform is a strong **Project Portfolio Management (PPM)** and **Hardware Lifecycle Management (LCM)** tool. To achieve the "ITIL Swiss Knife" vision, we must evolve the architecture from a passive record-keeping system to an active, agentic operations platform.

**Key Shifts:**
1.  **Passive → Active:** From importing Excel sheets to live API polling (Nutanix, Cisco, Splunk).
2.  **Siloed → Unified:** Merging Project Tasks (PPM) with Incidents/Changes (ITSM).
3.  **User-Driven → Agentic:** From "Wizards" to autonomous AI agents that can diagnose and remediate.
4.  **Generic → Nutanix-First:** Deep modeling of Nutanix constructs (Prism, Clusters, AHV) while retaining generic hardware support.

---

## 2. Gap Analysis (Current vs. Target)

| Feature Domain | Current State (Archer) | Target State (ITIL Swiss Knife) | Gap Severity |
| :--- | :--- | :--- | :--- |
| **Data Ingestion** | Manual Import (Excel/JSON parsers). Static snapshots. | **Integration Hub:** Live connectors for Nutanix PC, Cisco ACI, BMC, Splunk. | 🔴 Critical |
| **Asset Mgmt (ITAM)** | `hardware_lot` & `component` tables. Physical focus. | **Full CMDB:** Logical assets (VMs, Clusters), Software, Licenses, Network Topology. | 🟠 High |
| **Service Mgmt (ITSM)** | `project_task` (PPM only). No ITIL workflows. | **Ticketing System:** Incidents, Problems, Change Requests linked to Assets. | 🔴 Critical |
| **Automation** | "Wizards" (User-guided decision trees). | **Agentic Ops:** Autonomous agents with long-term memory, tool use, and audit logs. | 🔴 Critical |
| **Platform Focus** | Generic Hardware (Dell/Lenovo parsers). | **Nutanix-First:** Native understanding of Nutanix blocks, nodes, and HCI concepts. | 🟡 Medium |
| **Project Mgmt** | Strong (`project`, `workflow`, `milestone`). | **Integrated PPM:** Projects trigger Change Requests; Incidents trigger Projects. | 🟢 Low (Retain) |

---

## 3. Staged Technical Transition Plan

### Phase 1: The Foundation (Schema & Core ITIL)
**Goal:** Establish the data structures for ITSM and expanded ITAM without breaking existing functionality.
*   **Action 1.1:** Apply `itil_agentic_schema.surql` to SurrealDB.
*   **Action 1.2:** Refactor `hardware_lot` to be a subtype of a broader `asset` table (or use graph edges to link physical to logical).
*   **Action 1.3:** Implement the `Ticket` API (CRUD for Incidents/Changes).
*   **Action 1.4:** Create the "Tasks" View in the UI (using the new Acrylic design).

### Phase 2: The Nervous System (Integration Hub)
**Goal:** Connect Archer to the outside world.
*   **Action 2.1:** Build the `IntegrationConnector` Rust service.
    *   *Architecture:* A plugin-based poller that runs as a background service.
*   **Action 2.2:** Implement **Nutanix Prism v3/v4 API Client**.
    *   *Sync:* Clusters, Hosts, VMs, Alerts.
*   **Action 2.3:** Implement **Generic SNMP/IPMI Client** for BMCs.
*   **Action 2.4:** Dashboard update: Show "Live Status" vs "Recorded Status" for assets.

### Phase 3: The Brain (Agentic Operations)
**Goal:** Enable AI to act on the data.
*   **Action 3.1:** Deploy `AgentCore` (Rust + LLM binding).
    *   *Capabilities:* Read-only access to `IntegrationConnector` data initially.
*   **Action 3.2:** Implement "Agent Tools" registry.
    *   *Tool:* `check_cluster_health(cluster_id)`
    *   *Tool:* `get_switch_port_stats(switch_ip, port)`
*   **Action 3.3:** Build the "Ops Center" UI.
    *   *Interface:* Chat-based command center where users authorize Agent actions.

### Phase 4: The Unification (ITIL Workflow Automation)
**Goal:** Close the loop between monitoring, ticketing, and action.
*   **Scenario:** Splunk detects high temp -> Archer Agent creates Incident -> Agent checks BMC -> Agent suggests "Fan Failure" -> User approves Part Replacement Project.
*   **Action 4.1:** Implement Event-to-Ticket rules engine.
*   **Action 4.2:** Link Projects to Change Requests (e.g., "Server Install Project" automatically opens a "Change Request" ticket).

---

## 4. Technical Specifications

### 4.1 New Data Models (SurrealDB)
*See `itil_agentic_schema.surql` for full definitions.*

**Key Graph Relations:**
*   `integration_connector` -> `monitors` -> `nutanix_cluster`
*   `nutanix_cluster` -> `runs_on` -> `hardware_lot`
*   `ticket` -> `affects` -> `nutanix_cluster`
*   `agent_job` -> `remediated` -> `ticket`

### 4.2 Rust Backend Services
We will add two new crates to the workspace:
1.  **`archer_integration_hub`**: Handles async polling of external APIs.
    *   *Traits:* `DataSource`, `AssetProvider`, `AlertProvider`.
2.  **`archer_agent_core`**: The AI logic engine.
    *   *Components:* `Planner`, `ToolExecutor`, `MemoryManager`.

### 4.3 UI Architecture (Acrylic Design)
The new UI will add a sidebar section "Operations":
*   **Tasks:** Kanban/List view of Tickets.
*   **Inventory (Live):** Tree view of Nutanix Clusters -> Hosts -> VMs.
*   **Agent Console:** Chat interface with "Approval Cards" for sensitive actions.

---

## 5. Immediate Next Steps
1.  **Review Schema:** Confirm `itil_agentic_schema.surql` aligns with your specific Nutanix data needs.
2.  **Prototype Connector:** Build a simple Rust script to fetch a cluster list from a Nutanix Prism endpoint (mocked or real).
3.  **UI Skeleton:** Create the `ServiceDeskView.tsx` using the new Acrylic components.
