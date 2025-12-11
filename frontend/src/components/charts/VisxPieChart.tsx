/**
 * VISX Pie Chart Component
 * 
 * A responsive pie/donut chart built with VISX, styled for the Archer design system.
 * Supports donut mode, labels, and interactive segments.
 */

import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { LegendOrdinal } from '@visx/legend';
import { Text } from '@visx/text';

export interface PieChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface VisxPieChartProps {
  data: PieChartDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  donut?: boolean;
  donutThickness?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showPercentages?: boolean;
  animated?: boolean;
  colorScheme?: string[];
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

const defaultColors = [
  'var(--primary, #8b5cf6)',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#6366f1',
  '#ec4899',
  '#84cc16',
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
const getValue = (d: PieChartDataPoint) => d.value;

export const VisxPieChart: React.FC<VisxPieChartProps> = ({
  data,
  width = 300,
  height = 300,
  margin = defaultMargin,
  donut = false,
  donutThickness = 50,
  showLabels = false,
  showLegend = true,
  showTooltip = true,
  showPercentages = true,
  colorScheme = defaultColors,
  centerLabel,
  centerValue,
  className,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip: showTooltipHandler,
    hideTooltip,
  } = useTooltip<PieChartDataPoint & { percentage: number }>();

  // Calculate total
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  // Dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const innerRadius = donut ? radius - donutThickness : 0;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;

  // Color scale
  const colorScale = useMemo(
    () => scaleOrdinal({
      domain: data.map(d => d.label),
      range: colorScheme,
    }),
    [data, colorScheme]
  );

  // Event handlers
  const handleMouseEnter = (
    event: React.MouseEvent<SVGPathElement>,
    datum: PieChartDataPoint,
    index: number
  ) => {
    if (!showTooltip) return;
    setActiveIndex(index);
    const coords = localPoint(event);
    const percentage = total > 0 ? (datum.value / total) * 100 : 0;
    showTooltipHandler({
      tooltipData: { ...datum, percentage },
      tooltipLeft: coords?.x ?? 0,
      tooltipTop: coords?.y ?? 0,
    });
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    hideTooltip();
  };

  if (width < 100 || height < 100) return null;

  return (
    <div className={className} style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Group left={margin.left + centerX} top={margin.top + centerY}>
          <Pie
            data={data}
            pieValue={getValue}
            outerRadius={radius}
            innerRadius={innerRadius}
            padAngle={0.02}
            cornerRadius={3}
          >
            {(pie) =>
              pie.arcs.map((arc, index) => {
                const [centroidX, centroidY] = pie.path.centroid(arc);
                const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.3;
                const arcPath = pie.path(arc) || '';
                const arcColor = arc.data.color || colorScale(arc.data.label);
                const isActive = activeIndex === index;
                const percentage = total > 0 ? (arc.data.value / total) * 100 : 0;

                return (
                  <g key={`arc-${arc.data.label}-${index}`}>
                    <path
                      d={arcPath}
                      fill={arcColor}
                      stroke="var(--card-bg, #1e1e2e)"
                      strokeWidth={2}
                      opacity={activeIndex !== null && !isActive ? 0.6 : 1}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease, transform 0.15s ease',
                        transform: isActive ? 'scale(1.03)' : 'scale(1)',
                        transformOrigin: 'center',
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, arc.data, index)}
                      onMouseLeave={handleMouseLeave}
                    />
                    
                    {/* Labels */}
                    {showLabels && hasSpaceForLabel && (
                      <Text
                        x={centroidX}
                        y={centroidY}
                        dy=".33em"
                        fill="white"
                        fontSize={11}
                        textAnchor="middle"
                        pointerEvents="none"
                        fontFamily="var(--lcm-font-family-body, Poppins, sans-serif)"
                        fontWeight={500}
                      >
                        {showPercentages ? `${percentage.toFixed(0)}%` : arc.data.label}
                      </Text>
                    )}
                  </g>
                );
              })
            }
          </Pie>

          {/* Center content for donut */}
          {donut && (centerLabel || centerValue) && (
            <g>
              {centerValue && (
                <Text
                  textAnchor="middle"
                  verticalAnchor="middle"
                  dy={centerLabel ? -8 : 0}
                  fill="var(--text-primary, #ffffff)"
                  fontSize={24}
                  fontWeight={700}
                  fontFamily="var(--lcm-font-family-heading, Poppins, sans-serif)"
                >
                  {centerValue}
                </Text>
              )}
              {centerLabel && (
                <Text
                  textAnchor="middle"
                  verticalAnchor="middle"
                  dy={centerValue ? 16 : 0}
                  fill="var(--text-secondary, #a1a1aa)"
                  fontSize={12}
                  fontFamily="var(--lcm-font-family-body, Poppins, sans-serif)"
                >
                  {centerLabel}
                </Text>
              )}
            </g>
          )}
        </Group>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center', 
          gap: '12px',
          marginTop: '16px',
          padding: '0 8px',
        }}>
          {data.map((d, i) => {
            const percentage = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <div 
                key={`legend-${d.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--lcm-font-family-body, Poppins, sans-serif)',
                  opacity: activeIndex !== null && activeIndex !== i ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: d.color || colorScale(d.label),
                }} />
                <span>{d.label}</span>
                {showPercentages && (
                  <span style={{ color: 'var(--text-tertiary)', marginLeft: '2px' }}>
                    ({percentage.toFixed(0)}%)
                  </span>
                )}
              </div>
            );
          })}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '4px' }}>
            <span style={{ color: 'var(--primary)' }}>
              {tooltipData.value.toLocaleString()}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {tooltipData.percentage.toFixed(1)}%
            </span>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default VisxPieChart;
