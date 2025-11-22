'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { useEmotionalInsights } from '@/app/hooks/useEmotionalInsights'
import { getLastNDaysMoodEntries } from '@/app/lib/ai/emocionalHistory'
import {
  getWeeklySuggestions,
  type EmotionalSuggestion,
} from '@/app/lib/ai/emocionalSuggestions'

export default function ComoEstouHojePage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedHumor, setSelectedHumor] = useState<string | null>(null)
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null)
  const [dayNotes, setDayNotes] = useState('')

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem, getByOrigin } = usePlannerSavedContents()

  // IA emocional – insight do dia
  const {
    loading: emotionalLoading,
    error: emotionalError,
    data: emotionalData,
    call: fetchEmotionalInsights,
  } = useEmotionalInsights()

  // IA emocional – visão da semana
  const {
    loading: weeklyEmotionalLoading,
    error: weeklyEmotionalError,
    data: weeklyEmotionalData,
    call: fetchWeeklyEmotionalInsights,
  } = useEmotionalInsights()

  // IA emocional – sugestões para a semana
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)
  const [weeklySuggestions, setWeeklySuggestions] = useState<EmotionalSuggestion[] | null>(null)

  // Sugestões padrão (fallback)
  const defaultWeeklySuggestions: EmotionalSuggestion[] = [
    {
      tag: 'Pausa',
      title: 'Respire fundo nos momentos difíceis',
      text: 'Uma pausa de 5 minutos pode recarregar sua energia quando o dia apertar.',
    },
    {
      tag: 'Conexão',
      title: 'Momento com seu filho',
      text: 'Um abraço ou conversa de 10 minutos fortalece o vínculo e acalma ambos.',
    },
    {
      tag: 'Rotina',
      title: 'Mantenha um pequeno ritual',
      text: 'Café da manhã tranquilo ou alongamento matinal criam estabilidade.',
    },
  ]

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

  const handleGenerateEmotionalInsight = async () => {
    // Mapa simples de energia para o contrato da IA
    let mappedEnergy: 'baixa' | 'media' | 'alta' | string | undefined
    if (selectedEnergy === 'Alta') mappedEnergy = 'alta'
    if (selectedEnergy === 'Média') mappedEnergy = 'media'
    if (selectedEnergy === 'Baixa') mappedEnergy = 'baixa'

    try {
      await fetchEmotionalInsights({
        userId: null,
        locale: 'pt-BR',
        moodEntries: [
          {
            date: new Date().toISOString().slice(0, 10),
            mood: selectedHumor || 'Neutro',
            energy: mappedEnergy,
          },
        ],
        timeRange: 'last_7_days',
      })
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao gerar insight emocional:', error)
    }
  }

  const handleGenerateWeeklyEmotionalInsight = async () => {
    const entries = getLastNDaysMoodEntries(7)

    if (!entries.length) {
      toast.info('Registre seu humor em alguns dias para ver o resumo da semana ✨')
      return
    }

    try {
      await fetchWeeklyEmotionalInsights({
        userId: null,
        locale: 'pt-BR',
        moodEntries: entries,
        timeRange: 'last_7_days',
      })
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao gerar visão emocional da semana:', error)
    }
  }

  const handleGenerateWeeklySuggestions = async () => {
    const entries = getLastNDaysMoodEntries(7)

    if (!entries.length) {
      toast.info('Registre seu humor em alguns dias para receber sugestões personalizadas ✨')
      return
    }

    setSuggestionsLoading(true)
    setSuggestionsError(null)

    try {
      const response = await getWeeklySuggestions({
        locale: 'pt-BR',
        moodEntries: entries,
      })
      setWeeklySuggestions(response.suggestions ?? null)
    } catch (error) {
      console.error('[Como Estou Hoje] Erro ao gerar sugestões emocionais:', error)
      setSuggestionsError('Não foi possível gerar as sugestões agora.')
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const suggestionsToRender: EmotionalSuggestion[] =
    weeklySuggestions && weeklySuggestions.length > 0
      ? weeklySuggestions
      : defaultWeeklySuggestions

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Entenda seu dia com clareza, leveza e acolhimento."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-12 md:space-y-14">
          {/* ============= BLOCO HOJE ============= */}
          <section className="space-y-4">
            {/* Section Header */}
            <div className="px-2">
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] flex items-center gap-2">
                <span className="inline-block w-1 h-6 bg-[#ff005e] rounded-full"></span>
                Hoje
              </h2>
            </div>

            {/* CARD 1: Meu Humor & Minha Energia */}
            <Reveal delay={0}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                    <AppIcon name="heart" size={18} className="text-[#ff005e]" decorative />
                    Meu Humor & Minha Energia
                  </h3>
                  <p className="text-sm text-[#545454]">
                    Registre como você se sente agora.
                  </p>
                </div>

                {/* Humor Section */}
                <div className="mb-8 space-y-3">
                  <h4 className="text-sm font-semibold text-[#2f3a56] uppercase tracking-wide">
                    Meu Humor
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Muito bem', 'Bem', 'Neutro', 'Cansada', 'Exausta'].map((humor) => (
                      <button
                        key={humor}
                        onClick={() => handleHumorSelect(humor)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
                          selectedHumor === humor
                            ? 'bg-[#ff005e] text-white shadow-md'
                            : 'bg-white border border-[#ffd8e6] text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                        }`}
                      >
                        {humor}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#2f3a56] uppercase tracking-wide">
                    Minha Energia
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['Alta', 'Média', 'Baixa'].map((energy) => (
                      <button
                        key={energy}
                        onClick={() => handleEnergySelect(energy)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
                          selectedEnergy === energy
                            ? 'bg-[#ff005e] text-white shadow-md'
                            : 'bg-white border border-[#ffd8e6] text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                        }`}
                      >
                        {energy}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confirmation Note */}
                <div className="mt-6 pt-6 border-t border-[#ffd8e6] text-sm text-[#545454]">
                  ✓ Seus registros ajudam você a entender seus padrões.
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 2: Como foi meu dia? */}
            <Reveal delay={50}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                    <AppIcon name="pen" size={18} className="text-[#ff005e]" decorative />
                    Como foi meu dia?
                  </h3>
                  <p className="text-sm text-[#545454]">
                    Um olhar rápido sobre o que realmente importa.
                  </p>
                </div>

                {/* Notes Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-[#2f3a56] mb-2.5 block uppercase tracking-wide">
                      Notas do dia
                    </label>
                    <textarea
                      value={dayNotes}
                      onChange={(e) => setDayNotes(e.target.value)}
                      placeholder="Escreva algumas linhas sobre seu dia…"
                      className="w-full min-h-[100px] rounded-2xl border border-[#ffd8e6] bg-white p-4 text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:border-[#ff005e] focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30 resize-none"
                    />
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={!dayNotes.trim()}
                      >
                        Salvar no planner
                      </Button>
                    </div>
                  </div>

                  {/* Today's notes history from Planner */}
                  {getByOrigin('como-estou-hoje').filter((item) => item.type === 'note').length > 0 && (
                    <div className="pt-4 border-t border-[#ffd8e6] space-y-3">
                      <p className="text-xs font-semibold text-[#545454] uppercase tracking-wide">
                        Notas de hoje no planner
                      </p>
                      <ul className="space-y-2">
                        {getByOrigin('como-estou-hoje')
                          .filter((item) => item.type === 'note')
                          .map((item) => (
                            <li
                              key={item.id}
                              className="rounded-2xl bg-[#ffd8e6]/20 border border-[#ffd8e6]/50 px-4 py-3 text-sm text-[#545454]"
                            >
                              {item.payload?.text}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 3: Insight do Dia (IA) */}
            <Reveal delay={100}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#9B4D96]/20 shadow-[0_4px_12px_rgba(155,77,150,0.08)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                      <AppIcon name="sparkles" size={18} className="text-[#9B4D96]" decorative />
                      Insight do Dia (IA)
                    </h3>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateEmotionalInsight}
                    disabled={emotionalLoading}
                  >
                    {emotionalLoading ? 'Gerando insight…' : 'Gerar insight com IA'}
                  </Button>
                </div>

                <div className="space-y-4">
                  {emotionalError && (
                    <p className="text-xs text-[#ff005e]">
                      Não foi possível gerar o insight agora. Tente novamente em alguns minutos.
                    </p>
                  )}

                  {emotionalLoading && (
                    <p className="text-sm leading-relaxed text-[#545454]">
                      Estou olhando com carinho para seus registros para trazer um insight leve e acolhedor…
                    </p>
                  )}

                  {!emotionalLoading && emotionalData && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#2f3a56]">
                        {emotionalData.title}
                      </p>
                      <p className="text-sm leading-relaxed text-[#545454]">
                        {emotionalData.body}
                      </p>

                      {emotionalData.highlights && emotionalData.highlights.length > 0 && (
                        <div className="space-y-2">
                          {emotionalData.highlights.map((h, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-3"
                            >
                              <p className="text-xs font-semibold text-[#2f3a56]">
                                {h.label}
                              </p>
                              <p className="text-xs text-[#545454] mt-1">{h.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!emotionalLoading && !emotionalData && (
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed text-[#545454]">
                        Ao longo da semana, você tem registrado momentos de alta energia principalmente à noite. Isso pode ser uma oportunidade para planejar tarefas importantes nesse horário.
                      </p>
                      <p className="text-sm leading-relaxed text-[#545454]">
                        Quando você está neutro ou cansada, suas prioridades tendem a se concentrar em autocuidado. Isso é um padrão saudável — respeite seu ritmo.
                      </p>
                    </div>
                  )}

                  <button className="mt-4 text-sm font-semibold text-[#9B4D96] hover:text-[#9B4D96]/80 transition-colors flex items-center gap-1">
                    Ver insight detalhado <AppIcon name="arrow-right" size={14} decorative />
                  </button>
                </div>
              </SoftCard>
            </Reveal>
          </section>

          {/* ============= BLOCO SEMANA ============= */}
          <section className="space-y-4">
            {/* Section Header */}
            <div className="px-2">
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56] flex items-center gap-2">
                <span className="inline-block w-1 h-6 bg-[#ff005e] rounded-full"></span>
                Semana
              </h2>
            </div>

            {/* CARD 4: Minha Semana Emocional */}
            <Reveal delay={150}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                      <AppIcon name="chart" size={18} className="text-[#ff005e]" decorative />
                      Minha Semana Emocional
                    </h3>
                    <p className="text-sm text-[#545454]">
                      Enxergue seu padrão emocional ao longo da semana.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateWeeklyEmotionalInsight}
                    disabled={weeklyEmotionalLoading}
                  >
                    {weeklyEmotionalLoading ? 'Analisando semana…' : 'Ver resumo com IA'}
                  </Button>
                </div>

                {/* Mood Trend Placeholder */}
                <div className="mb-6 p-8 rounded-2xl bg-[#ffd8e6]/10 border border-[#ffd8e6]/50 flex items-center justify-center min-h-[160px]">
                  <div className="text-center space-y-3">
                    <AppIcon
                      name="chart"
                      size={40}
                      className="text-[#ff005e]/30 mx-auto"
                      decorative
                    />
                    <p className="text-sm text-[#545454]">
                      Gráfico de tendências da semana
                    </p>
                    <p className="text-xs text-[#545454]/60">
                      Os dados aparecerão conforme você registra seus humores.
                    </p>
                  </div>
                </div>

                {weeklyEmotionalError && (
                  <p className="text-xs text-[#ff005e] mb-3">
                    Não foi possível analisar a semana agora. Tente novamente mais tarde.
                  </p>
                )}

                {/* Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-4 space-y-2">
                    <p className="text-xs text-[#545454] font-medium uppercase tracking-wide">
                      Melhor dia da semana
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">
                      {weeklyEmotionalLoading
                        ? 'Analisando sua semana…'
                        : weeklyEmotionalData?.highlights?.[0]?.text || '(Em progresso)'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-4 space-y-2">
                    <p className="text-xs text-[#545454] font-medium uppercase tracking-wide">
                      Dias mais desafiadores
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">
                      {weeklyEmotionalLoading
                        ? 'Analisando sua semana…'
                        : weeklyEmotionalData?.highlights?.[1]?.text || '(Em progresso)'}
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 5: Sugestões para a Mãe (IA) */}
            <Reveal delay={200}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                      <AppIcon name="lightbulb" size={18} className="text-[#ff005e]" decorative />
                      Sugestões pensadas para você esta semana
                    </h3>
                    <p className="text-sm text-[#545454]">
                      Pequenas ideias que fazem diferença no seu bem-estar.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateWeeklySuggestions}
                    disabled={suggestionsLoading}
                  >
                    {suggestionsLoading ? 'Gerando sugestões…' : 'Ver sugestões com IA'}
                  </Button>
                </div>

                {suggestionsError && (
                  <p className="text-xs text-[#ff005e] mb-3">
                    {suggestionsError}
                  </p>
                )}

                {/* Suggestions Grid */}
                <div className="space-y-3">
                  {suggestionsLoading && (
                    <p className="text-xs text-[#545454] mb-1">
                      Olhando para a sua semana para sugerir pequenas ações que realmente combinam com o seu momento…
                    </p>
                  )}

                  {suggestionsToRender.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#ffd8e6] bg-white p-4 md:p-5 hover:bg-[#ffd8e6]/5 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#ff005e] uppercase">
                              {suggestion.tag}
                            </span>
                          </div>
                          <h4 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-[#545454] mt-1.5">
                            {suggestion.text}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button className="text-xs md:text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1">
                          Ver mais <AppIcon name="arrow-right" size={14} decorative />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SoftCard>
            </Reveal>
          </section>

          <MotivationalFooter routeKey="meu-dia-como-estou-hoje" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
