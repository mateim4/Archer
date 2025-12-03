# Perplexity Agent Instructions: Update Linear Documentation

**Goal:** Synchronize the local `product_docs/` with the Linear Project Documentation.

## Context
We have just completed **Phase 1: The Foundation** of the Archer "ITIL Swiss Knife" evolution.
The codebase now includes a fully functional **Tasks Module** (ITSM Ticketing) with a Kanban view and a Rust backend API.

## Source Files (Read these first)
1.  `product_docs/03_IMPLEMENTATION_LOGS.md` (Recent changes)
2.  `product_docs/04_PRODUCT_ROADMAP.md` (Current status)
3.  `product_docs/01_DATA_MODEL_AND_APP_DESIGN.md` (New Schema)

## Tasks for Perplexity/Linear Agent
Please perform the following actions in Linear:

1.  **Create "Phase 1 Release Notes" Document:**
    *   **Title:** Release Notes - Phase 1 (Foundation)
    *   **Content:** Summarize the implementation of the Tasks View, Ticket API, and Schema updates. Mention that the "Service Desk" is now live as "Tasks".

2.  **Update "Product Roadmap" Document:**
    *   Mark "UI Overhaul", "Schema Extension", and "Tasks Module" as **Completed**.
    *   Highlight "Integration Hub" as the **Next Priority**.

3.  **Update "Data Model" Document:**
    *   Add the definition of the `Ticket` entity (Incident, Problem, Change).
    *   Add the `TicketStatus` and `TicketPriority` enums.

4.  **Create "Integration Hub" Spec (Draft):**
    *   Create a new document titled "Spec: Integration Hub".
    *   Paste the content from `product_docs/08_UITOA_TRANSITION_PLAN.md` (Phase 2 section) into it.

## Execution
*   Read the local files listed above.
*   Use your Linear integration to create/update the documents as specified.
