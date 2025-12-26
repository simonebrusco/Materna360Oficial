'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import BackToMaternar from '@/components/common/BackToMaternar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type HubSectionId = 'visao' | 'como-funciona' | 'para-quem' | 'faixa' | 'planos'

const HUB_SECTIONS: { id: HubSectionId; label: string }[] = [
  { id: 'visao', label: 'Visão' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'para-quem', label: 'Para quem é' },
  { id: 'faixa', label: 'Faixa etária' },
  { id: 'planos', label: 'Planos' },
]

type AgeBand = '0-1' | '1-3' | '3-5' | '5-8'
const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: '0-1', label: '0–1 ano' },
  { id: '1-3', label: '1–3 anos' },
  { id: '3-5', label: '3–5 anos' },
  { id: '5-8', label: '5–8 anos' },
]

type PlanId = 'mensal' | 'trimestral' | 'semestral' | 'anual'
type Plan = {
  id: PlanId
  kicker: string
  title: string
  price: string
  note: string
  bullets: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'mensal',
    kicker: 'COMECE LEVE',
    title: 'Plano mensal',
    price: 'R$ 99/mês',
    note: 'Sem compromisso longo.',
    bullets: ['1 caixa por mês', 'Brinquedo + guia', 'Surpresa do mês'],
  },
  {
    id: 'trimestral',
    kicker: 'RITMO CONSTANTE',
    title: 'Plano trimestral',
    price: 'R$ 279',
    note: '3 meses com consistência.',
    bullets: ['3 caixas', 'Prioridade na fila', 'Melhor custo/caixa'],
  },
  {
    id: 'semestral',
    kicker: 'PRESENÇA NA ROTINA',
    title: 'Plano semestral',
    price: 'R$ 534',
    note: '6 meses de rituais.',
    bullets: ['6 caixas', 'Bônus surpresa', 'Curadoria contínua'],
  },
  {
    id: 'anual',
    kicker: 'EXPERIÊNCIA COMPLETA',
    title: 'Plano anual',
    price: 'R$ 948',
    note: '12 meses — melhor custo.',
    bullets: ['12 caixas', 'Bônus premium', 'VIP na curadoria'],
    highlight: true,
  },
]

export default function MaternaBoxPage() {
  const [activeSection, setActiveSection] = useState<HubSectionId>('visao')
  const [selectedAge, setSelectedAge] = useState<AgeBand>('3-5')
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('mensal')

  const scrollTo = (id: HubSectionId) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`maternabox-${id}`)
    if (!el) return

    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    const offsetTop = rect.top + window.scrollY - headerOffset

    window.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ids: HubSectionId[] = ['visao', 'como-funciona', 'para-quem', 'faixa', 'planos']
    const elements = ids
      .map((id) => document.getElementById(`maternabox-${id}`))
      .filter(Boolean) as HTMLElement[]

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0]
        if (!visible?.target?.id) return

        const sectionId = visible.target.id.replace('maternabox-', '') as HubSectionId
        if (sectionId && ids.includes(sectionId)) setActiveSection(sectionId)
      },
      { root: null, rootMargin: '-120px 0px -55% 0px', threshold: [0.05, 0.15, 0.25, 0.35] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const Pill = ({ id, label }: { id: HubSectionId; label: string }) => {
    const isActive = activeSection === id
    return (
      <button
        type="button"
        onClick={() => {
          setActiveSection(id)
          scrollTo(id)
        }}
        className={[
          'rounded-full border px-3 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors',
          isActive
            ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
            : 'border-[#F5D7E5] bg-white/70 text-[#545454] hover:border-[#fd2597] hover:bg-[#ffe1f1]',
        ].join(' ')}
      >
        {label}
      </button>
    )
  }

  const selectedPlanData = useMemo(
    () => PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0],
    [selectedPlan],
  )

  return (
    <PageTemplate
  headerTone="light"
  label="MATERNAR"
  title="MaternaBox"
  subtitle="Uma caixa mensal com rituais prontos para gerar conexão — sem dar mais trabalho."
  showLabel={false}
  headerTop={<BackToMaternar className="px-0" />}
    >
      <ClientOnly>
        <div className="pb-12 space-y-8 md:space-y-10">
          <Reveal>
            <SoftCard
              id="maternabox-visao"
              className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-5 md:space-y-6">
                <div className="max-w-3xl space-y-2.5">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    MATERNABOX · ASSINATURA
                  </p>

                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Você escolhe o plano. A gente entrega o ritual pronto.
                  </h2>

                  <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                    Todo mês: brinquedo/atividade + guia curto com “como usar” e uma surpresa.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                    MENU
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {HUB_SECTIONS.map((s) => (
                      <Pill key={s.id} id={s.id} label={s.label} />
                    ))}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#545454]">
                      Se estiver com pressa: vá direto para <span className="font-semibold">Planos</span>.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-[13px] px-5 py-2"
                      onClick={() => scrollTo('planos')}
                    >
                      Ver planos
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Pronto para usar</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Sem pesquisar atividades. Só abrir e fazer.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Pouco tempo</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Ideias que cabem na rotina real.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Por fase</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Ajuste por faixa etária.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* O restante do seu conteúdo segue igual (como-funciona / para-quem / faixa / planos) */}
          {/* ... cole aqui sem mudar nada ... */}

          <MotivationalFooter routeKey="maternabox" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
