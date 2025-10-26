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
  const { completed, total, percentage, weekLabel } = useMindfulnessProgress()
  const [name, setName] = useState<string | undefined>(undefined)

  useEffect(() => {
    setName(readProfileNameSafely())
  }, [])

  const subtitle = name
    ? `${name}, um passo de cada vez — no seu ritmo.`
    : 'Pequenos passos para cuidar de você todos os dias.'

  return (
    <div data-testid="journeys-trail" className="mb-6">
      <p className="text-sm text-support-2 md:text-base">{subtitle}</p>

      <div className="mt-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-soft backdrop-blur">
        <div
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Progresso semanal das jornadas"
          className="relative mb-3 h-2 w-full overflow-hidden rounded-full bg-white/80"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-300 to-pink-500 transition-[width] duration-200 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {Array.from({ length: total }).map((_, index) => {
            const done = index < completed
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

        <div className="mt-3 flex items-center justify-between text-xs text-support-2">
          <span>
            {completed}/{total} concluídos nesta {weekLabel.toLowerCase()}.
          </span>
          <span className="hidden sm:inline">Siga no seu ritmo 💗</span>
        </div>
      </div>
    </div>
  )
}
