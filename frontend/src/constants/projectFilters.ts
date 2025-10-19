/**
 * Shared filter options for project-related components
 * Centralizes dropdown options to avoid duplication
 */

import type { DropdownOption } from '@/components/ui';

/**
 * Activity status filter options
 * Used in ProjectDetailView and ProjectDetailView_Fluent2
 */
export const ACTIVITY_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'pending_assignment', label: 'Pending Assignment' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'canceled', label: 'Canceled' },
];

/**
 * Document type filter options
 * Used in ProjectDocumentsView
 */
export const DOCUMENT_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Types' },
  { value: 'hardware_refresh_report', label: 'Hardware Refresh Reports' },
  { value: 'lifecycle_assessment', label: 'Lifecycle Assessments' },
  { value: 'migration_plan', label: 'Migration Plans' },
  { value: 'capacity_analysis', label: 'Capacity Analysis' },
];
