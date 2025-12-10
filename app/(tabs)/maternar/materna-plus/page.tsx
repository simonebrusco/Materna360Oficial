'use client'

import React, { useEffect, useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
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

// Utilitário simples para avatar com iniciais
function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
}

// Telemetria local — pronto para integrar com analytics real depois
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

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilterId>('todos')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfessionals() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getProfessionals()
        if (!isMounted) return
        setProfessionals(data)
      } catch (err) {
        if (!isMounted) return
        setError('Não conseguimos carregar a lista de profissionais agora.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
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
      : professionals.filter(p => p.specialtyId === selectedSpecialty)

  const handleContactProfessional = () => {
    if (!selectedProfessional) return
    trackProfessionalEvent('whatsapp_click', selectedProfessional)
    if (typeof window !== 'undefined') {
      window.open(selectedProfessional.whatsappUrl, '_blank')
    }
  }

  const handleScrollToPremium = () => {
    if (typeof window === 'undefined') return
    const el = document.getElementById('materna-plus-premium-content')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="Materna+"
      subtitle="Profissionais parceiros, serviços especiais e, em breve, uma comunidade pensada para que você não precise maternar tudo sozinha."
    >
      <ClientOnly>
        {/* padrão central Materna360 */}
        <div className="pt-4 pb-12 space-y-8 md:space-y-10 max-w-5xl mx-auto">
          {/* HERO */}
          <Reveal>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="space-y-6 md:space-y-7">
                {/* Texto principal */}
                <div className="max-w-3xl space-y-3.5">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    MATERNA+ · PORTAL PREMIUM
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    O Materna+ conecta você a profissionais, serviços e
                    conteúdos que complementam o app — sempre olhando para a sua
                    rotina real.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                    Aqui você encontra indicações cuidadosas de especialistas,
                    experiências como a MaternaBox, e, em breve, trilhas guiadas
                    e conteúdos exclusivos para tornar a maternidade mais leve e
                    possível.
                  </p>
                  <p className="text-[12px] text-[#6A6A6A] leading-relaxed">
                    O pagamento dos atendimentos é feito diretamente com cada
                    profissional ou serviço parceiro. O Materna360 faz a
                    curadoria e a ponte, para que você se sinta segura em cada
                    escolha.
                  </p>
                </div>

                {/* Cards de apoio */}
                <div className="grid gap-3 md:gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">
                      Profissionais
                    </p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Indicações selecionadas de especialistas em maternidade e
                      infância, com foco em atendimento online.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">
                      Comunidade
                    </p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Em breve, um espaço seguro para trocar com outras mães que
                      vivem desafios parecidos com os seus.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-[#F5D7E5] px-4 py-3 text-center sm:text-left shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <p className="font-semibold text-[13px] text-[#fd2597]">
                      Serviços Materna360
                    </p>
                    <p className="text-[13px] text-[#545454] leading-snug">
                      Experiências como a MaternaBox e um concierge preparado
                      para te ajudar a encontrar o apoio certo.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* STATUS DO PLANO / SLOT DE ASSINATURA */}
          <Reveal delay={20}>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    STATUS DO SEU PLANO
                  </p>
                  <h2 className="text-sm md:text-[15px] font-semibold text-[#545454]">
                    Você está usando o Materna360 na versão essencial.
                  </h2>
                  <p className="text-[12px] md:text-[13px] text-[#6A6A6A] leading-relaxed max-w-xl">
                    Em breve, aqui você verá seu plano Materna+ ou Materna+360,
                    com acesso direto às trilhas guiadas, biblioteca premium e
                    IA personalizada. Por enquanto, você já pode conhecer o que
                    está sendo preparado para esse espaço.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[13px] px-5 py-2"
                    onClick={handleScrollToPremium}
                  >
                    Conhecer os benefícios do Materna+
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* CONTEÚDOS PREMIUM & TRILHAS GUIADAS */}
          <Reveal delay={40}>
            <SoftCard
              id="materna-plus-premium-content"
              className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]"
            >
              <div className="space-y-5">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    CONTEÚDOS PREMIUM & TRILHAS GUIADAS
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Caminhos guiados para uma maternidade mais leve — no seu
                    tempo.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                    Este será o coração do Materna+: trilhas estruturadas,
                    conteúdos aprofundados e uma experiência integrada com o
                    Eu360 e a IA Premium, para apoiar suas decisões do dia a
                    dia, sem te sobrecarregar.
                  </p>
                  <p className="text-[12px] text-[#6A6A6A] max-w-2xl">
                    Abaixo você vê um preview do que está sendo desenhado.
                    Alguns conteúdos estarão disponíveis apenas para assinantes
                    Materna+ e Materna+360, sempre com linguagem simples e
                    respeito ao seu momento.
                  </p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 items-stretch">
                  {/* Trilha Primeiro ano leve */}
                  <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)] h-full">
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
                      Um caminho pensado para mães de bebês de 0 a 12 meses, com
                      apoio diário sobre sono, rotina, vínculo, colo, banhos e
                      pequenos rituais que fazem diferença.
                    </p>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Desbloqueios diários, sugestões práticas e momentos de
                      pausa para você também ser cuidada.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="mt-3 text-[12px] cursor-not-allowed opacity-70 self-start"
                    >
                      Ver trilha (disponível em breve)
                    </Button>
                  </div>

                  {/* Trilha Desenvolvimento por idade */}
                  <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)] h-full">
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
                      Trilhas pensadas por faixa etária (1–3, 3–5, 5–7 anos),
                      com ideias de brincadeiras, limites, autonomia e rituais
                      que cabem na sua rotina real.
                    </p>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Um passo a passo gentil, para você se sentir menos perdida
                      e mais segura em cada fase.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="mt-3 text-[12px] cursor-not-allowed opacity-70 self-start"
                    >
                      Ver trilha (disponível em breve)
                    </Button>
                  </div>

                  {/* Biblioteca Premium */}
                  <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)] h-full">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      BIBLIOTECA PREMIUM
                    </p>
                    <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                      Conteúdos exclusivos Materna+
                    </h3>
                    <p className="text-[13px] text-[#545454] leading-relaxed">
                      PDFs aprofundados, roteiros práticos, checklists e
                      materiais que vão além do app essencial, sempre com foco
                      em situações reais que as mães vivem no dia a dia.
                    </p>
                    <ul className="space-y-1 text-[12px] text-[#545454]">
                      <li>• Guias avançados por idade e tema.</li>
                      <li>• Checklists extensos para momentos críticos.</li>
                      <li>• Roteiros para conversas difíceis em família.</li>
                    </ul>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Acesso completo será liberado para assinantes Materna+ e
                      Materna+360.
                    </p>
                  </div>

                  {/* Integração Eu360 / IA Premium */}
                  <div className="flex flex-col rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)] h-full">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      EU360 & IA PREMIUM · PLANEJADO
                    </p>
                    <h3 className="text-[15px] md:text-[16px] font-semibold text-[#545454]">
                      Sua jornada alimentando respostas mais personalizadas.
                    </h3>
                    <p className="text-[13px] text-[#545454] leading-relaxed">
                      Em breve, o que você vive nas trilhas, no planner e nos
                      mini-hubs vai ajudar a IA a responder de forma ainda mais
                      precisa e humana — sem fórmulas prontas.
                    </p>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Tudo com muito cuidado, respeitando sua história, seu
                      tempo e os limites que você quiser configurar.
                    </p>
                    <span className="inline-flex rounded-full border border-[#F5D7E5] bg-white px-3 py-1 text-[11px] font-medium text-[#545454]">
                      Disponível na fase de IA Premium
                    </span>
                  </div>
                </div>

                <p className="text-[11px] md:text-[12px] text-[#6A6A6A]">
                  Assinantes Materna+ e Materna+360 terão acesso completo às
                  trilhas guiadas, à biblioteca premium e à IA personalizada.
                  Todos os detalhes de planos serão apresentados no checkout,
                  assim que o programa for aberto.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* PROFISSIONAIS PARCEIROS */}
          <Reveal delay={60}>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="space-y-5">
                <header className="space-y-2">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PROFISSIONAIS PARCEIROS
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Rede Materna+ de profissionais indicados — com agendamento
                    direto pelo WhatsApp.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
                    Você escolhe a área, conhece o profissional em um resumo
                    rápido e, se fizer sentido, segue para um atendimento
                    combinado diretamente com ele. Sem burocracia, sem empurrar
                    sessões: só o que fizer sentido para a sua fase.
                  </p>
                  <p className="text-[12px] text-[#6A6A6A]">
                    <span className="font-semibold">Importante:</span> o
                    Materna360 não realiza atendimentos clínicos nem intermedia
                    pagamentos. A responsabilidade técnica de cada encontro é do
                    profissional.
                  </p>
                </header>

                <div className="grid gap-5 md:grid-cols-[0.9fr,1.4fr]">
                  {/* FILTROS */}
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

                    <SoftCard className="mt-3 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                      <p className="text-[13px] font-semibold text-[#545454]">
                        Como funciona na prática?
                      </p>
                      <ol className="space-y-1.5 text-[12px] text-[#545454]">
                        <li>
                          <span className="font-semibold">1.</span> Você filtra
                          a área de interesse e escolhe um profissional.
                        </li>
                        <li>
                          <span className="font-semibold">2.</span> Abre o
                          perfil, lê o resumo e, se fizer sentido, segue para o
                          contato pelo WhatsApp.
                        </li>
                        <li>
                          <span className="font-semibold">3.</span> O
                          atendimento é combinado diretamente entre você e o
                          profissional (valores, horários e forma de pagamento).
                        </li>
                      </ol>
                    </SoftCard>
                  </div>

                  {/* LISTA DE PROFISSIONAIS */}
                  <div className="space-y-3">
                    {isLoading && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] animate-pulse">
                          <div className="h-4 w-40 rounded bg-[#ffe1f1]" />
                          <div className="mt-2 h-3 w-64 rounded bg-[#ffe1f1]" />
                          <div className="mt-4 h-3 w-52 rounded bg-[#ffe1f1]" />
                        </div>
                        <div className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] animate-pulse">
                          <div className="h-4 w-48 rounded bg-[#ffe1f1]" />
                          <div className="mt-2 h-3 w-60 rounded bg-[#ffe1f1]" />
                          <div className="mt-4 h-3 w-40 rounded bg-[#ffe1f1]" />
                        </div>
                      </div>
                    )}

                    {!isLoading && error && (
                      <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-4 py-3 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                        <p className="font-semibold">
                          Não conseguimos carregar os profissionais agora.
                        </p>
                        <p className="mt-1">
                          Tente novamente em alguns minutos. Sua experiência é
                          prioridade por aqui.
                        </p>
                      </div>
                    )}

                    {!isLoading &&
                      !error &&
                      filteredProfessionals.map(prof => (
                        <div
                          key={prof.id}
                          className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.06)] flex flex-col gap-2"
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

                          <p className="text-[14px] text-[#545454]">
                            {prof.focus}
                          </p>
                          <p className="text-[12px] text-[#6A6A6A]">
                            {prof.city}
                          </p>

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

                    {!isLoading &&
                      !error &&
                      filteredProfessionals.length === 0 && (
                        <div className="mt-1.5 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/80 px-4 py-3 text-[13px] text-[#545454] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                          <p className="font-semibold">
                            Ainda não temos profissionais nessa área específica.
                          </p>
                          <p className="mt-1">
                            Em breve, novos parceiros entram para a rede
                            Materna+. Você pode escolher outra área por
                            enquanto.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* COMUNIDADE */}
          <Reveal delay={110}>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/96 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="grid gap-4 md:grid-cols-[1.4fr,1fr] md:items-center">
                <div className="space-y-3">
                  <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    COMUNIDADE MATERNA+ · EM BREVE
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                    Um lugar seguro para compartilhar o que a teoria não conta.
                  </h2>
                  <p className="text-sm md:text-[15px] text-[#545454] leading-relaxed">
                    A comunidade Materna+ está sendo desenhada para acolher mães
                    reais: com dúvidas, cansaço, humor, vontade de rir e de
                    chorar no mesmo dia.
                  </p>
                  <ul className="space-y-1.5 text-[13px] text-[#545454]">
                    <li>• Espaços moderados com cuidado e zero julgamento.</li>
                    <li>
                      • Temas guiados sobre culpa, rotina, escola,
                      comportamento e relações familiares.
                    </li>
                    <li>
                      • Momentos de troca com outras mães que vivem fases
                      parecidas.
                    </li>
                  </ul>
                  <p className="text-[12px] text-[#6A6A6A]">
                    Quando abrirmos as primeiras turmas, assinantes Materna+ e
                    Materna+360 serão avisadas com prioridade.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 text-[13px] text-[#545454] shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                  <p className="font-semibold text-[#545454]">
                    O que você pode esperar:
                  </p>
                  <p>Encontros temáticos, rodas de conversa e materiais de apoio.</p>
                  <p>
                    Sempre com linguagem simples, humana e acolhedora — sem
                    promessas de perfeição.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* SERVIÇOS MATERNA360 */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
              <div className="space-y-4">
                <p className="text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  SERVIÇOS MATERNA360
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                  Experiências que vão além do app — mas continuam cuidando da
                  sua rotina.
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* MaternaBox */}
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      MATERNABOX · ASSINATURA DE CARINHO MENSAL
                    </p>
                    <p className="text-[15px] font-semibold text-[#545454]">
                      Uma caixa mensal criada para transformar momentos simples
                      em rituais de conexão com o seu filho.
                    </p>
                    <p className="text-[13px] text-[#545454]">
                      Curadoria do Materna360, entrega na sua casa e conteúdos
                      pensados para a sua rotina real.
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

                  {/* Concierge */}
                  <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2 shadow-[0_4px_18px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                      CONCIERGE MATERNA+
                    </p>
                    <p className="text-[15px] font-semibold text-[#545454]">
                      Um canal de atendimento personalizado para te ajudar a
                      encontrar o tipo de apoio certo.
                    </p>
                    <p className="text-[13px] text-[#545454]">
                      Dentro do app, com um profissional parceiro ou com
                      experiências como a MaternaBox — tudo pensado para
                      encaixar na sua realidade.
                    </p>
                    <p className="text-[12px] text-[#6A6A6A]">
                      Serviço em fase de testes. Assinantes Materna+ e Materna+
                      360 serão convidadas primeiro.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="materna-plus" />

          {/* MODAL PROFISSIONAL PREMIUM */}
          {selectedProfessional && (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
              onClick={() => setSelectedProfessional(null)}
            >
              <div
                className="max-w-lg w-full"
                onClick={e => e.stopPropagation()}
              >
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
                    O agendamento, valores e forma de pagamento são combinados
                    diretamente entre você e o profissional. O Materna360 faz
                    apenas a indicação e a ponte — para que você se sinta
                    acolhida e segura na escolha.
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
      </ClientOnly>
    </PageTemplate>
  )
}
