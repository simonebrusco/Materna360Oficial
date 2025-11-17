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

export default function CuidarComAmorPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedSignals, setSelectedSignals] = useState<string[]>([])
  const [sleepNote, setSleepNote] = useState('')
  const [foodNote, setFoodNote] = useState('')
  const [wellnessNote, setWellnessNote] = useState('')

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const signalsKey = `cuidar-com-amor:${currentDateKey}:signals`
    const sleepKey = `cuidar-com-amor:${currentDateKey}:sleep`
    const foodKey = `cuidar-com-amor:${currentDateKey}:food`
    const wellnessKey = `cuidar-com-amor:${currentDateKey}:wellness`

    const savedSignals = load(signalsKey)
    const savedSleep = load(sleepKey)
    const savedFood = load(foodKey)
    const savedWellness = load(wellnessKey)

    if (Array.isArray(savedSignals)) setSelectedSignals(savedSignals)
    if (typeof savedSleep === 'string') setSleepNote(savedSleep)
    if (typeof savedFood === 'string') setFoodNote(savedFood)
    if (typeof savedWellness === 'string') setWellnessNote(savedWellness)
  }, [isHydrated, currentDateKey])

  const handleSignalToggle = (signal: string) => {
    const updated = selectedSignals.includes(signal)
      ? selectedSignals.filter(s => s !== signal)
      : [...selectedSignals, signal]
    setSelectedSignals(updated)
    const signalsKey = `cuidar-com-amor:${currentDateKey}:signals`
    save(signalsKey, updated)
    try {
      track('child_signals.logged', {
        tab: 'cuidar-com-amor',
        signals: updated,
      })
    } catch {}
  }

  const handleSaveNote = (type: string, note: string) => {
    if (!note.trim()) return
    const key = `cuidar-com-amor:${currentDateKey}:${type}`
    save(key, note)
    try {
      track('care_note.saved', {
        tab: 'cuidar-com-amor',
        type: type,
      })
    } catch {}
    toast.success('Anotação salva!')
  }

  return (
    <PageTemplate
      label="CUIDAR"
      title="Cuidar com Amor"
      subtitle="Pequenos gestos que fortalecem o vínculo com seu filho."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Sinais do Dia */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Sinais do Dia
                </h3>
                <p className="text-sm text-[#545454]">
                  Observe como seu filho expressou suas necessidades hoje.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {['Sonolento', 'Agitado', 'Carinhoso', 'Irritado', 'Curioso', 'Carente'].map(
                  (signal) => (
                    <button
                      key={signal}
                      onClick={() => handleSignalToggle(signal)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedSignals.includes(signal)
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                      }`}
                    >
                      {signal}
                    </button>
                  )
                )}
              </div>

              <div className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#545454]">
                Perceber os sinais ajuda você a entender o que seu filho precisa.
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Cuidado Emocional por Idade */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Cuidado Emocional por Idade
                </h3>
                <p className="text-sm text-[#545454]">
                  O que seu filho mais precisa emocionalmente nesta fase.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Apoio e segurança',
                    description: 'Como acolher as emoções hoje.',
                  },
                  {
                    title: 'Expressão emocional',
                    description: 'Ideias para ajudar seu filho a se comunicar.',
                  },
                  {
                    title: 'Conexão rápida',
                    description: 'Gestos simples para reforçar o vínculo.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-4 rounded-2xl bg-white/60 border border-white/40 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#545454]">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-primary ml-3">→</span>
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Cuidados do Dia */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Cuidados do Dia
                </h3>
                <p className="text-sm text-[#545454]">
                  Acompanhe o que realmente importa.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Sono',
                    question: 'Como foi a rotina de descanso?',
                    state: sleepNote,
                    setState: setSleepNote,
                    type: 'sleep',
                  },
                  {
                    title: 'Alimentação',
                    question: 'Alguma observação importante hoje?',
                    state: foodNote,
                    setState: setFoodNote,
                    type: 'food',
                  },
                  {
                    title: 'Bem-estar',
                    question: 'Anote algo que chamou atenção.',
                    state: wellnessNote,
                    setState: setWellnessNote,
                    type: 'wellness',
                  },
                ].map((care, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/40 bg-white/60 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                          {care.title}
                        </h4>
                        <p className="text-xs text-[#545454]">
                          {care.question}
                        </p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={care.state}
                      onChange={(e) => care.setState(e.target.value)}
                      placeholder="Escreva aqui..."
                      className="w-full text-xs px-3 py-2 rounded-xl border border-white/40 bg-white/50 text-[#2f3a56] focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onBlur={() => handleSaveNote(care.type, care.state)}
                    />
                  </div>
                ))}
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Sugestões Afetivas */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Para Fortalecer o Vínculo
                </h3>
                <p className="text-sm text-[#545454]">
                  Pequenas sugestões para um dia mais leve.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Pausa Afetuosa',
                    description: 'Um gesto curto para reconectar vocês.',
                  },
                  {
                    title: 'Ritual de carinho',
                    description: 'Uma ideia simples para antes de dormir.',
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
