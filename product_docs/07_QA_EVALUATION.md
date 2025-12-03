# 7. QA Consideration and Evaluations

## Testing Strategy

### 1. Unit Testing
*   **Frontend:** Vitest + React Testing Library. Focus on Component logic and State management.
*   **Backend:** Rust `cargo test`. Focus on business logic, parsers, and placement algorithms.

### 2. Integration Testing
*   **API:** Postman/Newman or Rust integration tests hitting a test database.
*   **Connectors:** Mock servers for Nutanix/Cisco APIs to test Integration Hub resilience.

### 3. End-to-End (E2E) Testing
*   **Tool:** Playwright.
*   **Scope:** Critical User Journeys (Create Project, Approve Agent Action, View Inventory).
*   **Visual Regression:** Snapshot testing for "Acrylic" UI consistency.

### 4. AI Evaluation (Agentic QA)
*   **Evals:** A dataset of "Golden Scenarios" (Input -> Expected Action).
*   **Metric:** Success Rate of Agent correctly identifying the Intent and choosing the right Tool.
*   **Regression:** Run Evals on every prompt/model change.

## Quality Gates
*   **CI/CD:** GitHub Actions.
    *   Lint (ESLint/Clippy).
    *   Test (Unit + Integration).
    *   Build (Rust + Vite).
*   **Code Review:** Mandatory for all PRs.

## Performance Goals
*   **UI Latency:** < 100ms for interactions.
*   **Dashboard Load:** < 1s for "Live Inventory".
*   **Agent Response:** < 5s for initial thought.
