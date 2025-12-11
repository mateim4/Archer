/**
 * VISX Area Chart Component
 * 
 * A responsive area chart built with VISX, styled for the Archer design system.
 * Ideal for time-series data with gradient fills.
 */

import React, { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { scaleLinear, scaleTime, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { LegendOrdinal } from '@visx/legend';
import { curveMonotoneX } from '@visx/curve';
import { max, extent, bisector } from 'd3-array';

export interface AreaChartDataPoint {
  timestamp: string | number | Date;
  value: number;
  series?: string;
}

export interface VisxAreaChartProps {
  data: AreaChartDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showLine?: boolean;
  showDots?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  colorScheme?: string[];
  gradientOpacity?: { from: number; to: number };
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
}

const defaultMargin = { top: 20, right: 20, bottom: 40, left: 50 };

const defaultColors = [
  'var(--primary, #8b5cf6)',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
];

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'var(--card-bg, rgba(30, 30, 46, 0.95))',
  color: 'var(--text-primary, #ffffff)',
  border: '1px solid var(--card-border, rgba(139, 92, 246, 0.3))',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
};

// Accessors
const getX = (d: AreaChartDataPoint) => new Date(d.timestamp);
const getY = (d: AreaChartDataPoint) => d.value;

export const VisxAreaChart: React.FC<VisxAreaChartProps> = ({
  data,
  width = 500,
  height = 300,
  margin = defaultMargin,
  showGrid = true,
  showLine = true,
  showDots = false,
  showLegend = false,
  showTooltip = true,
  stacked = false,
  colorScheme = defaultColors,
  gradientOpacity = { from: 0.5, to: 0.05 },
  xAxisLabel,
  yAxisLabel,
  className,
}) => {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip: showTooltipHandler,
    hideTooltip,
  } = useTooltip<AreaChartDataPoint>();

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Get unique series
  const seriesList = useMemo(() => 
    [...new Set(data.map(d => d.series || 'default'))],
    [data]
  );

  // Group data by series
  const groupedData = useMemo(() => {
    const groups: Record<string, AreaChartDataPoint[]> = {};
    seriesList.forEach(series => {
      groups[series] = data
        .filter(d => (d.series || 'default') === series)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    return groups;
  }, [data, seriesList]);

  // Color scale
  const colorScale = useMemo(
    () => scaleOrdinal({
      domain: seriesList,
      range: colorScheme,
    }),
    [seriesList, colorScheme]
  );

  // Scales
  const xScale = useMemo(
    () =>
      scaleTime<number>({
        domain: extent(data, getX) as [Date, Date],
        range: [0, xMax],
      }),
    [data, xMax]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, (max(data, getY) ?? 0) * 1.1],
        range: [yMax, 0],
        nice: true,
      }),
    [data, yMax]
  );

  // Tooltip handler
  const handleTooltip = useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      if (!showTooltip) return;
      
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x - margin.left);
      const bisectDate = bisector<AreaChartDataPoint, Date>((d) => new Date(d.timestamp)).left;
      
      // Find closest point
      let closestPoint: AreaChartDataPoint | null = null;
      let minDistance = Infinity;
      
      Object.values(groupedData).forEach(seriesData => {
        const index = bisectDate(seriesData, x0, 1);
        const d0 = seriesData[index - 1];
        const d1 = seriesData[index];
        
        [d0, d1].forEach(d => {
          if (d) {
            const distance = Math.abs(new Date(d.timestamp).getTime() - x0.getTime());
            if (distance < minDistance) {
              minDistance = distance;
              closestPoint = d;
            }
          }
        });
      });
      
      if (closestPoint) {
        showTooltipHandler({
          tooltipData: closestPoint,
          tooltipLeft: xScale(getX(closestPoint)) + margin.left,
          tooltipTop: yScale(getY(closestPoint)) + margin.top,
        });
      }
    },
    [showTooltip, xScale, yScale, margin, groupedData, showTooltipHandler]
  );

  if (width < 100 || height < 100) return null;

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        {/* Gradients */}
        {seriesList.map((series) => (
          <LinearGradient
            key={`gradient-${series}`}
            id={`area-gradient-${series}`}
            from={colorScale(series)}
            to={colorScale(series)}
            fromOpacity={gradientOpacity.from}
            toOpacity={gradientOpacity.to}
          />
        ))}
        
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          {showGrid && (
            <GridRows
              scale={yScale}
              width={xMax}
              stroke="var(--card-border, rgba(139, 92, 246, 0.15))"
              strokeDasharray="3,3"
            />
          )}

          {/* Areas */}
          {seriesList.map((series) => (
            <AreaClosed
              key={`area-${series}`}
              data={groupedData[series]}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              yScale={yScale}
              curve={curveMonotoneX}
              fill={`url(#area-gradient-${series})`}
            />
          ))}

          {/* Lines */}
          {showLine && seriesList.map((series) => (
            <LinePath
              key={`line-${series}`}
              data={groupedData[series]}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              stroke={colorScale(series)}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          ))}

          {/* Dots */}
          {showDots && seriesList.map((series) => 
            groupedData[series].map((d, i) => (
              <circle
                key={`dot-${series}-${i}`}
                cx={xScale(getX(d))}
                cy={yScale(getY(d))}
                r={4}
                fill={colorScale(series)}
                stroke="var(--card-bg, #1e1e2e)"
                strokeWidth={2}
              />
            ))
          )}

          {/* Invisible overlay for tooltip */}
          <Bar
            width={xMax}
            height={yMax}
            fill="transparent"
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
          />

          {/* Tooltip indicator */}
          {tooltipOpen && tooltipData && (
            <>
              <line
                x1={xScale(getX(tooltipData))}
                x2={xScale(getX(tooltipData))}
                y1={0}
                y2={yMax}
                stroke="var(--primary, #8b5cf6)"
                strokeWidth={1}
                strokeDasharray="4,4"
                pointerEvents="none"
              />
              <circle
                cx={xScale(getX(tooltipData))}
                cy={yScale(getY(tooltipData))}
                r={6}
                fill="var(--primary, #8b5cf6)"
                stroke="var(--card-bg, #1e1e2e)"
                strokeWidth={2}
                pointerEvents="none"
              />
            </>
          )}

          {/* X Axis */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            numTicks={5}
            stroke="var(--text-secondary, #a1a1aa)"
            tickStroke="var(--text-secondary, #a1a1aa)"
            tickLabelProps={{
              fill: 'var(--text-secondary, #a1a1aa)',
              fontSize: 11,
              textAnchor: 'middle',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
            tickFormat={(value) => {
              const date = value as Date;
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />

          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke="var(--text-secondary, #a1a1aa)"
            tickStroke="var(--text-secondary, #a1a1aa)"
            tickLabelProps={{
              fill: 'var(--text-secondary, #a1a1aa)',
              fontSize: 11,
              textAnchor: 'end',
              dy: '0.33em',
              dx: -4,
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
          />
        </Group>
      </svg>

      {/* Legend */}
      {showLegend && seriesList.length > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '12px',
        }}>
          <LegendOrdinal
            scale={colorScale}
            direction="row"
            labelMargin="0 15px 0 0"
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div style={{ fontWeight: 600 }}>
            {new Date(tooltipData.timestamp).toLocaleString()}
          </div>
          <div style={{ color: 'var(--primary)', marginTop: '4px' }}>
            {tooltipData.value.toLocaleString()}
          </div>
          {tooltipData.series && tooltipData.series !== 'default' && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {tooltipData.series}
            </div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default VisxAreaChart;
