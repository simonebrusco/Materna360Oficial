'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import AppIcon from '@/components/ui/AppIcon'
import Link from 'next/link'
import { ClientOnly } from '@/components/common/ClientOnly'

type Entry = { date: string; mood: number; energy: number }
type Props = { storageKey?: string }

type WeeklyInsightPattern =
  | 'no_data'
  | 'limited_data'
  | 'high_wellbeing'
  | 'stable'
  | 'low_mood'
  | 'low_energy'
  | 'trend_improving'
  | 'trend_declining'

interface WeeklyInsightResult {
  pattern: WeeklyInsightPattern
  title: string
  summary: string
  tags: string[]
}

/**
 * Compute weekly emotional insight based on last 7 days of mood/energy data
 * Uses simple heuristics: averages, trends, and day counts
 */
function buildWeeklyEmotionalInsight(entries: Entry[]): WeeklyInsightResult {
  if (entries.length === 0) {
    return {
      pattern: 'no_data',
      title: 'Sem registros esta semana',
      summary: 'Ainda não temos dados suficientes desta semana. Que tal registrar como foi seu dia hoje?',
      tags: [],
    }
  }

  const last7 = [...entries]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7)

  if (last7.length <= 2) {
    return {
      pattern: 'limited_data',
      title: 'Dados limitados',
      summary: 'Dados limitados, mas já dá para perceber alguns sinais. Continue registrando para uma análise mais precisa.',
      tags: ['poucos registros'],
    }
  }

  const avgMood = last7.reduce((s, e) => s + e.mood, 0) / last7.length
  const avgEnergy = last7.reduce((s, e) => s + e.energy, 0) / last7.length

  // Compute trend: compare first 3 vs last 3 days
  const firstThird = last7.slice(0, 3).reduce((s, e) => s + (e.mood + e.energy) / 2, 0) / 3
  const lastThird = last7.slice(-3).reduce((s, e) => s + (e.mood + e.energy) / 2, 0) / 3
  const trendDelta = lastThird - firstThird

  const moodRounded = Math.round(avgMood * 10) / 10
  const energyRounded = Math.round(avgEnergy * 10) / 10

  // Pattern detection logic
  let pattern: WeeklyInsightPattern
  let title: string
  let summary: string
  let tags: string[]

  if (moodRounded >= 2.7 && energyRounded >= 2.7) {
    pattern = 'high_wellbeing'
    title = 'Bem-estar em alta'
    summary =
      'Você manteve um alto nível de bem-estar esta semana. Ótimo ritmo! Continue com essas práticas que estão gerando resultado. Aproveite para registrar o que funcionou bem para repetir nos próximos dias.'
    tags = ['bom humor', 'energia alta', 'semana positiva']
  } else if (moodRounded >= 2.2 && energyRounded >= 2.2 && Math.abs(trendDelta) < 0.3) {
    pattern = 'stable'
    title = 'Semana equilibrada'
    summary =
      'Semana estável, com humor e energia bem equilibrados. Isso mostra consistência nos seus registros de bem-estar. Que tal um pequeno momento de autocuidado extra para potencializar essa energia?'
    tags = ['equilibrio', 'consistência']
  } else if (trendDelta > 0.4) {
    pattern = 'trend_improving'
    title = 'Tendência de melhora'
    summary =
      'Ótimo! Os últimos dias mostram uma tendência de melhora em relação ao início da semana. Continua assim! Identifique o que está ajudando a melhorar e busque repetir essas práticas.'
    tags = ['melhora', 'esperança', 'em ascensão']
  } else if (trendDelta < -0.4) {
    pattern = 'trend_declining'
    title = 'Semana com oscilações'
    summary =
      'Notamos uma oscilação nos seus registros de bem-estar durante a semana. Semanas assim são normais, mas pode ser um bom momento para pausar e refletir sobre o que está drenando sua energia. Que tal fazer algo que recarregue?'
    tags = ['oscilação', 'auto-cuidado necessário']
  } else if (moodRounded < 2 && energyRounded >= 2) {
    pattern = 'low_mood'
    title = 'Humor baixo, mas com energia'
    summary =
      'Seu humor está um pouco baixo esta semana, mas a energia está presente. Experimente uma atividade leve e acolhedora que possa levantar o astral. Às vezes, uma mudança de ambiente ou conversa ajuda.'
    tags = ['cansaço emocional', 'precisa de leveza']
  } else if (moodRounded >= 2 && energyRounded < 2) {
    pattern = 'low_energy'
    title = 'Bom humor, mas energia baixa'
    summary =
      'Você está com bom humor, mas a energia está em baixa. Priorize descanso e hidratação. Pequenos momentos de pausa durante o dia podem fazer toda diferença. Seja gentil com você mesma.'
    tags = ['cansaço', 'repouso necessário']
  } else {
    pattern = 'low_mood'
    title = 'Semana exigente'
    summary =
      'Parece que foi uma semana exigente em vários fronts. Isso é absolutamente normal e esperado. Seja gentil com você — um passo de cada vez. Considere aumentar seus momentos de autocuidado e descanso esta semana.'
    tags = ['semana intensa', 'autocuidado']
  }

  return { pattern, title, summary, tags }
}

