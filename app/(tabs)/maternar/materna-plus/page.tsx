'use client'

import React, { useState } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

type SpecialtyId =
  | 'todos'
  | 'psicologia-infantil'
  | 'psicopedagogia'
  | 'nutricao-materno-infantil'
  | 'sono-infantil'
  | 'parentalidade-familia'

type Professional = {
  id: string
  name: string
  specialtyId: SpecialtyId
  specialtyLabel: string
  focus: string
  city: string
  shortBio: string
  tags: string[]
  whatsappUrl: string
}

const SPECIALTIES: { id: SpecialtyId; label: string }[] = [
  { id: 'todos', label: 'Todos os profissionais' },
  { id: 'psicologia-infantil', label: 'Psicologia infantil' },
  { id: 'psicopedagogia', label: 'Psicopedagogia' },
  { id: 'nutricao-materno-infantil', label: 'Nutrição materno-infantil' },
  { id: 'sono-infantil', label: 'Sono infantil' },
  { id: 'parentalidade-familia', label: 'Parentalidade & família' },
]

const PROFESSIONALS: Professional[] = [
  {
    id: 'prof-1',
    name: 'Dra. Mariana Alves',
    specialtyId: 'psicologia-infantil',
    specialtyLabel: 'Psicóloga infantil · CRP 00/00000',
    focus: 'Regulação emocional, birras e rotina leve em casa.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Psicóloga infantil com mais de 10 anos acolhendo famílias em desafios de comportamento, ansiedade infantil e culpa materna.',
    tags: ['Atendimento online', 'Orientação para pais', 'Primeira infância'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-2',
    name: 'Bruna Ribeiro',
    specialtyId: 'psicopedagogia',
    specialtyLabel: 'Psicopedagoga · Especialista em alfabetização',
    focus: 'Dificuldades escolares, rotina de estudos e apoio às famílias.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Ajuda mães e crianças a construírem um relacionamento mais leve com a escola, tarefas e primeiros anos escolares.',
    tags: ['Rotina de estudos', 'Primeiros anos escolares'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-3',
    name: 'Dr. Felipe Souza',
    specialtyId: 'nutricao-materno-infantil',
    specialtyLabel: 'Nutricionista materno-infantil · CRN 0000',
    focus: 'Alimentação afetiva, seletividade alimentar e rotina de refeições.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Trabalha com foco em vínculo e em refeições possíveis, sem terrorismo nutricional, respeitando o ritmo da família.',
    tags: ['Rotina de refeições', 'Seletividade alimentar'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
  {
    id: 'prof-4',
    name: 'Ana Paula Mendes',
    specialtyId: 'parentalidade-familia',
    specialtyLabel: 'Mentora em parentalidade consciente',
    focus: 'Culpa materna, divisão de tarefas e acordos familiares.',
    city: 'Atendimento online · Brasil',
    shortBio:
      'Ajuda mães a saírem do piloto automático e construírem uma maternidade mais possível, com mais acordos e menos culpa.',
    tags: ['Parentalidade consciente', 'Casal & família'],
    whatsappUrl: 'https://wa.me/5500000000000?text=Olá%2C+vim+pelo+Materna360',
  },
]

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyId>('todos')
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)

  const filteredProfessionals =
    selectedSpecialty === 'todos'
      ? PROFESSIONALS
      : PROFESSIONALS.filter(p => p.specialtyId === selectedSpecialty)

  const handleContactProfessional = () => {
    if (!selectedProfessional) return
    if (typeof window !== 'undefined') {
      window.open(selectedProfessional.whatsappUrl, '_blank')
    }
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="Materna+ — sua rede de apoio curada pelo Materna360."
      subtitle="Profissionais parceiros, serviços especiais e, em breve, uma comunidade pensada para que você não precise maternar tudo sozinha."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/95 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.18)] md:p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-4 max-w-xl">
                <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  MATERNA+
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                  O Materna+ conecta você a profissionais, serviços e
                  experiências que complementam o app — sempre olhando para a
                  sua rotina real.
                </h2>
                <p className="text-[14px] md:text-[15px] text-[#545454] leading-relaxed">
                  Aqui você encontra indicações cuidadosas de especialistas,
                  formas de cuidado extra para a sua família e, em breve, uma
                  comunidade feita para acolher dúvidas, medos e conquistas do
                  dia a dia.
                </p>
                <p className="text-[12px] text-[#6A6A6A] leading-relaxed">
                  O pagamento dos atendimentos é feito diretamente com cada
                  profissional ou serviço parceiro. O Materna360 faz a curadoria
                  e a ponte, para que você se sinta segura em cada escolha.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 text-[13px] md:w-64">
                <div className="rounded-2xl bg-white border border-[#F5D7E5] px-3 py-2.5">
                  <p className="font-semibold text-[#fd2597]">Profissionais</p>
                  <p className="text-[#545454]">
                    Indicações selecionadas de especialistas em maternidade e
                    infância, com foco em atendimento online.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-[#F5D7E5] px-3 py-2.5">
                  <p className="font-semibold text-[#fd2597]">Comunidade</p>
                  <p className="text-[#545454]">
                    Em breve, um espaço seguro para trocar com outras mães que
                    vivem desafios parecidos com os seus.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-[#F5D7E5] px-3 py-2.5">
                  <p className="font-semibold text-[#fd2597]">
                    Serviços Materna360
                  </p>
                  <p className="text-[#545454]">
                    Experiências como a MaternaBox e um concierge preparado para
                    te ajudar a encontrar o apoio certo.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* PROFISSIONAIS PARCEIROS */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.16)] md:p-7">
            <div className="space-y-5">
              <header className="space-y-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  PROFISSIONAIS PARCEIROS
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                  Encontros profissionais indicados pelo Materna360 — com
                  agendamento direto pelo WhatsApp.
                </h2>
                <p className="text-[14px] md:text-[15px] text-[#545454] max-w-2xl leading-relaxed">
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
                  <p className="text-[13px] font-semibold text-[#2F3A56]">
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
                              : 'border-[#F5D7E5] bg-white text-[#2F3A56] hover:border-[#fd2597] hover:bg-[#fdbed7]/40'
                          }`}
                        >
                          {spec.label}
                        </button>
                      )
                    })}
                  </div>

                  <SoftCard className="mt-3 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2">
                    <p className="text-[13px] font-semibold text-[#2F3A56]">
                      Como funciona na prática?
                    </p>
                    <ol className="space-y-1.5 text-[12px] text-[#545454]">
                      <li>
                        <span className="font-semibold">1.</span> Você filtra a
                        área de interesse e escolhe um profissional.
                      </li>
                      <li>
                        <span className="font-semibold">2.</span> Abre o perfil,
                        lê o resumo e, se fizer sentido, segue para o contato
                        pelo WhatsApp.
                      </li>
                      <li>
                        <span className="font-semibold">3.</span> O atendimento
                        é combinado diretamente entre você e o profissional
                        (valores, horários e forma de pagamento).
                      </li>
                    </ol>
                  </SoftCard>
                </div>

                {/* LISTA DE PROFISSIONAIS */}
                <div className="space-y-3">
                  {filteredProfessionals.map(prof => (
                    <div
                      key={prof.id}
                      className="rounded-2xl border border-[#F5D7E5] bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.06)] flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="text-[18px] md:text-[20px] font-semibold text-[#2F3A56]">
                            {prof.name}
                          </h3>
                          <p className="text-[13px] text-[#6A6A6A]">
                            {prof.specialtyLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProfessional(prof)}
                          className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                        >
                          Ver detalhes
                        </button>
                      </div>

                      <p className="text-[14px] text-[#545454]">
                        {prof.focus}
                      </p>
                      <p className="text-[12px] text-[#6A6A6A]">{prof.city}</p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {prof.tags.map(tag => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#fdbed7]/70 px-2 py-0.5 text-[11px] font-medium text-[#2F3A56]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SoftCard>

          {/* COMUNIDADE */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/96 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.14)] md:p-7">
            <div className="grid gap-4 md:grid-cols-[1.4fr,1fr] md:items-center">
              <div className="space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                  COMUNIDADE MATERNA+ · EM BREVE
                </p>
                <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                  Um lugar seguro para compartilhar o que a teoria não conta.
                </h2>
                <p className="text-[14px] md:text-[15px] text-[#545454] leading-relaxed">
                  A comunidade Materna+ está sendo desenhada para acolher mães
                  reais: com dúvidas, cansaço, humor, vontade de rir e de chorar
                  no mesmo dia.
                </p>
                <ul className="space-y-1.5 text-[13px] text-[#545454]">
                  <li>
                    • Espaços moderados com cuidado e zero julgamento.
                  </li>
                  <li>
                    • Temas guiados sobre culpa, rotina, escola, comportamento e
                    relações familiares.
                  </li>
                  <li>
                    • Momentos de troca com outras mães que vivem fases
                    parecidas.
                  </li>
                </ul>
                <p className="text-[12px] text-[#6A6A6A]">
                  Quando abrirmos as primeiras turmas, assinantes Materna+ e
                  Materna+ 360 serão avisadas com prioridade.
                </p>
              </div>

              <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2 text-[13px] text-[#545454]">
                <p className="font-semibold text-[#2F3A56]">
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

          {/* SERVIÇOS MATERNA360 */}
          <SoftCard className="rounded-3xl border border-[#F5D7E5] bg-white/98 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.15)] md:p-7">
            <div className="space-y-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-[#fd2597]/85">
                SERVIÇOS MATERNA360
              </p>
              <h2 className="text-[22px] md:text-[24px] font-semibold text-[#2F3A56]">
                Experiências que vão além do app — mas continuam cuidando da sua
                rotina.
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {/* MaternaBox */}
                <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1] p-4 space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                    MATERNABOX · ASSINATURA DE CARINHO MENSAL
                  </p>
                  <p className="text-[15px] font-semibold text-[#2F3A56]">
                    Uma caixa mensal criada para transformar momentos simples em
                    rituais de conexão com o seu filho.
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
                <div className="rounded-2xl border border-[#F5D7E5] bg-white p-4 space-y-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#fd2597]">
                    CONCIERGE MATERNA+
                  </p>
                  <p className="text-[15px] font-semibold text-[#2F3A56]">
                    Um canal de atendimento personalizado para te ajudar a
                    encontrar o tipo de apoio certo.
                  </p>
                  <p className="text-[13px] text-[#545454]">
                    Dentro do app, com um profissional parceiro ou com
                    experiências como a MaternaBox — tudo pensado para encaixar
                    na sua realidade.
                  </p>
                  <p className="text-[12px] text-[#6A6A6A]">
                    Serviço em fase de testes. Assinantes Materna+ e Materna+
                    360 serão convidadas primeiro.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="materna-plus" />

          {/* MODAL PROFISSIONAL */}
          {selectedProfessional && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="max-w-lg w-full">
                <SoftCard className="rounded-3xl bg-white p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)] border border-[#F5D7E5]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-[20px] font-semibold text-[#2F3A56]">
                        {selectedProfessional.name}
                      </h3>
                      <p className="text-[13px] text-[#6A6A6A]">
                        {selectedProfessional.specialtyLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProfessional(null)}
                      className="text-[12px] font-semibold text-[#fd2597] hover:text-[#b8236b]"
                    >
                      Fechar
                    </button>
                  </div>

                  <p className="mt-3 text-[14px] text-[#545454]">
                    {selectedProfessional.shortBio}
                  </p>
                  <p className="mt-2 text-[13px] text-[#6A6A6A]">
                    {selectedProfessional.city}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedProfessional.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fdbed7]/80 px-2 py-0.5 text-[11px] font-medium text-[#2F3A56]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-[12px] text-[#6A6A6A]">
                    O agendamento, valores e forma de pagamento são combinados
                    diretamente entre você e o profissional. O Materna360 faz
                    apenas a indicação e a ponte.
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
