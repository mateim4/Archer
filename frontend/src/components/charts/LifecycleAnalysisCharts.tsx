import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Pie } from '@visx/shape';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';
import { Tooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import {
  tokens,
  makeStyles,
  Title3,
  Title2,
  Caption1,
  Badge,
} from '@fluentui/react-components';

// =============================================================================
// CHART STYLES AND CONFIGURATION
// =============================================================================

const useChartStyles = makeStyles({
  chartContainer: {
    background: 'var(--card-bg, rgba(255, 255, 255, 0.95))',
    border: `1px solid var(--card-border, ${tokens.colorNeutralStroke2})`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    backdropFilter: 'blur(10px)',
    boxShadow: 'var(--card-shadow)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  chartTitle: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: tokens.spacingHorizontalXL,
    marginTop: tokens.spacingVerticalL,
  },
  tooltipContainer: {
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    boxShadow: tokens.shadow8,
  },
});

// Chart color schemes
const CHART_COLORS = {
  primary: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  success: ['#10b981', '#34d399', '#6ee7b7', '#9decdb', '#c6f6d5'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'],
  neutral: ['var(--text-secondary)', 'var(--text-muted)', '#d1d5db', '#e5e7eb', '#f3f4f6'],
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface InfrastructureData {
  total_vms: number;
  total_hosts: number;
  total_clusters: number;
  total_capacity_gb: number;
  total_memory_gb: number;
  total_cpu_cores: number;
}

export interface ClusterData {
  cluster_name: string;
  current_vms: number;
  current_hosts: number;
  storage_type: 'vsan_provider' | 'vsan_consumer' | 'fc_san' | 'iscsi_san' | 'unknown';
  migration_complexity: 'Low' | 'Medium' | 'High';
  required_hosts: number;
  cpu_cores_per_host: number;
  memory_gb_per_host: number;
}

export interface HardwareRequirement {
  model_type: string;
  quantity: number;
  cpu_cores: number;
  memory_gb: number;
  purpose: string;
}

export interface MigrationComplexityData {
  overall_score: number;
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  estimated_timeline_weeks: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

// =============================================================================
// INFRASTRUCTURE OVERVIEW CHARTS
// =============================================================================

interface InfrastructureOverviewProps {
  data: InfrastructureData;
  width?: number;
  height?: number;
}

export const InfrastructureOverviewChart: React.FC<InfrastructureOverviewProps> = ({
  data,
  width = 400,
  height = 300,
}) => {
  const styles = useChartStyles();
  const margin = { top: 40, bottom: 60, left: 60, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const chartData = [
    { category: 'VMs', value: data.total_vms, color: CHART_COLORS.primary[0] },
    { category: 'Hosts', value: data.total_hosts, color: CHART_COLORS.primary[1] },
    { category: 'Clusters', value: data.total_clusters, color: CHART_COLORS.primary[2] },
  ];

  const xScale = scaleBand({
    range: [0, xMax],
    domain: chartData.map(d => d.category),
    padding: 0.3,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...chartData.map(d => d.value))],
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ category: string; value: number }>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Infrastructure Overview</Title3>
        <Badge appearance="filled" color="brand">Current State</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            <GridColumns scale={xScale} height={yMax} stroke={tokens.colorNeutralStroke3} />
            
            {chartData.map((d) => {
              const barWidth = xScale.bandwidth();
              const barHeight = yMax - (yScale(d.value) ?? 0);
              const barX = xScale(d.category);
              const barY = yMax - barHeight;
              
              return (
                <Bar
                  key={d.category}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={d.color}
                  stroke={tokens.colorNeutralStroke2}
                  strokeWidth={1}
                  rx={4}
                  onMouseEnter={(event) => {
                    const eventSvgCoords = localPoint(event);
                    showTooltip({
                      tooltipData: d,
                      tooltipTop: eventSvgCoords?.y,
                      tooltipLeft: eventSvgCoords?.x,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
            
            <AxisBottom
              top={yMax}
              scale={xScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 12,
                textAnchor: 'middle',
              }}
            />
            <AxisLeft
              scale={yScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 12,
                textAnchor: 'end',
                dx: '-0.25em',
                dy: '0.25em',
              }}
            />
          </Group>
        </svg>
        
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <div className={styles.tooltipContainer}>
              <strong>{tooltipData.category}</strong>
              <br />
              Count: {tooltipData.value.toLocaleString()}
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// STORAGE TYPE DISTRIBUTION PIE CHART
// =============================================================================

interface StorageDistributionProps {
  clusters: ClusterData[];
  width?: number;
  height?: number;
}

export const StorageTypeDistributionChart: React.FC<StorageDistributionProps> = ({
  clusters,
  width = 400,
  height = 400,
}) => {
  const styles = useChartStyles();
  const radius = Math.min(width, height) / 2 - 40;
  const centerY = height / 2;
  const centerX = width / 2;

  const storageTypeData = useMemo(() => {
    const counts = clusters.reduce((acc, cluster) => {
      acc[cluster.storage_type] = (acc[cluster.storage_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      vsan_provider: CHART_COLORS.primary[0],
      vsan_consumer: CHART_COLORS.primary[1], 
      fc_san: CHART_COLORS.warning[0],
      iscsi_san: CHART_COLORS.warning[1],
      unknown: CHART_COLORS.neutral[0],
    };

    const labels = {
      vsan_provider: 'vSAN Provider',
      vsan_consumer: 'vSAN Consumer',
      fc_san: 'FC SAN',
      iscsi_san: 'iSCSI SAN',
      unknown: 'Unknown',
    };

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      color: colors[type as keyof typeof colors] || CHART_COLORS.neutral[0],
      label: labels[type as keyof typeof labels] || type,
    }));
  }, [clusters]);

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ type: string; count: number; label: string }>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Storage Type Distribution</Title3>
        <Badge appearance="outline">{clusters.length} Clusters</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group top={centerY} left={centerX}>
            <Pie
              data={storageTypeData}
              pieValue={(d) => d.count}
              outerRadius={radius}
              innerRadius={radius * 0.4}
              cornerRadius={3}
              padAngle={0.02}
            >
              {(pie) => {
                return pie.arcs.map((arc, index) => {
                  const arcPath = pie.path(arc);
                  const arcFill = arc.data.color;
                  
                  return (
                    <g key={`arc-${index}`}>
                      <path
                        d={arcPath || ''}
                        fill={arcFill}
                        stroke={tokens.colorNeutralBackground1}
                        strokeWidth={2}
                        onMouseEnter={(event) => {
                          const eventSvgCoords = localPoint(event);
                          showTooltip({
                            tooltipData: arc.data,
                            tooltipTop: eventSvgCoords?.y,
                            tooltipLeft: eventSvgCoords?.x,
                          });
                        }}
                        onMouseLeave={hideTooltip}
                        style={{ cursor: 'pointer' }}
                      />
                      <Text
                        x={pie.path.centroid(arc)[0]}
                        y={pie.path.centroid(arc)[1]}
                        dy=".35em"
                        fontSize={12}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill="white"
                        pointerEvents="none"
                      >
                        {arc.data.count}
                      </Text>
                    </g>
                  );
                });
              }}
            </Pie>
          </Group>
        </svg>
        
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <div className={styles.tooltipContainer}>
              <strong>{tooltipData.label}</strong>
              <br />
              Clusters: {tooltipData.count}
              <br />
              Percentage: {((tooltipData.count / clusters.length) * 100).toFixed(1)}%
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CLUSTER MIGRATION COMPLEXITY CHART
// =============================================================================

interface MigrationComplexityProps {
  clusters: ClusterData[];
  width?: number;
  height?: number;
}

export const MigrationComplexityChart: React.FC<MigrationComplexityProps> = ({
  clusters,
  width = 500,
  height = 300,
}) => {
  const styles = useChartStyles();
  const margin = { top: 40, bottom: 80, left: 100, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const complexityColors = {
    Low: CHART_COLORS.success[0],
    Medium: CHART_COLORS.warning[0], 
    High: CHART_COLORS.danger[0],
  };

  const xScale = scaleBand({
    range: [0, xMax],
    domain: clusters.map(d => d.cluster_name),
    padding: 0.2,
  });

  const yScale = scaleBand({
    range: [0, yMax],
    domain: ['Low', 'Medium', 'High'],
    padding: 0.1,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ClusterData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Migration Complexity by Cluster</Title3>
        <Badge appearance="outline">Risk Assessment</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            {clusters.map((cluster) => {
              const barWidth = xScale.bandwidth();
              const barHeight = yScale.bandwidth() || 0;
              const barX = xScale(cluster.cluster_name) || 0;
              const barY = yScale(cluster.migration_complexity) || 0;
              
              return (
                <Bar
                  key={cluster.cluster_name}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={complexityColors[cluster.migration_complexity]}
                  stroke={tokens.colorNeutralStroke2}
                  strokeWidth={1}
                  rx={4}
                  onMouseEnter={(event) => {
                    const eventSvgCoords = localPoint(event);
                    showTooltip({
                      tooltipData: cluster,
                      tooltipTop: eventSvgCoords?.y,
                      tooltipLeft: eventSvgCoords?.x,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
            
            <AxisBottom
              top={yMax}
              scale={xScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 11,
                textAnchor: 'middle',
                angle: -45,
              }}
            />
            <AxisLeft
              scale={yScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 12,
                textAnchor: 'end',
                dx: '-0.25em',
                dy: '0.25em',
              }}
            />
          </Group>
        </svg>
        
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <div className={styles.tooltipContainer}>
              <strong>{tooltipData.cluster_name}</strong>
              <br />
              Complexity: {tooltipData.migration_complexity}
              <br />
              Current VMs: {tooltipData.current_vms}
              <br />
              Current Hosts: {tooltipData.current_hosts}
              <br />
              Storage: {tooltipData.storage_type.replace('_', ' ').toUpperCase()}
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// HARDWARE REQUIREMENTS CHART
// =============================================================================

interface HardwareRequirementsProps {
  requirements: HardwareRequirement[];
  width?: number;
  height?: number;
}

export const HardwareRequirementsChart: React.FC<HardwareRequirementsProps> = ({
  requirements,
  width = 600,
  height = 300,
}) => {
  const styles = useChartStyles();
  const margin = { top: 40, bottom: 60, left: 60, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    range: [0, xMax],
    domain: requirements.map(d => d.model_type),
    padding: 0.3,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...requirements.map(d => d.quantity))],
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<HardwareRequirement>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Hardware Requirements</Title3>
        <Badge appearance="filled" color="success">New Infrastructure</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            
            {requirements.map((req, i) => {
              const barWidth = xScale.bandwidth();
              const barHeight = yMax - (yScale(req.quantity) ?? 0);
              const barX = xScale(req.model_type);
              const barY = yMax - barHeight;
              
              return (
                <Bar
                  key={req.model_type}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={CHART_COLORS.success[i % CHART_COLORS.success.length]}
                  stroke={tokens.colorNeutralStroke2}
                  strokeWidth={1}
                  rx={4}
                  onMouseEnter={(event) => {
                    const eventSvgCoords = localPoint(event);
                    showTooltip({
                      tooltipData: req,
                      tooltipTop: eventSvgCoords?.y,
                      tooltipLeft: eventSvgCoords?.x,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
            
            <AxisBottom
              top={yMax}
              scale={xScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 11,
                textAnchor: 'middle',
              }}
            />
            <AxisLeft
              scale={yScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 12,
                textAnchor: 'end',
                dx: '-0.25em',
                dy: '0.25em',
              }}
            />
          </Group>
        </svg>
        
        {tooltipOpen && tooltipData && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <div className={styles.tooltipContainer}>
              <strong>{tooltipData.model_type}</strong>
              <br />
              Quantity: {tooltipData.quantity}
              <br />
              CPU Cores: {tooltipData.cpu_cores}
              <br />
              Memory: {tooltipData.memory_gb} GB
              <br />
              Purpose: {tooltipData.purpose}
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPREHENSIVE REPORT DASHBOARD
// =============================================================================

interface LifecycleAnalysisDashboardProps {
  infrastructureData: InfrastructureData;
  clusterData: ClusterData[];
  hardwareRequirements: HardwareRequirement[];
  migrationComplexity: MigrationComplexityData;
}

export const LifecycleAnalysisDashboard: React.FC<LifecycleAnalysisDashboardProps> = ({
  infrastructureData,
  clusterData,
  hardwareRequirements,
  migrationComplexity,
}) => {
  const styles = useChartStyles();

  return (
    <div>
      <div className={styles.chartHeader}>
        <Title2 style={{ color: tokens.colorBrandForeground1 }}>
          VMware to Hyper-V Migration Analysis
        </Title2>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <Badge appearance="filled" color="brand">
            {clusterData.length} Clusters
          </Badge>
          <Badge 
            appearance="filled" 
            color={migrationComplexity.risk_level === 'High' ? 'danger' : 
                   migrationComplexity.risk_level === 'Medium' ? 'warning' : 'success'}
          >
            {migrationComplexity.risk_level} Risk
          </Badge>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <ParentSize>
          {({ width }) => (
            <InfrastructureOverviewChart 
              data={infrastructureData} 
              width={Math.min(width, 400)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <StorageTypeDistributionChart 
              clusters={clusterData}
              width={Math.min(width, 400)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <MigrationComplexityChart 
              clusters={clusterData}
              width={Math.min(width, 600)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <HardwareRequirementsChart 
              requirements={hardwareRequirements}
              width={Math.min(width, 600)}
            />
          )}
        </ParentSize>
      </div>
    </div>
  );
};

export default LifecycleAnalysisDashboard;