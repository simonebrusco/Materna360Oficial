'use client'

import { PageTemplate } from '@/components/common/PageTemplate'

export default function MomentosQueContamPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Momentos que Contam"
      subtitle="Conexão diária"
    >
      <div className="flex flex-col gap-4 px-4 py-6">
        <p className="text-gray-700 text-sm leading-relaxed">
          Um espaço dedicado aos momentos especiais com seu filho. Em breve você
          poderá registrar memórias e fortalecer a conexão diária.
        </p>

        <div className="mt-6 h-32 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Área reservada para futuros conteúdos.
        </div>
      </div>
    </PageTemplate>
  )
}
