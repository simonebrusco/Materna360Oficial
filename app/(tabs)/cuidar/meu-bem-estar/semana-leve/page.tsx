'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function SemanaLevePage() {
  return (
    <PageTemplate
      label="MEU BEM-ESTAR"
      title="Semana leve"
      subtitle="Rotina real de autocuidado"
    >
      <ClientOnly>
        <div className="max-w-2xl mb-6 md:mb-8">
          <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
            Organize sua semana com leveza e equilíbrio. Em breve, conteúdos personalizados aparecerão aqui.
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
