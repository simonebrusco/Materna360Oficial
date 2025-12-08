// app/(tabs)/maternar/Client.tsx
'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
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
      className="
        min-h-[100dvh]
        pb-32
        maternar-hub-bg
      "
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

            <MotivationalFooter routeKey="maternar-minha-jornada" />

          {/* RODAPÉ LEGAL — sempre encostado na parte de baixo do degradê */}
      <footer
        className="
          w-full
          text-center
          pt-4
          pb-2
          px-4
          text-[11px]
          md:text-[12px]
          leading-relaxed
          text-[#6A6A6A]/85
        "
      >
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  );
}
