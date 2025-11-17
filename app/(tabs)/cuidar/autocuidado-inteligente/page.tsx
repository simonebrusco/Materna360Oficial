'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

export default function AutocuidadoInteligentePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedRitmo, setSelectedRitmo] = useState<string | null>(null)
  const [hydration, setHydration] = useState<number>(0)
  const [sleep, setSleep] = useState<number>(3)
  const [movement, setMovement] = useState<string | null>(null)

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const ritmoKey = `autocuidado:${currentDateKey}:ritmo`
    const hydrationKey = `autocuidado:${currentDateKey}:hydration`
    const sleepKey = `autocuidado:${currentDateKey}:sleep`
    const movementKey = `autocuidado:${currentDateKey}:movement`

    const savedRitmo = load(ritmoKey)
    const savedHydration = load(hydrationKey)
    const savedSleep = load(sleepKey)
    const savedMovement = load(movementKey)

    if (typeof savedRitmo === 'string') setSelectedRitmo(savedRitmo)
    if (typeof savedHydration === 'number') setHydration(savedHydration)
    if (typeof savedSleep === 'number') setSleep(savedSleep)
    if (typeof savedMovement === 'string') setMovement(savedMovement)
  }, [isHydrated, currentDateKey])

  const handleRitmoSelect = (ritmo: string) => {
    setSelectedRitmo(selectedRitmo === ritmo ? null : ritmo)
    if (selectedRitmo !== ritmo) {
      const ritmoKey = `autocuidado:${currentDateKey}:ritmo`
      save(ritmoKey, ritmo)
      try {
        track('ritmo.registered', {
          tab: 'autocuidado-inteligente',
          ritmo: ritmo,
        })
      } catch {}
      toast.success('Ritmo registrado!')
    }
  }

  const handleHydrationChange = (value: number) => {
    setHydration(value)
    const hydrationKey = `autocuidado:${currentDateKey}:hydration`
    save(hydrationKey, value)
    try {
      track('hydration.logged', {
        tab: 'autocuidado-inteligente',
        cups: value,
      })
    } catch {}
  }

  const handleSleepChange = (value: number) => {
    setSleep(value)
    const sleepKey = `autocuidado:${currentDateKey}:sleep`
    save(sleepKey, value)
    try {
      track('sleep.logged', {
        tab: 'autocuidado-inteligente',
        quality: value,
      })
    } catch {}
  }

  const handleMovementSelect = (value: string) => {
    setMovement(movement === value ? null : value)
    if (movement !== value) {
      const movementKey = `autocuidado:${currentDateKey}:movement`
      save(movementKey, value)
      try {
        track('movement.logged', {
          tab: 'autocuidado-inteligente',
          duration: value,
        })
      } catch {}
    }
  }

  return (
    <PageTemplate
      label="CUIDAR"
      title="Autocuidado Inteligente"
      subtitle="Cuidar de você também é cuidar da sua família."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Meu Ritmo Hoje */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Meu Ritmo Hoje
                </h3>
                <p className="text-sm text-[#545454]">
                  Perceba o que seu corpo e sua mente estão pedindo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {['Descansada', 'Cansada', 'Tensa', 'Tranquila', 'Sem energia', 'Preciso de uma pausa'].map(
                  (ritmo) => (
                    <button
                      key={ritmo}
                      onClick={() => handleRitmoSelect(ritmo)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedRitmo === ritmo
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                      }`}
                    >
                      {ritmo}
                    </button>
                  )
                )}
              </div>

              <div className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#545454]">
                Reconhecer seu ritmo é o primeiro passo para se cuidar.
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Mini Rotina de Cuidado */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Mini Rotina de Cuidado
                </h3>
                <p className="text-sm text-[#545454]">
                  Sugestões rápidas para você se acolher hoje.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Respirar por 2 minutos',
                    description: 'Uma pausa curta para regular seu corpo.',
                  },
                  {
                    title: 'Meio copo de água agora',
                    description: 'Mantenha sua energia fluindo.',
                  },
                  {
                    title: 'Alongamento leve',
                    description: 'Destrave a tensão acumulada.',
                  },
                ].map((routine, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                        {routine.title}
                      </h4>
                      <p className="text-xs text-[#545454]">
                        {routine.description}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary ml-3">→</span>
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Saúde & Bem-Estar */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Saúde & Bem-Estar
                </h3>
                <p className="text-sm text-[#545454]">
                  Acompanhe pequenas coisas que fazem diferença.
                </p>
              </div>

              <div className="space-y-6">
                {/* Hydration */}
                <div>
                  <label className="text-sm font-semibold text-[#2f3a56] mb-3 block">
                    Hidratação hoje
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3].map((cups) => (
                      <button
                        key={cups}
                        onClick={() => handleHydrationChange(cups)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          hydration === cups
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                        }`}
                      >
                        {cups} {cups === 1 ? 'copo' : 'copos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleep */}
                <div>
                  <label className="text-sm font-semibold text-[#2f3a56] mb-3 block">
                    Sono da noite passada
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleSleepChange(level)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          sleep === level
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                        }`}
                      >
                        {level === 1
                          ? '😴'
                          : level === 2
                            ? '😴😴'
                            : level === 3
                              ? '😴😴😴'
                              : level === 4
                                ? '😴😴😴😴'
                                : '😴😴😴����😴'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Movement */}
                <div>
                  <label className="text-sm font-semibold text-[#2f3a56] mb-3 block">
                    Movimento do dia
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['0 min', '5 min', '10 min', '15+ min'].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => handleMovementSelect(duration)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          movement === duration
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                        }`}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Sugestões Inteligentes */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Para você hoje
                </h3>
                <p className="text-sm text-[#545454]">
                  Pequenas atitudes que podem transformar seu dia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Micro descanso guiado',
                    description: 'Um minuto para recuperar seu fôlego.',
                  },
                  {
                    title: 'Autocuidado rápido',
                    description: 'Algo simples que você consegue fazer agora.',
                  },
                ].map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/60 bg-white/60 p-4 flex flex-col hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  >
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-2">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-[#545454] mb-3 flex-1">
                      {suggestion.description}
                    </p>
                    <div className="flex justify-end">
                      <span className="text-xs font-medium text-primary inline-flex items-center gap-1">
                        Ver mais →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
