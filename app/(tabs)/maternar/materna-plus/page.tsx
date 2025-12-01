import type { Metadata } from 'next';
import Link from 'next/link';
import PageTemplate from '@/components/common/PageTemplate';
import { SectionWrapper } from '@/components/common/SectionWrapper';
import SoftCard from '@/components/ui/SoftCard';
import AppIcon from '@/components/ui/AppIcon';

type MaternaPlusSearchParams = {
  abrir?: 'profissionais' | 'comunidade' | 'servicos' | string;
  especialidade?: string;
};

type Professional = {
  id: string;
  name: string;
  specialtyLabel: string;
  specialtyKey:
    | 'pediatria'
    | 'nutricao'
    | 'psicologia'
    | 'psicopedagogia'
    | 'fonoaudiologia'
    | 'parentalidade';
  shortBio: string;
  whatsappLink?: string;
};

type Service = {
  id: string;
  name: string;
  description: string;
  highlight?: string;
  href?: string;
};

export const metadata: Metadata = {
  title: 'Materna+ | Materna360',
};

const SPECIALTY_FILTERS: { key: Professional['specialtyKey']; label: string }[] =
  [
    { key: 'pediatria', label: 'Pediatria' },
    { key: 'nutricao', label: 'Nutrição' },
    { key: 'psicologia', label: 'Psicologia' },
    { key: 'psicopedagogia', label: 'Psicopedagogia' },
    { key: 'fonoaudiologia', label: 'Fonoaudiologia' },
    { key: 'parentalidade', label: 'Parentalidade' },
  ];

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
];

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
];

const SHORTCUT_LABEL: Record<string, string> = {
  profissionais: 'Profissionais Materna360',
  comunidade: 'Comunidade Materna360',
  servicos: 'Serviços Materna',
};

