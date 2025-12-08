'use client'

import Image from 'next/image'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

export default function MaternaBoxPage() {
  return (
    <PageTemplate
      label="MATERNAR"
      title="MaternaBox — pequenos rituais que acolhem sua rotina."
      subtitle="Todo mês, uma caixa criada para transformar momentos simples em conexões afetivas, fortalecer vínculos e trazer mais leveza para o seu dia."
    >
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO · TEXTO + IMAGEM */}
          <SoftCard className="grid gap-8 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.16)] md:grid-cols-[1.2fr,1fr] md:p-7">
            {/* TEXTO */}
            <div className="flex flex-col justify-center space-y-4 md:space-y-5">
              <p className="text-xs md:text-sm font-medium text-[#4a4a4a]">
                A experiência mensal de carinho que aproxima você do seu filho — e de você mesma.
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[#4a4a4a]">
                MaternaBox — pequenos rituais que acolhem sua rotina.
              </h2>

              <p className="text-xs md:text-sm text-[#4a4a4a] leading-relaxed">
                Todo mês, uma caixa criada para transformar momentos simples em conexões afetivas,
                fortalecer vínculos e trazer mais leveza para o seu dia.
              </p>

              <div className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[10px] font-medium text-[#4a4a4a]">
                Não revelamos o conteúdo. A surpresa faz parte da magia — e da experiência Materna360.
              </div>

              <div className="pt-1 flex flex-col gap-2 md:flex-row md:items-center">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto bg-[#ff005e] hover:bg-[#cf285f] text-white border-none"
                >
                  Escolha o seu plano
                </Button>
                <p className="text-[11px] text-[#6a6a6a] md:max-w-xs">
                  Um passo de cada vez. A sua rotina pode ser mais acolhedora — um gesto de cuidado por vez.
                </p>
              </div>
            </div>

            {/* IMAGEM (mantida) */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-[9/10] md:max-w-md">
                <Image
                  src="/images/maternabox2.png"
                  alt="Mãe brincando com o filho enquanto abre a MaternaBox"
                  fill
                  priority
                  sizes="(min-width: 1024px) 420px, (min-width: 768px) 360px, 100vw"
                  className="rounded-3xl object-cover shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                />
              </div>
            </div>
          </SoftCard>

          {/* COMO FUNCIONA A MATERNABOX */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                Como funciona a MaternaBox?
              </h3>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                A MaternaBox é uma experiência mensal cuidadosamente pensada para trazer:
              </p>
              <ul className="space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                <li>• estímulos criativos para seu filho,</li>
                <li>• rituais de presença para vocês viverem juntos,</li>
                <li>• um carinho especial para você,</li>
                <li>• e um momento de pausa dentro da sua rotina.</li>
              </ul>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                Cada edição traz algo novo. Sempre leve, sempre acolhedor, sempre Materna360.
              </p>
            </div>
          </SoftCard>

          {/* O QUE VEM + PARA QUEM É / NÃO É */}
          <div className="grid gap-6 md:gap-8 md:grid-cols-[1.1fr,1fr]">
            {/* O QUE VEM NA CAIXA (mantido, levemente editorial) */}
            <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:p-6">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    O QUE VEM NA SUA MATERNABOX?
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                    Uma combinação leve de carinho, estímulo e presença.
                  </h3>
                  <p className="text-xs md:text-sm text-[#4a4a4a]">
                    A ideia não é encher sua casa de coisas, e sim te dar oportunidades
                    prontas de se conectar com seu filho, com o que você consegue hoje.
                  </p>
                </div>

                <div className="grid gap-3.5 md:grid-cols-2">
                  <div className="space-y-1.5 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Brinquedo educativo principal
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      Pensado para a fase de desenvolvimento do seu filho: coordenação,
                      criatividade, linguagem, vínculo — sempre com olhar pedagógico.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Atividades guiadas prontas
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      Ideias simples com um roteiro em poucos passos para você só chegar,
                      sentar e aproveitar o momento — sem precisar preparar um “evento”.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Mini-guia de conexão
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      Um folheto impresso com sugestões de fala, ajustes para diferentes idades
                      e ideias de como repetir a atividade em outros dias.
                    </p>
                  </div>

                  <div className="space-y-1.5 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Surpresa mensal
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      Pode ser um item sensorial, algo para você ou um detalhe extra para
                      tornar a experiência ainda mais gostosa e afetiva.
                    </p>
                  </div>
                </div>
              </div>
            </SoftCard>

            {/* PARA QUEM É / NÃO É (mantido) */}
            <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ff005e]/80">
                    PARA QUEM É A MATERNABOX?
                  </p>
                  <h3 className="text-sm md:text-base font-semibold text-[#4a4a4a]">
                    Para mães que querem presença possível, não perfeição.
                  </h3>
                  <ul className="mt-1 space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                    <li>• Você sente culpa por não ter tempo (ou energia) para planejar brincadeiras.</li>
                    <li>• Quer momentos de qualidade com seu filho, mesmo em dias corridos.</li>
                    <li>• Gosta de coisas simples, práticas e que já vêm prontas para usar.</li>
                    <li>• Valoriza brinquedos com intenção, não só mais um “monte de coisas” em casa.</li>
                  </ul>
                </div>

                <div className="space-y-2.5 rounded-2xl bg-[#fff7fb] p-3.5 md:p-4">
                  <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ff005e]/80">
                    PARA QUEM AINDA NÃO É
                  </p>
                  <p className="text-sm md:text-base font-semibold text-[#4a4a4a]">
                    Talvez não seja o momento se…
                  </p>
                  <ul className="mt-1 space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                    <li>• Você busca apenas muitos brinquedos pelo menor preço possível.</li>
                    <li>• Prefere atividades complexas, cheias de materiais e produções longas.</li>
                    <li>• Não deseja receber orientações de uso ou conteúdos guiados.</li>
                    <li>• Não se sente confortável em reservar pequenos momentos só para vocês.</li>
                  </ul>
                </div>
              </div>
            </SoftCard>
          </div>

          {/* FAIXA ETÁRIA */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                  ESCOLHA A FAIXA ETÁRIA
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  A caixa acompanha o ritmo do seu filho — e o seu também.
                </h3>
                <p className="text-xs md:text-sm text-[#4a4a4a]">
                  Você seleciona a faixa etária ao assinar e pode ajustar depois,
                  conforme seu filho cresce ou muda de fase.
                </p>
              </div>

              <div className="grid gap-2.5 md:grid-cols-4">
                {['0–1 ano', '1–3 anos', '3–5 anos', '5–8 anos'].map(range => (
                  <button
                    key={range}
                    type="button"
                    className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-2 text-xs font-medium text-[#4a4a4a] transition hover:border-[#ff005e] hover:bg-[#ffd8e6]"
                  >
                    {range}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#6a6a6a]">
                Se você mudar de ideia ou seu filho “disparar” no desenvolvimento,
                é só atualizar a faixa etária antes da próxima caixa.
              </p>
            </div>
          </SoftCard>

          {/* PLANOS DISPONÍVEIS */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:p-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  Planos disponíveis
                </h3>
                <p className="text-xs md:text-sm text-[#4a4a4a]">
                  Escolha o ritmo que faz sentido para a sua família.
                  Cada plano representa um movimento de cuidado — no seu tempo, do seu jeito.
                </p>
              </div>

              <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-4">
                {/* Comece Leve — Plano Mensal */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                      Comece Leve — Plano Mensal
                    </p>
                    <p className="text-xs text-[#4a4a4a]">
                      O primeiro passo para viver a experiência MaternaBox.
                    </p>
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Investimento mensal: R$ 99
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#4a4a4a]">
                      <li>✔ 1 caixa por mês</li>
                      <li>✔ renovação automática</li>
                      <li>✔ pausa quando quiser</li>
                      <li>✔ experiência completa da edição do mês</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#4a4a4a]">
                      Ideal para quem deseja começar aos poucos, sentindo a leveza mês a mês.
                    </p>
                  </div>
                </div>

                {/* Ritmo Constante — Plano Trimestral */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3.5">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                      Ritmo Constante — Plano Trimestral
                    </p>
                    <p className="text-xs text-[#4a4a4a]">
                      Três meses de presença, criatividade e momentos que aproximam.
                    </p>
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Investimento total: R$ 279
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      (equivalente a R$ 93 por mês)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#4a4a4a]">
                      <li>✔ 1 caixa por mês durante 3 meses</li>
                      <li>✔ prioridade na seleção das edições</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#4a4a4a]">
                      Para quem deseja criar um hábito de conexão contínua.
                    </p>
                  </div>
                </div>

                {/* Presença na Rotina — Plano Semestral */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3.5">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                      Presença na Rotina — Plano Semestral
                    </p>
                    <p className="text-xs text-[#4a4a4a]">
                      Seis meses para transformar pequenos momentos em memórias.
                    </p>
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Investimento total: R$ 534
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      (equivalente a R$ 89 por mês)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#4a4a4a]">
                      <li>✔ 1 caixa por mês durante 6 meses</li>
                      <li>✔ prioridade no estoque</li>
                      <li>✔ mimo especial de boas-vindas</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#4a4a4a]">
                      Para quem deseja estabilidade emocional e momentos consistentes de presença.
                    </p>
                  </div>
                </div>

                {/* Experiência Completa — Plano Anual */}
                <div className="flex flex-col justify-between rounded-2xl border border-[#ff005e] bg-white p-3.5 shadow-[0_8px_22px_rgba(0,0,0,0.10)]">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                      Experiência Completa — Plano Anual
                    </p>
                    <p className="text-xs text-[#4a4a4a]">
                      Um ano inteiro de carinho, criatividade e conexão.
                    </p>
                    <p className="text-xs font-semibold text-[#4a4a4a]">
                      Investimento total: R$ 948
                    </p>
                    <p className="text-[11px] text-[#4a4a4a]">
                      (equivalente a R$ 79 por mês)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-[#4a4a4a]">
                      <li>✔ 1 caixa por mês durante 12 meses</li>
                      <li>✔ prioridade máxima nas edições</li>
                      <li>✔ mimo exclusivo anual</li>
                      <li>✔ edição especial comemorativa</li>
                    </ul>
                    <p className="mt-1 text-[11px] text-[#4a4a4a]">
                      Para quem quer viver a experiência MaternaBox de forma profunda, leve e contínua.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* VALORES ESPECIAIS PARA QUEM JÁ VIVE O MATERNA360 */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                Valores especiais para quem já vive o Materna360
              </h3>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                Se você já faz parte da nossa jornada:
              </p>
              <ul className="space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                <li>Assinantes Materna+ recebem 5% de leveza no investimento da MaternaBox.</li>
                <li>Assinantes Materna+360 recebem 10% de cuidado no valor final.</li>
              </ul>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                O ajuste é aplicado automaticamente no checkout.
                Uma forma de agradecer por caminhar conosco — mês após mês.
              </p>
            </div>
          </SoftCard>

          {/* POR QUE A MATERNABOX É DIFERENTE? */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-gradient-to-r from-white via-[#ffd8e6]/40 to-white px-5 py-6 shadow-[0_10px_26px_rgba(0,0,0,0.08)] md:px-7 md:py-7">
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                Por que a MaternaBox é diferente?
              </h3>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                Porque ela não é uma caixa.
                Ela é um convite.
              </p>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                Um convite para:
              </p>
              <ul className="space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                <li>• respirar</li>
                <li>• desacelerar</li>
                <li>• brincar com intenção</li>
                <li>• criar vínculos profundos</li>
                <li>• e trazer mais presença para a infância do seu filho — e para a sua jornada como mãe.</li>
              </ul>
              <p className="text-xs md:text-sm text-[#4a4a4a]">
                A cada edição, um carinho pensado com cuidado, sensibilidade e propósito.
              </p>
            </div>
          </SoftCard>

          {/* CTA FINAL + LISTA DE ESPERA (bloco branco com borda rosa) */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 px-5 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:px-7 md:py-7">
            <div className="grid gap-6 md:grid-cols-[1.1fr,0.9fr] md:items-center">
              <div className="space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                  Escolha o seu plano e comece a viver essa experiência com leveza.
                </h3>
                <p className="text-xs md:text-sm text-[#4a4a4a]">
                  A sua rotina pode ser mais acolhedora — um passo de cada vez.
                </p>
                <p className="text-[11px] md:text-xs text-[#4a4a4a]/90">
                  Ao deixar seus dados, você entra na lista de espera oficial da MaternaBox
                  e será avisada quando abrirmos as primeiras assinaturas.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#4a4a4a]" htmlFor="maternabox-name">
                    Nome completo
                  </label>
                  <input
                    id="maternabox-name"
                    type="text"
                    placeholder="Como você gostaria de ser chamada?"
                    className="w-full rounded-full border border-[#ffd8e6] bg-white px-3 py-2 text-xs text-[#4a4a4a] placeholder:text-[#4a4a4a]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#4a4a4a]" htmlFor="maternabox-whatsapp">
                    WhatsApp
                  </label>
                  <input
                    id="maternabox-whatsapp"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-full border border-[#ffd8e6] bg-white px-3 py-2 text-xs text-[#4a4a4a] placeholder:text-[#4a4a4a]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#4a4a4a]" htmlFor="maternabox-email">
                    E-mail
                  </label>
                  <input
                    id="maternabox-email"
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="w-full rounded-full border border-[#ffd8e6] bg-white px-3 py-2 text-xs text-[#4a4a4a] placeholder:text-[#4a4a4a]/40 focus:outline-none focus:ring-1 focus:ring-[#ff005e]"
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="mt-1 w-full bg-[#ff005e] hover:bg-[#cf285f] text-white border-none"
                >
                  Entrar na lista de espera da MaternaBox ✨
                </Button>
              </div>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="materna-box" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
