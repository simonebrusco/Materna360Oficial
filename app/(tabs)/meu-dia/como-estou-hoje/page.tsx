'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'

interface MoodCard {
  id: string
  title: string
  subtitle: string
}

const MOOD_CARDS: MoodCard[] = [
  {
    id: 'check-in-rapido',
    title: 'Check-in Rápido',
    subtitle: 'Como você está se sentindo agora',
  },
  {
    id: 'humor-semana',
    title: 'Humor da Semana',
    subtitle: 'Veja padrões de como você tem se sentido',
  },
  {
    id: 'niveis-energia',
    title: 'Níveis de Energia',
    subtitle: 'Registre se está esgotada ou recarregada',
  },
  {
    id: 'notas-dia',
    title: 'Notas do Dia',
    subtitle: 'Desabafe em poucas palavras',
  },
]

export default function ComoEstouHojePage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Como Estou Hoje"
      subtitle="Humor e energia com mais consciência."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {MOOD_CARDS.map((card) => (
          <SoftCard
            key={card.id}
            className="rounded-3xl p-5 sm:p-6 flex flex-col h-full"
          >
            {/* Icon Placeholder */}
            <div className="h-10 w-10 rounded-full bg-m360-pink-soft mb-3" />

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
