'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

type MaternaPlusSearchParams = {
  abrir?: 'profissionais' | 'comunidade' | 'servicos' | string
  especialidade?: string
}

type Professional = {
  id: string
  name: string
  specialtyLabel: string
  specialtyKey:
    | 'pediatria'
    | 'nutricao'
    | 'psicologia'
    | 'psicopedagogia'
    | 'fonoaudiologia'
    | 'parentalidade'
  shortBio: string
  whatsappLink?: string
}

type Service = {
  id: string
  name: string
  description: string
  highlight?: string
  href?: string
}

export const metadata: Metadata = {
  title: 'Materna+ | Materna360',
}

const SPECIALTY_FILTERS: { key: Professional['specialtyKey']; label: string }[] =
  [
    { key: 'pediatria', label: 'Pediatria' },
    { key: 'nutricao', label: 'Nutrição' },
    { key: 'psicologia', label: 'Psicologia' },
    { key: 'psicopedagogia', label: 'Psicopedagogia' },
    { key: 'fonoaudiologia', label: 'Fonoaudiologia' },
    { key: 'parentalidade', label: 'Parentalidade' },
  ]

const PROFESSIONALS: Professional[] = [
  {
    id: 'pediatra',
    name: 'Dra. Ana Paula Ribeiro',
    specialtyLabel: 'Pediatra',
    specialtyKey: 'pediatria',
    shortBio:
      'Atendimento online focado em acolher dúvidas do dia a dia, sem alarmismo.',
    whatsappLink: '#',
  },
  {
    id: 'nutricionista',
    name: 'Dra. Juliana Martins',
    specialtyLabel: 'Nutricionista materno-infantil',
    specialtyKey: 'nutricao',
    shortBio:
      'Ajuda famílias a construírem uma relação leve com a alimentação.',
    whatsappLink: '#',
  },
  {
    id: 'psicopedagoga',
    name: 'Profa. Carla Souza',
    specialtyLabel: 'Psicopedagoga',
    specialtyKey: 'psicopedagogia',
    shortBio:
      'Acompanha desafios de aprendizagem com orientações práticas para os pais.',
    whatsappLink: '#',
  },
]

const SERVICES: Service[] = [
  {
    id: 'workshops',
    name: 'Aulas & workshops Materna360',
    description:
      'Encontros online sobre temas como culpa materna, rotina leve e desenvolvimento infantil.',
    highlight: 'Em breve',
    href: '#',
  },
  {
    id: 'consultoria-parental',
    name: 'Consultoria parental',
    description:
      'Atendimentos individuais para olhar com calma para a rotina da sua família.',
    highlight: 'Formato em definição',
    href: '#',
  },
  {
    id: 'produtos-digitais',
    name: 'Produtos digitais Materna360',
    description:
      'E-books, guias práticos e materiais para apoiar o dia a dia com leveza.',
    highlight: 'Catálogo em expansão',
    href: '#',
  },
]

const SHORTCUT_LABEL: Record<string, string> = {
  profissionais: 'Profissionais Materna360',
  comunidade: 'Comunidade Materna360',
  servicos: 'Serviços Materna',
}

const SECTION_LINKS = [
  { id: 'profissionais', label: 'Profissionais Materna360' },
  { id: 'comunidade', label: 'Comunidade Materna360' },
  { id: 'servicos', label: 'Serviços Materna' },
] as const

