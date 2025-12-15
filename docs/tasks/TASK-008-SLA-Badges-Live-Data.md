# TASK-008: SLA Badges Live Data

**Task ID:** TASK-008  
**Priority:** P2 - Medium  
**Estimate:** 3 hours  
**Dependencies:** TASK-003 (SLA Management View), TASK-001 (ServiceDeskView API)  
**Phase:** 1 - Core ITSM (Enhancement)

---

## Objective

Display real SLA status badges on tickets throughout the application. Each ticket should show its SLA state (On Track, At Risk, Breached) based on live data from the SLA service.

---

## Context

### What Exists
- Backend: `SlaService` with `calculate_sla_times()` method
- Backend: `SlaStatus` enum (OnTrack, AtRisk, Breached, Paused, Closed)
- Model: `Ticket` has `sla_policy_id`, `sla_response_due`, `sla_resolution_due` fields
- Frontend: `TicketDetailView` may have placeholder SLA display

### What's Missing
- Reusable SLA badge component
- SLA status calculation on frontend
- Badge display in ticket lists (ServiceDeskView)
- Badge display in ticket detail

---

## Implementation

### Step 1: Create SLA Badge Component

```typescript
// File: frontend/src/components/ticket/SLABadge.tsx

import React from 'react';
import { Badge } from '@fluentui/react-components';
import { ClockRegular, WarningRegular, ErrorCircleRegular, PauseRegular, CheckmarkCircleRegular } from '@fluentui/react-icons';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'paused' | 'closed';

interface SLABadgeProps {
  status: SLAStatus;
  dueDate?: string; // ISO timestamp
  showCountdown?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const getTimeRemaining = (dueDate: string): string => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  
  if (diff < 0) {
    const overdue = Math.abs(diff);
    const hours = Math.floor(overdue / (1000 * 60 * 60));
    const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m overdue`;
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
};

const statusConfig: Record<SLAStatus, { label: string; color: string; icon: React.ReactNode }> = {
  on_track: {
    label: 'On Track',
    color: 'success',
    icon: <ClockRegular />,
  },
  at_risk: {
    label: 'At Risk',
    color: 'warning',
    icon: <WarningRegular />,
  },
  breached: {
    label: 'Breached',
    color: 'danger',
    icon: <ErrorCircleRegular />,
  },
  paused: {
    label: 'Paused',
    color: 'informative',
    icon: <PauseRegular />,
  },
  closed: {
    label: 'Met',
    color: 'success',
    icon: <CheckmarkCircleRegular />,
  },
};

export const SLABadge: React.FC<SLABadgeProps> = ({
  status,
  dueDate,
  showCountdown = false,
  size = 'medium',
}) => {
  const config = statusConfig[status];
  const timeRemaining = dueDate && showCountdown ? getTimeRemaining(dueDate) : null;

  return (
    <div className="sla-badge-container">
      <Badge
        appearance="filled"
        color={config.color as any}
        size={size}
        icon={config.icon}
      >
        {config.label}
      </Badge>
      {timeRemaining && (
        <span className="sla-countdown">{timeRemaining}</span>
      )}
    </div>
  );
};
```

### Step 2: Add SLA Status Calculation Hook

```typescript
// File: frontend/src/hooks/useSLAStatus.ts

import { useMemo } from 'react';

export type SLAStatus = 'on_track' | 'at_risk' | 'breached' | 'paused' | 'closed';

interface SLACalculationInput {
  status: string; // Ticket status
  slaResponseDue?: string;
  slaResolutionDue?: string;
  respondedAt?: string;
  resolvedAt?: string;
}

export function calculateSLAStatus(ticket: SLACalculationInput): SLAStatus {
  // Closed tickets
  if (ticket.status === 'closed' || ticket.status === 'resolved') {
    return 'closed';
  }

  // Paused tickets
  if (ticket.status === 'on_hold' || ticket.status === 'pending_customer') {
    return 'paused';
  }

  const now = new Date();
  
  // Check resolution SLA
  if (ticket.slaResolutionDue && !ticket.resolvedAt) {
    const resolutionDue = new Date(ticket.slaResolutionDue);
    const timeToDue = resolutionDue.getTime() - now.getTime();
    const hoursRemaining = timeToDue / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) return 'breached';
    if (hoursRemaining < 2) return 'at_risk'; // Less than 2 hours
  }

  // Check response SLA
  if (ticket.slaResponseDue && !ticket.respondedAt) {
    const responseDue = new Date(ticket.slaResponseDue);
    const timeToDue = responseDue.getTime() - now.getTime();
    const hoursRemaining = timeToDue / (1000 * 60 * 60);
    
    if (hoursRemaining < 0) return 'breached';
    if (hoursRemaining < 1) return 'at_risk'; // Less than 1 hour
  }

  return 'on_track';
}

