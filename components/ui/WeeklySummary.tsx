'use client';

import React from 'react';
import AppIcon from './AppIcon';
import { Card } from './card';
import { Skeleton } from './Skeleton';
import { Empty } from './Empty';

interface WeeklySummaryData {
  humor: { daysLogged: number; totalDays: number; data: number[] };
  checklist: { completed: number; total: number; data: number[] };
  planner: { completed: number; total: number; data: number[] };
  achievements: { unlocked: number; total: number; data: number[] };
}

interface WeeklySummaryProps {
  data?: WeeklySummaryData;
  isLoading?: boolean;
  onViewDetails?: () => void;
}

/**
 * Simple inline SVG sparkline for a single tile.
 * Renders 7 data points as a small line chart.
 */
function SparklineChart({ data }: { data: number[] }) {
  const width = 100;
  const height = 30;
  const padding = 4;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Normalize data to 0-1 range
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  // Create path
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * innerWidth + padding;
    const normalized = (val - min) / range;
    const y = height - normalized * innerHeight - padding;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(' L')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
      aria-hidden
    >
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        className="text-primary"
      />
      <circle cx={padding} cy={height - padding} r="1.5" fill="currentColor" className="text-primary" />
      <circle cx={width - padding} cy={height - ((data[data.length - 1] - min) / range) * innerHeight - padding} r="1.5" fill="currentColor" className="text-primary" />
    </svg>
  );
}

/**
 * Demo data generator for when live data is unavailable.
 */
function generateDemoData(): WeeklySummaryData {
  return {
    humor: {
      daysLogged: 5,
      totalDays: 7,
      data: [40, 60, 50, 70, 80, 65, 75],
    },
    checklist: {
      completed: 18,
      total: 24,
      data: [2, 3, 2, 4, 3, 2, 2],
    },
    planner: {
      completed: 6,
      total: 7,
      data: [1, 1, 1, 1, 1, 1, 0],
    },
    achievements: {
      unlocked: 3,
      total: 12,
      data: [0, 1, 0, 0, 1, 0, 1],
    },
  };
}

export function WeeklySummary({
  data,
  isLoading = false,
  onViewDetails,
}: WeeklySummaryProps) {
  const displayData = data || generateDemoData();
  const showEmpty = !isLoading && !data;

  if (showEmpty) {
    return (
      <Empty
        icon="heart"
        title="Comece sua semana"
        subtitle="Registre humor, atividades e conquistas para ver seu progresso."
        actionLabel="Começar agora"
        onAction={onViewDetails}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((idx) => (
          <Skeleton key={idx} variant="card" />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      id: 'humor',
      title: 'Humor',
      icon: 'heart' as const,
      stat: `${displayData.humor.daysLogged}/${displayData.humor.totalDays}`,
      data: displayData.humor.data,
    },
    {
      id: 'checklist',
      title: 'Checklist',
      icon: 'star' as const,
      stat: `${displayData.checklist.completed}/${displayData.checklist.total}`,
      data: displayData.checklist.data,
    },
    {
      id: 'planner',
      title: 'Planner',
      icon: 'place' as const,
      stat: `${displayData.planner.completed}/${displayData.planner.total}`,
      data: displayData.planner.data,
    },
    {
      id: 'achievements',
      title: 'Conquistas',
      icon: 'crown' as const,
      stat: `${displayData.achievements.unlocked}/${displayData.achievements.total}`,
      data: displayData.achievements.data,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {tiles.map((tile) => (
          <Card
            key={tile.id}
            className="rounded-xl bg-white border border-white/60 shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-3 md:p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-support-1">{tile.title}</h4>
              <AppIcon name={tile.icon} size={18} className="text-primary" />
            </div>

            {/* Stat */}
            <p className="text-lg font-bold text-primary mb-2">{tile.stat}</p>

            {/* Sparkline */}
            <SparklineChart data={tile.data} />
          </Card>
        ))}
      </div>

      {/* Positive Reinforcement Copy */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 md:p-4">
        <p className="text-sm text-support-1 font-medium">
          ✨ Você manteve {displayData.humor.daysLogged} dias de humor registrado — ótimo!
        </p>
        <p className="text-xs text-support-2 mt-1">
          Continue assim para desbloquear novas conquistas e insights sobre sua semana.
        </p>
      </div>

      {/* Optional View Details CTA */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2"
        >
          Ver detalhes completos →
        </button>
      )}
    </div>
  );
}
