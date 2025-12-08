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
import { Button } from '@/components/ui/Button'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'

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
    // Telemetria simples de requisição de IA
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

function Eu360Inner() {
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

  return (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-28 bg-[#FFE8F2] bg-[radial-gradient(circle_at_top,#fd2597_0,#FFD8E6_40%,#FFE8F2_100%)]"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            EU360
          </span>

          <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            Seu mundo em perspectiva
          </h1>

          <p className="mt-2 text-sm md:text-base text-white/85 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
            Conte um pouco sobre você e a fase da sua família. Isso ajuda o
            Materna360 a cuidar de você com sugestões mais reais para a sua
            rotina.
          </p>
        </header>

        <div className="space-y-6 md:space-y-7 pb-10">
          {/* 1 — WIZARD DO PERFIL */}
          <ProfileForm />

          {/* 2 — PAINEL DA JORNADA */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_4px_14px_rgba(0,0,0,0.04)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">
                      Painel da sua jornada
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#545454] leading-snug">
                      Um olhar rápido sobre como você vem cuidando de vocês
                    </h2>
                  </div>
                  <AppIcon
                    name="sparkles"
                    className="h-6 w-6 text-[#fd2597] hidden md:block"
                  />
                </div>

                {/* mini métricas */}
                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6A6A6A]">
                      Dias com planner
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">
                      {mockStats.daysWithPlanner}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6A6A6A]">
                      Check-ins de humor
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">
                      {mockStats.moodCheckins}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6A6A6A]">
                      Conquistas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">
                      {mockStats.unlockedAchievements}
                    </p>
                  </div>
                </div>

                {/* insight emocional da semana */}
                <SoftCard className="mt-2 rounded-2xl border border-[#F5D7E5] bg-[#FFF5FA] px-4 py-4 md:px-5 md:py-5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <AppIcon
                          name="heart"
                          size={20}
                          className="text-[#fd2597]"
                          decorative
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-[#6A6A6A] uppercase tracking-[0.16em]">
                          Olhar carinhoso sobre a sua semana
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#545454] leading-snug">
                          {weeklyInsight?.title ||
                            'Seu resumo emocional da semana'}
                        </h3>
                        <p className="text-[11px] text-[#6A6A6A] leading-relaxed">
                          {firstName}, este espaço é para te ajudar a enxergar
                          seus últimos dias com mais gentileza, não para te
                          cobrar mais nada.
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2.5">
                      {loadingInsight ? (
                        <p className="text-sm text-[#6A6A6A] leading-relaxed">
                          Estou olhando com carinho para a sua semana para
                          trazer uma reflexão pra você…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[#545454]">
                            {weeklyInsight?.summary ??
                              'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.'}
                          </p>

                          {weeklyInsight?.suggestions &&
                            weeklyInsight.suggestions.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-[#6A6A6A] uppercase tracking-[0.16em]">
                                  Pequenos passos para os próximos dias
                                </p>
                                <ul className="space-y-1.5 text-sm text-[#545454]">
                                  {weeklyInsight.suggestions.map((item, idx) => (
                                    <li key={idx}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          <p className="text-[11px] text-[#6A6A6A] mt-2 leading-relaxed">
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

          {/* 3 — BANNER DE PLANOS (AGORA 100% NA PALETA OFICIAL) */}
          <SectionWrapper>
            <Reveal>
              <SoftCard
                className="
                  rounded-3xl
                  border border-white/50
                  bg-[linear-gradient(to_right,#fd2597_0%,#b8236b_45%,#fdbed7_100%)]
                  px-6 py-7 md:px-8 md:py-10
                  shadow-[0_14px_40px_rgba(0,0,0,0.22)]
                  text-white
                  relative
                  overflow-hidden
                "
              >
                <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-white/18 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                  {/* Texto principal */}
                  <div className="max-w-xl space-y-3">
                    <p className="text-[11px] tracking-[0.28em] font-semibold uppercase text-white/80">
                      MATERNA360+
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold leading-snug text-white">
                      Leve o Materna360 para o próximo nível
                    </h2>

                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      Desbloqueie conteúdos exclusivos, acompanhamento mais
                      próximo e ferramentas avançadas para cuidar de você, da
                      sua rotina e da sua família.
                    </p>
                  </div>

                  {/* CTA + texto lateral */}
                  <div className="flex flex-col items-center md:items-end gap-4">
                   <Link href="/planos">
  <Button
    type="button"
    variant="primary"
    className="px-6 py-3 rounded-full text-sm font-semibold bg-white !text-[#fd2597] shadow-[0_10px_28px_rgba(0,0,0,0.24)] hover:bg-[#ffe1f1] hover:!text-[#b8236b] transition"
  >
    Conhecer os planos
  </Button>
</Link>
                    <p className="max-w-xs text-center md:text-right text-[11px] text-white/85 leading-relaxed">
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
    </main>
  )
}

export default function Eu360Client() {
  return (
    <AppShell>
      <ClientOnly>
        <Eu360Inner />
      </ClientOnly>
    </AppShell>
  )
}
