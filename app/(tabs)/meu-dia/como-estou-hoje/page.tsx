'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
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

// Insight semanal emocional via IA + fallback suave
async function fetchWeeklyEmotionalInsight(): Promise<WeeklyInsight> {
  try {
    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'como-estou-hoje',
      }),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida da IA')
    }

    const data = await res.json()
    const insight = data?.weeklyInsight

    if (!insight || typeof insight !== 'object') {
      throw new Error('Insight semanal vazio')
    }

    return {
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
  } catch (error) {
    console.error(
      '[Como Estou Hoje] Erro ao buscar insight semanal, usando fallback:',
      error,
    )

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

// Insight do dia (emocional) via IA + fallback suave
async function fetchDailyEmotionalInsight(): Promise<DailyInsight> {
  try {
    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'daily_inspiration',
        origin: 'como-estou-hoje',
      }),
    })

    if (!res.ok) {
      throw new Error('Resposta inválida da IA')
    }

    const data = await res.json()
    const inspiration = data?.inspiration

    if (!inspiration || typeof inspiration !== 'object') {
      throw new Error('Inspiração diária vazia')
    }

    return {
      title: inspiration.phrase ?? 'Um olhar gentil para o seu dia',
      body:
        inspiration.care ??
        'Pelos sinais que você tem dado, parece que o dia de hoje veio com uma mistura de cansaço e responsabilidade. Mesmo assim, você continua aparecendo para a sua família – isso já é enorme.',
      gentleReminder:
        inspiration.ritual ??
        'Você não precisa fazer tudo hoje. Escolha uma coisa importante e permita que o resto seja “suficientemente bom”.',
    }
  } catch (error) {
    console.error(
      '[Como Estou Hoje] Erro ao buscar insight do dia, usando fallback:',
      error,
    )

    return {
      title: 'Um olhar gentil para o seu dia',
      body:
        'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.',
      gentleReminder:
        'Se puder, separe alguns minutos só seus – nem que seja para respirar fundo, tomar um café quente ou ficar em silêncio por um momento.',
    }
  }
}

