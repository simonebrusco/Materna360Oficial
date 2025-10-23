'use client'

import React from 'react'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import type { Professional } from '@/app/types/professionals'
import { Reveal } from '@/components/ui/Reveal'

import { ProfessionalsSectionClient } from './ProfessionalsSectionClient'

type ProfessionalsSectionProps = {
  professionals?: Professional[]
  initialProfessionalId?: string
}

function ProfessionalsSection({ professionals = PROFESSIONALS_MOCK, initialProfessionalId }: ProfessionalsSectionProps) {
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

      <ProfessionalsSectionClient professionals={professionals} initialOpenId={initialProfessionalId} />
    </section>
  )
}

export default ProfessionalsSection
export { ProfessionalsSection }
