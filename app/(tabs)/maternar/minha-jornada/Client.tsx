'use client'

import * as React from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MiniTileProps = {
  label: string
  subtitle?: string
  tag?: string
}

/**
 * Mini card modular estilo "soundboard" — usado para representar conquistas, missões e progresso.
 */
function MiniTile({ label, subtitle, tag }: MiniTileProps) {
  return (
    <button
      type="button"
      className="
        w-full text-left
        rounded-2xl
        bg-white/90 hover:bg-white
        border border-[#f5d7e5]
        shadow-[0_4px_12px_rgba(184,35,107,0.08)]
        px-3.5 py-3.5
        transition
        hover:-translate-y-0.5
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#fd2597]/70
        cursor-default
      "
    >
      <div className="flex flex-col gap-1">
        {tag && (
          <span
            className="
              inline-flex w-max items-center
              rounded-full bg-[#ffe1f1]
              px-2 py-0.5
              text-[10px] font-semibold tracking-wide
              text-[#b8236b] uppercase
            "
          >
            {tag}
          </span>
        )}
        <span className="block text-[13px] md:text-[14px] font-medium text-[#2f3a56] leading-snug">
          {label}
        </span>
        {subtitle && (
          <span className="block text-[12px] text-[#6a6a6a] leading-snug">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  )
}

export default function MinhaJornadaClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
        page: 'minha-jornada',
        timestamp: new Date().toISOString(),
      })
    } catch {
      // telemetria nunca quebra a página
    }
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Minha Jornada
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um painel para enxergar seus pequenos passos, presença e conquistas com mais gentileza —
                sem culpa e sem metas inalcançáveis.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* PAINEL MODULAR PRINCIPAL */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
                space-y-6 md:space-y-7
              "
            >
              {/* SEÇÃO 1 — PAINEL DA JORNADA */}
              <section id="painel">
                <Reveal>
                  <SoftCard
                    className="
                      p-5 md:p-6 rounded-2xl
                      bg-white/95
                      border border-[#f5d7e5]
                      shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      space-y-4
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="star" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Painel da jornada
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Um olhar geral sobre a sua presença
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Aqui, a ideia não é medir produtividade. É perceber que você está presente —
                          mesmo nos dias em que parece pouco.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="presença"
                        label="Dias em que você apareceu por aqui"
                        subtitle="Cada dia conta, mesmo que só por alguns minutos."
                      />
                      <MiniTile
                        tag="cuidado"
                        label="Momentos em que cuidou de você"
                        subtitle="Pausas, gestos gentis, pequenos respiros."
                      />
                      <MiniTile
                        tag="conexão"
                        label="Momentos de conexão com seu filho"
                        subtitle="Brincadeiras, conversas, olhares atentos."
                      />
                      <MiniTile
                        tag="equilíbrio"
                        label="Dias em que escolheu pegar mais leve"
                        subtitle="Quando decidiu não abraçar o mundo sozinha."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Este painel não existe para te julgar. Ele serve para te lembrar que, mesmo em meio ao caos,
                      você tem feito o melhor possível com o que tem hoje.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 2 — MISSÕES DO DIA */}
              <section id="missoes">
                <Reveal>
                  <SoftCard
                    className="
                      p-5 md:p-6 rounded-2xl
                      bg-white/95
                      border border-[#f5d7e5]
                      shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      space-y-4
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="sun" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Missões do dia
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Pequenos combinados gentis com você mesma
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não são tarefas obrigatórias. São sugestões de passos possíveis para hoje.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="você"
                        label="Fazer um gesto de autocuidado"
                        subtitle="Algo rápido, mas intencional, só para você."
                      />
                      <MiniTile
                        tag="conexão"
                        label="Ter um momento presente com seu filho"
                        subtitle="Cinco minutos em que ele sente que você está ali."
                      />
                      <MiniTile
                        tag="apoio"
                        label="Pedir ou aceitar ajuda em algo"
                        subtitle="Dividir um pedaço da carga do dia."
                      />
                      <MiniTile
                        tag="limite"
                        label="Dizer um “não” que te protege"
                        subtitle="Recusar algo que te sobrecarregaria ainda mais."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0]">
                      Se você fizer só uma dessas coisas hoje, já é missão cumprida. Se não der para fazer nenhuma,
                      este painel continua disponível amanhã — sem julgamentos.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 3 — SELOS & MEDALHAS */}
              <section id="selos">
                <Reveal>
                  <SoftCard
                    className="
                      p-5 md:p-6 rounded-2xl
                      bg-white/95
                      border border-[#f5d7e5]
                      shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      space-y-4
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Selos & medalhas
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Reconhecer o que você já fez — e costuma esquecer
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não são prêmios perfeitos. São lembretes de que sua história tem muitas pequenas vitórias.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="selo"
                        label="Dia em que escolhi pedir ajuda"
                        subtitle="E isso tornou tudo um pouco mais possível."
                      />
                      <MiniTile
                        tag="selo"
                        label="Dia em que fui mais gentil comigo"
                        subtitle="Deixei a cobrança de lado por alguns instantes."
                      />
                      <MiniTile
                        tag="selo"
                        label="Dia em que consegui brincar sem olhar o relógio"
                        subtitle="Mesmo que tenha sido por pouco tempo."
                      />
                      <MiniTile
                        tag="selo"
                        label="Dia em que priorizei descansar"
                        subtitle="E deixei algo menos importante para depois."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Você não precisa “merecer” esses selos. Eles existem para te lembrar de reconhecer aquilo que
                      geralmente passa batido na correria.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 4 — PROGRESSO MENSAL */}
              <section id="progresso">
                <Reveal>
                  <SoftCard
                    className="
                      p-5 md:p-6 rounded-2xl
                      bg-white/95
                      border border-[#f5d7e5]
                      shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      space-y-4
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Progresso mensal
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Um mês visto em semanas, não em perfeição
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          A ideia aqui é enxergar tendências, não cobrar constância perfeita.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <MiniTile
                        tag="semana 1"
                        label="Semana em que você só sobreviveu"
                        subtitle="E isso já foi um esforço gigante. Conta, e muito."
                      />
                      <MiniTile
                        tag="semana 2"
                        label="Semana em que cuidou um pouco mais de você"
                        subtitle="Talvez com uma pausa, um banho mais demorado, um descanso."
                      />
                      <MiniTile
                        tag="semana 3"
                        label="Semana em que conseguiu se conectar mais com seu filho"
                        subtitle="Brincadeiras, conversas, momentos de riso juntos."
                      />
                      <MiniTile
                        tag="semana 4"
                        label="Semana em que ajustou algo na rotina"
                        subtitle="Um horário, um pedido de ajuda, um limite novo."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Progresso não é linha reta. Alguns meses vão ser mais caóticos, outros mais leves.
                      O foco aqui é perceber movimentos, não exigir de você uma performance constante.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>
            </div>

            <div className="mt-4">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
