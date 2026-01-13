// app/(tabs)/maternar/materna-plus/maternabox/page.tsx
'use client'

import React, { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import Image from 'next/image'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import BackToMaternar from '@/components/common/BackToMaternar'

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
  subtitle: string
  bullets: string[]
  highlight?: boolean
}

/**
 * IMPORTANTE (Governança / Pré-monetização)
 * - Não fixar preços/regras operacionais aqui.
 * - “Planos” nesta fase = estrutura de escolha (ritmo), sem checkout real.
 */
const PLANS: Plan[] = [
  {
    id: 'mensal',
    kicker: 'COMECE LEVE',
    title: 'Mensal',
    subtitle: 'Para testar com calma, no seu ritmo.',
    bullets: ['1 caixa por mês', 'Curadoria por fase', 'Guia curto de uso'],
  },
  {
    id: 'trimestral',
    kicker: 'RITMO CONSTANTE',
    title: 'Trimestral',
    subtitle: 'Para manter consistência sem pensar todo mês.',
    bullets: ['Ritmo por trimestre', 'Curadoria contínua', 'Ajuste de faixa quando precisar'],
  },
  {
    id: 'semestral',
    kicker: 'PRESENÇA NA ROTINA',
    title: 'Semestral',
    subtitle: 'Para quem quer construir hábito com leveza.',
    bullets: ['Ritmo por semestre', 'Atividades aplicáveis', 'Guia para repetir e variar'],
  },
  {
    id: 'anual',
    kicker: 'CAMADA A MAIS',
    title: 'Anual',
    subtitle: 'Para quem quer previsibilidade e menos decisões.',
    bullets: ['Ritmo anual', 'Curadoria ao longo do ano', 'Revisão de fase quando fizer sentido'],
    highlight: true,
  },
]

/* =========================
   P34.10 — Legibilidade Mobile
   Helpers locais (sem refator)
   - sem lookbehind (safe)
========================= */

