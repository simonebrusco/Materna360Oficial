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
 * Mini card modular estilo "soundboard" — botões de inspiração e leveza para o dia.
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

export default function MeuDiaLeveClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
        page: 'meu-dia-leve',
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
                Meu Dia Leve
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Frases, ideias rápidas e pequenos gestos para deixar o dia um pouco mais suave, do jeito que você consegue hoje.
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
              {/* SEÇÃO 1 — INSPIRAÇÃO DO DIA */}
              <section id="inspiracao">
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
                          Inspiração do dia
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Uma frase para te acompanhar hoje
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não é mantra nem obrigação. É um lembrete delicado para atravessar o dia.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <MiniTile
                        tag="frase"
                        label="“Hoje eu faço o possível, não o perfeito.”"
                        subtitle="E o possível já é muito."
                      />
                      <MiniTile
                        tag="frase"
                        label="“Eu também mereço pausas, não só tarefas.”"
                        subtitle="Lembrar disso ao longo do dia."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Você pode escolher uma dessas frases como sua âncora de hoje. Se quiser trocar ao longo do dia, tudo bem também.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 2 — IDEIAS RÁPIDAS */}
              <section id="ideias">
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
                          Ideias rápidas
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Pequenas coisas que cabem entre um compromisso e outro
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Nada grandioso. Apenas ideias de 3–10 minutos para encaixar quando surgir um espacinho.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="3 min"
                        label="Respirar na varanda ou na janela"
                        subtitle="Olhar para fora e respirar fundo algumas vezes."
                      />
                      <MiniTile
                        tag="5 min"
                        label="Arrumar só um cantinho"
                        subtitle="Uma bancada, uma mesa — não a casa toda."
                      />
                      <MiniTile
                        tag="5 min"
                        label="Mandar uma mensagem carinhosa"
                        subtitle="Para alguém que te apoia ou te faz bem."
                      />
                      <MiniTile
                        tag="10 min"
                        label="Colocar uma música gostosa"
                        subtitle="Enquanto faz algo que já precisa fazer."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0]">
                      Você não precisa fazer todas. Pode escolher uma por período do dia ou só aquela que fizer sentido agora.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 3 — RECEITAS RÁPIDAS */}
              <section id="receitas">
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
                          Receitas rápidas
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Coisas simples para quando falta tempo e sobra cansaço
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Ideias de comida prática, sem medida exata, sem perfeccionismo de foto de rede social.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="café da manhã"
                        label="Iogurte com fruta picada e granola"
                        subtitle="Montar em 3 min com o que tiver em casa."
                      />
                      <MiniTile
                        tag="almoço rápido"
                        label="Arroz já pronto + ovo mexido + legume simples"
                        subtitle="Nada elaborado, mas alimenta e resolve."
                      />
                      <MiniTile
                        tag="lanche"
                        label="Pão, queijo e fruta"
                        subtitle="Simples e possível para um dia corrido."
                      />
                      <MiniTile
                        tag="noite"
                        label="Sopa ou caldo já pronto"
                        subtitle="Esquentar, montar prato bonito e respirar."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Aqui não é espaço de cardápio perfeito. É um lembrete de que comida simples também é cuidado —
                      com você e com a família.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 4 — PASSO LEVE DO DIA */}
              <section id="passo-leve">
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
                          Passo leve do dia
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Se der pra escolher uma coisa só hoje…
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          É aqui que você pode decidir qual será o “próximo pequeno passo” que faz sentido para o seu momento.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <MiniTile
                        tag="casa"
                        label="Organizar só um ponto da casa"
                        subtitle="Uma gaveta, uma prateleira, uma bancada."
                      />
                      <MiniTile
                        tag="você"
                        label="Proteger 10–15 minutos só seus"
                        subtitle="Para ler, ouvir algo, descansar ou ficar em silêncio."
                      />
                      <MiniTile
                        tag="filho"
                        label="Garantir um momento de conexão com seu filho"
                        subtitle="Cinco minutos intencionais, do jeito que der."
                      />
                      <MiniTile
                        tag="descanso"
                        label="Ir dormir um pouco antes do que o habitual"
                        subtitle="Mesmo que não consiga muito, alguns minutos já ajudam."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      O passo leve do dia não é uma meta rígida. É um combinado gentil com você mesma —
                      que pode ser reajustado se o dia sair do controle (e tudo bem se sair).
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
