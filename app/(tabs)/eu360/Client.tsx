'use client'

import { useEffect, useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { ProfileForm } from '@/components/blocks/ProfileForm'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'

type WeeklyInsight = {
  title: string
  summary: string
  suggestions: string[]
}

// Busca insight semanal emocional com fallback carinhoso
async function fetchWeeklyInsight(): Promise<WeeklyInsight> {
  try {
    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'eu360',
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
        'Pelos seus registros recentes, esta semana parece ter sido marcada por momentos de cansaço, mas também por pequenas vitórias. Você não precisa acertar o tempo todo – o fato de estar olhando para isso já mostra o quanto você se importa.',
      suggestions:
        Array.isArray(insight.suggestions) && insight.suggestions.length > 0
          ? insight.suggestions
          : [
              'Separe um momento curto para olhar com carinho para o que você já deu conta.',
              'Escolha apenas uma prioridade por dia para aliviar a sensação de cobrança.',
            ],
    }
  } catch (error) {
    console.error('[Eu360] Erro ao buscar insight semanal, usando fallback:', error)
    // Fallback suave, sem falar “IA” pra mãe
    return {
      title: 'Seu resumo emocional da semana',
      summary:
        'Pelos seus registros recentes, esta semana parece ter sido marcada por cansaço, mas também por pequenas vitórias. Você não precisa dar conta de tudo – o fato de se observar já é um gesto enorme de cuidado com você e com a sua família.',
      suggestions: [
        'Proteja ao menos um momento do dia que te faz bem, mesmo que sejam 10 minutos.',
        'Perceba quais situações estão drenando demais sua energia e veja o que pode ser simplificado.',
      ],
    }
  }
}

export default function Eu360Client() {
  // Page-view telemetry on mount
  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Busca insight semanal uma vez ao carregar a página
  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingInsight(true)
      try {
        const result = await fetchWeeklyInsight()
        if (isMounted) {
          setWeeklyInsight(result)
        }
      } finally {
        if (isMounted) {
          setLoadingInsight(false)
        }
      }
    }

    loadInsight()

    return () => {
      isMounted = false
    }
  }, [])

  const content = (
    <main
      data-layout="page-template-v1"
      className="min-h-[100dvh] pb-24 bg-[radial-gradient(circle_at_top_left,#9B4D96_0,#FF1475_35%,#FFD3E6_70%,#FFFFFF_100%)]"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <PageTemplate
          label="EU360"
          title="Seu mundo em perspectiva"
          subtitle="Conte um pouco sobre você e a fase da sua família."
        >
          {/* Bloco principal: perfil da mãe/família */}
          <SectionWrapper>
            <ProfileForm />
          </SectionWrapper>

          {/* Bloco: Insight emocional da semana */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl border border-white/40 bg-white/18 px-6 py-6 md:px-8 md:py-8 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AppIcon
                        name="sparkles"
                        size={20}
                        className="text-[#FF1475]"
                        decorative
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-[0.16em]">
                        Olhar carinhoso sobre a sua semana
                      </p>
                      <h3 className="text-base md:text-lg font-semibold text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                        {weeklyInsight?.title || 'Seu resumo emocional da semana'}
                      </h3>
                      <p className="text-xs text-white/85 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                        {firstName}, este espaço é para te ajudar a enxergar seus últimos dias com
                        mais gentileza, não para te cobrar mais nada.
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-3">
                    {loadingInsight && (
                      <p className="text-sm text-white/85 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                        Estou olhando com carinho para a sua semana para trazer uma reflexão pra
                        você…
                      </p>
                    )}

                    {!loadingInsight && (
                      <>
                        <p className="text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                          {weeklyInsight?.summary ??
                            'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.'}
                        </p>

                        {weeklyInsight?.suggestions && weeklyInsight.suggestions.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-white/85 uppercase tracking-[0.16em]">
                              Pequenos passos para os próximos dias
                            </p>
                            <ul className="space-y-1.5 text-sm text-white/90">
                              {weeklyInsight.suggestions.map((item, idx) => (
                                <li key={idx} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-[11px] text-white/80 mt-2 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                          Isso não é um diagnóstico, e sim um convite para você se observar com mais
                          leveza e cuidado. Um passo de cada vez já é muito.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </SectionWrapper>
        </PageTemplate>
      </div>
    </main>
  )

  return (
    <AppShell>
      <ClientOnly>{content}</ClientOnly>
    </AppShell>
  )
}
