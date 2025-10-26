'use client'

import { useEffect, useState } from 'react'

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

export default function TrailHeader() {
  const { completed, total, weekLabel } = useMindfulnessProgress()
  const [jornadasCompleted, setJornadasCompleted] = useState<number>(0)
  const [jornadasTotal, setJornadasTotal] = useState<number>(7)
  const [name, setName] = useState<string | undefined>(undefined)

  useEffect(() => {
    const rawTotal = Number.isFinite(total) ? Math.floor(Number(total)) : 7
    const nextTotal = Math.max(rawTotal, 1)
    const rawCompleted = Number.isFinite(completed) ? Math.floor(Number(completed)) : 0
    const nextCompleted = Math.max(0, Math.min(rawCompleted, nextTotal))

    setJornadasTotal((previous) => (previous === nextTotal ? previous : nextTotal))
    setJornadasCompleted((previous) => (previous === nextCompleted ? previous : nextCompleted))
  }, [completed, total])

  const totalSafe = Math.max(Number(jornadasTotal ?? 7), 1)
  const completedSafe = Math.max(0, Math.min(Number(jornadasCompleted ?? 0), totalSafe))
  const safeWeekLabel = typeof weekLabel === 'string' && weekLabel.trim().length > 0 ? weekLabel : 'Semana'

  useEffect(() => {
    setName(readProfileNameSafely())
  }, [])

  const subtitle = name
    ? `${name}, um passo de cada vez — no seu ritmo.`
    : 'Pequenos passos para cuidar de você todos os dias.'

  return (
    <div data-testid="journeys-trail" className="rounded-3xl border border-white/70 bg-white/88 px-4 py-5 shadow-[0_16px_36px_-20px_rgba(47,58,86,0.28)] backdrop-blur-sm transition-shadow duration-300 md:px-6 md:py-6">
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
                const t = Math.max(1, Number(jornadasTotal ?? 7))
                const clamped = Math.max(0, Math.min(c, t))
                return `${(clamped / t) * 100}%`
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
                className={`h-4 w-4 rounded-full ring-1 ring-white/70 transition-transform duration-150 ${
                  done
                    ? 'bg-pink-500 shadow-[0_0_0_4px_rgba(244,114,182,0.25)]'
                    : 'bg-white hover:scale-105'
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
