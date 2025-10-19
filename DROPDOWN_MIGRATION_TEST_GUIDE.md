# Dropdown Migration Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the dropdown migration in GuidesView, DesignDocsView, and SettingsView. All dropdowns have been migrated from Fluent UI `<Dropdown>` and native `<select>` elements to the `PurpleGlassDropdown` component.

## Pre-Requisites
- Frontend dev server running on http://localhost:1420
- Browser with developer tools available
- Basic familiarity with the LCMDesigner UI

## Test 1: GuidesView - Category Filter

### Location
Navigate to: http://localhost:1420/#/guides

### Steps
1. **Visual Inspection**
   - Verify the page loads without errors
   - Locate two dropdown components in the toolbar area (Category and Difficulty)
   - Verify dropdowns have glassmorphic styling (light glass effect)

2. **Category Dropdown Functionality**
   - Click on the "Category" dropdown (should show "All Categories" initially)
   - Verify dropdown menu opens smoothly
   - Verify dropdown menu displays all 5 options:
     - All Categories
     - Migration
     - Lifecycle
     - Hardware
     - General
   - Select "Migration"
   - Verify dropdown closes
   - Verify guides list filters to show only migration-related guides
   - Verify the dropdown now displays "Migration" as selected value

3. **Keyboard Navigation**
   - Tab to the Category dropdown
   - Press Enter or Space to open
   - Use arrow keys to navigate options
   - Press Enter to select an option
   - Press Escape to close without selecting

### Expected Results
- ✅ Dropdown opens and closes smoothly
- ✅ All options are visible and selectable
- ✅ Filter functionality works (guides list updates)
- ✅ Selected value is displayed correctly
- ✅ Keyboard navigation works
- ✅ Glassmorphic styling is visible (light blur/transparency effect)

## Test 2: GuidesView - Difficulty Filter

### Location
Same page: http://localhost:1420/#/guides

### Steps
1. **Difficulty Dropdown Functionality**
   - Click on the "Difficulty" dropdown (should show "All Levels" initially)
   - Verify dropdown menu opens smoothly
   - Verify dropdown menu displays all 4 options:
     - All Levels
     - Beginner
     - Intermediate
     - Advanced
   - Select "Beginner"
   - Verify dropdown closes
   - Verify guides list filters to show only beginner-level guides
   - Verify the dropdown now displays "Beginner" as selected value

2. **Combined Filters Test**
   - Set Category to "Migration"
   - Set Difficulty to "Beginner"
   - Verify guides list shows only beginner migration guides (or empty state if none exist)
   - Reset filters by selecting "All Categories" and "All Levels"
   - Verify full guides list returns

### Expected Results
- ✅ Difficulty dropdown works independently
- ✅ Combined filters work together correctly
- ✅ Empty state displays when no guides match filters
- ✅ Resetting filters restores all guides

## Test 3: DesignDocsView - Document Type Selector

### Location
Navigate to: http://localhost:1420/#/design-docs

### Steps
1. **Access Form**
   - Click the "New Document" button
   - Verify the create document form appears

2. **Document Type Dropdown Functionality**
   - Locate the "Document Type" dropdown in the form
   - Verify it has the label "Document Type" with the PurpleGlass styling
   - Click on the dropdown (should show "High Level Design (HLD)" as default)
   - Verify dropdown menu opens
   - Verify dropdown menu displays all 6 options:
     - High Level Design (HLD)
     - Low Level Design (LLD)
     - Architecture
     - Requirements
     - Technical Specification
     - API Documentation
   - Select "Low Level Design (LLD)"
   - Verify dropdown closes and displays "Low Level Design (LLD)"

3. **Form Integration**
   - Fill in a document name (e.g., "Test Document")
   - Select document type "Architecture"
   - Add some content in the textarea
   - Verify the form can be submitted with the selected document type
   - Cancel the form
   - Click "New Document" again
   - Verify dropdown resets to default value (HLD)

### Expected Results
- ✅ Dropdown appears in form with proper label
- ✅ All 6 document types are available
- ✅ Selected type is used in form data
- ✅ Dropdown integrates properly with form state
- ✅ Form reset works correctly
- ✅ Required indicator visible (if applicable)

