'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import ProfileForm from '@/components/blocks/ProfileForm'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import LegalFooter from '@/components/common/LegalFooter'

type WeeklyInsight = {
  title: string
  summary: string
  suggestions: string[]
}

type WeeklyInsightContext = {
  firstName?: string
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
    weekPoints?: number
    totalPoints?: number
    streak?: number
  }
}

/** ======= LocalStorage (mesmo namespace do Minha Jornada / Missões) ======= */
type MissionId = 'autocuidado' | 'conexao' | 'apoio' | 'limite'
const MISSION_IDS: MissionId[] = ['autocuidado', 'conexao', 'apoio', 'limite']

const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_', // mj_day_YYYY-MM-DD = number
  donePrefix: 'mj_done_', // mj_done_YYYY-MM-DD_autocuidado = 1
  streak: 'mj_streak',
}

type Badge = {
  id: string
  title: string
  minPoints: number
}

const BADGES: Badge[] = [
  { id: 'b-1', title: 'Primeiro passo', minPoints: 10 },
  { id: 'b-2', title: 'Dia possível', minPoints: 22 },
  { id: 'b-3', title: 'Presença real', minPoints: 40 },
  { id: 'b-4', title: 'Rotina mais leve', minPoints: 70 },
]

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeParseInt(v: string | null, fallback = 0) {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysKey(date: Date, delta: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getWeekKeys(anchor = new Date()) {
  const keys: string[] = []
  for (let i = -6; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

function readDayPoints(dayKey: string) {
  return safeParseInt(safeGetLS(LS.dayPrefix + dayKey), 0)
}

function readTotalPoints() {
  return safeParseInt(safeGetLS(LS.pointsTotal), 0)
}

function readStreak() {
  return safeParseInt(safeGetLS(LS.streak), 0)
}

function readDone(dayKey: string, missionId: MissionId) {
  return safeGetLS(`${LS.donePrefix}${dayKey}_${missionId}`) === '1'
}

/** ======= Insight semanal ======= */
async function fetchWeeklyInsight(context: WeeklyInsightContext): Promise<WeeklyInsight> {
  try {
    track('ai.request', {
      feature: 'weekly_overview',
      origin: 'eu360',
      daysWithPlanner: context.stats?.daysWithPlanner ?? null,
      moodCheckins: context.stats?.moodCheckins ?? null,
      unlockedAchievements: context.stats?.unlockedAchievements ?? null,
      todayMissionsDone: context.stats?.todayMissionsDone ?? null,
      weekPoints: context.stats?.weekPoints ?? null,
      totalPoints: context.stats?.totalPoints ?? null,
      streak: context.stats?.streak ?? null,
    })

    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'eu360',
        context,
      }),
    })

    if (!res.ok) throw new Error('Resposta inválida')

    const data = await res.json()
    const insight = data?.weeklyInsight
    if (!insight || typeof insight !== 'object') throw new Error('Insight vazio')

    return {
      title: insight.title ?? 'Seu resumo emocional da semana',
      summary:
        insight.summary ??
        'Pelos seus registros recentes, esta semana teve cansaço, mas também pequenas vitórias.',
      suggestions:
        Array.isArray(insight.suggestions) && insight.suggestions.length > 0
          ? insight.suggestions
          : [
              'Separe um momento curto para olhar com carinho para o que você já deu conta.',
              'Escolha apenas uma prioridade por dia para aliviar a sensação de cobrança.',
            ],
    }
  } catch (error) {
    console.error('[Eu360] fallback insight semanal:', error)
    return {
      title: 'Seu resumo emocional da semana',
      summary:
        'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos.',
      suggestions: [
        'Proteja ao menos um momento do dia que te faz bem, mesmo que sejam 10 minutos.',
        'Perceba o que está drenando sua energia e veja o que pode ser simplificado.',
      ],
    }
  }
}

