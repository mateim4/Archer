import React from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { animated, useTransition } from '@react-spring/web';

export interface PieData {
  label: string;
  value: number;
}

interface CapacityPieChartProps {
  data: PieData[];
  width: number;
  height: number;
}

const colors = ['#8b5cf6', '#374151'];

const CapacityPieChart: React.FC<CapacityPieChartProps> = ({ data, width, height }) => {
  const radius = Math.min(width, height) / 2 - 20;
  const centerX = width / 2;
  const centerY = height / 2;

  const colorScale = scaleOrdinal({
    domain: data.map(d => d.label),
    range: colors,
  });

  return (
    <svg width={width} height={height}>
      <Group top={centerY} left={centerX}>
        <Pie
          data={data}
          pieValue={(d) => d.value}
          outerRadius={radius}
          innerRadius={radius * 0.6}
        >
          {(pie) =>
            pie.arcs.map((arc, i) => (
              <g key={`arc-${i}`}>
                <path
                  d={pie.path(arc) || ''}
                  fill={colorScale(arc.data.label)}
                  stroke="rgba(139, 92, 246, 0.3)"
                  strokeWidth={1}
                />
                {arc.data.value > 0 && (
                  <text
                    x={pie.path.centroid(arc)[0]}
                    y={pie.path.centroid(arc)[1]}
                    textAnchor="middle"
                    fill="#e9d5ff"
                    fontSize={12}
                    fontWeight={500}
                  >
                    {arc.data.label}
                  </text>
                )}
              </g>
            ))
          }
        </Pie>
      </Group>
    </svg>
  );
};

export default CapacityPieChart;
