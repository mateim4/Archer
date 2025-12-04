# 1. Data Model and App Design

## Application Architecture
Archer (LCMDesigner) is a hybrid application designed for IT Operations, Project Management, and Hardware Lifecycle Management.

### Core Components
1.  **Frontend:** React (Vite) + TypeScript + Fluent UI 2 (Custom "Acrylic" Theme).
2.  **Backend:** Rust (Actix-web/Axum) for high-performance logic (VM placement, HLD generation).
3.  **Database:** SurrealDB (Multi-model: Graph + Document).
4.  **Integration Hub:** Rust-based async poller for external APIs (Nutanix, Cisco, Splunk).
5.  **Agentic Core:** LLM-driven operations engine with long-term memory.

## Data Model (SurrealDB)

### 1. Hardware & Inventory (CMDB)
*   **`hardware_lot`**: Physical batch of hardware (servers, switches).
*   **`hardware_component`**: Individual components (CPU, RAM, Disk).
*   **`nutanix_cluster`**: Logical cluster entity (Nutanix specific).
*   **`monitors`**: Edge connecting Integration Connectors to Assets.

### 2. Project Portfolio Management (PPM)
*   **`project`**: High-level initiative (e.g., "Q3 Refresh").
*   **`project_workflow`**: Template for execution steps.
*   **`project_task`**: Individual unit of work.
*   **`milestone`**: Key dates and gates.

### 3. IT Service Management (ITSM)
*   **`ticket`**: Unified entity for Incidents, Problems, and Changes.
    *   *Type:* Incident, Problem, Change, Service Request.
    *   *Status:* New, In Progress, Resolved, Closed.
*   **`affects`**: Edge linking Tickets to Assets (`ticket` -> `affects` -> `hardware_lot`).

### 4. Agentic Operations
*   **`agent_job`**: A unit of autonomous work (Intent, Context, Steps).
*   **`agent_audit_log`**: Immutable record of tool usage and decisions.
*   **`integration_connector`**: Configuration for external API providers.

## Design Patterns
*   **Graph-First:** We leverage SurrealDB's graph capabilities to link logical assets (VMs) to physical assets (Hosts) to business entities (Projects/Tickets).
*   **Event-Driven:** External alerts (Splunk) trigger internal Events, which spawn Agent Jobs or Tickets.
*   **Glassmorphic UI:** The "Acrylic" design system provides a modern, depth-based interface using semi-transparent layers.