## Test 4: SettingsView - Optimization Strategy Selector

### Location
Navigate to: http://localhost:1420/#/settings

### Steps
1. **Visual Inspection**
   - Locate the "Optimization Strategy" dropdown in the settings form
   - Verify it has the label "Optimization Strategy"
   - Verify helper text is displayed: "Balance between cost, performance, and efficiency"
   - Verify glassmorphic styling is applied

2. **Optimization Dropdown Functionality**
   - Click on the dropdown (should show "Balanced" as default)
   - Verify dropdown menu opens
   - Verify dropdown menu displays all 4 options:
     - Cost Optimized
     - Performance Optimized
     - Balanced
     - Efficiency Optimized
   - Select "Performance Optimized"
   - Verify dropdown closes and displays "Performance Optimized"

3. **State Persistence Test**
   - Select "Cost Optimized"
   - Navigate away from settings (e.g., to Guides)
   - Navigate back to Settings
   - Verify the selected value persists (should still show "Cost Optimized")

### Expected Results
- ✅ Dropdown has proper label and helper text
- ✅ All 4 optimization options available
- ✅ Selected value updates correctly
- ✅ Value persists when navigating away and back
- ✅ Glassmorphic styling matches other form elements

## Accessibility Testing

### Keyboard Navigation
For all three views, test the following:

1. **Tab Navigation**
   - Tab through the page
   - Verify dropdowns receive focus with visible focus indicator
   - Verify tab order is logical

2. **Keyboard Interaction**
   - Enter/Space to open dropdown
   - Arrow keys to navigate options
   - Enter to select
   - Escape to close without selecting
   - Tab to move to next element

3. **Screen Reader** (if available)
   - Use screen reader to navigate to dropdowns
   - Verify labels are announced
   - Verify selected values are announced
   - Verify options are announced when navigating

### Expected Results
- ✅ All dropdowns are keyboard accessible
- ✅ Focus indicators are visible
- ✅ ARIA labels are present and correct
- ✅ Screen reader announcements are appropriate

## Visual Regression Testing

### Glassmorphic Styling Checklist
For each dropdown, verify:
- [ ] Light glass effect (slight blur and transparency)
- [ ] Consistent with PurpleGlass design system
- [ ] Proper border styling
- [ ] Hover state changes (if applicable)
- [ ] Focus state styling
- [ ] Disabled state styling (if applicable)

### Responsive Testing
Test on different viewport sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Common Issues to Watch For

### Potential Problems
1. **Dropdown not opening**: Check browser console for JavaScript errors
2. **Options not displaying**: Verify options array is populated correctly
3. **Selection not working**: Check onChange handler is connected
4. **Styling issues**: Verify PurpleGlass component CSS is loaded
5. **State not updating**: Check component state management

### Debugging Steps
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Use React DevTools to inspect component state
5. Verify dropdown component props in DevTools

## Success Criteria

### All Tests Pass When:
- ✅ All dropdowns render correctly with PurpleGlass styling
- ✅ All dropdown options are selectable
- ✅ Filter/selection functionality works as expected
- ✅ State management works correctly
- ✅ Keyboard navigation is fully functional
- ✅ No console errors appear
- ✅ No TypeScript errors in build
- ✅ Responsive design works across viewports
- ✅ Accessibility features work properly

## Smoke Test Summary

### Quick Verification (5 minutes)
1. Navigate to Guides → Select a category → Select a difficulty → Verify filtering
2. Navigate to Design Docs → Click New Document → Select a doc type → Verify selection
3. Navigate to Settings → Select an optimization strategy → Verify selection

If all three work correctly, the migration is successful!

## Rollback Plan

If issues are found:
1. Document the specific issue
2. Check git log for the migration commit
3. Consider reverting specific file if needed
4. Report issue with detailed steps to reproduce

## Notes
- This migration replaces Fluent UI `<Dropdown>` and native `<select>` elements
- All dropdowns now use `PurpleGlassDropdown` from `@/components/ui`
- Glass variant used: `glass="light"` for consistent styling
- No custom `.lcm-dropdown` CSS classes remain in migrated files
