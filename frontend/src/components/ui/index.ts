/**
 * UI Components Library
 * 
 * Standardized, reusable UI components with Fluent UI 2 design tokens
 * and glassmorphism aesthetic.
 * 
 * @module components/ui
 */

// New Acrylic Components
export { PrimaryButton } from './PrimaryButton';

// Input Components
export { PurpleGlassInput } from './PurpleGlassInput';
export type { PurpleGlassInputProps, GlassVariant, ValidationState } from './PurpleGlassInput';

// Button Components
export { PurpleGlassButton } from './PurpleGlassButton';
export type { PurpleGlassButtonProps, ButtonVariant, ButtonSize } from './PurpleGlassButton';

// Card Components
export { PurpleGlassCard } from './PurpleGlassCard';
export type { PurpleGlassCardProps, CardVariant, CardPadding } from './PurpleGlassCard';

// Textarea Components
export { PurpleGlassTextarea } from './PurpleGlassTextarea';
export type { PurpleGlassTextareaProps } from './PurpleGlassTextarea';

// Dropdown Components
export { PurpleGlassDropdown } from './PurpleGlassDropdown';
export type { PurpleGlassDropdownProps, DropdownOption } from './PurpleGlassDropdown';

// Checkbox Components
export { PurpleGlassCheckbox } from './PurpleGlassCheckbox';
export type { PurpleGlassCheckboxProps } from './PurpleGlassCheckbox';

// Radio Components
export { PurpleGlassRadio, PurpleGlassRadioGroup } from './PurpleGlassRadio';
export type { PurpleGlassRadioProps, PurpleGlassRadioGroupProps } from './PurpleGlassRadio';

// Switch Components
export { PurpleGlassSwitch } from './PurpleGlassSwitch';
export type { PurpleGlassSwitchProps } from './PurpleGlassSwitch';

// Navigation Components
export { PurpleGlassBreadcrumb } from './PurpleGlassBreadcrumb';
export { BreadcrumbNavigation } from './BreadcrumbNavigation';
export type { BreadcrumbNavigationProps } from './BreadcrumbNavigation';

// Spinner Components
export { PurpleGlassSpinner } from './PurpleGlassSpinner';
export type { PurpleGlassSpinnerProps } from './PurpleGlassSpinner';

// Skeleton Components
export { 
  PurpleGlassSkeleton, 
  PageHeaderSkeleton, 
  ContentGridSkeleton, 
  TableSkeleton, 
  FullPageSkeleton 
} from './PurpleGlassSkeleton';
export type { 
  PurpleGlassSkeletonProps, 
  PageHeaderSkeletonProps, 
  ContentGridSkeletonProps, 
  TableSkeletonProps, 
  FullPageSkeletonProps 
} from './PurpleGlassSkeleton';

// Pagination Components
export { PurpleGlassPagination } from './PurpleGlassPagination';
export type { PurpleGlassPaginationProps } from './PurpleGlassPagination';

// Modal Components
export { PurpleGlassModal } from './PurpleGlassModal';
export type { PurpleGlassModalProps } from './PurpleGlassModal';

// Stats Components
export { PurpleGlassStats } from './PurpleGlassStats';
export type { PurpleGlassStatsProps } from './PurpleGlassStats';

// Empty State Components
export { PurpleGlassEmptyState } from './PurpleGlassEmptyState';
export type { PurpleGlassEmptyStateProps } from './PurpleGlassEmptyState';

// Wizard Components
export { WizardResumePrompt } from './WizardResumePrompt';
export type { WizardResumePromptProps } from './WizardResumePrompt';

// Filter Components
export { AdvancedFilterPanel } from './AdvancedFilterPanel';
export type { AdvancedFilterPanelProps, FilterConfig, ActiveFilter } from './AdvancedFilterPanel';

// Virtual Table Components
export { PurpleGlassVirtualTable } from './PurpleGlassVirtualTable';
export type { PurpleGlassVirtualTableProps, VirtualTableColumn } from './PurpleGlassVirtualTable';

// Workflow Components
export { WorkflowTemplateManager } from './WorkflowTemplateManager';
export type { WorkflowTemplateManagerProps, WorkflowTemplate, WorkflowStep } from './WorkflowTemplateManager';

// Bulk Operation Components
export { BulkOperationPanel } from './BulkOperationPanel';
export type { BulkOperationPanelProps, BulkOperation, BulkOperationExecution } from './BulkOperationPanel';

// Integration Layer Components (Phase 2)
// Linked Asset Badge - Shows CMDB asset links on tickets
export { LinkedAssetBadge } from './LinkedAssetBadge';
export type { LinkedAssetBadgeProps, AssetStatus, AssetType } from './LinkedAssetBadge';

// Page Header - Standardized page header with icon, title, actions
export { PageHeader } from './PageHeader';
export type { PageHeaderProps } from './PageHeader';

// SLA Indicator - Visual timer for SLA tracking
export { SLAIndicator } from './SLAIndicator';
export type { SLAIndicatorProps, SLAStatus } from './SLAIndicator';

// Command Palette - Unified search (Ctrl+K)
export { CommandPalette } from './CommandPalette';
export type { CommandPaletteProps, SearchResult } from './CommandPalette';

// Create Incident Modal - One-click incident from alert
export { CreateIncidentModal } from './CreateIncidentModal';
export type { CreateIncidentModalProps, CreateIncidentData, AlertContext } from './CreateIncidentModal';

// Top Navigation Bar - Main app header with search, notifications, profile
export { TopNavigationBar } from './TopNavigationBar';
export type { TopNavigationBarProps } from './TopNavigationBar';

// Migration Notice - User education about navigation restructure
export { MigrationNotice } from './MigrationNotice';
export type { MigrationNoticeProps } from './MigrationNotice';

// Drawer - Sliding panel for detail views
export { PurpleGlassDrawer } from './PurpleGlassDrawer';
export type { PurpleGlassDrawerProps, DrawerSize, DrawerPosition } from './PurpleGlassDrawer';

// Data Table - Enhanced table with sorting, selection, export
export { PurpleGlassDataTable } from './PurpleGlassDataTable';
export type { 
  PurpleGlassDataTableProps, 
  TableColumn, 
  SortState, 
  RowAction, 
  BulkAction 
} from './PurpleGlassDataTable';

// AI Insight Card - AI-powered suggestions and predictions
export { AIInsightCard, AIInsightsPanel } from './AIInsightCard';
export type { 
  AIInsightCardProps, 
  AIInsightsPanelProps, 
  AIInsight, 
  InsightType, 
  InsightSeverity 
} from './AIInsightCard';

// Skeleton Loader - Loading state placeholders
export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonDashboard 
} from './SkeletonLoader';
export type { 
  SkeletonProps, 
  SkeletonTextProps, 
  SkeletonAvatarProps, 
  SkeletonCardProps, 
  SkeletonTableProps, 
  SkeletonDashboardProps 
} from './SkeletonLoader';

// Demo Mode Indicator - Shows when using mock/sample data
export { DemoModeIndicator, DemoModeBanner } from './DemoModeIndicator';
export type { DemoModeIndicatorProps, DemoModeBannerProps } from './DemoModeIndicator';
