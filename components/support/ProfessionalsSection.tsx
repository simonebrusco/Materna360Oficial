'use client'

import React, { useMemo } from 'react'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import type { Professional } from '@/app/types/professionals'
import { Reveal } from '@/components/ui/Reveal'

import { ProfessionalsSectionClient } from './ProfessionalsSectionClient'

type ProfessionalsSectionProps = {
  professionals?: Professional[]
  initialProfessionalId?: string
}

const normalizeProfessionals = (input: unknown): Professional[] => {
  if (!Array.isArray(input)) {
    return []
  }
  return input.filter((item): item is Professional => typeof item === 'object' && item !== null && 'id' in item && 'name' in item)
}

const EmptyState = () => (
  <div className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-soft">
    <h3 className="text-base font-semibold text-support-1">Profissionais de apoio</h3>
    <p className="mt-2 text-sm text-support-2/80">
      Em breve adicionaremos especialistas verificados para acompanhar você.
    </p>
  </div>
)

function ProfessionalsSection({ professionals, initialProfessionalId }: ProfessionalsSectionProps) {
  const safeProfessionals = useMemo(() => {
    const fromProps = normalizeProfessionals(professionals)
    if (fromProps.length > 0) {
      return fromProps
    }

    try {
      const fromGlobal = normalizeProfessionals((globalThis as { __pros?: unknown }).__pros)
      if (fromGlobal.length > 0) {
        return fromGlobal
      }
    } catch (error) {
      console.warn('[ProfessionalsSection] Falha ao normalizar dados globais:', error)
    }

    return normalizeProfessionals(PROFESSIONALS_MOCK)
  }, [professionals])

  if (safeProfessionals.length === 0) {
    return <EmptyState />
  }

  return (
    <section className="space-y-8" aria-labelledby="professionals-support-title">
      <Reveal>
        <div className="space-y-2">
          <span className="section-eyebrow">Rede Materna</span>
          <h2 id="professionals-support-title" className="section-title">
            Profissionais de Apoio
          </h2>
          <p className="section-subtitle max-w-2xl text-support-2">
            Encontre especialistas confiáveis para cuidar de você e da sua família.
          </p>
        </div>
      </Reveal>

      <ProfessionalsSectionClient professionals={safeProfessionals} initialOpenId={initialProfessionalId} />
    </section>
  )
}

export default ProfessionalsSection
export { ProfessionalsSection }
