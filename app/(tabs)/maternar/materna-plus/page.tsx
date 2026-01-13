'use client'

import React, { useEffect, useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { Reveal } from '@/components/ui/Reveal'
import BackToMaternar from '@/components/common/BackToMaternar'
import {
  getProfessionals,
  type ProfessionalApi,
  type SpecialtyId,
} from '@/app/lib/profissionais'

type SpecialtyFilterId = 'todos' | SpecialtyId
type Professional = ProfessionalApi

function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase()).join('')
}

function trackProfessionalEvent(
  type: 'view' | 'whatsapp_click',
  professional: Professional,
) {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line no-console
  console.log('[Materna360][Materna+] Event:', type, {
    id: professional.id,
    name: professional.name,
  })
}

const SPECIALTIES: { id: SpecialtyFilterId; label: string }[] = [
  { id: 'todos', label: 'Todos os profissionais' },
  { id: 'psicologia-infantil', label: 'Psicologia infantil' },
  { id: 'psicopedagogia', label: 'Psicopedagogia' },
  { id: 'nutricao-materno-infantil', label: 'Nutrição materno-infantantil' },
  { id: 'sono-infantil', label: 'Sono infantil' },
  { id: 'parentalidade-familia', label: 'Parentalidade & família' },
]

type HubSectionId = 'premium' | 'profissionais' | 'comunidade' | 'servicos'

const HUB_SECTIONS: { id: HubSectionId; label: string }[] = [
  { id: 'premium', label: 'Premium' },
  { id: 'profissionais', label: 'Profissionais' },
  { id: 'comunidade', label: 'Comunidade' },
  { id: 'servicos', label: 'Serviços' },
]

function BulletLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#fd2597] shrink-0" />
      <p className="text-[12px] md:text-[13px] text-[#545454] leading-relaxed">
        {children}
      </p>
    </div>
  )
}

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilterId>('todos')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [activeSection, setActiveSection] = useState<HubSectionId>('premium')

  useEffect(() => {
    let isMounted = true

    async function loadProfessionals() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProfessionals()
        if (!isMounted) return
        setProfessionals(data)
      } catch {
        if (!isMounted) return
        setError('Não conseguimos carregar a lista de profissionais agora.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProfessionals()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProfessionals =
    selectedSpecialty === 'todos'
      ? professionals
      : professionals.filter((p) => p.specialtyId === selectedSpecialty)

  const handleContactProfessional = () => {
    if (!selectedProfessional) return
    trackProfessionalEvent('whatsapp_click', selectedProfessional)
    if (typeof window !== 'undefined') {
      window.open(selectedProfessional.whatsappUrl, '_blank')
    }
  }

  const scrollTo = (id: HubSectionId) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(`materna-plus-${id}`)
    if (!el) return

    const headerOffset = 88
    const rect = el.getBoundingClientRect()
    const offsetTop = rect.top + window.scrollY - headerOffset

    window.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ids: HubSectionId[] = [
      'premium',
      'profissionais',
      'comunidade',
      'servicos',
    ]
    const elements = ids
      .map((id) => document.getElementById(`materna-plus-${id}`))
      .filter(Boolean) as HTMLElement[]

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
          )[0]

        if (!visible?.target?.id) return
        const sectionId = visible.target.id.replace(
          'materna-plus-',
          '',
        ) as HubSectionId
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
      showLabel={false}
      headerTop={<BackToMaternar />}
      title="Materna+"
      subtitle="Profissionais parceiros, serviços especiais e um caminho premium em construção. Sem enrolação, no seu tempo."
    >
      <ClientOnly>
        <div className="pb-12 space-y-8 md:space-y-10">
          {/* HERO HUB-LIKE (overlap mais forte) */}
          <div className="-mt-14 md:-mt-16">
            <Reveal>
              <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                <div className="space-y-5 md:space-y-6">
                  <div className="max-w-3xl space-y-2.5">
                    <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                      MATERNA+ · PORTAL PREMIUM
                    </p>

                    <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                      Escolha um bloco e vá direto ao ponto.
                    </h2>

                    <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                      Menu rápido para navegar entre Premium, Profissionais,
                      Comunidade e Serviços.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/55 p-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                      MENU INTERNO
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {HUB_SECTIONS.map((s) => (
                        <Pill key={s.id} id={s.id} label={s.label} />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[12px] text-[#545454]">
                        Se estiver sem tempo: comece por{' '}
                        <span className="font-semibold">Profissionais</span>.
                      </p>

                      <Button
                        variant="primary"
                        size="sm"
                        className="text-[13px] px-5 py-2"
                        onClick={() => scrollTo('premium')}
                      >
                        Ver Premium agora
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Profissionais
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Curadoria e contato direto no WhatsApp.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Premium
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        Trilhas e biblioteca premium (em breve).
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="font-semibold text-[13px] text-[#fd2597]">
                        Serviços
                      </p>
                      <p className="text-[13px] text-[#545454] leading-snug">
                        MaternaBox e concierge (em evolução).
                      </p>
                    </div>
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </div>

          <Reveal delay={20}>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    STATUS DO SEU PLANO
                  </p>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#545454]">
                    Seu plano: Essencial
                  </h2>
                  <p className="text-[12px] md:text-[13px] text-[#6A6A6A] leading-relaxed max-w-xl">
                    Trilhas, Biblioteca premium e IA personalizada (em breve).
                  </p>
                </div>

                <div className="flex-shrink-0 md:ml-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] px-5 py-2"
                    onClick={() => scrollTo('premium')}
                  >
                    Ver benefícios do Materna+
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* PREMIUM (UPGRADED) */}
          <Reveal delay={40}>
            <SoftCard
              id="materna-plus-premium"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-5">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PREMIUM
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Um caminho premium, com curadoria e calma.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                    Para quando você quer sair do modo “caça” e aplicar algo certo — sem virar mais uma tarefa.
                  </p>
                </header>

                <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr] items-start">
                  {/* NARRATIVA (valor real) */}
                  <div className="space-y-4">
                    <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6A6A]">
                        O QUE DESTRAVA
                      </p>

                      <div className="mt-3 space-y-2">
                        <BulletLine>Trilhas guiadas por fase (rotina real, sem excesso).</BulletLine>
                        <BulletLine>Biblioteca premium com guias e checklists mais completos.</BulletLine>
                        <BulletLine>Roteiros rápidos para situações específicas do dia a dia.</BulletLine>
                        <BulletLine>Menos tentativa e erro: você pega o “próximo passo” pronto.</BulletLine>
                      </div>
                    </SoftCard>

                    <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-[#ffe1f1]/60 p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                        COMO VOCÊ USA
                      </p>

                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            1 · ESCOLHA
                          </p>
                          <p className="mt-1 text-[13px] text-[#545454]">
                            Um tema ou fase.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            2 · APLIQUE
                          </p>
                          <p className="mt-1 text-[13px] text-[#545454]">
                            Em 10–15 min, sem improviso.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            3 · REPITA
                          </p>
                          <p className="mt-1 text-[13px] text-[#545454]">
                            Quando fizer sentido — no seu ritmo.
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-[12px] text-[#6A6A6A] leading-relaxed">
                        Você não precisa “fazer tudo”. O Premium existe para reduzir fricção e aumentar consistência.
                      </p>
                    </SoftCard>
                  </div>

                  {/* HERO CARD (um único bloco premium) */}
                  <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-[#fff7fb] p-5 shadow-[0_8px_26px_rgba(0,0,0,0.08)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]/85">
                      COMEÇE POR AQUI
                    </p>

                    <h3 className="mt-2 text-[16px] md:text-[18px] font-semibold text-[#545454] leading-snug">
                      Uma experiência premium para decidir com clareza.
                    </h3>

                    <p className="mt-2 text-[13px] text-[#545454] leading-relaxed">
                      Quando o programa abrir, você vai encontrar trilhas e materiais organizados por fase, com instruções curtas e aplicáveis.
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3">
                        <p className="text-[12px] text-[#545454]">
                          O objetivo é simples: <span className="font-semibold">menos busca</span>, mais prática.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-3">
                        <p className="text-[12px] text-[#545454]">
                          Sem fórmulas. Sem promessas mágicas. Com cuidado e consistência.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-[13px]"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.alert('Planos e checkout serão conectados quando o Materna+ abrir.')
                          }
                        }}
                      >
                        Conhecer Materna+
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-[13px]"
                        onClick={() => scrollTo('profissionais')}
                      >
                        Ver profissionais parceiros
                      </Button>
                    </div>
                  </SoftCard>
                </div>

                {/* EM EVOLUÇÃO (contido, sem cara de filtro) */}
                <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6A6A6A]">
                    EM EVOLUÇÃO COM CUIDADO
                  </p>
                  <p className="mt-2 text-[12px] md:text-[13px] text-[#545454] leading-relaxed">
                    A integração com o Eu360 vai ajudar a sugerir materiais mais certeiros ao longo do tempo — com limites e controle.
                  </p>
                  <p className="mt-2 text-[11px] md:text-[12px] text-[#6A6A6A]">
                    Planos completos serão apresentados no checkout quando o programa abrir.
                  </p>
                </SoftCard>
              </div>
            </SoftCard>
          </Reveal>

          {/* PROFISSIONAIS */}
          <Reveal delay={60}>
            <SoftCard
              id="materna-plus-profissionais"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-5">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PROFISSIONAIS PARCEIROS
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Rede Materna+. Contato direto no WhatsApp.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                    Filtre por área. Escolha um profissional. Fale direto no WhatsApp.
                  </p>
                  <p className="text-[12px] text-[#6A6A6A]">
                    <span className="font-semibold">Importante:</span> o Materna360 não intermedia pagamentos.
                  </p>
                </header>

                <div className="grid gap-5 md:grid-cols-[0.9fr,1.4fr]">
                  <div className="space-y-4">
                    <p className="text-[13px] font-semibold text-[#545454]">
                      Escolha a área
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {SPECIALTIES.map((spec) => {
                        const isActive = selectedSpecialty === spec.id
                        return (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => setSelectedSpecialty(spec.id)}
                            className={`rounded-full border px-3 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors ${
                              isActive
                                ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
                                : 'border-[#F5D7E5] bg-white text-[#545454] hover:border-[#fd2597] hover:bg-[#fdbed7]/40'
                            }`}
                          >
                            {spec.label}
                          </button>
                        )
                      })}
                    </div>

                    <SoftCard className="mt-3 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                      <p className="text-[13px] font-semibold text-[#545454]">
                        Como funciona
                      </p>
                      <div className="space-y-2">
                        <BulletLine>Filtre a área e escolha um profissional.</BulletLine>
                        <BulletLine>Veja detalhes e vá para o WhatsApp.</BulletLine>
                        <BulletLine>Combine direto: horários, valores e pagamento.</BulletLine>
                      </div>
                    </SoftCard>
                  </div>

                  <div className="space-y-3">
                    {isLoading && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] animate-pulse">
                          <div className="h-4 w-40 rounded bg-[#ffe1f1]" />
                          <div className="mt-2 h-3 w-64 rounded bg-[#ffe1f1]" />
                          <div className="mt-4 h-3 w-52 rounded bg-[#ffe1f1]" />
                        </div>
                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] animate-pulse">
                          <div className="h-4 w-48 rounded bg-[#ffe1f1]" />
                          <div className="mt-2 h-3 w-60 rounded bg-[#ffe1f1]" />
                          <div className="mt-4 h-3 w-40 rounded bg-[#ffe1f1]" />
                        </div>
                      </div>
                    )}

                    {!isLoading && error && (
                      <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-4 py-3 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                        <p className="font-semibold">
                          Não conseguimos carregar os profissionais agora.
                        </p>
                        <p className="mt-1">Tente novamente em alguns minutos.</p>
                      </div>
                    )}

                    {!isLoading &&
                      !error &&
                      filteredProfessionals.map((prof) => (
                        <div
                          key={prof.id}
                          className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.05)] flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h3 className="text-[16px] md:text-[18px] font-semibold text-[#545454]">
                                {prof.name}
                              </h3>
                              <p className="text-[13px] text-[#6A6A6A]">
                                {prof.specialtyLabel}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProfessional(prof)
                                trackProfessionalEvent('view', prof)
                              }}
                              className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                            >
                              Ver detalhes
                            </button>
                          </div>

                          <p className="text-[14px] text-[#545454]">{prof.focus}</p>
                          <p className="text-[12px] text-[#6A6A6A]">{prof.city}</p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {prof.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#fdbed7]/70 px-2 py-0.5 text-[11px] font-medium text-[#545454]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                    {!isLoading && !error && filteredProfessionals.length === 0 && (
                      <div className="mt-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/80 px-4 py-3 text-[13px] text-[#545454] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                        <p className="font-semibold">
                          Ainda não temos profissionais nessa área.
                        </p>
                        <p className="mt-1">Você pode escolher outra área por enquanto.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* COMUNIDADE */}
          <Reveal delay={110}>
            <SoftCard
              id="materna-plus-comunidade"
              className="rounded-3xl border border-[#F5D7E5] bg-white/96 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="grid gap-4 md:grid-cols-[1.4fr,1fr] md:items-center">
                <div className="space-y-3">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    COMUNIDADE · EM BREVE
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Um lugar seguro para trocar, sem julgamento.
                  </h2>

                  <div className="space-y-2">
                    <BulletLine>Trocas moderadas, com cuidado</BulletLine>
                    <BulletLine>Temas guiados por fase</BulletLine>
                    <BulletLine>Materiais de apoio e encontros</BulletLine>
                  </div>

                  <p className="text-[12px] text-[#6A6A6A]">
                    Assinantes Materna+ e Materna+360 serão avisadas primeiro.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                  <p className="font-semibold text-[#545454]">O que entra aqui:</p>
                  <p>Rodas de conversa e tópicos guiados.</p>
                  <p>Materiais curtos, para ajudar na prática.</p>
                  <p>Zero perfeição. Só vida real.</p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* SERVIÇOS */}
          <Reveal delay={150}>
            <SoftCard
              id="materna-plus-servicos"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-4">
                <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  SERVIÇOS MATERNA360
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                  Experiências fora do app, com a mesma lógica de rotina real.
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      MATERNABOX
                    </p>
                    <p className="text-[15px] font-semibold text-[#545454]">
                      Uma caixa mensal para criar rituais de conexão.
                    </p>
                    <p className="text-[13px] text-[#545454]">
                      Curadoria e conteúdos prontos para usar.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 text-[13px]"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href =
                            '/maternar/materna-plus/maternabox'
                        }
                      }}
                    >
                      Conhecer a MaternaBox
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      CONCIERGE MATERNA+
                    </p>
                    <p className="text-[15px] font-semibold text-[#545454]">
                      Ajuda para encontrar o apoio certo.
                    </p>
                    <p className="text-[13px] text-[#545454]">
                      Indicação e direcionamento, sem burocracia.
                    </p>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Em fase de testes. Assinantes serão convidadas primeiro.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="materna-plus" />

          {selectedProfessional && (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
              onClick={() => setSelectedProfessional(null)}
            >
              <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <SoftCard className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.22)] border border-[#F5D7E5] max-h-[90vh] overflow-y-auto">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-12 w-12 rounded-full bg-[#fdbed7] flex items-center justify-center">
                        <span className="text-[16px] font-semibold text-[#b8236b]">
                          {getInitials(selectedProfessional.name)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-[20px] font-semibold text-[#545454]">
                          {selectedProfessional.name}
                        </h3>
                        <p className="text-[13px] text-[#6A6A6A]">
                          {selectedProfessional.specialtyLabel}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProfessional(null)}
                      className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                    >
                      Fechar
                    </button>
                  </div>

                  <p className="mt-4 text-[14px] text-[#545454] leading-relaxed">
                    {selectedProfessional.shortBio}
                  </p>

                  <p className="mt-2 text-[13px] text-[#6A6A6A]">
                    {selectedProfessional.city}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedProfessional.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fdbed7]/80 px-2 py-0.5 text-[11px] font-medium text-[#545454]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-[12px] text-[#6A6A6A] leading-relaxed">
                    Agendamento, valores e pagamento são combinados diretamente com o profissional.
                  </p>

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      className="sm:w-auto w-full"
                      onClick={handleContactProfessional}
                    >
                      Falar no WhatsApp
                    </Button>
                  </div>
                </SoftCard>
              </div>
            </div>
          )}
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
