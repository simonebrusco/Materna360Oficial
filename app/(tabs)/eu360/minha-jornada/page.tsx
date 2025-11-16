'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MinhaJornadaPage() {
  return (
    <PageTemplate
      label="EU360"
      title="Minha Jornada"
      subtitle="Seu progresso"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Esta página mostrará sua evolução, conquistas e aprendizados ao longo
          da maternidade.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
