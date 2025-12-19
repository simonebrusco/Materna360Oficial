'use client'

import * as React from 'react'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { track } from '@/app/lib/telemetry'
import { buildWeekLabels, getWeekStartKey, formatDateKey } from '@/app/lib/weekLabels'

type DayPoint = { label: string; mood: number; energy: number }
type Stats = {
  avgMood: number
  avgEnergy: number
  bestLabel: string
  bestMood: number
}

function computeStats(points: DayPoint[]): Stats {
  if (!points.length) return { avgMood: 0, avgEnergy: 0, bestLabel: '-', bestMood: 0 }

  const sumMood = points.reduce((a, p) => a + (p.mood || 0), 0)
  const sumEnergy = points.reduce((a, p) => a + (p.energy || 0), 0)

  const avgMood = Math.round((sumMood / points.length) * 10) / 10
  const avgEnergy = Math.round((sumEnergy / points.length) * 10) / 10

  const best = [...points].sort((a, b) => b.mood - a.mood)[0]
  return {
    avgMood,
    avgEnergy,
    bestLabel: best?.label ?? '-',
    bestMood: best?.mood ?? 0,
  }
}

function Sparkline({ points }: { points: DayPoint[] }) {
  const w = 120
  const h = 28
  const pad = 2

  if (!points.length) return null

  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(points.length - 1, 1))
  const ys = points.map((p) => pad + (h - 2 * pad) * (1 - Math.max(0, Math.min(100, p.mood)) / 100))
  const d = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="text-primary">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function WeeklyInsights() {
  const [data, setData] = React.useState<DayPoint[] | null>(null)

  React.useEffect(() => {
    try {
      const weekStartKey = getWeekStartKey(formatDateKey(new Date()))
      const result = buildWeekLabels(weekStartKey)
      const labels = result.labels

      const raw =
        localStorage.getItem('m360:week:emotions') ||
        localStorage.getItem('m360.week.emotions') ||
        localStorage.getItem('m360.emotions.week') ||
        '[]'

      const arr = JSON.parse(raw) as Array<{ key?: string; mood?: number; energy?: number }>

      const points: DayPoint[] = labels.map((lab, idx) => {
        const item = arr[idx] || {}
        return {
          label: lab.chipLabel,
          mood: Math.round(item.mood ?? 0),
          energy: Math.round(item.energy ?? 0),
        }
      })

      setData(points)

      try {
        track('insights_view', { area: 'eu360', kind: 'weekly' })
      } catch {}
    } catch (e) {
      console.error('[WeeklyInsights] Error loading data:', e)
      setData([])
    }
  }, [])

  const points = data ?? []
  const stats = computeStats(points)

  const suggestionText =
    points.length === 0
      ? 'Se esta semana estiver vazia, tudo bem. Quando você registrar aos poucos, este resumo começa a ganhar forma.'
      : `Nos dias ${stats.bestLabel}, seu humor ficou mais alto. Se fizer sentido, experimente repetir um detalhe simples desse dia: um respiro curto, uma pausa sem telas e uma escolha pequena de autocuidado.`

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
                Humor médio: <strong className="text-support-1">{stats.avgMood}</strong> · Energia média:{' '}
                <strong className="text-support-1">{stats.avgEnergy}</strong>
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
            <p className="text-xs text-support-2 mt-1">Dica: tente repetir um detalhe simples desse dia.</p>

            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  try {
                    track('insight_click', { area: 'eu360', which: 'best-day' })
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
            <h3 className="font-semibold text-support-1 text-sm">Sugestão da semana</h3>
            <p className="text-xs text-support-1 mt-2">{suggestionText}</p>
            <p className="text-xs text-support-2 mt-2">Um passo por vez, no que fizer sentido para você.</p>
          </div>
        </SoftCard>
      </div>
    </section>
  )
}
