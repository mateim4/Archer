# GitHub Issues to Create for Hardware Basket Module

Copy and paste these into GitHub Issues for the LCMDesigner repository.

---

## Issue 1: Server Configuration Display in Hardware Basket Table

**Title:** [FEATURE] Display server specifications (CPU, Memory, Storage) in hardware basket table

**Labels:** enhancement, hardware-basket, frontend

**Description:**
Currently, the hardware basket table displays server models but doesn't show their detailed specifications like CPU, Memory, Storage, and Network configurations.

**Is your feature request related to a problem?**
Users can see that Dell servers are parsed and listed (e.g., SMI1, MEA1, VEI1), but they can't see what specifications each server has. The backend correctly parses component details, but the frontend table doesn't display them.

**Describe the solution you'd like**
- Expand the hardware models table to show:
  - **CPU/Processor specs**: Brand, cores, frequency
  - **Memory specs**: Capacity, type, configuration
  - **Storage specs**: Type, capacity, configuration
  - **Network specs**: Port count, speed, type
- Consider expandable rows or additional columns
- Ensure proper data formatting and display

**Technical Details:**
- Backend: `HardwareModel` struct contains `base_specifications` field with all component details
- Frontend: `VendorDataCollectionView.tsx` needs to be updated to display specification data
- API: `/api/hardware-baskets/{id}/models` already returns specification data

**Additional context**
The parsing engine already extracts specifications using `SpecParser`, but the UI only shows model names and descriptions.

---

## Issue 2: Lenovo Basket Isolation and Cross-Contamination Fix

**Title:** [BUG] Lenovo basket selection shows Dell server models instead of Lenovo

**Labels:** bug, hardware-basket, parsing

**Description:**
When selecting a Lenovo basket from the dropdown, the table displays Dell server models instead of the actual Lenovo models that were parsed.

**Is your feature request related to a problem?**
Yes - users upload Lenovo hardware baskets, select them from the dropdown, but see Dell models (SMI1, VEI1, etc.) instead of Lenovo models. This indicates either:
1. Cross-contamination between vendor baskets in the database
2. Incorrect basket-to-model relationships
3. Query filtering issues

**Describe the solution you'd like**
- Fix basket-to-model relationship queries to ensure proper isolation
- Verify that Lenovo parsing creates models with correct `basket_id` references
- Add vendor filtering to API queries to prevent cross-contamination
- Add logging to track which models belong to which baskets

**Technical Details:**
- Backend: Check `hardware_baskets.rs` model retrieval queries
- Database: Verify `basket_id` foreign key relationships in SurrealDB
- Parsing: Ensure Lenovo parser (`parse_lenovo_server_lots`, `parse_lenovo_parts`) creates proper relationships

**Steps to Reproduce:**
1. Upload a Dell basket file → models display correctly
2. Upload a Lenovo basket file → upload succeeds
3. Select Lenovo basket from dropdown → Dell models appear instead of Lenovo

**Expected Behavior:**
Lenovo basket should show only Lenovo models (ThinkSystem, ThinkEdge, etc.)

---

## Issue 3: Hardware Basket Table UI/UX Improvements

**Title:** [UI/UX] Improve hardware basket table layout and user experience

**Labels:** enhancement, ui/ux, frontend, hardware-basket

**Description:**
The hardware basket table needs UI/UX improvements for better data presentation and user interaction.

**Describe the solution you'd like**
- **Column Management**: Better column sizing and responsive layout
- **Search/Filter**: Add search functionality to filter models by name or type
- **Sorting**: Enable column sorting (name, type, specifications)
- **Export**: Add export functionality (CSV, Excel)
- **Loading States**: Better loading indicators during data fetch
- **Empty States**: Improved messaging when no models are found
- **Pagination**: Handle large datasets with pagination
- **Model Details**: Consider modal or expandable view for detailed specifications

**Technical Implementation:**
- Use React Table or similar for advanced table functionality
- Add proper TypeScript types for all table operations
- Implement proper error boundaries and loading states
- Ensure accessibility (keyboard navigation, screen readers)

**Additional context**
Current table is functional but basic - users need better ways to navigate and understand large hardware catalogs.

---

## Issue 4: Enhanced Parsing Engine Error Handling and Validation

**Title:** [FEATURE] Improve parsing engine error handling and Excel validation

**Labels:** enhancement, backend, parsing, rust

**Description:**
The current parsing engine successfully handles Dell and Lenovo files but needs better error handling, validation, and user feedback for edge cases.

**Describe the solution you'd like**
- **File Validation**: Validate Excel structure before parsing
- **Error Reporting**: Detailed error messages for parsing failures
- **Progress Tracking**: Real-time parsing progress for large files
- **Partial Success**: Handle files where some sheets/models fail to parse
- **Format Detection**: Auto-detect vendor and file format
- **Recovery**: Suggest fixes for common file format issues

**Technical Details:**
- Backend: Enhance `basket_parser_new.rs` with better error types
- Frontend: Display parsing progress and detailed error messages
- Add validation for required columns and data formats
- Implement retry mechanisms for recoverable errors

**Additional context**
Current parsing is robust but doesn't provide enough feedback when things go wrong or partially succeed.

---

## Issue 5: API Documentation and Testing Suite

**Title:** [FEATURE] Add comprehensive API documentation and testing

**Labels:** enhancement, documentation, backend, testing

**Description:**
The hardware basket API needs proper documentation and comprehensive testing for reliability and developer experience.

**Describe the solution you'd like**
- **API Documentation**: OpenAPI/Swagger documentation for all endpoints
- **Unit Tests**: Comprehensive test coverage for parsing logic
- **Integration Tests**: End-to-end API testing
- **Performance Tests**: Large file parsing benchmarks
- **Mock Data**: Test fixtures for different vendor formats
- **Error Scenarios**: Test edge cases and error conditions

**Technical Implementation:**
- Add `utoipa` crate for Rust API documentation
- Implement `tokio-test` for async testing
- Create test fixtures with sanitized vendor data
- Add CI/CD pipeline testing
- Document all API endpoints and data structures

**Additional context**
Current code works but lacks testing and documentation for maintenance and onboarding new developers.

---

**Instructions:**
1. Create each issue separately in the GitHub repository
2. Assign appropriate labels as indicated
3. Consider assigning to specific team members based on expertise
4. Link related issues together for better tracking
5. Add milestones for planned completion dates
