'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { ActivitySquare } from 'lucide-react'

type Entry = { date: string; mood: number; energy: number }
type Props = { storageKey?: string }

function computeInsight(avgMood: number, avgEnergy: number): string {
  const m = Math.round(avgMood * 10) / 10
  const e = Math.round(avgEnergy * 10) / 10
  if (m >= 2.5 && e >= 2.5) return 'Você manteve um alto nível de bem-estar. Ótimo ritmo! 💪'
  if (m >= 2 && e >= 2) return 'Semana estável. Que tal um pequeno momento de autocuidado extra?'
  if (m < 2 && e >= 2) return 'Humor baixo, energia ok. Experimente uma atividade leve e acolhedora.'
  if (m >= 2 && e < 2) return 'Bom humor, energia baixa. Priorize descanso e hidratação.'
  return 'Semana exigente. Seja gentil com você — um passo de cada vez.'
}

export function WeeklyEmotionalSummary({ storageKey = 'meu-dia:mood' }: Props) {
  const [entries, setEntries] = React.useState<Entry[] | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setEntries(JSON.parse(raw))
      else setEntries([])
    } catch {
      setEntries([])
    }
  }, [storageKey])

  if (entries === null) {
    // skeleton
    return (
      <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
        <div className="h-5 w-40 rounded-lg bg-black/5 mb-2" />
        <div className="h-4 w-64 rounded-lg bg-black/5" />
      </div>
    )
  }

  const last7 = [...entries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7)

  const avgMood = last7.length ? last7.reduce((s, e) => s + e.mood, 0) / last7.length : 0
  const avgEnergy = last7.length ? last7.reduce((s, e) => s + e.energy, 0) / last7.length : 0
  const insight = computeInsight(avgMood, avgEnergy)

  React.useEffect(() => {
    track('eu360.summary_view', { tab: 'eu360', range: 'week' })
  }, [])

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <ActivitySquare className="h-4 w-4 text-[#ff005e]" aria-hidden />
        </div>
        <h3 className="text-[16px] font-semibold">Resumo Emocional da Semana</h3>
      </div>
      <p className="text-[12px] text-[#545454] mb-2">
        Humor médio: {avgMood.toFixed(1)} • Energia média: {avgEnergy.toFixed(1)}
      </p>
      <p className="text-[14px] text-[#2f3a56]">{insight}</p>
    </div>
  )
}
