// Export all chart components for easy importing

// VISX Chart Components (New - Archer Design System)
export { VisxBarChart } from './VisxBarChart';
export type { VisxBarChartProps, BarChartDataPoint } from './VisxBarChart';

export { VisxLineChart } from './VisxLineChart';
export type { VisxLineChartProps, LineChartDataPoint } from './VisxLineChart';

export { VisxPieChart } from './VisxPieChart';
export type { VisxPieChartProps, PieChartDataPoint } from './VisxPieChart';

export { VisxAreaChart } from './VisxAreaChart';
export type { VisxAreaChartProps, AreaChartDataPoint } from './VisxAreaChart';

// Lifecycle Analysis Charts
export {
  InfrastructureOverviewChart,
  StorageTypeDistributionChart,
  MigrationComplexityChart,
  HardwareRequirementsChart,
  LifecycleAnalysisDashboard,
  type InfrastructureData,
  type ClusterData,
  type HardwareRequirement,
  type MigrationComplexityData,
} from './LifecycleAnalysisCharts';

// S2D Readiness Charts
export {
  S2DReadinessOverviewChart,
  S2DRequirementsHeatmapChart,
  MigrationTimelineChart,
  S2DAnalysisDashboard,
  type S2DReadinessData,
  type S2DRequirement,
  type ClusterS2DAnalysis,
} from './S2DReadinessCharts';

// Capacity Planning Charts
export {
  ResourceUtilizationChart,
  CapacityProjectionChart,
  CostAnalysisChart,
  CapacityPlanningDashboard,
  type CapacityData,
  type ResourceProjection,
  type CostBreakdown,
  type PerformanceMetric,
} from './CapacityPlanningCharts';