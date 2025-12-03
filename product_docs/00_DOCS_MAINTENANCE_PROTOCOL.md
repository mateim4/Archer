# Documentation Maintenance Protocol

**Goal:** Ensure `product_docs/` remains the Single Source of Truth (SSOT) for Archer.

## Protocol for AI Agents & Developers

Whenever you perform a task that impacts the system architecture, UI, or roadmap, you **MUST** update the corresponding file in this directory.

### 1. Trigger Events & Actions

| Event | File to Update | Action |
| :--- | :--- | :--- |
| **New Feature Implemented** | `03_IMPLEMENTATION_LOGS.md` | Add entry with date, feature, and branch. |
| **Roadmap Item Completed** | `04_PRODUCT_ROADMAP.md` | Mark item as `[x]`. |
| **Database Schema Change** | `01_DATA_MODEL_AND_APP_DESIGN.md` | Update schema definitions. |
| **New UI Component/Token** | `02_FRONTEND_TOKEN_MAP...` | Add new token or component usage. |
| **Security/Auth Change** | `06_SECURITY_EVALUATION.md` | Update security architecture section. |
| **New Test Suite Added** | `07_QA_EVALUATION.md` | Update testing strategy. |

### 2. "Perpetual Update" Workflow

At the end of every significant coding session:
1.  **Review** `04_PRODUCT_ROADMAP.md` to see if we advanced any goals.
2.  **Log** the work in `03_IMPLEMENTATION_LOGS.md`.
3.  **Verify** that the code matches `01_DATA_MODEL...` (Drift Detection).

### 3. Directory Structure

*   `00_DOCS_MAINTENANCE_PROTOCOL.md`: This file.
*   `01_DATA_MODEL_AND_APP_DESIGN.md`: Backend, DB, and Architecture.
*   `02_FRONTEND_TOKEN_MAP_AND_DESIGN_SYSTEM.md`: UI/UX Standards.
*   `03_IMPLEMENTATION_LOGS.md`: Running log of changes.
*   `04_PRODUCT_ROADMAP.md`: Future plans and status.
*   `05_FEATURES_AND_BUSINESS_DRIVERS.md`: The "Why".
*   `06_SECURITY_EVALUATION.md`: Security posture.
*   `07_QA_EVALUATION.md`: Testing strategy.
*   `08_UITOA_TRANSITION_PLAN.md`: Specific migration plan for "ITIL Swiss Knife".
