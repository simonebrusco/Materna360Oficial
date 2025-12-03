'use client'

import { useEffect } from 'react'
import { track } from '@/app/lib/telemetry'
import { PageTemplate } from '@/components/common/PageTemplate'
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
      // telemetria nunca deve quebrar a página
    }
  }, [])

  return (
    <PageTemplate
      label="MATERNAR"
      title="Maternar"
      subtitle="Seu hub principal para cuidar de você, do seu filho e da sua jornada, com tudo o que precisa em um só lugar."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8 md:space-y-10 pb-8">
          <Reveal>
            <section
              aria-label="Hub principal do Maternar"
              className="space-y-4 md:space-y-6"
            >
              {/* Selo suave de contexto */}
              <div className="inline-flex items-center rounded-full border border-[var(--color-soft-strong)] bg-white/80 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-[var(--color-brand)] uppercase">
                Hub principal
              </div>

              {/* Grid de pastas / cards do Maternar */}
              <CardHub />
            </section>
          </Reveal>

          <MotivationalFooter routeKey="maternar-minha-jornada" />

          {/* Rodapé legal global */}
          <div className="mt-2 md:mt-4">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