export default function MaternaPlusPage({
  searchParams,
}: {
  searchParams?: MaternaPlusSearchParams
}) {
  const abrirParam = searchParams?.abrir ?? 'profissionais'
  const activeSection =
    abrirParam === 'comunidade' || abrirParam === 'servicos'
      ? abrirParam
      : 'profissionais'

  const shortcutLabel = abrirParam && SHORTCUT_LABEL[abrirParam]

  const selectedSpecialty =
    (searchParams?.especialidade as Professional['specialtyKey'] | undefined) ??
    'todas'

  const filteredProfessionals =
    selectedSpecialty === 'todas'
      ? PROFESSIONALS
      : PROFESSIONALS.filter(p => p.specialtyKey === selectedSpecialty)

  return (
    <PageTemplate
      label="MATERNAR"
      title="Materna+"
      subtitle="Profissionais, comunidade e serviços selecionados com carinho para caminhar com você."
    >
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-12 space-y-8 md:px-6 md:space-y-10">
        {/* HERO / INTRO PREMIUM */}
        <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/95 px-4 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)] md:px-8 md:py-7 space-y-4">
          {/* Linha de atalho */}
          {shortcutLabel && (
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#ffd8e6] bg-[#fff7fb] px-4 py-2 text-[11px] text-[#545454] shadow-[0_6px_16px_rgba(0,0,0,0.06)] md:text-xs">
              <AppIcon
                name="location"
                className="h-4 w-4 text-[#ff005e]"
                decorative
              />
              <span className="truncate">
                Você chegou aqui pelo atalho{' '}
                <span className="font-semibold">{shortcutLabel}</span>. Se
                quiser, pode começar por essa área.
              </span>
            </div>
          )}

          {/* Texto principal */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
              Espaço premium de apoio
            </p>
            <p className="max-w-2xl text-sm text-[#545454] md:text-base">
              Aqui você encontra profissionais com selo Materna, um lugar seguro
              para conversar com outras mães e serviços pensados para caminhar
              ao seu lado — sem pressa, no seu ritmo.
            </p>
          </div>

          {/* Chips descritivos */}
          <div className="flex flex-wrap gap-2">
            {[
              'Profissionais Materna360',
              'Comunidade oficial',
              'Serviços Materna',
            ].map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[#ffd8e6] bg-[#fff7fb] px-3 py-1 text-[11px] font-medium text-[#545454]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                {tag}
              </span>
            ))}
          </div>

          {/* Navegação principal das áreas */}
          <div className="pt-1 border-t border-[#ffe2ef] mt-2">
            <p className="mt-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#545454]/80">
              Por onde você quer começar hoje?
            </p>
            <div className="flex flex-wrap gap-2">
              {SECTION_LINKS.map(section => {
                const isActive = activeSection === section.id
                const href = `?abrir=${section.id}#${section.id}`
                return (
                  <Link
                    key={section.id}
                    href={href}
                    scroll={false}
                    replace
                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-all md:text-sm ${
                      isActive
                        ? 'bg-[#ff005e] text-white shadow-[0_8px_22px_rgba(255,0,94,0.45)]'
                        : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e]/80 hover:bg-[#fff0f6]'
                    }`}
                  >
                    {section.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </SoftCard>

        {/* GRID PRINCIPAL */}
        <div className="space-y-6 md:grid md:grid-cols-12 md:gap-5 md:space-y-0 lg:gap-6 md:items-start">
          {/* COLUNA ESQUERDA – PROFISSIONAIS */}
          <section
            id="profissionais"
            aria-label="Profissionais Materna360"
            className="space-y-4 md:col-span-7 lg:col-span-7"
          >
            <header className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff005e]/80">
                PROFISSIONAIS
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Profissionais Materna360
              </h2>
              <p className="text-sm text-[#545454]">
                Especialistas selecionados com carinho, prontos para apoiar você
                em diferentes fases da maternidade.
              </p>
            </header>

            {/* Filtros de especialidade */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="?abrir=profissionais"
                scroll={false}
                replace
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedSpecialty === 'todas'
                    ? 'border-[#ff005e] bg-[#ff005e] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                    : 'border-[#ffd8e6] bg-white text-[#545454] hover:border-[#ff005e]/70'
                }`}
              >
                Todas
              </Link>

              {SPECIALTY_FILTERS.map(filter => {
                const isActive = selectedSpecialty === filter.key
                const href = `?abrir=profissionais&especialidade=${filter.key}`

                return (
                  <Link
                    key={filter.key}
                    href={href}
                    scroll={false}
                    replace
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-[#ff005e] bg-[#ff005e] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                        : 'border-[#ffd8e6] bg-white text-[#545454] hover:border-[#ff005e]/70'
                    }`}
                  >
                    {filter.label}
                  </Link>
                )
              })}
            </div>

            {/* Lista de profissionais */}
            <div className="mt-3 space-y-3">
              {filteredProfessionals.length === 0 ? (
                <SoftCard className="rounded-3xl border border-dashed border-[#ffd8e6] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)] md:px-5 md:py-5">
                  <p className="text-sm text-[#545454]">
                    Em breve, teremos profissionais cadastrados nesta área.
                  </p>
                </SoftCard>
              ) : (
                filteredProfessionals.map(prof => (
                  <div
                    key={prof.id}
                    className="relative flex flex-col gap-3 rounded-3xl border border-[#ffd8e6] bg-white px-4 py-4 shadow-[0_12px_28px_rgba(0,0,0,0.10)] md:px-5 md:py-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff005e]/85">
                          Profissional Materna360
                        </p>
                        <p className="text-sm font-semibold text-[#2f3a56]">
                          {prof.name}
                        </p>
                        <p className="text-xs font-medium text-[#9b4d96]">
                          {prof.specialtyLabel}
                        </p>
                      </div>
                      <AppIcon
                        name="care"
                        className="h-6 w-6 text-[#ff005e]"
                        decorative
                      />
                    </div>

                    <p className="text-sm text-[#545454]">{prof.shortBio}</p>

                    <div className="flex flex-col gap-2 pt-1">
                      <a
                        href={prof.whatsappLink ?? '#'}
                        target={prof.whatsappLink ? '_blank' : undefined}
                        rel={
                          prof.whatsappLink ? 'noopener noreferrer' : undefined
                        }
                        className="inline-flex w-fit items-center justify-center rounded-full bg-[#ff005e] px-4 py-2 text-xs font-medium text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)] md:text-sm"
                      >
                        Falar pelo WhatsApp
                      </a>
                      {!prof.whatsappLink || prof.whatsappLink === '#' ? (
                        <p className="text-[11px] text-[#6a6a6a]">
                          Em breve, este botão vai levar direto para o WhatsApp
                          deste profissional.
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      aria-label="Favoritar profissional"
                      className="absolute right-3.5 top-3.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ffd8e6] bg-white text-[#ff005e] shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
                    >
                      <AppIcon
                        name="heart"
                        className="h-3.5 w-3.5"
                        decorative
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUNA DIREITA – COMUNIDADE + SERVIÇOS */}
          <div className="space-y-4 md:col-span-5 lg:col-span-5">
            {/* Comunidade */}
            <section
              id="comunidade"
              aria-label="Comunidade Materna360"
              className="space-y-3"
            >
              <header className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff005e]/80">
                  COMUNIDADE
                </p>
                <h2 className="text-sm font-semibold text-[#2f3a56] md:text-base">
                  Comunidade Materna360
                </h2>
              </header>

              <SoftCard className="flex flex-col gap-3 rounded-3xl border border-[#ffd8e6] bg-white px-4 py-4 shadow-[0_10px_26px_rgba(0,0,0,0.10)] md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2f3a56]">
                      Um lugar para você não se sentir sozinha
                    </p>
                    <p className="text-sm text-[#545454]">
                      Aqui você pode desabafar, pedir ideias e se sentir
                      acolhida por quem está vivendo algo parecido com você.
                    </p>
                  </div>
                  <AppIcon
                    name="heart"
                    className="h-5 w-5 text-[#ff005e]"
                    decorative
                  />
                </div>

                <div className="pt-1">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-full bg-[#ff005e] px-4 py-2 text-xs font-medium text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)] md:text-sm"
                  >
                    Entrar na comunidade
                  </a>
                  <p className="mt-2 text-[11px] text-[#6a6a6a]">
                    Em breve, este botão vai levar direto para o espaço oficial
                    da Comunidade Materna360.
                  </p>
                </div>
              </SoftCard>
            </section>

            {/* Serviços */}
            <section
              id="servicos"
              aria-label="Serviços Materna"
              className="space-y-3"
            >
              <header className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff005e]/80">
                  SERVIÇOS
                </p>
                <h2 className="text-sm font-semibold text-[#2f3a56] md:text-base">
                  Serviços Materna
                </h2>
              </header>

              <SoftCard className="space-y-3 rounded-3xl border border-[#ffd8e6] bg-white px-4 py-4 shadow-[0_10px_26px_rgba(0,0,0,0.10)] md:p-5">
                <p className="text-sm text-[#545454]">
                  Encontros, consultorias e conteúdos especiais para aprofundar
                  o cuidado com você e com a sua família.
                </p>

                <div className="mt-1 space-y-3">
                  {SERVICES.map((service, index) => (
                    <div
                      key={service.id}
                      className={`flex gap-3 ${
                        index !== 0
                          ? 'border-t border-[#ffe2ef] pt-3'
                          : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <AppIcon
                          name="star"
                          className="h-4 w-4 text-[#ff005e]"
                          decorative
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-[#2f3a56]">
                          {service.name}
                        </p>
                        <p className="text-xs text-[#545454]">
                          {service.description}
                        </p>
                        {service.highlight && (
                          <p className="text-[11px] font-medium text-[#9b4d96]">
                            {service.highlight}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-[#ffd8e6] bg-white px-4 py-2 text-xs font-medium text-[#ff005e] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:text-sm"
                  >
                    Receber novidades do Materna+
                  </button>
                </div>
              </SoftCard>
            </section>
          </div>
        </div>

        <MotivationalFooter routeKey="materna-plus" />
      </div>
    </PageTemplate>
  )
}