export default function ComoEstouHojePage() {
  const searchParams = useSearchParams()
  const abrir = searchParams?.get('abrir')

  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedHumor, setSelectedHumor] = useState<string | null>(null)
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

  // Marca como hidratado
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Carrega dados persistidos (humor/energia/notas)
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

  // Carrega Insight semanal
  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingWeeklyInsight(true)
      try {
        const result = await fetchWeeklyEmotionalInsight()
        if (isMounted) {
          setWeeklyInsight(result)
        }
      } finally {
        if (isMounted) setLoadingWeeklyInsight(false)
      }
    }

    loadInsight()
    return () => {
      isMounted = false
    }
  }, [])

  // Carrega Insight diário
  useEffect(() => {
    let isMounted = true

    const loadDaily = async () => {
      setLoadingDailyInsight(true)
      try {
        const result = await fetchDailyEmotionalInsight()
        if (isMounted) {
          setDailyInsight(result)
        }
      } finally {
        if (isMounted) setLoadingDailyInsight(false)
      }
    }

    loadDaily()
    return () => {
      isMounted = false
    }
  }, [])

  // Deep-link dos mini-hubs (?abrir=humor|notas|insight|semana|sugestoes)
  useEffect(() => {
    if (!abrir) return

    const map: Record<string, string> = {
      humor: 'block-humor',
      notas: 'block-notas',
      insight: 'block-insight-dia',
      semana: 'block-semana',
      sugestoes: 'block-sugestoes',
    }

    const targetId = map[abrir]
    if (!targetId) return

    const el = document.getElementById(targetId)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    el.classList.add(
      'ring-2',
      'ring-[#ff005e]',
      'ring-offset-2',
      'ring-offset-[#FFB3D3]',
    )
    const timeout = setTimeout(() => {
      el.classList.remove(
        'ring-2',
        'ring-[#ff005e]',
        'ring-offset-2',
        'ring-offset-[#FFB3D3]',
      )
    }, 1600)

    return () => clearTimeout(timeout)
  }, [abrir])

  const handleHumorSelect = (humor: string) => {
    setSelectedHumor(selectedHumor === humor ? null : humor)
    if (selectedHumor !== humor) {
      const humorKey = `como-estou-hoje:${currentDateKey}:humor`
      save(humorKey, humor)
      try {
        track('mood.registered', { tab: 'como-estou-hoje', mood: humor })
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
        track('energy.registered', { tab: 'como-estou-hoje', energy })
      } catch {}
      toast.success('Energia registrada!')
    }
  }

  const handleSaveNotes = () => {
    if (!dayNotes.trim()) return

    const notesKey = `como-estou-hoje:${currentDateKey}:notes`
    save(notesKey, dayNotes.trim())

    addItem({
      origin: 'como-estou-hoje',
      type: 'note',
      title: 'Nota do dia',
      payload: { text: dayNotes.trim() },
    })

    try {
      track('day_notes.saved', { tab: 'como-estou-hoje' })
    } catch {}
    toast.success('Notas salvas no planner!')
  }

  const handleSaveDailyInsightToPlanner = () => {
    const insightToSave = dailyInsight ?? {
      title: 'Insight do dia',
      body:
        'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.',
      gentleReminder:
        'Se puder, separe alguns minutos só seus – nem que seja para respirar fundo ou ficar em silêncio por um momento.',
    }

    addItem({
      origin: 'como-estou-hoje',
      type: 'insight',
      title: insightToSave.title,
      payload: {
        text: insightToSave.body,
        gentleReminder: insightToSave.gentleReminder,
      },
    })

    try {
      track('daily_insight.saved', { tab: 'como-estou-hoje' })
    } catch {}
    toast.success('Insight salvo no planner!')
  }

  const handleSaveSuggestionToPlanner = (tag: string, title: string, desc: string) => {
    addItem({
      origin: 'como-estou-hoje:semana',
      type: 'idea',
      title,
      payload: { tag, description: desc },
    })

    try {
      track('weekly_suggestion.saved', {
        tab: 'como-estou-hoje',
        tag,
      })
    } catch {}
    toast.success('Sugestão enviada para o planner!')
  }

  const plannerNotesToday = getByOrigin('como-estou-hoje').filter(
    (item) => item.type === 'note',
  )

  const weeklySuggestions = [
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
  ]

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Entenda seu dia com clareza, leveza e acolhimento."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-2 md:px-6 space-y-10 md:space-y-12">
          {/* ================= HOJE ================= */}
          <Reveal>
            <section
              id="block-hoje-wrapper"
              className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22)_0,rgba(255,255,255,0)_40%)] px-4 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:px-8 md:py-8"
            >
              {/* glows */}
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.28)] blur-3xl" />
                <div className="absolute -bottom-16 -right-12 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.32)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6 md:space-y-8">
                <header className="space-y-2">
                  <span className="inline-flex items-center rounded-full border border-white/60 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur">
                    HOJE
                  </span>
                  <h2 className="text-2xl md:text-3xl font-semibold leading-tight text-white">
                    Como Você Está Agora
                  </h2>
                  <p className="text-sm md:text-base text-white/85 max-w-2xl">
                    Registre seu humor, energia e um pequeno resumo do dia – isso
                    ajuda o Materna360 a cuidar melhor de você ao longo da semana.
                  </p>
                </header>

                {/* Grid principal: Humor + Notas */}
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-6">
                  {/* Card: Humor & Energia */}
                  <div id="block-humor">
                    <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/95 p-6 shadow-[0_10px_26px_rgba(0,0,0,0.16)] md:p-7">
                      <div className="mb-5 md:mb-6">
                        <h3 className="mb-1 text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="heart"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Meu Humor & Minha Energia
                        </h3>
                        <p className="text-sm text-[#545454]">
                          Um registro rápido para você se entender melhor ao longo da
                          semana.
                        </p>
                      </div>

                      {/* Humor */}
                      <div className="mb-7 space-y-2">
                        <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wide text-[#2f3a56]">
                          Meu humor
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['Muito bem', 'Bem', 'Neutro', 'Cansada', 'Exausta'].map(
                            (humor) => (
                              <button
                                key={humor}
                                type="button"
                                onClick={() => handleHumorSelect(humor)}
                                className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
                                  selectedHumor === humor
                                    ? 'bg-[#ff005e] text-white shadow-md'
                                    : 'bg-white border border-[#ffd8e6] text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30'
                                }`}
                              >
                                {humor}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Energia */}
                      <div className="space-y-2">
                        <h4 className="text-xs md:text-sm font-semibold uppercase tracking-wide text-[#2f3a56]">
                          Minha energia
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {['Alta', 'Média', 'Baixa'].map((energy) => (
                            <button
                              key={energy}
                              type="button"
                              onClick={() => handleEnergySelect(energy)}
                              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/30 ${
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

                      <p className="mt-6 border-t border-[#ffd8e6] pt-4 text-xs md:text-sm text-[#545454]">
                        ✓ Cada registro é um cuidado com você mesma – e ajuda o
                        Materna360 a entender seus padrões.
                      </p>
                    </SoftCard>
                  </div>

                  {/* Card: Como Foi Meu Dia */}
                  <div id="block-notas">
                    <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/96 p-6 shadow-[0_10px_26px_rgba(0,0,0,0.16)] md:p-7">
                      <div className="mb-5 md:mb-6">
                        <h3 className="mb-1 text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="pen"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Como Foi Meu Dia?
                        </h3>
                        <p className="text-sm text-[#545454]">
                          Escreva algumas linhas sobre o que realmente importou hoje.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs md:text-sm font-semibold uppercase tracking-wide text-[#2f3a56]">
                          Notas do dia
                        </label>
                        <textarea
                          value={dayNotes}
                          onChange={(e) => setDayNotes(e.target.value)}
                          placeholder="Conte para você mesma como foi o seu dia…"
                          className="w-full min-h-[110px] resize-none rounded-2xl border border-[#ffd8e6] bg-white p-4 text-sm text-[#2f3a56] placeholder:text-[#545454]/40 focus:border-[#ff005e] focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
                        />
                        <div className="flex justify-end pt-1">
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

                      {plannerNotesToday.length > 0 && (
                        <div className="mt-5 space-y-2 border-t border-[#ffd8e6] pt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                            Notas de hoje no planner
                          </p>
                          <ul className="space-y-2">
                            {plannerNotesToday.map((item) => (
                              <li
                                key={item.id}
                                className="rounded-2xl border border-[#ffd8e6]/60 bg-[#ffd8e6]/15 px-4 py-3 text-xs md:text-sm text-[#545454]"
                              >
                                {item.payload?.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </SoftCard>
                  </div>
                </div>

                {/* Card: Insight do Dia */}
                <div id="block-insight-dia">
                  <SoftCard className="rounded-3xl border border-[#9B4D96]/25 bg-white/96 p-6 shadow-[0_10px_26px_rgba(155,77,150,0.18)] md:p-7">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="sparkles"
                            size={18}
                            className="text-[#9B4D96]"
                            decorative
                          />
                          Insight do Dia
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {loadingDailyInsight ? (
                        <p className="text-sm leading-relaxed text-[#545454]">
                          Estou olhando com carinho para o seu dia para trazer uma
                          reflexão para você…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[#545454]">
                            {dailyInsight?.body ??
                              'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.'}
                          </p>
                          <div className="rounded-2xl border border-[#ffd8e6]/70 bg-[#ffd8e6]/25 p-3">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#2f3a56]">
                              Lembrete suave para hoje
                            </p>
                            <p className="text-sm text-[#545454]">
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
                          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#9B4D96] transition-colors hover:text-[#9B4D96]/85"
                        >
                          Levar este insight para o planner
                          <AppIcon name="arrow-right" size={14} decorative />
                        </button>
                      </div>
                    </div>
                  </SoftCard>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ================= SEMANA ================= */}
          <Reveal>
            <section
              id="block-semana"
              className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22)_0,rgba(255,255,255,0)_40%)] px-4 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:px-8 md:py-8"
            >
              {/* glows */}
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.24)] blur-3xl" />
                <div className="absolute -bottom-16 -right-12 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.34)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6 md:space-y-8">
                <header className="space-y-2">
                  <span className="inline-flex items-center rounded-full border border-white/60 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur">
                    SEMANA
                  </span>
                  <h2 className="text-2xl md:text-3xl font-semibold leading-tight text-white">
                    Como Sua Semana Tem Se Desenhado
                  </h2>
                  <p className="text-sm md:text-base text-white/85 max-w-2xl">
                    Um olhar mais amplo para os seus dias: padrões emocionais e pequenas
                    ideias para deixar a semana mais leve.
                  </p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  {/* Minha Semana Emocional */}
                  <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/96 p-6 shadow-[0_10px_26px_rgba(0,0,0,0.16)] md:p-7">
                    <div className="mb-5 md:mb-6">
                      <h3 className="mb-1 text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                        <AppIcon
                          name="chart"
                          size={18}
                          className="text-[#ff005e]"
                          decorative
                        />
                        Minha Semana Emocional
                      </h3>
                      <p className="text-sm text-[#545454]">
                        Enxergue seus padrões emocionais com mais leveza – sem
                        julgamentos.
                      </p>
                    </div>

                    <div className="mb-6 rounded-2xl border border-[#ffd8e6]/60 bg-[#ffd8e6]/15 p-4">
                      {loadingWeeklyInsight ? (
                        <p className="text-sm text-[#545454]">
                          Estou olhando com carinho para os seus registros para trazer
                          um resumo da sua semana…
                        </p>
                      ) : (
                        <p className="text-sm leading-relaxed text-[#545454]">
                          {weeklyInsight?.summary ??
                            'Conforme você registra seu humor e sua energia, este espaço vai te mostrar com mais clareza como anda a sua semana – sem julgamento, só com acolhimento.'}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 md:gap-4">
                      <div className="rounded-2xl border border-[#ffd8e6]/40 bg-[#ffd8e6]/15 p-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                          Quando seus dias fluem melhor
                        </p>
                        <p className="text-sm font-semibold text-[#2f3a56]">
                          {weeklyInsight?.highlights.bestDay ??
                            'Seus melhores dias costumam aparecer quando você respeita seu ritmo e não tenta fazer tudo ao mesmo tempo.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#ffd8e6]/40 bg-[#ffd8e6]/15 p-4 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                          Quando o dia pesa um pouco mais
                        </p>
                        <p className="text-sm font-semibold text-[#2f3a56]">
                          {weeklyInsight?.highlights.toughDays ??
                            'Os dias mais desafiadores costumam vir acompanhados de muita cobrança interna. Lembre-se: pedir ajuda ou fazer menos também é cuidado.'}
                        </p>
                      </div>
                    </div>
                  </SoftCard>

                  {/* Sugestões da semana */}
                  <div id="block-sugestoes">
                    <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/96 p-6 shadow-[0_10px_26px_rgba(0,0,0,0.16)] md:p-7">
                      <div className="mb-5 md:mb-6">
                        <h3 className="mb-1 text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon
                            name="lightbulb"
                            size={18}
                            className="text-[#ff005e]"
                            decorative
                          />
                          Sugestões Pensadas Para Você Esta Semana
                        </h3>
                        <p className="text-sm text-[#545454]">
                          Pequenas ideias práticas para cuidar de você sem se
                          sobrecarregar.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {weeklySuggestions.map((suggestion) => (
                          <div
                            key={suggestion.title}
                            className="rounded-2xl border border-[#ffd8e6] bg-white p-4 md:p-5 transition-colors hover:bg-[#ffd8e6]/8 space-y-2"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center rounded-full bg-[#ffd8e6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff005e]">
                                {suggestion.tag}
                              </span>
                              <h4 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                                {suggestion.title}
                              </h4>
                              <p className="text-sm text-[#545454]">
                                {suggestion.desc}
                              </p>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSaveSuggestionToPlanner(
                                    suggestion.tag,
                                    suggestion.title,
                                    suggestion.desc,
                                  )
                                }
                                className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#ff005e] transition-colors hover:text-[#ff005e]/85"
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
            </section>
          </Reveal>

          <MotivationalFooter routeKey="meu-dia-como-estou-hoje" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
