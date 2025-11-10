'use client';

import * as React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export type EmotionPoint = { date: string; mood: number; energy: number };

export function EmotionTrendChart({
  data,
  range = '7d', // "7d" | "28d"
}: {
  data: EmotionPoint[];
  range?: '7d' | '28d';
}) {
  // Slice by range
  const sliced = React.useMemo(() => {
    const n = range === '28d' ? 28 : 7;
    return data.slice(-n);
  }, [data, range]);

  return (
    <div className="w-full h-[240px] md:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sliced} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis dataKey="date" tickMargin={8} tick={{ fontSize: 12 }} />
          <YAxis domain={[1, 5]} tickCount={5} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#ff005e"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Humor"
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#2f3a56"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Energia"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EmotionTrendChart;
