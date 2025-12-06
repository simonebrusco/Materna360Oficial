'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { updateXP } from '@/app/lib/xp'
import { useDayEmotion } from '@/app/store/useDayEmotion'

type WeeklyInsight = {
  title: string
  summary: string
  highlights: {
    bestDay: string
    toughDays: string
  }
}

type DailyInsight = {
  title: string
  body: string
  gentleReminder: string
}

type EmotionalContext = {
  mood?: string | null
  energy?: string | null
  hasNotes?: boolean
  notesPreview?: string
  dateKey?: string
}

const DAILY_INSIGHT_LIMIT = 1

// Insight semanal emocional via modelo + fallback suave
async function fetchWeeklyEmotionalInsight(
  context: EmotionalContext,
): Promise<WeeklyInsight> {
  try {
    try {
      track('como_estou_hoje.weekly_insight.requested', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
        mood: context.mood ?? null,
        energy: context.energy ?? null,
      })
    } catch {
      // silencioso — telemetria nunca deve quebrar a experiência
    }

    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'como-estou-hoje',
        context,
      }),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida da análise emocional')
    }

    const data = await res.json()
    const insight = data?.weeklyInsight

    if (!insight || typeof insight !== 'object') {
      throw new Error('Insight semanal vazio')
    }

    const normalized: WeeklyInsight = {
      title: insight.title ?? 'Como sua semana tem se desenhado',
      summary:
        insight.summary ??
        'Pelos seus registros recentes, sua semana parece misturar momentos de cansaço com alguns respiros de leveza. Só de você olhar para isso com sinceridade, já está cuidando muito de você e da sua família.',
      highlights: {
        bestDay:
          insight.highlights?.bestDay ??
          'Os dias em que você se sente mais equilibrada costumam ser aqueles em que você respeita mais seus limites e não tenta abraçar o mundo de uma vez.',
        toughDays:
          insight.highlights?.toughDays ??
          'Os dias mais pesados tendem a aparecer quando você tenta dar conta de tudo sozinha. Pedir ajuda ou reduzir expectativas também é um gesto de amor.',
      },
    }

    try {
      track('como_estou_hoje.weekly_insight.generated', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
      })
    } catch {
      // ignora
    }

    return normalized
  } catch (error) {
    console.error(
      '[Como Estou Hoje] Erro ao buscar insight semanal, usando fallback:',
      error,
    )

    try {
      track('como_estou_hoje.weekly_insight.fallback_used', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
      })
    } catch {
      // ignora
    }

    // Fallback carinhoso, sem exposição técnica
    return {
      title: 'Como sua semana tem se desenhado',
      summary:
        'Mesmo nos dias mais puxados, existe um fio de cuidado que passa pela sua semana inteira. Talvez você não perceba, mas pequenas atitudes suas já estão fazendo diferença.',
      highlights: {
        bestDay:
          'Seus melhores dias costumam ser aqueles em que você aceita fazer um pouco menos e consegue respirar um pouco mais.',
        toughDays:
          'Os dias mais desafiadores aparecem quando a cobrança interna aumenta demais. Você não precisa ser perfeita para ser uma ótima mãe.',
      },
    }
  }
}

// Insight do dia (emocional) + fallback suave
async function fetchDailyEmotionalInsight(
  context: EmotionalContext,
): Promise<DailyInsight> {
  try {
    try {
      track('como_estou_hoje.daily_insight.requested', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
        mood: context.mood ?? null,
        energy: context.energy ?? null,
      })
    } catch {
      // ignora
    }

    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'daily_inspiration',
        origin: 'como-estou-hoje',
        context,
      }),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida da análise emocional')
    }

    const data = await res.json()
    const inspiration = data?.inspiration

    if (!inspiration || typeof inspiration !== 'object') {
      throw new Error('Inspiração diária vazia')
    }

    const normalized: DailyInsight = {
      title: inspiration.phrase ?? 'Um olhar gentil para o seu dia',
      body:
        inspiration.care ??
        'Pelos sinais que você tem dado, parece que o dia de hoje veio com uma mistura de cansaço e responsabilidade. Mesmo assim, você continua aparecendo para a sua família – isso já é enorme.',
      gentleReminder:
        inspiration.ritual ??
        'Você não precisa fazer tudo hoje. Escolha uma coisa importante e permita que o resto seja “suficientemente bom”.',
    }

    try {
      track('como_estou_hoje.daily_insight.generated', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
      })
    } catch {
      // ignora
    }

    return normalized
  } catch (error) {
    console.error(
      '[Como Estou Hoje] Erro ao buscar insight do dia, usando fallback:',
      error,
    )

    try {
      track('como_estou_hoje.daily_insight.fallback_used', {
        origin: 'como-estou-hoje',
        dateKey: context.dateKey,
      })
    } catch {
      // ignora
    }

    // Fallback carinhoso
    return {
      title: 'Um olhar gentil para o seu dia',
      body:
        'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.',
      gentleReminder:
        'Se puder, separe alguns minutos só seus – nem que seja para respirar fundo, tomar um café quente ou ficar em silêncio por um momento.',
    }
  }
}

