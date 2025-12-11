/**
 * VISX Line Chart Component
 * 
 * A responsive line chart built with VISX, styled for the Archer design system.
 * Supports multiple series, area fills, and smooth curves.
 */

import React, { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { LinePath, AreaClosed } from '@visx/shape';
import { scaleLinear, scaleTime, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { LegendOrdinal } from '@visx/legend';
import { curveMonotoneX, curveLinear, curveCardinal } from '@visx/curve';
import { max, min, extent, bisector } from 'd3-array';

export interface LineChartDataPoint {
  timestamp: string | number | Date;
  value: number;
  series?: string;
}

export interface VisxLineChartProps {
  data: LineChartDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showArea?: boolean;
  showDots?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curveType?: 'monotone' | 'linear' | 'cardinal';
  colorScheme?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
}

const defaultMargin = { top: 20, right: 20, bottom: 40, left: 50 };

// Purple Glass themed color palette for charts
const defaultColors = [
  '#8b5cf6',  // Purple 500 - Primary
  '#a78bfa',  // Purple 400
  '#6366f1',  // Indigo 500
  '#06b6d4',  // Cyan 500 - Accent
  '#14b8a6',  // Teal 500
  '#818cf8',  // Indigo 400
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

const getCurve = (type: string) => {
  switch (type) {
    case 'linear': return curveLinear;
    case 'cardinal': return curveCardinal;
    default: return curveMonotoneX;
  }
};

// Accessors
const getX = (d: LineChartDataPoint) => new Date(d.timestamp);
const getY = (d: LineChartDataPoint) => d.value;

export const VisxLineChart: React.FC<VisxLineChartProps> = ({
  data,
  width = 500,
  height = 300,
  margin = defaultMargin,
  showGrid = true,
  showArea = false,
  showDots = true,
  showLegend = false,
  showTooltip = true,
  curveType = 'monotone',
  colorScheme = defaultColors,
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
  } = useTooltip<LineChartDataPoint>();

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
    const groups: Record<string, LineChartDataPoint[]> = {};
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
      const bisectDate = bisector<LineChartDataPoint, Date>((d) => new Date(d.timestamp)).left;
      
      // Find closest point
      let closestPoint: LineChartDataPoint | null = null;
      let minDistance = Infinity;
      
      Object.values(groupedData).forEach(seriesData => {
        const index = bisectDate(seriesData, x0, 1);
        const d0 = seriesData[index - 1];
        const d1 = seriesData[index];
        
        if (d0) {
          const distance = Math.abs(new Date(d0.timestamp).getTime() - x0.getTime());
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = d0;
          }
        }
        if (d1) {
          const distance = Math.abs(new Date(d1.timestamp).getTime() - x0.getTime());
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = d1;
          }
        }
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

  const curve = getCurve(curveType);

  if (width < 100 || height < 100) return null;

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        {/* Gradients for area fills */}
        {seriesList.map((series, i) => (
          <LinearGradient
            key={`gradient-${series}`}
            id={`area-gradient-${series}`}
            from={colorScale(series)}
            to={colorScale(series)}
            fromOpacity={0.4}
            toOpacity={0.05}
          />
        ))}
        
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          {showGrid && (
            <>
              <GridRows
                scale={yScale}
                width={xMax}
                stroke="var(--card-border, rgba(139, 92, 246, 0.15))"
                strokeDasharray="3,3"
              />
              <GridColumns
                scale={xScale}
                height={yMax}
                stroke="var(--card-border, rgba(139, 92, 246, 0.1))"
                strokeDasharray="3,3"
              />
            </>
          )}

          {/* Areas (if enabled) */}
          {showArea && seriesList.map((series) => (
            <AreaClosed
              key={`area-${series}`}
              data={groupedData[series]}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              yScale={yScale}
              curve={curve}
              fill={`url(#area-gradient-${series})`}
            />
          ))}

          {/* Lines */}
          {seriesList.map((series) => (
            <LinePath
              key={`line-${series}`}
              data={groupedData[series]}
              x={(d) => xScale(getX(d)) ?? 0}
              y={(d) => yScale(getY(d)) ?? 0}
              stroke={colorScale(series)}
              strokeWidth={2}
              curve={curve}
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
                style={{ cursor: 'pointer' }}
              />
            ))
          )}

          {/* Invisible overlay for tooltip */}
          <rect
            width={xMax}
            height={yMax}
            fill="transparent"
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
          />

          {/* Tooltip indicator line */}
          {tooltipOpen && tooltipData && (
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
          {tooltipData.series && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {tooltipData.series}
            </div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default VisxLineChart;
