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
            {/* PAINEL TRANSLÚCIDO DOS 4 BLOCOS PRINCIPAIS */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-5
                space-y-6 md:space-y-7
              "
            >
              {/* BLOCO: Cuidar de Mim */}
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

                  <div className="pt-1">
                    <Link href="/maternar/cuidar-de-mim">
                      <Button className="w-full md:w-auto px-6">Entrar</Button>
                    </Link>
                  </div>
                </SoftCard>
              </Reveal>

              {/* BLOCO: Meu Filho */}
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

                  <div className="pt-1">
                    <Link href="/maternar/meu-filho">
                      <Button className="w-full md:w-auto px-6">Entrar</Button>
                    </Link>
                  </div>
                </SoftCard>
              </Reveal>

              {/* BLOCO: Meu Dia Leve */}
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

                  <div className="pt-1">
                    <Link href="/maternar/meu-dia-leve">
                      <Button className="w-full md:w-auto px-6">Entrar</Button>
                    </Link>
                  </div>
                </SoftCard>
              </Reveal>

              {/* BLOCO: Minha Jornada */}
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

                  <div className="pt-1">
                    <Link href="/maternar/minha-jornada">
                      <Button className="w-full md:w-auto px-6">Entrar</Button>
                    </Link>
                  </div>
                </SoftCard>
              </Reveal>
            </div>

            {/* BLOCO FINAL: Serviços Materna360 (fica fora do painel translúcido) */}
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
                      Serviços
                    </span>
                    <h2 className="text-lg font-semibold text-[#2f3a56]">
                      Serviços Materna360
                    </h2>
                    <p className="text-[15px] text-[#545454] leading-relaxed">
                      Tudo do Materna360 em um só lugar.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <Link href="/maternar/servicos/materna-plus">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      Materna+
                    </Button>
                  </Link>
                  <Link href="/maternar/servicos/materna-box">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      MaternaBox
                    </Button>
                  </Link>
                  <Link href="/maternar/servicos/biblioteca">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      Biblioteca
                    </Button>
                  </Link>
                  <Link href="/maternar/servicos/planos">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      Planos
                    </Button>
                  </Link>
                  <Link href="/maternar/servicos/parcerias">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      Parcerias
                    </Button>
                  </Link>
                  <Link href="/maternar/servicos/ajuda">
                    <Button
                      variant="secondary"
                      className="w-full text-[12px] md:text-[13px]"
                    >
                      Ajuda
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

