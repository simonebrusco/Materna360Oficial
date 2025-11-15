'use client';

import * as React from 'react';

export type EmotionPoint = { date: string; mood: number; energy: number };

export function EmotionTrendChart({
  data,
  range = '7d',
}: {
  data: EmotionPoint[];
  range?: '7d' | '28d';
}) {
  // Slice by range
  const sliced = React.useMemo(() => {
    const n = range === '28d' ? 28 : 7;
    return data.slice(-n);
  }, [data, range]);

  if (sliced.length === 0) {
    return (
      <div className="w-full h-[240px] md:h-[280px] flex items-center justify-center text-support-2">
        <p className="text-sm">Nenhum dado de humor registrado ainda.</p>
      </div>
    );
  }

  // SVG dimensions
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale data to fit chart
  const pointSpacing = chartWidth / Math.max(sliced.length - 1, 1);
  const yScale = (value: number) => {
    // Values 1-5 map to chartHeight-0 (inverted for SVG)
    return chartHeight - ((value - 1) / 4) * chartHeight;
  };

  // Generate path for line chart
  const generatePath = (key: 'mood' | 'energy') => {
    return sliced
      .map((point, i) => {
        const x = padding.left + i * pointSpacing;
        const y = padding.top + yScale(point[key]);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const moodPath = generatePath('mood');
  const energyPath = generatePath('energy');

  // Y-axis labels
  const yLabels = [5, 4, 3, 2, 1].map((val) => ({
    value: val,
    y: padding.top + yScale(val),
  }));

  // X-axis labels (sample every 3-7 points depending on range)
  const labelInterval = sliced.length > 14 ? 7 : sliced.length > 7 ? 3 : 1;
  const xLabels = sliced
    .map((point, i) => ({
      label: point.date.slice(5), // MM-DD
      x: padding.left + i * pointSpacing,
      visible: i % labelInterval === 0,
    }))
    .filter((l) => l.visible);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" className="min-w-[500px]">
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke="rgba(0,0,0,0.08)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label) => (
          <text
            key={`y-label-${label.value}`}
            x={padding.left - 10}
            y={label.y + 4}
            textAnchor="end"
            fontSize="12"
            fill="#545454"
            className="font-medium"
          >
            {label.value}
          </text>
        ))}

        {/* X-axis line */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <g key={`x-label-${i}`}>
            <text
              x={label.x}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fontSize="12"
              fill="#545454"
              className="font-medium"
            >
              {label.label}
            </text>
          </g>
        ))}

        {/* Mood line (primary - #ff005e) */}
        <path d={moodPath} stroke="#ff005e" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Energy line (secondary - #2f3a56) */}
        <path d={energyPath} stroke="#2f3a56" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Legend */}
        <g transform={`translate(${padding.left}, 8)`}>
          <circle cx="0" cy="0" r="3" fill="#ff005e" />
          <text x="10" y="4" fontSize="12" fill="#545454" className="font-medium">
            Humor
          </text>

          <circle cx="100" cy="0" r="3" fill="#2f3a56" />
          <text x="110" y="4" fontSize="12" fill="#545454" className="font-medium">
            Energia
          </text>
        </g>
      </svg>
    </div>
  );
}

export function EmotionTrendMini({ data }: { data: EmotionPoint[] }) {
  // Compact sparkline-style wrapper for print export (fixed height, no scrolling)
  return (
    <div className="w-full h-[140px]">
      <EmotionTrendChart data={data} range="28d" />
    </div>
  );
}

export default EmotionTrendChart;
