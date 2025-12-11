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
 * Mini card modular estilo "soundboard" — botões leves para ações com o filho.
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

export default function MeuFilhoClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
        page: 'meu-filho',
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
                Meu Filho
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Ideias, brincadeiras e gestos de conexão para viver o dia com mais presença, sem perfeição.
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
              {/* SEÇÃO 1 — BRINCADEIRAS DO DIA */}
              <section id="brincadeiras">
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
                        <AppIcon name="toy" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Brincadeiras do dia
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Ideias simples para brincar hoje
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Sem grandes produções. Brincadeiras que cabem entre uma coisa e outra.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="rápido"
                        label="Caça aos tesouros da casa"
                        subtitle="Escolham 3 coisas para encontrar juntos."
                      />
                      <MiniTile
                        tag="conexão"
                        label="Desenho espelhado"
                        subtitle="Você faz um traço, ele imita, e assim vão criando juntos."
                      />
                      <MiniTile
                        tag="movimento"
                        label="Caminho de almofadas"
                        subtitle="Montar um pequeno percurso para atravessar a sala."
                      />
                      <MiniTile
                        tag="calminho"
                        label="História inventada a dois"
                        subtitle="Cada um fala uma frase e a história vai nascendo."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Você não precisa brincar por horas. Às vezes, 10 minutos de presença valem mais
                      do que uma tarde inteira tentando dar conta de tudo ao mesmo tempo.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 2 — DESENVOLVIMENTO POR FASE */}
              <section id="desenvolvimento">
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
                        <AppIcon name="child" size={22} className="text-[#fd2597]" />
                      </div>
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                          Desenvolvimento por fase
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          O que costuma aparecer em cada fase
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não é diagnóstico, não é regra. São pistas suaves para te ajudar a entender melhor o momento do seu filho.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="0–2 anos"
                        label="Explorar com os sentidos"
                        subtitle="Texturas, sons, cores — tudo é descoberta."
                      />
                      <MiniTile
                        tag="3–4 anos"
                        label="Faz de conta em alta"
                        subtitle="Brincar de casinha, super-herói, cozinhar de mentira."
                      />
                      <MiniTile
                        tag="5–6 anos"
                        label="Perguntas sem fim"
                        subtitle="Curiosidade sobre tudo, vontade de entender o mundo."
                      />
                      <MiniTile
                        tag="+6 anos"
                        label="Mais autonomia, mais opinião"
                        subtitle="Ele quer testar limites, escolher coisas, se afirmar."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Cada criança tem seu ritmo. Este painel existe para te lembrar que fases trazem
                      desafios e potências — e que você não precisa comparar seu filho com ninguém.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 3 — ROTINA LEVE DA CRIANÇA */}
              <section id="rotina">
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
                          Rotina leve da criança
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Pequenos ajustes que ajudam o dia a fluir
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Não é uma rotina perfeita. É uma rotina possível, do jeito que a sua família consegue.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="manhã"
                        label="Um mini ritual para acordar"
                        subtitle="Um abraço, uma música, uma frase que se repete todo dia."
                      />
                      <MiniTile
                        tag="transições"
                        label="Avisos antes de mudar de atividade"
                        subtitle="“Daqui 5 min vamos guardar os brinquedos, tá bom?”"
                      />
                      <MiniTile
                        tag="energia"
                        label="Janela de movimento"
                        subtitle="Um momento do dia para correr, pular, gastar energia."
                      />
                      <MiniTile
                        tag="noite"
                        label="Sinal de desacelerar"
                        subtitle="Diminuir estímulos, trocar luz forte por luz mais suave."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Não tem problema se a rotina sair do script. O objetivo aqui é ter alguns pontos
                      de apoio ao longo do dia, não um manual rígido.
                    </p>
                  </SoftCard>
                </Reveal>
              </section>

              {/* SEÇÃO 4 — GESTOS DE CONEXÃO */}
              <section id="conexao">
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
                          Gestos de conexão
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Pequenas coisas que dizem “eu tô aqui”
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Nada mirabolante. Só formas simples de ele sentir que é visto e importante.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MiniTile
                        tag="olhar"
                        label="Olhar nos olhos por alguns segundos"
                        subtitle="Sem tela, sem pressa, só presença."
                      />
                      <MiniTile
                        tag="toque"
                        label="Um abraço mais demorado"
                        subtitle="Respirar junto por alguns instantes."
                      />
                      <MiniTile
                        tag="fala"
                        label="Dizer algo específico que admira nele"
                        subtitle="“Eu adoro quando você…”"
                      />
                      <MiniTile
                        tag="tempo"
                        label="5 minutos só de vocês dois"
                        subtitle="Pode ser no sofá, na cozinha, onde der."
                      />
                    </div>

                    <p className="mt-4 text-[12px] text-[#a0a0a0] leading-relaxed">
                      Conexão não é sobre grandes planos. É sobre pequenos momentos repetidos, do jeito
                      que a sua realidade permite.
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