export function useSLAStatus(ticket: SLACalculationInput): SLAStatus {
  return useMemo(() => calculateSLAStatus(ticket), [
    ticket.status,
    ticket.slaResponseDue,
    ticket.slaResolutionDue,
    ticket.respondedAt,
    ticket.resolvedAt,
  ]);
}
```

### Step 3: Add to ServiceDeskView Ticket List

```typescript
// File: frontend/src/views/ServiceDeskView.tsx

// Add import
import { SLABadge, calculateSLAStatus } from '../components/ticket/SLABadge';

// In the ticket list rendering, add SLA column
<DataGrid columns={[
  // ... existing columns
  {
    header: 'SLA',
    accessorFn: (ticket) => calculateSLAStatus(ticket),
    cell: ({ row }) => (
      <SLABadge
        status={calculateSLAStatus(row.original)}
        dueDate={row.original.slaResolutionDue}
        showCountdown={false}
      />
    ),
    size: 120,
  },
]}>
```

### Step 4: Add to TicketDetailView Header

```typescript
// File: frontend/src/views/TicketDetailView.tsx

// Add import
import { SLABadge, useSLAStatus } from '../components/ticket/SLABadge';

// In the component
const slaStatus = useSLAStatus(ticket);

// In the header section
<div className="ticket-header">
  <h1>{ticket.title}</h1>
  <div className="ticket-meta">
    <SLABadge
      status={slaStatus}
      dueDate={ticket.slaResolutionDue}
      showCountdown
    />
    {/* Other badges */}
  </div>
</div>
```

### Step 5: Add Styles

```css
/* File: frontend/src/styles/sla-badge.css */

.sla-badge-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sla-countdown {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Status-specific colors if Fluent Badge doesn't suffice */
.sla-badge--on-track {
  --badge-bg: var(--color-success);
}

.sla-badge--at-risk {
  --badge-bg: var(--color-warning);
  animation: pulse 2s infinite;
}

.sla-badge--breached {
  --badge-bg: var(--color-danger);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  .sla-badge--at-risk,
  .sla-badge--breached {
    animation: none;
  }
}
```

---

## API Data Requirements

Tickets returned from API must include SLA fields:

```json
{
  "id": "ticket:123",
  "title": "Cannot access email",
  "status": "in_progress",
  "priority": "high",
  "sla_policy_id": "sla:standard",
  "sla_response_due": "2025-01-17T14:00:00Z",
  "sla_resolution_due": "2025-01-18T17:00:00Z",
  "responded_at": null,
  "resolved_at": null
}
```

---

## Acceptance Criteria

- [ ] `SLABadge` component created and exported
- [ ] Five status variants render correctly (on_track, at_risk, breached, paused, closed)
- [ ] Countdown displays hours and minutes remaining
- [ ] "Overdue" displays correctly for breached SLAs
- [ ] Badge appears in ServiceDeskView ticket list
- [ ] Badge appears in TicketDetailView header
- [ ] `At Risk` and `Breached` badges have subtle animation
- [ ] Animation respects `prefers-reduced-motion`
- [ ] Colors meet WCAG contrast requirements
- [ ] TypeScript compiles without errors

---

## Testing

1. Create tickets with various SLA due times:
   - Due in 4 hours → Should show "On Track"
   - Due in 30 minutes → Should show "At Risk"
   - Overdue by 1 hour → Should show "Breached"
2. Set ticket to "On Hold" → Should show "Paused"
3. Resolve ticket → Should show "Met"
4. Verify countdown updates (may need to refresh)
5. Test with `prefers-reduced-motion` enabled

---

## Notes for Agent

1. **Fluent UI Badge** - Use the Fluent UI Badge component as base
2. **Time calculations** - Be careful with timezone handling
3. **Business hours** - Future enhancement: calculate remaining time in business hours only
4. **Real-time updates** - Current implementation requires refresh; WebSocket updates are Phase 2
5. **Export from ui** - Add SLABadge to `components/ui/index.ts` exports
