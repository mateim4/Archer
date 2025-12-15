/**
 * SLA Status Calculation Hook
 * 
 * Calculates SLA status based on ticket state and due times.
 * 
 * @example
 * ```tsx
 * const slaStatus = useSLAStatus({
 *   status: ticket.status,
 *   slaResponseDue: ticket.response_due,
 *   slaResolutionDue: ticket.resolution_due,
 *   respondedAt: ticket.first_response_at,
 *   resolvedAt: ticket.resolved_at,
 * });
 * ```
 */

import { useMemo } from 'react';
import type { SLAStatus } from '../components/tickets/SLABadge';

export interface SLACalculationInput {
  status: string; // Ticket status (e.g., 'NEW', 'IN_PROGRESS', 'RESOLVED', etc.)
  slaResponseDue?: string; // ISO timestamp
  slaResolutionDue?: string; // ISO timestamp
  respondedAt?: string; // ISO timestamp
  resolvedAt?: string; // ISO timestamp
}

/**
 * Calculate SLA status based on ticket state
 * 
 * Logic:
 * - Terminal states (CLOSED, RESOLVED, CANCELLED) -> 'met'
 * - Paused states (ON_HOLD, PENDING_CUSTOMER, PENDING_VENDOR) -> 'paused'
 * - Breached if past due and not responded/resolved
 * - At risk if less than 25% time remaining
 * - On track otherwise
 */
export function calculateSLAStatus(ticket: SLACalculationInput): {
  responseStatus: SLAStatus;
  resolutionStatus: SLAStatus;
} {
  const now = new Date();
  
  // Normalize status to uppercase
  const status = ticket.status.toUpperCase();
  
  // Terminal states - SLA is met
  if (['CLOSED', 'RESOLVED', 'CANCELLED'].includes(status)) {
    return {
      responseStatus: 'met',
      resolutionStatus: 'met',
    };
  }

  // Paused states - SLA clock stopped
  if (['ON_HOLD', 'PENDING_CUSTOMER', 'PENDING_VENDOR'].includes(status)) {
    return {
      responseStatus: 'paused',
      resolutionStatus: 'paused',
    };
  }

  // Calculate response SLA status
  let responseStatus: SLAStatus = 'on_track';
  if (ticket.slaResponseDue && !ticket.respondedAt) {
    const responseDue = new Date(ticket.slaResponseDue);
    const timeToDue = responseDue.getTime() - now.getTime();
    const minutesRemaining = timeToDue / (1000 * 60);
    
    if (minutesRemaining < 0) {
      responseStatus = 'breached';
    } else if (minutesRemaining < 60) {
      // Less than 1 hour = at risk
      responseStatus = 'at_risk';
    }
  } else if (ticket.respondedAt) {
    // Already responded - check if it was on time
    if (ticket.slaResponseDue) {
      const responseDue = new Date(ticket.slaResponseDue);
      const responded = new Date(ticket.respondedAt);
      responseStatus = responded <= responseDue ? 'met' : 'breached';
    } else {
      responseStatus = 'met';
    }
  }

  // Calculate resolution SLA status
  let resolutionStatus: SLAStatus = 'on_track';
  if (ticket.slaResolutionDue && !ticket.resolvedAt) {
    const resolutionDue = new Date(ticket.slaResolutionDue);
    const timeToDue = resolutionDue.getTime() - now.getTime();
    const minutesRemaining = timeToDue / (1000 * 60);
    
    if (minutesRemaining < 0) {
      resolutionStatus = 'breached';
    } else if (minutesRemaining < 120) {
      // Less than 2 hours = at risk
      resolutionStatus = 'at_risk';
    }
  } else if (ticket.resolvedAt) {
    // Already resolved - check if it was on time
    if (ticket.slaResolutionDue) {
      const resolutionDue = new Date(ticket.slaResolutionDue);
      const resolved = new Date(ticket.resolvedAt);
      resolutionStatus = resolved <= resolutionDue ? 'met' : 'breached';
    } else {
      resolutionStatus = 'met';
    }
  }

  return {
    responseStatus,
    resolutionStatus,
  };
}

/**
 * React hook to calculate SLA status with memoization
 */
export function useSLAStatus(ticket: SLACalculationInput) {
  return useMemo(() => calculateSLAStatus(ticket), [
    ticket.status,
    ticket.slaResponseDue,
    ticket.slaResolutionDue,
    ticket.respondedAt,
    ticket.resolvedAt,
  ]);
}
