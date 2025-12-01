import PageTemplate from '@/components/common/PageTemplate';
import { SectionWrapper } from '@/components/common/SectionWrapper';

export default function MaternaBoxPage() {
  return (
    <>
      <PageTemplate
        title="MaternaBox — surpresas que acolhem sua rotina."
        subtitle="Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e criatividade."
      />

      <SectionWrapper className="mx-auto max-w-3xl px-4 py-8 space-y-10">
        {/* HERO COM IMAGEM + CTA */}
        <section className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#2F3A56]">
              Um carinho mensal entregue na sua porta
            </h2>
            <p className="text-sm md:text-base text-[#545454]">
              A MaternaBox nasce para mães que querem estar presentes, mas vivem
              a correria real do dia a dia. Cada caixa traz atividades, livros
              e momentos pensados para você se conectar com seu filho sem
              precisar planejar tudo sozinha.
            </p>
            <p className="text-sm md:text-base text-[#545454]">
              É sobre transformar pequenos momentos em memórias e reduzir a
              culpa com uma rotina mais gentil.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white bg-[#FF005E] shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-[1px]"
              >
                Quero escolher meu plano
              </button>
              <p className="w-full text-xs text-[#6A6A6A] mt-1">
                Um passo de cada vez. Sua presença pode ser mais leve.
              </p>
            </div>
          </div>

          {/* Imagem hero – já apontando para o PNG na pasta public/images */}
          <div className="md:justify-self-end">
            <img
              src="/images/maternabox-hero.png"
              alt="Mãe brincando com o filho em uma sala aconchegante ao lado de uma caixa Materna360."
              className="w-full rounded-3xl shadow-[0_6px_22px_rgba(0,0,0,0.08)] object-cover"
            />
          </div>
        </section>

        {/* O QUE É A MATERNABOX */}
        <section className="space-y-3">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            O que vem na sua MaternaBox?
          </h2>
          <p className="text-sm md:text-base text-[#545454]">
            Em cada edição, você recebe uma combinação de itens pensados para
            conexão, presença e desenvolvimento leve:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm md:text-base text-[#545454]">
            <li>1 brinquedo educativo adequado à faixa etária;</li>
            <li>1 livro ou material de histórias do tema do mês;</li>
            <li>atividades guiadas para viver momentos juntinhos;</li>
            <li>1 item surpresa temático;</li>
            <li>um mini-guia Materna360 com ideias simples de uso;</li>
            <li>um cartão de carinho para registrar memórias do mês.</li>
          </ul>
          <p className="text-xs md:text-sm text-[#6A6A6A]">
            Os itens variam a cada edição — a proposta é sempre surpresa, leve
            e alinhada à idade do seu filho.
          </p>
        </section>

        {/* FAIXAS ETÁRIAS */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            Escolha a faixa etária da sua MaternaBox
          </h2>
          <p className="text-sm md:text-base text-[#545454]">
            Se você já preencheu o Eu360, vamos sugerir automaticamente a faixa
            etária ideal. Se preferir, você pode escolher aqui:
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {['0–1 ano', '1–3 anos', '3–6 anos', '6–8 anos', '8+ anos'].map(
              (range) => (
                <div
                  key={range}
                  className="rounded-2xl border border-[var(--color-border-soft,#EEC2D6)] bg-white shadow-[0_6px_22px_rgba(0,0,0,0.04)] px-3 py-3 text-center text-xs md:text-sm font-medium text-[#2F3A56]"
                >
                  {range}
                </div>
              ),
            )}
          </div>
          <p className="text-xs md:text-sm text-[#6A6A6A]">
            Você pode ajustar a faixa etária sempre que sentir que seu filho
            mudou de fase.
          </p>
        </section>

        {/* TEMAS DO ANO */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            Cada mês, uma história para viver juntos
          </h2>
          <p className="text-sm md:text-base text-[#545454]">
            A MaternaBox segue temas que acompanham o ritmo do ano e o coração
            da maternidade:
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="font-semibold text-[#2F3A56]">
                Férias leves & rotina gentil
              </p>
              <p>Caixinhas para verão, volta às aulas e ajustes de rotina.</p>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="font-semibold text-[#2F3A56]">
                Imaginação, emoções & conexão
              </p>
              <p>
                Temas que incentivam histórias, fantasia, vínculo e conversa
                sobre sentimentos.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="font-semibold text-[#2F3A56]">
                Coragem, descobertas & autonomia
              </p>
              <p>Desafios leves, curiosidade e pequenas conquistas do dia a dia.</p>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="font-semibold text-[#2F3A56]">
                Gratidão & magia do fim de ano
              </p>
              <p>
                Caixinhas especiais para fechar o ano com memórias quentinhas e
                cheias de afeto.
              </p>
            </div>
          </div>
        </section>

        {/* PLANOS (ESBOÇO – SEM PREÇO AINDA) */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            Planos pensados para a sua rotina
          </h2>
          <p className="text-sm md:text-base text-[#545454]">
            Você pode experimentar por um mês ou viver a experiência completa
            ao longo do ano.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                Comece leve
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano mensal</p>
              <p>Uma MaternaBox por mês, sem fidelidade. Ideal para testar.</p>
            </div>
            <div className="rounded-2xl bg-white border border-[var(--color-border-soft,#EEC2D6)] p-4 space-y-1 text-sm text-[#545454]">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                Experiência completa
              </p>
              <p className="font-semibold text-[#2F3A56]">Plano anual</p>
              <p>
                MaternaBox o ano inteiro, com mimos extras e acesso a conteúdos
                exclusivos do clube.
              </p>
            </div>
          </div>
          <p className="text-xs md:text-sm text-[#6A6A6A]">
            Em breve, os valores e detalhes de cada plano estarão disponíveis
            aqui dentro do app.
          </p>
        </section>

        {/* FAQ RÁPIDO */}
        <section className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            Perguntas frequentes
          </h2>
          <div className="space-y-3 text-sm md:text-base text-[#545454]">
            <div>
              <p className="font-semibold text-[#2F3A56]">
                E se meu filho não gostar do tema do mês?
              </p>
              <p>
                Tudo bem. A cada mês, um novo tema chega até vocês. A ideia é
                experimentar, adaptar e aproveitar do jeito que fizer sentido
                para a sua família.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#2F3A56]">
                Posso ajustar a faixa etária depois?
              </p>
              <p>
                Sim. Conforme seu filho cresce, você pode alterar a faixa
                etária nas configurações da assinatura.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#2F3A56]">
                Os itens são sempre os mesmos?
              </p>
              <p>
                Não. Cada edição traz uma combinação nova de brinquedos,
                materiais e atividades, sempre com curadoria leve e afetiva.
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="space-y-3 text-center">
          <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
            Que tal viver um mês mais leve com a MaternaBox?
          </h2>
          <p className="text-sm md:text-base text-[#545454]">
            Um passo de cada vez, uma caixa por mês, muitos momentos guardados
            no coração.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full px-7 py-2.5 text-sm font-medium text-white bg-[#FF005E] shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-[1px]"
          >
            Quero ser avisada quando abrir a assinatura
          </button>
          <p className="text-xs text-[#6A6A6A] mt-1">
            Sem pressa. Você escolhe o momento certo para a sua rotina.
          </p>
        </section>
      </SectionWrapper>
    </>
  );
}