export function WeeklyEmotionalSummary({ storageKey = 'meu-dia:mood' }: Props) {
  const [entries, setEntries] = React.useState<Entry[] | null>(null)
  const [insight, setInsight] = React.useState<WeeklyInsightResult | null>(null)

  // Load from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const data = JSON.parse(raw)
        setEntries(data)
        const computed = buildWeeklyEmotionalInsight(data)
        setInsight(computed)
      } else {
        setEntries([])
        setInsight(buildWeeklyEmotionalInsight([]))
      }
    } catch {
      setEntries([])
      setInsight(buildWeeklyEmotionalInsight([]))
    }
  }, [storageKey])

  // Fire telemetry on mount
  React.useEffect(() => {
    if (insight) {
      track('eu360_weekly_insight_view', {
        tab: 'eu360',
        pattern: insight.pattern,
        entries_count: entries?.length ?? 0,
      })
    }
  }, [insight, entries])

  const handleCtaClick = (ctaType: 'checkin' | 'diary' | 'meu_dia') => {
    track('eu360_weekly_insight_cta_click', {
      tab: 'eu360',
      cta_type: ctaType,
      pattern: insight?.pattern,
    })
  }

  // Skeleton state while loading
  if (entries === null || !insight) {
    return (
      <ClientOnly>
        <div
          className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5"
        >
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
            <div className="h-4 w-4 rounded bg-black/5" />
          </div>
          <div className="h-5 w-48 rounded-lg bg-black/5" />
        </div>
        <div className="h-4 w-full rounded-lg bg-black/5 mb-2" />
        <div className="h-4 w-5/6 rounded-lg bg-black/5" />
        </div>
      </ClientOnly>
    )
  }

  const isEmpty = entries.length === 0

  return (
    <ClientOnly>
      <div
        className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5"
      >
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <AppIcon name="heart" size={16} variant="brand" decorative />
        </div>
        <h3 className="text-[16px] font-semibold text-[#2f3a56]">Resumo Emocional da Semana</h3>
      </div>

      {isEmpty ? (
        <div className="space-y-4">
          <p className="text-[14px] text-[#545454] leading-relaxed">{insight.summary}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/meu-dia"
              onClick={() => handleCtaClick('meu_dia')}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#ff005e] text-white text-xs font-semibold hover:bg-[#ff0050] transition-colors"
            >
              <AppIcon name="log-in" size={14} decorative />
              Ir para Meu Dia
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <h4 className="text-[14px] font-semibold text-[#2f3a56] mb-2">{insight.title}</h4>
            <p className="text-[13px] text-[#545454] leading-relaxed">{insight.summary}</p>
          </div>

          {insight.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ffd8e6]/40 text-[#ff005e] text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {entries.length > 0 && (
            <div className="pt-2 border-t border-[#f0f0f0]">
              <p className="text-[12px] text-[#545454] mb-2">
                Registros: {entries.length} dias · Humor médio: {(entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1)}/3 ·
                Energia média: {(entries.reduce((s, e) => s + e.energy, 0) / entries.length).toFixed(1)}/3
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Link
              href="/meu-dia"
              onClick={() => handleCtaClick('meu_dia')}
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#ff005e]/10 text-[#ff005e] text-xs font-semibold hover:bg-[#ff005e]/20 transition-colors"
            >
              <AppIcon name="plus" size={14} decorative />
              Registrar hoje
            </Link>
          </div>
        </div>
      )}
      </div>
    </ClientOnly>
  )
}
