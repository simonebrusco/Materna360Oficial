'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'

const SELF_CARE_CARDS = [
  {
    id: 'hoje',
    icon: 'heart' as const,
    title: 'Hoje',
    subtitle: 'O que seu corpo pede agora',
    href: '/cuidar?focus=hoje',
  },
  {
    id: 'semana-leve',
    icon: 'calendar-clock' as const,
    title: 'Semana leve',
    subtitle: 'Rotina real de autocuidado',
    href: '/cuidar?focus=semana',
  },
  {
    id: 'sono-energia',
    icon: 'moon' as const,
    title: 'Sono & energia',
    subtitle: 'Rituais para descansar de verdade',
    href: '/cuidar?focus=sono',
  },
  {
    id: 'consultas',
    icon: 'stethoscope' as const,
    title: 'Consultas em dia',
    subtitle: 'Acompanhe sua saúde com calma',
    href: '/cuidar?focus=consultas',
  },
]

export default function MeuBemEstarPage() {
  return (
    <PageTemplate
      label="CUIDAR"
      title="Meu bem-estar"
      subtitle="Cuide de você sem culpa."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {SELF_CARE_CARDS.map((card) => (
          <CuidarFeatureCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            href={card.href}
            cardId={card.id}
          />
        ))}
      </div>
    </PageTemplate>
  )
}