export default function Eu360Client() {
  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  /** ======= Stats reais (derivadas do mesmo LS das Missões/Jornada) ======= */
  const [stats, setStats] = useState<WeeklyInsightContext['stats']>({
    daysWithPlanner: 0,
    moodCheckins: 0,
    unlockedAchievements: 0,
    todayMissionsDone: 0,
    weekPoints: 0,
    totalPoints: 0,
    streak: 0,
  })

  const computed = useMemo(() => {
    const t = todayKey()
    const weekKeys = getWeekKeys(new Date())

    const totalPoints = readTotalPoints()
    const weekPoints = weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0)

    // “Dias com planner” aqui vira: dias ativos com missão/pontos.
    // (Quando conectarmos planner real, trocamos sem quebrar UI.)
    const daysWithPlanner = weekKeys.filter(k => readDayPoints(k) > 0).length

    // “Check-ins de humor” ainda não existe fonte real explícita;
    // por enquanto, usamos “missões feitas hoje” como sinal de presença (e deixamos pronto para trocar).
    const todayMissionsDone = MISSION_IDS.filter(id => readDone(t, id)).length

    const unlockedAchievements = BADGES.filter(b => totalPoints >= b.minPoints).length
    const streak = readStreak()

    return {
      daysWithPlanner,
      moodCheckins: 0,
      unlockedAchievements,
      todayMissionsDone,
      weekPoints,
      totalPoints,
      streak,
    }
  }, [])

  function refreshStats() {
    // recalcula a partir do LS; simples e seguro
    const t = todayKey()
    const weekKeys = getWeekKeys(new Date())
    const totalPoints = readTotalPoints()
    const weekPoints = weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0)
    const daysWithPlanner = weekKeys.filter(k => readDayPoints(k) > 0).length
    const todayMissionsDone = MISSION_IDS.filter(id => readDone(t, id)).length
    const unlockedAchievements = BADGES.filter(b => totalPoints >= b.minPoints).length
    const streak = readStreak()

    setStats({
      daysWithPlanner,
      moodCheckins: 0,
      unlockedAchievements,
      todayMissionsDone,
      weekPoints,
      totalPoints,
      streak,
    })
  }

  useEffect(() => {
    // inicializa
    setStats(computed)

    // atualiza ao voltar para a aba (usuária marcou missões no Meu Dia e voltou)
    const onFocus = () => refreshStats()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshStats()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** ======= Insight semanal alimentado por stats reais ======= */
  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingInsight(true)
      try {
        const result = await fetchWeeklyInsight({
          firstName,
          stats,
        })
        if (isMounted) setWeeklyInsight(result)
      } finally {
        if (isMounted) setLoadingInsight(false)
      }
    }

    void loadInsight()

    return () => {
      isMounted = false
    }
  }, [
    firstName,
    stats.daysWithPlanner,
    stats.moodCheckins,
    stats.unlockedAchievements,
    stats.todayMissionsDone,
    stats.weekPoints,
    stats.totalPoints,
    stats.streak,
  ])

  const content = (
    <main
      data-layout="page-template-v1"
      data-tab="eu360"
      className="
        relative
        min-h-[100dvh]
        pb-24
        overflow-hidden

        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_10%,#8b3563_22%,#fd2597_40%,#fdbed7_68%,#ffe1f1_88%,#fff7fa_100%)]
      "
    >
      {/* overlays premium */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.26)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 top-0 h-20
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),rgba(255,255,255,0.00))]
        "
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            EU360
          </span>

          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
            Seu mundo em perspectiva
          </h1>

          <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]">
            Conte um pouco sobre você e a fase da sua família. Isso ajuda o
            Materna360 a cuidar de você com sugestões mais reais para a sua
            rotina.
          </p>
        </header>

        <div className="space-y-6 md:space-y-7 pb-8">
          {/* 1 — WIZARD DO PERFIL */}
          <ProfileForm />

          {/* 2 — PAINEL DA JORNADA (conectado) */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-ink-muted)]">
                      Painel da sua jornada
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-ink)] leading-snug">
                      Um olhar rápido sobre como você vem caminhando
                    </h2>
                    <p className="mt-1 text-[12px] text-[var(--color-ink-muted)] leading-relaxed">
                      {firstName}, isso aqui é para trazer clareza — não cobrança.
                    </p>
                  </div>
                  <AppIcon
                    name="sparkles"
                    className="h-6 w-6 text-[var(--color-brand)] hidden md:block"
                  />
                </div>

                {/* mini métricas */}
                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="rounded-2xl bg-[var(--color-soft-bg)] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                      Dias ativos (7)
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {stats.daysWithPlanner ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-soft-bg)] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                      Missões hoje
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {stats.todayMissionsDone ?? 0}/4
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-soft-bg)] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                      Conquistas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {stats.unlockedAchievements ?? 0}
                    </p>
                  </div>
                </div>

                {/* CTAs de conexão (o que conversa com o resto do app) */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <Link href="/meu-dia" className="w-full md:w-auto">
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)] hover:opacity-95 transition"
                      onClick={() => {
                        try {
                          track('eu360.cta', { target: 'meu-dia' })
                        } catch {}
                      }}
                    >
                      Ir para Meu Dia (missões e planner)
                    </button>
                  </Link>

                  <Link href="/maternar/minha-jornada" className="w-full md:w-auto">
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-[var(--color-ink)] border border-[#F5D7E5] hover:bg-[#ffe1f1] transition"
                      onClick={() => {
                        try {
                          track('eu360.cta', { target: 'minha-jornada' })
                        } catch {}
                      }}
                    >
                      Ver Minha Jornada (selos e progresso)
                    </button>
                  </Link>
                </div>

                {/* insight emocional da semana */}
                <SoftCard className="mt-2 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/80 px-4 py-4 md:px-5 md:py-5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <AppIcon
                          name="heart"
                          size={20}
                          className="text-[var(--color-brand)]"
                          decorative
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-[0.16em]">
                          Olhar carinhoso sobre a sua semana
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[var(--color-ink)] leading-snug">
                          {weeklyInsight?.title || 'Seu resumo emocional da semana'}
                        </h3>
                        <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                          {firstName}, este espaço é para te ajudar a enxergar seus últimos dias com mais gentileza.
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2.5">
                      {loadingInsight ? (
                        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                          Estou olhando com carinho para a sua semana para trazer uma reflexão…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                            {weeklyInsight?.summary ??
                              'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo.'}
                          </p>

                          {weeklyInsight?.suggestions && weeklyInsight.suggestions.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-[0.16em]">
                                Pequenos passos para os próximos dias
                              </p>
                              <ul className="space-y-1.5 text-sm text-[var(--color-ink)]">
                                {weeklyInsight.suggestions.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="text-[11px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">
                            Isso não é um diagnóstico. É um convite para se observar com mais leveza e cuidado.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </SoftCard>
              </SoftCard>
            </Reveal>
          </SectionWrapper>

          {/* 3 — BANNER DE PLANOS */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl border border-white/60 bg-[radial-gradient(circle_at_top_left,#fd2597_0,#b8236b_45%,#fdbed7_100%)] px-6 py-6 md:px-8 md:py-7 shadow-[0_24px_60px_rgba(0,0,0,0.32)] text-white overflow-hidden relative">
                <div className="absolute -right-20 -bottom-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">
                      Materna360+
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold leading-snug text-white">
                      Leve o Materna360 para o próximo nível
                    </h2>
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      Desbloqueie conteúdos exclusivos, acompanhamento mais próximo e ferramentas avançadas.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <Link href="/planos">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-semibold bg-white text-[var(--color-brand)] shadow-[0_10px_26px_rgba(0,0,0,0.24)] hover:bg-[#ffe1f1] transition-colors"
                      >
                        Conhecer os planos
                      </button>
                    </Link>
                    <p className="text-[11px] text-white/85 md:text-right max-w-xs">
                      Planos pensados para diferentes fases — você escolhe o que faz sentido agora.
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </SectionWrapper>
        </div>
      </div>

      <LegalFooter />
    </main>
  )

  return (
    <AppShell>
      <ClientOnly>{content}</ClientOnly>
    </AppShell>
  )
}