export default function MaternaPlusPage({
  searchParams,
}: {
  searchParams?: MaternaPlusSearchParams;
}) {
  const abrir = searchParams?.abrir ?? 'profissionais';
  const shortcutLabel = abrir && SHORTCUT_LABEL[abrir];

  const selectedSpecialty =
    (searchParams?.especialidade as Professional['specialtyKey'] | undefined) ??
    'todas';

  const filteredProfessionals =
    selectedSpecialty === 'todas'
      ? PROFESSIONALS
      : PROFESSIONALS.filter((p) => p.specialtyKey === selectedSpecialty);

  const heroProps = {
    eyebrow: 'PREMIUM',
    title: 'Materna+',
    subtitle:
      'Profissionais, comunidade e serviços selecionados com carinho para caminhar com você.',
  };

  return (
    <PageTemplate {...(heroProps as any)}>
      <SectionWrapper className="mx-auto max-w-4xl px-4 py-8 md:py-10 space-y-6 md:space-y-7">
        {/* INTRO PREMIUM – card mais compacto e rosado */}
        <SoftCard className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.26)] px-4 py-5 md:px-7 md:py-6 space-y-4">
          {/* Glows suaves */}
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -top-12 -left-16 h-28 w-28 rounded-full bg-[rgba(255,20,117,0.32)] blur-3xl" />
            <div className="absolute -bottom-14 -right-10 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.3)] blur-3xl" />
          </div>

          <div className="relative z-10 space-y-3">
            {/* Mensagem de atalho em formato de pílula, não barra gigante */}
            {shortcutLabel && (
              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/92 border border-[var(--color-border-soft)] px-4 py-2 text-[11px] md:text-sm text-[#545454] shadow-[0_6px_20px_rgba(0,0,0,0.10)]">
                <AppIcon
                  name="idea"
                  className="w-4 h-4 text-[#FF005E]"
                  decorative
                />
                <span className="truncate">
                  Você chegou aqui pelo atalho{' '}
                  <strong>{shortcutLabel}</strong>. Que tal começar por essa
                  área?
                </span>
              </div>
            )}

            {/* Texto principal */}
            <div className="space-y-1 pt-1">
              <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-white/90">
                MATERNA+
              </p>
              <p className="text-sm md:text-base text-white/95 max-w-2xl">
                Especialistas com selo Materna, um espaço seguro para conversar
                com outras mães e serviços pensados para apoiar a sua jornada —
                tudo em um só lugar.
              </p>
            </div>

            {/* Chips de contexto mais visíveis */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Profissionais Materna360', 'Comunidade oficial', 'Serviços Materna']
                .map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/18 px-3 py-1 text-[11px] font-medium text-white/95"
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF005E]" />
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </SoftCard>

        {/* GRID PRINCIPAL */}
        <div className="md:grid md:grid-cols-12 md:gap-5 lg:gap-6 md:items-start space-y-5 md:space-y-0">
          {/* COLUNA ESQUERDA – PROFISSIONAIS */}
          <section
            id="profissionais"
            aria-label="Profissionais Materna360"
            className="md:col-span-7 lg:col-span-7 space-y-4"
          >
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#FFE8F2]/90">
                PROFISSIONAIS
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                Profissionais Materna360
              </h2>
              <p className="text-sm text-[#545454]">
                Um espaço com especialistas selecionados, todos com selo
                Materna, para apoiar você em diferentes fases da maternidade.
              </p>
            </header>

            {/* Filtros – funcionam de verdade */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="?abrir=profissionais"
                scroll={false}
                replace
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedSpecialty === 'todas'
                    ? 'border-[#FF005E] bg-[#FF005E] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                    : 'border-[var(--color-border-soft)] bg-white/95 text-[#545454] hover:border-[#FF005E]/70'
                }`}
              >
                Todas
              </Link>

              {SPECIALTY_FILTERS.map((filter) => {
                const isActive = selectedSpecialty === filter.key;
                const href = `?abrir=profissionais&especialidade=${filter.key}`;
                return (
                  <Link
                    key={filter.key}
                    href={href}
                    scroll={false}
                    replace
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-[#FF005E] bg-[#FF005E] text-white shadow-[0_6px_18px_rgba(255,0,94,0.35)]'
                        : 'border-[var(--color-border-soft)] bg-white/95 text-[#545454] hover:border-[#FF005E]/70'
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>

            {/* Lista de profissionais */}
            <div className="mt-3 space-y-3">
              {filteredProfessionals.length === 0 ? (
                <SoftCard className="rounded-3xl border border-dashed border-[var(--color-border-soft)] bg-white/95 px-4 py-4 md:px-5 md:py-5">
                  <p className="text-sm text-[#545454]">
                    Em breve, teremos profissionais cadastrados nesta área.
                  </p>
                </SoftCard>
              ) : (
                filteredProfessionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="relative rounded-3xl border border-[#FFD3E6] bg-white shadow-[0_16px_30px_rgba(0,0,0,0.14)] px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#FF005E]/85 mb-1">
                          Profissional Materna360
                        </p>
                        <p className="text-sm font-semibold text-[#2F3A56]">
                          {prof.name}
                        </p>
                        <p className="text-xs font-medium text-[#9B4D96]">
                          {prof.specialtyLabel}
                        </p>
                      </div>
                      <AppIcon
                        name="care"
                        className="w-6 h-6 text-[#FF005E]"
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
                        className="inline-flex w-fit items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#FF005E] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
                      >
                        Falar pelo WhatsApp
                      </a>
                      {!prof.whatsappLink || prof.whatsappLink === '#' ? (
                        <p className="text-[11px] text-[#6A6A6A]">
                          Em breve, este botão vai levar direto para o WhatsApp
                          deste profissional.
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      aria-label="Favoritar profissional"
                      className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#FFD3E6] bg-white text-[#FF005E] shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
                    >
                      <AppIcon
                        name="heart"
                        className="w-3.5 h-3.5"
                        decorative
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUNA DIREITA – COMUNIDADE + SERVIÇOS */}
          <div className="md:col-span-5 lg:col-span-5 space-y-4">
            {/* Comunidade */}
            <section
              id="comunidade"
              aria-label="Comunidade Materna360"
              className="space-y-3"
            >
              <header className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#FFE8F2]/90">
                  COMUNIDADE
                </p>
                <h2 className="text-sm md:text-base font-semibold text-[#2F3A56]">
                  Comunidade Materna360
                </h2>
              </header>

              <SoftCard className="flex flex-col gap-3 p-4 md:p-5 bg:white/97 bg-white/97 shadow-[0_10px_26px_rgba(0,0,0,0.12)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2F3A56]">
                      Um lugar para você não se sentir sozinha
                    </p>
                    <p className="text-sm text-[#545454]">
                      Aqui você pode desabafar, pedir ideias e se sentir
                      acolhida por quem está vivendo algo parecido com você.
                    </p>
                  </div>
                  <AppIcon
                    name="heart"
                    className="w-5 h-5 text-[#FF005E]"
                    decorative
                  />
                </div>

                <div className="pt-1">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#FF005E] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
                  >
                    Entrar na comunidade
                  </a>
                  <p className="mt-2 text-[11px] text-[#6A6A6A]">
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
                <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#FFE8F2]/90">
                  SERVIÇOS
                </p>
                <h2 className="text-sm md:text-base font-semibold text-[#2F3A56]">
                  Serviços Materna
                </h2>
              </header>

              <SoftCard className="p-4 md:p-5 bg-white/97 shadow-[0_10px_26px_rgba(0,0,0,0.12)] space-y-3">
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
                          ? 'pt-3 border-t border-[var(--color-border-soft)]'
                          : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <AppIcon
                          name="star"
                          className="w-4 h-4 text-[#FF005E]"
                          decorative
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-[#2F3A56]">
                          {service.name}
                        </p>
                        <p className="text-xs text-[#545454]">
                          {service.description}
                        </p>
                        {service.highlight && (
                          <p className="text-[11px] font-medium text-[#9B4D96]">
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
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-[#FF005E] bg-white border border-[var(--color-border-soft)] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                  >
                    Receber novidades do Materna+
                  </button>
                </div>
              </SoftCard>
            </section>
          </div>
        </div>
      </SectionWrapper>
    </PageTemplate>
  );
}
