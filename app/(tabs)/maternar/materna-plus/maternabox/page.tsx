'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

export default function MaternaBoxPage() {
  return (
    <PageTemplate
      label="MATERNAR"
      title="MaternaBox — surpresas que acolhem sua rotina."
      subtitle="Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e criatividade."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">

          {/* HERO · TEXTO + IMAGEM */}
          <SoftCard className="grid gap-6 rounded-3xl border border-white/80 bg-white/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] md:grid-cols-[1.2fr,1fr] md:p-6">
            <div className="flex flex-col justify-center space-y-4">
              <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                UM CARINHO MENSAL ENTREGUE NA SUA PORTA
              </p>
              <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                Mais conexão, menos culpa. Uma caixa pensada para caber na sua rotina real.
              </h2>
              <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                A MaternaBox nasce para mães que querem estar presentes, mas vivem a correria real do dia a dia.
                Todo mês, você recebe uma caixa com atividades simples, brinquedos educativos e momentos prontos
                para viver com seu filho — sem precisar planejar nada do zero.
              </p>
              <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                É sobre transformar pequenos momentos em memórias, reduzir a culpa e sentir que você está
                construindo uma infância leve, do seu jeito.
              </p>

              <div className="pt-2 flex flex-col gap-2 md:flex-row md:items-center">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto"
                >
                  Quero escolher meu plano
                </Button>
                <p className="text-[11px] text-[#6a6a6a]">
                  Um passo de cada vez. Seu plano pode ser ajustado no seu tempo.
                </p>
              </div>
            </div>

            {/* Bloco visual (sem depender de imagem externa) */}
            <div className="relative flex items-center justify-center">
              <div className="relative h-48 w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#ffd8e6] to-[#ffe8f2] shadow-[0_18px_40px_rgba(0,0,0,0.18)] overflow-hidden flex items-center justify-center">
                <div className="space-y-2 px-5">
                  <p className="text-xs font-semibold text-[#2f3a56]">
                    Dentro da caixa, todo mês:
                  </p>
                  <ul className="text-[11px] text-[#545454] space-y-1">
                    <li>• 1 brinquedo educativo adequado à faixa etária.</li>
                    <li>• 1 atividade guiada para viver um momento especial.</li>
                    <li>• 1 mini-guia impresso com passo a passo simples.</li>
                    <li>• Surpresinhas pensadas para fortalecer a conexão.</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-[#9b4d96]">
                    Tudo pensado para caber em poucos minutos, sem precisar “dar conta de tudo”.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 2 · O QUE VEM NA CAIXA */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)] md:p-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                  O QUE VEM NA SUA MATERNABOX?
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Uma combinação leve de carinho, estímulo e presença.
                </h3>
                <p className="text-xs md:text-sm text-[#545454]">
                  Cada edição é criada para trazer pequenas experiências prontas, sem exigir que você tenha tempo,
                  criatividade ou energia sobrando.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3">
                  <p className="text-xs font-semibold text-[#2f3a56]">
                    1 brinquedo educativo principal
                  </p>
                  <p className="text-[11px] text-[#545454]">
                    Sempre alinhado à fase do seu filho: coordenação motora, criatividade, linguagem ou vínculo.
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3">
                  <p className="text-xs font-semibold text-[#2f3a56]">
                    Atividades guiadas prontas
                  </p>
                  <p className="text-[11px] text-[#545454]">
                    Ideias simples com roteiro em 3 passos para você só chegar, sentar e viver o momento.
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3">
                  <p className="text-xs font-semibold text-[#2f3a56]">
                    Mini-guia de conexão
                  </p>
                  <p className="text-[11px] text-[#545454]">
                    Um folheto impresso com sugestões de frases, jeitos de conduzir a brincadeira e adaptar ao seu dia.
                  </p>
                </div>
                <div className="space-y-1 rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3">
                  <p className="text-xs font-semibold text-[#2f3a56]">
                    Surpresa mensal
                  </p>
                  <p className="text-[11px] text-[#545454]">
                    Pode ser um item sensorial, algo para você, ou um detalhe extra para deixar o momento ainda mais especial.
                  </p>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 3 · FAIXA ETÁRIA SIMPLIFICADA */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:p-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                  ESCOLHA A FAIXA ETÁRIA
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  A caixa acompanha o ritmo do seu filho — e o seu também.
                </h3>
                <p className="text-xs md:text-sm text-[#545454]">
                  Você seleciona a faixa etária ao assinar e pode ajustar depois, conforme seu filho cresce.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {['0–1 ano', '1–3 anos', '3–5 anos', '5–8 anos'].map(range => (
                  <button
                    key={range}
                    type="button"
                    className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-2 text-xs font-medium text-[#2f3a56] transition hover:border-[#ff005e] hover:bg-[#ffd8e6]/30"
                  >
                    {range}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#6a6a6a]">
                Você pode ajustar a faixa etária sempre que sentir que seu filho mudou de fase.
              </p>
            </div>
          </SoftCard>

          {/* BLOCO 4 · PLANOS */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-white/98 p-4 shadow-[0_12px_26px_rgba(0,0,0,0.12)] md:p-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                  PLANOS PENSADOS PARA A SUA ROTINA
                </p>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                  Comece leve, experimente e depois decide se quer seguir.
                </h3>
                <p className="text-xs md:text-sm text-[#545454]">
                  Você pode começar com um plano mensal para testar a experiência ou já garantir um plano mais longo
                  com um valor mais em conta.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[#9b4d96] uppercase">
                      Comece leve
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">Plano mensal</p>
                    <p className="text-xs text-[#545454]">
                      Experimente por 1 mês e veja como a MaternaBox se encaixa na sua rotina.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[#9b4d96] uppercase">
                      Ritmo constante
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">Plano trimestral</p>
                    <p className="text-xs text-[#545454]">
                      3 meses de caixinhas para criar um novo ritual de conexão na semana.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[#9b4d96] uppercase">
                      Presença na rotina
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">Plano semestral</p>
                    <p className="text-xs text-[#545454]">
                      Meio ano com uma ajudinha mensal para manter a conexão viva mesmo nos dias corridos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#ff005e] bg-[#ff005e]/5 p-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                      Experiência completa
                    </p>
                    <p className="text-sm font-semibold text-[#2f3a56]">Plano anual</p>
                    <p className="text-xs text-[#545454]">
                      12 meses com temas variados, memórias e registros afetivos ao longo do ano.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <Button variant="primary" size="sm" className="w-full md:w-auto">
                  Ver valores e detalhes dos planos
                </Button>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 5 · LISTA DE ESPERA / CTA FINAL */}
          <SoftCard className="rounded-3xl border border-white/80 bg-gradient-to-r from-[#ff005e] to-[#ff7aa5] px-4 py-5 text-white shadow-[0_16px_36px_rgba(0,0,0,0.28)] md:px-6 md:py-6">
            <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-1 max-w-xl">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-white/90">
                  LISTA DE ESPERA
                </p>
                <p className="text-sm md:text-base font-semibold">
                  Quer ser avisada quando a MaternaBox abrir as primeiras assinaturas?
                </p>
                <p className="text-[11px] md:text-xs text-white/90">
                  Deixe seu e-mail e nós te avisamos em primeira mão — sem spam, só notícias boas.
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-2 md:mt-0 md:min-w-[250px]">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="w-full rounded-full border border-white/70 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/80"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full border border-white bg-white text-[#ff005e] hover:bg-white/90"
                >
                  Quero ser avisada quando abrir ✨
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
