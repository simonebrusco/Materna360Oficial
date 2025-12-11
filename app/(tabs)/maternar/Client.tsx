'use client'

import * as React from 'react'
import { useEffect } from 'react'
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
  // tracking de navegação
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
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_26%,#fdbed7_56%,#ffe1f1_90%,#ffffff_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">

          {/* HERO */}
          <header className="pt-8 md:pt-10 mb-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Maternar
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                O seu espaço de acolhimento, leveza e apoio — para cuidar de você, do seu filho e da sua jornada.
              </p>
            </div>
          </header>

          {/* BLOCOS PRINCIPAIS – LAYOUT A PREMIUM */}
          <div className="space-y-8 md:space-y-10 pb-10">

            {/* BLOCO: Cuidar de Mim */}
            <Reveal>
              <SoftCard className="p-6 space-y-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AppIcon name="heart" size={28} className="text-pink-600" />
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Cuidar de Mim
                  </h2>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Seu espaço de acolhimento, autocuidado e pausas que cabem no seu dia.
                </p>

                <Button
                  href="/maternar/cuidar-de-mim"
                  className="w-full mt-2"
                >
                  Entrar
                </Button>
              </SoftCard>
            </Reveal>

            {/* BLOCO: Meu Filho */}
            <Reveal>
              <SoftCard className="p-6 space-y-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AppIcon name="child" size={28} className="text-pink-600" />
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Meu Filho
                  </h2>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Ideias, brincadeiras e apoio leve para o desenvolvimento do seu pequeno.
                </p>

                <Button
                  href="/maternar/meu-filho"
                  className="w-full mt-2"
                >
                  Entrar
                </Button>
              </SoftCard>
            </Reveal>

            {/* BLOCO: Meu Dia Leve */}
            <Reveal>
              <SoftCard className="p-6 space-y-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AppIcon name="sun" size={28} className="text-pink-600" />
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Meu Dia Leve
                  </h2>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Frases, ideias rápidas e sugestões para tornar o dia mais leve.
                </p>

                <Button
                  href="/maternar/meu-dia-leve"
                  className="w-full mt-2"
                >
                  Entrar
                </Button>
              </SoftCard>
            </Reveal>

            {/* BLOCO: Minha Jornada */}
            <Reveal>
              <SoftCard className="p-6 space-y-3 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AppIcon name="star" size={28} className="text-pink-600" />
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Minha Jornada
                  </h2>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Acompanhe seu progresso com leveza, no seu tempo.
                </p>

                <Button
                  href="/maternar/minha-jornada"
                  className="w-full mt-2"
                >
                  Entrar
                </Button>
              </SoftCard>
            </Reveal>

            {/* BLOCO FINAL: Serviços Materna360 */}
            <Reveal>
              <SoftCard className="p-6 space-y-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-1">
                  <AppIcon name="grid" size={28} className="text-pink-600" />
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Serviços Materna360
                  </h2>
                </div>

                <p className="text-[15px] text-[#545454] leading-relaxed">
                  Tudo do Materna360 em um só lugar.
                </p>

                {/* GRID 2x3 */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <Button href="/maternar/servicos/materna-plus" variant="secondary">
                    Materna+
                  </Button>
                  <Button href="/maternar/servicos/materna-box" variant="secondary">
                    MaternaBox
                  </Button>
                  <Button href="/maternar/servicos/biblioteca" variant="secondary">
                    Biblioteca
                  </Button>
                  <Button href="/maternar/servicos/planos" variant="secondary">
                    Planos
                  </Button>
                  <Button href="/maternar/servicos/parcerias" variant="secondary">
                    Parcerias
                  </Button>
                  <Button href="/maternar/servicos/ajuda" variant="secondary">
                    Ajuda
                  </Button>
                </div>
              </SoftCard>
            </Reveal>

            {/* Rodapé legal padrão */}
            <div className="mt-8">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
