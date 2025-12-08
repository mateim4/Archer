# Archer AI Integration Specification

## Overview

This document specifies where AI features appear in the Archer UI, how they integrate non-intrusively with existing functionality, and the separation between the **AI Engine (admin appliance)** and **user-facing AI features**.

---

## Architecture Separation

### AI Engine (Port 8000) - Internal Admin Tool
| Purpose | Audience | Access |
|---------|----------|--------|
| LLM provider management | ML Engineers, Admins | Direct URL or admin portal |
| Model health monitoring | DevOps | Swagger UI at `/docs` |
| Request logging/debugging | Data Engineers | Admin dashboard |
| Cost tracking per provider | Finance/Admin | Metrics endpoint |
| RAG index management | Data Engineers | Admin API |

**NOT exposed to end users.** This is backend infrastructure.

### Archer UI (Port 1420) - User-Facing AI Features
AI features are **integrated into existing views** as progressive enhancements.
They appear only when:
1. `AI_ENABLED=true` in config
2. AI Engine health check passes
3. User has appropriate permissions

---

## Feature Integration Map

### 1. Service Desk (`/app/service-desk`)

| Location | AI Feature | UI Element | Behavior |
|----------|------------|------------|----------|
| Ticket List | Smart Search | Enhanced search bar | "Search with AI" toggle - semantic search vs keyword |
| Ticket List | Priority Indicator | Colored dot/badge | AI-suggested priority shown if differs from assigned |
| New Ticket Form | Category Suggestion | Small button next to category dropdown | "✨ Suggest" - auto-fills based on description |
| New Ticket Form | Similar Tickets | Collapsible panel below description | Shows 3-5 similar tickets after typing pauses |
| Ticket Detail | Resolution Suggestions | Card in sidebar | "AI Suggestions" card with ranked solutions |
| Ticket Detail | Knowledge Links | Links below suggestions | "Related KB Articles" from RAG |

**Non-AI Fallback:** All fields remain manual. Suggestion buttons hidden. Search uses keyword matching.

---

### 2. Dashboard (`/app/dashboard`)

| Location | AI Feature | UI Element | Behavior |
|----------|------------|------------|----------|
| Alerts Section | Anomaly Detection | Alert cards with "AI" badge | Unusual patterns flagged |
| Quick Actions | Smart Recommendations | Card: "AI Insights" | Top 3 recommended actions based on current state |
| Metrics | Trend Analysis | Sparkline with prediction | Dotted line shows AI-predicted trend |

**Non-AI Fallback:** Standard alert cards without AI badge. No recommendations card. Static sparklines.

---

### 3. Monitoring (`/app/monitoring`)

| Location | AI Feature | UI Element | Behavior |
|----------|------------|------------|----------|
| Alert Detail | Root Cause Analysis | Expandable section | "Analyze" button → AI generates RCA |
| Alert Detail | Correlation | "Related Alerts" panel | AI-correlated alerts from same timeframe |
| Alert Detail | **Action Buttons** | Button group | "Investigate 15min before", "Show correlated", "Compare baseline" |
| Timeline | Anomaly Markers | Highlighted regions | AI-detected anomalies shaded on timeline |

**Action Button Details:**
```tsx
<AIActionButtons>
  <Button icon={<ClockRegular />}>Investigate 15 min before</Button>
  <Button icon={<LinkRegular />}>Show correlated alerts</Button>
  <Button icon={<ChartRegular />}>Compare with last week</Button>
  <Button icon={<ServerRegular />}>Check dependent services</Button>
</AIActionButtons>
```

**Non-AI Fallback:** Manual alert inspection. No RCA section. No correlation panel.

---

### 4. Inventory/CMDB (`/app/inventory`)

| Location | AI Feature | UI Element | Behavior |
|----------|------------|------------|----------|
| Asset Detail | Impact Analysis | Sidebar card | "What depends on this?" - AI-generated dependency map |
| Asset List | Classification | Badge on row | AI-suggested asset category if unclassified |
| Search | Natural Language | Search bar enhancement | "Find all Windows servers with high CPU last week" |

**Non-AI Fallback:** Standard CMDB views. Manual classification. Keyword search only.

---

### 5. Projects (`/app/projects`)

| Location | AI Feature | UI Element | Behavior |
|----------|------------|------------|----------|
| Project Detail | Risk Assessment | Card in sidebar | AI-calculated risk score with factors |
| Timeline | Delay Prediction | Warning indicators | AI predicts potential delays based on history |
| Activity List | Smart Grouping | Optional toggle | AI-grouped related activities |

**Non-AI Fallback:** No risk card. Standard timeline. Manual activity organization.

---

### 6. Global AI Features

| Feature | Trigger | UI Element | Location |
|---------|---------|------------|----------|
| **Librarian Chat** | Keyboard shortcut (Ctrl+Shift+L) or sidebar icon | Slide-out panel | Right edge of screen |
| **Quick Answer** | Select text + right-click | Context menu option | Any text selection |
| **Command Palette AI** | Ctrl+K then type "ask:" | Command palette mode | Global |

**Librarian Panel Specification:**
- Slides in from right (400px width)
- Persists across navigation
- Shows conversation history
- "Ask about this page" context button
- Sources/citations for answers
- "I don't know" when no relevant docs

---

## Component Architecture

### AIFeatureGate Component

```tsx
// Only renders children if AI is enabled AND healthy
<AIFeatureGate 
  feature="ticket-suggestions"  // Feature flag name
  fallback={null}               // What to render if disabled (default: nothing)
  loadingFallback={<Spinner />} // Optional loading state
>
  <SuggestCategoryButton ticketId={id} />
</AIFeatureGate>
```

