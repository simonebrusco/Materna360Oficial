'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function SonoEnergiaPage() {
  return (
    <PageTemplate
      label="MEU BEM-ESTAR"
      title="Sono & energia"
      subtitle="Rituais para descansar de verdade"
    >
      <ClientOnly>
        <div className="max-w-2xl mb-6 md:mb-8">
          <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
            Descubra rituais e práticas para melhorar seu descanso e energia. Em breve, conteúdos personalizados aparecerão aqui.
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
