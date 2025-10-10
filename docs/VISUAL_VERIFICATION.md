# Visual Verification Testing

## Overview
Automated Playwright-based visual regression tests for LCMDesigner UI components and design system compliance.

## Quick Start

Run the complete visual verification suite (auto-starts dev server):
```bash
npm run verify:ui
```

## What Gets Tested

### Issue #42: Project Header & Layout Consistency
- Stats cards with left-aligned icons
- Consistent 16px padding across cards
- Horizontal alignment of project header icon and title

### Issue #43: Gantt Chart Interactions
- Gantt chart bars are clickable
- Navigation to Activities tab on bar click
- Activity highlighting

### Issue #44: Add Activity Modal
- Modal accessibility and form structure
- All required fields present (name, type, dates, assignee, description, status, priority)
- Form validation behavior

### Issue #45: Activities Tab UX
- Single-column layout (no split view)
- Inline editing for assignee, start date, and end date
- Hover effects showing edit pencil icon

## Output

### Screenshots
All test screenshots are saved to `test-screenshots/`:
- `00-initial-page.png` - Full page on load
- `01-stats-cards.png` - Stats cards section
- `02-project-header.png` - Header alignment
- `03-timeline-tab.png` - Timeline/Gantt view
- `04-add-activity-modal.png` - Activity creation modal
- `05-activities-tab.png` - Activities list view
- `06-assignee-hover.png` - Assignee hover state
- `07-date-hover.png` - Date field hover state
- `08-activity-detail.png` - Individual activity card

### Test Results
`test-screenshots/test-results.json` contains:
```json
{
  "timestamp": "2025-10-09T21:49:23.461Z",
  "url": "http://127.0.0.1:1420/app/projects/proj-2",
  "issues": [],
  "completed": true
}
```

## Architecture

### Components
1. **`test-comprehensive.mjs`** - Playwright test suite with exportable `runVisualRegression()` function
2. **`scripts/run-visual-verification.mjs`** - Orchestrator that manages dev server lifecycle and invokes tests
3. **`package.json`** - `verify:ui` npm script entry point

### Environment Variables
- `LCMDESIGNER_HOST` - Dev server host (default: `127.0.0.1`)
- `LCMDESIGNER_PORT` - Dev server port (default: `1420`)

Example:
```bash
LCMDESIGNER_HOST=0.0.0.0 LCMDESIGNER_PORT=3000 npm run verify:ui
```

## CI Integration

The script exits with code 1 on failure, making it suitable for CI pipelines:
```bash
npm run verify:ui || exit 1
```

## Manual Verification

After running the suite, visually inspect screenshots in `test-screenshots/` to confirm:
1. Design system consistency (Fluent UI 2, glassmorphic aesthetic)
2. Typography (Poppins font family)
3. Color palette (purple gradients, proper contrast)
4. Interactive states (hover effects, focus indicators)

## Troubleshooting

### Port Already in Use
The script will reuse an existing dev server if port 1420 is already bound.

### Connection Refused
Ensure no firewall blocks localhost connections and that Vite can bind to the configured host.

### Screenshot Differences
Visual regression differences may indicate:
- Intentional design changes (update baseline)
- Browser rendering variations (check browser version)
- Timing issues (adjust `waitForTimeout` values)

## Future Enhancements
- [ ] Pixel-perfect diff comparison against baseline screenshots
- [ ] Backend API health checks before UI tests
- [ ] Parallel test execution for faster runs
- [ ] Automated baseline updates on design system changes