### AI Context Provider

```tsx
// Wraps entire app, provides AI state to all components
<AIContextProvider>
  <App />
</AIContextProvider>

// Hook usage in any component
const { isAIEnabled, isAIHealthy, aiFeatures } = useAI();
```

### Feature Flags

```typescript
// AI feature flags (from config or API)
interface AIFeatureFlags {
  'ticket-suggestions': boolean;
  'smart-search': boolean;
  'anomaly-detection': boolean;
  'librarian-chat': boolean;
  'rca-generation': boolean;
  'monitoring-actions': boolean;  // The suggested action buttons
}
```

---

## Visual Design Guidelines

### AI Indicators
- **Sparkle Icon (✨)**: AI-generated or AI-suggested content
- **"AI" Badge**: Small pill badge on AI-enhanced elements
- **Purple Accent**: AI features use brand purple accent
- **Subtle Animation**: Gentle pulse on AI-active elements

### Non-Intrusive Placement
- AI buttons are **secondary** style, not primary
- Suggestions appear in **sidebars or collapsibl panels**, not blocking content
- AI badges are **small and subtle**, not attention-grabbing
- All AI features have **clear dismiss/hide options**

### Loading States
- Skeleton loader matching AI component shape
- "Analyzing..." text with spinner
- Graceful timeout: "AI unavailable, try again"

---

## File Organization

```
frontend/src/
├── features/
│   └── ai/                          # ALL AI-related code lives here
│       ├── components/
│       │   ├── AIFeatureGate.tsx    # Conditional rendering wrapper
│       │   ├── AIContextProvider.tsx # Global AI state
│       │   ├── LibrarianPanel.tsx   # RAG chat sidebar
│       │   ├── SuggestButton.tsx    # Reusable suggest trigger
│       │   ├── AIBadge.tsx          # "AI" indicator badge
│       │   ├── AILoadingState.tsx   # Standard AI loading UI
│       │   └── AIActionButtons.tsx  # Monitoring action suggestions
│       ├── hooks/
│       │   ├── useAI.ts             # Main AI context hook
│       │   ├── useAIHealth.ts       # Health check polling
│       │   ├── useLibrarian.ts      # RAG query hook
│       │   └── useTicketSuggestions.ts
│       ├── services/
│       │   └── aiClient.ts          # API client for AI Engine
│       ├── types/
│       │   └── ai.types.ts          # TypeScript interfaces
│       └── index.ts                 # Public exports
│
├── views/                           # Existing views - minimal AI imports
│   ├── ServiceDeskView.tsx          # Imports from features/ai
│   ├── DashboardView.tsx
│   └── ...
```

---

## Integration Points (Existing Views)

### ServiceDeskView.tsx
```tsx
import { AIFeatureGate, SuggestCategoryButton, SimilarTicketsPanel } from '@/features/ai';

// In the ticket form:
<AIFeatureGate feature="ticket-suggestions">
  <SuggestCategoryButton onSuggest={handleCategorySuggestion} />
</AIFeatureGate>

// Below description field:
<AIFeatureGate feature="similar-tickets">
  <SimilarTicketsPanel description={ticketDescription} />
</AIFeatureGate>
```

### MonitoringView.tsx
```tsx
import { AIFeatureGate, AIActionButtons, RootCauseAnalysis } from '@/features/ai';

// In alert detail:
<AIFeatureGate feature="monitoring-actions">
  <AIActionButtons 
    alertId={alert.id}
    timestamp={alert.timestamp}
    onInvestigate={handleInvestigate}
    onCorrelate={handleCorrelate}
    onCompareBaseline={handleCompare}
  />
</AIFeatureGate>
```

---

## Configuration

### Environment Variables
```env
# Frontend (.env)
VITE_AI_ENABLED=true
VITE_AI_ENGINE_URL=http://localhost:8000

# Backend (rust)
AI_ENGINE_URL=http://localhost:8000
AI_FEATURES_ENABLED=ticket-suggestions,smart-search,librarian-chat
```

### Runtime Toggle
Admins can enable/disable AI features per-tenant without redeployment via Settings.

---

## Migration Checklist

### Existing AI-Related Code to Move

After auditing the codebase, move these to `features/ai/`:

1. [ ] Any "smart" or "suggest" functionality
2. [ ] Any chat/assistant components
3. [ ] Any prediction/recommendation logic
4. [ ] Any integration with external AI services

### Views to Update

1. [ ] `ServiceDeskView.tsx` - Add ticket suggestions
2. [ ] `TicketDetailView.tsx` - Add resolution suggestions
3. [ ] `DashboardView.tsx` - Add AI insights card
4. [ ] `MonitoringView.tsx` - Add RCA and action buttons
5. [ ] `InventoryView.tsx` - Add smart search
6. [ ] `App.tsx` - Add AIContextProvider and LibrarianPanel

---

## Phase 2 Delivery

### Sprint 1: Foundation
- [ ] Create `features/ai/` directory structure
- [ ] Implement `AIContextProvider` and `useAI` hook
- [ ] Implement `AIFeatureGate` component
- [ ] Create `aiClient.ts` service
- [ ] Add health check endpoint integration

### Sprint 2: First Features
- [ ] Ticket category suggestions
- [ ] Similar tickets panel
- [ ] Librarian chat panel (basic)

### Sprint 3: Monitoring Integration
- [ ] Alert correlation
- [ ] Action buttons (investigate, correlate, compare)
- [ ] Root cause analysis (basic)

### Sprint 4: Polish
- [ ] Smart search across views
- [ ] Dashboard AI insights
- [ ] Feature flags admin UI
