'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function HojePage() {
  return (
    <PageTemplate
      label="MEU BEM-ESTAR"
      title="Hoje"
      subtitle="O que seu corpo pede agora"
    >
      <ClientOnly>
        <div className="max-w-2xl mb-6 md:mb-8">
          <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
            Este é seu espaço para cuidar de si mesma. Em breve, conteúdos personalizados aparecerão aqui.
          </p>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
