'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function ConsultasPage() {
  return (
    <PageTemplate
      label="MEU BEM-ESTAR"
      title="Consultas em dia"
      subtitle="Acompanhe sua saúde com calma"
    >
      <ClientOnly>
        <div className="max-w-2xl mb-6 md:mb-8">
          <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
            Organize e acompanhe suas consultas e exames com tranquilidade. Em breve, conteúdos personalizados aparecerão aqui.
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
