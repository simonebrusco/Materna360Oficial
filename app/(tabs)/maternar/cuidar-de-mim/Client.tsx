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

type LineTileProps = {
  label: string
  subtitle?: string
  tag?: string
}

/**
 * Linha suave de autocuidado — estilo "spa digital":
 * - não é botão de ação
 * - não registra nada
 * - serve como sugestão visual, calma e gentil
 */
function LineTile({ label, subtitle, tag }: LineTileProps) {
  return (
    <div
      className="
        w-full
        rounded-2xl
        bg-white/92
        border border-[#f5d7e5]/80
        px-3.5 py-3
        shadow-[0_8px_26px_rgba(184,35,107,0.08)]
        flex flex-col gap-1
      "
    >
      {tag && (
        <span className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
          {tag}
        </span>
      )}
      <span className="text-[13px] md:text-[14px] font-medium text-[#2f3a56] leading-snug">
        {label}
      </span>
      {subtitle && (
        <span className="text-[12px] text-[#6a6a6a] leading-snug">
          {subtitle}
        </span>
      )}
    </div>
  )
}

export default function CuidarDeMimClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
        page: 'cuidar-de-mim',
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
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_18%,#fdbed7_40%,#ffe1f1_75%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO */}
          <header className="pt-8 md:pt-10 mb-7 md:mb-9">
            <div className="space-y-4">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <div className="space-y-2">
                <h1 className="text-[26px] md:text-[30px] font-semibold text-white leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                  Cuidar de Mim
                </h1>

                <p className="text-sm md:text-[15px] text-white/92 leading-relaxed max-w-xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                  Um espaço suave para você respirar, se perceber e encaixar pequenos gestos de cuidado no meio da rotina.
                </p>

                <p className="text-[12px] md:text-[13px] text-white/90 drop-shadow-[0_1px_5px_rgba(0,0,0,0.55)]">
                  Aqui nada é obrigatório. Tudo é convite.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 md:space-y-9 pb-10">
            {/* PAINEL PRINCIPAL — CASULO DE CUIDADO */}
            <div
              className="
                rounded-[30px]
                bg-white/12
                border border-white/40
                backdrop-blur-2xl
                shadow-[0_26px_70px_rgba(184,35,107,0.35)]
                p-4.5 md:p-6
                space-y-7 md:space-y-8
              "
            >
              {/* SEÇÃO 1 — MEU RITMO HOJE */}
              <section id="ritmo">
                <Reveal>
                  <SoftCard
                    className="
                      rounded-[24px]
                      bg-white/96
                      border border-[#f5d7e5]
                      shadow-[0_18px_40px_rgba(184,35,107,0.14)]
                      px-5.5 py-5.5 md:px-7 md:py-7
                      space-y-5
                    "
                  >
                    <div className="flex items-start gap-3.5 md:gap-4">
                      <div
                        className="
                          h-11 w-11 md:h-12 md:w-12
                          rounded-full
                          bg-[#ffe1f1]
                          flex items-center justify-center
                          shrink-0
                          shadow-[0_10px_22px_rgba(184,35,107,0.23)]
                        "
                      >
                        <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Meu ritmo hoje
                        </span>
                        <h2 className="text-[17px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                          Como você está chegando neste dia?
                        </h2>
                        <p className="text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed">
                          Sem certo ou errado. Só um check-in honesto e gentil com você mesma, do jeito que der.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-1">
                      <LineTile
                        tag="energia"
                        label="Tô bem, só cansada"
                        subtitle="Hoje eu preciso de pausas, não de cobrança."
                      />
                      <LineTile
                        tag="emoção"
                        label="Mais sensível do que o normal"
                        subtitle="Tudo bem sentir mais. Acolher é mais importante do que esconder."
                      />
                      <LineTile
                        tag="foco"
                        label="Quero fazer as coisas andarem"
                        subtitle="Um passo de cada vez, respeitando o meu ritmo."
                      />
                      <LineTile
                        tag="leveza"
                        label="Só quero suavizar o dia"
                        subtitle="Coisas simples, sem metas impossíveis."
                      />
                    </div>

                    <p className="text-[12px] text-[#a0a0a0] leading-relaxed pt-1">
                      Nada aqui fica registrado automaticamente. Este espaço existe para te lembrar de olhar para você
                      com carinho, não com exigência.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 2 — MINI ROTINA DE AUTOCUIDADO */}
              <section id="mini-rotina">
                <Reveal>
                  <SoftCard
                    className="
                      rounded-[24px]
                      bg-white/96
                      border border-[#f5d7e5]
                      shadow-[0_18px_40px_rgba(184,35,107,0.14)]
                      px-5.5 py-5.5 md:px-7 md:py-7
                      space-y-5
                    "
                  >
                    <div className="flex items-start gap-3.5 md:gap-4">
                      <div
                        className="
                          h-11 w-11 md:h-12 md:w-12
                          rounded-full
                          bg-[#ffe1f1]
                          flex items-center justify-center
                          shrink-0
                          shadow-[0_10px_22px_rgba(184,35,107,0.23)]
                        "
                      >
                        <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Mini rotina de autocuidado
                        </span>
                        <h2 className="text-[17px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                          Cuidados que cabem em 3–5 minutos
                        </h2>
                        <p className="text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed">
                          Você não precisa de uma manhã perfeita de spa. Precisa de pequenos gestos possíveis, no meio do que já existe.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-1">
                      <LineTile
                        tag="corpo"
                        label="Alongar por 2 minutos"
                        subtitle="Pescoço, ombros, costas — só para avisar ao corpo que você está lembrando dele."
                      />
                      <LineTile
                        tag="água"
                        label="Um copo de água com presença"
                        subtitle="Beber devagar, sentindo temperatura, sabor e o caminho pelo corpo."
                      />
                      <LineTile
                        tag="cuidado"
                        label="Um pequeno cuidado de pele"
                        subtitle="Passar um creme nas mãos ou no rosto, com atenção ao toque."
                      />
                      <LineTile
                        tag="janela"
                        label="Olhar pela janela por alguns instantes"
                        subtitle="Notar o céu, as cores, o som lá fora. Mesmo que por pouco tempo."
                      />
                    </div>

                    <p className="text-[12px] text-[#a0a0a0] leading-relaxed pt-1">
                      Escolha o que cabe hoje. Se for um gesto só, ele já vale. Não é uma lista de metas, é um menu
                      de possibilidades.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 3 — PAUSAS RÁPIDAS */}
              <section id="pausas">
                <Reveal>
                  <SoftCard
                    className="
                      rounded-[24px]
                      bg-white/96
                      border border-[#f5d7e5]
                      shadow-[0_18px_40px_rgba(184,35,107,0.14)]
                      px-5.5 py-5.5 md:px-7 md:py-7
                      space-y-5
                    "
                  >
                    <div className="flex items-start gap-3.5 md:gap-4">
                      <div
                        className="
                          h-11 w-11 md:h-12 md:w-12
                          rounded-full
                          bg-[#ffe1f1]
                          flex items-center justify-center
                          shrink-0
                          shadow-[0_10px_22px_rgba(184,35,107,0.23)]
                        "
                      >
                        <AppIcon name="pause" size={22} className="text-[#fd2597]" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Pausas rápidas
                        </span>
                        <h2 className="text-[17px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                          Respiros que cabem entre um “mãe!” e outro
                        </h2>
                        <p className="text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed">
                          Micropausas que não dependem de silêncio absoluto nem de tempo livre demais.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-1">
                      <LineTile
                        tag="1 minuto"
                        label="Respirar 4–4–4"
                        subtitle="Inspira em 4 tempos, segura 4, solta em 4. Fazer isso 3 vezes já muda algo."
                      />
                      <LineTile
                        tag="1 minuto"
                        label="Soltar os ombros"
                        subtitle="Inspirar subindo os ombros, soltar na exalação, como se deixasse um peso cair."
                      />
                      <LineTile
                        tag="pausa mental"
                        label="Nomear 3 coisas boas de hoje"
                        subtitle="Podem ser pequenas: um café quente, uma mensagem, um sorriso."
                      />
                      <LineTile
                        tag="acolhimento"
                        label="Um autoabraço rápido"
                        subtitle="Cruzar os braços sobre o peito, respirar fundo e se segurar por alguns segundos."
                      />
                    </div>

                    <p className="text-[12px] text-[#a0a0a0] leading-relaxed pt-1">
                      Você não precisa marcar tempo, nem registrar nada. Essas pausas existem para lembrar o seu corpo
                      de que ele também precisa ser cuidado.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 4 — PARA VOCÊ HOJE */}
              <section id="para-voce">
                <Reveal>
                  <SoftCard
                    className="
                      rounded-[24px]
                      bg-white/96
                      border border-[#f5d7e5]
                      shadow-[0_18px_40px_rgba(184,35,107,0.14)]
                      px-5.5 py-5.5 md:px-7 md:py-7
                      space-y-5
                    "
                  >
                    <div className="flex items-start gap-3.5 md:gap-4">
                      <div
                        className="
                          h-11 w-11 md:h-12 md:w-12
                          rounded-full
                          bg-[#ffe1f1]
                          flex items-center justify-center
                          shrink-0
                          shadow-[0_10px_22px_rgba(184,35,107,0.23)]
                        "
                      >
                        <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                      </div>

                      <div className="space-y-1.5">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3.5 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Para você hoje
                        </span>
                        <h2 className="text-[17px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                          Um gesto simbólico só seu
                        </h2>
                        <p className="text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed">
                          Não é recompensa por desempenho. É um lembrete de que você importa agora, não só quando “der conta de tudo”.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-1">
                      <LineTile
                        tag="desligar"
                        label="Guardar o celular por alguns minutos"
                        subtitle="Colocar longe do alcance por um tempinho e deixar o cérebro respirar."
                      />
                      <LineTile
                        tag="música"
                        label="Ouvir uma música que você ama"
                        subtitle="Do começo ao fim, se possível. Se não der, um trecho já aquece."
                      />
                      <LineTile
                        tag="palavra"
                        label="Escrever uma frase para si mesma"
                        subtitle="Como você falaria com uma amiga querida que estivesse vivendo o seu dia?"
                      />
                      <LineTile
                        tag="ritual"
                        label="Escolher um pequeno ritual de encerramento do dia"
                        subtitle="Um chá, um banho mais consciente, uma vela, uma prece silenciosa."
                      />
                    </div>

                    <p className="text-[12px] text-[#a0a0a0] leading-relaxed pt-1">
                      Você não precisa “merecer” esse gesto. Ele não depende de performance. Ele existe porque você é
                      humana, mãe e merece cuidado — inclusive nos dias em que sente que não fez o suficiente.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>
            </div>

            <div className="mt-6">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