function splitEditorialText(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = String(raw).trim()
  if (!text) return []

  const markers = ['No final,', 'No fim,', 'Depois,', 'Em seguida,', 'Por fim,', 'E', 'Mas']
  let working = text

  markers.forEach((m) => {
    working = working.replace(new RegExp(`\\s+${m}\\s+`, 'g'), `\n\n${m} `)
  })

  let parts = working
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)

  // Se ainda ficou tudo em 1 bloco, quebra simples por pontuação + espaço (sem lookbehind)
  if (parts.length === 1) {
    const sentenceParts = working
      .split(/([.!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean)

    const rebuilt: string[] = []
    for (let i = 0; i < sentenceParts.length; i++) {
      const cur = sentenceParts[i]
      const next = sentenceParts[i + 1]
      if (cur === '.' || cur === '!' || cur === '?') continue
      if (next === '.' || next === '!' || next === '?') {
        rebuilt.push(`${cur}${next}`)
        i += 1
      } else {
        rebuilt.push(cur)
      }
    }

    parts = rebuilt.length ? rebuilt : parts
  }

  return parts.slice(0, 3)
}

function RenderEditorialText({
  text,
  className,
}: {
  text: string | null | undefined
  className: string
}) {
  const parts = splitEditorialText(text)
  if (parts.length === 0) return null

  return (
    <div className="space-y-2">
      {parts.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </div>
  )
}

/* =========================
   Pré-lançamento — Lista de espera
========================= */

type WaitlistState = {
  name: string
  email: string
  message: string
}

const initialWaitlist: WaitlistState = {
  name: '',
  email: '',
  message: '',
}

export default function MaternaBoxPage() {
  const [activeSection, setActiveSection] = useState<HubSectionId>('visao')
  const [selectedAge, setSelectedAge] = useState<AgeBand>('3-5')
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('mensal')

  // Lista de espera (modal)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlist, setWaitlist] = useState<WaitlistState>(initialWaitlist)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null)
  const [waitlistError, setWaitlistError] = useState<string | null>(null)

  const selectedPlanData = useMemo(
    () => PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0],
    [selectedPlan],
  )

  const scrollTo = (id: HubSectionId) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`maternabox-${id}`)
    if (!el) return

    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    const offsetTop = rect.top + window.scrollY - headerOffset

    window.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  const goToPlansPage = () => {
    if (typeof window === 'undefined') return
    // caminho provável dentro de /maternar/materna-plus (consistência com esta rota)
    window.location.href = '/maternar/materna-plus/planos'
  }

  const openWaitlist = () => {
    setWaitlistSuccess(null)
    setWaitlistError(null)
    setWaitlistOpen(true)
  }

  const handleWaitlistChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setWaitlist((prev) => ({ ...prev, [name]: value }))
  }

  const handleWaitlistSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setWaitlistSuccess(null)
    setWaitlistError(null)
    setWaitlistSubmitting(true)

    try {
      // Endpoint planejado para etapa de pré-lançamento (adm/CRM virá depois).
      // Se ainda não existir, o erro é tratado com mensagem clara.
      const response = await fetch('/api/maternar/maternabox-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...waitlist,
          selectedAge,
          selectedPlan,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const messageFromApi =
          data && typeof data.message === 'string'
            ? data.message
            : 'Algo não saiu como esperado.'
        throw new Error(messageFromApi)
      }

      setWaitlistSuccess(
        'Perfeito. Você entrou na lista de espera. Quando a primeira edição abrir, a gente avisa por e-mail com o próximo passo.',
      )
      setWaitlist(initialWaitlist)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Materna360][MaternaBox][Waitlist] erro ao enviar', err)
      setWaitlistError(
        'Não conseguimos registrar seu interesse agora. Tente novamente em alguns instantes.',
      )
    } finally {
      setWaitlistSubmitting(false)
    }
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
      {
        root: null,
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0.05, 0.15, 0.25, 0.35],
      },
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

  return (
    <PageTemplate
      headerTone="light"
      label="MATERNAR"
      title="MaternaBox"
      subtitle="Uma caixa com rituais prontos para gerar conexão — com menos decisão e mais leveza."
      showLabel={false}
      headerTop={<BackToMaternar />}
    >
      <ClientOnly>
        {/* pb maior para não encostar na tab bar no mobile */}
        <div className="pt-3 md:pt-4 pb-24 space-y-6 md:space-y-10">
          {/* BANNER PRÉ-LANÇAMENTO (demanda) */}
          <Reveal>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-[#fff7fb] p-5 md:p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PRÉ-LANÇAMENTO
                  </p>
                  <p className="text-[14px] md:text-[15px] font-semibold text-[#545454]">
                    Estamos organizando a primeira edição da MaternaBox.
                  </p>
                  <p className="text-[12px] md:text-[13px] text-[#6A6A6A] leading-relaxed max-w-2xl">
                    Neste momento, abrimos apenas a lista de espera para medir interesse e avisar primeiro quando a
                    abertura acontecer.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={openWaitlist}
                  >
                    Entrar na lista de espera
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={() => scrollTo('visao')}
                  >
                    Ver a MaternaBox
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <Reveal>
            <SoftCard
              id="maternabox-visao"
              className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-5 sm:p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-4 md:space-y-6">
                <div className="grid gap-5 md:grid-cols-[1.05fr,0.95fr] md:items-start">
                  <div className="max-w-3xl space-y-2.5">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                      MATERNABOX
                    </p>

                    <h2 className="text-[16px] md:text-xl font-semibold text-[#545454] leading-snug">
                      Você escolhe o ritmo. A gente entrega o ritual pronto.
                    </h2>

                    <RenderEditorialText
                      text="Uma experiência de brincar e vínculo, com curadoria por fase. Vem com um guia curto de “como usar” para você aplicar sem ficar caçando ideias. São momentos simples, possíveis — do jeito que a rotina deixa."
                      className="text-[13px] md:text-[15px] text-[#545454] leading-relaxed"
                    />

                    <SoftCard className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                        PRÉ-LANÇAMENTO
                      </p>
                      <p className="mt-2 text-[12px] text-[#545454] leading-relaxed">
                        A MaternaBox está em preparação. Entre na lista de espera para ser avisada primeiro quando a
                        primeira edição abrir.
                      </p>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[13px] w-full sm:w-auto"
                          onClick={openWaitlist}
                        >
                          Entrar na lista de espera
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-[13px] w-full sm:w-auto"
                          onClick={() => scrollTo('planos')}
                        >
                          Ver ritmos disponíveis
                        </Button>
                      </div>
                    </SoftCard>
                  </div>

                  {/* IMAGEM (humaniza) */}
                  <div className="space-y-2">
                    <div className="rounded-3xl border border-[#F5D7E5] bg-white p-3 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                      <div className="relative w-full overflow-hidden rounded-2xl">
                        <Image
                          src="/images/maternabox2.png"
                          alt="MaternaBox"
                          width={1200}
                          height={900}
                          className="h-auto w-full object-cover"
                          priority={false}
                        />
                      </div>
                      <p className="mt-3 text-[12px] text-[#6A6A6A] leading-relaxed">
                        Um produto pensado para a vida real: guia curto, curadoria por fase e um “próximo passo” mais
                        claro.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">MENU</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {HUB_SECTIONS.map((s) => (
                      <Pill key={s.id} id={s.id} label={s.label} />
                    ))}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12px] text-[#545454]">
                      Se fizer sentido para o seu momento: veja os detalhes e depois escolha o ritmo.
                    </p>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[13px] px-5 py-2 w-full sm:w-auto"
                        onClick={() => scrollTo('como-funciona')}
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[13px] px-5 py-2 w-full sm:w-auto"
                        onClick={() => scrollTo('planos')}
                      >
                        Ver ritmos
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Pronto para usar</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Sem pesquisar atividades. Só abrir, escolher e fazer.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Pouco tempo</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Ideias que cabem na rotina real (10–20 min).
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">Por fase</p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Você escolhe a faixa etária e ajusta depois.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={() => scrollTo('como-funciona')}
                  >
                    Conhecer a MaternaBox
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={openWaitlist}
                  >
                    Entrar na lista de espera
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <Reveal delay={20}>
            <SoftCard
              id="maternabox-como-funciona"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-4">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    COMO FUNCIONA
                  </p>
                  <h2 className="text-[16px] md:text-xl font-semibold text-[#545454] leading-snug">
                    Três passos. Sem complicar.
                  </h2>
                </header>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">1 · ESCOLHA</p>
                    <p className="mt-1 text-[13px] text-[#545454]">Selecione a faixa etária e o ritmo.</p>
                  </div>

                  <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">2 · RECEBA</p>
                    <p className="mt-1 text-[13px] text-[#545454]">A caixa chega com guia curto e atividades.</p>
                  </div>

                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">3 · CONECTE</p>
                    <p className="mt-1 text-[13px] text-[#545454]">Use em 10–20 min. Repita quando quiser.</p>
                  </div>
                </div>

                <RenderEditorialText
                  text="A MaternaBox é uma experiência de rotina e vínculo (não é terapia e não substitui acompanhamento profissional)."
                  className="text-[12px] text-[#6A6A6A] leading-relaxed"
                />

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={() => scrollTo('para-quem')}
                  >
                    Para quem é
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={openWaitlist}
                  >
                    Entrar na lista de espera
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <Reveal delay={40}>
            <SoftCard
              id="maternabox-para-quem"
              className="rounded-3xl border border-[#F5D7E5] bg-white/96 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="grid gap-4 md:grid-cols-2 md:items-start">
                <div className="space-y-3">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PARA QUEM É
                  </p>
                  <h2 className="text-[16px] md:text-xl font-semibold text-[#545454] leading-snug">
                    Para mães que querem presença — sem perfeição.
                  </h2>

                  <ul className="space-y-2 text-[13px] text-[#545454]">
                    <li className="flex gap-2">
                      <span className="mt-0.5 h-6 w-6 rounded-full bg-[#ffe1f1] flex items-center justify-center border border-[#F5D7E5]">
                        <AppIcon name="sparkles" className="h-3.5 w-3.5 text-[#fd2597]" />
                      </span>
                      <span>Quando você quer ideias prontas e aplicáveis.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 h-6 w-6 rounded-full bg-[#ffe1f1] flex items-center justify-center border border-[#F5D7E5]">
                        <AppIcon name="heart" className="h-3.5 w-3.5 text-[#fd2597]" />
                      </span>
                      <span>Quando você quer conexão (mesmo em dias corridos).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 h-6 w-6 rounded-full bg-[#ffe1f1] flex items-center justify-center border border-[#F5D7E5]">
                        <AppIcon name="calendar" className="h-3.5 w-3.5 text-[#fd2597]" />
                      </span>
                      <span>Quando você quer rotina com leveza, sem “inventar moda”.</span>
                    </li>
                  </ul>

                  <RenderEditorialText
                    text="A proposta é te poupar decisão e fricção. Você não compra “mais uma tarefa”. Você compra um caminho mais claro para o próximo momento de presença."
                    className="text-[12px] text-[#6A6A6A] leading-relaxed"
                  />
                </div>

                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="font-semibold">Talvez não seja o momento se:</p>
                  <p>• Você busca “resultado rápido” sem prática.</p>
                  <p>• Você não quer nenhuma atividade guiada.</p>
                  <p>• Você prefere escolher tudo sozinha, sem curadoria.</p>

                  <div className="pt-2">
                    <Button variant="secondary" size="sm" className="text-[13px] w-full" onClick={openWaitlist}>
                      Entrar na lista de espera
                    </Button>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <Reveal delay={60}>
            <SoftCard
              id="maternabox-faixa"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-4">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    FAIXA ETÁRIA
                  </p>
                  <h2 className="text-[16px] md:text-xl font-semibold text-[#545454] leading-snug">
                    Selecione a fase do seu filho.
                  </h2>
                  <p className="text-[12px] text-[#6A6A6A]">Você pode mudar depois, sem pressa.</p>
                </header>

                <div className="flex flex-wrap gap-2">
                  {AGE_BANDS.map((b) => {
                    const isActive = selectedAge === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedAge(b.id)}
                        className={[
                          'rounded-full border px-3 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors',
                          isActive
                            ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
                            : 'border-[#F5D7E5] bg-white text-[#545454] hover:border-[#fd2597] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        {b.label}
                      </button>
                    )
                  })}
                </div>

                <SoftCard className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/70 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[13px] font-semibold text-[#545454]">Selecionado:</p>
                  <p className="text-[13px] text-[#545454]">
                    Faixa <span className="font-semibold">{AGE_BANDS.find((a) => a.id === selectedAge)?.label}</span> —
                    a curadoria é ajustada para essa fase.
                  </p>
                </SoftCard>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={() => scrollTo('planos')}
                  >
                    Ver ritmos
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] w-full sm:w-auto"
                    onClick={openWaitlist}
                  >
                    Entrar na lista de espera
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <Reveal delay={80}>
            <SoftCard
              id="maternabox-planos"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-5">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PLANOS
                  </p>
                  <h2 className="text-[16px] md:text-xl font-semibold text-[#545454] leading-snug">
                    Escolha o ritmo que faz sentido.
                  </h2>
                  <RenderEditorialText
                    text="Nesta fase, você escolhe o ritmo e a faixa para registrar interesse. Quando a primeira edição abrir, valores e disponibilidade serão apresentados com clareza."
                    className="text-[12px] text-[#6A6A6A] leading-relaxed"
                  />
                </header>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id
                    return (
                      <SoftCard
                        key={plan.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={[
                          'cursor-pointer rounded-3xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border transition-all duration-200',
                          plan.highlight
                            ? 'border-[#fd2597] shadow-[0_10px_26px_rgba(253,37,151,0.18)]'
                            : 'border-[#F5D7E5] hover:border-[#fd2597]/70 hover:shadow-[0_10px_26px_rgba(0,0,0,0.10)]',
                          isSelected ? 'ring-2 ring-[#fd2597]/25' : '',
                        ].join(' ')}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8236b]">
                          {plan.kicker}
                        </p>
                        <h3 className="mt-1 text-[15px] font-semibold text-[#545454]">{plan.title}</h3>
                        <p className="mt-1 text-[12px] text-[#6A6A6A]">{plan.subtitle}</p>

                        <ul className="mt-3 space-y-1 text-[12px] text-[#545454]">
                          {plan.bullets.map((b) => (
                            <li key={b}>• {b}</li>
                          ))}
                        </ul>

                        <div className="mt-4">
                          <span
                            className={[
                              'inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-semibold border',
                              isSelected
                                ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
                                : 'border-[#F5D7E5] bg-white text-[#545454]',
                            ].join(' ')}
                          >
                            {isSelected ? 'Selecionado' : 'Selecionar'}
                          </span>
                        </div>
                      </SoftCard>
                    )
                  })}
                </div>

                <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">SEU RESUMO</p>

                      <RenderEditorialText
                        text={`${selectedPlanData.title} · Faixa ${AGE_BANDS.find((a) => a.id === selectedAge)?.label}`}
                        className="text-[13px] text-[#545454] leading-relaxed"
                      />

                      <RenderEditorialText
                        text="Se isso faz sentido para o seu momento, entre na lista de espera com essa escolha. Assim, a primeira edição nasce a partir de demanda real."
                        className="text-[12px] text-[#6A6A6A] leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[13px] w-full sm:w-auto"
                        onClick={() => scrollTo('faixa')}
                      >
                        Ajustar faixa
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[13px] w-full sm:w-auto"
                        onClick={openWaitlist}
                      >
                        Entrar na lista de espera
                      </Button>
                    </div>
                  </div>
                </SoftCard>

                {/* Link “Planos” futuro, mantido mas sem pressão */}
                <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6A6A]">PRÓXIMO PASSO</p>
                  <p className="mt-2 text-[12px] text-[#6A6A6A] leading-relaxed">
                    Quando a MaternaBox abrir oficialmente, a página de Planos do Materna+ concentrará valores,
                    disponibilidade e regras operacionais, com clareza.
                  </p>
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" className="text-[13px]" onClick={goToPlansPage}>
                      Ver página de Planos (Materna+)
                    </Button>
                  </div>
                </SoftCard>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="maternabox" />
          <div className="PageSafeBottom" />
        </div>

        {/* MODAL — LISTA DE ESPERA */}
        {waitlistOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
            onClick={() => setWaitlistOpen(false)}
          >
            <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                      LISTA DE ESPERA · MATERNABOX
                    </p>
                    <h3 className="text-[18px] font-semibold text-[#545454]">Entrar na lista de espera</h3>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Conte o mínimo. A gente usa isso para organizar a primeira edição e avisar você primeiro.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWaitlistOpen(false)}
                    className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                  >
                    Fechar
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/60 p-4">
                  <p className="text-[12px] text-[#545454]">
                    <span className="font-semibold">Sua seleção atual:</span>{' '}
                    {AGE_BANDS.find((a) => a.id === selectedAge)?.label} · {selectedPlanData.title}
                  </p>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleWaitlistSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="wlName"
                        className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                      >
                        Nome
                      </label>
                      <input
                        id="wlName"
                        name="name"
                        type="text"
                        value={waitlist.name}
                        onChange={handleWaitlistChange}
                        placeholder="Como você gostaria de ser chamada?"
                        className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                        disabled={waitlistSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="wlEmail"
                        className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                      >
                        E-mail
                      </label>
                      <input
                        id="wlEmail"
                        name="email"
                        type="email"
                        required
                        value={waitlist.email}
                        onChange={handleWaitlistChange}
                        placeholder="Seu melhor e-mail"
                        className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                        disabled={waitlistSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="wlMessage"
                      className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#6A6A6A]"
                    >
                      Observação (opcional)
                    </label>
                    <textarea
                      id="wlMessage"
                      name="message"
                      rows={4}
                      value={waitlist.message}
                      onChange={handleWaitlistChange}
                      placeholder="Se quiser, diga o que você mais quer destravar com a MaternaBox (ex.: rotina, conexão, ideias prontas)."
                      className="w-full rounded-2xl border border-[#ffd8e6] bg-white px-3 py-2 text-[14px] leading-relaxed text-[#2F3A56] placeholder:text-[#545454]/60 outline-none focus:border-[#fd2597] focus:ring-2 focus:ring-[#fd2597]/30"
                      disabled={waitlistSubmitting}
                    />
                  </div>

                  {waitlistSuccess && (
                    <p className="rounded-2xl bg-[#ffe1f1] px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                      {waitlistSuccess}
                    </p>
                  )}

                  {waitlistError && (
                    <p className="rounded-2xl bg-[#fd2597]/10 px-4 py-2 text-[12px] leading-relaxed text-[#2F3A56]">
                      {waitlistError}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setWaitlistOpen(false)}
                      className="sm:w-auto w-full"
                    >
                      Cancelar
                    </Button>

                    <button
                      type="submit"
                      disabled={waitlistSubmitting}
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-[#fd2597] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)] transition hover:bg-[#e0218c] disabled:cursor-not-allowed disabled:bg-[#fd2597]/60"
                    >
                      {waitlistSubmitting ? 'Enviando...' : 'Entrar na lista'}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#6A6A6A] leading-relaxed">
                    Ao enviar, você não cria obrigação de compra. É apenas um registro de interesse para a primeira
                    edição.
                  </p>
                </form>
              </SoftCard>
            </div>
          </div>
        )}
      </ClientOnly>
    </PageTemplate>
  )
}
