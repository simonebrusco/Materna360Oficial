import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import type { Professional } from '@/app/types/professionals'
import { Reveal } from '@/components/ui/Reveal'

import { ProfessionalsSectionClient } from './ProfessionalsSectionClient'

type ProfessionalsSectionProps = {
  professionals?: Professional[]
  initialProfessionalId?: string
}

export function ProfessionalsSection({ professionals = PROFESSIONALS_MOCK, initialProfessionalId }: ProfessionalsSectionProps) {
  return (
    <section className="space-y-8" aria-labelledby="professionals-support-title">
      <div className="space-y-3">
        <Reveal>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Rede Materna</span>
            <h2 id="professionals-support-title" className="text-2xl font-semibold text-support-1 md:text-3xl">
              Profissionais de Apoio
            </h2>
            <p className="max-w-2xl text-sm text-support-2 md:text-base">
              Encontre especialistas confiáveis para cuidar de você e da sua família.
            </p>
          </div>
        </Reveal>
      </div>

      <ProfessionalsSectionClient professionals={professionals} initialOpenId={initialProfessionalId} />
    </section>
  )
}
