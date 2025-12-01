import type { Metadata } from 'next';
import PageTemplate from '@/components/common/PageTemplate';
import { SectionWrapper } from '@/components/common/SectionWrapper';
import SoftCard from '@/components/ui/SoftCard';
import AppIcon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
  title: 'MaternaBox | Materna360',
};

export default function MaternaBoxPage() {
  const heroProps = {
    eyebrow: 'MATERNA+',
    title: 'MaternaBox',
    subtitle:
      'Uma caixa de experiências afetivas e educativas para transformar pequenos momentos em grandes memórias.',
  };

  return (
    <PageTemplate {...(heroProps as any)}>
      <SectionWrapper className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* Seção: O que vem na caixa */}
        <section aria-label="O que vem na MaternaBox" className="space-y-4">
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              O que vem na caixa
            </h2>
            <p className="text-sm text-[#545454]">
              Cada edição da MaternaBox é pensada para aproximar você do seu
              filho com brincadeiras, materiais e momentos de conexão.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4">
            <SoftCard className="flex flex-col gap-2 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <AppIcon
                  name="star"
                  className="w-6 h-6 text-[#FF005E]"
                  decorative
                />
                <div>
                  <p className="text-sm font-semibold text-[#2F3A56]">
                    Brincadeiras guiadas
                  </p>
                  <p className="text-sm text-[#545454]">
                    Atividades simples e afetivas para fazer em casa, com
                    sugestões de fala e ideias para reforçar o vínculo.
                  </p>
                </div>
              </div>
            </SoftCard>

            <SoftCard className="flex flex-col gap-2 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <AppIcon
                  name="idea"
                  className="w-6 h-6 text-[#FF005E]"
                  decorative
                />
                <div>
                  <p className="text-sm font-semibold text-[#2F3A56]">
                    Materiais educativos
                  </p>
                  <p className="text-sm text-[#545454]">
                    Cartas, guias e suportes visuais pensados para apoiar o
                    desenvolvimento infantil de forma leve.
                  </p>
                </div>
              </div>
            </SoftCard>

            <SoftCard className="flex flex-col gap-2 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <AppIcon
                  name="heart"
                  className="w-6 h-6 text-[#FF005E]"
                  decorative
                />
                <div>
                  <p className="text-sm font-semibold text-[#2F3A56]">
                    Momentos de conexão
                  </p>
                  <p className="text-sm text-[#545454]">
                    Propostas focadas em presença, escuta e acolhimento, sem
                    pressão por “fazer tudo certo”.
                  </p>
                </div>
              </div>
            </SoftCard>
          </div>
        </section>

        {/* Seção: Faixa etária e temas */}
        <section
          aria-label="Faixa etária e temas da MaternaBox"
          className="space-y-4"
        >
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Para quem a MaternaBox foi pensada
            </h2>
            <p className="text-sm text-[#545454]">
              Ideal para famílias com crianças pequenas, em fase de primeira
              infância, que desejam transformar o tempo junto em algo especial.
            </p>
          </header>

          <SoftCard className="flex flex-col gap-3 p-5 md:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-xs font-medium text-[#545454]">
                2 a 6 anos
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-xs font-medium text-[#545454]">
                Conexão emocional
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-xs font-medium text-[#545454]">
                Brincar com propósito
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1 text-xs font-medium text-[#545454]">
                Rotina leve
              </span>
            </div>
            <p className="text-sm text-[#545454]">
              Os temas são organizados ao longo do ano para acompanhar o ritmo
              da família, sem exigir que você dê conta de tudo ao mesmo tempo.
            </p>
          </SoftCard>
        </section>

        {/* Seção: Lista de espera */}
        <section
          aria-label="Lista de espera MaternaBox"
          className="space-y-4"
        >
          <header className="space-y-1">
            <h2 className="text-base md:text-lg font-semibold text-[#2F3A56]">
              Lista de espera
            </h2>
            <p className="text-sm text-[#545454]">
              As vagas para a MaternaBox serão abertas em pequenos ciclos, para
              garantir uma experiência cuidadosa. Você pode entrar na lista de
              espera para ser avisada em primeira mão.
            </p>
          </header>

          <SoftCard className="flex flex-col gap-4 p-5 md:p-6">
            <p className="text-sm text-[#545454]">
              Deixe seu e-mail e, quando a assinatura for aberta, você recebe
              todos os detalhes com calma — sem spam e sem pressão.
            </p>

            {/* Aqui entra o formulário real já integrado com a API / RD Station,
                ou você pode encaixar o componente que já está pronto no projeto */}
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: conectar com a rota /api/maternabox/waitlist
              }}
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="nome"
                  className="text-xs font-medium text-[#2F3A56]"
                >
                  Nome (opcional)
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-white px-3 text-sm text-[#2F3A56] outline-none focus:border-[#FF005E] focus:ring-1 focus:ring-[#FF005E]"
                  placeholder="Como você gostaria de ser chamada?"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-[#2F3A56]"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="h-10 rounded-xl border border-[var(--color-border-soft)] bg-white px-3 text-sm text-[#2F3A56] outline-none focus:border-[#FF005E] focus:ring-1 focus:ring-[#FF005E]"
                  placeholder="seuemail@exemplo.com"
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#FF005E] shadow-[0_6px_18px_rgba(255,0,94,0.35)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(255,0,94,0.45)]"
              >
                Entrar na lista de espera
              </button>

              <p className="text-[11px] text-[#6A6A6A]">
                Você pode sair da lista quando quiser. Nada de cobranças, só
                informação cuidadosa.
              </p>
            </form>
          </SoftCard>
        </section>
      </SectionWrapper>
    </PageTemplate>
  );
}
