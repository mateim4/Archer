import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, LinePath } from '@visx/shape';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import {
  tokens,
  makeStyles,
  Title3,
  Caption1,
  Badge,
  ProgressBar,
} from '@fluentui/react-components';

// =============================================================================
// CHART STYLES
// =============================================================================

const useS2DChartStyles = makeStyles({
  chartContainer: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalL,
    backdropFilter: 'blur(10px)',
    boxShadow: tokens.shadow4,
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
  readinessGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
  },
  readinessCard: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
  },
  scoreIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
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

// Chart colors for S2D readiness
const S2D_COLORS = {
  ready: '#10b981',      // Green for ready clusters
  needsAudit: '#f59e0b', // Orange for needs hardware audit
  nonCompliant: '#ef4444', // Red for non-compliant
  requirement: {
    pass: '#10b981',
    warning: '#f59e0b',
    fail: '#ef4444',
  },
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface S2DReadinessData {
  ready_clusters: number;
  requires_hardware_audit: number;
  non_compliant_clusters: number;
  overall_readiness_score: number;
}

export interface S2DRequirement {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  current_value: string;
  required_value: string;
  confidence: number;
  details: string;
}

export interface ClusterS2DAnalysis {
  cluster_name: string;
  readiness_score: number;
  requirements: S2DRequirement[];
  storage_compatibility: 'Compatible' | 'Needs Review' | 'Incompatible';
  estimated_migration_time: number; // in days
}

// =============================================================================
// S2D READINESS OVERVIEW CHART
// =============================================================================

interface S2DReadinessOverviewProps {
  data: S2DReadinessData;
  width?: number;
  height?: number;
}

export const S2DReadinessOverviewChart: React.FC<S2DReadinessOverviewProps> = ({
  data,
  width = 400,
  height = 300,
}) => {
  const styles = useS2DChartStyles();
  const margin = { top: 40, bottom: 60, left: 80, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const chartData = [
    { 
      category: 'Ready for S2D', 
      value: data.ready_clusters, 
      color: S2D_COLORS.ready,
      description: 'Clusters ready for Storage Spaces Direct deployment'
    },
    { 
      category: 'Needs Hardware Audit', 
      value: data.requires_hardware_audit, 
      color: S2D_COLORS.needsAudit,
      description: 'Clusters requiring hardware verification'
    },
    { 
      category: 'Non-Compliant', 
      value: data.non_compliant_clusters, 
      color: S2D_COLORS.nonCompliant,
      description: 'Clusters not suitable for S2D'
    },
  ];

  const xScale = scaleBand({
    range: [0, xMax],
    domain: chartData.map(d => d.category),
    padding: 0.3,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...chartData.map(d => d.value), 1)],
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<typeof chartData[0]>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>S2D Readiness Overview</Title3>
        <div className={styles.scoreIndicator}>
          <Caption1>Overall Score:</Caption1>
          <ProgressBar 
            value={data.overall_readiness_score}
            max={1}
            color={data.overall_readiness_score > 0.7 ? 'success' : 
                   data.overall_readiness_score > 0.4 ? 'warning' : 'error'}
          />
          <Badge appearance="filled" 
                 color={data.overall_readiness_score > 0.7 ? 'success' : 
                        data.overall_readiness_score > 0.4 ? 'warning' : 'danger'}>
            {(data.overall_readiness_score * 100).toFixed(0)}%
          </Badge>
        </div>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            
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
              <strong>{tooltipData.category}</strong>
              <br />
              Clusters: {tooltipData.value}
              <br />
              {tooltipData.description}
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CLUSTER S2D REQUIREMENTS HEATMAP
// =============================================================================

interface S2DRequirementsHeatmapProps {
  clusters: ClusterS2DAnalysis[];
  width?: number;
  height?: number;
}

export const S2DRequirementsHeatmapChart: React.FC<S2DRequirementsHeatmapProps> = ({
  clusters,
  width = 600,
  height = 400,
}) => {
  const styles = useS2DChartStyles();
  const margin = { top: 60, bottom: 100, left: 120, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Get all unique requirement names
  const requirementNames = useMemo(() => {
    const names = new Set<string>();
    clusters.forEach(cluster => {
      cluster.requirements.forEach(req => names.add(req.name));
    });
    return Array.from(names);
  }, [clusters]);

  const xScale = scaleBand({
    range: [0, xMax],
    domain: clusters.map(c => c.cluster_name),
    padding: 0.1,
  });

  const yScale = scaleBand({
    range: [0, yMax],
    domain: requirementNames,
    padding: 0.1,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ cluster: string; requirement: S2DRequirement }>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>S2D Requirements by Cluster</Title3>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: S2D_COLORS.requirement.pass }} />
            <Caption1>Pass</Caption1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: S2D_COLORS.requirement.warning }} />
            <Caption1>Warning</Caption1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: S2D_COLORS.requirement.fail }} />
            <Caption1>Fail</Caption1>
          </div>
        </div>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            {clusters.map((cluster) => {
              return requirementNames.map((reqName) => {
                const requirement = cluster.requirements.find(r => r.name === reqName);
                const cellWidth = xScale.bandwidth();
                const cellHeight = yScale.bandwidth();
                const cellX = xScale(cluster.cluster_name) || 0;
                const cellY = yScale(reqName) || 0;
                
                if (!requirement) return null;
                
                const color = S2D_COLORS.requirement[requirement.status];
                
                return (
                  <rect
                    key={`${cluster.cluster_name}-${reqName}`}
                    x={cellX}
                    y={cellY}
                    width={cellWidth}
                    height={cellHeight}
                    fill={color}
                    stroke={tokens.colorNeutralBackground1}
                    strokeWidth={1}
                    rx={2}
                    onMouseEnter={(event) => {
                      const eventSvgCoords = localPoint(event);
                      showTooltip({
                        tooltipData: { cluster: cluster.cluster_name, requirement },
                        tooltipTop: eventSvgCoords?.y,
                        tooltipLeft: eventSvgCoords?.x,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                    style={{ cursor: 'pointer' }}
                  />
                );
              });
            })}
            
            <AxisBottom
              top={yMax}
              scale={xScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 10,
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
                fontSize: 11,
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
              <strong>{tooltipData.cluster}</strong>
              <br />
              <strong>{tooltipData.requirement.name}</strong>
              <br />
              Status: <span style={{ 
                color: S2D_COLORS.requirement[tooltipData.requirement.status],
                fontWeight: 'bold'
              }}>
                {tooltipData.requirement.status.toUpperCase()}
              </span>
              <br />
              Current: {tooltipData.requirement.current_value}
              <br />
              Required: {tooltipData.requirement.required_value}
              <br />
              Confidence: {(tooltipData.requirement.confidence * 100).toFixed(0)}%
              <br />
              <em>{tooltipData.requirement.details}</em>
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// MIGRATION TIMELINE CHART
// =============================================================================

interface MigrationTimelineProps {
  clusters: ClusterS2DAnalysis[];
  width?: number;
  height?: number;
}

export const MigrationTimelineChart: React.FC<MigrationTimelineProps> = ({
  clusters,
  width = 700,
  height = 300,
}) => {
  const styles = useS2DChartStyles();
  const margin = { top: 40, bottom: 80, left: 120, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Sort clusters by estimated migration time
  const sortedClusters = useMemo(() => {
    return [...clusters].sort((a, b) => a.estimated_migration_time - b.estimated_migration_time);
  }, [clusters]);

  const xScale = scaleLinear({
    range: [0, xMax],
    domain: [0, Math.max(...clusters.map(c => c.estimated_migration_time)) * 1.1],
    nice: true,
  });

  const yScale = scaleBand({
    range: [0, yMax],
    domain: sortedClusters.map(c => c.cluster_name),
    padding: 0.2,
  });

  const compatibilityColors = {
    'Compatible': S2D_COLORS.ready,
    'Needs Review': S2D_COLORS.needsAudit,
    'Incompatible': S2D_COLORS.nonCompliant,
  };

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ClusterS2DAnalysis>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Estimated Migration Timeline</Title3>
        <Badge appearance="outline">Days per Cluster</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridColumns scale={xScale} height={yMax} stroke={tokens.colorNeutralStroke3} />
            
            {sortedClusters.map((cluster) => {
              const barWidth = xScale(cluster.estimated_migration_time) || 0;
              const barHeight = yScale.bandwidth();
              const barX = 0;
              const barY = yScale(cluster.cluster_name) || 0;
              
              return (
                <Bar
                  key={cluster.cluster_name}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={compatibilityColors[cluster.storage_compatibility]}
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
            
            {/* Add timeline labels */}
            {sortedClusters.map((cluster) => {
              const barY = (yScale(cluster.cluster_name) || 0) + yScale.bandwidth() / 2;
              const barEndX = xScale(cluster.estimated_migration_time) || 0;
              
              return (
                <Text
                  key={`label-${cluster.cluster_name}`}
                  x={barEndX + 8}
                  y={barY}
                  dy="0.35em"
                  fontSize={11}
                  fill={tokens.colorNeutralForeground2}
                  fontWeight="500"
                >
                  {cluster.estimated_migration_time} days
                </Text>
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
              label="Days"
            />
            <AxisLeft
              scale={yScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickLabelProps={{
                fill: tokens.colorNeutralForeground2,
                fontSize: 11,
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
              Migration Time: {tooltipData.estimated_migration_time} days
              <br />
              Readiness Score: {(tooltipData.readiness_score * 100).toFixed(0)}%
              <br />
              Storage Compatibility: {tooltipData.storage_compatibility}
              <br />
              Requirements Status: {tooltipData.requirements.filter(r => r.status === 'pass').length}/{tooltipData.requirements.length} passed
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// S2D COMPREHENSIVE DASHBOARD
// =============================================================================

interface S2DAnalysisDashboardProps {
  readinessData: S2DReadinessData;
  clusterAnalysis: ClusterS2DAnalysis[];
}

export const S2DAnalysisDashboard: React.FC<S2DAnalysisDashboardProps> = ({
  readinessData,
  clusterAnalysis,
}) => {
  const styles = useS2DChartStyles();

  return (
    <div>
      <div className={styles.chartHeader}>
        <Title3 style={{ color: tokens.colorBrandForeground1 }}>
          Storage Spaces Direct (S2D) Readiness Analysis
        </Title3>
        <Badge appearance="filled" color="brand">
          {clusterAnalysis.length} Clusters Analyzed
        </Badge>
      </div>

      <div className={styles.readinessGrid}>
        <ParentSize>
          {({ width }) => (
            <S2DReadinessOverviewChart 
              data={readinessData} 
              width={Math.min(width, 400)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <S2DRequirementsHeatmapChart 
              clusters={clusterAnalysis}
              width={Math.min(width, 600)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <MigrationTimelineChart 
              clusters={clusterAnalysis}
              width={Math.min(width, 700)}
            />
          )}
        </ParentSize>
      </div>
    </div>
  );
};

export default S2DAnalysisDashboard;