# Issue 1: Server Configuration Display

**Copy this content when creating the GitHub issue:**

---

**Title:** [FEATURE] Display server specifications (CPU, Memory, Storage) in hardware basket table

**Labels:** enhancement, hardware-basket, frontend

**Description:**

Currently, the hardware basket table displays server models but doesn't show their detailed specifications like CPU, Memory, Storage, and Network configurations.

## Is your feature request related to a problem?

Users can see that Dell servers are parsed and listed (e.g., SMI1, MEA1, VEI1), but they can't see what specifications each server has. The backend correctly parses component details, but the frontend table doesn't display them.

## Describe the solution you'd like

- Expand the hardware models table to show:
  - **CPU/Processor specs**: Brand, cores, frequency
  - **Memory specs**: Capacity, type, configuration
  - **Storage specs**: Type, capacity, configuration
  - **Network specs**: Port count, speed, type
- Consider expandable rows or additional columns
- Ensure proper data formatting and display

## Technical Details

- Backend: `HardwareModel` struct contains `base_specifications` field with all component details
- Frontend: `VendorDataCollectionView.tsx` needs to be updated to display specification data
- API: `/api/hardware-baskets/{id}/models` already returns specification data

## Additional context

The parsing engine already extracts specifications using `SpecParser`, but the UI only shows model names and descriptions.

---

**Priority:** High - Core functionality enhancement
**Estimated Effort:** Medium (2-3 days)
**Files to modify:** 
- `frontend/src/views/VendorDataCollectionView.tsx`
- `frontend/src/components/` (new table component)
