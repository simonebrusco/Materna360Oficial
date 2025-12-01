'use client';

import { useState } from 'react';
import PageTemplate from '@/components/common/PageTemplate';
import { SectionWrapper } from '@/components/common/SectionWrapper';
import { MaternaBoxWaitlistModal } from '@/components/maternar/MaternaBoxWaitlistModal';

export default function MaternaBoxPage() {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const openWaitlist = () => setWaitlistOpen(true);
  const closeWaitlist = () => setWaitlistOpen(false);

  return (
    <>
      <PageTemplate
        label="Materna+"
        title="MaternaBox — surpresas que acolhem sua rotina."
        subtitle="Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e criatividade."
      >
        <SectionWrapper className="mx-auto max-w-5xl px-4 pt-8 pb-24 space-y-8 md:space-y-10">
          {/* PAINEL PRINCIPAL */}
          <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_20px_55px_rgba(0,0,0,0.18)] px-5 py-6 md:px-8 md:py-9 space-y-8 md:space-y-10">
            <div className="pointer-events-none absolute inset-0 opacity-80">
              <div className="absolute -top-16 -left-10 h-32 w-32 rounded-full bg-[rgba(255,20,117,0.18)] blur-3xl" />
              <div className="absolute -bottom-20 -right-10 h-40 w-40 rounded-full bg-[rgba(155,77,150,0.18)] blur-3xl" />
            </div>

            <div className="relative z-10 space-y-8 md:space-y-10">
              {/* HERO */}
              <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-semibold text-[#2F3A56]">
                    Um carinho mensal entregue na sua porta
                  </h2>
                  <p className="text-sm md:text-base text-[#545454]">
                    A MaternaBox nasce para mães que querem estar presentes, mas
                    vivem a correria real do dia a dia. Cada caixa traz
                    atividades, livros e momentos pensados para você se conectar
                    com seu filho sem precisar planejar tudo sozinha.
                  </p>
                  <p className="text-sm md:text-base text-[#545454]">
                    É sobre transformar pequenos momentos em memórias e reduzir a
                    culpa com uma rotina mais gentil.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={openWaitlist}
                      className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white bg-[#FF005E] shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-[1px]"
                    >
                      Quero escolher meu plano
                    </button>
                    <p className="w-full text-xs text-[#6A6A6A] mt-1">
                      Um passo de cada vez. Sua presença pode ser mais leve.
                    </p>
                  </div>
                </div>

                <div className="md:justify-self-end">
                  <img
                    src="/images/maternabox-hero.png"
                    alt="Mãe brincando com o filho em uma sala aconchegante ao lado de uma caixa Materna360."
                    className="w-full rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] object-cover"
                  />
                </div>
              </div>

              {/* LINHA 2 – o que vem X faixa etária */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl bg-white/95 border border-[#FBD0E6] px-4 py-4 md:px-5 md:py-5 space-y-3">
                  <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                    O que vem na sua MaternaBox?
                  </h3>
                  <p className="text-sm md:text-base text-[#545454]">
                    Em cada edição, você recebe uma combinação de itens pensados
                    para conexão, presença e desenvolvimento leve:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm text-[#545454]">
                    <li>1 brinquedo educativo adequado à faixa etária;</li>
                    <li>1 livro ou material de histórias do tema do mês;</li>
                    <li>Atividades guiadas para viver momentos juntinhos;</li>
                    <li>1 item surpresa temático;</li>
                    <li>Um mini-guia Materna360 com ideias simples de uso;</li>
                    <li>Um cartão de carinho para registrar memórias do mês.</li>
                  </ul>
                  <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                    Os itens variam a cada edição — a proposta é sempre surpresa,
                    leve e alinhada à idade do seu filho.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/95 border border-[#FBD0E6] px-4 py-4 md:px-5 md:py-5 space-y-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                    Escolha a faixa etária da sua MaternaBox
                  </h3>
                  <p className="text-sm md:text-base text-[#545454]">
                    Se você já preencheu o Eu360, vamos sugerir automaticamente a
                    faixa etária ideal. Se preferir, você pode escolher aqui:
                  </p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {['0–1 ano', '1–3 anos', '3–6 anos', '6–8 anos', '8+ anos'].map(
                      (range) => (
                        <button
                          key={range}
                          type="button"
                          className="rounded-2xl border border-[rgba(255,255,255,0.9)] bg-[#FFE8F2] shadow-[0_6px_18px_rgba(0,0,0,0.08)] px-3 py-2.5 text-center text-xs md:text-sm font-medium text-[#2F3A56] hover:bg-white hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] transition-all"
                        >
                          {range}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                    Você pode ajustar a faixa etária sempre que sentir que seu
                    filho mudou de fase.
                  </p>
                </div>
              </div>

              {/* TEMAS DO ANO */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                  Cada mês, uma história para viver juntos
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  A MaternaBox segue temas que acompanham o ritmo do ano e o
                  coração da maternidade:
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 space-y-1 text-sm text-[#545454]">
                    <p className="font-semibold text-[#2F3A56]">
                      Férias leves & rotina gentil
                    </p>
                    <p>
                      Caixinhas para verão, volta às aulas e ajustes de rotina.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 space-y-1 text-sm text-[#545454]">
                    <p className="font-semibold text-[#2F3A56]">
                      Imaginação, emoções & conexão
                    </p>
                    <p>
                      Temas que incentivam histórias, fantasia, vínculo e
                      conversa sobre sentimentos.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 space-y-1 text-sm text-[#545454]">
                    <p className="font-semibold text-[#2F3A56]">
                      Coragem, descobertas & autonomia
                    </p>
                    <p>
                      Desafios leves, curiosidade e pequenas conquistas do dia a
                      dia.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 space-y-1 text-sm text-[#545454]">
                    <p className="font-semibold text-[#2F3A56]">
                      Gratidão & magia do fim de ano
                    </p>
                    <p>
                      Caixinhas especiais para fechar o ano com memórias
                      quentinhas e cheias de afeto.
                    </p>
                  </div>
                </div>
              </div>

              {/* PLANOS */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                  Planos pensados para a sua rotina
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  Você pode experimentar por um mês ou viver a experiência
                  completa ao longo do ano. Os valores abaixo são um esboço
                  inicial e podem ser ajustados antes do lançamento oficial.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 flex flex-col gap-2 text-sm text-[#545454]">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                      Comece leve
                    </p>
                    <p className="font-semibold text-[#2F3A56]">Plano mensal</p>
                    <p className="text-[26px] leading-tight font-semibold text-[#2F3A56]">
                      R$ 119<span className="text-sm font-normal">/mês</span>
                    </p>
                    <p className="text-xs text-[#6A6A6A]">
                      Uma MaternaBox por mês, sem fidelidade. Ideal para testar a
                      experiência.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 flex flex-col gap-2 text-sm text-[#545454]">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                      Ritmo constante
                    </p>
                    <p className="font-semibold text-[#2F3A56]">
                      Plano trimestral
                    </p>
                    <p className="text-[26px] leading-tight font-semibold text-[#2F3A56]">
                      R$ 109<span className="text-sm font-normal">/mês</span>
                    </p>
                    <p className="text-xs text-[#6A6A6A]">
                      Cobrança a cada 3 meses. Economia leve para quem já sabe
                      que quer seguir com a experiência.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFF7FB] border border-[#FBD0E6] p-4 flex flex-col gap-2 text-sm text-[#545454]">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                      Presença na rotina
                    </p>
                    <p className="font-semibold text-[#2F3A56]">
                      Plano semestral
                    </p>
                    <p className="text-[26px] leading-tight font-semibold text-[#2F3A56]">
                      R$ 99<span className="text-sm font-normal">/mês</span>
                    </p>
                    <p className="text-xs text-[#6A6A6A]">
                      6 meses de MaternaBox com valor mais vantajoso para quem
                      quer criar um ritual contínuo.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FFEDF6] border-2 border-[#FF005E] p-4 flex flex-col gap-2 text-sm text-[#545454] shadow-[0_10px_28px_rgba(0,0,0,0.16)] relative overflow-hidden">
                    <span className="absolute top-3 right-3 rounded-full bg-[#FF005E] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Mais escolhido
                    </span>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9B4D96]">
                      Experiência completa
                    </p>
                    <p className="font-semibold text-[#2F3A56]">Plano anual</p>
                    <p className="text-[26px] leading-tight font-semibold text-[#2F3A56]">
                      R$ 89<span className="text-sm font-normal">/mês</span>
                    </p>
                    <p className="text-xs text-[#6A6A6A]">
                      MaternaBox o ano inteiro, com mimos extras e acesso a
                      conteúdos exclusivos do clube.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                  Os valores podem ser ajustados até o lançamento oficial. Quando
                  a assinatura estiver ativa, esta página será atualizada com as
                  condições definitivas.
                </p>
              </div>

              {/* FAQ */}
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-[#2F3A56]">
                  Perguntas frequentes
                </h3>
                <div className="space-y-3 text-sm md:text-base text-[#545454]">
                  <div>
                    <p className="font-semibold text-[#2F3A56]">
                      E se meu filho não gostar do tema do mês?
                    </p>
                    <p>
                      Tudo bem. A cada mês, um novo tema chega até vocês. A ideia
                      é experimentar, adaptar e aproveitar do jeito que fizer
                      sentido para a sua família.
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
                      materiais e atividades, sempre com curadoria leve e
                      afetiva.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAIXA FINAL */}
          <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#FF1475] via-[#FF4F9B] to-[#9B4D96] px-5 py-6 md:px-8 md:py-7 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
            <div className="space-y-1 md:space-y-2">
              <p className="inline-flex items-center justify-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-white mb-1">
                Lista de espera
              </p>
              <h2 className="text-base md:text-lg font-semibold text-white">
                Que tal viver um mês mais leve com a MaternaBox?
              </h2>
              <p className="text-xs md:text-sm text-white/90 max-w-xl">
                Um passo de cada vez, uma caixa por mês, muitos momentos
                guardados no coração. Inscreva-se para ser avisada quando a
                assinatura abrir.
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
              <button
                type="button"
                onClick={openWaitlist}
                className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-[#FF005E] bg-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                Quero ser avisada quando abrir
              </button>
              <p className="text-[10px] md:text-xs text-white/80">
                Sem spam. Apenas novidades importantes sobre a MaternaBox.
              </p>
            </div>
          </section>
        </SectionWrapper>
      </PageTemplate>

      {/* MODAL DE LISTA DE ESPERA */}
      <MaternaBoxWaitlistModal open={waitlistOpen} onClose={closeWaitlist} />
    </>
  );
}
