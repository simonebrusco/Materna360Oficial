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
    console.error('[Como Estou Hoje] Erro ao buscar insight semanal, usando fallback:', error)
    // Fallback carinhoso, sem exposição de "IA" para a mãe
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
      title:
        inspiration.phrase ??
        'Um olhar gentil para o seu dia',
      body:
        inspiration.care ??
        'Pelos sinais que você tem dado, parece que o dia de hoje veio com uma mistura de cansaço e responsabilidade. Mesmo assim, você continua aparecendo para a sua família – isso já é enorme.',
      gentleReminder:
        inspiration.ritual ??
        'Você não precisa fazer tudo hoje. Escolha uma coisa importante e permita que o resto seja “suficientemente bom”.',
    }
  } catch (error) {
    console.error('[Como Estou Hoje] Erro ao buscar insight do dia, usando fallback:', error)
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

export default function ComoEstouHojePage() {
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

  // Mark as hydrated on mount
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data (humor/energia/notas)
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

  // Load weekly emotional insight once
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
        if (isMounted) {
          setLoadingWeeklyInsight(false)
        }
      }
    }

    loadInsight()

    return () => {
      isMounted = false
    }
  }, [])

  // Load daily emotional insight once
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
        if (isMounted) {
          setLoadingDailyInsight(false)
        }
      }
    }

    loadDaily()

    return () => {
      isMounted = false
    }
  }, [])

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
      },
    })

    try {
      track('daily_insight.saved', {
        tab: 'como-estou-hoje',
      })
    } catch {}
    toast.success('Insight salvo no planner!')
  }

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
                  {getByOrigin('como-estou-hoje').filter((item) => item.type === 'note').length >
                    0 && (
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

            {/* CARD 3: Insight do Dia (agora conectado e integrado ao Planner) */}
            <Reveal delay={100}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#9B4D96]/20 shadow-[0_4px_12px_rgba(155,77,150,0.08)]">
                <div className="mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                    <AppIcon name="sparkles" size={18} className="text-[#9B4D96]" decorative />
                    Insight do Dia
                  </h3>
                </div>

                <div className="space-y-4">
                  {loadingDailyInsight ? (
                    <p className="text-sm leading-relaxed text-[#545454]">
                      Estou olhando com carinho para o seu dia para trazer uma reflexão para você…
                    </p>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-[#545454]">
                        {dailyInsight?.body ??
                          'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.'}
                      </p>
                      <div className="rounded-2xl bg-[#ffd8e6]/20 border border-[#ffd8e6]/60 p-3">
                        <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-1">
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
                      className="mt-2 text-sm font-semibold text-[#9B4D96] hover:text-[#9B4D96]/80 transition-colors flex items-center gap-1"
                    >
                      Levar este insight para o planner
                      <AppIcon name="arrow-right" size={14} decorative />
                    </button>
                  </div>
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

            {/* CARD 4: Minha Semana Emocional (conectado à IA) */}
            <Reveal delay={150}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                    <AppIcon name="chart" size={18} className="text-[#ff005e]" decorative />
                    Minha Semana Emocional
                  </h3>
                  <p className="text-sm text-[#545454]">
                    Enxergue seus padrões emocionais com mais leveza.
                  </p>
                </div>

                {/* Texto principal da semana */}
                <div className="mb-6 p-5 rounded-2xl bg-[#ffd8e6]/10 border border-[#ffd8e6]/50">
                  {loadingWeeklyInsight ? (
                    <p className="text-sm text-[#545454]">
                      Estou olhando com carinho para os seus registros para trazer um resumo da sua
                      semana…
                    </p>
                  ) : (
                    <p className="text-sm text-[#545454] leading-relaxed">
                      {weeklyInsight?.summary ??
                        'Conforme você registra seu humor e sua energia, este espaço vai te mostrar com mais clareza como anda a sua semana – sem julgamento, só com acolhimento.'}
                    </p>
                  )}
                </div>

                {/* Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-4 space-y-2">
                    <p className="text-xs text-[#545454] font-medium uppercase tracking-wide">
                      Quando seus dias fluem melhor
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">
                      {weeklyInsight?.highlights.bestDay ??
                        'Seus melhores dias costumam aparecer quando você respeita seu ritmo e não tenta fazer tudo ao mesmo tempo.'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#ffd8e6]/15 border border-[#ffd8e6]/40 p-4 space-y-2">
                    <p className="text-xs text-[#545454] font-medium uppercase tracking-wide">
                      Quando o dia pesa um pouco mais
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">
                      {weeklyInsight?.highlights.toughDays ??
                        'Os dias mais desafiadores costumam vir acompanhados de muita cobrança interna. Lembre-se: pedir ajuda ou fazer menos também é cuidado.'}
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 5: Sugestões para a Mãe */}
            <Reveal delay={200}>
              <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <div className="mb-6">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
                    <AppIcon name="lightbulb" size={18} className="text-[#ff005e]" decorative />
                    Sugestões pensadas para você esta semana
                  </h3>
                  <p className="text-sm text-[#545454]">
                    Pequenas ideias que fazem diferença no seu bem-estar.
                  </p>
                </div>

                {/* Suggestions Grid */}
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
                            <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-2.5 py-1 text-xs font-semibold tracking-wide text-[#ff005e] uppercase">
                              {suggestion.tag}
                            </span>
                          </div>
                          <h4 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-[#545454] mt-1.5">
                            {suggestion.desc}
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
