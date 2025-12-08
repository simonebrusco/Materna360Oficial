'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import CardHub from '@/components/maternar/CardHub'
import LegalFooter from '@/components/common/LegalFooter'

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
      className="min-h-[100dvh] pb-32 bg-[#FFE4F0] bg-[radial-gradient(circle_at_top_left,#F2C3EA_0,#FF78B3_30%,#FF9BC8_60%,#FFB3D8_82%,#FFE4F0_100%)]"
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                  MATERNAR · HUB PRINCIPAL
                </span>

                <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  Maternar
                </h1>

                <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                  Aqui é o seu ponto de partida no Materna360: um lugar para
                  cuidar de você, do seu filho e da sua jornada, com tudo o que
                  você precisa em um só lugar.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-8 md:space-y-10 pb-6">
            {/* GRID NOVO DE PASTAS (CARDS TRANSLÚCIDOS 2x2) */}
            <Reveal>
              <CardHub />
            </Reveal>

            {/* Rodapé legal padrão do Materna360 */}
            <div className="mt-6">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
