import React, { useMemo } from 'react';

type Segment = {
  start: string; // ISO date
  end?: string | null; // ISO date or null for open-ended
  color?: string; // CSS color
  label?: string;
};

export type TimelineTrack = {
  id: string;
  label: string;
  segments: Segment[];
};

interface TimelineMiniProps {
  tracks: TimelineTrack[];
  height?: number; // total height in px
  rowHeight?: number; // per-track row height
  rowGap?: number;
  padding?: number;
}

// Lightweight timeline renderer using SVG. No external dependencies.
export const TimelineMini: React.FC<TimelineMiniProps> = ({
  tracks,
  height = 220,
  rowHeight = 24,
  rowGap = 8,
  padding = 12,
}) => {
  const nowIso = useMemo(() => new Date().toISOString(), []);

  const { minTime, maxTime } = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const t of tracks) {
      for (const s of t.segments) {
        const st = Date.parse(s.start);
        const en = s.end ? Date.parse(s.end) : Date.now() + 7 * 24 * 3600 * 1000; // open-ended -> +7d
        if (!isNaN(st)) min = Math.min(min, st);
        if (!isNaN(en)) max = Math.max(max, en);
      }
    }
    if (!isFinite(min) || !isFinite(max) || min === max) {
      const now = Date.now();
      return { minTime: now - 24 * 3600 * 1000, maxTime: now + 24 * 3600 * 1000 };
    }
    return { minTime: min, maxTime: max };
  }, [tracks]);

  const width = 900; // fixed for simplicity; parent can wrap in overflow container
  const scale = (time: number) => {
    if (maxTime === minTime) return padding;
    const frac = (time - minTime) / (maxTime - minTime);
    return padding + frac * (width - padding * 2);
  };

  const rowsY = (idx: number) => padding + idx * (rowHeight + rowGap);

  const axisY = padding / 2;
  const axisTicks = 5;
  const tickTimes = Array.from({ length: axisTicks + 1 }, (_, i) => minTime + (i * (maxTime - minTime)) / axisTicks);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width={width} height={height} style={{ display: 'block', maxWidth: '100%' }}>
        {/* Axis */}
        <line x1={padding} x2={width - padding} y1={axisY} y2={axisY} stroke="#CBD5E1" strokeWidth={1} />
        {tickTimes.map((t, i) => (
          <g key={`tick-${i}`}>
            <line x1={scale(t)} x2={scale(t)} y1={axisY - 3} y2={axisY + 3} stroke="#94A3B8" />
            <text x={scale(t)} y={axisY - 6} textAnchor="middle" fontSize={10} style={{ fill: 'var(--text-secondary)' }}>
              {new Date(t).toLocaleDateString()}
            </text>
          </g>
        ))}

        {/* Tracks */}
        {tracks.map((track, idx) => {
          const y = rowsY(idx);
          return (
            <g key={track.id} transform={`translate(0, ${y})`}>
              <text x={padding} y={-4} fontSize={12} style={{ fill: 'var(--text-primary)' }}>
                {track.label}
              </text>
              {/* Row bg */}
              <rect x={padding} y={0} width={width - padding * 2} height={rowHeight} fill="#F8FAFC" stroke="#E2E8F0" />
              {track.segments.map((s, si) => {
                const x1 = scale(Date.parse(s.start));
                const x2 = scale(s.end ? Date.parse(s.end) : Date.now() + 7 * 24 * 3600 * 1000);
                const barW = Math.max(4, x2 - x1);
                const color = s.color || '#6366F1';
                return (
                  <g key={`${track.id}-seg-${si}`}>
                    <rect
                      x={x1}
                      y={2}
                      width={barW}
                      height={rowHeight - 4}
                      rx={4}
                      fill={color}
                      opacity={0.85}
                    />
                    {s.label && (
                      <text x={x1 + 6} y={rowHeight / 2 + 3} fontSize={11} fill="#FFFFFF">
                        {s.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Now marker */}
        <line x1={scale(Date.parse(nowIso))} x2={scale(Date.parse(nowIso))} y1={axisY} y2={height - padding / 2} stroke="#EF4444" strokeDasharray="4 3" />
      </svg>
    </div>
  );
};

export default TimelineMini;
