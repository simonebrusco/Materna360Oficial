import type { Metadata } from 'next'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'

export const metadata: Metadata = {
  title: 'MaternaBox | Materna360',
}

export default function MaternaBoxPage() {
  return (
    <PageTemplate
      label="MATERNAR"
      title="MaternaBox — surpresas que acolhem sua rotina."
      subtitle="Todo mês, uma caixa criada para aproximar você do seu filho com leveza, carinho e criatividade."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-4 md:px-6 space-y-8 md:space-y-10">
          {/* HERO – LANDING */}
          <SoftCard className="grid gap-6 rounded-[28px] border border-[#ffd8e6] bg-white/98 p-5 shadow-[0_18px_45px_rgba(255,0,94,0.18)] md:grid-cols-[1.25fr,1fr] md:p-7">
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]">
                  UM CARINHO MENSAL ENTREGUE NA SUA PORTA
                </p>
                <h2 className="text-lg md:text-2xl font-semibold text-[#2f3a56] leading-snug">
                  Uma caixa para menos culpa, mais conexão e memórias boas com seu filho.
                </h2>
                <p className="text-xs md:text-sm text-[#545454]">
                  A MaternaBox foi pensada para mães que querem estar presentes, mas
                  vivem a correria real do dia a dia. A cada edição, você recebe
                  atividades, livros e momentos prontos para viver com o seu filho —
                  sem precisar planejar nada.
                </p>

                <ul className="mt-2 space-y-1.5 text-xs md:text-sm text-[#2f3a56]">
                  <li className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                    <span>Atividades guiadas para brincar sem gastar horas no Pinterest.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                    <span>Itens escolhidos para a idade do seu filho, com foco em vínculo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                    <span>Você só abre a caixa, segue o passo a passo e vive o momento.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-1">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full md:w-auto"
                >
                  Quero escolher meu plano
                </Button>
                <p className="text-[11px] text-[#6a6a6a]">
                  Um passo de cada vez. Seu primeiro mês pode ser só um teste.
                </p>
              </div>
            </div>

            {/* “Imagem” editorial da box – placeholder com vibe premium */}
            <div className="relative flex items-center justify-center">
              <div className="absolute -top-6 -right-4 h-24 w-24 rounded-full bg-[rgba(255,216,230,0.9)] blur-3xl" />
              <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[rgba(255,0,94,0.18)] blur-3xl" />
              <div className="relative z-10 w-full rounded-3xl bg-[#fff5fa] border border-[#ffd8e6] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
                    <AppIcon name="box" className="h-6 w-6 text-[#ff005e]" decorative />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#2f3a56]">
                      Sua próxima MaternaBox está chegando…
                    </p>
                    <p className="text-[11px] text-[#545454]">
                      Pense em um fim de tarde leve, brinquedos na sala e vocês dois
                      rindo juntos. É isso que a gente quer colocar dentro da caixa.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#545454]">
                  <div className="rounded-2xl bg-white/90 px-3 py-2">
                    <p className="font-semibold text-[11px] text-[#2f3a56]">
                      Tempo de qualidade
                    </p>
                    <p>Roteiros de brincadeiras simples para usar em 15–30 minutos.</p>
                  </div>
                  <div className="rounded-2xl bg-white/90 px-3 py-2">
                    <p className="font-semibold text-[11px] text-[#2f3a56]">
                      Sem caos extra
                    </p>
                    <p>Atividades pensadas para caber na rotina — sem perfeccionismo.</p>
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* COMO FUNCIONA */}
          <SoftCard className="space-y-4 rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 md:p-6">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#ff005e]/90">
                O QUE VEM NA SUA MATERNABOX?
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Tudo pronto para você só abrir a caixa e viver o momento.
              </h2>
            </header>

            <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm text-[#545454]">
              <div className="space-y-1.5">
                <p className="font-semibold text-[#2f3a56]">Brincar com sentido</p>
                <p>
                  Atividades guiadas para a faixa etária do seu filho, com objetivos
                  claros de desenvolvimento, sem cara de prova de escola.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-[#2f3a56]">Ferramentas para a rotina</p>
                <p>
                  Itens que você realmente usa: jogos, materiais sensoriais, histórias
                  e pequenas surpresas que rendem vários dias de uso.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-[#2f3a56]">Roteiros rápidos</p>
                <p>
                  Um mini-guia para você saber por onde começar, quanto tempo dura e
                  como adaptar se o dia estiver mais cansativo.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-[#2f3a56]">Carinho para você também</p>
                <p>
                  Pequenos lembretes e propostas de autocuidado, porque uma mãe
                  acolhida consegue acolher melhor o filho.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[#6a6a6a]">
              Os conteúdos podem variar a cada edição, mas a intenção é sempre a mesma:
              aproximar vocês dois, com leveza.
            </p>
          </SoftCard>

          {/* FAIXA ETÁRIA */}
          <SoftCard className="space-y-4 rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 md:p-6">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#ff005e]/90">
                PASSO 1
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Escolha a faixa etária da sua MaternaBox
              </h2>
              <p className="text-xs md:text-sm text-[#545454]">
                Se você já preencheu o Eu360, vamos sugerir automaticamente a faixa
                ideal. Se preferir, você pode escolher aqui:
              </p>
            </header>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              {[
                '0–1 ano',
                '1–3 anos',
                '3–6 anos',
                '6–8 anos',
                '8+ anos',
              ].map(label => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-[#ffd8e6] bg-white px-3 py-1 font-medium text-[#2f3a56] hover:border-[#ff005e] hover:bg-[#ffd8e6]/30 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-[#6a6a6a]">
              Você pode ajustar a faixa etária depois, se sentir que seu filho está em
              outro ritmo de fase.
            </p>
          </SoftCard>

          {/* TEMAS DO ANO */}
          <SoftCard className="space-y-4 rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 md:p-6">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#ff005e]/90">
                CADA MÊS, UM TEMA
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Histórias e temas pensados para acompanhar o ritmo do seu ano.
              </h2>
            </header>

            <div className="grid gap-3 md:grid-cols-2 text-[11px] md:text-xs">
              <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3">
                <p className="font-semibold text-[#2f3a56] mb-1">
                  Férias leve & rotina gentil
                </p>
                <p className="text-[#545454]">
                  Caixinhas para recomeçar a rotina com menos atrito e mais presença.
                </p>
              </div>
              <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3">
                <p className="font-semibold text-[#2f3a56] mb-1">
                  Imaginação, emoções & conexão
                </p>
                <p className="text-[#545454]">
                  Brincadeiras que ajudam seu filho a nomear sentimentos e fortalecer o
                  vínculo com você.
                </p>
              </div>
              <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3">
                <p className="font-semibold text-[#2f3a56] mb-1">
                  Descobertas & autonomia
                </p>
                <p className="text-[#545454]">
                  Pequenos desafios gostosos que estimulam independência com segurança.
                </p>
              </div>
              <div className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3">
                <p className="font-semibold text-[#2f3a56] mb-1">
                  Encantos de fim de ano
                </p>
                <p className="text-[#545454]">
                  Caixas especiais para celebrar o ano que passou com memórias quentinhas
                  e cheias de afeto.
                </p>
              </div>
            </div>
          </SoftCard>

          {/* PLANOS / PREÇOS */}
          <SoftCard className="space-y-4 rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 md:p-6">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#ff005e]/90">
                PLANOS PENSADOS PARA A SUA ROTINA
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                Você escolhe quanto quer experimentar — a intenção é sempre a mesma.
              </h2>
              <p className="text-xs md:text-sm text-[#545454]">
                Os valores podem mudar no lançamento oficial, mas a lógica é simples:
                quanto maior o plano, mais leve fica o valor por mês.
              </p>
            </header>

            <div className="grid gap-3 md:grid-cols-4 text-xs md:text-sm">
              {/* MENSAL */}
              <div className="flex flex-col rounded-2xl border border-[#ffd8e6] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b4d96] mb-1">
                  COMEÇE LEVE
                </p>
                <p className="text-sm font-semibold text-[#2f3a56]">Plano mensal</p>
                <p className="text-xs font-semibold text-[#ff005e] mt-1">R$ 119/mês*</p>
                <p className="mt-2 text-[11px] text-[#545454] flex-1">
                  Uma MaternaBox por mês, para testar a experiência sem compromisso.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Quero testar
                </Button>
              </div>

              {/* TRIMESTRAL */}
              <div className="flex flex-col rounded-2xl border border-[#ffd8e6] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b4d96] mb-1">
                  RITMO CONSTANTE
                </p>
                <p className="text-sm font-semibold text-[#2f3a56]">Plano trimestral</p>
                <p className="text-xs font-semibold text-[#ff005e] mt-1">R$ 109/mês*</p>
                <p className="mt-2 text-[11px] text-[#545454] flex-1">
                  Caixinhas a cada 3 meses, com temas que se complementam.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Quero no meu ritmo
                </Button>
              </div>

              {/* SEMESTRAL */}
              <div className="flex flex-col rounded-2xl border border-[#ffd8e6] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b4d96] mb-1">
                  PRESENÇA NA ROTINA
                </p>
                <p className="text-sm font-semibold text-[#2f3a56]">Plano semestral</p>
                <p className="text-xs font-semibold text-[#ff005e] mt-1">R$ 99/mês*</p>
                <p className="mt-2 text-[11px] text-[#545454] flex-1">
                  Encontros com a MaternaBox em vários momentos do seu ano.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Quero 6 meses leves
                </Button>
              </div>

              {/* ANUAL – DESTAQUE */}
              <div className="flex flex-col rounded-2xl border-2 border-[#ff005e] bg-[#fff5fa] p-4 shadow-[0_12px_26px_rgba(255,0,94,0.26)]">
                <div className="mb-1 inline-flex items-center rounded-full bg-[#ff005e] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  MAIS ESCOLHIDO
                </div>
                <p className="text-sm font-semibold text-[#2f3a56]">Plano anual</p>
                <p className="text-xs font-semibold text-[#ff005e] mt-1">R$ 89/mês*</p>
                <p className="mt-2 text-[11px] text-[#545454] flex-1">
                  Um ano inteiro com caixinhas planejadas para acompanhar os ciclos da
                  sua família.
                </p>
                <Button variant="primary" size="sm" className="mt-3">
                  Quero um ano de MaternaBox
                </Button>
              </div>
            </div>

            <p className="mt-2 text-[10px] text-[#6a6a6a]">
              *Valores ilustrativos para teste da página. O preço oficial será definido
              no lançamento e pode variar conforme condições especiais.
            </p>
          </SoftCard>

          {/* FAQ */}
          <SoftCard className="space-y-4 rounded-3xl border border-[#ffd8e6] bg-white/98 p-5 md:p-6">
            <header className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#ff005e]/90">
                PERGUNTAS FREQUENTES
              </p>
              <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                E se meu filho não gostar? E se eu não der conta?
              </h2>
            </header>

            <div className="space-y-3 text-xs md:text-sm text-[#545454]">
              <div>
                <p className="font-semibold text-[#2f3a56]">
                  E se meu filho não gostar do tema do mês?
                </p>
                <p>
                  Tudo bem. Cada criança é única e nenhuma mãe precisa acertar sempre.
                  A ideia é experimentar, adaptar e descobrir o jeito que faz sentido
                  para a sua família.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#2f3a56]">
                  Posso ajustar a faixa etária depois?
                </p>
                <p>
                  Sim. Conforme seu filho cresce, você poderá alterar a faixa nas
                  configurações da assinatura para manter tudo alinhado com o momento
                  dele.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#2f3a56]">
                  Os itens são sempre os mesmos?
                </p>
                <p>
                  Não. Cada edição traz uma combinação nova de brinquedos, materiais e
                  atividades — sempre com curadoria leve e afetiva.
                </p>
              </div>
            </div>
          </SoftCard>

          {/* LISTA DE ESPERA / LEAD FORM */}
          <SoftCard className="rounded-3xl border border-white/80 bg-gradient-to-r from-[#ff005e] to-[#ff6fa0] px-4 py-5 md:px-6 md:py-6 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <div className="space-y-3 md:space-y-4">
              <header className="space-y-1 text-white">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase">
                  LISTA DE ESPERA
                </p>
                <h2 className="text-base md:text-lg font-semibold">
                  Quer ser avisada quando a MaternaBox abrir?
                </h2>
                <p className="text-xs md:text-sm text-white/90 max-w-2xl">
                  Um passo de cada vez: deixe seu e-mail e nós te avisamos quando as
                  assinaturas abrirem com condições especiais para as primeiras mães.
                </p>
              </header>

              <form
                className="grid gap-2 text-[11px] md:grid-cols-[minmax(0,1.2fr),minmax(0,1.2fr),minmax(0,0.9fr)] md:text-xs"
                onSubmit={e => e.preventDefault()}
              >
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-white/95" htmlFor="nome">
                    Nome (opcional)
                  </label>
                  <input
                    id="nome"
                    type="text"
                    placeholder="Como você prefere ser chamada?"
                    className="h-9 rounded-full border border-white/70 bg-white/95 px-3 text-xs text-[#2f3a56] placeholder:text-[#545454]/60 focus:outline-none focus:ring-2 focus:ring-white/70"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium text-white/95" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Seu melhor e-mail para receber as novidades"
                    className="h-9 rounded-full border border-white/70 bg-white/95 px-3 text-xs text-[#2f3a56] placeholder:text-[#545454]/60 focus:outline-none focus:ring-2 focus:ring-white/70"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-full bg-white text-[#ff005e] hover:bg-white/95"
                  >
                    Quero ser avisada quando abrir
                  </Button>
                </div>
              </form>

              <p className="text-[10px] text-white/80">
                Sem spam. Você receberá só novidades importantes e conteúdos que possam
                te inspirar a viver meses mais leves.
              </p>
            </div>
          </SoftCard>

          <MotivationalFooter routeKey="materna-box" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
