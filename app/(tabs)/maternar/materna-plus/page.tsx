import type { Metadata } from 'next';
import PageTemplate from '@/components/common/PageTemplate';
import SectionWrapper from '@/components/common/SectionWrapper';
import SoftCard from '@/components/ui/SoftCard';
import AppIcon from '@/components/ui/AppIcon';

type MaternaPlusSearchParams = {
  abrir?: 'profissionais' | 'comunidade' | 'servicos' | string;
};

type Professional = {
  id: string;
  name: string;
  specialty: string;
  shortBio: string;
  whatsappLink?: string;
};

type Service = {
  id: string;
  name: string;
  description: string;
  href?: string;
};

export const metadata: Metadata = {
  title: 'Materna+ | Materna360',
};

const PROFESSIONALS: Professional[] = [
  {
    id: 'pediatra',
    name: 'Dra. Ana Paula Ribeiro',
    specialty: 'Pediatra',
    shortBio:
      'Atendimento online focado em acolher dúvidas do dia a dia, sem alarmismo.',
    // TODO: substituir pelo link real de WhatsApp quando estiver definido
    whatsappLink: '#',
  },
  {
    id: 'nutricionista',
    name: 'Dra. Juliana Martins',
    specialty: 'Nutricionista materno-infantil',
    shortBio:
      'Ajuda famílias a construírem uma relação leve com a alimentação.',
    whatsappLink: '#',
  },
  {
    id: 'psicopedagoga',
    name: 'Profa. Carla Souza',
    specialty: 'Psicopedagoga',
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
    href: '#',
  },
  {
    id: 'consultoria-parental',
    name: 'Consultoria parental',
    description:
      'Atendimentos individuais para olhar com calma para a rotina da sua família.',
    href: '#',
  },
  {
    id: 'produtos-digitais',
    name: 'Produtos digitais Materna360',
    description:
      'E-books, guias práticos e materiais para apoiar o dia a dia com leveza.',
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

  return (
    <PageTemplate
      eyebrow="MATERNA+"
      title="Materna+"
      subtitle="Profissionais, comunidade e serviços selecionados com carinho para caminhar com você."
    >
      <SectionWrapper className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {shortcutLabel && (
          <div className="rounded-2xl bg-white/80 border border-[var(--color-border-soft)] px-4 py-3 text-xs md:text-sm text-[#545454] shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
            Você chegou aqui pelo atalho <strong>{shortcutLabel}</strong>. Que
            tal começar por essa área?
          </div>
        )}

        {/* BLOCO 1 — PROFISSIONAIS MATERNA360 */}
        <section
          id="profissionais"
          aria-label="Profissionais Materna360"
          className="space-y-4"
        >
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Profissionais Materna360
            </h2>
            <p className="text-sm text-[#545454]">
              Um espaço com especialistas selecionados, todos com selo Materna,
              para apoiar você em diferentes fases da maternidade.
            </p>
          </header>

          {/* Filtros por especialidade (estáticos por enquanto) */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['Pediatria', 'Nutrição', 'Psicologia', 'Psicopedagogia', 'Fonoaudiologia', 'Parentalidade'].map(
              (tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-xs font-medium text-[#545454]"
                >
                  {tag}
                </span>
              ),
            )}
          </div>

          {/* Lista de profissionais */}
          <div className="grid grid-cols-1 gap-4 mt-2">
            {PROFESSIONALS.map((prof) => (
              <SoftCard
                key={prof.id}
                className="flex flex-col gap-3 p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2F3A56]">
                      {prof.name}
                    </p>
                    <p className="text-xs font-medium text-[#9B4D96]">
                      {prof.specialty}
                    </p>
                  </div>
                  <AppIcon
                    name="care"
                    className="w-6 h-6 text-[#FF005E]"
                    decorative
                  />
                </div>
                <p className="text-sm text-[#545454]">{prof.shortBio}</p>

                <div className="pt-1">
                  <a
                    href={prof.whatsappLink ?? '#'}
                    target={prof.whatsappLink ? '_blank' : undefined}
                    rel={prof.whatsappLink ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#FF005E] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
                  >
                    Falar pelo WhatsApp
                  </a>
                  {!prof.whatsappLink || prof.whatsappLink === '#' ? (
                    <p className="mt-2 text-[11px] text-[#6A6A6A]">
                      Em breve, este botão vai levar direto para o WhatsApp
                      deste profissional.
                    </p>
                  ) : null}
                </div>
              </SoftCard>
            ))}
          </div>
        </section>

        {/* BLOCO 2 — COMUNIDADE MATERNA360 */}
        <section
          id="comunidade"
          aria-label="Comunidade Materna360"
          className="space-y-4"
        >
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Comunidade Materna360
            </h2>
            <p className="text-sm text-[#545454]">
              Um espaço seguro para conversar com outras mães, compartilhar
              dúvidas e celebrar conquistas reais, sem comparações.
            </p>
          </header>

          <SoftCard className="flex flex-col gap-3 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#2F3A56]">
                  Um lugar para você não se sentir sozinha
                </p>
                <p className="text-sm text-[#545454]">
                  Aqui você pode desabafar, pedir ideias e se sentir acolhida
                  por quem está vivendo algo parecido com você.
                </p>
              </div>
              <AppIcon
                name="heart"
                className="w-6 h-6 text-[#FF005E]"
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
                Em breve, este botão vai levar direto para o espaço oficial da
                Comunidade Materna360.
              </p>
            </div>
          </SoftCard>
        </section>

        {/* BLOCO 3 — SERVIÇOS MATERNA */}
        <section
          id="servicos"
          aria-label="Serviços Materna"
          className="space-y-4"
        >
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Serviços Materna
            </h2>
            <p className="text-sm text-[#545454]">
              Encontros, consultorias e conteúdos especiais para aprofundar o
              cuidado com você e com a sua família.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 mt-2">
            {SERVICES.map((service) => (
              <SoftCard
                key={service.id}
                className="flex flex-col gap-3 p-5 md:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2F3A56]">
                      {service.name}
                    </p>
                    <p className="text-sm text-[#545454]">
                      {service.description}
                    </p>
                  </div>
                  <AppIcon
                    name="star"
                    className="w-6 h-6 text-[#FF005E]"
                    decorative
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-[#FF005E] bg-white border border-[var(--color-border-soft)] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                  >
                    Saber mais em breve
                  </button>
                </div>
              </SoftCard>
            ))}
          </div>
        </section>
      </SectionWrapper>
    </PageTemplate>
  );
}
