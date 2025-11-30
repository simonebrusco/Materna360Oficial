'use client'

import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
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

type WeeklySuggestion = {
  tag: string
  title: string
  desc: string
}

const DEFAULT_SUGGESTIONS: WeeklySuggestion[] = [
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

// Sugestões semanais via IA + fallback
async function fetchWeeklySuggestions(): Promise<WeeklySuggestion[]> {
  try {
    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_suggestions',
        origin: 'como-estou-hoje',
      }),
    })

    if (!res.ok) throw new Error('Resposta inválida da IA')

    const data = await res.json()
    const suggestions = data?.suggestions

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Sugestões vazias')
    }

    return suggestions.map((s: any): WeeklySuggestion => ({
      tag: s.tag ?? 'Sugestão',
      title: s.title ?? 'Ideia para esta semana',
      desc:
        s.desc ??
        'Uma pequena ação que pode deixar sua semana um pouco mais leve.',
    }))
  } catch (error) {
    console.error(
      '[Como Estou Hoje] Erro ao buscar sugestões semanais, usando fallback:',
      error,
    )
    return DEFAULT_SUGGESTIONS
  }
}

export default function ComoEstouHojePage() {
  const searchParams = useSearchParams()

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

  // Sugestões semanais
  const [weeklySuggestions, setWeeklySuggestions] = useState<WeeklySuggestion[]>(
    DEFAULT_SUGGESTIONS,
  )
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Refs para ancoragem dos atalhos do hub
  const humorRef = useRef<HTMLDivElement | null>(null)
  const notasRef = useRef<HTMLDivElement | null>(null)
  const insightRef = useRef<HTMLDivElement | null>(null)
  const semanaRef = useRef<HTMLDivElement | null>(null)

  const [highlightTarget, setHighlightTarget] = useState<
    'humor' | 'notas' | 'insight' | 'semana' | null
  >(null)

  // Hidratação
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Carregar dados persistidos
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

  // Carregar insight semanal
  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingWeeklyInsight(true)
      try {
        const result = await fetchWeeklyEmotionalInsight()
        if (isMounted) setWeeklyInsight(result)
      } finally {
        if (isMounted) setLoadingWeeklyInsight(false)
      }
    }

    loadInsight()
    return () => {
      isMounted = false
    }
  }, [])

  // Carregar insight diário
  useEffect(() => {
    let isMounted = true

    const loadDaily = async () => {
      setLoadingDailyInsight(true)
      try {
        const result = await fetchDailyEmotionalInsight()
        if (isMounted) setDailyInsight(result)
      } finally {
        if (isMounted) setLoadingDailyInsight(false)
      }
    }

    loadDaily()
    return () => {
      isMounted = false
    }
  }, [])

  // Carregar sugestões semanais
  useEffect(() => {
    let isMounted = true

    const loadSuggestions = async () => {
      setLoadingSuggestions(true)
      try {
        const result = await fetchWeeklySuggestions()
        if (isMounted) setWeeklySuggestions(result)
      } finally {
        if (isMounted) setLoadingSuggestions(false)
      }
    }

    loadSuggestions()
    return () => {
      isMounted = false
    }
  }, [])

  // Processar query ?abrir=
  useEffect(() => {
    if (!isHydrated) return
    const target = searchParams.get('abrir')
    if (!target) return

    const map: Record<string, React.RefObject<HTMLDivElement>> = {
      humor: humorRef,
      notas: notasRef,
      resumo: insightRef,
      semana: semanaRef,
    }

    const ref = map[target]
    if (ref?.current) {
      // pequeno delay para garantir layout pronto
      setTimeout(() => {
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        if (
          target === 'humor' ||
          target === 'notas' ||
          target === 'resumo' ||
          target === 'semana'
        ) {
          setHighlightTarget(
            target === 'resumo'
              ? 'insight'
              : (target as 'humor' | 'notas' | 'semana'),
          )
          setTimeout(() => setHighlightTarget(null), 1600)
        }
      }, 200)
    }
  }, [isHydrated, searchParams])

  const handleHumorSelect = (humor: string) => {
    const newValue = selectedHumor === humor ? null : humor
    setSelectedHumor(newValue)
    const humorKey = `como-estou-hoje:${currentDateKey}:humor`

    if (newValue) {
      save(humorKey, newValue)
      try {
        track('mood.registered', {
          tab: 'como-estou-hoje',
          mood: newValue,
        })
      } catch {}
      toast.success('Humor registrado!')
    } else {
      save(humorKey, '')
    }
  }

  const handleEnergySelect = (energy: string) => {
    const newValue = selectedEnergy === energy ? null : energy
    setSelectedEnergy(newValue)
    const energyKey = `como-estou-hoje:${currentDateKey}:energy`

    if (newValue) {
      save(energyKey, newValue)
      try {
        track('energy.registered', {
          tab: 'como-estou-hoje',
          energy: newValue,
        })
      } catch {}
      toast.success('Energia registrada!')
    } else {
      save(energyKey, '')
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
      payload: {
        text: dayNotes.trim(),
      },
    })

    try {
      track('day_notes.saved', {
        tab: 'como-estou-hoje',
      })
    } catch {}
    toast.success('Notas salvas no planner!')
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

  const handleSaveSuggestionToPlanner = (s: WeeklySuggestion) => {
    addItem({
      origin: 'como-estou-hoje',
      type: 'task',
      title: s.title,
      payload: {
        tag: s.tag,
        description: s.desc,
      },
    })

    try {
      track('weekly_suggestion.saved', {
        tab: 'como-estou-hoje',
        tag: s.tag,
      })
    } catch {}
    toast.success('Sugestão adicionada ao planner!')
  }

  const todayNotes = getByOrigin('como-estou-hoje').filter(
    (item) => item.type === 'note',
  )

  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Entenda seu dia com clareza, leveza e acolhimento."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* ================= HOJE – CARD DE VIDRO ================= */}
          <Reveal>
            <section
              className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/14 px-4 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-7 md:py-7"
            >
              {/* Glows */}
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.26)] blur-3xl" />
                <div className="absolute -bottom-16 -right-10 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.26)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6 md:space-y-7">
                {/* Header Hoje */}
                <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-white/18 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white uppercase">
                      Hoje
                    </span>
                    <h2 className="text-xl md:text-2xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                      Como Você Está Agora
                    </h2>
                    <p className="text-xs md:text-sm text-white/90 max-w-xl">
                      Registre seu humor, energia e um pequeno resumo do dia –
                      isso ajuda o Materna360 a cuidar melhor de você.
                    </p>
                  </div>
                </header>

                {/* Grid principal Hoje */}
                <div className="grid gap-6 md:grid-cols-2 md:gap-7">
                  {/* Coluna esquerda: Humor & Energia */}
                  <div
                    ref={humorRef}
                    className={`rounded-2xl bg-white/92 p-4 md:p-5 shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-white/80 transition-all ${
                      highlightTarget === 'humor'
                        ? 'ring-2 ring-[#ff005e] ring-offset-2 ring-offset-transparent'
                        : ''
                    }`}
                  >
                    <div className="mb-4">
                      <h3 className="mb-1 flex items-center gap-2 text-sm md:text-base font-semibold text-[#2f3a56]">
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
                    <div className="mb-5 space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2f3a56]">
                        Meu Humor
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Muito bem', 'Bem', 'Neutro', 'Cansada', 'Exausta'].map(
                          (humor) => (
                            <button
                              key={humor}
                              type="button"
                              onClick={() => handleHumorSelect(humor)}
                              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/40 ${
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
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2f3a56]">
                        Minha Energia
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Alta', 'Média', 'Baixa'].map((energy) => (
                          <button
                            key={energy}
                            type="button"
                            onClick={() => handleEnergySelect(energy)}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/40 ${
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

                    <p className="mt-4 border-t border-[#ffd8e6] pt-3 text-[11px] text-[#545454]">
                      ✓ Cada registro é um cuidado com você mesma – e ajuda o
                      Materna360 a entender seus padrões.
                    </p>
                  </div>

                  {/* Coluna direita: Notas + Insight do Dia */}
                  <div className="flex flex-col gap-4 md:gap-5">
                    {/* Notas do dia */}
                    <div
                      ref={notasRef}
                      className={`rounded-2xl bg-white/92 p-4 md:p-5 shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-white/80 transition-all ${
                        highlightTarget === 'notas'
                          ? 'ring-2 ring-[#ff005e] ring-offset-2 ring-offset-transparent'
                          : ''
                      }`}
                    >
                      <div className="mb-3">
                        <h3 className="mb-1 flex items-center gap-2 text-sm md:text-base font-semibold text-[#2f3a56]">
                          <AppIcon
                            name="pen"
                            size={16}
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

                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#2f3a56]">
                        Notas Do Dia
                      </label>
                      <textarea
                        value={dayNotes}
                        onChange={(e) => setDayNotes(e.target.value)}
                        placeholder="Conte para você mesma como foi o seu dia…"
                        className="w-full min-h-[90px] rounded-2xl border border-[#ffd8e6] bg-white p-3 text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:border-[#ff005e] focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30 resize-none"
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={!dayNotes.trim()}
                        >
                          Salvar no planner
                        </Button>
                      </div>

                      {todayNotes.length > 0 && (
                        <div className="mt-4 border-t border-[#ffd8e6] pt-3 space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                            Notas já salvas hoje
                          </p>
                          <ul className="space-y-1.5">
                            {todayNotes.map((item) => (
                              <li
                                key={item.id}
                                className="rounded-2xl bg-[#ffd8e6]/25 px-3 py-2 text-xs text-[#545454]"
                              >
                                {item.payload?.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Insight do dia */}
                    <div
                      ref={insightRef}
                      className={`rounded-2xl bg-gradient-to-r from-[#ffe3f1]/90 to-[#ffd8e6]/95 p-4 md:p-5 shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-white/80 transition-all ${
                        highlightTarget === 'insight'
                          ? 'ring-2 ring-[#9B4D96] ring-offset-2 ring-offset-transparent'
                          : ''
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <AppIcon
                          name="sparkles"
                          size={18}
                          className="text-[#9B4D96]"
                          decorative
                        />
                        <h3 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                          Insight Do Dia
                        </h3>
                      </div>

                      {loadingDailyInsight ? (
                        <p className="text-sm text-[#545454]">
                          Estou olhando com carinho para o seu dia para trazer
                          uma reflexão para você…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-[#545454] leading-relaxed mb-3">
                            {dailyInsight?.body ??
                              'Talvez hoje não tenha sido perfeito, mas perfeição nunca foi o objetivo. O que importa é que, mesmo cansada, você continua tentando fazer o melhor que consegue com o que tem.'}
                          </p>
                          <div className="rounded-2xl bg-white/70 px-3 py-2.5 border border-[#ffd8e6]/70">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9B4D96] mb-1">
                              Lembrete suave para hoje
                            </p>
                            <p className="text-xs md:text-sm text-[#545454]">
                              {dailyInsight?.gentleReminder ??
                                'Se conseguir, separe alguns minutos só seus – mesmo que seja para respirar fundo em silêncio.'}
                            </p>
                          </div>
                        </>
                      )}

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveDailyInsightToPlanner}
                          className="text-xs md:text-sm font-semibold text-[#9B4D96] hover:text-[#9B4D96]/80 inline-flex items-center gap-1"
                        >
                          Levar este insight para o planner
                          <AppIcon
                            name="arrow-right"
                            size={14}
                            decorative
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* ================= SEMANA – CARD DE VIDRO ================= */}
          <Reveal>
            <section
              ref={semanaRef}
              className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white/14 px-4 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-7 md:py-7 transition-all ${
                highlightTarget === 'semana'
                  ? 'ring-2 ring-[#ff005e] ring-offset-2 ring-offset-transparent'
                  : ''
              }`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -top-10 -right-6 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.26)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6 md:space-y-7">
                {/* Header Semana */}
                <header className="space-y-1">
                  <span className="inline-flex items-center rounded-full bg-white/18 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white uppercase">
                    Semana
                  </span>
                  <h2 className="text-xl md:text-2xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                    Como Sua Semana Tem Se Desenhado
                  </h2>
                  <p className="text-xs md:text-sm text-white/90 max-w-2xl">
                    Um olhar mais amplo para os seus dias: padrões emocionais e
                    pequenas ideias para deixar a semana mais leve.
                  </p>
                </header>

                <div className="grid gap-6 md:grid-cols-2 md:gap-7">
                  {/* Minha Semana Emocional */}
                  <div className="rounded-2xl bg-white/92 p-4 md:p-5 shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-white/80">
                    <div className="mb-4">
                      <h3 className="mb-1 flex items-center gap-2 text-sm md:text-base font-semibold text-[#2f3a56]">
                        <AppIcon
                          name="chart"
                          size={18}
                          className="text-[#ff005e]"
                          decorative
                        />
                        Minha Semana Emocional
                      </h3>
                      <p className="text-xs md:text-sm text-[#545454]">
                        Enxergue seus padrões emocionais com mais leveza – sem
                        julgamentos.
                      </p>
                    </div>

                    <div className="mb-4 rounded-2xl bg-[#ffd8e6]/14 border border-[#ffd8e6]/60 p-3.5">
                      {loadingWeeklyInsight ? (
                        <p className="text-sm text-[#545454]">
                          Estou olhando com carinho para os seus registros para
                          trazer um resumo da sua semana…
                        </p>
                      ) : (
                        <p className="text-sm text-[#545454] leading-relaxed">
                          {weeklyInsight?.summary ??
                            'Conforme você registra seu humor e sua energia, este espaço vai te mostrar com mais clareza como anda a sua semana – só com acolhimento.'}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-1">
                      <div className="rounded-2xl bg-[#ffd8e6]/18 border border-[#ffd8e6]/60 p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                          Quando seus dias fluem melhor
                        </p>
                        <p className="text-sm font-semibold text-[#2f3a56]">
                          {weeklyInsight?.highlights.bestDay ??
                            'Seus melhores dias costumam aparecer quando você respeita seu ritmo e não tenta fazer tudo ao mesmo tempo.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-[#ffd8e6]/18 border border-[#ffd8e6]/60 p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                          Quando o dia pesa um pouco mais
                        </p>
                        <p className="text-sm font-semibold text-[#2f3a56]">
                          {weeklyInsight?.highlights.toughDays ??
                            'Os dias mais desafiadores costumam vir acompanhados de muita cobrança interna. Lembre-se: pedir ajuda ou fazer menos também é cuidado.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sugestões da semana */}
                  <div className="rounded-2xl bg-white/92 p-4 md:p-5 shadow-[0_10px_26px_rgba(0,0,0,0.16)] border border-white/80">
                    <div className="mb-4">
                      <h3 className="mb-1 flex items-center gap-2 text-sm md:text-base font-semibold text-[#2f3a56]">
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

                    {loadingSuggestions ? (
                      <p className="text-sm text-[#545454]">
                        Preparando algumas ideias com carinho para a sua
                        semana…
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {weeklySuggestions.map((s, idx) => (
                          <div
                            key={`${s.title}-${idx}`}
                            className="rounded-2xl border border-[#ffd8e6] bg-white/90 p-3.5 hover:bg-[#ffd8e6]/6 transition-colors space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <span className="inline-flex items-center rounded-full bg-[#ffd8e6] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#ff005e] uppercase">
                                  {s.tag}
                                </span>
                                <h4 className="mt-1 text-sm font-semibold text-[#2f3a56]">
                                  {s.title}
                                </h4>
                                <p className="mt-1 text-xs md:text-sm text-[#545454]">
                                  {s.desc}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveSuggestionToPlanner(s)}
                                className="text-[11px] md:text-xs font-semibold text-[#ff005e] hover:text-[#ff005e]/80 inline-flex items-center gap-1"
                              >
                                Levar para o planner
                                <AppIcon
                                  name="arrow-right"
                                  size={14}
                                  decorative
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
