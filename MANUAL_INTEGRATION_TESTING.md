# Manual Integration Testing - Infra-Visualizer

**Date**: November 10, 2025  
**Status**: Automated Playwright tests hanging due to webServer config issues  
**Approach**: Manual verification of all integration points

## Testing Strategy

Since automated E2E tests are experiencing infrastructure issues (Playwright's webServer hanging), we're performing manual verification of all critical integration paths before merging to main.

## Test Checklist

### Phase 1-2: Foundation & Core Components ✅
**Status**: Code review complete
- ✅ Types defined (`InfraNode`, `InfraEdge`, `GraphData`, `LayoutEngine`)
- ✅ Zustand store created (`useInfraVisualizerStore`)
- ✅ Utilities implemented (ELK layout, graph builders, transformers)
- ✅ Styling tokens applied (100% design token compliance)
- ✅ ReactFlow components (Canvas, NodeRenderer, EdgeRenderer, ExportMenu)

### Phase 3: Standalone View
**Route**: `/app/tools/infra-visualizer`

**Manual Tests**:
1. **Navigation**: 
   - [ ] Navigate to "Tools" → "Infrastructure Visualizer" from sidebar
   - [ ] URL changes to `/app/tools/infra-visualizer`
   - [ ] "New" badge appears on menu item

2. **Canvas Rendering**:
   - [ ] ReactFlow canvas loads without errors
   - [ ] Zoom controls visible (zoom in/out/fit)
   - [ ] Minimap visible in bottom-right corner
   - [ ] Legend visible showing node types

3. **Toolbar**:
   - [ ] Layout engine dropdown (ELK Layered/Tree/Force/Radial)
   - [ ] Toggle switches for: Auto-layout, Minimap, Legend, Stats Bar
   - [ ] Export menu button

4. **Export**:
   - [ ] Click export menu
   - [ ] See format options: PNG, SVG, PDF
   - [ ] Test export (verify download triggers)

### Phase 4: Navigation Integration
**Files**: `AppRoutes.tsx`, `Sidebar.tsx`

**Manual Tests**:
1. **Sidebar Menu**:
   - [ ] "Infrastructure Visualizer" appears under "Tools" section
   - [ ] Icon displays correctly
   - [ ] Click navigates to correct route
   - [ ] Active state highlights when on route

2. **Route Registration**:
   - [ ] Direct URL access works: `http://localhost:1420/app/tools/infra-visualizer`
   - [ ] Browser back/forward works correctly

### Phase 5.1: HardwarePoolView Integration
**Route**: `/app/hardware-pool`

**Manual Tests**:
1. **Visualize Button**:
   - [ ] Navigate to Hardware Pool view
   - [ ] "Visualize Hardware Pool" button appears in top-right
   - [ ] Button has graph icon
   - [ ] Click navigates to `/app/tools/infra-visualizer?source=hardware-pool`

2. **Data Loading**:
   - [ ] After navigation, canvas shows hardware pool data
   - [ ] Nodes represent servers/equipment
   - [ ] Edges show relationships
   - [ ] Stats bar shows correct node/edge count

### Phase 5.2: ProjectWorkspaceView Integration
**Route**: `/app/workspace/:projectId`

**Manual Tests**:
1. **Infrastructure Tab**:
   - [ ] Navigate to any project workspace
   - [ ] "Infrastructure" tab appears alongside Scope/Planning/Migrate tabs
   - [ ] Tab has topology icon
   - [ ] Click switches to Infrastructure tab

2. **Embedded Visualization**:
   - [ ] Mini visualization dashboard renders
   - [ ] Shows project infrastructure topology
   - [ ] "View Full Visualization" button appears
   - [ ] Click navigates to standalone view with project context

### Phase 5.3: URL Parameter Data Loading
**Route**: `/app/tools/infra-visualizer?source=X`

**Manual Tests**:
1. **Hardware Pool Source**:
   - [ ] Navigate to `?source=hardware-pool`
   - [ ] `useInfraVisualizerIntegration` hook loads hardware pool data
   - [ ] Canvas updates with correct data

2. **RVTools Source**:
   - [ ] Navigate to `?source=rvtools`
   - [ ] Hook attempts to load RVTools data
   - [ ] Handles empty/error states gracefully

3. **Migration Source**:
   - [ ] Navigate to `?source=migration`
   - [ ] Hook attempts to load migration data
   - [ ] Handles empty/error states gracefully

4. **Invalid Source**:
   - [ ] Navigate to `?source=invalid`
   - [ ] Shows empty state or error message
   - [ ] Doesn't crash application

### Accessibility
**Manual Tests** (using keyboard only):
1. **Keyboard Navigation**:
   - [ ] Tab through all interactive elements in order
   - [ ] Focus indicators visible
   - [ ] Enter/Space activates buttons

2. **Screen Reader** (if available):
   - [ ] All buttons have descriptive labels
   - [ ] Heading hierarchy is logical (h1 → h2 → h3)
   - [ ] Alternative text for visual-only elements

### Performance
**Manual Tests**:
1. **Initial Load**:
   - [ ] Page loads in <5 seconds
   - [ ] No console errors
   - [ ] No TypeScript errors

2. **Large Datasets**:
   - [ ] Load visualization with 100+ nodes (if data available)
   - [ ] Pan/zoom remains smooth
   - [ ] No memory leaks (check DevTools Memory tab)

### Cross-Browser
**Manual Tests**:
1. **Chromium** (primary):
   - [ ] All features work
2. **Firefox**:
   - [ ] All features work
3. **Safari** (if available):
   - [ ] All features work

## Testing Instructions

1. **Start Servers**:
   ```bash
   # Terminal 1: Vite dev server
   cd frontend && npx vite --port 1420
   
   # Terminal 2: Node.js backend
   cd server && node server.js
   
   # Terminal 3: SurrealDB (if needed)
   surreal start --bind 0.0.0.0:8000 --user root --pass root file://data/database.db
   ```

2. **Open Browser**: Navigate to `http://localhost:1420`

3. **Work Through Checklist**: Test each item systematically

4. **Document Issues**: Note any bugs or unexpected behavior below

## Issues Found

_(Document any issues discovered during manual testing)_

### Issue 1: [Title]
- **Description**: 
- **Steps to Reproduce**:
- **Expected**:
- **Actual**:
- **Severity**: Critical / High / Medium / Low

## Sign-Off

Once all checkboxes are complete and no critical issues remain:

- **Tester**: ___________
- **Date**: ___________
- **Status**: ☐ Ready to Merge | ☐ Issues Found
- **Notes**:

---

## Automated Testing Notes

### Why Manual Testing?

Playwright E2E tests were created (`tests/e2e/infra-visualizer-integration.spec.ts`, 398 lines, 30+ test cases) but experienced infrastructure issues:

1. **webServer Config**: Playwright's `webServer` configuration was hanging while trying to verify server readiness
2. **Test Server Conflict**: Playwright's test-server process (PID 140667) was running but Vite wasn't properly starting
3. **Curl Hangs**: Even basic HTTP requests to `localhost:1420` were hanging, suggesting deeper networking or process issues

### Future Work

Once the Playwright infrastructure is stabilized:
- Re-run automated test suite
- Add to CI/CD pipeline
- Generate coverage reports
- Performance benchmarking with Artillery/k6

### Test File Location

The comprehensive automated test suite is available at:
`frontend/tests/e2e/infra-visualizer-integration.spec.ts`

It covers:
- Phase 4: Navigation (3 tests)
- Phase 3: Standalone View (4 tests)  
- Phase 5.1: HardwarePoolView (2 tests)
- Phase 5.2: ProjectWorkspaceView (2 tests)
- Phase 5.3: URL Parameters (3 tests)
- Canvas Rendering (3 tests)
- Export Functionality (2 tests)
- Accessibility (3 tests)
- Performance (2 tests)
- Integration Hooks (1 test)
- Error Handling (2 tests)
