Title: Backend: Activities, Allocations, Users APIs + Auto-Delayed Status

Summary
- Implement backend endpoints for project activities, hardware allocations, and users in Express + SurrealDB.
- Persist and expose the activity status model, including auto-flip to "delayed" when due date is reached and activity is not completed/cancelled.
- Reuse existing RVTools pipeline to persist parsed hosts into hardware_pool.

Scope
- Tables (already in schema): project_workflow, workflow_activity, hardware_pool, hardware_allocation, user.
- Endpoints:
  - Activities
    - GET /api/projects/:projectId/activities
    - POST /api/projects/:projectId/activities
    - PUT /api/activities/:activityId
    - PATCH /api/activities/:activityId/status
  - Allocations
    - POST /api/activities/:activityId/allocations (bulk)
    - DELETE /api/allocations/:allocationId
    - GET /api/hardware/hosts/:hostId/timeline
  - Users
    - GET /api/users
    - POST /api/users
  - Hardware hosts
    - GET /api/hardware/hosts
    - POST /api/hardware/hosts
- Auto-delayed logic: on read/write, if now >= end_date and status ∉ {completed, cancelled, delayed}, persist status=delayed (idempotent).

Acceptance Criteria
- Creating, updating, and listing activities works; statuses enforce allowed values including delayed.
- Bulk host allocations detect and reject overlaps for the same host; returns per-host success/failure.
- Host timeline endpoint returns allocations plus computed "free since" and next reservations.
- Users CRUD works with fields: id, email, role, active, name?; roles include the provided set (Delivery Engineer, Network/Virtualization/Cloud/Automation Architect, PM, Service Manager, Program Manager, On-Site Engineer).
- RVTools parsed hosts can be persisted to hardware_pool without parser changes (reuse existing path).

Tasks
- [ ] Add enums/validation for statuses and roles.
- [ ] Implement activities endpoints.
- [ ] Implement allocations endpoints with overlap checks.
- [ ] Implement users endpoints.
- [ ] Implement host list and timeline endpoints.
- [ ] Wire auto-delayed status on reads/writes.
- [ ] Update apiClient.ts with new endpoints/types.
- [ ] Unit tests for delayed logic and overlap detection.

Dependencies
- SurrealDB running; enhanced schema applied (`enhanced_project_schema.surql`).

Labels: backend, api, surrealdb, projects, high-priority
