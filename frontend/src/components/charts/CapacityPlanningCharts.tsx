import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar, Line, LinePath, AreaClosed } from '@visx/shape';
import { scaleLinear, scaleBand, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Text } from '@visx/text';
import { ParentSize } from '@visx/responsive';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { curveMonotoneX } from '@visx/curve';
import {
  tokens,
  makeStyles,
  Title3,
  Title2,
  Caption1,
  Badge,
  Tooltip,
} from '@fluentui/react-components';

// =============================================================================
// CHART STYLES
// =============================================================================

const useCapacityChartStyles = makeStyles({
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
  },
  capacityCard: {
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    background: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  capacityMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
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

// Chart colors for capacity planning
const CAPACITY_COLORS = {
  current: '#8b5cf6',     // Purple for current usage
  projected: '#a78bfa',   // Light purple for projections
  capacity: '#10b981',    // Green for capacity
  warning: '#f59e0b',     // Orange for warnings
  critical: '#ef4444',    // Red for critical levels
  gradient: {
    start: '#8b5cf6',
    end: '#ddd6fe',
  },
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CapacityData {
  resource_type: 'cpu' | 'memory' | 'storage';
  current_usage: number;
  projected_usage: number;
  total_capacity: number;
  utilization_percentage: number;
  growth_rate_monthly: number;
  time_to_capacity: number; // months
}

export interface ResourceProjection {
  date: Date;
  cpu_usage: number;
  memory_usage: number;
  storage_usage: number;
  cpu_capacity: number;
  memory_capacity: number;
  storage_capacity: number;
}

export interface CostBreakdown {
  category: string;
  current_monthly: number;
  projected_monthly: number;
  one_time_cost: number;
  description: string;
}

export interface PerformanceMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  improvement_percentage: number;
  unit: string;
}

// =============================================================================
// RESOURCE UTILIZATION CHART
// =============================================================================

interface ResourceUtilizationProps {
  data: CapacityData[];
  width?: number;
  height?: number;
}

export const ResourceUtilizationChart: React.FC<ResourceUtilizationProps> = ({
  data,
  width = 500,
  height = 300,
}) => {
  const styles = useCapacityChartStyles();
  const margin = { top: 40, bottom: 60, left: 80, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    range: [0, xMax],
    domain: data.map(d => d.resource_type.toUpperCase()),
    padding: 0.3,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, 100], // Percentage scale
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<CapacityData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return CAPACITY_COLORS.critical;
    if (percentage >= 75) return CAPACITY_COLORS.warning;
    return CAPACITY_COLORS.current;
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Resource Utilization</Title3>
        <Badge appearance="outline">Current vs Projected</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            
            {data.map((d, i) => {
              const barWidth = xScale.bandwidth() / 2;
              const barX = (xScale(d.resource_type.toUpperCase()) || 0);
              
              // Current usage bar
              const currentHeight = yMax - (yScale(d.utilization_percentage) ?? 0);
              const currentY = yMax - currentHeight;
              
              // Projected usage bar
              const projectedPercentage = (d.projected_usage / d.total_capacity) * 100;
              const projectedHeight = yMax - (yScale(projectedPercentage) ?? 0);
              const projectedY = yMax - projectedHeight;
              
              return (
                <Group key={d.resource_type}>
                  {/* Current usage bar */}
                  <Bar
                    x={barX}
                    y={currentY}
                    width={barWidth}
                    height={currentHeight}
                    fill={getUtilizationColor(d.utilization_percentage)}
                    stroke={tokens.colorNeutralStroke2}
                    strokeWidth={1}
                    rx={3}
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
                  
                  {/* Projected usage bar */}
                  <Bar
                    x={barX + barWidth + 2}
                    y={projectedY}
                    width={barWidth}
                    height={projectedHeight}
                    fill={CAPACITY_COLORS.projected}
                    stroke={tokens.colorNeutralStroke2}
                    strokeWidth={1}
                    rx={3}
                    fillOpacity={0.7}
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
                  
                  {/* Labels */}
                  <Text
                    x={barX + barWidth / 2}
                    y={currentY - 5}
                    fontSize={10}
                    textAnchor="middle"
                    fill={tokens.colorNeutralForeground2}
                    fontWeight="500"
                  >
                    {d.utilization_percentage.toFixed(0)}%
                  </Text>
                  
                  <Text
                    x={barX + barWidth * 1.5 + 2}
                    y={projectedY - 5}
                    fontSize={10}
                    textAnchor="middle"
                    fill={tokens.colorNeutralForeground3}
                    fontWeight="500"
                  >
                    {projectedPercentage.toFixed(0)}%
                  </Text>
                </Group>
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
              tickFormat={(value) => `${value}%`}
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
              <strong>{tooltipData.resource_type.toUpperCase()} Utilization</strong>
              <br />
              Current: {tooltipData.utilization_percentage.toFixed(1)}%
              <br />
              Projected: {((tooltipData.projected_usage / tooltipData.total_capacity) * 100).toFixed(1)}%
              <br />
              Growth Rate: {tooltipData.growth_rate_monthly.toFixed(1)}%/month
              <br />
              Time to Capacity: {tooltipData.time_to_capacity} months
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CAPACITY PROJECTION TIMELINE
// =============================================================================

interface CapacityTimelineProps {
  projections: ResourceProjection[];
  width?: number;
  height?: number;
}

export const CapacityProjectionChart: React.FC<CapacityTimelineProps> = ({
  projections,
  width = 700,
  height = 400,
}) => {
  const styles = useCapacityChartStyles();
  const margin = { top: 40, bottom: 60, left: 80, right: 100 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleTime({
    range: [0, xMax],
    domain: [
      Math.min(...projections.map(d => d.date.getTime())),
      Math.max(...projections.map(d => d.date.getTime()))
    ] as [number, number],
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [
      0,
      Math.max(
        ...projections.map(d => Math.max(d.cpu_capacity, d.memory_capacity, d.storage_capacity))
      ) * 1.1
    ],
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<ResourceProjection>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Capacity Projection Timeline</Title3>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', background: CAPACITY_COLORS.current }} />
            <Caption1>CPU</Caption1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', background: CAPACITY_COLORS.warning }} />
            <Caption1>Memory</Caption1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', background: CAPACITY_COLORS.capacity }} />
            <Caption1>Storage</Caption1>
          </div>
        </div>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            <GridColumns scale={xScale} height={yMax} stroke={tokens.colorNeutralStroke3} />
            
            {/* CPU Usage Line */}
            <LinePath
              data={projections}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.cpu_usage) ?? 0}
              stroke={CAPACITY_COLORS.current}
              strokeWidth={3}
              curve={curveMonotoneX}
            />
            
            {/* Memory Usage Line */}
            <LinePath
              data={projections}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.memory_usage) ?? 0}
              stroke={CAPACITY_COLORS.warning}
              strokeWidth={3}
              curve={curveMonotoneX}
            />
            
            {/* Storage Usage Line */}
            <LinePath
              data={projections}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.storage_usage) ?? 0}
              stroke={CAPACITY_COLORS.capacity}
              strokeWidth={3}
              curve={curveMonotoneX}
            />
            
            {/* Capacity Lines (dashed) */}
            <LinePath
              data={projections}
              x={(d) => xScale(d.date) ?? 0}
              y={(d) => yScale(d.cpu_capacity) ?? 0}
              stroke={CAPACITY_COLORS.current}
              strokeWidth={2}
              strokeDasharray="5,5"
              opacity={0.7}
              curve={curveMonotoneX}
            />
            
            {/* Data points for interaction */}
            {projections.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.date)}
                cy={yScale(d.cpu_usage)}
                r={4}
                fill={CAPACITY_COLORS.current}
                stroke="white"
                strokeWidth={2}
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
            ))}
            
            <AxisBottom
              top={yMax}
              scale={xScale}
              stroke={tokens.colorNeutralForeground3}
              tickStroke={tokens.colorNeutralForeground3}
              tickFormat={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getFullYear()}`;
              }}
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
              <strong>{tooltipData.date.toLocaleDateString()}</strong>
              <br />
              CPU Usage: {tooltipData.cpu_usage.toFixed(0)} cores
              <br />
              Memory Usage: {(tooltipData.memory_usage / 1024).toFixed(0)} GB
              <br />
              Storage Usage: {(tooltipData.storage_usage / 1024).toFixed(0)} TB
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COST ANALYSIS CHART
// =============================================================================

interface CostAnalysisProps {
  costData: CostBreakdown[];
  width?: number;
  height?: number;
}

export const CostAnalysisChart: React.FC<CostAnalysisProps> = ({
  costData,
  width = 600,
  height = 400,
}) => {
  const styles = useCapacityChartStyles();
  const margin = { top: 40, bottom: 100, left: 100, right: 40 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    range: [0, xMax],
    domain: costData.map(d => d.category),
    padding: 0.2,
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...costData.map(d => Math.max(d.current_monthly, d.projected_monthly))) * 1.1],
    nice: true,
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<CostBreakdown>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal();

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <Title3 className={styles.chartTitle}>Cost Analysis</Title3>
        <Badge appearance="outline">Monthly Costs</Badge>
      </div>
      
      <div ref={containerRef}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke={tokens.colorNeutralStroke3} />
            
            {costData.map((d) => {
              const barWidth = xScale.bandwidth() / 2;
              const barX = xScale(d.category) || 0;
              
              // Current cost bar
              const currentHeight = yMax - (yScale(d.current_monthly) ?? 0);
              const currentY = yMax - currentHeight;
              
              // Projected cost bar
              const projectedHeight = yMax - (yScale(d.projected_monthly) ?? 0);
              const projectedY = yMax - projectedHeight;
              
              return (
                <Group key={d.category}>
                  {/* Current cost bar */}
                  <Bar
                    x={barX}
                    y={currentY}
                    width={barWidth}
                    height={currentHeight}
                    fill={CAPACITY_COLORS.current}
                    stroke={tokens.colorNeutralStroke2}
                    strokeWidth={1}
                    rx={3}
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
                  
                  {/* Projected cost bar */}
                  <Bar
                    x={barX + barWidth + 2}
                    y={projectedY}
                    width={barWidth}
                    height={projectedHeight}
                    fill={CAPACITY_COLORS.capacity}
                    stroke={tokens.colorNeutralStroke2}
                    strokeWidth={1}
                    rx={3}
                    fillOpacity={0.8}
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
                </Group>
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
              tickFormat={(value) => `$${(value / 1000).toFixed(0)}K`}
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
              Current Monthly: ${tooltipData.current_monthly.toLocaleString()}
              <br />
              Projected Monthly: ${tooltipData.projected_monthly.toLocaleString()}
              <br />
              One-time Cost: ${tooltipData.one_time_cost.toLocaleString()}
              <br />
              <em>{tooltipData.description}</em>
            </div>
          </TooltipInPortal>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPREHENSIVE CAPACITY PLANNING DASHBOARD
// =============================================================================

interface CapacityPlanningDashboardProps {
  utilizationData: CapacityData[];
  projections: ResourceProjection[];
  costAnalysis: CostBreakdown[];
  performanceMetrics: PerformanceMetric[];
}

export const CapacityPlanningDashboard: React.FC<CapacityPlanningDashboardProps> = ({
  utilizationData,
  projections,
  costAnalysis,
  performanceMetrics,
}) => {
  const styles = useCapacityChartStyles();

  return (
    <div>
      <div className={styles.chartHeader}>
        <Title2 style={{ color: tokens.colorBrandForeground1 }}>
          Capacity Planning & Performance Analysis
        </Title2>
        <Badge appearance="filled" color="success">
          12-Month Projection
        </Badge>
      </div>

      <div className={styles.metricsGrid}>
        <ParentSize>
          {({ width }) => (
            <ResourceUtilizationChart 
              data={utilizationData} 
              width={Math.min(width, 500)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <CapacityProjectionChart 
              projections={projections}
              width={Math.min(width, 700)}
            />
          )}
        </ParentSize>

        <ParentSize>
          {({ width }) => (
            <CostAnalysisChart 
              costData={costAnalysis}
              width={Math.min(width, 600)}
            />
          )}
        </ParentSize>

        {/* Performance Metrics Cards */}
        <div className={styles.capacityCard}>
          <Title3 style={{ color: tokens.colorBrandForeground1 }}>
            Performance Improvements
          </Title3>
          {performanceMetrics.map((metric, i) => (
            <div key={i} className={styles.capacityMetric}>
              <div>
                <Caption1 style={{ fontWeight: tokens.fontWeightSemibold }}>
                  {metric.metric_name}
                </Caption1>
                <br />
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  {metric.current_value} → {metric.target_value} {metric.unit}
                </Caption1>
              </div>
              <Badge 
                appearance="filled" 
                color={metric.improvement_percentage > 0 ? 'success' : 'danger'}
              >
                {metric.improvement_percentage > 0 ? '+' : ''}{metric.improvement_percentage.toFixed(0)}%
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CapacityPlanningDashboard;