'use client'

import * as React from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { Button } from '@/components/ui/Button'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MiniTileProps = {
  label: string
  href: string
  tag?: string
}

/**
 * Mini card estilo "soundboard" — usado dentro das seções do Maternar.
 */
function MiniTile({ label, href, tag }: MiniTileProps) {
  return (
    <Link
      href={href}
      className="
        block rounded-2xl
        bg-white/90 hover:bg-white
        border border-[#f5d7e5]
        shadow-[0_4px_12px_rgba(184,35,107,0.08)]
        px-3.5 py-3.5
        transition
        hover:-translate-y-0.5
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#fd2597]/70
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
      </div>
    </Link>
  )
}

type TrailStepProps = {
  index: number
  titleForA11y: string
  children: React.ReactNode
}

/**
 * Wrapper visual para transformar a sequência em "trilha" (sem aparência de blocos empilhados).
 * - Marcador numerado + linha conectora sutil
 * - Mantém o card como protagonista
 */
function TrailStep({ index, titleForA11y, children }: TrailStepProps) {
  const isLast = index === 4

  return (
    <div className="relative pl-14 md:pl-16">
      {/* Linha vertical (conector) */}
      <div
        aria-hidden="true"
        className={`
          absolute left-[18px] md:left-[20px] top-3
          w-[2px]
          ${isLast ? 'h-[28px]' : 'h-full'}
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(253,37,151,0.22),rgba(255,255,255,0))]
          rounded-full
        `}
      />

      {/* Marcador numerado */}
      <div
        aria-label={titleForA11y}
        className="
          absolute left-0 top-0
          h-10 w-10 md:h-11 md:w-11
          rounded-full
          bg-white/90
          border border-white/60
          shadow-[0_10px_26px_rgba(184,35,107,0.18)]
          flex items-center justify-center
          backdrop-blur
        "
      >
        <span className="text-[13px] md:text-[14px] font-extrabold text-[#b8236b]">
          {index}
        </span>
      </div>

      {children}
    </div>
  )
}

export default function MaternarClient() {
  useEffect(() => {
    try {
      track('nav.click', {
        tab: 'maternar',
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
              <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Maternar
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                O seu espaço de acolhimento, leveza e apoio — para cuidar de você, do seu filho e da sua jornada.
              </p>

              <p className="text-sm md:text-[15px] text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)] mt-1">
                Por onde você quer começar hoje?
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* PAINEL PRINCIPAL — TRILHA GUIADA */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
              "
            >
              {/* Cabeçalho da trilha */}
              <div className="mb-5 md:mb-6">
                <span className="inline-flex items-center rounded-full bg-white/20 border border-white/35 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/95">
                  Trilha do dia
                </span>
                <p className="mt-2 text-[13px] md:text-[14px] text-white/90 leading-relaxed">
                  Siga no seu ritmo. Tudo aqui foi pensado para caber no cotidiano, sem cobrança.
                </p>
              </div>

              <div className="space-y-5 md:space-y-6">
                {/* 1 — CUIDAR DE MIM */}
                <Reveal>
                  <TrailStep index={1} titleForA11y="Etapa 1: Cuidar de Mim">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                        space-y-3
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Para você
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">
                            Cuidar de Mim
                          </h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Leve · 3–5 minutos · foco em você
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-[#545454] leading-relaxed">
                        Seu espaço de acolhimento, autocuidado e pausas que cabem no seu dia.
                      </p>

                      {/* Mini cards (enxuto) */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniTile
                          label="Meu ritmo hoje"
                          href="/maternar/cuidar-de-mim#ritmo"
                          tag="check-in"
                        />
                        <MiniTile
                          label="Pausas rápidas"
                          href="/maternar/cuidar-de-mim#pausas"
                          tag="respirar"
                        />
                      </div>

                      <div className="mt-4 pt-1">
                        <Link href="/maternar/cuidar-de-mim">
                          <Button className="w-full md:w-auto px-6">
                            Ver tudo de Cuidar de Mim
                          </Button>
                        </Link>
                      </div>
                    </SoftCard>
                  </TrailStep>
                </Reveal>

                {/* 2 — MEU FILHO */}
                <Reveal>
                  <TrailStep index={2} titleForA11y="Etapa 2: Meu Filho">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                        space-y-3
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="child" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Para o seu filho
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">
                            Meu Filho
                          </h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Brincadeiras · conexão · desenvolvimento leve
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-[#545454] leading-relaxed">
                        Ideias, brincadeiras e apoio leve para o desenvolvimento do seu pequeno.
                      </p>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniTile
                          label="Brincadeiras do dia"
                          href="/maternar/meu-filho#brincadeiras"
                          tag="ideias"
                        />
                        <MiniTile
                          label="Gestos de conexão"
                          href="/maternar/meu-filho#conexao"
                          tag="vínculo"
                        />
                      </div>

                      <div className="mt-4 pt-1">
                        <Link href="/maternar/meu-filho">
                          <Button className="w-full md:w-auto px-6">
                            Ver tudo de Meu Filho
                          </Button>
                        </Link>
                      </div>
                    </SoftCard>
                  </TrailStep>
                </Reveal>

                {/* 3 — MEU DIA LEVE */}
                <Reveal>
                  <TrailStep index={3} titleForA11y="Etapa 3: Meu Dia Leve">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                        space-y-3
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="sun" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Para o seu dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">
                            Meu Dia Leve
                          </h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Inspirações · ideias rápidas · leveza
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-[#545454] leading-relaxed">
                        Frases, ideias rápidas e sugestões para tornar o dia mais leve.
                      </p>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniTile
                          label="Inspiração do dia"
                          href="/maternar/meu-dia-leve#inspiracao"
                          tag="frase"
                        />
                        <MiniTile
                          label="Ideias rápidas"
                          href="/maternar/meu-dia-leve#ideias"
                          tag="rápido"
                        />
                      </div>

                      <div className="mt-4 pt-1">
                        <Link href="/maternar/meu-dia-leve">
                          <Button className="w-full md:w-auto px-6">
                            Ver tudo de Meu Dia Leve
                          </Button>
                        </Link>
                      </div>
                    </SoftCard>
                  </TrailStep>
                </Reveal>

                {/* 4 — MINHA JORNADA */}
                <Reveal>
                  <TrailStep index={4} titleForA11y="Etapa 4: Minha Jornada">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                        space-y-3
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="star" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Sua caminhada
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">
                            Minha Jornada
                          </h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Conquistas · símbolos · progresso gentil
                          </p>
                        </div>
                      </div>

                      <p className="text-[15px] text-[#545454] leading-relaxed">
                        Acompanhe seu progresso com leveza, no seu tempo.
                      </p>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <MiniTile
                          label="Painel da jornada"
                          href="/maternar/minha-jornada#painel"
                          tag="visão geral"
                        />
                        <MiniTile
                          label="Missões do dia"
                          href="/maternar/minha-jornada#missoes"
                          tag="pequenos passos"
                        />
                      </div>

                      <div className="mt-4 pt-1">
                        <Link href="/maternar/minha-jornada">
                          <Button className="w-full md:w-auto px-6">
                            Ver tudo de Minha Jornada
                          </Button>
                        </Link>
                      </div>
                    </SoftCard>
                  </TrailStep>
                </Reveal>
              </div>
            </div>

            {/* BLOCO FINAL: Mais ferramentas (rotas reais, menos ruído) */}
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-2xl
                  bg-white/98
                  border border-[#f5d7e5]
                  shadow-[0_10px_26px_rgba(184,35,107,0.12)]
                  space-y-4
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                    <AppIcon name="grid" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                      Mais ferramentas
                    </span>
                    <h2 className="text-lg font-semibold text-[#2f3a56]">
                      Outros espaços do Maternar
                    </h2>
                    <p className="text-[15px] text-[#545454] leading-relaxed">
                      Acesse quando fizer sentido, sem pesar seu começo do dia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <Link href="/maternar/biblioteca-materna">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Biblioteca Materna
                    </Button>
                  </Link>

                  <Link href="/maternar/ferramentas/ajuda-e-parcerias">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Ajuda & Parcerias
                    </Button>
                  </Link>

                  <Link href="/maternar/minhas-conquistas">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Minhas Conquistas
                    </Button>
                  </Link>

                  <Link href="/maternar/materna-plus">
                    <Button className="w-full text-[12px] md:text-[13px]">
                      Materna+
                    </Button>
                  </Link>

                  <Link href="/maternar/materna-plus/maternabox">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      MaternaBox
                    </Button>
                  </Link>

                  <Link href="/planos">
                    <Button variant="secondary" className="w-full text-[12px] md:text-[13px]">
                      Planos
                    </Button>
                  </Link>
                </div>
              </SoftCard>
            </Reveal>

            <div className="mt-8">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
