'use client'

import { Reveal } from '@/components/ui/Reveal'

import ProfessionalsSectionClient from './ProfessionalsSectionClient'

export default function ProfessionalsSection() {
  return (
    <section className="space-y-8" aria-labelledby="professionals-support-title">
      <Reveal>
        <div className="space-y-2">
          <span className="section-eyebrow">Rede Materna</span>
          <h2 id="professionals-support-title" className="section-title">
            Profissionais de Apoio
          </h2>
          <p className="section-subtitle max-w-2xl text-support-2">
            Use os filtros para encontrar especialistas em formato online que combinam com as necessidades da sua família.
          </p>
        </div>
      </Reveal>

      <ProfessionalsSectionClient />
    </section>
  )
}

export { ProfessionalsSection }
