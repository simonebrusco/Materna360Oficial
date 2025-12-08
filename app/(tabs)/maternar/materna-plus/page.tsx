'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

// ===============================
// TYPES
// ===============================

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

// ===============================
// DATA MOCK (para layout / estrutura)
// ===============================

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

// ===============================
// PAGE
// ===============================

export default function MaternaPlusPage() {
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyId>('todos')
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null)

  const filteredProfessionals =
    selectedSpecialty === 'todos'
      ? PROFESSIONALS
      : PROFESSIONALS.filter(p => p.specialtyId === selectedSpecialty)

  return (
    <PageTemplate
      label="MATERNAR"
      title="Materna+ — sua rede de apoio curada pelo Materna360."
      subtitle="Profissionais parceiros, serviços especiais e, em breve, uma comunidade pensada para que você não precise maternar tudo sozinha."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO */}
          <SoftCard className="rounded-3xl border border-white/80 bg-white/96 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3 max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd279d]/80">
                  MATERNA+
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[#4a4a4a]">
                  O Materna+ conecta você a profissionais, serviços e experiências
                  que complementam o app — sempre olhando para a sua rotina real.
                </h2>
                <p className="text-xs md:text-sm text-[#4a4a4a]/90 leading-relaxed">
                  Aqui você encontra indicações cuidadosas de especialistas,
                  formas de cuidado extra para a sua família e, em breve, uma
                  comunidade feita para acolher dúvidas, medos e conquistas do
                  dia a dia.
                </p>
                <p className="text-[11px] text-[#4a4a4a]/80 leading-relaxed">
                  O pagamento dos atendimentos é feito diretamente com cada
                  profissional ou serviço parceiro. O Materna360 faz a curadoria
                  e a ponte, para que você se sinta segura em cada escolha.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-[11px] md:text-xs md:w-60">
                <div className="rounded-2xl bg-[#fff0f7] border border-[#ffd8e6] px-3 py-2">
                  <p className="font-semibold text-[#fd279d]">Profissionais</p>
                  <p className="text-[#4a4a4a]/80">
                    Indicações selecionadas de especialistas em maternidade e
                    infância, com foco em atendimento online.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-[#ffd8e6] px-3 py-2">
                  <p className="font-semibold text-[#fd279d]">Comunidade</p>
                  <p className="text-[#4a4a4a]/80">
                    Em breve, um espaço seguro para trocar com outras mães que
                    vivem desafios parecidos com os seus.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-[#ffd8e6] px-3 py-2">
                  <p className="font-semibold text-[#fd279d]">
                    Serviços Materna360
                  </p>
                  <p className="text-[#4a4a4a]/80">
                    Experiências como a MaternaBox e um concierge preparado para
                    te ajudar a encontrar o apoio certo.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 1 · PROFISSIONAIS */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_14px_34px_rgba(0,0,0,0.14)] md:p-7">
            <div className="space-y-5">
              <header className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd279d]/80">
                  PROFISSIONAIS PARCEIROS
                </p>
                <h2 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  Encontros profissionais indicados pelo Materna360 — com
                  agendamento direto pelo WhatsApp.
                </h2>
                <p className="text-xs md:text-sm text-[#4a4a4a]/90 max-w-2xl">
                  Você escolhe a área, conhece o profissional em um resumo
                  rápido e, se fizer sentido, segue para um atendimento combinado
                  diretamente com ele. Sem burocracia, sem empurrar sessões: só o
                  que fizer sentido para a sua fase.
                </p>
                <p className="text-[11px] text-[#4a4a4a]/70">
                  <span className="font-semibold">Importante:</span> o
                  Materna360 não realiza atendimentos clínicos nem intermedia
                  pagamentos. A responsabilidade técnica de cada encontro é do
                  profissional.
                </p>
              </header>

              <div className="grid gap-5 md:grid-cols-[0.9fr,1.4fr]">
                {/* FILTROS */}
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold text-[#4a4a4a] uppercase tracking-wide">
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
                            'rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd279d]/30',
                            isActive
                              ? 'border-[#fd279d] bg-[#ffd8e6] text-[#fd279d]'
                              : 'border-[#ffd8e6] bg-white text-[#4a4a4a] hover:border-[#fd279d]/70 hover:bg-[#ffd8e6]/20',
                          ].join(' ')}
                        >
                          {spec.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="rounded-2xl bg-[#fff7fb] border border-[#ffd8e6]/80 px-3 py-3 text-[11px] text-[#4a4a4a]/85 space-y-1">
                    <p className="font-semibold text-[#fd279d]">
                      Como funciona na prática?
                    </p>
                    <p>1. Você filtra a área de interesse e escolhe um profissional.</p>
                    <p>
                      2. Abre o perfil, lê o resumo e, se fizer sentido, clica
                      para falar pelo WhatsApp.
                    </p>
                    <p>
                      3. O atendimento é combinado diretamente entre você e o
                      profissional (valores, horários e forma de pagamento).
                    </p>
                  </div>
                </div>

                {/* LISTA DE PROFISSIONAIS */}
                <div className="space-y-3">
                  {filteredProfessionals.length === 0 && (
                    <p className="text-[11px] md:text-xs text-[#4a4a4a]/80">
                      Ainda não temos profissionais cadastrados nesta área. Em
                      breve, novas indicações cuidadosamente selecionadas
                      aparecerão aqui.
                    </p>
                  )}

                  {filteredProfessionals.map(pro => (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => setSelectedProfessional(pro)}
                      className="group w-full text-left rounded-2xl border border-[#ffd8e6]/90 bg-white px-4 py-3 shadow-[0_6px_18px_rgba(0,0,0,0.05)] transition hover:-translate-y-[1px] hover:border-[#fd279d]/70 hover:shadow-[0_10px_26px_rgba(0,0,0,0.10)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[#4a4a4a]">
                            {pro.name}
                          </p>
                          <p className="text-[11px] text-[#fd279d]/90">
                            {pro.specialtyLabel}
                          </p>
                          <p className="text-[11px] text-[#4a4a4a]/85">
                            {pro.focus}
                          </p>
                          <p className="text-[10px] text-[#4a4a4a]/70">
                            {pro.city}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {pro.tags.map(tag => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#fff0f7] px-2 py-0.5 text-[10px] text-[#fd279d]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#fd279d]">
                          <span>Ver detalhes</span>
                          <AppIcon
                            name="arrow-right"
                            className="h-3 w-3 text-[#fd279d] group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 2 · COMUNIDADE & SERVIÇOS */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* COMUNIDADE */}
            <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] md:p-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#fd279d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fd279d]" />
                  Comunidade Materna360 · Em breve
                </div>
                <h2 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  Um lugar seguro para compartilhar o que a teoria não conta.
                </h2>
                <p className="text-xs md:text-sm text-[#4a4a4a]/90">
                  A comunidade Materna+ está sendo desenhada para acolher mães
                  reais: com dúvidas, cansaço, humor, vontade de rir e de chorar
                  no mesmo dia.
                </p>
                <ul className="space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]/90">
                  <li>• Espaços moderados com cuidado e zero julgamento.</li>
                  <li>
                    • Temas guiados sobre culpa, rotina, escola, comportamento e
                    relações familiares.
                  </li>
                  <li>
                    • Momentos de troca com outras mães que vivem fases
                    parecidas.
                  </li>
                </ul>
                <p className="text-[11px] text-[#4a4a4a]/70">
                  Quando abrirmos as primeiras turmas, assinantes Materna+ e
                  Materna+ 360 serão avisadas com prioridade.
                </p>
              </div>
            </SoftCard>

            {/* SERVIÇOS MATERNA360 */}
            <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_26px_rgba(0,0,0,0.10)] md:p-6">
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd279d]/80">
                  SERVIÇOS MATERNA360
                </p>
                <h2 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  Experiências que vão além do app — mas continuam cuidando da
                  sua rotina.
                </h2>

                <div className="space-y-3 text-[11px] md:text-xs text-[#4a4a4a]/90">
                  {/* MaternaBox */}
                  <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3 space-y-1">
                    <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#fd279d]">
                      <span className="rounded-full bg-white px-2 py-0.5">
                        MaternaBox
                      </span>
                      <span>Assinatura de carinho mensal</span>
                    </div>
                    <p>
                      Uma caixa mensal criada para transformar momentos simples
                      em rituais de conexão com o seu filho. Curadoria do
                      Materna360, entrega na sua casa.
                    </p>
                    <Link
                      href="/maternar/materna-plus/maternabox"
                      className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-[#fd279d] hover:text-[#c81d78] transition-colors"
                    >
                      Conhecer a MaternaBox
                      <AppIcon name="arrow-right" className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Concierge Materna+ */}
                  <div className="rounded-2xl border border-[#ffd8e6] bg-white px-3 py-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#fd279d]">
                      Concierge Materna+
                    </p>
                    <p>
                      Um canal de atendimento personalizado (via WhatsApp) para
                      te ajudar a encontrar o tipo de apoio certo: dentro do
                      app, com um profissional parceiro ou com experiências como
                      a MaternaBox.
                    </p>
                    <p className="text-[10px] text-[#4a4a4a]/70">
                      Em fase de testes internos. Quando estiver disponível, você
                      verá o botão direto aqui dentro do app.
                    </p>
                  </div>

                  {/* Conteúdos digitais incluídos */}
                  <div className="rounded-2xl border border-dashed border-[#ffd8e6] bg-white px-3 py-3 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#fd279d]">
                      Conteúdos digitais já inclusos
                    </p>
                    <p>
                      Manual de Sobrevivência para Pais, minicurso de
                      parentalidade, áudios de acalmamento, cadernos práticos e
                      outros materiais premium fazem parte dos planos Materna+ —
                      sem cobranças adicionais.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>

          <MotivationalFooter routeKey="materna-plus" />
        </div>

        {/* MODAL PROFISSIONAL */}
        {selectedProfessional && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg">
              <SoftCard className="relative rounded-3xl border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.40)]">
                <button
                  type="button"
                  onClick={() => setSelectedProfessional(null)}
                  className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ffd8e6] bg-white text-[#4a4a4a] text-xs shadow-sm hover:bg-[#fff0f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd279d]/40"
                >
                  <span className="sr-only">Fechar</span>
                  ×
                </button>

                <div className="space-y-3 pr-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#fd279d]/90">
                    Profissional parceiro Materna360
                  </p>
                  <h2 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                    {selectedProfessional.name}
                  </h2>
                  <p className="text-[11px] font-semibold text-[#fd279d]/90">
                    {selectedProfessional.specialtyLabel}
                  </p>
                  <p className="text-[11px] text-[#4a4a4a]/85">
                    {selectedProfessional.shortBio}
                  </p>
                  <p className="text-[10px] text-[#4a4a4a]/70">
                    {selectedProfessional.city}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedProfessional.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#fff0f7] px-2 py-0.5 text-[10px] text-[#fd279d]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 text-[10px] text-[#4a4a4a]/75">
                    <p>
                      O agendamento, valores e forma de pagamento são combinados
                      diretamente entre você e o profissional, fora do app
                      Materna360.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() => setSelectedProfessional(null)}
                    >
                      Voltar para a lista
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        const url = selectedProfessional.whatsappUrl
                        if (typeof window !== 'undefined') {
                          window.open(url, '_blank')
                        }
                      }}
                    >
                      Falar pelo WhatsApp
                    </Button>
                  </div>
                </div>
              </SoftCard>
            </div>
          </div>
        )}
      </ClientOnly>
    </PageTemplate>
  )
}
