Title: Frontend: visx Gantt for Projects + visx Host Timeline

Summary
- Replace custom DOM Gantt with visx for project activities.
- Add per-host visx timeline showing allocations, free-since, and future bookings.

Scope
- Packages: @visx/scale, @visx/axis, @visx/group, @visx/shape, @visx/grid, @visx/tooltip, @visx/zoom, @visx/brush, @visx/responsive, d3-time-format.
- Gantt features:
  - Time scale (UTC) and band scale (rows). Zoom/pan and brush.
  - Today marker; optional weekend shading.
  - Tooltips with name, dates, assignee, progress, status.
  - Status colors via CSS custom properties backed by Fluent tokens.
  - Delayed badge/overlay when status=delayed.
- Host timeline:
  - Render allocation windows; compute free-since and next reservations.
  - Link from Hardware Pool list/detail.

Acceptance Criteria
- ProjectDetailView renders visx Gantt with activities from API.
- Zoom/pan and tooltips work smoothly on large datasets.
- Colors and typography follow design system (no hardcoded hex values).
- Host detail page shows correct allocation bars and free window.

Tasks
- [ ] Create VisxGantt component and integrate into ProjectDetailView.
- [ ] Map status→tokenized color scheme.
- [ ] Add Today marker and tooltips.
- [ ] Implement HostTimeline component and route.
- [ ] Basic perf test with 500 activities.

Dependencies
- Issue 001 endpoints available.

Labels: frontend, visx, timeline, projects, ui
