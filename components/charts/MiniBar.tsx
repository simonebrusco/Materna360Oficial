'use client';

import * as React from 'react';

type Point = { x: number; y: number; v: number };

export default function MiniBar({
  values,
  width = 640,
  height = 160,
  pad = 16,
}: {
  values: number[];
  width?: number;
  height?: number;
  pad?: number;
}) {
  const max = Math.max(1, ...values);
  const barW = Math.max(1, (width - pad * 2) / Math.max(1, values.length));
  const points: Point[] = values.map((v, i) => {
    const x = pad + i * barW;
    const y = height - pad - (v / max) * (height - pad * 2);
    return { x, y, v };
  });

  return (
    <svg width={width} height={height} role="img" aria-label="Events per day">
      <rect x="0" y="0" width={width} height={height} fill="white" rx="12" ry="12" />
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map((g, idx) => (
        <line
          key={idx}
          x1={pad}
          y1={pad + g * (height - pad * 2)}
          x2={width - pad}
          y2={pad + g * (height - pad * 2)}
          stroke="#e9ecf2"
          strokeWidth="1"
        />
      ))}
      {/* bars */}
      {points.map((p, i) => (
        <rect
          key={i}
          x={p.x + 2}
          y={p.y}
          width={barW - 4}
          height={height - pad - p.y}
          fill="#ff005e"
          opacity="0.9"
        />
      ))}
    </svg>
  );
}
