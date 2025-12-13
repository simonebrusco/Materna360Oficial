'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { Reveal } from '@/components/ui/Reveal'
import {
  getProfessionals,
  type ProfessionalApi,
  type SpecialtyId,
} from '@/app/lib/profissionais'

type SpecialtyFilterId = 'todos' | SpecialtyId
type Professional = ProfessionalApi
type ViewStep = 'visao' | 'premium' | 'profissionais' | 'comunidade' | 'servicos'

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
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
  { id: 'nutricao-materno-infantil', label: 'Nutrição materno-infantil' },
  { id: 'sono-infantil', label: 'Sono infantil' },
  { id: 'parentalidade-familia', label: 'Parentalidade & família' },
]

function scrollToId(id: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  const headerOffset = 88
  const rect = el.getBoundingClientRect()
  const offsetTop = rect.top + window.scrollY - headerOffset
  window.scrollTo({ top: offsetTop, behavior: 'smooth' })
}

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilterId>('todos')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewStep>('visao')

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

  const filteredProfessionals = useMemo(() => {
    return selectedSpecialty === 'todos'
      ? professionals
      : professionals.filter(p => p.specialtyId === selectedSpecialty)
  }, [professionals, selectedSpecialty])

  const handleContactProfessional = () => {
    if (!selectedProfessional) return
    trackProfessionalEvent('whatsapp_click', selectedProfessional)
    if (typeof window !== 'undefined') {
      window.open(selectedProfessional.whatsappUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function setChip(next: ViewStep) {
    setView(next)
    const map: Record<ViewStep, string> = {
      visao: 'materna-plus-visao',
      premium: 'materna-plus-premium',
      profissionais: 'materna-plus-profissionais',
      comunidade: 'materna-plus-comunidade',
      servicos: 'materna-plus-servicos',
    }
    scrollToId(map[next])
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          {/* HERO (padrão novo) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8" id="materna-plus-visao">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Materna+
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-3xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Profissionais parceiros, serviços especiais e, em breve, conteúdos premium e comunidade
                — para você não precisar maternar tudo sozinha.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* PAINEL TRANSLÚCIDO */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
                space-y-6
              "
            >
              {/* Top card: visão + chips (mesmo padrão das outras) */}
              <Reveal>
                <div
                  className="
                    rounded-3xl
                    bg-white/10
                    border border-white/25
                    shadow-[0_14px_40px_rgba(0,0,0,0.12)]
                    p-4 md:p-5
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                        <AppIcon name="sparkles" size={22} className="text-white" />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[12px] text-white/85">
                          MATERNA+ · PORTAL PREMIUM
                        </div>

                        <div className="text-[18px] md:text-[20px] font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                          Você entra sem saber por onde começar — e sai com apoio claro.
                        </div>

                        <div className="text-[13px] text-white/85 leading-relaxed max-w-3xl">
                          Curadoria de profissionais, serviços e (em breve) trilhas guiadas + biblioteca premium
                          integradas com o Eu360. Sem excesso. Só o que encaixa na sua rotina real.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChip('premium')}
                        className="
                          rounded-full
                          bg-white/90 hover:bg-white
                          text-[#2f3a56]
                          px-4 py-2
                          text-[12px]
                          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                          transition
                        "
                      >
                        Ver Premium
                      </button>

                      <button
                        onClick={() => setChip('profissionais')}
                        className="
                          rounded-full
                          bg-[#fd2597]
                          text-white
                          px-4 py-2
                          text-[12px]
                          shadow-[0_10px_26px_rgba(253,37,151,0.35)]
                          hover:opacity-95
                          transition
                        "
                      >
                        Ver profissionais
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'visao' as const, label: 'Visão' },
                        { id: 'premium' as const, label: 'Premium' },
                        { id: 'profissionais' as const, label: 'Profissionais' },
                        { id: 'comunidade' as const, label: 'Comunidade' },
                        { id: 'servicos' as const, label: 'Serviços' },
                      ] as const
                    ).map(it => {
                      const active = view === it.id
                      return (
                        <button
                          key={it.id}
                          onClick={() => setChip(it.id)}
                          className={[
                            'rounded-full px-3.5 py-2 text-[12px] border transition',
                            active
                              ? 'bg-white/95 border-white/40 text-[#2f3a56]'
                              : 'bg-white/20 border-white/30 text-white/90 hover:bg-white/25',
                          ].join(' ')}
                        >
                          {it.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Reveal>

              {/* CARD BRANCO — conteúdo principal em “blocos” */}
              <Reveal>
                <SoftCard
                  className="
                    p-5 md:p-6 rounded-3xl
                    bg-white/95
                    border border-[#f5d7e5]
                    shadow-[0_10px_28px_rgba(184,35,107,0.12)]
                    space-y-6
                  "
                >
                  {/* STATUS / PLANO */}
                  <div className="rounded-3xl border border-[#F5D7E5] bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                      <div className="space-y-1.5">
                        <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                          STATUS DO SEU PLANO
                        </p>
                        <h2 className="text-sm md:text-[15px] font-semibold text-[#545454]">
                          Você está usando o Materna360 na versão essencial.
                        </h2>
                        <p className="text-[12px] md:text-[13px] text-[#6A6A6A] leading-relaxed max-w-xl">
                          Em breve, aqui você verá seu plano Materna+ ou Materna+360, com acesso às trilhas guiadas,
                          biblioteca premium e IA personalizada. Por enquanto, veja o preview do que está sendo preparado.
                        </p>
                      </div>

                      <div className="flex-shrink-0 md:ml-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[13px] px-5 py-2"
                          onClick={() => setChip('premium')}
                        >
                          Conhecer os benefícios do Materna+
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* PREMIUM */}
                  <div
                    id="materna-plus-premium"
                    className="rounded-3xl border border-[#F5D7E5] bg-white p-5 md:p-6 shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
                  >
                    <div className="space-y-4">
                      <header className="space-y-2">
                        <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                          CONTEÚDOS PREMIUM & TRILHAS GUIADAS
                        </p>
                        <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                          Caminhos guiados para uma maternidade mais leve — no seu tempo.
                        </h2>
                        <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                          Este será o coração do Materna+: trilhas estruturadas, conteúdos aprofundados e integração com
                          o Eu360 e IA Premium, para apoiar decisões do dia a dia sem te sobrecarregar.
                        </p>
                        <p className="text-[12px] text-[#6A6A6A] max-w-2xl">
                          Preview do que está sendo desenhado. Alguns conteúdos serão exclusivos para assinantes Materna+
                          e Materna+360.
                        </p>
                      </header>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                                TRILHA GUIADA
                              </p>
                              <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                                Primeiro ano leve
                              </h3>
                            </div>
                            <span className="rounded-full border border-[#F5D7E5] bg-white px-2 py-0.5 text-[11px] font-medium text-[#6A6A6A]">
                              Em breve
                            </span>
                          </div>
                          <p className="text-[13px] text-[#545454] leading-relaxed">
                            Para mães de bebês (0–12m): sono, rotina, vínculo, rituais pequenos que sustentam o dia.
                          </p>
                          <p className="text-[12px] text-[#6A6A6A]">
                            Desbloqueios diários, sugestões práticas e pausas para você também ser cuidada.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="mt-2 text-[12px] cursor-not-allowed opacity-70 self-start"
                          >
                            Ver trilha (disponível em breve)
                          </Button>
                        </div>

                        <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                                TRILHA GUIADA
                              </p>
                              <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                                Desenvolvimento por idade
                              </h3>
                            </div>
                            <span className="rounded-full border border-[#F5D7E5] bg-[#ffe1f1] px-2 py-0.5 text-[11px] font-medium text-[#545454]">
                              Em breve
                            </span>
                          </div>
                          <p className="text-[13px] text-[#545454] leading-relaxed">
                            Trilhas por faixa etária (1–3, 3–5, 5–7): limites, autonomia, rotina, conexão e brincadeiras.
                          </p>
                          <p className="text-[12px] text-[#6A6A6A]">
                            Um passo a passo gentil para você se sentir mais segura em cada fase.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            className="mt-2 text-[12px] cursor-not-allowed opacity-70 self-start"
                          >
                            Ver trilha (disponível em breve)
                          </Button>
                        </div>

                        <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            BIBLIOTECA PREMIUM
                          </p>
                          <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                            Conteúdos exclusivos Materna+
                          </h3>
                          <p className="text-[13px] text-[#545454] leading-relaxed">
                            PDFs aprofundados, roteiros práticos, checklists e materiais que vão além do essencial.
                          </p>
                          <ul className="space-y-1 text-[12px] text-[#545454]">
                            <li>• Guias avançados por idade e tema.</li>
                            <li>• Checklists extensos para momentos críticos.</li>
                            <li>• Roteiros para conversas difíceis em família.</li>
                          </ul>
                          <p className="text-[12px] text-[#6A6A6A]">
                            Acesso completo será liberado para assinantes Materna+ e Materna+360.
                          </p>
                        </div>

                        <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            EU360 & IA PREMIUM · PLANEJADO
                          </p>
                          <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                            Sua jornada alimentando respostas mais personalizadas.
                          </h3>
                          <p className="text-[13px] text-[#545454] leading-relaxed">
                            O que você vive no planner e nos mini-hubs ajuda a IA a responder com mais precisão e humanidade.
                          </p>
                          <p className="text-[12px] text-[#6A6A6A]">
                            Tudo com cuidado, respeitando limites e configurações que você escolher.
                          </p>
                          <span className="inline-flex w-max rounded-full border border-[#F5D7E5] bg-white px-3 py-1 text-[11px] font-medium text-[#545454]">
                            Disponível na fase de IA Premium
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] md:text-[12px] text-[#6A6A6A]">
                        Planos e detalhes de assinatura serão apresentados no checkout quando o programa for aberto.
                      </p>
                    </div>
                  </div>

                  {/* PROFISSIONAIS */}
                  <div
                    id="materna-plus-profissionais"
                    className="rounded-3xl border border-[#F5D7E5] bg-white p-5 md:p-6 shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
                  >
                    <div className="space-y-4">
                      <header className="space-y-2">
                        <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                          PROFISSIONAIS PARCEIROS
                        </p>
                        <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                          Rede Materna+ — com agendamento direto no WhatsApp.
                        </h2>
                        <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                          Você escolhe a área, vê um resumo rápido e, se fizer sentido, segue direto para o contato.
                        </p>
                        <p className="text-[12px] text-[#6A6A6A]">
                          <span className="font-semibold">Importante:</span> o Materna360 não intermedia pagamentos e não
                          realiza atendimentos clínicos.
                        </p>
                      </header>

                      <div className="grid gap-5 md:grid-cols-[0.9fr,1.4fr]">
                        {/* filtros */}
                        <div className="space-y-4">
                          <p className="text-[13px] font-semibold text-[#545454]">
                            Escolha a área em que você precisa de apoio
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {SPECIALTIES.map(spec => {
                              const isActive = selectedSpecialty === spec.id
                              return (
                                <button
                                  key={spec.id}
                                  type="button"
                                  onClick={() => setSelectedSpecialty(spec.id)}
                                  className={[
                                    'rounded-full border px-3 py-1.5 text-[12px] md:text-[13px] font-medium transition-colors',
                                    isActive
                                      ? 'border-[#fd2597] bg-[#fdbed7] text-[#fd2597]'
                                      : 'border-[#F5D7E5] bg-white text-[#545454] hover:border-[#fd2597] hover:bg-[#fdbed7]/40',
                                  ].join(' ')}
                                >
                                  {spec.label}
                                </button>
                              )
                            })}
                          </div>

                          <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                            <p className="text-[13px] font-semibold text-[#545454]">
                              Como funciona na prática?
                            </p>
                            <ol className="space-y-1.5 text-[12px] text-[#545454]">
                              <li>
                                <span className="font-semibold">1.</span> Filtre a área e escolha um profissional.
                              </li>
                              <li>
                                <span className="font-semibold">2.</span> Veja detalhes e siga para o WhatsApp.
                              </li>
                              <li>
                                <span className="font-semibold">3.</span> Combine direto: horários, valores e pagamento.
                              </li>
                            </ol>
                          </div>
                        </div>

                        {/* lista */}
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
                              <p className="mt-1">
                                Tente novamente em alguns minutos. Sua experiência é prioridade por aqui.
                              </p>
                            </div>
                          )}

                          {!isLoading &&
                            !error &&
                            filteredProfessionals.map(prof => (
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
                                  {prof.tags.map(tag => (
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
                            <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/80 px-4 py-3 text-[13px] text-[#545454] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                              <p className="font-semibold">
                                Ainda não temos profissionais nessa área específica.
                              </p>
                              <p className="mt-1">
                                Em breve, novos parceiros entram para a rede Materna+. Por enquanto, escolha outra área.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COMUNIDADE */}
                  <div
                    id="materna-plus-comunidade"
                    className="rounded-3xl border border-[#F5D7E5] bg-white p-5 md:p-6 shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
                  >
                    <div className="grid gap-4 md:grid-cols-[1.4fr,1fr] md:items-center">
                      <div className="space-y-3">
                        <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                          COMUNIDADE MATERNA+ · EM BREVE
                        </p>
                        <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                          Um lugar seguro para compartilhar o que a teoria não conta.
                        </h2>
                        <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                          A comunidade Materna+ está sendo desenhada para mães reais: com dúvidas, cansaço e dias mistos.
                        </p>
                        <ul className="space-y-1.5 text-[13px] text-[#545454]">
                          <li>• Espaços moderados com cuidado e zero julgamento.</li>
                          <li>• Temas guiados sobre culpa, rotina, escola e comportamento.</li>
                          <li>• Troca com mães em fases parecidas.</li>
                        </ul>
                        <p className="text-[12px] text-[#6A6A6A]">
                          Assinantes Materna+ e Materna+360 serão avisadas com prioridade.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                        <p className="font-semibold">O que você pode esperar:</p>
                        <p>Encontros temáticos, rodas de conversa e materiais de apoio.</p>
                        <p>Sempre com linguagem simples e humana — sem promessas de perfeição.</p>
                      </div>
                    </div>
                  </div>

                  {/* SERVIÇOS */}
                  <div
                    id="materna-plus-servicos"
                    className="rounded-3xl border border-[#F5D7E5] bg-white p-5 md:p-6 shadow-[0_4px_18px_rgba(0,0,0,0.06)]"
                  >
                    <div className="space-y-4">
                      <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                        SERVIÇOS MATERNA360
                      </p>

                      <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                        Experiências além do app — mas que continuam cuidando da sua rotina.
                      </h2>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.05)]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                            MATERNABOX · ASSINATURA DE CARINHO MENSAL
                          </p>
                          <p className="text-[15px] font-semibold text-[#545454]">
                            Uma caixa mensal criada para transformar momentos simples em rituais de conexão.
                          </p>
                          <p className="text-[13px] text-[#545454]">
                            Curadoria do Materna360, entrega na sua casa e conteúdos pensados para sua rotina real.
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-2 text-[13px]"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.location.href = '/maternar/materna-plus/maternabox'
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
                            Um canal para te ajudar a encontrar o apoio certo.
                          </p>
                          <p className="text-[13px] text-[#545454]">
                            Dentro do app, com profissional parceiro ou serviços como a MaternaBox — tudo para sua realidade.
                          </p>
                          <p className="text-[12px] text-[#6A6A6A]">
                            Serviço em fase de testes. Assinantes Materna+ e Materna+360 serão convidadas primeiro.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <MotivationalFooter routeKey="materna-plus" />
                </SoftCard>
              </Reveal>

              {/* MODAL PROFISSIONAL */}
              {selectedProfessional && (
                <div
                  className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
                  onClick={() => setSelectedProfessional(null)}
                >
                  <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
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
                        {selectedProfessional.tags.map(tag => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#fdbed7]/80 px-2 py-0.5 text-[11px] font-medium text-[#545454]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="mt-4 text-[12px] text-[#6A6A6A] leading-relaxed">
                        O agendamento, valores e pagamento são combinados diretamente entre você e o profissional.
                        O Materna360 faz apenas a curadoria e a ponte.
                      </p>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          className="sm:w-auto w-full"
                          onClick={handleContactProfessional}
                        >
                          Falar com esse profissional pelo WhatsApp
                        </Button>
                      </div>
                    </SoftCard>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
