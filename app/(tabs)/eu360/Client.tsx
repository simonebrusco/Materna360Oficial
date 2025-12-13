'use client'

import { useEffect, useState } from 'react'
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
  }
}

// Busca insight semanal emocional com fallback carinhoso e contexto opcional
async function fetchWeeklyInsight(
  context: WeeklyInsightContext,
): Promise<WeeklyInsight> {
  try {
    track('ai.request', {
      feature: 'weekly_overview',
      origin: 'eu360',
      daysWithPlanner: context.stats?.daysWithPlanner ?? null,
      moodCheckins: context.stats?.moodCheckins ?? null,
      unlockedAchievements: context.stats?.unlockedAchievements ?? null,
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

    if (!res.ok) {
      throw new Error('Resposta inválida da IA')
    }

    const data = await res.json()
    const insight = data?.weeklyInsight

    if (!insight || typeof insight !== 'object') {
      throw new Error('Insight semanal vazio')
    }

    return {
      title: insight.title ?? 'Seu resumo emocional da semana',
      summary:
        insight.summary ??
        'Pelos seus registros recentes, esta semana parece ter sido marcada por momentos de cansaço, mas também por pequenas vitórias.',
      suggestions:
        Array.isArray(insight.suggestions) && insight.suggestions.length > 0
          ? insight.suggestions
          : [
              'Separe um momento curto para olhar com carinho para o que você já deu conta.',
              'Escolha apenas uma prioridade por dia para aliviar a sensação de cobrança.',
            ],
    }
  } catch (error) {
    console.error(
      '[Eu360] Erro ao buscar insight semanal, usando fallback:',
      error,
    )
    return {
      title: 'Seu resumo emocional da semana',
      summary:
        'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.',
      suggestions: [
        'Proteja ao menos um momento do dia que te faz bem, mesmo que sejam 10 minutos.',
        'Perceba quais situações estão drenando demais sua energia e veja o que pode ser simplificado.',
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

  // mockzinho de métricas até conectar com Minhas conquistas
  const mockStats = {
    daysWithPlanner: 7,
    moodCheckins: 4,
    unlockedAchievements: 3,
  }

  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingInsight(true)
      try {
        const result = await fetchWeeklyInsight({
          firstName,
          stats: mockStats,
        })
        if (isMounted) {
          setWeeklyInsight(result)
        }
      } finally {
        if (isMounted) {
          setLoadingInsight(false)
        }
      }
    }

    void loadInsight()

    return () => {
      isMounted = false
    }
  }, [
    firstName,
    mockStats.daysWithPlanner,
    mockStats.moodCheckins,
    mockStats.unlockedAchievements,
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
      {/* overlays premium (acabamento, sem mexer no layout interno) */}
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

          {/* 2 — PAINEL DA JORNADA */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-ink-muted)]">
                      Painel da sua jornada
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-ink)] leading-snug">
                      Um olhar rápido sobre como você vem cuidando de vocês
                    </h2>
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
                      Dias com planner
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {mockStats.daysWithPlanner}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-soft-bg)] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                      Check-ins de humor
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {mockStats.moodCheckins}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--color-soft-bg)] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                      Conquistas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[var(--color-brand)]">
                      {mockStats.unlockedAchievements}
                    </p>
                  </div>
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
                          {weeklyInsight?.title ||
                            'Seu resumo emocional da semana'}
                        </h3>
                        <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                          {firstName}, este espaço é para te ajudar a enxergar
                          seus últimos dias com mais gentileza, não para te
                          cobrar mais nada.
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2.5">
                      {loadingInsight ? (
                        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                          Estou olhando com carinho para a sua semana para
                          trazer uma reflexão pra você…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                            {weeklyInsight?.summary ??
                              'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.'}
                          </p>

                          {weeklyInsight?.suggestions &&
                            weeklyInsight.suggestions.length > 0 && (
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
                            Isso não é um diagnóstico, e sim um convite para
                            você se observar com mais leveza e cuidado. Um passo
                            de cada vez já é muito.
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
                      Desbloqueie conteúdos exclusivos, acompanhamento mais
                      próximo e ferramentas avançadas para cuidar de você, da
                      sua rotina e da sua família.
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
                      Planos pensados para diferentes fases da maternidade —
                      você escolhe o que faz mais sentido agora.
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </SectionWrapper>
        </div>
      </div>

      {/* Rodapé legal padrão */}
      <LegalFooter />
    </main>
  )

  return (
    <AppShell>
      <ClientOnly>{content}</ClientOnly>
    </AppShell>
  )
}
