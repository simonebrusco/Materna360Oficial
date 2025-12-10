'use client'

import React from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

type PlanId = 'essencial' | 'materna-plus' | 'materna-360'

type Plan = {
  id: PlanId
  name: string
  label: string
  price: string
  priceNote?: string
  description: string
  highlight?: 'recomendado' | 'completo'
  tag?: string
}

const PLANS: Plan[] = [
  {
    id: 'essencial',
    name: 'Essencial',
    label: 'Plano gratuito',
    price: 'R$ 0',
    priceNote: '/mês',
    description:
      'Para começar a organizar o dia e experimentar o jeito Materna360 de cuidar da rotina.',
  },
  {
    id: 'materna-plus',
    name: 'Materna+',
    label: 'Plano Materna+',
    price: 'R$ 29,90',
    priceNote: '/mês',
    highlight: 'recomendado',
    tag: 'Mais escolhido',
    description:
      'Para quem quer apoio contínuo, conteúdos extras e uma experiência mais completa no dia a dia.',
  },
  {
    id: 'materna-360',
    name: 'Materna+ 360',
    label: 'Plano Materna+ 360',
    price: 'R$ 49,90',
    priceNote: '/mês',
    highlight: 'completo',
    tag: 'Experiência completa',
    description:
      'Para quem deseja viver o Materna360 em todas as camadas: rotina, emoções, conteúdos premium e benefícios exclusivos.',
  },
]

const FEATURES = [
  {
    label: 'Planner diário premium',
    essencial: 'Sim',
    plus: 'Sim',
    full: 'Sim',
  },
  {
    label: 'Check-in emocional & Como Estou Hoje',
    essencial: 'Sim',
    plus: 'Sim',
    full: 'Sim',
  },
  {
    label: 'Rotina Leve com sugestões inteligentes',
    essencial: 'Básico',
    plus: 'Completo',
    full: 'Completo',
  },
  {
    label: 'Limites de IA no dia a dia',
    essencial: 'Uso pontual',
    plus: 'Uso ampliado',
    full: 'Uso avançado',
  },
  {
    label: 'Biblioteca Materna',
    essencial: 'Amostras',
    plus: 'Guia & materiais',
    full: 'Completa + trilhas',
  },
  {
    label: 'Trilhas guiadas por idade',
    essencial: 'Não incluso',
    plus: 'Alguns módulos',
    full: 'Acesso completo',
  },
  {
    label: 'Exportar PDF do planner',
    essencial: 'Não incluso',
    plus: 'Sim',
    full: 'Sim',
  },
  {
    label: 'Produtos digitais com desconto',
    essencial: 'Não incluso',
    plus: 'Benefícios pontuais',
    full: 'Benefícios recorrentes',
  },
  {
    label: 'Gamificação & conquistas',
    essencial: 'Básico',
    plus: 'Completo',
    full: 'Completo + extras',
  },
  {
    label: 'Acesso prioritário a novidades',
    essencial: 'Não',
    plus: 'Sim',
    full: 'Sim + experiências exclusivas',
  },
]

