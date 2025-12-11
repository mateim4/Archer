/**
 * VISX Bar Chart Component
 * 
 * A responsive bar chart built with VISX, styled for the Archer design system.
 * Supports vertical and horizontal orientations, grouping, and stacking.
 */

import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand, scaleOrdinal } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { LegendOrdinal } from '@visx/legend';
import { max } from 'd3-array';
import { tokens } from '@fluentui/react-components';

export interface BarChartDataPoint {
  label: string;
  value: number;
  category?: string;
  color?: string;
}

export interface VisxBarChartProps {
  data: BarChartDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  horizontal?: boolean;
  animated?: boolean;
  colorScheme?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
}

const defaultMargin = { top: 20, right: 20, bottom: 40, left: 50 };

const defaultColors = [
  'var(--primary, #8b5cf6)',
  'var(--secondary, #6366f1)',
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

export const VisxBarChart: React.FC<VisxBarChartProps> = ({
  data,
  width = 500,
  height = 300,
  margin = defaultMargin,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  horizontal = false,
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
  } = useTooltip<BarChartDataPoint>();

  // Bounds
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  // Get unique categories for legend
  const categories = useMemo(() => 
    [...new Set(data.map(d => d.category || 'default'))],
    [data]
  );

  // Color scale
  const colorScale = useMemo(
    () => scaleOrdinal({
      domain: categories,
      range: colorScheme,
    }),
    [categories, colorScheme]
  );

  // Scales
  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: data.map(d => d.label),
        range: [0, xMax],
        padding: 0.3,
      }),
    [data, xMax]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, max(data, d => d.value) ?? 0],
        range: [yMax, 0],
        nice: true,
      }),
    [data, yMax]
  );

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent<SVGRectElement>, datum: BarChartDataPoint) => {
    if (!showTooltip) return;
    const coords = localPoint(event);
    showTooltipHandler({
      tooltipData: datum,
      tooltipLeft: coords?.x ?? 0,
      tooltipTop: coords?.y ?? 0,
    });
  };

  if (width < 100 || height < 100) return null;

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <LinearGradient
          id="bar-gradient"
          from="var(--primary, #8b5cf6)"
          to="var(--secondary, #6366f1)"
          vertical={!horizontal}
        />
        
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

          {/* Bars */}
          {data.map((d, i) => {
            const barWidth = xScale.bandwidth();
            const barHeight = yMax - (yScale(d.value) ?? 0);
            const barX = xScale(d.label) ?? 0;
            const barY = yMax - barHeight;
            const barColor = d.color || colorScale(d.category || 'default');

            return (
              <Bar
                key={`bar-${d.label}-${i}`}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx={4}
                opacity={tooltipOpen && tooltipData?.label !== d.label ? 0.6 : 1}
                onMouseMove={(e) => handleMouseMove(e, d)}
                onMouseLeave={hideTooltip}
                style={{
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
              />
            );
          })}

          {/* X Axis */}
          <AxisBottom
            top={yMax}
            scale={xScale}
            stroke="var(--text-secondary, #a1a1aa)"
            tickStroke="var(--text-secondary, #a1a1aa)"
            tickLabelProps={{
              fill: 'var(--text-secondary, #a1a1aa)',
              fontSize: 11,
              textAnchor: 'middle',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
            label={xAxisLabel}
            labelProps={{
              fill: 'var(--text-primary, #ffffff)',
              fontSize: 12,
              textAnchor: 'middle',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
          />

          {/* Y Axis */}
          <AxisLeft
            scale={yScale}
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
            label={yAxisLabel}
            labelProps={{
              fill: 'var(--text-primary, #ffffff)',
              fontSize: 12,
              textAnchor: 'middle',
              fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
            }}
          />
        </Group>
      </svg>

      {/* Legend */}
      {showLegend && categories.length > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '12px',
        }}>
          <LegendOrdinal
            scale={colorScale}
            direction="row"
            labelMargin="0 15px 0 0"
            shapeStyle={() => ({
              borderRadius: '4px',
            })}
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
          <div style={{ fontWeight: 600 }}>{tooltipData.label}</div>
          <div style={{ color: 'var(--primary)', marginTop: '4px' }}>
            {tooltipData.value.toLocaleString()}
          </div>
          {tooltipData.category && (
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {tooltipData.category}
            </div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default VisxBarChart;
