'use client'

import * as React from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MiniTileProps = {
  label: string
  subtitle?: string
  tag?: string
}

/**
 * Mini card modular estilo "soundboard" — botões de autocuidado.
 * Não persiste nada ainda, é só UI premium / navegação leve.
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
                Cuidar de Mim
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Pequenos gestos de autocuidado que cabem no seu dia, sem culpa e sem pressão.
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
              {/* SEÇÃO 1 — MEU RITMO HOJE */}
              <section id="ritmo">
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
                          Meu ritmo hoje
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Como você está chegando neste dia?
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Sem certo ou errado. Só um check-in honesto e gentil com você mesma.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="energia"
                        label="Tô bem, só cansada"
                        subtitle="Preciso de pausas, não de cobrança."
                      />
                      <MiniTile
                        tag="emoção"
                        label="Mais sensível hoje"
                        subtitle="Tudo bem sentir mais. Vamos com calma."
                      />
                      <MiniTile
                        tag="modo foco"
                        label="Quero ser produtiva"
                        subtitle="Um passo de cada vez, com leveza."
                      />
                      <MiniTile
                        tag="leveza"
                        label="Só quero suavizar o dia"
                        subtitle="Coisas simples, sem grandes expectativas."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Este espaço não registra nada automaticamente. Ele existe para te lembrar
                      de olhar para você com carinho, não com cobrança.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 2 — MINI ROTINA DE AUTOCUIDADO */}
              <section id="mini-rotina">
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
                          Mini rotina de autocuidado
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Cuidados que cabem em 3–5 minutos
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Você não precisa de uma hora perfeita. Precisa de pequenos gestos possíveis.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="corpo"
                        label="Alongar por 2 minutos"
                        subtitle="Pescoço, ombros, respiração profunda."
                      />
                      <MiniTile
                        tag="água"
                        label="Um copo de água com pausa"
                        subtitle="Beber devagar, sentindo o momento."
                      />
                      <MiniTile
                        tag="cuidado"
                        label="Pequeno cuidado pessoal"
                        subtitle="Hidratar as mãos, rosto, lábios."
                      />
                      <MiniTile
                        tag="presença"
                        label="Olhar pela janela"
                        subtitle="Respirar fundo e notar o que vê."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0]">
                      Escolha um gesto possível. Se der para fazer mais de um, ótimo. Se der para fazer só um,
                      ele já conta — e muito.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 3 — PAUSAS RÁPIDAS */}
              <section id="pausas">
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
                        <AppIcon name="pause" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Pausas rápidas
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Respiros que cabem entre um “mãe!” e outro
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Pausas curtas, possíveis mesmo em dias caóticos.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="1 minuto"
                        label="Respirar 4–4–4"
                        subtitle="Inspira em 4, segura 4, solta em 4."
                      />
                      <MiniTile
                        tag="1 minuto"
                        label="Soltar os ombros"
                        subtitle="Inspira, sobe os ombros, solta na exalação."
                      />
                      <MiniTile
                        tag="pausa mental"
                        label="Nomear 3 coisas boas"
                        subtitle="Coisas simples que já aconteceram hoje."
                      />
                      <MiniTile
                        tag="acochego"
                        label="Autoabraço rápido"
                        subtitle="Abraçar os próprios ombros e respirar."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0]">
                      Você pode usar estas pausas como lembretes internos: não precisa marcar, medir
                      ou registrar nada. É só para te lembrar que você também merece respiro.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 4 — PARA VOCÊ HOJE */}
              <section id="para-voce">
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
                          Para você hoje
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Um gesto simbólico só seu
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não é recompensa por desempenho. É um lembrete de que você importa agora, não só
                          quando “der conta de tudo”.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="gesto"
                        label="Guardar o celular por 5 minutos"
                        subtitle="Só você, sua respiração e o silêncio possível."
                      />
                      <MiniTile
                        tag="carinho"
                        label="Ouvir uma música que você ama"
                        subtitle="Nem que seja só um pedaço."
                      />
                      <MiniTile
                        tag="presença"
                        label="Escrever uma frase para si mesma"
                        subtitle="Como você falaria com uma amiga querida?"
                      />
                      <MiniTile
                        tag="encerramento"
                        label="Escolher um pequeno ritual da noite"
                        subtitle="Um chá, um banho mais consciente, uma vela."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Você não precisa &quot;ganhar&quot; esse gesto. Ele não depende de performance.
                      Ele existe porque você é humana, mãe e merece cuidado — mesmo nos dias em que sente
                      que não fez o suficiente.
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
