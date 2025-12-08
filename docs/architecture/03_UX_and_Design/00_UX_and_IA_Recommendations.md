Based on extensive research conducted by Perplexity, this document encompasses the target architecture of the application from an UI and UX perspective.

**Version**: 1.0  
**Date**: December 2, 2025  
**Purpose**: Frontend Development Guide - Best-in-Class ITSM Interface  
**Research Basis**: 327+ sources analyzing ServiceNow, Jira, Freshservice, Datadog, Dynatrace, and other platforms

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design System: Purple Glass](#design-system-purple-glass)
3. [Layout Architecture](#layout-architecture)
4. [Component Specifications](#component-specifications)
5. [Page Layouts](#page-layouts)
6. [Interaction Patterns](#interaction-patterns)
7. [AI-Integrated UX](#ai-integrated-ux)
8. [Performance Guidelines](#performance-guidelines)
9. [Accessibility](#accessibility)
10. [Dark Mode](#dark-mode)
11. [Animation Guidelines](#animation-guidelines)
12. [Implementation Checklist](#implementation-checklist)
13. [Development Stack](#development-stack)
14. [Success Metrics](#success-metrics)
15. [References](#references)

---

# Executive Summary

Archer ITSM's UI/UX strategy is built on addressing the **#1 market complaint**: **complexity**. After analyzing 327+ sources across ServiceNow, Jira, Freshservice, and other platforms, we've identified clear patterns of what users love and hate. This specification translates those insights into a modern, fast, intuitive interface that works out-of-box.

## Core UX Principles

1. **Speed First** - Target <100ms interactions (vs ServiceNow's "way too slow")
2. **Simplicity by Design** - Fewer clicks, opinionated defaults (vs ServiceNow's "too many clicks")
3. **Modern Aesthetic** - Purple Glass design system (vs "aging interfaces")
4. **Keyboard-Driven** - Power users never touch mouse (Cmd+K everything)
5. **Mobile-Equal** - Full features on mobile (vs "limited mobile admin")
6. **Contextual Intelligence** - Related info surfaces automatically (vs "context switching")

## Key Differentiators (Based on Research)

**Addressing Competitor Pain Points:**

1. **Speed** - Target <100ms (vs ServiceNow: "way too slow literally everyday")
2. **Simplicity** - Fewer clicks (vs ServiceNow: "too many clicks")
3. **Modern UI** - Purple Glass (vs BMC: "aging interface")
4. **Keyboard-first** - Cmd+K everything (vs fragmented shortcuts)
5. **Mobile-equal** - Full features (vs "limited mobile admin")
6. **Context preserved** - Seamless navigation (vs "context switching")

---

# Design System: Purple Glass

## Philosophy

Purple Glass combines glassmorphism's modern aesthetic with enterprise professionalism. Think: Apple's design language meets Fluent UI 2, optimized for productivity tools.

**Inspiration:**
- Apple's translucent design language
- Microsoft Fluent UI 2 component library
- Linear's speed and polish
- Notion's clean simplicity

## Color Palette

### Primary Colors

```css
--color-primary: #6B4CE6;           /* Archer Purple - main brand */
--color-primary-hover: #5A3DD4;     /* Hover state */
--color-primary-active: #4929C2;    /* Active/pressed */
--color-primary-light: #8B6FF0;     /* Lighter variant */
--color-primary-lightest: #E8E1FC;  /* Backgrounds, badges */
```

**Usage:**
- Primary buttons, active states, links
- Focus indicators, progress bars
- Brand elements, call-to-action items

### Semantic Colors

```css
--color-success: #10B981;           /* Green - success states */
--color-warning: #F59E0B;           /* Amber - warnings */
--color-error: #EF4444;             /* Red - errors, critical */
--color-info: #3B82F6;              /* Blue - info, neutral actions */
```

**Usage:**
- Success: Completed actions, confirmations, "Open" status
- Warning: Cautions, attention needed, "In Progress" status
- Error: Failed actions, critical alerts, validation errors
- Info: Information messages, neutral notifications

### Neutral Palette (Light Mode)

```css
--color-bg-primary: #FFFFFF;        /* Main background */
--color-bg-secondary: #F9FAFB;      /* Secondary surfaces */
--color-bg-tertiary: #F3F4F6;       /* Tertiary backgrounds */
--color-text-primary: #111827;      /* Main text */
--color-text-secondary: #6B7280;    /* Secondary text */
--color-text-tertiary: #9CA3AF;     /* Tertiary/disabled text */
--color-border: #E5E7EB;            /* Default borders */
--color-border-hover: #D1D5DB;      /* Hover borders */
```

### Neutral Palette (Dark Mode)

```css
--color-bg-primary: #0F172A;        /* Main background */
--color-bg-secondary: #1E293B;      /* Secondary surfaces */
--color-bg-tertiary: #334155;       /* Tertiary backgrounds */
--color-text-primary: #F1F5F9;      /* Main text */
--color-text-secondary: #CBD5E1;    /* Secondary text */
--color-text-tertiary: #94A3B8;     /* Tertiary/disabled text */
--color-border: #334155;            /* Default borders */
--color-border-hover: #475569;      /* Hover borders */
```

## Glass Effect

The signature "Purple Glass" effect uses backdrop blur and transparency:

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}

.glass-dark {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(71, 85, 105, 0.3);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}
```

**Usage:**
- Top navigation bar
- Sidebar navigation
- Modal overlays
- Floating panels
- Command palette

## Typography

### Font Families

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Inter** is chosen for:
- Excellent readability at all sizes
- Wide character set support
- Optimized for screens
- Professional appearance

### Font Sizes

```css
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - body small, secondary */
--text-base: 1rem;     /* 16px - body text, default */
--text-lg: 1.125rem;   /* 18px - emphasized body */
--text-xl: 1.25rem;    /* 20px - h4, card titles */
--text-2xl: 1.5rem;    /* 24px - h3, section headers */
--text-3xl: 1.875rem;  /* 30px - h2, page headers */
--text-4xl: 2.25rem;   /* 36px - h1, hero */
```

### Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.25;      /* Headings */
--leading-normal: 1.5;      /* Body text */
--leading-relaxed: 1.75;    /* Long-form content */
```

## Spacing System

Based on 4px increments for consistency:

```css
/* Base unit: 4px */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

**Guidelines:**
- Component padding: space-4 (16px) minimum
- Section spacing: space-8 (32px)
- Page margins: space-6 to space-8 (24px-32px)
- Element gaps: space-2 to space-4 (8px-16px)

## Border Radius

```css
--radius-sm: 0.375rem;  /* 6px - small elements */
--radius-md: 0.5rem;    /* 8px - default buttons, inputs */
--radius-lg: 0.75rem;   /* 12px - cards, panels */
--radius-xl: 1rem;      /* 16px - large cards */
--radius-2xl: 1.5rem;   /* 24px - modals */
--radius-full: 9999px;  /* Full circle/pill */
```

## Shadows

Elevation system for visual hierarchy:

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

**Usage:**
- xs: Subtle buttons, inputs
- sm: Cards at rest
- md: Dropdowns, tooltips
- lg: Cards on hover, elevated panels
- xl: Modals, important overlays
- 2xl: Full-screen overlays, critical modals

## Animation

```css
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 350ms;

--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

**Principles:**
- Fast: Micro-interactions (hover, focus)
- Base: Most transitions (open/close, show/hide)
- Slow: Complex animations (page transitions)
- Ease-out: Entrances (elements appearing)
- Ease-in: Exits (elements disappearing)

---

# Layout Architecture

## Overall Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar (60px fixed)                                       │
│  [Logo] [Global Search] [Notifications] [Profile]          │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                      │
│      │  Main Content Area                                  │
│ Side │  - Breadcrumbs                                      │
│ bar  │  - Page Header                                      │
│      │  - Content                                          │
│ 240px│                                                      │
│      │                                                      │
│      │                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

### Specifications

**Top Bar:**
- Height: 60px (fixed)
- Background: Glass effect
- Position: Sticky top, z-index: 1000
- Border: Bottom 1px border

**Sidebar:**
- Width: 240px (collapsed: 60px)
- Background: Slightly darker than main bg
- Position: Fixed left
- Border: Right 1px border

**Main Content:**
- Margin-left: 240px (adjusts when sidebar collapsed)
- Padding: space-6 (24px)
- Max-width: None (fluid)
- Background: bg-primary

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape, small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Laptops, small desktops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large desktops */
```

### Mobile Strategy (< 768px)

- **Sidebar**: Overlay (toggle button in top bar)
- **Top bar**: 56px height, simplified
- **Content**: Full width, padding space-4
- **Tables**: Horizontal scroll or card view
- **Modals**: Full screen
- **Forms**: Single column

### Tablet Strategy (768px - 1024px)

- **Sidebar**: Collapsible, persistent when expanded
- **Content**: Adaptive, may use 2-column layouts
- **Tables**: Full width, scrollable
- **Modals**: Centered, max-width
- **Forms**: Single or two column

### Desktop Strategy (> 1024px)

- **Sidebar**: Always visible
- **Content**: Full features, multi-column layouts
- **Tables**: All features enabled
- **Modals**: Centered, appropriate width
- **Forms**: Multi-column layouts
- **Dashboard**: 3-4 column grid

## Grid System

12-column grid for flexible layouts:

```css
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

.col-span-6 { grid-column: span 6; }  /* Half width */
.col-span-4 { grid-column: span 4; }  /* Third width */
.col-span-3 { grid-column: span 3; }  /* Quarter width */
```

---

# Component Specifications

## 1. Top Navigation Bar

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ [Archer Logo]  [🔍 Global Search Cmd+K]  [+][🔔3][?][Avatar] │
└────────────────────────────────────────────────────────────────┘
     200px              500px max                    ~200px
```

### Elements (Left to Right)

#### 1. Logo (Left)

```html
<div class="logo-container">
  <img src="archer-icon.svg" alt="Archer" width="32" height="32" />
  <span class="logo-text">Archer ITSM</span>
</div>
```

**Specifications:**
- Container width: 200px
- Icon size: 32x32px
- Text: text-xl, font-semibold
- Padding: space-4
- Clickable (navigates to dashboard)

#### 2. Global Search (Center)

```html
<div class="global-search">
  <SearchIcon />
  <input placeholder="Search tickets, assets, docs..." />
  <kbd>⌘K</kbd>
</div>
```

**Specifications:**
- Width: 500px (max-width: 60% viewport)
- Height: 40px
- Border-radius: radius-full
- Background: Glass with hover effect
- Padding: 12px 16px

**Behavior:**
- Focus: Expand slightly, increase shadow
- Type: Real-time suggestions dropdown
- Empty state: Show recent searches
- Categories: Tickets, Assets, Docs, Users with icons
- Keyboard nav: Arrow keys, Enter to select
- Shortcut: Cmd/Ctrl+K opens from anywhere

**Dropdown Structure:**

```
┌────────────────────────────────────┐
│ 🔍 login issues                    │
├────────────────────────────────────┤
│ 🎫 Tickets (3)                     │
│   #1234 - Login timeout            │
│   #1180 - Can't log in             │
│   #1090 - Login after update       │
│                                    │
│ 📦 Assets (1)                      │
│   AUTH-SERVER-01                   │
│                                    │
│ 📚 Docs (2)                        │
│   Login Troubleshooting Guide      │
│   Authentication Setup             │
└────────────────────────────────────┘
```

#### 3. Quick Actions (Right)

**Create Button:**
```html
<button class="btn-primary">
  <PlusIcon /> Create
</button>
```

Dropdown on click:
- New Ticket
- New Asset
- New Knowledge Article

**Notifications:**
```html
<button class="btn-icon" aria-label="Notifications">
  <BellIcon />
  <span class="badge">3</span>
</button>
```

- Badge: Shows unread count
- Dropdown: Live notification feed
- Mark as read functionality

**Help:**
```html
<button class="btn-icon" aria-label="Help">
  <HelpIcon />
</button>
```

Opens help modal/sidebar with:
- Keyboard shortcuts
- Documentation links
- Support contact
- What's new

**Profile:**
```html
<button class="btn-icon" aria-label="Profile">
  <Avatar src={user.avatar} name={user.name} size="32" />
</button>
```

Dropdown menu:
- View Profile
- Settings
- Dark Mode Toggle
- Sign Out

## 2. Sidebar Navigation

### Structure

```
┌─────────────────────┐
│ 🏠 Dashboard        │  ← Active state
│ 🎫 Tickets      42  │  ← Badge count
│ 📦 Assets           │
│ 📊 Monitoring    !  │  ← Alert indicator
│ 📚 Knowledge        │
│ 📈 Reports          │
│ ⚙️  Settings        │
│                     │
│ [Collapse Toggle]   │
└─────────────────────┘
```

### Navigation Items

**HTML Structure:**

```html
<nav class="sidebar">
  <a href="/dashboard" class="nav-item active">
    <HomeIcon />
    <span>Dashboard</span>
  </a>
  <a href="/tickets" class="nav-item">
    <TicketIcon />
    <span>Tickets</span>
    <span class="badge">42</span>
  </a>
  <a href="/monitoring" class="nav-item">
    <MonitorIcon />
    <span>Monitoring</span>
    <span class="alert-dot"></span>
  </a>
</nav>
```

### Interaction States

**Default:**
```css
.nav-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast);
}

.nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}
```

**Active:**
```css
.nav-item.active {
  background: var(--color-primary-lightest);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  border-left: 3px solid var(--color-primary);
}
```

**With Badge:**
```css
.badge {
  margin-left: auto;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
}
```

**Alert Indicator:**
```css
.alert-dot {
  width: 8px;
  height: 8px;
  background: var(--color-error);
  border-radius: 50%;
  margin-left: auto;
  animation: pulse 2s infinite;
}
```

### Collapsible Behavior

**Collapsed State (60px width):**
- Show icons only
- Hide text labels
- Tooltip on hover
- Badges become dots
- Toggle button rotates 180°

**Toggle Button:**
```html
<button class="sidebar-toggle">
  <ChevronLeftIcon />
</button>
```

**State Persistence:**
- Save in localStorage: `sidebarCollapsed: true/false`
- Remember per user session

## 3. Page Header

### Standard Layout

```
┌──────────────────────────────────────────────────────────┐
│ 📁 Dashboard > Tickets                     [Filter] [+]  │
│ ─────────────────────────────────────────────────────    │
│ My Open Tickets                                          │
│ 23 tickets • Updated 2 minutes ago                       │
└──────────────────────────────────────────────────────────┘
```

### Components

**1. Breadcrumbs:**

```html
<nav class="breadcrumbs">
  <a href="/dashboard">Dashboard</a>
  <ChevronRightIcon />
  <span>Tickets</span>
</nav>
```

**Styling:**
- Font-size: text-sm
- Color: text-secondary
- Clickable items: hover underline
- Current page: Not clickable, text-primary
- Icons: 16x16px between items

**2. Title:**

```html
<div class="page-header">
  <h1>My Open Tickets</h1>
  <div class="actions">
    <button class="btn-secondary">
      <FilterIcon /> Filter
    </button>
    <button class="btn-primary">
      <PlusIcon /> Create Ticket
    </button>
  </div>
</div>
```

**Styling:**
- Title: text-3xl, font-bold, text-primary
- Actions: Aligned right, gap space-3
- Margin-bottom: space-6

**3. Subtitle/Metadata:**

```html
<div class="page-subtitle">
  <span>23 tickets</span>
  <span class="dot">•</span>
  <span>Updated 2 minutes ago</span>
</div>
```

**Styling:**
- Font-size: text-sm
- Color: text-secondary
- Dot separator: Opacity 0.5

### With Tabs

```html
<div class="page-tabs">
  <button class="tab active">
    Open <span class="count">23</span>
  </button>
  <button class="tab">
    In Progress <span class="count">8</span>
  </button>
  <button class="tab">
    Resolved <span class="count">156</span>
  </button>
  <button class="tab">All</button>
</div>
```

**Tab Styling:**

```css
.tab {
  padding: var(--space-3) var(--space-4);
  border-bottom: 3px solid transparent;
  color: var(--color-text-secondary);
  transition: all var(--duration-base);
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.tab:hover:not(.active) {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-border-hover);
}
```

## 4. Data Tables

### Design Philosophy

**Problem:** Users hate ServiceNow's slow tables, Freshservice's limited reporting  
**Solution:** Fast, customizable, keyboard-navigable tables with instant search

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 🔍 Search...              [Columns] [Filter] [Export] [Refresh] │
├──────────────────────────────────────────────────────────────────┤
│ ☐ │ #      │ Title         │ Status    │ Priority │ Updated   │
├──────────────────────────────────────────────────────────────────┤
│ ☐ │ #1234  │ Login issue  │ 🟢 Open   │ 🔴 High  │ 2 min ago │
│ ☐ │ #1235  │ API timeout  │ 🟡 Prog.  │ 🟠 Med   │ 10 min    │
│ ☐ │ #1236  │ DB slow      │ 🟢 Open   │ 🔵 Low   │ 1 hour    │
└──────────────────────────────────────────────────────────────────┘
Showing 1-50 of 234                              < 1 2 3 4 5 ... >
```

### Features

#### 1. Column Management

**Drag to Reorder:**
- Visual indicator while dragging
- Drop zones highlight
- Save order per user

**Sort:**
- Click header: Sort ascending
- Click again: Sort descending
- Click third time: Remove sort
- Multi-column sort: Shift+Click

**Resize:**
- Drag column edge to resize
- Double-click edge: Auto-fit content
- Minimum width: 100px

**Show/Hide:**
- Dropdown with all columns
- Checkbox to toggle visibility
- Save preferences per user

#### 2. Bulk Actions

**Selection:**
```html
<div class="bulk-actions">
  <span>3 items selected</span>
  <button>Assign</button>
  <button>Update Status</button>
  <button>Delete</button>
  <button>Export</button>
</div>
```

**Behavior:**
- Checkbox in header: Select all visible
- Shift+Click: Range selection
- Cmd/Ctrl+Click: Multi-select
- Toolbar appears when items selected
- Sticky position during scroll

#### 3. Row Interactions

**States:**

```css
.table-row {
  transition: all var(--duration-fast);
}

.table-row:hover {
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.table-row.selected {
  background: var(--color-primary-lightest);
  border-left: 3px solid var(--color-primary);
}

.table-row:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
```

**Actions:**
- Click: Open detail (drawer or full page)
- Right-click: Context menu
- Keyboard: Arrow keys navigate, Enter opens

**Context Menu:**
- View Details
- Edit
- Assign to Me
- Change Status
- Delete
- Copy Link

#### 4. Status Badges

```html
<span class="status-badge status-open">
  <CheckCircleIcon />
  Open
</span>
```

**Styling:**

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid;
}

.status-open {
  background: #ECFDF5;
  color: #065F46;
  border-color: #10B981;
}

.status-in-progress {
  background: #FEF3C7;
  color: #92400E;
  border-color: #F59E0B;
}

.status-resolved {
  background: #DBEAFE;
  color: #1E40AF;
  border-color: #3B82F6;
}

.status-closed {
  background: #F3F4F6;
  color: #374151;
  border-color: #9CA3AF;
}
```

#### 5. Priority Indicators

```
🔴 Critical - #EF4444
🔴 High - #F97316
🟠 Medium - #F59E0B
🔵 Low - #3B82F6
⚪ None - #9CA3AF
```

**Display Options:**
- Icon only (compact view)
- Icon + text (default)
- Text only (accessible mode)

#### 6. Inline Editing

```html
<td class="editable" onDoubleClick={handleEdit}>
  <span class="value">High</span>
  <select class="edit-input" style="display:none">
    <option>Critical</option>
    <option>High</option>
    <option>Medium</option>
    <option>Low</option>
  </select>
</td>
```

**Behavior:**
- Double-click cell to edit
- Tab: Move to next editable field
- Shift+Tab: Previous field
- Enter: Save and close
- Escape: Cancel edit
- Auto-save on blur with loading indicator

#### 7. Performance Optimizations

**Virtual Scrolling:**
- Render only visible rows (+ buffer)
- Smooth scroll for 1000+ rows
- Library: react-window or @tanstack/react-virtual

**Debounced Search:**
```javascript
const debouncedSearch = debounce((query) => {
  fetchResults(query);
}, 300);
```

**Optimistic Updates:**
- Immediate UI update on edit
- Show loading indicator
- Rollback on error
- Toast notification on success/error

**Skeleton Loaders:**
- Show while fetching data
- Shimmer animation
- Preserve table structure

### Table Toolbar

```
┌──────────────────────────────────────────────────────────┐
│ 🔍 Search... [Columns▼] [Filter▼] [Group▼] [Export▼] [↻] │
└──────────────────────────────────────────────────────────┘
```

**Components:**

1. **Search:** Real-time filter across all columns
2. **Columns:** Show/hide, reorder
3. **Filter:** Advanced filters (status, priority, assignee, date range)
4. **Group:** Group by status, priority, assignee
5. **Export:** CSV, Excel, PDF
6. **Refresh:** Manual refresh data

## 5. Cards

### Standard Card

```html
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
    <button class="btn-icon"><MoreIcon /></button>
  </div>
  <div class="card-body">
    <p>Card content goes here. Multiple lines supported.</p>
  </div>
  <div class="card-footer">
    <span class="metadata">Footer content / metadata</span>
  </div>
</div>
```

**Styling:**

```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-base) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.card-body {
  margin-bottom: var(--space-4);
}

.card-footer {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
```

### Stat Card (Dashboard)

```html
<div class="stat-card">
  <div class="stat-label">Open Tickets</div>
  <div class="stat-value">42</div>
  <div class="stat-trend positive">
    <ArrowUpIcon />
    <span>12% from last week</span>
  </div>
</div>
```

**Styling:**

```css
.stat-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
}

.stat-trend.positive {
  color: var(--color-success);
}

.stat-trend.negative {
  color: var(--color-error);
}
```

**Variants:**
- Success: Green left border
- Warning: Amber left border
- Error: Red left border
- Info: Blue left border

### Interactive Card (Clickable)

```html
<a href="/tickets/1234" class="card-interactive">
  <div class="card-title">Ticket #1234</div>
  <div class="card-description">Login issues for users</div>
  <div class="card-metadata">
    <span class="badge-priority high">High</span>
    <span class="badge-status open">Open</span>
    <span class="timestamp">2 min ago</span>
  </div>
</a>
```

**Hover State:**

```css
.card-interactive {
  transition: all var(--duration-base) var(--ease-out);
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.card-interactive:active {
  transform: translateY(0);
}
```

## 6. Forms & Inputs

### Text Input

```html
<div class="form-field">
  <label for="email" class="form-label">
    <MailIcon />
    Email
    <span class="required">*</span>
  </label>
  <input
    id="email"
    type="email"
    class="form-input"
    placeholder="user@example.com"
    required
  />
  <span class="form-help">We'll never share your email</span>
</div>
```

**Specifications:**

```css
.form-field {
  margin-bottom: var(--space-6);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.required {
  color: var(--color-error);
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-bg-primary);
  transition: all var(--duration-fast);
}

/* Mobile: 44px for touch targets */
@media (max-width: 768px) {
  .form-input {
    height: 44px;
  }
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-lightest);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
}

.form-help {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
```

**Error State:**

```css
.form-input.error {
  border-color: var(--color-error);
}

.form-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

**Success State:**

```css
.form-input.success {
  border-color: var(--color-success);
}

.form-success {
  color: var(--color-success);
}
```

### Select Dropdown

```html
<div class="form-field">
  <label for="priority" class="form-label">Priority</label>
  <select id="priority" class="form-select">
    <option value="">Select priority...</option>
    <option value="critical">Critical</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
</div>
```

**Custom Select (Recommended):**

Use a headless UI library (Radix UI, Headless UI) for:
- Searchable (type to filter)
- Keyboard navigation
- Grouped options
- Multi-select with pills
- Virtual scrolling for 100+ options
- Custom rendering

**Example Multi-Select:**

```html
<div class="multi-select">
  <div class="selected-items">
    <span class="pill">
      Bug
      <button class="pill-remove">×</button>
    </span>
    <span class="pill">
      Login
      <button class="pill-remove">×</button>
    </span>
  </div>
  <input placeholder="Add labels..." />
</div>
```

### Textarea

```html
<div class="form-field">
  <label for="description" class="form-label">Description</label>
  <textarea
    id="description"
    class="form-textarea"
    rows="6"
    placeholder="Describe the issue..."
  ></textarea>
  <div class="textarea-footer">
    <span class="form-help">Markdown supported</span>
    <span class="char-count">0/1000</span>
  </div>
</div>
```

**Rich Text Editor Features:**
- Bold, italic, underline
- Headings (H1-H6)
- Bulleted and numbered lists
- Code blocks with syntax highlighting
- Links
- Tables
- File attachments (drag-drop)
- @mention autocomplete
- Emoji picker
- Markdown shortcuts

**Libraries:**
- TipTap (recommended)
- Slate
- Draft.js

### Checkbox & Radio

```html
<!-- Checkbox -->
<label class="checkbox">
  <input type="checkbox" />
  <span class="checkbox-label">Remember me</span>
</label>

<!-- Radio -->
<label class="radio">
  <input type="radio" name="option" value="1" />
  <span class="radio-label">Option 1</span>
</label>
```

**Styling:**

```css
.checkbox,
.radio {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.checkbox input[type="checkbox"],
.radio input[type="radio"] {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.checkbox input[type="checkbox"] {
  border-radius: 4px;
}

.radio input[type="radio"] {
  border-radius: 50%;
}

.checkbox input[type="checkbox"]:checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox input[type="checkbox"]:focus,
.radio input[type="radio"]:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Switch (Toggle)

```html
<label class="switch">
  <input type="checkbox" />
  <span class="switch-slider"></span>
  <span class="switch-label">Enable notifications</span>
</label>
```

**Styling:**

```css
.switch {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
}

.switch input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  transition: all var(--duration-base);
}

.switch-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all var(--duration-base);
}

.switch input:checked + .switch-slider {
  background: var(--color-primary);
}

.switch input:checked + .switch-slider::before {
  transform: translateX(20px);
}
```

**Use Cases:**
- Enable/disable features
- Show/hide sections
- Dark mode toggle
- Notification preferences

## 7. Buttons

### Primary Button

```html
<button class="btn btn-primary">
  <PlusIcon />
  Create Ticket
</button>
```

**Specifications:**

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-6);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background: var(--color-primary-active);
  transform: translateY(1px);
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 4px var(--color-primary-lightest);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Secondary Button

```html
<button class="btn btn-secondary">
  Cancel
</button>
```

```css
.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-color: var(--color-border-hover);
}
```

### Ghost Button

```html
<button class="btn btn-ghost">
  View Details
</button>
```

```css
.btn-ghost {
  background: transparent;
  color: var(--color-primary);
  border: none;
  box-shadow: none;
}

.btn-ghost:hover {
  background: var(--color-primary-lightest);
}
```

### Icon Button

```html
<button class="btn-icon" aria-label="Delete">
  <TrashIcon />
</button>
```

**Sizes:**

```css
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast);
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
}

.btn-icon-md {
  width: 40px;
  height: 40px;
}

.btn-icon-lg {
  width: 48px;
  height: 48px;
}

.btn-icon:hover {
  background: var(--color-bg-secondary);
}
```

### Button Group

```html
<div class="btn-group">
  <button class="btn btn-secondary">Edit</button>
  <button class="btn btn-secondary">Delete</button>
  <button class="btn btn-secondary">Archive</button>
</div>
```

```css
.btn-group {
  display: inline-flex;
}

.btn-group .btn {
  border-radius: 0;
  border-right: none;
}

.btn-group .btn:first-child {
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.btn-group .btn:last-child {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  border-right: 1px solid var(--color-border);
}
```

### Loading State

```html
<button class="btn btn-primary" disabled>
  <SpinnerIcon class="animate-spin" />
  Saving...
</button>
```

```css
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## 8. Modals & Drawers

### Modal (Center)

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="btn-icon" aria-label="Close">
        <XIcon />
      </button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

**Specifications:**

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  max-width: 500px; /* sm: 500px, md: 700px, lg: 900px */
  width: 90%;
  background: var(--color-bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-body {
  padding: var(--space-6);
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
}
```

**Animation:**

```css
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal {
  animation: modal-enter var(--duration-base) var(--ease-out);
}
```

**Behavior:**
- Escape key closes
- Click outside closes (optional)
- Focus trap within modal
- Restore focus to trigger element on close
- Disable body scroll when open

### Drawer (Right Slide)

```html
<div class="drawer-overlay">
  <div class="drawer">
    <div class="drawer-header">
      <h2>Drawer Title</h2>
      <button class="btn-icon" aria-label="Close">
        <XIcon />
      </button>
    </div>
    <div class="drawer-body">
      <p>Drawer content</p>
    </div>
    <div class="drawer-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Save</button>
    </div>
  </div>
</div>
```

**Specifications:**

```css
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px; /* sm: 400px, md: 600px, lg: 800px */
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-2xl);
  z-index: 9999;
}

.drawer-header,
.drawer-footer {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.drawer-body {
  padding: var(--space-6);
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.drawer-footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}
```

**Animation:**

```css
@keyframes drawer-enter {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.drawer {
  animation: drawer-enter var(--duration-base) var(--ease-out);
}
```

**Use Cases:**
- Quick view details
- Edit forms
- Filters panel
- Notifications list
- Activity feed

## 9. Notifications & Toasts

### Toast (Top-Right)

```html
<div class="toast toast-success">
  <CheckCircleIcon />
  <div class="toast-content">
    <div class="toast-title">Success</div>
    <div class="toast-message">Ticket created successfully</div>
  </div>
  <button class="toast-close" aria-label="Close">
    <XIcon />
  </button>
</div>
```

**Specifications:**

```css
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  width: 400px;
  padding: var(--space-4);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border-left: 4px solid;
}

.toast-success {
  border-left-color: var(--color-success);
}

.toast-error {
  border-left-color: var(--color-error);
}

.toast-warning {
  border-left-color: var(--color-warning);
}

.toast-info {
  border-left-color: var(--color-info);
}

.toast-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}
```

**Positioning:**

```css
.toast-container {
  position: fixed;
  top: var(--space-8);
  right: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 10000;
}
```

**Auto-dismiss:**
- Success/Info: 5 seconds
- Warning: 7 seconds
- Error: 10 seconds (or manual close only)

**Animation:**

```css
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast {
  animation: toast-enter var(--duration-base) var(--ease-out);
}
```

### Alert Banner (Inline)

```html
<div class="alert alert-info">
  <InfoIcon />
  <div class="alert-content">
    System maintenance scheduled for tonight 10 PM - 2 AM
  </div>
  <button class="btn btn-ghost btn-sm">Dismiss</button>
</div>
```

**Use Cases:**
- System messages
- Feature announcements
- Important notifications
- Persistent warnings

## 10. Command Palette (Cmd+K)

### Design

```html
<div class="command-palette-overlay">
  <div class="command-palette">
    <div class="command-search">
      <SearchIcon />
      <input
        placeholder="Type a command or search..."
        autocomplete="off"
      />
    </div>
    <div class="command-results">
      <div class="command-section">
        <div class="command-section-title">Recent</div>
        <button class="command-item">
          <TicketIcon />
          <span>View Ticket #1234</span>
          <kbd>⌘ 1</kbd>
        </button>
        <button class="command-item">
          <AssetIcon />
          <span>View Asset SERVER-001</span>
          <kbd>⌘ 2</kbd>
        </button>
      </div>
      <div class="command-section">
        <div class="command-section-title">Suggestions</div>
        <button class="command-item">
          <PlusIcon />
          <span>Create new ticket</span>
          <kbd>⌘ N</kbd>
        </button>
        <button class="command-item">
          <HomeIcon />
          <span>Go to Dashboard</span>
          <kbd>⌘ D</kbd>
        </button>
      </div>
    </div>
  </div>
</div>
```

**Specifications:**

```css
.command-palette {
  width: 640px;
  max-height: 500px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.command-search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.command-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--text-base);
  background: transparent;
}

.command-results {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--space-2);
}

.command-section {
  margin-bottom: var(--space-4);
}

.command-section-title {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.command-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.command-item:hover,
.command-item.selected {
  background: var(--color-primary-lightest);
  color: var(--color-primary);
}

.command-item kbd {
  margin-left: auto;
  padding: 2px 6px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-family-mono);
}
```

**Features:**

1. **Fuzzy Search** - Type partial matches across all entities
2. **Keyboard Navigation** - Arrow keys, Enter to select
3. **Recent Items** - Most recently accessed items at top
4. **Categorized Results** - Tickets, Assets, Docs, Commands, Settings
5. **Keyboard Shortcut Hints** - Show shortcuts for quick actions
6. **Action Previews** - Hover to see more details

**Categories:**

1. **Navigation** - Go to pages
2. **Actions** - Create, edit, delete
3. **Search** - Find tickets, assets, users
4. **Settings** - Quick access to preferences
5. **Help** - Documentation, support

**Keyboard Shortcuts:**

- `Cmd/Ctrl + K` - Open/close
- `Arrow Up/Down` - Navigate items
- `Enter` - Select item
- `Esc` - Close
- `Cmd/Ctrl + 1-9` - Jump to recent items

## 11. Empty States

### Friendly Empty State

```html
<div class="empty-state">
  <InboxIcon class="empty-state-icon" />
  <h3 class="empty-state-title">No tickets yet</h3>
  <p class="empty-state-description">
    Create your first ticket to get started
  </p>
  <button class="btn btn-primary">
    <PlusIcon />
    Create Ticket
  </button>
  <a href="/docs" class="empty-state-link">
    Learn how to use tickets
  </a>
</div>
```

**Styling:**

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-6);
}

.empty-state-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  max-width: 400px;
}

.empty-state-link {
  margin-top: var(--space-4);
  color: var(--color-primary);
  font-size: var(--text-sm);
}
```

**Examples:**

- **No tickets**: Inbox icon, "Create your first ticket"
- **No search results**: Magnifying glass, "Try different keywords"
- **No data**: Chart icon, "No data available for this period"
- **Access denied**: Lock icon, "You don't have permission"
- **No notifications**: Bell icon, "You're all caught up!"

## 12. Loading States

### Skeleton Loaders

```html
<div class="skeleton-card">
  <div class="skeleton skeleton-title"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text short"></div>
</div>
```

**Styling:**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: var(--space-4);
}

.skeleton-text {
  height: 16px;
  width: 100%;
  margin-bottom: var(--space-3);
}

.skeleton-text.short {
  width: 70%;
}
```

**Use Cases:**
- Table rows loading
- Card content loading
- Form fields loading
- Dashboard widgets loading

### Spinner

```html
<svg class="spinner" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" stroke-width="3" />
</svg>
```

```css
.spinner {
  animation: spin 1s linear infinite;
}

.spinner circle {
  fill: none;
  stroke: var(--color-primary);
  stroke-dasharray: 50 50;
  stroke-linecap: round;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

**Sizes:**
- sm: 16px
- md: 24px (default)
- lg: 32px
- xl: 48px

**Use Cases:**
- Button loading states
- Page loading
- Section loading
- Inline loading

---

# Page Layouts

## Dashboard

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                    [Refresh]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Stat Card] [Stat Card] [Stat Card] [Stat Card]           │
│   Open: 42    Progress:8   Resolved:156  Avg Time: 4h     │
│                                                             │
│ ┌───────────────────────┐ ┌─────────────────────────────┐ │
│ │                       │ │                             │ │
│ │  My Open Tickets      │ │  Recent Activity            │ │
│ │  (Data Table)         │ │  (Timeline)                 │ │
│ │                       │ │                             │ │
│ └───────────────────────┘ └─────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────┐ ┌─────────────────────────────┐ │
│ │                       │ │                             │ │
│ │  Critical Alerts      │ │  Performance Metrics        │ │
│ │  (List)               │ │  (Chart)                    │ │
│ │                       │ │                             │ │
│ └───────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Features

**Stat Cards (Top Row):**
- 4 cards: Open Tickets, In Progress, Resolved, Average Resolution Time
- Color-coded left borders
- Trend indicators (up/down arrows with %)
- Clickable (filters tickets by status)

**My Open Tickets Widget:**
- Compact table view
- Shows 5 most recent/important tickets
- Quick actions (assign, status change)
- "View All" link

**Recent Activity Widget:**
- Timeline of recent actions
- User avatars
- Timestamps (relative: "2 min ago")
- Activity types: Created, Updated, Resolved, Commented

**Critical Alerts Widget:**
- List of monitoring alerts
- Priority indicators
- One-click "Create Ticket" button
- Acknowledg/Dismiss actions

**Performance Metrics Widget:**
- Line chart showing ticket trends
- Time range selector (7d, 30d, 90d)
- Multiple series (Open, Resolved)
- Interactive tooltips

**Customization:**
- Drag-drop to reorder widgets
- Add/remove widgets
- Resize widgets (half-width, full-width)
- Save layout per user

**Date Range Selector:**
- Top-right corner
- Presets: Today, Week, Month, Quarter, Year, Custom
- Updates all widgets

**Export:**
- Export dashboard as PDF
- Schedule email reports

## Ticket List

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard > Tickets                           [Filter] [+]  │
├─────────────────────────────────────────────────────────────┤
│ [Open 42] [In Progress 8] [Resolved 156] [All]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔍 Search...              [Columns] [Group] [Sort] [↻]     │
│                                                             │
│ [Data Table - Full Width]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Features

**Tabs:**
- Open (default)
- In Progress
- Resolved
- All
- Counts update real-time via WebSocket

**Saved Views:**
- Dropdown: "My Views"
- Predefined: My Tickets, Unassigned, High Priority, This Week
- Custom: Save current filters/sorts as view
- Share views with team

**Filters:**
- Status, Priority, Assignee
- Labels, Projects, Cycles
- Date ranges (Created, Updated, Due)
- Custom fields

**Bulk Actions:**
- Select multiple (checkbox)
- Toolbar appears: Assign, Update Status, Add Labels, Delete
- Confirmation modal for destructive actions

**Export:**
- CSV: All columns, filtered rows
- Excel: Formatted with colors
- PDF: Printable ticket list

**Keyboard Navigation:**
- `/`: Focus search
- `j/k`: Navigate rows
- `x`: Select row
- `a`: Assign to me
- `c`: Create ticket

## Ticket Detail

### Split Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Tickets                                     [⋮]   │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  Ticket #1234            │  Details Panel                   │
│  Login issues for users  │                                  │
│  🔴 High  🟢 Open        │  Status: 🟢 Open                 │
│                          │  Priority: 🔴 High               │
│  Description:            │  Assignee: John Doe              │
│  Users can't log in      │  Created: 2 hours ago            │
│  after the latest...     │  Updated: 5 min ago              │
│                          │  Due: Tomorrow                   │
│  [Formatting toolbar]    │                                  │
│  [Add Comment]           │  🏷️ Labels                       │
│                          │    [Bug] [Login] [Priority]     │
│  💬 Comments (3)         │                                  │
│  ┌────────────────────┐ │  📎 Attachments (2)              │
│  │ Alice Investigating│ │    screenshot.png                │
│  │ 1 hour ago         │ │    error-log.txt                 │
│  └────────────────────┘ │                                  │
│  ┌────────────────────┐ │  🔗 Related                      │
│  │ Bob: Found issue   │ │    Tickets: #1180, #1090         │
│  │ 30 min ago         │ │    Assets: SERVER-001            │
│  └────────────────────┘ │                                  │
│  ┌────────────────────┐ │  📊 Activity                     │
│  │ Alice: Fixed!      │ │    ● Created by Alice            │
│  │ 5 min ago          │ │    ● Assigned to John            │
│  └────────────────────┘ │    ● Priority set to High        │
│                          │    ● Comment added               │
└──────────────────────────┴──────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌─────────────────────────┐
│ ← Ticket #1234          │
├─────────────────────────┤
│                         │
│ Login issues for users  │
│ 🔴 High  🟢 Open        │
│                         │
│ [Details][Activity][Comments]
│                         │
│ Tab content...          │
│                         │
└─────────────────────────┘
```

### Features

**Inline Editing:**
- Click title to edit
- Click status/priority to change (dropdown)
- Click assignee to reassign
- Auto-save with loading indicator

**Comments:**
- Rich text editor
- @mentions (autocomplete)
- File attachments (drag-drop)
- Reactions (emoji)
- Edit/delete own comments
- Threading (replies)

**AI Suggestions:**
- Similar tickets sidebar widget
- Suggested assignee
- Recommended KB articles
- Auto-generated summary

**Time Tracking:**
- Timer widget
- Manual entry
- Time logs list
- Total time spent

**SLA Countdown:**
- Visual indicator if SLA defined
- Color changes as deadline approaches
- Warning when breached

**Related Items:**
- Link to other tickets (blocks, blocked by, relates to)
- Link to assets (affected CIs)
- Link to projects
- Auto-detect relationships (AI)

**Activity Timeline:**
- All changes logged
- User avatars
- Timestamps
- Expandable details

**Actions Menu (⋮):**
- Convert to Project
- Duplicate
- Copy Link
- Export as PDF
- Delete

## Asset Detail (CMDB)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Assets                                            │
├─────────────────────────────────────────────────────────────┤
│  SERVER-PROD-001                              [Edit] [⋮]    │
│  Ubuntu 22.04 • 192.168.1.100 • 🟢 Running                 │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Metrics] [Tickets] [Dependencies] [History]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────┐ ┌────────────────────────────┐   │
│ │                      │ │                            │   │
│ │ Asset Info           │ │ Live Metrics               │   │
│ │ - Type: Server       │ │ CPU: 45% [████▌     ]      │   │
│ │ - Location: DC1      │ │ Memory: 8.2/16 GB          │   │
│ │ - Owner: IT Team     │ │ Disk: 120/500 GB           │   │
│ │ - Status: Running    │ │ Network: 125 Mbps          │   │
│ │ - Purchase: 2023-01  │ │                            │   │
│ │ - Warranty: 3 years  │ │ [View Historical Data]     │   │
│ │                      │ │                            │   │
│ └──────────────────────┘ └────────────────────────────┘   │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │ Dependency Map (Interactive Topology)                 │ │
│ │                                                        │ │
│ │         [Load Balancer]                               │ │
│ │                ↓                                       │ │
│ │         [SERVER-001] ←→ [DATABASE-PROD]              │ │
│ │                ↓                                       │ │
│ │         [Cache Server]                                │ │
│ │                                                        │ │
│ │ Controls: [Zoom In] [Zoom Out] [Reset] [Fullscreen]  │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recent Tickets (3)                                         │
│ - #1234: High CPU usage (Resolved)                         │
│ - #1180: Disk space warning (Open)                         │
│ - #1090: Memory leak detected (In Progress)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Features

**Live Metrics Integration:**
- Real-time data from monitoring system
- Update every 30s (configurable)
- Visual indicators (progress bars, gauges)
- Color-coded thresholds (green/yellow/red)
- Sparklines for trends

**Dependency Map:**
- Interactive graph visualization (React Flow or Cytoscape)
- Zoom, pan, drag nodes
- Click node → Navigate to that asset
- Highlight path on hover
- Filter by relationship type (upstream, downstream, peer)
- Export as image

**Change Impact Analysis:**
- "What breaks if this goes down?" simulation
- Highlight affected assets in red
- List impacted services
- Risk score calculation

**Automatic Relationship Detection:**
- Network traffic analysis
- Application instrumentation
- Cloud API discovery
- Manual linking

**Tabs:**

1. **Overview**: Asset info + live metrics + dependency map
2. **Metrics**: Historical charts, custom time ranges
3. **Tickets**: All tickets related to this asset
4. **Dependencies**: Detailed relationship list (table view)
5. **History**: Change log, who modified when

**Configuration Management:**
- Track configuration changes
- Drift detection
- Compliance checks
- Audit trail

## Monitoring Dashboard

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Monitoring                        [Time: Last 1h ▼] [↻]    │
├─────────────────────────────────────────────────────────────┤
│ [All] [Critical 2] [Warning 5] [OK 124]                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 Active Alerts (2)                                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🔴 SERVER-001 • High CPU usage (95%)                │   │
│ │    Started 15 min ago                                │   │
│ │    Possible cause: Deployment #1234                  │   │
│ │    [View Asset] [Create Ticket] [Acknowledge]       │   │
│ │                                                     │   │
│ │ 🔴 DATABASE-PROD • Disk space low (5% free)        │   │
│ │    Started 2 hours ago                               │   │
│ │    Threshold: < 10% free space                       │   │
│ │    [View Asset] [Create Ticket] [Acknowledge]       │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────────────┐ ┌────────────────────────────┐   │
│ │                      │ │                            │   │
│ │ System Health        │ │ Response Time              │   │
│ │ [Gauge Chart]        │ │ [Line Chart]               │   │
│ │    85%               │ │ 250ms avg                  │   │
│ │    🟡 Acceptable     │ │                            │   │
│ │                      │ │                            │   │
│ └──────────────────────┘ └────────────────────────────┘   │
│                                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ All Metrics (Table)                                    │ │
│ │ Asset       | Metric      | Value | Threshold | Status│ │
│ │ SERVER-001  | CPU         | 95%   | < 80%     | 🔴    │ │
│ │ SERVER-002  | Memory      | 70%   | < 85%     | 🟢    │ │
│ │ DB-PROD     | Disk        | 5%    | > 10%     | 🔴    │ │
│ │ LB-001      | Connections | 1.2k  | < 2k      | 🟢    │ │
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Features

**Active Alerts:**
- Real-time alert list (WebSocket updates)
- AI-detected anomalies highlighted
- Possible causes suggested (deployment correlation, traffic spike, etc.)
- One-click ticket creation (pre-filled with alert details)
- Acknowledge to mute temporarily
- Snooze for X hours

**Alert Correlation:**
- Group related alerts (same root cause)
- Show dependencies ("DB alert → 3 app alerts")
- AI-powered grouping

**Custom Dashboards:**
- Save dashboard configurations
- Share with team
- Templates for common scenarios (web app, database, infrastructure)

**Threshold Configuration:**
- Click metric → Edit threshold
- Visual threshold line on charts
- Multiple thresholds (warning, critical)

**Time Range Selector:**
- Presets: 15m, 1h, 6h, 24h, 7d, 30d, Custom
- Date range picker
- Relative ranges ("Last 2 hours from now")

**Charts:**
- Line charts: Time-series data
- Gauge charts: Current values
- Bar charts: Comparisons
- Heatmaps: Correlation matrices

**Drill-Down:**
- Click alert → Asset detail page
- Click chart → Detailed metrics view
- Click metric → Historical trends

**Export:**
- Export dashboard as PDF
- Download metrics as CSV
- Share snapshot (URL with time range)

---

# Interaction Patterns

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Show keyboard shortcuts help |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `G then D` | Go to Dashboard |
| `G then T` | Go to Tickets |
| `G then A` | Go to Assets |
| `G then M` | Go to Monitoring |
| `G then K` | Go to Knowledge |
| `G then S` | Go to Settings |
| `Cmd/Ctrl + N` | Create new ticket |
| `Cmd/Ctrl + S` | Save current form |
| `Cmd/Ctrl + Enter` | Submit current form |
| `Esc` | Close modal/drawer/command palette |
| `?` | Show help |

### Table Shortcuts

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Navigate rows |
| `Arrow Left/Right` | Navigate columns |
| `Enter` | Open selected row |
| `Space` | Select/deselect row |
| `Shift + Arrow Up/Down` | Select range |
| `Cmd/Ctrl + A` | Select all |
| `Cmd/Ctrl + D` | Deselect all |
| `/` | Focus search input |
| `Cmd/Ctrl + C` | Copy selected rows (CSV) |

### Form Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Next field |
| `Shift + Tab` | Previous field |
| `Cmd/Ctrl + S` | Save form |
| `Cmd/Ctrl + Enter` | Submit form |
| `Esc` | Cancel/reset form |

### Text Editor Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + U` | Underline |
| `Cmd/Ctrl + K` | Insert link |
| `Cmd/Ctrl + Shift + 7` | Ordered list |
| `Cmd/Ctrl + Shift + 8` | Bullet list |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `` Cmd/Ctrl + ` `` | Code block |

### Ticket Detail Shortcuts

| Shortcut | Action |
|----------|--------|
| `E` | Edit ticket |
| `C` | Add comment |
| `A` | Assign to me |
| `S` | Change status |
| `P` | Change priority |
| `L` | Add label |
| `Cmd/Ctrl + Shift + C` | Copy ticket link |

## Shortcuts Help Modal

```html
<div class="shortcuts-modal">
  <h2>Keyboard Shortcuts</h2>
  <div class="shortcuts-grid">
    <div class="shortcuts-section">
      <h3>Navigation</h3>
      <div class="shortcut-item">
        <kbd>G</kbd> <kbd>D</kbd>
        <span>Go to Dashboard</span>
      </div>
      <div class="shortcut-item">
        <kbd>G</kbd> <kbd>T</kbd>
        <span>Go to Tickets</span>
      </div>
    </div>
  </div>
</div>
```

## Drag & Drop

### Supported Interactions

**1. Reorder Table Columns:**
- Drag column header
- Visual indicator (ghost column)
- Drop zone highlights
- Smooth animation on reorder

**2. Reorder Dashboard Widgets:**
- Drag widget handle (⋮⋮)
- Other widgets shift to make space
- Grid snapping
- Save layout

**3. File Upload:**
- Drag files over drop zone
- Drop zone highlights with dashed border
- Shows file count while dragging
- Multiple file support

**4. Kanban Board (if implemented):**
- Drag tickets between status columns
- Update status on drop
- Optimistic UI update
- Undo toast notification

### Visual Feedback

```css
.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.drop-zone {
  border: 2px dashed var(--color-primary);
  background: var(--color-primary-lightest);
}

.drop-zone-active {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}
```

## Hover States

### Consistent Pattern

All interactive elements should have hover states:

```css
.interactive-element {
  transition: all var(--duration-fast) var(--ease-out);
}

.interactive-element:hover {
  /* Elevation: Increase shadow */
  box-shadow: var(--shadow-lg);
  
  /* Lift: Subtle transform */
  transform: translateY(-2px);
  
  /* Color: Lighten/darken */
  background: var(--color-bg-hover);
  
  /* Border: Change color */
  border-color: var(--color-border-hover);
  
  /* Cursor: Indicate interactivity */
  cursor: pointer;
}
```

### Specific Components

**Buttons:**
- Background color change
- Shadow increase
- Slight scale (1.02x)

**Cards:**
- Shadow increase (sm → md or md → lg)
- Lift (translateY(-2px))
- Border color change

**Table Rows:**
- Background color change
- Shadow appear
- Border-left accent color

**Links:**
- Underline appear
- Color change to primary-hover

## Focus States

### Keyboard Focus Indicators

**Never remove focus indicators** - Critical for accessibility

```css
.focusable:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Or ring-based focus */
.focusable:focus {
  outline: none;
  box-shadow: 0 0 0 4px var(--color-primary-lightest);
}
```

### Skip to Main Content

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

## Loading States

### Progressive Enhancement

1. **Instant Feedback** - Optimistic UI update
2. **Skeleton Loader** - Show structure (0-500ms)
3. **Spinner** - Show progress (500ms+)
4. **Error State** - If failed, with retry button

### Loading Indicators

**Inline (Button):**
```html
<button class="btn btn-primary" disabled>
  <Spinner size="sm" />
  Saving...
</button>
```

**Overlay (Full Page):**
```html
<div class="loading-overlay">
  <Spinner size="lg" />
  <p>Loading tickets...</p>
</div>
```

**Skeleton (Content):**
```html
<div class="skeleton-list">
  <div class="skeleton-item"></div>
  <div class="skeleton-item"></div>
  <div class="skeleton-item"></div>
</div>
```

---

# AI-Integrated UX

## Design Principles for AI Features

1. **Transparency** - Always explain why AI made a suggestion
2. **Controllability** - Easy to accept, reject, or modify AI suggestions
3. **Confidence Levels** - Show AI confidence (High: 95%, Medium: 70%, Low: 50%)
4. **Graceful Degradation** - System works without AI
5. **Privacy** - Clear about what data AI uses

## 1. Auto-Classification (Ticket Creation)

### UI Pattern

```
┌─────────────────────────────────────┐
│ Title: Can't log in to dashboard   │
│                                     │
│ 🤖 AI Suggestion (95% confident):  │
│                                     │
│    Category: Login Issue            │
│    Priority: High                   │
│    Assignee: John Doe (Login expert)│
│                                     │
│    Why? Based on keywords: "log in",│
│    "dashboard" + similar ticket     │
│    history (#1234, #1090)           │
│                                     │
│    [Accept All] [Customize] [Reject]│
└─────────────────────────────────────┘
```

### Features

**Show Confidence:**
- High (>90%): Green indicator, "Confident"
- Medium (70-89%): Yellow, "Somewhat confident"
- Low (<70%): Gray, "Low confidence" (don't auto-apply)

**Explain Reasoning:**
- Keywords detected
- Similar tickets found
- Historical patterns
- Team assignment rules

**Easy Override:**
- Click suggestion to edit inline
- Dropdown to choose different value
- Reject removes suggestion
- Feedback improves AI ("This was incorrect")

**Learning from Feedback:**
- Track accept/reject rates
- Retrain model weekly
- Show improvement over time ("AI accuracy: 92% → 95%")

## 2. Similar Ticket Detection

### UI Pattern

```
┌─────────────────────────────────────┐
│ 💡 Similar tickets found:           │
│                                     │
│ #1180: Login timeout issues (95%)  │
│ ┌───────────────────────────────┐  │
│ │ Status: Resolved              │  │
│ │ Resolution: Increased session │  │
│ │             timeout to 30min  │  │
│ │ [View Ticket]                 │  │
│ └───────────────────────────────┘  │
│                                     │
│ #1090: Can't access after update   │
│        (87%)                        │
│ ┌───────────────────────────────┐  │
│ │ Status: Resolved              │  │
│ │ Resolution: Clear browser     │  │
│ │             cache             │  │
│ │ [View Ticket]                 │  │
│ └───────────────────────────────┘  │
│                                     │
│ [View All 5 Similar] [Not Similar] │
└─────────────────────────────────────┘
```

### Features

**Similarity Score:**
- Percentage (0-100%)
- Based on: Title, description, labels, affected assets
- NLP: Semantic similarity, not just keyword matching

**Display:**
- Inline during ticket creation (proactive)
- Sidebar widget in ticket detail (reference)
- Max 3 shown by default, "View All" for more

**Quick Actions:**
- View original ticket
- Copy resolution steps
- Link as "Related to"
- Mark as duplicate

**Feedback:**
- "This was helpful" ✓
- "Not similar" ✗
- Improves future suggestions

## 3. Anomaly Alerts (Monitoring → ITSM)

### UI Pattern

```
┌─────────────────────────────────────┐
│ 🔴 Anomaly Detected                │
│                                     │
│ SERVER-001 CPU usage is 3x higher  │
│ than usual (95% vs avg 30%)        │
│                                     │
│ 📊 Analysis:                       │
│ • Detected at: 2:15 PM             │
│ • Duration: 15 minutes             │
│ • Severity: High                   │
│                                     │
│ 🔍 Possible causes:                │
│ 1. Recent deployment (#1234)       │
│    - Deployed 20 min ago           │
│    - Correlation: 85%              │
│                                     │
│ 2. Traffic spike (2x normal)       │
│    - Started 2:10 PM               │
│    - Source: Marketing campaign    │
│                                     │
│ 3. Background job running          │
│    - Cron: Daily backup            │
│    - Usually runs at 2:00 PM       │
│                                     │
│ 💡 Recommended actions:            │
│ • Rollback deployment #1234        │
│ • Scale up server capacity         │
│ • Investigate background jobs      │
│                                     │
│ [Create Ticket] [Investigate]      │
│ [Acknowledge] [Dismiss]            │
└─────────────────────────────────────┘
```

### Features

**Context-Aware Explanations:**
- Historical baseline (normal vs current)
- Time correlation (what else changed?)
- Dependency analysis (upstream/downstream impacts)

**Root Cause Suggestions:**
- Recent deployments
- Traffic patterns
- Scheduled jobs
- Similar past incidents
- Ranked by likelihood

**One-Click Actions:**
- Create ticket: Pre-filled with all context
- Investigate: Open metrics dashboard
- Acknowledge: Mute for 1 hour
- Dismiss: Mark as false positive (improves AI)

**Auto-Create Tickets:**
- Option: Auto-create for critical anomalies
- Requires: Confidence threshold (>90%)
- Notification: Notify assignee
- Review: Weekly review of auto-created tickets

## 4. Conversational Search (Natural Language)

### UI Pattern

```
┌─────────────────────────────────────┐
│ 🔍 Ask a question...                │
│                                     │
│ You: Show me high priority tickets │
│      opened this week               │
│                                     │
│ 🤖 Archer: Found 12 high priority  │
│            tickets created between  │
│            Dec 1-7, 2025            │
│                                     │
│    Filters applied:                 │
│    • Priority: High                 │
│    • Created: Dec 1-7, 2025         │
│                                     │
│    [View Results] [Refine Search]   │
│                                     │
│ You: Who is assigned to them?      │
│                                     │
│ 🤖 Archer: Breakdown by assignee:  │
│    • John Doe: 5 tickets            │
│    • Alice Smith: 4 tickets         │
│    • Unassigned: 3 tickets          │
│                                     │
│    [Show Details] [Export]          │
└─────────────────────────────────────┘
```

### Features

**Natural Language Understanding:**
- Date parsing: "last week", "yesterday", "Q4 2025"
- User references: "my tickets", "Alice's tickets"
- Complex queries: "high priority unassigned tickets created this month"

**Context Preservation:**
- Follow-up questions reference previous query
- "Refine search" modifies current filters
- Conversation history (scrollable)

**Suggested Queries:**
- Empty state: Show common queries
- Based on role: Different suggestions for agent vs manager
- Recent: "You recently searched for..."

**Export Results:**
- CSV, Excel, PDF
- Include query in export filename
- "high-priority-tickets-dec-2025.csv"

## AI Trust Building

### Gradual Rollout

**Phase 1: Suggestions Only**
- Show AI suggestions
- User must explicitly accept
- Track accept rate

**Phase 2: Auto-Apply (with Undo)**
- Auto-apply high-confidence suggestions
- Prominent undo button (toast)
- User can disable auto-apply

**Phase 3: Autonomous (with Oversight)**
- Auto-create tickets for critical alerts
- Weekly review dashboard
- Disable if accuracy drops

### Transparency Dashboard

```
┌─────────────────────────────────────┐
│ AI Performance                      │
│                                     │
│ Auto-Classification:                │
│ • Accuracy: 95% (↑ 3% this month)  │
│ • Accepted: 234 / 246 suggestions  │
│ • Rejected: 12 (reviewed weekly)   │
│                                     │
│ Similar Ticket Detection:           │
│ • Helpful: 89% (user feedback)     │
│ • Tickets deflected: 45 this week  │
│                                     │
│ Anomaly Detection:                  │
│ • True positives: 92%               │
│ • False positives: 8%               │
│ • Issues prevented: 15 this month  │
│                                     │
│ [View Details] [Disable AI]         │
└─────────────────────────────────────┘
```

**Shows:**
- Accuracy metrics
- User feedback stats
- Business impact (time saved, issues prevented)
- Option to disable AI features

---

# Performance Guidelines

## Target Metrics

### Core Web Vitals

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **First Contentful Paint (FCP)** | < 1.5s | < 1.8s | 1.8s - 3s | > 3s |
| **Largest Contentful Paint (LCP)** | < 2.5s | < 2.5s | 2.5s - 4s | > 4s |
| **First Input Delay (FID)** | < 100ms | < 100ms | 100ms - 300ms | > 300ms |
| **Cumulative Layout Shift (CLS)** | < 0.1 | < 0.1 | 0.1 - 0.25 | > 0.25 |
| **Time to Interactive (TTI)** | < 3.5s | < 3.8s | 3.8s - 7.3s | > 7.3s |

### Custom Metrics

| Metric | Target |
|--------|--------|
| Initial JS Bundle Size | < 200KB (gzipped) |
| API Response Time (p95) | < 500ms |
| Table Render Time (100 rows) | < 100ms |
| Search Debounce | 300ms |
| Animation Duration (default) | 250ms |

## Optimization Strategies

### 1. Code Splitting

**Route-Based:**
```javascript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Assets = lazy(() => import('./pages/Assets'));
```

**Component-Based:**
```javascript
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));
const DataVisualization = lazy(() => import('./components/Charts'));
```

**Benefits:**
- Smaller initial bundle
- Faster page loads
- Load on demand

### 2. Image Optimization

**Format:**
- Use WebP with JPEG/PNG fallback
- SVG for icons and illustrations
- Compress images (TinyPNG, ImageOptim)

**Responsive Images:**
```html
<img
  src="small.webp"
  srcset="small.webp 480w, medium.webp 768w, large.webp 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Description"
  loading="lazy"
/>
```

**Lazy Loading:**
- Native: `loading="lazy"`
- Library: react-lazy-load-image-component
- Below-the-fold images only

**Placeholder:**
- LQIP (Low Quality Image Placeholder)
- Blur effect while loading
- Skeleton loader

### 3. Data Fetching

**React Query (TanStack Query):**
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['tickets', filters],
  queryFn: () => fetchTickets(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Deduplication

**Pagination:**
- Cursor-based (not offset)
- Virtual scrolling for large lists
- Infinite scroll for feeds

**Debounce Search:**
```javascript
const debouncedSearch = useMemo(
  () => debounce((query) => setSearchQuery(query), 300),
  []
);
```

### 4. Bundle Size Optimization

**Tree Shaking:**
- Use ES modules
- Import only what's needed
```javascript
// ❌ Bad
import _ from 'lodash';

// ✅ Good
import debounce from 'lodash/debounce';
```

**Analyze Bundle:**
```bash
npm run build -- --analyze
```

Use webpack-bundle-analyzer to identify:
- Large dependencies
- Duplicate code
- Unused code

**Remove Unused Dependencies:**
```bash
npx depcheck
```

**Target:**
- Initial bundle: < 200KB (gzipped)
- Route chunks: < 50KB each
- Total: < 500KB (gzipped)

### 5. Rendering Performance

**Virtualization (Long Lists):**
```javascript
import { VirtualList } from '@tanstack/react-virtual';

<VirtualList
  count={1000}
  estimateSize={() => 50}
  renderItem={(index) => <TableRow data={data[index]} />}
/>
```

**Memoization:**
```javascript
const MemoizedComponent = memo(Component, (prev, next) => {
  return prev.id === next.id && prev.status === next.status;
});
```

**Avoid Unnecessary Re-renders:**
- Use `React.memo` for expensive components
- `useMemo` for expensive calculations
- `useCallback` for stable function references

**CSS Transforms (GPU Acceleration):**
```css
/* ❌ Bad - triggers layout */
.card:hover {
  top: -2px;
}

/* ✅ Good - GPU accelerated */
.card:hover {
  transform: translateY(-2px);
}
```

### 6. Network Optimization

**HTTP/2:**
- Multiplexing
- Server push
- Header compression

**Compression:**
- Gzip for text assets
- Brotli for better compression

**CDN:**
- Serve static assets from CDN
- Reduce latency
- Global distribution

**Prefetch/Preload:**
```html
<!-- Preload critical resources -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- Prefetch next page -->
<link rel="prefetch" href="/tickets">
```

**Service Worker:**
- Cache static assets
- Offline support
- Background sync

### 7. Monitoring

**Real User Monitoring (RUM):**
- Track actual user experiences
- Geographic distribution
- Device/browser breakdown

**Synthetic Monitoring:**
- Automated tests from multiple locations
- Performance budgets
- Regression detection

**Tools:**
- Lighthouse CI
- WebPageTest
- Chrome User Experience Report

**Performance Budget:**
```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 200 },
        { "resourceType": "total", "budget": 500 }
      ]
    }
  ]
}
```

---

# Accessibility (WCAG 2.1 Level AA)

## Color Contrast

### Requirements

- **Normal text**: 4.5:1 minimum
- **Large text** (18px+ or 14px+ bold): 3:1 minimum
- **UI components**: 3:1 minimum
- **Focus indicators**: 3:1 minimum

### Testing

Use tools:
- Chrome DevTools Accessibility Panel
- WAVE Browser Extension
- Colour Contrast Analyser
- WebAIM Contrast Checker

### Implementation

```css
/* ✅ Good - 7:1 ratio */
.text-primary {
  color: #111827; /* Dark gray */
  background: #FFFFFF; /* White */
}

/* ❌ Bad - 2.5:1 ratio */
.text-light {
  color: #D1D5DB; /* Light gray */
  background: #FFFFFF; /* White */
}
```

## Keyboard Navigation

### Requirements

- All interactive elements keyboard accessible
- Logical tab order
- Visible focus indicators
- Skip links for main content

### Tab Order

```html
<!-- Proper tab order -->
<form>
  <input tabindex="1" />
  <input tabindex="2" />
  <button tabindex="3">Submit</button>
</form>

<!-- Or rely on natural DOM order (preferred) -->
<form>
  <input /> <!-- Auto tabindex=0 -->
  <input />
  <button>Submit</button>
</form>
```

### Focus Management

**Modal Opens:**
```javascript
const modalRef = useRef();

useEffect(() => {
  if (isOpen) {
    // Save previous focus
    const previousFocus = document.activeElement;
    
    // Focus modal
    modalRef.current?.focus();
    
    // Restore on close
    return () => previousFocus?.focus();
  }
}, [isOpen]);
```

**Focus Trap:**
```javascript
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <Modal>
    {/* Focus stays within modal */}
  </Modal>
</FocusTrap>
```

### Skip Links

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<main id="main-content">
  <!-- Page content -->
</main>
```

```css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

## Screen Readers

### Semantic HTML

```html
<!-- ✅ Good -->
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <p>Content</p>
  </article>
</main>

<aside aria-label="Related information">
  <!-- Sidebar -->
</aside>

<!-- ❌ Bad -->
<div class="header">
  <div class="nav">
    <div class="link">Home</div>
  </div>
</div>
```

### ARIA Labels

**Form Labels:**
```html
<!-- Explicit label -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Aria-label for icon buttons -->
<button aria-label="Close modal">
  <XIcon />
</button>

<!-- Aria-labelledby -->
<div id="modal-title">Delete Ticket</div>
<div aria-labelledby="modal-title">
  Are you sure?
</div>
```

**Live Regions:**
```html
<!-- Announce updates -->
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

<!-- For urgent messages -->
<div aria-live="assertive">
  {errorMessage}
</div>
```

**Hidden Content:**
```html
<!-- Visually hidden, but read by screen readers -->
<span class="sr-only">
  Sort by name, ascending
</span>

<!-- Hidden from everyone -->
<div aria-hidden="true">
  Decorative content
</div>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Alt Text

```html
<!-- Informative image -->
<img src="chart.png" alt="Bar chart showing ticket trends, 42 open, 8 in progress, 156 resolved" />

<!-- Decorative image -->
<img src="decoration.png" alt="" />

<!-- Icon with text -->
<button>
  <img src="save.svg" alt="" /> <!-- Empty alt, text provides context -->
  Save
</button>
```

## Motion & Animation

### Respect User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animationDuration = prefersReducedMotion ? 0 : 250;
```

### No Auto-Play

- No auto-playing videos
- No auto-advancing carousels
- Provide pause/stop controls

## Forms

### Clear Labels

```html
<div class="form-field">
  <label for="priority">
    Priority
    <span class="required" aria-label="required">*</span>
  </label>
  <select id="priority" required>
    <option value="">Select priority</option>
    <option value="high">High</option>
  </select>
</div>
```

### Error Messages

```html
<div class="form-field">
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid="true"
  />
  <span id="email-error" class="error" role="alert">
    Please enter a valid email address
  </span>
</div>
```

### Required Fields

```html
<!-- Visual and screen reader indicators -->
<label for="title">
  Title
  <span class="required" aria-label="required">*</span>
</label>
<input id="title" required aria-required="true" />
```

### Helpful Placeholders

```html
<!-- ❌ Bad - placeholder as label -->
<input placeholder="Email" />

<!-- ✅ Good - placeholder as hint -->
<label for="email">Email</label>
<input id="email" placeholder="you@example.com" />
```

## Testing

### Tools

1. **Automated:**
   - axe DevTools
   - Lighthouse
   - WAVE
   - Pa11y

2. **Manual:**
   - Keyboard navigation
   - Screen reader (NVDA, JAWS, VoiceOver)
   - Browser zoom (200%, 400%)
   - Color blindness simulators

3. **User Testing:**
   - Real users with disabilities
   - Assistive technology users
   - Feedback incorporation

### Checklist

- [ ] All images have alt text
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators
- [ ] Sufficient color contrast
- [ ] Semantic HTML structure
- [ ] ARIA labels where needed
- [ ] Form labels properly associated
- [ ] Error messages descriptive
- [ ] No keyboard traps
- [ ] Skip links present
- [ ] Respects prefers-reduced-motion
- [ ] Screen reader tested
- [ ] Zoom tested (up to 400%)

---

# Dark Mode

## Implementation Strategy

### CSS Custom Properties

Define colors as CSS variables:

```css
:root {
  --color-bg-primary: #FFFFFF;
  --color-text-primary: #111827;
  /* ... all colors */
}

[data-theme="dark"] {
  --color-bg-primary: #0F172A;
  --color-text-primary: #F1F5F9;
  /* ... all colors */
}
```

### Auto-Detection

```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Set initial theme
const theme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', theme);

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
```

### Manual Toggle

```javascript
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
```

### Component

```jsx
function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };
  
  return (
    <button onClick={toggle} aria-label="Toggle dark mode">
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

## Color Adjustments

### Not Just Inversion

Don't simply invert colors. Instead:

**Light Mode:**
- Background: Pure white (#FFFFFF)
- Text: Near black (#111827)
- Shadows: Visible, medium opacity

**Dark Mode:**
- Background: Dark blue-gray (#0F172A) - Not pure black
- Text: Near white (#F1F5F9) - Not pure white
- Shadows: Lighter, lower opacity
- Adjust shadow colors (not just opacity)

### Shadow Adjustments

```css
:root {
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.5);
}
```

### Border Adjustments

```css
:root {
  --color-border: #E5E7EB;
}

[data-theme="dark"] {
  --color-border: #334155;
}
```

## Component-Specific Adjustments

### Images

**Logos:**
- Provide dark mode variant
- Use CSS filter as fallback

```html
<img src="logo-light.svg" class="logo-light" alt="Archer ITSM" />
<img src="logo-dark.svg" class="logo-dark" alt="Archer ITSM" />
```

```css
.logo-dark {
  display: none;
}

[data-theme="dark"] .logo-light {
  display: none;
}

[data-theme="dark"] .logo-dark {
  display: block;
}
```

**Photos:**
```css
[data-theme="dark"] img {
  filter: brightness(0.9);
}
```

### Charts

Adjust chart colors for dark mode:
```javascript
const chartColors = theme === 'dark'
  ? { background: '#1E293B', text: '#F1F5F9' }
  : { background: '#FFFFFF', text: '#111827' };
```

### Code Blocks

Use syntax highlighting theme that works in both modes:
- Light: GitHub Light
- Dark: GitHub Dark or Dracula

## Transition

Smooth transition between themes:

```css
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

**Note:** Disable during page load to avoid flash:

```javascript
// Disable transitions on load
document.documentElement.classList.add('no-transition');
setTimeout(() => {
  document.documentElement.classList.remove('no-transition');
}, 100);
```

```css
.no-transition * {
  transition: none !important;
}
```

---

# Animation Guidelines

## Principles

1. **Purposeful** - Animations should guide attention, provide feedback, or show relationships
2. **Fast** - 150-350ms for most animations
3. **Natural** - Ease-out for entrances, ease-in for exits
4. **Subtle** - Don't distract from content
5. **Optional** - Respect `prefers-reduced-motion`

## Common Animations

### Page Transitions

```css
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 350ms ease-out, transform 350ms ease-out;
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity 250ms ease-in;
}
```

### Button Hover/Press

```css
.btn {
  transition: all 150ms ease-out;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn:active {
  transform: translateY(0);
  transition-duration: 50ms;
}
```

### Card Hover

```css
.card {
  transition: all 250ms ease-out;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### Modal Open/Close

```css
@keyframes modal-overlay-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-content-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-overlay {
  animation: modal-overlay-enter 250ms ease-out;
}

.modal-content {
  animation: modal-content-enter 250ms ease-out;
}
```

### Drawer Slide

```css
@keyframes drawer-enter {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer {
  animation: drawer-enter 250ms ease-out;
}
```

### Toast Notification

```css
@keyframes toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

.toast {
  animation: toast-enter 250ms ease-out;
}

.toast-exiting {
  animation: toast-exit 200ms ease-in;
}
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  animation: shimmer 1.5s infinite linear;
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 1000px 100%;
}
```

### Spinner

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Pulse (Alert Indicator)

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.alert-dot {
  animation: pulse 2s infinite;
}
```

### Fade In/Out

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.fade-in {
  animation: fadeIn 250ms ease-out;
}

.fade-out {
  animation: fadeOut 200ms ease-in;
}
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

# Implementation Checklist

## Phase 1: Foundation (Week 1-2)

### Design System
- [ ] CSS variables setup (colors, spacing, typography)
- [ ] Light/dark mode system
- [ ] Base typography styles
- [ ] Utility classes (Tailwind or custom)

### Base Components
- [ ] Button (all variants)
- [ ] Input (text, select, textarea, checkbox, radio, switch)
- [ ] Card (standard, stat, interactive)
- [ ] Badge/Pill
- [ ] Icon system (SVG sprites or icon library)

### Layout
- [ ] Top navigation bar
- [ ] Sidebar navigation
- [ ] Main content area
- [ ] Responsive grid system
- [ ] Breakpoint utilities

### Routing & State
- [ ] React Router setup
- [ ] TanStack Query setup
- [ ] Global state (Zustand or Context)
- [ ] Auth state management

## Phase 2: Core Pages (Week 3-4)

### Dashboard
- [ ] Page layout
- [ ] Stat cards (4 widgets)
- [ ] My Tickets widget
- [ ] Recent Activity widget
- [ ] Critical Alerts widget
- [ ] Performance Metrics chart
- [ ] Date range selector
- [ ] Refresh functionality

### Ticket List
- [ ] Page layout
- [ ] Tab navigation with counts
- [ ] Data table component
- [ ] Column management (show/hide, reorder, resize)
- [ ] Sorting (single/multi-column)
- [ ] Filters (status, priority, assignee, labels, dates)
- [ ] Search (debounced)
- [ ] Bulk selection
- [ ] Bulk actions toolbar
- [ ] Pagination
- [ ] Saved views

### Ticket Detail
- [ ] Split layout (desktop)
- [ ] Tabbed layout (mobile)
- [ ] Inline editing
- [ ] Comments section
- [ ] Rich text editor
- [ ] File attachments
- [ ] Labels management
- [ ] Related items
- [ ] Activity timeline
- [ ] SLA indicator

### Asset List
- [ ] Page layout
- [ ] Data table
- [ ] Filters
- [ ] Search

### Asset Detail
- [ ] Overview tab
- [ ] Live metrics widget
- [ ] Dependency map (React Flow or Cytoscape)
- [ ] Related tickets
- [ ] History tab

## Phase 3: Advanced Features (Week 5-6)

### Command Palette
- [ ] Cmd+K trigger
- [ ] Search input
- [ ] Fuzzy search implementation
- [ ] Categorized results
- [ ] Recent items
- [ ] Keyboard navigation
- [ ] Action execution

### Advanced Filtering
- [ ] Filter builder UI
- [ ] Multiple filter conditions
- [ ] Date range picker
- [ ] Custom field filters
- [ ] Save filter sets

### Bulk Actions
- [ ] Selection UI
- [ ] Action toolbar
- [ ] Bulk assign
- [ ] Bulk status update
- [ ] Bulk delete (with confirmation)
- [ ] Progress indicator

### Form Validation
- [ ] Zod schema setup
- [ ] React Hook Form integration
- [ ] Inline validation
- [ ] Error messages
- [ ] Success states

### File Uploads
- [ ] Drag-drop zone
- [ ] File preview
- [ ] Upload progress
- [ ] Multiple file support
- [ ] File type validation
- [ ] Size validation

### Monitoring Dashboard
- [ ] Page layout
- [ ] Active alerts list
- [ ] Metrics charts
- [ ] Time range selector
- [ ] Alert acknowledge/dismiss
- [ ] One-click ticket creation

## Phase 4: Polish (Week 7-8)

### Animations
- [ ] Page transitions
- [ ] Modal/drawer animations
- [ ] Hover effects
- [ ] Loading animations
- [ ] Skeleton loaders
- [ ] Toast notifications
- [ ] Respect prefers-reduced-motion

### Loading States
- [ ] Skeleton loaders for all pages
- [ ] Spinner components
- [ ] Button loading states
- [ ] Progress indicators
- [ ] Optimistic UI updates

### Empty States
- [ ] Design empty state components
- [ ] Friendly messaging
- [ ] Call-to-action buttons
- [ ] Helper links

### Error Handling
- [ ] Error boundaries
- [ ] Error pages (404, 500)
- [ ] Toast error messages
- [ ] Retry mechanisms
- [ ] Offline detection

### Accessibility
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Focus management
- [ ] ARIA labels
- [ ] Color contrast check
- [ ] Alt text for images
- [ ] Skip links

### Performance
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Lighthouse audit
- [ ] React DevTools Profiler
- [ ] Fix any performance issues

### Mobile Responsive
- [ ] Test all pages on mobile
- [ ] Touch-friendly targets (44px minimum)
- [ ] Collapsible sidebar
- [ ] Mobile-optimized tables
- [ ] Mobile navigation
- [ ] Test on real devices

### Testing
- [ ] Unit tests for components
- [ ] Integration tests for pages
- [ ] E2E tests for critical flows
- [ ] Accessibility tests (axe)
- [ ] Cross-browser testing

### Documentation
- [ ] Component library (Storybook)
- [ ] Developer documentation
- [ ] Design system documentation
- [ ] Keyboard shortcuts guide

---

# Development Stack

## Recommended Technologies

### Frontend Framework
- **React 18+** with TypeScript
- Vite for build tooling (fast HMR, optimized builds)
- React Router v6 for routing

**Why React?**
- Industry standard
- Large ecosystem
- Excellent TypeScript support
- Great developer experience
- Easy to find talent

### State Management

**Server State:**
- **TanStack Query (React Query)** - Caching, synchronization, background updates

**Client State:**
- Zustand - Simple, performant, minimal boilerplate
- Or React Context API for simple cases

**URL State:**
- React Router search params for filters, pagination

### UI Component Libraries

**Base Components:**
- **Fluent UI 2 (React)** - Microsoft's design system
  - Modern components
  - Accessibility built-in
  - Good documentation
  - Customizable

**Headless Primitives:**
- **Radix UI** - Unstyled, accessible components
  - Dropdown, Dialog, Popover, Tooltip, etc.
  - Full keyboard navigation
  - ARIA compliant

**Utilities:**
- **Tailwind CSS** - Utility-first CSS framework
  - Rapid development
  - Consistent design
  - Purges unused CSS
  - Dark mode support

### Forms
- **React Hook Form** - Form state management
  - Minimal re-renders
  - Easy validation
  - TypeScript support

- **Zod** - Schema validation
  - TypeScript-first
  - Type inference
  - Composable schemas

### Data Visualization
- **Recharts** - React chart library
  - Simple API
  - Responsive
  - Customizable
  - SVG-based

- **Victory** - Alternative chart library
  - More flexibility
  - Animation support

- **React Flow** - Node-based diagrams
  - For dependency maps
  - Interactive graphs
  - Customizable nodes/edges

### Animation
- **Framer Motion** - Production-ready animation library
  - Declarative animations
  - Layout animations
  - Gestures
  - SVG support

### Icons
- **Lucide React** - Clean, consistent icons
  - 1000+ icons
  - Tree-shakeable
  - Customizable

### Date/Time
- **date-fns** - Modern date utility library
  - Lightweight
  - Modular
  - TypeScript support

### Testing

**Unit/Integration:**
- **Vitest** - Fast test runner (Vite-based)
- **React Testing Library** - Component testing
- **MSW (Mock Service Worker)** - API mocking

**E2E:**
- **Playwright** - Cross-browser testing
  - Fast, reliable
  - Great developer experience
  - Built-in test generator

### Code Quality

**Linting:**
- ESLint with TypeScript plugin
- Prettier for code formatting

**Pre-commit:**
- Husky - Git hooks
- lint-staged - Run linters on staged files

**Type Checking:**
- TypeScript strict mode
- tsc --noEmit for CI

### Build & Deployment

**Build:**
- Vite (dev server + production builds)
- vite-plugin-pwa for PWA support

**Deployment:**
- Vercel / Netlify (frontend)
- Docker containers (full-stack)

### Development Tools

**Package Manager:**
- pnpm (faster, more efficient than npm/yarn)

**Dev Tools:**
- React DevTools
- TanStack Query DevTools
- Vite Plugin Inspect

**Performance:**
- Lighthouse
- webpack-bundle-analyzer (or Vite equivalent)
- React DevTools Profiler

---

# Success Metrics

## User Experience Metrics

### Task Completion
- **Target**: > 95% task completion rate
- **Measure**: User able to complete primary tasks without errors
- **Examples**: Create ticket, search asset, update status

### Time on Task
- **Target**: 50% faster than ServiceNow
- **Measure**: Time to complete common tasks
- **Tasks**: 
  - Create ticket: < 30 seconds
  - Find ticket: < 10 seconds
  - Update status: < 5 seconds

### Error Rate
- **Target**: < 5% user errors
- **Measure**: Incorrect actions, form validation errors
- **Examples**: Wrong field clicked, form submission errors

### User Satisfaction
- **Target**: > 4.5/5 average rating
- **Measure**: Post-task surveys, NPS
- **Frequency**: Weekly surveys

## Performance Metrics

### Lighthouse Score
- **Target**: > 90 for all categories
- **Categories**: Performance, Accessibility, Best Practices, SEO
- **Frequency**: Every build

### Page Load Time
- **Target**: < 2s for LCP
- **Measure**: Real user monitoring (RUM)
- **Pages**: Dashboard, Ticket List, Ticket Detail

### API Response Time
- **Target**: < 500ms for p95
- **Measure**: Backend monitoring
- **Endpoints**: List tickets, Get ticket, Update ticket

### Bundle Size
- **Target**: < 200KB initial (gzipped)
- **Measure**: Webpack bundle analyzer
- **Frequency**: Every build

## Adoption Metrics

### Daily Active Users (DAU)
- **Target**: 80% of total users
- **Measure**: Unique users per day
- **Growth**: Track weekly/monthly

### Feature Usage
- **Command Palette**: > 50% of users per week
- **Bulk Actions**: > 30% of users per week
- **AI Suggestions**: > 70% accept rate
- **Keyboard Shortcuts**: > 40% of power users

### Mobile Usage
- **Target**: > 20% of sessions on mobile
- **Measure**: Device type tracking
- **Goal**: Ensure mobile experience is seamless

### Retention
- **Target**: > 95% weekly retention
- **Measure**: Users returning week-over-week
- **Cohorts**: Track by signup date

## Business Metrics

### Time Saved
- **Target**: 4 hours per user per week (vs ServiceNow)
- **Measure**: Task time comparisons
- **Value**: Calculate $ saved (hourly rate × hours)

### Ticket Resolution Time
- **Target**: 20% reduction in avg resolution time
- **Measure**: From creation to resolution
- **AI Impact**: Track AI-assisted vs manual

### Support Tickets Deflected
- **Target**: 30% reduction in support tickets
- **Measure**: Similar ticket detection, KB suggestions
- **AI Impact**: Track deflection rate

### Customer Satisfaction
- **Target**: > 90% satisfied customers
- **Measure**: CSAT surveys after ticket resolution
- **Frequency**: Post-resolution (optional)

---

# References

## Design Inspiration

### Linear
- **URL**: https://linear.app
- **Learn From**: Speed, keyboard-first navigation, clean UI, command palette
- **Key Features**: Cmd+K, instant search, keyboard shortcuts, minimalist design

### Notion
- **URL**: https://notion.so
- **Learn From**: Clean UI, flexibility, content hierarchy, drag-drop
- **Key Features**: Slash commands, database views, clean typography

### Vercel Dashboard
- **URL**: https://vercel.com
- **Learn From**: Modern aesthetic, glass effect, dark mode, performance
- **Key Features**: Animations, deployment previews, metrics

### GitHub
- **URL**: https://github.com
- **Learn From**: Consistency, clarity, information density, keyboard navigation
- **Key Features**: Issue tracking, PR reviews, code review UI

### Stripe Dashboard
- **URL**: https://stripe.com
- **Learn From**: Polish, attention to detail, data visualization, onboarding
- **Key Features**: Charts, empty states, progressive disclosure

## Component Libraries

### Fluent UI 2
- **URL**: https://react.fluentui.dev
- **Documentation**: Excellent
- **Components**: 50+ components
- **Accessibility**: Built-in
- **Customization**: Theming, styling

### Radix UI
- **URL**: https://www.radix-ui.com
- **Type**: Headless (unstyled)
- **Components**: Primitives for complex components
- **Focus**: Accessibility, keyboard navigation
- **Use**: When you need full styling control

### Tailwind CSS
- **URL**: https://tailwindcss.com
- **Type**: Utility-first CSS framework
- **Benefits**: Rapid development, consistent design, small bundle
- **Plugins**: Forms, Typography, Aspect Ratio

## Accessibility Resources

### WCAG Guidelines
- **URL**: https://www.w3.org/WAI/WCAG21/quickref/
- **Level**: Target AA compliance
- **Reference**: Use for all accessibility decisions

### React Aria
- **URL**: https://react-spectrum.adobe.com/react-aria/
- **Type**: Hooks for accessible components
- **Use**: When building custom components

### axe DevTools
- **URL**: https://www.deque.com/axe/devtools/
- **Type**: Browser extension
- **Use**: Automated accessibility testing

## Technical Documentation

### React
- **URL**: https://react.dev
- **Version**: Use React 18+
- **Features**: Concurrent rendering, Suspense, Server Components

### TypeScript
- **URL**: https://www.typescriptlang.org
- **Version**: Latest stable
- **Config**: Strict mode enabled

### Vite
- **URL**: https://vitejs.dev
- **Benefits**: Fast HMR, optimized builds, plugin ecosystem
- **Use**: Development server and production builds

### TanStack Query
- **URL**: https://tanstack.com/query
- **Benefits**: Caching, background refetch, optimistic updates
- **Use**: All server state management

## Research Sources

### Competitive Analysis
- **Sources**: 327+ from G2, Gartner, Reddit, official docs
- **Platforms**: ServiceNow, Jira, Freshservice, Datadog, Dynatrace
- **Focus**: User pain points, feature gaps, pricing

### User Sentiment
- **G2 Reviews**: 15+ platforms analyzed
- **Gartner Peer Insights**: 10+ platforms
- **Reddit**: r/sysadmin, product subreddits (20+ threads)

### Market Trends
- **AI/ML**: Capabilities across platforms
- **Pricing**: Hidden costs, TCO analysis
- **UX**: What users love and hate

---

**End of Specification**

This comprehensive UI/UX specification should serve as the single source of truth for all frontend development decisions for Archer ITSM. Update this document as features evolve, user feedback is incorporated, and the product matures.

**Version History:**
- v1.0 (Dec 2, 2025): Initial specification based on 327+ sources of competitive research

**Next Steps:**
1. Review with product team
2. Validate with target users
3. Create high-fidelity mockups
4. Begin Phase 1 implementation

**Maintainer:** Archer ITSM Product Team  
**Last Updated:** December 2, 2025