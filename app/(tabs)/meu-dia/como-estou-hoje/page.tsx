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

type FilterType = 'humor' | 'energia' | 'notas' | 'resumo' | 'semana'

interface HumorEntry {
  date: string
  emoji: string
  notes?: string
}

interface EnergyEntry {
  date: string
  level: 'baixa' | 'media' | 'alta'
}

const HUMOR_EMOJIS = ['😢', '😐', '🙂', '😊', '😄']
const HUMOR_LABELS = ['Muito ruim', 'Ruim', 'Neutro', 'Bom', 'Excelente']

export default function ComoEstouHojePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('humor')
  const [isHydrated, setIsHydrated] = useState(false)
  const [humorEntries, setHumorEntries] = useState<HumorEntry[]>([])
  const [energyEntries, setEnergyEntries] = useState<EnergyEntry[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [noteText, setNoteText] = useState('')
  const [selectedHumor, setSelectedHumor] = useState<number | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<'baixa' | 'media' | 'alta' | null>(null)
  const [dayNotes, setDayNotes] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const humorKey = 'como-estou-hoje:humor-entries'
    const energyKey = 'como-estou-hoje:energy-entries'
    const notesKey = 'como-estou-hoje:notes'
    const dayNotesKey = `como-estou-hoje:${currentDateKey}:day-notes`

    const savedHumor = load(humorKey)
    const savedEnergy = load(energyKey)
    const savedNotes = load(notesKey)
    const savedDayNotes = load(dayNotesKey)

    if (Array.isArray(savedHumor)) setHumorEntries(savedHumor)
    if (Array.isArray(savedEnergy)) setEnergyEntries(savedEnergy)
    if (Array.isArray(savedNotes)) setNotes(savedNotes)
    if (typeof savedDayNotes === 'string') setDayNotes(savedDayNotes)
  }, [isHydrated, currentDateKey])

  const handleRegisterHumor = () => {
    if (selectedHumor === null) return

    const newEntry: HumorEntry = {
      date: currentDateKey,
      emoji: HUMOR_EMOJIS[selectedHumor],
    }

    const updated = [newEntry, ...humorEntries.filter(e => e.date !== currentDateKey)]
    setHumorEntries(updated)
    save('como-estou-hoje:humor-entries', updated)

    try {
      track('mood.registered', {
        tab: 'como-estou-hoje',
        mood_level: selectedHumor,
      })
    } catch {}

    setSelectedHumor(null)
    toast.success('Humor registrado!')
  }

  const handleRegisterEnergy = () => {
    if (!selectedEnergy) return

    const newEntry: EnergyEntry = {
      date: currentDateKey,
      level: selectedEnergy,
    }

    const updated = [newEntry, ...energyEntries.filter(e => e.date !== currentDateKey)]
    setEnergyEntries(updated)
    save('como-estou-hoje:energy-entries', updated)

    try {
      track('energy.registered', {
        tab: 'como-estou-hoje',
        energy_level: selectedEnergy,
      })
    } catch {}

    setSelectedEnergy(null)
    toast.success('Energia registrada!')
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return

    const updated = [...notes, noteText]
    setNotes(updated)
    setNoteText('')
    setShowNoteModal(false)

    save('como-estou-hoje:notes', updated)

    try {
      track('note.added', {
        tab: 'como-estou-hoje',
      })
    } catch {}

    toast.success('Nota salva!')
  }

  const handleSaveDayNotes = () => {
    if (!dayNotes.trim()) return

    const dayNotesKey = `como-estou-hoje:${currentDateKey}:day-notes`
    save(dayNotesKey, dayNotes)

    try {
      track('day_notes.saved', {
        tab: 'como-estou-hoje',
      })
    } catch {}

    toast.success('Registro do dia salvo!')
  }

  // Get this week's entries (last 7 days)
  const getWeekEntries = () => {
    const today = new Date(currentDateKey)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 7)

    return humorEntries.filter(entry => new Date(entry.date) >= weekStart)
  }

  const weekEntries = getWeekEntries()

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Humor e energia com mais consciência."
    >
      <ClientOnly>
        <div className="max-w-4xl">
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              {/* FILTER BUTTONS */}
              <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-white/60">
                {(
                  [
                    { id: 'humor', label: 'Humor' },
                    { id: 'energia', label: 'Energia' },
                    { id: 'notas', label: 'Notas' },
                    { id: 'resumo', label: 'Resumo do Dia' },
                    { id: 'semana', label: 'Semana' },
                  ] as const
                ).map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* CONTENT BASED ON FILTER */}

              {/* HUMOR FILTER */}
              {activeFilter === 'humor' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                      Registre seu Humor
                    </h3>
                    <p className="text-sm text-[#545454] mb-4">
                      Como você está se sentindo agora?
                    </p>

                    <div className="flex justify-center gap-4 mb-4">
                      {HUMOR_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedHumor(idx)}
                          className={`text-4xl p-2 rounded-xl transition-all duration-200 ${
                            selectedHumor === idx
                              ? 'bg-primary/20 scale-110'
                              : 'hover:bg-white/60'
                          }`}
                          title={HUMOR_LABELS[idx]}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {selectedHumor !== null && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-[#545454]">
                          {HUMOR_LABELS[selectedHumor]}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-center mb-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRegisterHumor}
                        disabled={selectedHumor === null}
                      >
                        Registrar
                      </Button>
                    </div>
                  </div>

                  {/* Humor da Semana */}
                  {weekEntries.length > 0 && (
                    <div className="pt-6 border-t border-white/60">
                      <h4 className="text-base font-semibold text-[#2f3a56] mb-4">
                        Humor da Semana
                      </h4>
                      <div className="space-y-2">
                        {weekEntries.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-[#FFE5EF]/40"
                          >
                            <span className="text-sm text-[#545454]">
                              {new Date(entry.date).toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-2xl">{entry.emoji}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tendências Emocionais Placeholder */}
                  <div className="pt-6 border-t border-white/60">
                    <h4 className="text-base font-semibold text-[#2f3a56] mb-3">
                      Tendências Emocionais
                    </h4>
                    <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-sm text-[#545454]">
                      <p className="mb-2 font-medium">Análise em breve:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Padrões de humor na semana</li>
                        <li>Momentos de maior bem-estar</li>
                        <li>Insights personalizados</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ENERGIA FILTER */}
              {activeFilter === 'energia' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                      Registre sua Energia
                    </h3>
                    <p className="text-sm text-[#545454] mb-6">
                      Registre se está esgotada ou recarregada.
                    </p>

                    <div className="space-y-3 mb-6">
                      {(['baixa', 'media', 'alta'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setSelectedEnergy(level)}
                          className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                            selectedEnergy === level
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <AppIcon
                              name={
                                level === 'baixa'
                                  ? 'battery-low'
                                  : level === 'media'
                                    ? 'battery'
                                    : 'zap'
                              }
                              size={20}
                              decorative
                            />
                            <div>
                              <p className="font-semibold capitalize">
                                {level === 'baixa'
                                  ? 'Esgotada'
                                  : level === 'media'
                                    ? 'Equilibrada'
                                    : 'Recarregada'}
                              </p>
                              <p className="text-xs opacity-75">
                                {level === 'baixa'
                                  ? 'Preciso de descanso'
                                  : level === 'media'
                                    ? 'No meu ritmo'
                                    : 'Cheia de energia'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center mb-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRegisterEnergy}
                        disabled={!selectedEnergy}
                      >
                        Registrar
                      </Button>
                    </div>
                  </div>

                  {/* Resumo da Energia Placeholder */}
                  <div className="pt-6 border-t border-white/60">
                    <h4 className="text-base font-semibold text-[#2f3a56] mb-3">
                      Resumo da Energia na Semana
                    </h4>
                    <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-sm text-[#545454]">
                      <p className="mb-2 font-medium">Análise em breve:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Padrões de energia na semana</li>
                        <li>Momentos de maior disposição</li>
                        <li>Recomendações de descanso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTAS FILTER */}
              {activeFilter === 'notas' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                      Registre suas Notas
                    </h3>
                    <p className="text-sm text-[#545454] mb-4">
                      Escreva aqui como se sente hoje…
                    </p>

                    <div className="flex gap-3">
                      <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Desabafe em poucas palavras..."
                        className="flex-1 min-h-[100px] rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <div className="flex justify-end mt-3 mb-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                      >
                        Salvar Registro
                      </Button>
                    </div>
                  </div>

                  {/* Notas Anteriores */}
                  {notes.length > 0 && (
                    <div className="pt-6 border-t border-white/60">
                      <h4 className="text-base font-semibold text-[#2f3a56] mb-3">
                        Registros Anteriores
                      </h4>
                      <div className="space-y-2">
                        {notes.map((note, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl bg-[#FFE5EF]/40 p-3 text-sm text-[#2f3a56]"
                          >
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RESUMO DO DIA FILTER */}
              {activeFilter === 'resumo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f3a56] mb-2">
                      O que Quero Levar do Dia
                    </h3>
                    <p className="text-sm text-[#545454] mb-4">
                      Registre os momentos importantes e o aprendizado de hoje.
                    </p>

                    <textarea
                      value={dayNotes}
                      onChange={e => setDayNotes(e.target.value)}
                      placeholder="Pequenas vitórias, gratidões, aprendizados..."
                      className="w-full min-h-[120px] rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-[#2f3a56] shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <div className="flex justify-end mt-3 mb-6">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveDayNotes}
                        disabled={!dayNotes.trim()}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>

                  {/* Momentos Importantes Placeholder */}
                  <div className="pt-6 border-t border-white/60">
                    <h4 className="text-base font-semibold text-[#2f3a56] mb-3">
                      Momentos Importantes
                    </h4>
                    <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-sm text-[#545454]">
                      <p className="mb-2 font-medium">Histórico em breve:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Registro dos momentos do dia</li>
                        <li>Fotos e memórias conectadas</li>
                        <li>Linha do tempo de alegrias</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SEMANA FILTER */}
              {activeFilter === 'semana' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2f3a56] mb-4">
                      Resumo Emocional da Semana
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-center">
                        <p className="text-xs text-[#545454] mb-1">Humor Médio</p>
                        <p className="text-2xl">
                          {weekEntries.length > 0
                            ? HUMOR_EMOJIS[
                                Math.floor(
                                  weekEntries.reduce((sum, e) => {
                                    const idx = HUMOR_EMOJIS.indexOf(e.emoji)
                                    return sum + idx
                                  }, 0) / weekEntries.length
                                )
                              ]
                            : '—'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-center">
                        <p className="text-xs text-[#545454] mb-1">Energia Média</p>
                        <p className="text-2xl">
                          {energyEntries.length > 0 ? '⚡' : '—'}
                        </p>
                      </div>
                    </div>

                    {weekEntries.length > 0 && (
                      <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 mb-6">
                        <p className="text-sm font-semibold text-[#2f3a56] mb-2">
                          Dia Mais Positivo
                        </p>
                        <p className="text-sm text-[#545454]">
                          {new Date(weekEntries[0].date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}{' '}
                          {weekEntries[0].emoji}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl bg-[#FFE5EF]/40 p-4 text-sm text-[#545454]">
                      <p className="mb-2 font-medium">Observações da Semana:</p>
                      <p className="italic">
                        {weekEntries.length > 0
                          ? `Você registrou seu humor ${weekEntries.length} vezes esta semana. Continue monitorando seus padrões emocionais!`
                          : 'Comece registrando seu humor para ver análises desta semana.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
