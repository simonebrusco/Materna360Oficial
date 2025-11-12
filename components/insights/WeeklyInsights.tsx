'use client';

import * as React from 'react';
import { SoftCard } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { isPremium } from '@/app/lib/plan';
import { track } from '@/app/lib/telemetry';
import { buildWeekLabels, getWeekStartKey, formatDateKey } from '@/app/lib/weekLabels';

type DayPoint = { label: string; mood: number; energy: number };
type Stats = {
  avgMood: number;
  avgEnergy: number;
  bestLabel: string;
  bestMood: number;
};

function computeStats(points: DayPoint[]): Stats {
  if (!points.length) return { avgMood: 0, avgEnergy: 0, bestLabel: '-', bestMood: 0 };
  const sumMood = points.reduce((a, p) => a + (p.mood || 0), 0);
  const sumEnergy = points.reduce((a, p) => a + (p.energy || 0), 0);
  const avgMood = Math.round((sumMood / points.length) * 10) / 10;
  const avgEnergy = Math.round((sumEnergy / points.length) * 10) / 10;
  const best = [...points].sort((a, b) => (b.mood) - (a.mood))[0];
  return { avgMood, avgEnergy, bestLabel: best?.label ?? '-', bestMood: best?.mood ?? 0 };
}

function Sparkline({ points }: { points: DayPoint[] }) {
  // normalize 0..100 to viewbox height
  const w = 120, h = 28, pad = 2;
  if (!points.length) return null;
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(points.length - 1, 1));
  const ys = points.map(p => pad + (h - 2 * pad) * (1 - Math.max(0, Math.min(100, p.mood)) / 100));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="text-primary">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function WeeklyInsights() {
  const [data, setData] = React.useState<DayPoint[] | null>(null);
  const [premium, setPremium] = React.useState(false);

  React.useEffect(() => {
    // SSR-safe access to localStorage/state
    try {
      setPremium(isPremium());
      
      // Get this week's labels
      const weekStartKey = getWeekStartKey(formatDateKey(new Date()));
      const result = buildWeekLabels(weekStartKey);
      const labels = result.labels;
      
      // Source of truth: try multiple keys to be resilient
      const raw = localStorage.getItem('m360:week:emotions') 
               || localStorage.getItem('m360.week.emotions')
               || localStorage.getItem('m360.emotions.week')
               || '[]';
      const arr = JSON.parse(raw) as Array<{ key?: string; mood?: number; energy?: number }>;
      
      // Map to points with labels fallback
      const points: DayPoint[] = labels.map((lab, idx) => {
        const item = arr[idx] || {};
        return { label: lab.chipLabel, mood: Math.round((item.mood ?? 0)), energy: Math.round((item.energy ?? 0)) };
      });
      
      setData(points);
      track('insights_view', { area: 'eu360', kind: 'weekly' });
    } catch (e) {
      console.error('[WeeklyInsights] Error loading data:', e);
      setData([]);
    }
  }, []);

  const points = data ?? [];
  const stats = computeStats(points);

  return (
    <section className="mt-4 sm:mt-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-support-1">Insights da Semana</h2>
        <p className="text-sm text-support-2 mt-1">Um resumo rápido do seu padrão emocional.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <SoftCard className="p-4 sm:p-5">
          <div className="flex flex-col justify-between h-full">
            <div>
              <h3 className="font-semibold text-support-1 text-sm">Seu padrão da semana</h3>
              <p className="text-xs text-support-2 mt-2">
                Humor médio: <strong className="text-support-1">{stats.avgMood}</strong> · Energia média: <strong className="text-support-1">{stats.avgEnergy}</strong>
              </p>
            </div>
            <div className="mt-3 -mx-4 -mb-4 flex items-end">
              <Sparkline points={points} />
            </div>
          </div>
        </SoftCard>

        <SoftCard className="p-4 sm:p-5">
          <div>
            <h3 className="font-semibold text-support-1 text-sm">Quando você está melhor</h3>
            <p className="text-xs text-support-2 mt-2">
              Melhor dia: <strong className="text-support-1">{stats.bestLabel}</strong>
            </p>
            <p className="text-xs text-support-2 mt-1">Dica: tente repetir hábitos desse dia.</p>
            <div className="mt-4">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  try {
                    track('insight_click', { area: 'eu360', which: 'best-day' });
                  } catch {}
                }}
                className="w-full"
              >
                Ver rotina desse dia
              </Button>
            </div>
          </div>
        </SoftCard>

        <SoftCard className="p-4 sm:p-5">
          <div>
            <h3 className="font-semibold text-support-1 text-sm">Sugestão do Coach</h3>
            {!premium ? (
              <>
                <p className="text-xs text-support-1 mt-2">Respiração curta 2× ao dia pode melhorar seus níveis de energia.</p>
                <p className="text-xs text-support-2 mt-2">Dicas completas no plano Premium.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-support-1 mt-2">
                  Nos dias {stats.bestLabel}, seu humor foi superior. Replique: 10min ao ar livre + hidratação + pausa sem telas após o almoço.
                </p>
                <p className="text-xs text-support-2 mt-2">Baseado no seu padrão semanal.</p>
              </>
            )}
          </div>
        </SoftCard>
      </div>
    </section>
  );
}
