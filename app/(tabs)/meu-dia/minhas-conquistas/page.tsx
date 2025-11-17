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

const MINHAS_CONQUISTAS_CARDS: MeuDiaCard[] = [
  {
    id: 'como-foi-meu-dia',
    icon: 'heart',
    title: 'Como foi meu dia',
    subtitle: 'Veja o que aconteceu de mais importante.',
    href: '#',
  },
  {
    id: 'visao-rapida-do-dia',
    icon: 'calendar-clock',
    title: 'Uma visão rápida do dia',
    subtitle: 'Comece com um resumo leve e objetivo.',
    href: '#',
  },
  {
    id: 'como-me-senti',
    icon: 'smile',
    title: 'Como me senti',
    subtitle: 'Entenda seu humor e sua energia.',
    href: '#',
  },
  {
    id: 'o-que-quero-levar',
    icon: 'star',
    title: 'O que quero levar',
    subtitle: 'Pequenas vitórias e aprendizados do dia.',
    href: '#',
  },
]

export default function MinhasConquistasPage() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Minhas Conquistas"
      subtitle="Celebre seus pequenos progressos todos os dias."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {MINHAS_CONQUISTAS_CARDS.map((card) => (
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
