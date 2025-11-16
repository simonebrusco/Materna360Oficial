'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'

interface RoutineCard {
  id: string
  title: string
  subtitle: string
}

const ROUTINE_CARDS: RoutineCard[] = [
  {
    id: 'planejar-dia',
    title: 'Planejar o Dia',
    subtitle: 'Priorize o que importa hoje',
  },
  {
    id: 'rotina-casa',
    title: 'Rotina da Casa',
    subtitle: 'Organize o básico sem se sobrecarregar',
  },
  {
    id: 'rotina-filho',
    title: 'Rotina do Filho',
    subtitle: 'Sono, escola e momentos juntos',
  },
  {
    id: 'minhas-prioridades',
    title: 'Minhas Prioridades',
    subtitle: 'O que não pode faltar hoje',
  },
]

export default function RotatinaLevePage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o dia sem peso."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {ROUTINE_CARDS.map((card) => (
          <SoftCard
            key={card.id}
            className="rounded-3xl p-5 sm:p-6 flex flex-col h-full"
          >
            {/* Icon Placeholder */}
            <div className="h-10 w-10 bg-m360-pink-soft rounded-full mb-4" />

            {/* Content */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-base sm:text-lg font-semibold text-support-1 mb-1">
                {card.title}
              </h3>
              <p className="text-xs sm:text-sm text-support-2 mb-4">
                {card.subtitle}
              </p>
            </div>

            {/* CTA */}
            <span className="text-xs sm:text-sm font-medium text-primary inline-flex items-center gap-1 mt-auto">
              Acessar <span>→</span>
            </span>
          </SoftCard>
        ))}
      </div>
    </PageTemplate>
  )
}
