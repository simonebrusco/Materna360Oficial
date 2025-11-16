'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MeuBemEstarPage() {
  return (
    <PageTemplate
      label="CUIDAR"
      title="Meu Bem-estar"
      subtitle="Seu momento de cuidado"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Aqui começa o espaço dedicado ao seu bem-estar. Em breve você verá conteúdos,
          rotinas e cuidados especialmente pensados para você.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
