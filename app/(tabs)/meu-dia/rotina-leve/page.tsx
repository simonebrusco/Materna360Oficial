'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function RotinaLevePage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Aqui você poderá organizar o dia de forma leve e prática. Em breve
          adicionaremos ferramentas e rotinas diárias.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
