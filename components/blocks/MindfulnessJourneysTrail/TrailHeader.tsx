'use client'

import { useEffect, useMemo, useState } from 'react'

import { useMindfulnessProgress } from './useMindfulnessProgress'

type ProfileCookie = { nomeMae?: string }

function readProfileNameSafely(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined
  }

  try {
    const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('m360_profile='))
    if (!match) {
      return undefined
    }

    const value = decodeURIComponent(match.split('=')[1] ?? '')
    if (!value) {
      return undefined
    }

    const parsed: ProfileCookie = JSON.parse(value)
    const raw = parsed?.nomeMae?.trim()
    return raw && raw.length > 0 ? raw : undefined
  } catch (error) {
    console.warn('[MindfulnessTrail] Failed to read profile cookie', error)
    return undefined
  }
}

const JOURNEY_IDS = ['amor-proprio', 'calma', 'energia-positiva', 'gratidao', 'descanso', 'confianca'] as const

export type JourneySummary = Partial<Record<(typeof JOURNEY_IDS)[number], { completed?: number; total?: number }>>

type JourneyProgressState = Record<(typeof JOURNEY_IDS)[number], { completed: number; total: number }>

type TrailHeaderProps = {
  journeySummary?: JourneySummary
}

const JOURNEY_WEEK_TARGET = 7

export default function TrailHeader({ journeySummary }: TrailHeaderProps) {
  const { weekLabel } = useMindfulnessProgress()
  const [journeyStates, setJourneyStates] = useState<JourneyProgressState>(() => {
    return JOURNEY_IDS.reduce<JourneyProgressState>((acc, id) => {
      acc[id] = { completed: 0, total: JOURNEY_WEEK_TARGET }
      return acc
    }, {} as JourneyProgressState)
  })
  const [jornadasCompleted, setJornadasCompleted] = useState<number>(0)
  const [jornadasTotal, setJornadasTotal] = useState<number>(JOURNEY_WEEK_TARGET)
  const [name, setName] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!journeySummary) {
      return
    }

    setJourneyStates((previous) => {
      let changed = false
      const next = { ...previous }
      JOURNEY_IDS.forEach((id) => {
        const source = journeySummary[id]
        const rawCompleted = Number(source?.completed ?? 0)
        const rawTotal = Number(source?.total ?? JOURNEY_WEEK_TARGET)
        const sanitizedTotal = Number.isFinite(rawTotal) ? Math.max(0, Math.floor(rawTotal)) : JOURNEY_WEEK_TARGET
        const resolvedTotal = sanitizedTotal > 0 ? sanitizedTotal : JOURNEY_WEEK_TARGET
        const sanitizedCompleted = Number.isFinite(rawCompleted) ? Math.max(0, Math.floor(rawCompleted)) : 0
        const current = previous[id]
        if (!current || current.completed !== sanitizedCompleted || current.total !== resolvedTotal) {
          next[id] = {
            completed: sanitizedCompleted,
            total: resolvedTotal,
          }
          changed = true
        }
      })
      return changed ? next : previous
    })
  }, [journeySummary])

  const aggregatedCompleted = useMemo(() => {
    const sum = JOURNEY_IDS.reduce((acc, id) => {
      const value = Number(journeyStates[id]?.completed ?? 0)
      return acc + (Number.isFinite(value) ? value : 0)
    }, 0)
    return Math.max(0, Math.min(JOURNEY_WEEK_TARGET, sum))
  }, [journeyStates])

  useEffect(() => {
    setJornadasCompleted(aggregatedCompleted)
  }, [aggregatedCompleted])

  useEffect(() => {
    setJornadasTotal(JOURNEY_WEEK_TARGET)
  }, [])

  const totalSafe = Math.max(Number(jornadasTotal ?? JOURNEY_WEEK_TARGET), 1)
  const completedSafe = Math.max(0, Math.min(Number(jornadasCompleted ?? 0), totalSafe))
  const safeWeekLabel = typeof weekLabel === 'string' && weekLabel.trim().length > 0 ? weekLabel : 'Semana'

  useEffect(() => {
    setName(readProfileNameSafely())
  }, [])

  const subtitle = name
    ? `${name}, um passo de cada vez — no seu ritmo.`
    : 'Pequenos passos para cuidar de você todos os dias.'

  return (
    <div data-testid="journeys-trail" className="CardElevate rounded-3xl border border-white/70 bg-white/88 px-4 py-5 backdrop-blur-sm md:px-6 md:py-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-sm text-support-2/80 md:text-[15px] md:leading-[1.45]">{subtitle}</p>
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          {completedSafe}/{totalSafe}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/60 bg-white/75 p-4 shadow-inner backdrop-blur">
        <div
          role="progressbar"
          aria-valuenow={completedSafe}
          aria-valuemin={0}
          aria-valuemax={totalSafe}
          aria-label="Progresso das Jornadas do Cuidar"
          className="relative mb-3 h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_4px_rgba(47,58,86,0.12)]"
        >
          <div
            className="absolute inset-y-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/75 transition-[width] duration-[600ms] ease-out"
            style={{
              width: (function () {
                const c = Math.max(0, Number(jornadasCompleted ?? 0))
                const t = Math.max(1, Number(jornadasTotal ?? JOURNEY_WEEK_TARGET))
                const pct = Math.min(100, Math.max(0, (Math.min(c, t) / t) * 100))
                return `${pct}%`
              })(),
              transformOrigin: 'left center',
              willChange: 'width',
            }}
          />
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: totalSafe }).map((_, index) => {
            const done = index < completedSafe
            return (
              <span
                key={index}
                aria-hidden="true"
                className={`relative h-4 w-4 rounded-full bg-primary ring-1 ring-primary/20 shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-transform duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                  done ? 'opacity-100 hover:scale-105' : 'opacity-75 hover:scale-[1.06]'
                }`}
              />
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-support-2/80">
          <span>
            {completedSafe}/{totalSafe} concluídos nesta {safeWeekLabel.toLowerCase()}.
          </span>
          <span className="hidden sm:inline">Siga no seu ritmo 💗</span>
        </div>
      </div>
    </div>
  )
}
