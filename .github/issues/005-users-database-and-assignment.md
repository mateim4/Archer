Title: Users: Local User Database and Activity Assignment

Summary
- Implement a simple local user store to support assigning activities.
- Prepare roles aligned with delivery org; AD integration later.

Scope
- Table: user { id, email, role, active, name? }.
- Endpoints: GET/POST /api/users.
- Frontend: fetch users for dropdowns; display role badges.

Acceptance Criteria
- Users can be created and listed; roles validated.
- Activities can be assigned to users;
- "Pending assignment" visible when empty.

Tasks
- [ ] Implement user endpoints and validation.
- [ ] Add user fetching to apiClient.
- [ ] Update activity forms/components to show users and pending assignment.

Dependencies
- Issue 001 (user endpoints).

Labels: backend, frontend, users, projects