export default function ComoEstouHojePage(props: {
  searchParams?: Promise<Record<string, string | string[]>>
}) {
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)

  // Agora o humor vem do estado global
  const { mood, setMood } = useDayEmotion()

  // Energia e notas continuam locais
  const [selectedEnergy, setSelectedEnergy] = useState<string | null>(null)
  const [dayNotes, setDayNotes] = useState('')

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem, getByOrigin } = usePlannerSavedContents()

  // Insight semanal
  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null)
  const [loadingWeeklyInsight, setLoadingWeeklyInsight] = useState(false)

  // Insight diário
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null)
  const [loadingDailyInsight, setLoadingDailyInsight] = useState(false)
  const [usedDailyInsightToday, setUsedDailyInsightToday] = useState(0)

  // Query param para abrir bloco direto do hub
  const [sectionToOpen, setSectionToOpen] = useState<string | null>(null)

  // marcador lógico para o scroll + contexto carregado
  const [refsReady, setRefsReady] = useState(false)
  const humorSectionId = 'sec-humor'
  const notesSectionId = 'sec-notas'
  const resumoSectionId = 'sec-resumo'
  const semanaSectionId = 'sec-semana'

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Ler searchParams (?abrir=) para navegação vinda do hub
  useEffect(() => {
    async function resolveSearch() {
      try {
        const params = await props.searchParams
        const abrirParam = params?.abrir
        if (typeof abrirParam === 'string') {
          setSectionToOpen(abrirParam)
          try {
            track('navigate.como_estou_hoje.opened_section', {
              section: abrirParam,
            })
          } catch {
            // ignora
          }
        }
      } catch {
        // ignora erro
      }
    }
    resolveSearch()
  }, [props.searchParams])

  // Scroll suave para seção vinda do hub
  useEffect(() => {
    if (!sectionToOpen) return
    const t = setTimeout(() => {
      let elementId: string | null = null

      if (sectionToOpen === 'humor') elementId = humorSectionId
      if (sectionToOpen === 'notas') elementId = notesSectionId
      if (sectionToOpen === 'resumo') elementId = resumoSectionId
      if (sectionToOpen === 'semana') elementId = semanaSectionId

      if (!elementId) return
      const el = document.getElementById(elementId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 350)

    return () => clearTimeout(t)
  }, [sectionToOpen, refsReady])

  // Load persisted data (humor/energia/notas + limite diário de insight)
  useEffect(() => {
    if (!isHydrated) return

    const humorKey = `como-estou-hoje:${currentDateKey}:humor`
    const energyKey = `como-estou-hoje:${currentDateKey}:energy`
    const notesKey = `como-estou-hoje:${currentDateKey}:notes`
    const dailyInsightCountKey = `como-estou-hoje:${currentDateKey}:daily_insight_count`

    const savedHumor = load(humorKey)
    const savedEnergy = load(energyKey)
    const savedNotes = load(notesKey)
    const savedDailyInsightCountRaw = load(dailyInsightCountKey)

    if (typeof savedHumor === 'string') {
      setMood(savedHumor)
    }

    if (typeof savedEnergy === 'string') setSelectedEnergy(savedEnergy)
    if (typeof savedNotes === 'string') setDayNotes(savedNotes)

    if (typeof savedDailyInsightCountRaw === 'number') {
      setUsedDailyInsightToday(savedDailyInsightCountRaw)
    } else if (typeof savedDailyInsightCountRaw === 'string') {
      const parsed = Number(savedDailyInsightCountRaw)
      if (!Number.isNaN(parsed)) {
        setUsedDailyInsightToday(parsed)
      }
    }

    setRefsReady(true)
  }, [isHydrated, currentDateKey, setMood])

  const emotionalContext: EmotionalContext = useMemo(
    () => ({
      mood,
      energy: selectedEnergy,
      hasNotes: !!dayNotes.trim(),
      notesPreview: dayNotes.trim() ? dayNotes.trim().slice(0, 160) : undefined,
      dateKey: currentDateKey,
    }),
    [mood, selectedEnergy, dayNotes, currentDateKey],
  )

  // Insight semanal (já usando contexto)
  useEffect(() => {
    if (!refsReady) return
    let isMounted = true

    const loadInsight = async () => {
      setLoadingWeeklyInsight(true)
      try {
        const result = await fetchWeeklyEmotionalInsight(emotionalContext)
        if (isMounted) {
          setWeeklyInsight(result)
        }
      } finally {
        if (isMounted) {
          setLoadingWeeklyInsight(false)
        }
      }
    }

    loadInsight()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsReady, mood, selectedEnergy, currentDateKey])

  // Insight diário (também contextual) + limite diário persistente
  useEffect(() => {
    if (!refsReady) return

    if (usedDailyInsightToday >= DAILY_INSIGHT_LIMIT) {
      // Já gerou o insight de hoje, não chama IA novamente
      return
    }

    let isMounted = true
    const dailyInsightCountKey = `como-estou-hoje:${currentDateKey}:daily_insight_count`

    const loadDaily = async () => {
      setLoadingDailyInsight(true)
      try {
        const result = await fetchDailyEmotionalInsight(emotionalContext)
        if (isMounted) {
          setDailyInsight(result)
          setUsedDailyInsightToday(prev => {
            const next = prev + 1
            save(dailyInsightCountKey, next)
            return next
          })
        }
      } finally {
        if (isMounted) {
          setLoadingDailyInsight(false)
        }
      }
    }

    loadDaily()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsReady, mood, selectedEnergy, currentDateKey, usedDailyInsightToday])

  const handleHumorSelect = (humor: string) => {
    setMood(prev => {
      const next = prev === humor ? null : humor

      if (next && next !== prev) {
        const humorKey = `como-estou-hoje:${currentDateKey}:humor`
        save(humorKey, next)

        try {
          track('mood.registered', {
            tab: 'como-estou-hoje',
            mood: next,
          })
        } catch {
          // ignora
        }

        // Pontos por registrar humor
        try {
          void updateXP(10)
        } catch (e) {
          console.error(
            '[Como Estou Hoje] Erro ao atualizar XP de humor:',
            e,
          )
        }

        toast.success('Humor registrado!')
      }

      return next
    })
  }

  const handleEnergySelect = (energy: string) => {
    const next = selectedEnergy === energy ? null : energy
    setSelectedEnergy(next)

    if (next !== selectedEnergy && next) {
      const energyKey = `como-estou-hoje:${currentDateKey}:energy`
      save(energyKey, next)
      try {
        track('energy.registered', {
          tab: 'como-estou-hoje',
          energy: next,
        })
      } catch {
        // ignora
      }

      // Pontos por registrar energia
      try {
        void updateXP(8)
      } catch (e) {
        console.error(
          '[Como Estou Hoje] Erro ao atualizar XP de energia:',
          e,
        )
      }

      toast.success('Energia registrada!')
    }
  }

  const handleSaveNotes = () => {
    if (!dayNotes.trim()) return
    const notesKey = `como-estou-hoje:${currentDateKey}:notes`
    save(notesKey, dayNotes)

    // Também salvar no Planner
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
    } catch {
      // ignora
    }

    // Pontos por registrar notas do dia
    try {
      void updateXP(12)
    } catch (e) {
      console.error(
        '[Como Estou Hoje] Erro ao atualizar XP das notas do dia:',
        e,
      )
    }

    toast.success('Notas salvas!')
  }

  const handleSaveDailyInsightToPlanner = () => {
    const insightToSave = dailyInsight ?? {
      title: 'Insight do dia',
      body:
        'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.',
      gentleReminder:
        'Se puder, separe alguns minutos só seus – nem que seja para respirar fundo, tomar um café quente ou ficar em silêncio por um momento.',
    }

    addItem({
      origin: 'como-estou-hoje',
      type: 'insight',
      title: insightToSave.title,
      payload: {
        text: insightToSave.body,
        gentleReminder: insightToSave.gentleReminder,
        dateKey: currentDateKey,
        mood,
        energy: selectedEnergy,
      },
    })

    try {
      track('daily_insight.saved', {
        tab: 'como-estou-hoje',
        dateKey: currentDateKey,
      })
    } catch {
      // ignora
    }

    // Pontos por levar insight para o planner
    try {
      void updateXP(15)
    } catch (e) {
      console.error(
        '[Como Estou Hoje] Erro ao atualizar XP do insight do dia:',
        e,
      )
    }

    toast.success('Insight salvo no planner!')
  }

  const handleSaveSuggestionToPlanner = (
    tag: string,
    title: string,
    desc: string,
  ) => {
    addItem({
      origin: 'como-estou-hoje',
      type: 'insight',
      title,
      payload: { tag, description: desc },
    })

    try {
      track('weekly_suggestion.saved', {
        tab: 'como-estou-hoje',
        tag,
        title,
      })
    } catch {
      // ignora
    }

    // Pontos por levar sugestão semanal para o planner
    try {
      void updateXP(10)
    } catch (e) {
      console.error(
        '[Como Estou Hoje] Erro ao atualizar XP da sugestão semanal:',
        e,
      )
    }

    toast.success('Sugestão salva no planner!')
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Entenda seu dia com clareza, leveza e acolhimento."
    >
      <ClientOnly>
        {/* PageTemplate já cuida de largura e centralização */}
        <div className="pt-6 pb-10 space-y-12 md:space-y-16">
          {/* ============= BLOCO HOJE ============= */}
          <section
            className="space-y-6 md:space-y-8"
            aria-label="Como você está hoje"
          >
            <Reveal>
              <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/10 backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.22)] px-4 py-6 md:px-8 md:py-8">
                {/* Glows */}
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                  <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6 md:space-y-8">
                  {/* Header do bloco */}
                  <header className="space-y-2">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.24em] uppercase text-white/80">
                      Hoje
                    </p>
                    <h2 className="text-lg md:text-2xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                      Como Você Está Agora
                    </h2>
                    <p className="text-xs md:text-sm text-white/90 max-w-2xl">
                      Registre seu humor, energia e um pequeno resumo do dia –
                      isso ajuda o Materna360 a cuidar melhor de você.
                    </p>
                  </header>

                  {/* Grid principal: humor + notas + insight */}
                  <div className="grid gap-4 md:gap-5 lg:gap-6 md:grid-cols-2">
                    {/* CARD 1: Meu Humor & Minha Energia */}
                    <SoftCard
                      id={humorSectionId}
                      className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                    >
                      <div className="mb-5">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1 flex items-center gap-2">
                          <AppIcon
                            name="heart"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Meu Humor & Minha Energia
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454]">
                          Um registro rápido para você se entender melhor ao
                          longo da semana.
                        </p>
                      </div>

                      {/* Humor */}
                      <div className="mb-6 space-y-3">
                        <h4 className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                          Meu humor
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Muito bem',
                            'Bem',
                            'Neutro',
                            'Cansada',
                            'Exausta',
                          ].map(option => (
                            <button
                              key={option}
                              onClick={() => handleHumorSelect(option)}
                              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
                                mood === option
                                  ? 'bg-[#ff005e] text-white shadow-md'
                                  : 'bg-white border border-[#ffd8e6] text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Energia */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                          Minha energia
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['Alta', 'Média', 'Baixa'].map(energy => (
                            <button
                              key={energy}
                              onClick={() => handleEnergySelect(energy)}
                              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duração-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
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

                      <div className="mt-6 pt-4 border-t border-[#ffd8e6] text-[11px] md:text-xs text-[#545454]">
                        ✓ Cada registro é um cuidado com você mesma — e ajuda o
                        Materna360 a entender seus padrões.
                      </div>
                    </SoftCard>

                    {/* Coluna direita: Notas + Insight do dia */}
                    <div className="space-y-4 md:space-y-5">
                      {/* CARD 2: Como foi meu dia? */}
                      <SoftCard
                        id={notesSectionId}
                        className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
                      >
                        <div className="mb-5">
                          <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1 flex items-center gap-2">
                            <AppIcon
                              name="pen"
                              size={18}
                              className="text-[#ff005e]"
                              decorative
                            />
                            Como Foi Meu Dia?
                          </h3>
                          <p className="text-xs md:text-sm text-[#545454]">
                            Escreva algumas linhas sobre o que realmente importou
                            hoje.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] md:text-xs font-semibold text-[#2f3a56] mb-2.5 block uppercase tracking-wide">
                              Notas do dia
                            </label>
                            <textarea
                              value={dayNotes}
                              onChange={e => setDayNotes(e.target.value)}
                              onFocus={() => {
                                try {
                                  track('day_notes.focused', {
                                    tab: 'como-estou-hoje',
                                  })
                                } catch {
                                  // ignora
                                }
                              }}
                              placeholder="Conte para você mesma como foi o seu dia…"
                              className="w-full min-h-[90px] rounded-2xl border border-[#ffd8e6] bg:white p-3 text-xs md:text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:border-[#ff005e] focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30 resize-none"
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

                          {/* Histórico de notas (origin: como-estou-hoje) */}
                          {getByOrigin('como-estou-hoje').filter(
                            item => item.type === 'note',
                          ).length > 0 && (
                            <div className="pt-3 border-t border-[#ffd8e6] space-y-2">
                              <p className="text-[11px] md:text-xs font-semibold text-[#545454] uppercase tracking-wide">
                                Notas de hoje no planner
                              </p>
                              <ul className="space-y-2">
                                {getByOrigin('como-estou-hoje')
                                  .filter(item => item.type === 'note')
                                  .map(item => (
                                    <li
                                      key={item.id}
                                      className="rounded-2xl bg-[#ffd8e6]/20 border border-[#ffd8e6]/50 px-3 py-2 text-xs md:text-sm text-[#545454]"
                                    >
                                      {item.payload?.text}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </SoftCard>

                      {/* CARD 3: Insight do Dia */}
                      <SoftCard
                        id={resumoSectionId}
                        className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                      >
                        <div className="mb-3">
                          <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                            <AppIcon
                              name="sparkles"
                              size={18}
                              className="text-[#ff005e]"
                              decorative
                            />
                            Insight Do Dia
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {loadingDailyInsight ? (
                            <p className="text-sm leading-relaxed text-[#545454]">
                              Estou olhando com carinho para o seu dia para trazer
                              uma reflexão para você…
                            </p>
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed text-[#545454]">
                                {dailyInsight?.body ??
                                  'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.'}
                              </p>
                              <div className="rounded-2xl bg-[#ffd8e6]/20 border border-[#ffd8e6]/60 p-3">
                                <p className="text-[11px] md:text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-1">
                                  Lembrete suave para hoje
                                </p>
                                <p className="text-xs md:text-sm text-[#545454]">
                                  {dailyInsight?.gentleReminder ??
                                    'Se conseguir, separe alguns minutos só seus – mesmo que seja para respirar fundo em silêncio.'}
                                </p>
                              </div>
                            </>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleSaveDailyInsightToPlanner}
                              className="mt-1 text-xs md:text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors flex items-center gap-1"
                            >
                              Levar este insight para o planner
                              <AppIcon name="arrow-right" size={14} decorative />
                            </button>
                          </div>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ============= BLOCO SEMANA ============= */}
          <section
            className="space-y-6 md:space-y-8"
            aria-label="Como sua semana tem se desenhado"
          >
            <Reveal>
              <div
                id={semanaSectionId}
                className="relative overflow-hidden rounded-[32px] border border:white/70 bg:white/10 backdrop-blur-2xl shadow-[0_22px_55px_rgba(0,0,0,0.22)] px-4 py-6 md:px-8 md:py-8"
              >
                {/* Glows */}
                <div className="pointer-events-none absolute inset-0 opacity-80">
                  <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                  <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6 md:space-y-8">
                  {/* Header */}
                  <header className="space-y-2">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.24em] uppercase text-white/80">
                      Semana
                    </p>
                    <h2 className="text-lg md:text-2xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                      Como Sua Semana Tem Se Desenhado
                    </h2>
                    <p className="text-xs md:text-sm text-white/90 max-w-2xl">
                      Um olhar mais amplo para os seus dias: padrões emocionais e
                      pequenas ideias para deixar a semana mais leve.
                    </p>
                  </header>

                  {/* Grid: Semana emocional + Sugestões */}
                  <div className="grid gap-4 md:gap-5 lg:gap-6 md:grid-cols-2">
                    {/* CARD: Minha Semana Emocional */}
                    <SoftCard className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                      <div className="mb-5">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1 flex items-center gap-2">
                          <AppIcon
                            name="chart"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Minha Semana Emocional
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454]">
                          Enxergue seus padrões emocionais com mais leveza — sem
                          julgamentos.
                        </p>
                      </div>

                      {/* Texto principal da semana */}
                      <div className="mb-5 p-4 rounded-2xl bg-[#ffd8e6]/10 border border-[#ffd8e6]/50">
                        {loadingWeeklyInsight ? (
                          <p className="text-sm text-[#545454]">
                            Estou olhando com carinho para os seus registros para
                            trazer um resumo da sua semana…
                          </p>
                        ) : (
                          <p className="text-sm text-[#545454] leading-relaxed">
                            {weeklyInsight?.summary ??
                              'Conforme você registra seu humor e sua energia, este espaço vai te mostrar com mais clareza como anda a sua semana – sem julgamento, só com acolhimento.'}
                          </p>
                        )}
                      </div>

                      {/* Highlights */}
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-3 space-y-2">
                          <p className="text-[11px] md:text-xs text-[#545454] font-medium uppercase tracking-wide">
                            Quando seus dias fluem melhor
                          </p>
                          <p className="text-sm font-semibold text-[#2f3a56]">
                            {weeklyInsight?.highlights.bestDay ??
                              'Seus melhores dias costumam aparecer quando você respeita seu ritmo e não tenta fazer tudo ao mesmo tempo.'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-3 space-y-2">
                          <p className="text-[11px] md:text-xs text-[#545454] font-medium uppercase tracking-wide">
                            Quando o dia pesa um pouco mais
                          </p>
                          <p className="text-sm font-semibold text-[#2f3a56]">
                            {weeklyInsight?.highlights.toughDays ??
                              'Os dias mais desafiadores costumam vir acompanhados de muita cobrança interna. Lembre-se: pedir ajuda ou fazer menos também é cuidado.'}
                          </p>
                        </div>
                      </div>

                      {/* CTA para Minhas Conquistas */}
                      <div className="pt-4 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="border border-[#ff005e]/40 text-[#ff005e] hover:bg-[#ffd8e6]/40"
                          onClick={() =>
                            router.push('/maternar/minhas-conquistas?abrir=painel')
                          }
                        >
                          Ver minhas conquistas
                        </Button>
                      </div>
                    </SoftCard>

                    {/* CARD: Sugestões pensadas para você esta semana */}
                    <SoftCard className="rounded-3xl p-5 md:p-6 bg-white border border-[#ffd8e6] shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
                      <div className="mb-5">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-1 flex items-center gap-2">
                          <AppIcon
                            name="lightbulb"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Sugestões Pensadas Para Você Esta Semana
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454]">
                          Pequenas ideias práticas para cuidar de você sem
                          sobrecarregar.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {[
                          {
                            tag: 'Pausa',
                            title: 'Respire fundo nos momentos difíceis',
                            desc: 'Uma pausa de 5 minutos pode recarregar sua energia quando o dia apertar.',
                          },
                          {
                            tag: 'Conexão',
                            title: 'Momento com seu filho',
                            desc: 'Um abraço ou conversa de 10 minutos fortalece o vínculo e acalma ambos.',
                          },
                          {
                            tag: 'Rotina',
                            title: 'Mantenha um pequeno ritual',
                            desc: 'Café da manhã tranquilo ou alongamento matinal criam estabilidade.',
                          },
                        ].map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border border-[#ffd8e6] bg-white p-4 md:p-5 hover:bg-[#ffd8e6]/5 transition-colors space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-2.5 py-1 text-[10px] md:text-xs font-semibold tracking-wide text-[#ff005e] uppercase">
                                    {suggestion.tag}
                                  </span>
                                </div>
                                <h4 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                                  {suggestion.title}
                                </h4>
                                <p className="text-xs md:text-sm text-[#545454] mt-1.5">
                                  {suggestion.desc}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveSuggestionToPlanner(
                                    suggestion.tag,
                                    suggestion.title,
                                    suggestion.desc,
                                  )
                                }
                                className="text-[11px] md:text-xs font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1"
                              >
                                Levar para o planner
                                <AppIcon name="arrow-right" size={14} decorative />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SoftCard>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <MotivationalFooter routeKey="meu-dia-como-estou-hoje" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
