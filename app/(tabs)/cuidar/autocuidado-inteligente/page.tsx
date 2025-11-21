'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

export default function AutocuidadoInteligentePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedRitmo, setSelectedRitmo] = useState<string | null>(null)
  const [hydration, setHydration] = useState<number>(0)
  const [sleep, setSleep] = useState<number>(3)
  const [movement, setMovement] = useState<string | null>(null)
  const [miniRoutineActions, setMiniRoutineActions] = useState<Record<string, boolean>>({
    'Respirar por 1 minuto': false,
    'Beber água com calma': false,
    'Alongar o corpo': false,
  })

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem } = usePlannerSavedContents()

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
      subtitle="Cuidando de você com intenção, leveza e verdade."
    >
      <ClientOnly>
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD 1 — Meu Ritmo Hoje */}
            <Reveal delay={0}>
              <SoftCard className="h-full rounded-3xl p-5 md:p-6 bg-white/90 backdrop-blur-sm">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-1">
                      Meu ritmo hoje
                    </h3>
                    <p className="text-sm md:text-base text-[#545454]">
                      Cuidados do seu momento, feitos na medida certa.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs md:text-sm text-[#545454] mb-3">
                      Conte como você está hoje para adaptar os cuidados do dia.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['leve', 'cansada', 'focada', 'sobrecarregada'].map((ritmo) => (
                        <button
                          key={ritmo}
                          onClick={() => handleRitmoSelect(ritmo)}
                          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs md:text-sm font-medium transition-all duration-200 ${
                            selectedRitmo === ritmo
                              ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                              : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:bg-[#ffd8e6]'
                          }`}
                        >
                          {ritmo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 2 — Mini Rotina de Cuidado */}
            <Reveal delay={50}>
              <SoftCard className="h-full rounded-3xl p-5 md:p-6 bg-white/90 backdrop-blur-sm flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-1">
                      Mini rotina de cuidado
                    </h3>
                    <p className="text-sm md:text-base text-[#545454]">
                      Pequenos gestos que fazem a diferença no seu bem-estar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {['Respirar por 1 minuto', 'Beber água com calma', 'Alongar o corpo'].map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#f5e9f0] transition-all duration-200"
                      >
                        <span className="text-sm md:text-base text-[#2f3a56] font-medium">{action}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#ffd8e6] text-[#ff005e] cursor-pointer"
                          aria-label={action}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#f5e9f0]">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        track('autocuidado.save_to_planner_click', {
                          tab: 'autocuidado-inteligente',
                        })
                      } catch {}
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#ff005e] hover:underline transition-all duration-200"
                  >
                    Salvar no planner
                  </button>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 3 — Saúde & Bem-Estar */}
            <Reveal delay={100}>
              <SoftCard className="h-full rounded-3xl p-5 md:p-6 bg-white/90 backdrop-blur-sm">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-1">
                      Saúde & bem-estar
                    </h3>
                    <p className="text-sm md:text-base text-[#545454]">
                      Um olhar carinhoso para o seu corpo hoje.
                    </p>
                  </div>

                  {/* Sono */}
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-[#2f3a56] mb-2 block uppercase tracking-wide">
                      Sono
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Pouco', 'Ok', 'Restaurador'].map((label, idx) => (
                        <button
                          key={label}
                          onClick={() => handleSleepChange(idx + 1)}
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 ${
                            sleep === idx + 1
                              ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                              : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:bg-[#ffd8e6]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Movimento */}
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-[#2f3a56] mb-2 block uppercase tracking-wide">
                      Movimento
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Quase nada', 'Um pouco', 'Me movi bem'].map((duration) => (
                        <button
                          key={duration}
                          onClick={() => handleMovementSelect(duration)}
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 ${
                            movement === duration
                              ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                              : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:bg-[#ffd8e6]'
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hidratação */}
                  <div>
                    <label className="text-xs md:text-sm font-semibold text-[#2f3a56] mb-2 block uppercase tracking-wide">
                      Hidratação
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Preciso beber mais água', 'Estou me cuidando bem'].map((hydration_label) => (
                        <button
                          key={hydration_label}
                          onClick={() =>
                            handleHydrationChange(
                              hydration_label === 'Preciso beber mais água' ? 0 : 3
                            )
                          }
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium border transition-all duration-200 ${
                            (hydration === 0 && hydration_label === 'Preciso beber mais água') ||
                            (hydration === 3 && hydration_label === 'Estou me cuidando bem')
                              ? 'border-[#ff005e] bg-[#ffd8e6] text-[#ff005e]'
                              : 'border-[#ffd8e6] bg-white text-[#2f3a56] hover:bg-[#ffd8e6]'
                          }`}
                        >
                          {hydration_label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#545454] mt-2">
                    Pequenos ajustes hoje já fazem diferença na sua semana.
                  </p>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 4 — Para Você Hoje */}
            <Reveal delay={150}>
              <SoftCard className="h-full rounded-3xl p-5 md:p-6 bg-white/90 backdrop-blur-sm flex flex-col">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-1">
                      Para você hoje
                    </h3>
                    <p className="text-sm md:text-base text-[#545454]">
                      Pequenos gestos que você pode experimentar.
                    </p>
                  </div>

                  <ul className="space-y-3 text-sm md:text-base text-[#2f3a56]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff005e] font-bold mt-0.5">•</span>
                      <span>Faça uma pausa de 2 minutos para respirar fundo e alongar os ombros.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff005e] font-bold mt-0.5">•</span>
                      <span>Escolha uma coisa que você fez bem hoje e anote em algum lugar.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-auto pt-4 border-t border-[#f5e9f0]">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        track('autocuidado.do_suggestion_click', {
                          tab: 'autocuidado-inteligente',
                        })
                      } catch {}
                    }}
                    className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#ff005e] hover:underline transition-all duration-200"
                  >
                    <span>Quero fazer isso hoje</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </SoftCard>
            </Reveal>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
