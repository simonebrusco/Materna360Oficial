'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

export default function ComoEstouHojePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedHumor, setSelectedHumor] = useState<string | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null)
  const [dayNotes, setDayNotes] = useState('')

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem, getByOrigin } = usePlannerSavedContents()

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const humorKey = `como-estou-hoje:${currentDateKey}:humor`
    const energyKey = `como-estou-hoje:${currentDateKey}:energy`
    const notesKey = `como-estou-hoje:${currentDateKey}:notes`

    const savedHumor = load(humorKey)
    const savedEnergy = load(energyKey)
    const savedNotes = load(notesKey)

    if (typeof savedHumor === 'string') setSelectedHumor(savedHumor)
    if (typeof savedEnergy === 'string') setSelectedEnergy(savedEnergy)
    if (typeof savedNotes === 'string') setDayNotes(savedNotes)
  }, [isHydrated, currentDateKey])

  const handleHumorSelect = (humor: string) => {
    setSelectedHumor(selectedHumor === humor ? null : humor)
    if (selectedHumor !== humor) {
      const humorKey = `como-estou-hoje:${currentDateKey}:humor`
      save(humorKey, humor)
      try {
        track('mood.registered', {
          tab: 'como-estou-hoje',
          mood: humor,
        })
      } catch {}
      toast.success('Humor registrado!')
    }
  }

  const handleEnergySelect = (energy: string) => {
    setSelectedEnergy(selectedEnergy === energy ? null : energy)
    if (selectedEnergy !== energy) {
      const energyKey = `como-estou-hoje:${currentDateKey}:energy`
      save(energyKey, energy)
      try {
        track('energy.registered', {
          tab: 'como-estou-hoje',
          energy: energy,
        })
      } catch {}
      toast.success('Energia registrada!')
    }
  }

  const handleSaveNotes = () => {
    if (!dayNotes.trim()) return
    const notesKey = `como-estou-hoje:${currentDateKey}:notes`
    save(notesKey, dayNotes)

    // Also save to Planner
    addItem({
      origin: 'como-estou-hoje',
      type: 'note',
      title: 'Nota do dia',
      payload: {
        text: dayNotes.trim(),
      },
    })

    try {
      track('day_notes.saved', {
        tab: 'como-estou-hoje',
      })
    } catch {}
    toast.success('Notas salvas!')
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Entenda seu dia com clareza, leveza e acolhimento."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Meu Humor & Minha Energia */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Meu Humor & Minha Energia
                </h3>
                <p className="text-sm text-[#545454]">
                  Registre como você se sente agora.
                </p>
              </div>

              {/* Humor Section */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                  Meu Humor
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Muito bem', 'Bem', 'Neutro', 'Cansada', 'Exausta'].map((humor) => (
                    <button
                      key={humor}
                      onClick={() => handleHumorSelect(humor)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedHumor === humor
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                      }`}
                    >
                      {humor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#2f3a56] mb-3">
                  Minha Energia
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Alta', 'Média', 'Baixa'].map((energy) => (
                    <button
                      key={energy}
                      onClick={() => handleEnergySelect(energy)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedEnergy === energy
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                      }`}
                    >
                      {energy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirmation Note */}
              <div className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#545454]">
                Seus registros ajudam você a entender seus padrões.
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Como foi meu dia? */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Como foi meu dia?
                </h3>
                <p className="text-sm text-[#545454]">
                  Um olhar rápido sobre o que realmente importa.
                </p>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-[#2f3a56] mb-2 block">
                  Notas do dia
                </label>
                <textarea
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  placeholder="Escreva algumas linhas sobre seu dia…"
                  className="w-full min-h-[100px] rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex justify-end mt-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={!dayNotes.trim()}
                  >
                    Salvar
                  </Button>
                </div>
              </div>

              {/* Smart Summary Section */}
              <div className="rounded-2xl bg-gradient-to-br from-[#FFE5EF]/40 to-white p-4 border border-primary/10">
                <h4 className="text-sm font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                  <AppIcon name="idea" size={16} className="text-primary" decorative />
                  Insight do Dia (IA)
                </h4>
                <p className="text-sm text-[#545454]">
                  Aqui você verá um resumo inteligente do seu dia (placeholder).
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Minha Semana Emocional */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Minha Semana Emocional
                </h3>
                <p className="text-sm text-[#545454]">
                  Enxergue seu padrão emocional ao longo da semana.
                </p>
              </div>

              {/* Mood Trend Placeholder */}
              <div className="mb-6 p-6 rounded-2xl bg-[#FFE5EF]/40 flex items-center justify-center h-40">
                <div className="text-center">
                  <AppIcon
                    name="chart"
                    size={32}
                    className="text-primary/40 mx-auto mb-2"
                    decorative
                  />
                  <p className="text-sm text-[#545454]">
                    Gráfico de tendências da semana
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#FFE5EF]/40 p-4">
                  <p className="text-xs text-[#545454] font-medium mb-1">
                    Melhor dia da semana
                  </p>
                  <p className="text-sm font-semibold text-[#2f3a56]">
                    — (placeholder)
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFE5EF]/40 p-4">
                  <p className="text-xs text-[#545454] font-medium mb-1">
                    Dias mais desafiadores
                  </p>
                  <p className="text-sm font-semibold text-[#2f3a56]">
                    — (placeholder)
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Recomendações Inteligentes */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-[#2f3a56] mb-2">
                  Para você hoje
                </h3>
                <p className="text-sm text-[#545454]">
                  Pequenas sugestões que fazem diferença.
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Pausa para Respirar',
                    description: 'Uma pausa de 5 minutos pode recarregar sua energia.',
                  },
                  {
                    title: 'Moment com seu Filho',
                    description: 'Um pequeno gesto de conexão fortalece o vínculo.',
                  },
                ].map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/60 bg-white/60 p-4 flex flex-col"
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
