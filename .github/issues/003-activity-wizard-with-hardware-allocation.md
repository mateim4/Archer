Title: Activity Wizard: Migration/Lifecycle/Commissioning/Decommissioning (+ Multi-host Allocation)

Summary
- Extend the activity creation wizard to support activity types, details, dates, assignees, and hardware selection for commissioning/decommissioning with multi-host allocations.

Scope
- Extend `CreateActivityFormFixed.tsx` into a stepper wizard.
- Steps: Type → Details → Dates → Assignees → Hardware (multi-select) → Review.
- On submit: create activity; if commissioning/decommissioning, call bulk allocations endpoint for selected hosts with a single time window.
- Status: set to pending_assignment if no assignee; allow manual status changes.

Acceptance Criteria
- Wizard validates required fields and enforces date logic.
- Commissioning/decommissioning flows allocate multiple hosts in one action; conflicts reported per host.
- After creation, visx Gantt updates without reload.

Tasks
- [ ] Build stepper wrapper around CreateActivityFormFixed.
- [ ] Add hardware selection step with host search/filter.
- [ ] Wire to new backend endpoints.
- [ ] Show per-host allocation results (success/failure) in the final step.
- [ ] E2E test: create commissioning with multi-host allocation + verify in Gantt and host timelines.

Dependencies
- Issue 001 (endpoints), Issue 002 (Gantt integration).

Labels: frontend, wizard, projects, hardware, ux
