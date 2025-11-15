'use client';
import * as React from 'react';
import { SoftCard } from '@/components/ui/card';

export default function Chart({ series }: any) {
  const w = 360,
    h = 120,
    pad = 10;
  const max = Math.max(1, ...series.map((s: any) => s.count));

  const xs = (i: number) =>
    pad + (i * (w - 2 * pad)) / Math.max(series.length - 1, 1);
  const ys = (c: number) => pad + (h - 2 * pad) * (1 - c / max);

  const d = series
    .map((s: any, i: number) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(s.count).toFixed(1)}`)
    .join(' ');

  return (
    <SoftCard className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-gray-600">Events per day</h3>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Events per day chart"
        className="mt-3 text-gray-900"
      >
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="text-xs text-gray-500 mt-2">Period per filters above.</p>
    </SoftCard>
  );
}
