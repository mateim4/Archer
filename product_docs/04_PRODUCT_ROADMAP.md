# 4. Product Development Roadmap

## Strategic Roadmap: "ITIL Swiss Knife"

### Phase 1: Foundation (Q4 2025) - **ACTIVE**
*   [x] **UI Overhaul:** Implement "Acrylic" design system.
*   [x] **Schema Extension:** Apply `itil_agentic_schema.surql`.
*   [x] **Tasks Module:** Create basic CRUD for Tickets/Tasks.
*   [ ] **Inventory Update:** Refactor `hardware_lot` to support logical assets.

### Phase 2: The Nervous System (Q1 2026)
*   [x] **Integration Hub:** Build Rust service for API polling.
*   [x] **Nutanix Connector:** Implement Prism v3/v4 client.
*   [ ] **Cisco Connector:** Implement ACI/NX-OS client.
*   [ ] **Live Dashboard:** Show real-time status of assets.

### Phase 3: The Brain (Q2 2026)
*   [ ] **Agent Core:** Deploy LLM-based agent runtime.
*   [ ] **Tool Registry:** Implement safe tools for Agents (Read-only first).
*   [ ] **Agent Console:** Chat interface for Ops.
*   [ ] **Memory:** Implement Vector DB for Agent long-term memory.

### Phase 4: Unification (Q3 2026)
*   [ ] **Event Correlation:** Splunk -> Agent -> Ticket workflow.
*   [ ] **Auto-Remediation:** Agents executing approved changes.
*   [ ] **Predictive LCM:** AI forecasting hardware end-of-life/capacity.

## Backlog (To-Do)
*   **Feature:** "Project Wizard" conversion to Chat-based creation.
*   **Feature:** Mobile-responsive view for "Tasks".
*   **Tech Debt:** Refactor legacy Python parsers to Rust.
*   **Tech Debt:** Increase unit test coverage for Frontend components.
