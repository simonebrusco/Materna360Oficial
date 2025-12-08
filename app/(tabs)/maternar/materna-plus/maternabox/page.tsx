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
      title="MaternaBox — surpresas que acolhem sua rotina."
      subtitle="Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e criatividade."
    >
      <ClientOnly>
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* HERO · TEXTO + IMAGEM */}
          <SoftCard className="grid gap-8 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_14px_32px_rgba(0,0,0,0.16)] md:grid-cols-[1.2fr,1fr] md:p-7">
            {/* TEXTO */}
            <div className="flex flex-col justify-center space-y-4 md:space-y-5">
              <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                UM CARINHO MENSAL ENTREGUE NA SUA PORTA
              </p>

              <h2 className="text-lg md:text-xl font-semibold text-[#4a4a4a]">
                Mais conexão, menos culpa. Uma caixa pensada para caber na sua rotina real.
              </h2>

              {/* Selinho de autoridade */}
              <div className="inline-flex items-center rounded-full bg-[#ffd8e6] px-3 py-1 text-[10px] font-medium text-[#4a4a4a]">
                Criada por mãe pedagoga há mais de 20 anos na educação infantil
              </div>

              <p className="text-xs md:text-sm text-[#4a4a4a] leading-relaxed">
                Sabe aquela sensação de que o dia acaba e vocês quase não brincaram?
                A MaternaBox nasce justamente para isso: te ajudar a viver momentos simples,
                mas cheios de presença, mesmo na correria.
              </p>

              <p className="text-xs md:text-sm text-[#4a4a4a] leading-relaxed">
                Todo mês, você recebe uma caixa com atividades prontas, brinquedos educativos
                e ideias rápidas para se conectar com seu filho — sem precisar pesquisar,
                planejar ou inventar tudo do zero.
              </p>

              <div className="pt-1 flex flex-col gap-2 md:flex-row md:items-center">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto bg-[#ff005e] hover:bg-[#cf285f] text-white border-none"
                >
                  Quero viver esses momentos com meu filho
                </Button>
                <p className="text-[11px] text-[#6a6a6a] md:max-w-xs">
                  Um passo de cada vez. Você escolhe o plano quando se sentir pronta.
                </p>
              </div>

              {/* Mini fluxo “como funciona” */}
              <div className="mt-1 grid gap-2 text-[10px] text-[#4a4a4a]/80 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd8e6] text-[11px] font-semibold text-[#ff005e]">
                    1
                  </span>
                  <p>
                    Você escolhe a faixa etária e o plano que faz sentido agora.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd8e6] text-[11px] font-semibold text-[#ff005e]">
                    2
                  </span>
                  <p>
                    A cada mês, recebe uma caixa pensada para a fase do seu filho.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd8e6] text-[11px] font-semibold text-[#ff005e]">
                    3
                  </span>
                  <p>
                    Vocês vivem um momento leve juntos — sem precisar planejar nada.
                  </p>
                </div>
              </div>
            </div>

            {/* IMAGEM */}
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

          {/* SEÇÃO 2 · O QUE VEM + PARA QUEM É */}
          <div className="grid gap-6 md:gap-8 md:grid-cols-[1.1fr,1fr]">
            {/* BLOCO 2 · O QUE VEM NA CAIXA */}
            <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:p-6">
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

            {/* BLOCO 2.5 · PARA QUEM É / NÃO É */}
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

          {/* SEÇÃO 3 · FAIXA ETÁRIA + PLANOS */}
          <div className="grid gap-6 md:gap-8 md:grid-cols-[1.05fr,1fr]">
            {/* BLOCO 3 · FAIXA ETÁRIA */}
            <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] md:p-6">
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

                <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4">
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

            {/* BLOCO 4 · PLANOS */}
            <SoftCard className="h-full rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_10px_24px_rgba(0,0,0,0.10)] md:p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    PLANOS PENSADOS PARA A SUA ROTINA
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#4a4a4a]">
                    Comece leve, experimente e depois decide se quer seguir.
                  </h3>
                  <p className="text-xs md:text-sm text-[#4a4a4a]">
                    Você pode começar testando por pouco tempo ou já garantir um período maior
                    com mais economia. Todos os planos têm a mesma experiência dentro da caixa
                    — o que muda é o tempo de companhia.
                  </p>
                </div>

                <div className="grid gap-3.5 md:grid-cols-2">
                  <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] p-3.5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                        Comece leve
                      </p>
                      <p className="text-sm font-semibold text-[#4a4a4a]">Plano mensal</p>
                      <p className="text-xs text-[#4a4a4a]">
                        1 mês para experimentar a MaternaBox e sentir como ela encaixa nos seus dias.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3.5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                        Ritmo constante
                      </p>
                      <p className="text-sm font-semibold text-[#4a4a4a]">Plano trimestral</p>
                      <p className="text-xs text-[#4a4a4a]">
                        3 meses de caixinhas para criar um novo ritual de conexão na semana.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-2xl border border-[#ffd8e6] bg-white p-3.5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#ff005e] uppercase">
                        Presença na rotina
                      </p>
                      <p className="text-sm font-semibold text-[#4a4a4a]">Plano semestral</p>
                      <p className="text-xs text-[#4a4a4a]">
                        Meio ano com uma ajudinha mensal para manter momentos bons mesmo nos dias corridos.
                      </p>
                    </div>
                  </div>

                  {/* Card destacado – agora branco com borda rosa */}
                  <div className="flex flex-col justify-between rounded-2xl border border-[#ff005e] bg-white p-3.5 shadow-[0_8px_22px_rgba(0,0,0,0.10)]">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center rounded-full bg-[#ff005e] px-3 py-0.5 text-[10px] font-semibold uppercase text-white">
                        Experiência completa
                      </span>
                      <p className="text-sm font-semibold text-[#4a4a4a] mt-1">
                        Plano anual
                      </p>
                      <p className="text-xs text-[#4a4a4a]">
                        12 meses com temas variados, registros afetivos e memórias espalhadas ao longo do ano.
                      </p>
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-[#ff005e]">
                      Melhor custo-benefício para quem já decidiu caminhar com a MaternaBox.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full md:w-auto bg-[#ff005e] hover:bg-[#cf285f] text-white border-none"
                  >
                    Ver valores e detalhes dos planos
                  </Button>
                </div>
              </div>
            </SoftCard>
          </div>

          {/* BLOCO 4.5 · POR QUE ISSO IMPORTA PARA O SEU FILHO */}
          <SoftCard className="rounded-3xl border border-[#ffd8e6] bg-gradient-to-r from-white via-[#ffd8e6]/60 to-white px-5 py-6 shadow-[0_10px_26px_rgba(0,0,0,0.10)] md:px-7 md:py-7">
            <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr] md:items-center">
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#ff005e]/80">
                  POR QUE ISSO IMPORTA PARA O SEU FILHO?
                </p>
                <h3 className="text-sm md:text-base font-semibold text-[#4a4a4a]">
                  Muito além da caixa: é sobre memórias, segurança e vínculo.
                </h3>
                <p className="text-xs md:text-sm text-[#4a4a4a]">
                  Para a criança, esses pequenos momentos de presença viram referência de amor,
                  segurança e pertencimento. Não é sobre fazer algo perfeito, é sobre estar ali
                  de verdade — mesmo que por poucos minutos.
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] md:text-xs text-[#4a4a4a]">
                  <li>• Cada atividade é um convite para olho no olho, riso e descoberta juntos.</li>
                  <li>• A criança sente que tem um espaço especial só de vocês na rotina.</li>
                  <li>• Você mostra, na prática, que ela é importante mesmo nos dias corridos.</li>
                </ul>
              </div>

              <div className="space-y-2 rounded-2xl bg-white/80 p-4 text-[11px] md:text-xs text-[#4a4a4a]">
                <p className="font-semibold text-[#ff005e]">
                  “Não é sobre ter mais coisas, é sobre viver mais momentos.”
                </p>
                <p>
                  A MaternaBox foi pensada para mães reais: cansadas, cheias de tarefas,
                  mas que não querem abrir mão de criar lembranças boas com os filhos.
                  Um lembrete mensal de que você não precisa ser perfeita — só presente.
                </p>
              </div>
            </div>
          </SoftCard>

          {/* BLOCO 5 · LISTA DE ESPERA */}
          <SoftCard className="rounded-3xl border border-white/80 bg-gradient-to-r from-[#ff005e] to-[#ff7aa5] px-4 py-5 text-white shadow-[0_16px_36px_rgba(0,0,0,0.26)] md:px-6 md:py-6">
            <div className="space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6">
              <div className="space-y-1.5 max-w-xl">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-white/90">
                  LISTA DE ESPERA
                </p>
                <p className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm md:text-base font-semibold text-white">
                  Quer ser avisada quando a MaternaBox abrir as primeiras assinaturas?
                </p>
                <p className="text-[11px] md:text-xs text-white/90">
                  Deixe seu e-mail e nós te avisamos em primeira mão — sem spam, só novidades
                  sobre a abertura e os presentes de boas-vindas.
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-2 md:mt-0 md:min-w-[260px]">
                <input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  className="w-full rounded-full border border-white/70 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/70 focus:outline-none fokus:ring-2 focus:ring-white/80"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full border border-white bg-white text-[#ff005e] hover:bg:white/90"
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
