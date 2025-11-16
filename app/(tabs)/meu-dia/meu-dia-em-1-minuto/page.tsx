'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MeuDiaEmUmMinutoPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Meu Dia em 1 Minuto"
      subtitle="Resumo rápido"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Uma visão rápida e objetiva do seu dia. Em breve você verá aqui os
          principais destaques reunidos em um só lugar.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
