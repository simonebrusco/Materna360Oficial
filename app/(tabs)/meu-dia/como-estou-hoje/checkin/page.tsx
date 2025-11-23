'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { MoodQuickSelector } from '@/components/blocks/MoodQuickSelector'
import { ClientOnly } from '@/components/common/ClientOnly'

export default function CheckinPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Check-in Rápido"
      subtitle="Como você está se sentindo agora?"
    >
      <ClientOnly>
        <div className="max-w-2xl">
          <div className="mb-8">
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
              Registrar seu humor é um pequeno ato de autocuidado. Selecione como você está se sentindo neste momento.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
            <h3 className="text-lg font-semibold text-[#2f3a56] mb-6">Selecione seu humor atual</h3>
            <MoodQuickSelector />
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
