'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { CuidarFeatureCard } from '@/components/cuidar/CuidarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

interface MeuDiaCard {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const MEU_DIA_CARDS: MeuDiaCard[] = [
  {
    id: 'como-foi-meu-dia',
    icon: 'heart',
    title: 'Como foi meu dia',
    subtitle: 'Uma visão geral do dia.',
    href: '#',
  },
  {
    id: 'momentos-importantes',
    icon: 'calendar-clock',
    title: 'Momentos importantes',
    subtitle: 'Seu dia em destaques.',
    href: '#',
  },
  {
    id: 'como-me-senti',
    icon: 'smile',
    title: 'Como me senti',
    subtitle: 'Entenda seu humor.',
    href: '#',
  },
  {
    id: 'o-que-quero-levar',
    icon: 'star',
    title: 'O que quero levar',
    subtitle: 'Pequenas vitórias do dia.',
    href: '#',
  },
]

export default function MeuDiaEm1MinutoPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Meu Dia em 1 Minuto"
      subtitle="Um resumo rápido que realmente importa."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {MEU_DIA_CARDS.map((card) => (
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
