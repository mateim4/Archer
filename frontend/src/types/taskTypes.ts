/**
 * Task Types - Core data types for the Tasks feature
 * Aligned with ITIL/ITSM practices for infrastructure lifecycle management
 */

// Task Status - Follows ITIL lifecycle states
export type TaskStatus = 
  | 'draft'           // Created but not yet started
  | 'pending'         // Awaiting assignment or approval
  | 'in_progress'     // Currently being worked on
  | 'on_hold'         // Temporarily paused
  | 'blocked'         // Cannot proceed due to dependencies
  | 'completed'       // Successfully finished
  | 'cancelled';      // Task was cancelled

// Task Priority - Standard priority levels
export type TaskPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Task Category - ITIL-aligned categories
export type TaskCategory = 
  | 'incident'        // Unplanned interruption or reduction
  | 'service_request' // Formal user request
  | 'change'          // Standard, normal, or emergency changes
  | 'problem'         // Root cause investigation
  | 'maintenance'     // Scheduled maintenance activities
  | 'migration'       // Data/infrastructure migration
  | 'deployment'      // New deployments
  | 'decommission'    // Asset removal/retirement
  | 'other';          // Catch-all for uncategorized tasks

// Task interface - Main task data structure
export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Assignment and ownership
  assignee_id?: string;
  assignee_name?: string;
  reporter_id: string;
  reporter_name?: string;
  
  // Project association (optional - tasks can exist independently)
  project_id?: string;
  project_name?: string;
  
  // Timing
  created_at: string;
  updated_at: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  
  // Effort tracking
  estimated_hours?: number;
  actual_hours?: number;
  
  // Tags for flexible categorization
  tags?: string[];
  
  // Related items
  parent_task_id?: string;
  related_task_ids?: string[];
  
  // Additional metadata
  notes?: string;
}

// Request type for creating a new task
export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  assignee_id?: string;
  project_id?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
  parent_task_id?: string;
}

// Request type for updating a task
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  project_id?: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  notes?: string;
  parent_task_id?: string;
  related_task_ids?: string[];
}

// Task statistics for dashboard/overview
export interface TaskStats {
  total: number;
  by_status: Record<TaskStatus, number>;
  by_priority: Record<TaskPriority, number>;
  by_category: Record<TaskCategory, number>;
  overdue: number;
  completed_this_week: number;
  created_this_week: number;
}

// Task filter options
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  category?: TaskCategory[];
  assignee_id?: string;
  project_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  include_completed?: boolean;
}

// Sort options for task list
export type TaskSortField = 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status' | 'title';
export type TaskSortOrder = 'asc' | 'desc';

export interface TaskSort {
  field: TaskSortField;
  order: TaskSortOrder;
}

// Helper constants for UI display
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  blocked: 'Blocked',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  draft: '#6b7280',      // Gray
  pending: '#f59e0b',    // Amber
  in_progress: '#3b82f6', // Blue
  on_hold: '#8b5cf6',    // Purple
  blocked: '#ef4444',    // Red
  completed: '#10b981',  // Green
  cancelled: '#6b7280'   // Gray
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6b7280',        // Gray
  medium: '#3b82f6',     // Blue
  high: '#f59e0b',       // Amber
  critical: '#ef4444'    // Red
};

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  incident: 'Incident',
  service_request: 'Service Request',
  change: 'Change',
  problem: 'Problem',
  maintenance: 'Maintenance',
  migration: 'Migration',
  deployment: 'Deployment',
  decommission: 'Decommission',
  other: 'Other'
};

export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  incident: '#ef4444',       // Red
  service_request: '#3b82f6', // Blue
  change: '#8b5cf6',         // Purple
  problem: '#f97316',        // Orange
  maintenance: '#06b6d4',    // Cyan
  migration: '#10b981',      // Green
  deployment: '#22c55e',     // Lime
  decommission: '#6b7280',   // Gray
  other: '#a3a3a3'           // Light Gray
};

export const TASK_CATEGORY_ICONS: Record<TaskCategory, string> = {
  incident: 'Warning',
  service_request: 'Person',
  change: 'ArrowSync',
  problem: 'Search',
  maintenance: 'Wrench',
  migration: 'ArrowRight',
  deployment: 'Rocket',
  decommission: 'Delete',
  other: 'MoreHorizontal'
};
