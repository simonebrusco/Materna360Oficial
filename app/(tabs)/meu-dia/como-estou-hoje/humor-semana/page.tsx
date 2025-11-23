'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { MoodSparkline } from '@/components/blocks/MoodSparkline'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function HumorSemanaPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Humor da Semana"
      subtitle="Veja padrões de como você tem se sentido."
    >
      <ClientOnly>
        <div className="max-w-2xl">
          <div className="mb-8">
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
              Acompanhe seus padrões emocionais ao longo da semana. Compreender suas oscilações ajuda você a tomar melhores decisões sobre seu bem-estar.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
            <h3 className="text-lg font-semibold text-[#2f3a56] mb-6">Sua semana até agora</h3>
            <MoodSparkline />
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
