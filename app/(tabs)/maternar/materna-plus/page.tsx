import type { Metadata } from 'next'
import Link from 'next/link'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

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

const SHORTCUT_LABEL: Record<'profissionais' | 'comunidade' | 'servicos', string> =
  {
    profissionais: 'Profissionais Materna360',
    comunidade: 'Comunidade Materna360',
    servicos: 'Serviços Materna',
  }

type ActiveTab = 'profissionais' | 'comunidade' | 'servicos'
type SpecialtyKeyWithAll = Professional['specialtyKey'] | 'todas'

export default function MaternaPlusPage({
  searchParams,
}: {
  searchParams?: MaternaPlusSearchParams
}) {
  const abrirParam = (searchParams?.abrir as ActiveTab | undefined) ?? 'profissionais'
  const activeTab: ActiveTab = ['profissionais', 'comunidade', 'servicos'].includes(
    abrirParam,
  )
    ? abrirParam
    : 'profissionais'

  const shortcutLabel =
    activeTab && SHORTCUT_LABEL[activeTab as keyof typeof SHORTCUT_LABEL]

  const selectedSpecialty: SpecialtyKeyWithAll =
    (searchParams?.especialidade as SpecialtyKeyWithAll | undefined) ?? 'todas'

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
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO PREMIUM + ATALHO */}
          <SoftCard className="relative overflow-hidden rounded-[28px] border border-white/75 bg-white/10 px-4 py-5 md:px-7 md:py-6 shadow-[0_20px_55px_rgba(0,0,0,0.26)] backdrop-blur-2xl">
            {/* Glows de fundo */}
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute -top-16 -left-20 h-32 w-32 rounded-full bg-[rgba(255,0,94,0.35)] blur-3xl" />
              <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-[rgba(155,77,150,0.35)] blur-3xl" />
            </div>

            <div className="relative z-10 space-y-4">
              {shortcutLabel && (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/96 px-4 py-2 text-[11px] md:text-xs text-[#545454] shadow-[0_6px_22px_rgba(0,0,0,0.16)] border border-[var(--color-border-soft)]">
                  <AppIcon
                    name="pin"
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

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-white/90">
                  ESPAÇO PREMIUM DE APOIO
                </p>
                <p className="text-sm md:text-base text-[#2f3a56] max-w-2xl">
                  Aqui você encontra profissionais com selo Materna, um lugar
                  seguro para conversar com outras mães e serviços pensados para
                  apoiar a sua jornada ao seu lado — sem pressa, no seu ritmo.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Profissionais Materna360',
                    'Comunidade oficial',
                    'Serviços Materna',
                  ].map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-white/96 px-3 py-1 text-[11px] font-medium text-[#545454] border border-white/80"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* NAVEGAÇÃO ENTRE ESPAÇOS */}
              <div className="pt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-[11px] md:text-xs text-white/85 max-w-sm">
                  Escolha por onde quer começar hoje. Você pode navegar entre os
                  espaços sempre que quiser — o Materna+ caminha junto com você.
                </p>

                <nav
                  aria-label="Navegação entre espaços Materna+"
                  className="inline-flex rounded-full bg-white/15 p-1 shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur"
                >
                  {(
                    [
                      ['profissionais', 'Profissionais'],
                      ['comunidade', 'Comunidade'],
                      ['servicos', 'Serviços'],
                    ] as [ActiveTab, string][]
                  ).map(([tabKey, label]) => {
                    const isActive = activeTab === tabKey
                    const href =
                      tabKey === 'profissionais'
                        ? '?abrir=profissionais#profissionais'
                        : tabKey === 'comunidade'
                          ? '?abrir=comunidade#comunidade'
                          : '?abrir=servicos#servicos'

                    return (
                      <Link
                        key={tabKey}
                        href={href}
                        className={`px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-white text-[#ff005e] shadow-[0_10px_24px_rgba(255,0,94,0.45)]'
                            : 'text-white/85 hover:bg-white/10'
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>
          </SoftCard>

          {/* GRID PRINCIPAL */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)] md:items-start">
            {/* ===========================
                COLUNA ESQUERDA – PROFISSIONAIS
            ============================ */}
            <section
              id="profissionais"
              aria-label="Profissionais Materna360"
              className="space-y-4 md:space-y-5"
            >
              <header className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ffe8f2]/90">
                  PROFISSIONAIS
                </p>
                <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Profissionais Materna360
                </h2>
                <p className="text-xs md:text-sm text-[#545454]">
                  Especialistas selecionados com carinho para cuidar de você e
                  da sua família em diferentes fases da maternidade.
                </p>
              </header>

              {/* FILTROS DE ESPECIALIDADE */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="?abrir=profissionais#profissionais"
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] md:text-xs font-medium transition-colors ${
                    selectedSpecialty === 'todas'
                      ? 'border-[#ff005e] bg-[#ff005e] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                      : 'border-[var(--color-border-soft)] bg-white/95 text-[#545454] hover:border-[#ff005e]/70'
                  }`}
                >
                  Todas
                </Link>

                {SPECIALTY_FILTERS.map(filter => {
                  const isActive = selectedSpecialty === filter.key
                  const href = `?abrir=profissionais&especialidade=${filter.key}#profissionais`
                  return (
                    <Link
                      key={filter.key}
                      href={href}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] md:text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-[#ff005e] bg-[#ff005e] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                          : 'border-[var(--color-border-soft)] bg-white/95 text-[#545454] hover:border-[#ff005e]/70'
                      }`}
                    >
                      {filter.label}
                    </Link>
                  )
                })}
              </div>

              {/* LISTA DE PROFISSIONAIS – layout mais compacto */}
              <div className="space-y-3">
                {filteredProfessionals.length === 0 ? (
                  <SoftCard className="rounded-3xl border border-dashed border-[var(--color-border-soft)] bg-white/95 px-4 py-4 md:px-5 md:py-5">
                    <p className="text-sm text-[#545454]">
                      Em breve, teremos profissionais cadastrados nesta área.
                    </p>
                  </SoftCard>
                ) : (
                  filteredProfessionals.map(prof => (
                    <SoftCard
                      key={prof.id}
                      className="relative flex gap-3 rounded-3xl border border-[#ffd3e6] bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
                    >
                      {/* Avatar / Ícone */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-11 w-11 rounded-full bg-[#ffd8e6] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
                          <AppIcon
                            name="care"
                            className="h-5 w-5 text-[#ff005e]"
                            decorative
                          />
                        </div>
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 space-y-1.5">
                        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#ff005e]/85">
                          Profissional Materna360
                        </p>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <p className="text-sm md:text-base font-semibold text-[#2f3a56]">
                            {prof.name}
                          </p>
                          <p className="text-[11px] md:text-xs font-medium text-[#9b4d96]">
                            {prof.specialtyLabel}
                          </p>
                        </div>
                        <p className="text-xs md:text-sm text-[#545454]">
                          {prof.shortBio}
                        </p>

                        <div className="pt-2 flex flex-col gap-1.5">
                          <a
                            href={prof.whatsappLink ?? '#'}
                            target={prof.whatsappLink ? '_blank' : undefined}
                            rel={
                              prof.whatsappLink
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            className="inline-flex w-fit items-center justify-center rounded-full px-4 py-1.5 text-xs md:text-sm font-medium text-white bg-[#ff005e] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
                          >
                            Falar pelo WhatsApp
                          </a>
                          {(!prof.whatsappLink || prof.whatsappLink === '#') && (
                            <p className="text-[11px] text-[#6a6a6a]">
                              Em breve, este botão vai levar direto para o
                              WhatsApp deste profissional.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Favoritar */}
                      <button
                        type="button"
                        aria-label="Favoritar profissional"
                        className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ffd3e6] bg-white text-[#ff005e] shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
                      >
                        <AppIcon
                          name="heart"
                          className="h-3.5 w-3.5"
                          decorative
                        />
                      </button>
                    </SoftCard>
                  ))
                )}
              </div>
            </section>

            {/* ===========================
                COLUNA DIREITA – COMUNIDADE + SERVIÇOS
            ============================ */}
            <div className="space-y-4 md:space-y-5">
              {/* Comunidade */}
              <section
                id="comunidade"
                aria-label="Comunidade Materna360"
                className="space-y-2"
              >
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ffe8f2]/90">
                    COMUNIDADE
                  </p>
                  <h2 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                    Comunidade Materna360
                  </h2>
                </header>

                <SoftCard className="flex flex-col gap-3 rounded-3xl border border-[#ffd3e6] bg-white/98 p-4 md:p-5 shadow-[0_12px_26px_rgba(0,0,0,0.16)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm md:text-base font-semibold text-[#2f3a56]">
                        Um lugar para você não se sentir sozinha
                      </p>
                      <p className="text-xs md:text-sm text-[#545454]">
                        Aqui você pode desabafar, pedir ideias e se sentir
                        acolhida por quem está vivendo algo parecido com você.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="h-9 w-9 rounded-full bg-[#ffd8e6] flex items-center justify-center">
                        <AppIcon
                          name="heart"
                          className="h-4 w-4 text-[#ff005e]"
                          decorative
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <a
                      href="#"
                      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#ff005e] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
                    >
                      Entrar na comunidade
                    </a>
                    <p className="mt-2 text-[11px] text-[#6a6a6a]">
                      Em breve, este botão vai levar direto para o espaço
                      oficial da Comunidade Materna360.
                    </p>
                  </div>
                </SoftCard>
              </section>

              {/* Serviços */}
              <section
                id="servicos"
                aria-label="Serviços Materna"
                className="space-y-2"
              >
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ffe8f2]/90">
                    SERVIÇOS
                  </p>
                  <h2 className="text-sm md:text-base font-semibold text-[#2f3a56]">
                    Serviços Materna
                  </h2>
                </header>

                <SoftCard className="rounded-3xl border border-[#ffd3e6] bg-white/98 p-4 md:p-5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] space-y-3">
                  <p className="text-xs md:text-sm text-[#545454]">
                    Encontros, consultorias e conteúdos especiais para
                    aprofundar o cuidado com você e com a sua família.
                  </p>

                  <div className="mt-1 space-y-3">
                    {SERVICES.map((service, index) => (
                      <div
                        key={service.id}
                        className={`flex gap-3 ${
                          index !== 0
                            ? 'pt-3 border-t border-[var(--color-border-soft)]'
                            : ''
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <AppIcon
                            name="star"
                            className="h-4 w-4 text-[#ff005e]"
                            decorative
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-semibold text-[#2f3a56] md:text-sm">
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
                      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-[#ff005e] bg-white border border-[var(--color-border-soft)] shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                    >
                      Receber novidades do Materna+
                    </button>
                  </div>
                </SoftCard>
              </section>
            </div>
          </div>

          {/* ENCERRAMENTO EMOCIONAL */}
          <SoftCard className="rounded-3xl border border-white/75 bg-white/10 px-4 py-5 md:px-6 md:py-6 shadow-[0_12px_32px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1 max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                  O MATERNA+ CRESCE COM VOCÊ
                </p>
                <p className="text-sm md:text-base text-white">
                  Aos poucos, novos profissionais, encontros e materiais vão
                  chegando por aqui. A sua jornada importa — e o Materna+ está
                  sendo construído para caminhar ao seu lado, um passo de cada
                  vez.
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2 text-white/90 text-xs md:text-sm">
                <AppIcon name="sparkles" className="h-4 w-4" decorative />
                <span>
                  Você não precisa dar conta de tudo sozinha. A gente te ajuda a
                  cuidar de quem cuida.
                </span>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="materna-plus" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
