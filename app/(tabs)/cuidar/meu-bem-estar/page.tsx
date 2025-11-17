'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface SelfCareCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const SELF_CARE_CARDS: SelfCareCard[] = [
  {
    id: 'hoje',
    icon: 'heart',
    title: 'Hoje',
    subtitle: 'O que seu corpo pede agora',
    href: '/cuidar/meu-bem-estar/hoje',
  },
  {
    id: 'semana-leve',
    icon: 'calendar-clock',
    title: 'Semana leve',
    subtitle: 'Rotina real de autocuidado',
    href: '/cuidar/meu-bem-estar/semana-leve',
  },
  {
    id: 'sono-energia',
    icon: 'moon',
    title: 'Sono & energia',
    subtitle: 'Rituais para descansar de verdade',
    href: '/cuidar/meu-bem-estar/sono-energia',
  },
  {
    id: 'consultas',
    icon: 'stethoscope',
    title: 'Consultas em dia',
    subtitle: 'Acompanhe sua saúde com calma',
    href: '/cuidar/meu-bem-estar/consultas',
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
