import React from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';

export interface ResourceData {
  name: string;
  total: number;
  used: number;
}

interface ResourceBarChartProps {
  data: ResourceData[];
  width: number;
  height: number;
  unit?: string;
}

const ResourceBarChart: React.FC<ResourceBarChartProps> = ({ data, width, height, unit = '' }) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  const xScale = scaleBand({
    domain: data.map(d => d.name),
    range: [0, innerWidth],
    padding: 0.3,
  });

  const maxValue = Math.max(...data.map(d => d.total), 1);
  const yScale = scaleLinear({
    domain: [0, maxValue],
    range: [innerHeight, 0],
    nice: true,
  });

  if (width < 10 || height < 10) return null;

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {data.map((d) => {
          const barWidth = xScale.bandwidth();
          const barX = xScale(d.name) ?? 0;
          const usedHeight = innerHeight - yScale(d.used);
          const totalHeight = innerHeight - yScale(d.total);
          
          return (
            <g key={d.name}>
              {/* Total capacity (background) */}
              <Bar
                x={barX}
                y={yScale(d.total)}
                width={barWidth}
                height={totalHeight}
                fill="rgba(139, 92, 246, 0.2)"
                rx={4}
              />
              {/* Used capacity (foreground) */}
              <Bar
                x={barX}
                y={yScale(d.used)}
                width={barWidth}
                height={usedHeight}
                fill="#8b5cf6"
                rx={4}
              />
            </g>
          );
        })}
        <AxisLeft
          scale={yScale}
          stroke="#6b7280"
          tickStroke="#6b7280"
          tickLabelProps={() => ({
            fill: '#9ca3af',
            fontSize: 10,
            textAnchor: 'end',
            dy: '0.33em',
          })}
        />
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          stroke="#6b7280"
          tickStroke="#6b7280"
          tickLabelProps={() => ({
            fill: '#9ca3af',
            fontSize: 10,
            textAnchor: 'middle',
          })}
        />
      </Group>
    </svg>
  );
};

export default ResourceBarChart;
