'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface ChildCareCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const CHILD_CARE_CARDS: ChildCareCard[] = [
  {
    id: 'hoje-com-meu-filho',
    icon: 'heart',
    title: 'Hoje com meu filho',
    subtitle: 'O que ele precisa agora',
    href: '/cuidar?focus=hoje-filho',
  },
  {
    id: 'semana-com-carinho',
    icon: 'calendar',
    title: 'Semana com carinho',
    subtitle: 'Gestos que se repetem',
    href: '/cuidar?focus=semana-filho',
  },
  {
    id: 'rotina-de-cuidado',
    icon: 'clock',
    title: 'Rotina de cuidado',
    subtitle: 'Pequenos rituais do dia a dia',
    href: '/cuidar?focus=rotina',
  },
  {
    id: 'consultas-em-dia',
    icon: 'stethoscope',
    title: 'Consultas em dia',
    subtitle: 'Saúde acompanhada com calma',
    href: '/cuidar?focus=consultas-filho',
  },
]

export default function CuidarComAmorPage() {
  return (
    <PageTemplate
      label="CUIDAR"
      title="Cuidar com Amor"
      subtitle="Para o seu filho, no ritmo da vida real."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {CHILD_CARE_CARDS.map((card) => (
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
