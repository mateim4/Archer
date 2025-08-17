# Issue 2: Lenovo Basket Isolation Fix

**Copy this content when creating the GitHub issue:**

---

**Title:** [BUG] Lenovo basket selection shows Dell server models instead of Lenovo

**Labels:** bug, hardware-basket, parsing

**Description:**

When selecting a Lenovo basket from the dropdown, the table displays Dell server models instead of the actual Lenovo models that were parsed.

## Bug Report

### Is your feature request related to a problem?

Yes - users upload Lenovo hardware baskets, select them from the dropdown, but see Dell models (SMI1, VEI1, etc.) instead of Lenovo models. This indicates either:
1. Cross-contamination between vendor baskets in the database
2. Incorrect basket-to-model relationships
3. Query filtering issues

### Steps to Reproduce

1. Upload a Dell basket file → models display correctly
2. Upload a Lenovo basket file → upload succeeds
3. Select Lenovo basket from dropdown → Dell models appear instead of Lenovo

### Expected Behavior

Lenovo basket should show only Lenovo models (ThinkSystem, ThinkEdge, etc.)

### Actual Behavior

Dell models (SMI1, VEI1, MEA1, etc.) appear when Lenovo basket is selected

## Describe the solution you'd like

- Fix basket-to-model relationship queries to ensure proper isolation
- Verify that Lenovo parsing creates models with correct `basket_id` references
- Add vendor filtering to API queries to prevent cross-contamination
- Add logging to track which models belong to which baskets

## Technical Details

- Backend: Check `hardware_baskets.rs` model retrieval queries
- Database: Verify `basket_id` foreign key relationships in SurrealDB
- Parsing: Ensure Lenovo parser (`parse_lenovo_server_lots`, `parse_lenovo_parts`) creates proper relationships

## Investigation Points

1. Check if `basket_id` is correctly set during Lenovo parsing
2. Verify API query in `/api/hardware-baskets/{id}/models` filters by basket
3. Examine database relationships between baskets and models
4. Add debugging logs to track model assignments

---

**Priority:** High - Critical bug affecting user experience
**Estimated Effort:** Medium (1-2 days)
**Files to investigate:**
- `backend/src/handlers/hardware_baskets.rs`
- `core-engine/src/basket_parser_new.rs`
- Database queries and relationships
