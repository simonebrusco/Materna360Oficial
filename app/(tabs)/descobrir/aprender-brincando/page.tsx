'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function AprenderBrincandoPage() {
  return (
    <PageTemplate
      label="DESCOBRIR"
      title="Aprender Brincando"
      subtitle="Ideias rápidas"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Aqui você encontrará brincadeiras, atividades e ideias simples para
          aplicar no dia a dia.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