export default function PlanosPage() {
  // Por enquanto, mantemos sem integração real de plano atual,
  // apenas com layout pronto. Integração pode vir depois.
  const currentPlanId: PlanId = 'essencial'

  const handleSelectPlan = (plan: Plan) => {
    // Aqui depois conectamos com UpgradeSheet / checkout real.
    // Por enquanto, mantemos apenas um placeholder seguro.
    if (typeof window !== 'undefined') {
      // Ex.: abrir futuro modal ou redirecionar
      // window.alert(`Fluxo de upgrade para: ${plan.name} em breve.`)
      console.log('[Materna360][Planos] Selecionar plano:', plan.id)
    }
  }

  return (
    <PageTemplate
      label="MATERNA+"
      title="Escolha o plano que acompanha o seu momento."
      subtitle="Você pode começar de onde faz mais sentido hoje — e ajustar depois, conforme a sua rotina, o seu orçamento e a fase da sua família."
    >
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 md:pt-8 space-y-10 md:space-y-12">
          {/* HERO / INTRO */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 px-5 py-6 shadow-[0_16px_32px_rgba(0,0,0,0.14)] md:px-7 md:py-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3 md:space-y-4 max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]">
                  <AppIcon name="sparkles" className="h-3 w-3 text-[#fd2597]" />
                  <span>Planos Materna360</span>
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#545454] leading-snug">
                  Três formas de viver o Materna360 — começando pelo que cabe no
                  seu hoje.
                </h2>
                <p className="text-[13px] md:text-[14px] text-[#545454] leading-relaxed">
                  Todos os planos foram pensados para acompanhar a rotina real,
                  com dias bons, dias difíceis e muita coisa acontecendo ao
                  mesmo tempo. Você pode começar no Essencial, migrar para o
                  Materna+ ou viver a experiência completa — sem amarras e sem
                  culpa.
                </p>
                <p className="text-[12px] text-[#6A6A6A]">
                  Você pode alterar ou cancelar o plano depois. O importante é
                  que ele faça sentido para a sua fase, e não o contrário.
                </p>
              </div>

              <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-4 py-3 text-[12px] text-[#545454] space-y-1.5 max-w-sm">
                <p className="font-semibold text-[#2F3A56]">
                  Como pensar no plano certo?
                </p>
                <p>
                  • Se você está começando agora a organizar sua rotina, o{' '}
                  <span className="font-semibold">Essencial</span> já é um
                  grande passo.
                </p>
                <p>
                  • Se quer apoio extra, conteúdos e IA ampliada, o{' '}
                  <span className="font-semibold">Materna+</span> costuma ser o
                  ponto ideal.
                </p>
                <p>
                  • Se deseja viver o ecossistema completo, o{' '}
                  <span className="font-semibold">Materna+ 360</span> é o seu
                  lugar.
                </p>
              </div>
            </div>
          </SoftCard>

          {/* CARDS DE PLANOS */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 px-5 py-6 shadow-[0_16px_32px_rgba(0,0,0,0.14)] md:px-7 md:py-7">
            <div className="space-y-5 md:space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                    PLANOS DISPONÍVEIS
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                    Escolha o plano que conversa com o seu momento de agora.
                  </h3>
                  <p className="text-[11px] md:text-[12px] text-[#6A6A6A] max-w-xl">
                    Todos incluem o planner diário, check-in emocional e acesso
                    aos hubs principais. O que muda é a profundidade de IA,
                    conteúdos e benefícios extras.
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-medium text-[#545454]">
                  Você pode ajustar o plano depois — sem burocracia.
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map(plan => {
                  const isCurrent = plan.id === currentPlanId
                  const isHighlight = !!plan.highlight

                  return (
                    <div
                      key={plan.id}
                      className={[
                        'flex flex-col rounded-2xl border p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]',
                        plan.id === 'essencial'
                          ? 'bg-white border-[#F5D7E5]'
                          : '',
                        plan.id === 'materna-plus'
                          ? 'bg-[#ffe1f1] border-[#fd2597]'
                          : '',
                        plan.id === 'materna-360'
                          ? 'bg-white border-[#fd2597]'
                          : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fd2597]">
                            {plan.label}
                          </p>
                          <p className="text-sm font-semibold text-[#545454]">
                            {plan.name}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {plan.tag && (
                            <span className="rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[9px] font-semibold text-[#fd2597]">
                              {plan.tag}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="rounded-full bg-[#fdbed7] px-2 py-0.5 text-[9px] font-semibold text-[#b8236b]">
                              Seu plano atual
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-[22px] font-semibold text-[#545454]">
                          {plan.price}
                          <span className="text-xs font-normal text-[#6A6A6A]">
                            {' '}
                            {plan.priceNote}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#545454]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mt-3 border-t border-[#F5D7E5] pt-2.5 space-y-1.5 text-[11px] text-[#545454]">
                        {plan.id === 'essencial' && (
                          <>
                            <p>✔ Planner diário premium</p>
                            <p>✔ Check-in emocional & Rotina Leve</p>
                            <p>✔ Acesso aos hubs principais</p>
                          </>
                        )}
                        {plan.id === 'materna-plus' && (
                          <>
                            <p>✔ Tudo do Essencial</p>
                            <p>✔ IA ampliada para o dia a dia</p>
                            <p>✔ Biblioteca com guias & materiais extras</p>
                            <p>✔ Exportar PDFs do planner</p>
                          </>
                        )}
                        {plan.id === 'materna-360' && (
                          <>
                            <p>✔ Tudo do Materna+</p>
                            <p>✔ Trilhas guiadas completas por idade</p>
                            <p>✔ Benefícios recorrentes em produtos digitais</p>
                            <p>✔ Acesso prioritário a novidades & experiências</p>
                          </>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSelectPlan(plan)}
                        className={[
                          'mt-4 w-full rounded-full text-[11px] font-semibold',
                          isCurrent
                            ? 'bg-white text-[#fd2597] border border-[#fd2597] hover:bg-[#ffe1f1]'
                            : '',
                          !isCurrent && !isHighlight
                            ? 'bg-white text-[#fd2597] border border-[#fd2597] hover:bg-[#ffe1f1]'
                            : '',
                          !isCurrent && isHighlight && plan.id === 'materna-plus'
                            ? 'bg-[#fd2597] text-white border-none hover:bg-[#b8236b]'
                            : '',
                          !isCurrent && isHighlight && plan.id === 'materna-360'
                            ? 'bg-white text-[#fd2597] border border-[#fd2597] hover:bg-[#ffe1f1]'
                            : '',
                        ].join(' ')}
                      >
                        {isCurrent
                          ? 'Seu plano atual'
                          : plan.id === 'essencial'
                            ? 'Começar pelo Essencial'
                            : plan.id === 'materna-plus'
                              ? 'Quero o Materna+'
                              : 'Quero o Materna+ 360'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          </SoftCard>

          {/* TABELA COMPARATIVA */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 px-5 py-6 shadow-[0_16px_32px_rgba(0,0,0,0.14)] md:px-7 md:py-7">
            <div className="space-y-4 md:space-y-5">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  COMPARANDO OS PLANOS
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#545454]">
                  Um resumo do que muda de um plano para o outro.
                </h3>
                <p className="text-[11px] md:text-[12px] text-[#6A6A6A] max-w-2xl">
                  Você não precisa decorar nada. Essa tabela existe para te
                  ajudar a visualizar, de forma simples, onde cada plano entra
                  na sua rotina e no seu orçamento.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-[11px] md:text-[12px] text-[#545454]">
                  <thead>
                    <tr className="bg-[#ffe1f1]">
                      <th className="px-3 py-2 text-left font-semibold">
                        Recurso
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Essencial
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Materna+
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Materna+ 360
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES.map((feature, index) => (
                      <tr
                        key={feature.label}
                        className={
                          index % 2 === 0 ? 'bg-white' : 'bg-[#fff7fb]'
                        }
                      >
                        <td className="px-3 py-2 align-top">{feature.label}</td>
                        <td className="px-3 py-2 align-top">
                          {feature.essencial}
                        </td>
                        <td className="px-3 py-2 align-top">{feature.plus}</td>
                        <td className="px-3 py-2 align-top">{feature.full}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] md:text-[12px] text-[#6A6A6A]">
                Você pode começar em um plano e, depois de um tempo, migrar
                para outro — para mais ou para menos. O Materna360 foi pensado
                para caminhar com você, não para te prender.
              </p>
            </div>
          </SoftCard>

          {/* NOTA FINAL / CONFORTO EM RELAÇÃO A MUDANÇA DE PLANO */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:px-7 md:py-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5 max-w-2xl">
                <h4 className="text-sm md:text-base font-semibold text-[#545454]">
                  Você não precisa decidir “para sempre”. Só o agora já é mais
                  do que suficiente.
                </h4>
                <p className="text-[11px] md:text-[12px] text-[#545454]">
                  Se em algum momento o orçamento apertar, a rotina mudar ou
                  você sentir que precisa de mais ou menos recursos, está tudo
                  bem. O plano pode ser ajustado, pausado ou cancelado. O que
                  fica é a forma como você se trata nesse processo.
                </p>
              </div>
              <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] px-4 py-3 text-[11px] md:text-[12px] text-[#545454]">
                <p>
                  <span className="font-semibold">Lembrete importante:</span>{' '}
                  você não precisa ser perfeita nem ter tudo sob controle para
                  merecer cuidado. O Materna360 existe justamente para caminhar
                  com você nos dias em que é mais fácil e, principalmente, nos
                  dias em que não é.
                </p>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="planos-materna" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
