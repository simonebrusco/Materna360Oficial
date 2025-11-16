'use client'

import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

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
    icon: 'calendar',
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
  const handleCardClick = (cardId: string, href: string) => {
    track('nav.click', {
      tab: 'meu-dia',
      section: 'meu-dia-em-1-minuto',
      card: cardId,
      dest: href,
    })
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Meu Dia em 1 Minuto"
      subtitle="Um resumo rápido que realmente importa."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl">
        {MEU_DIA_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            onClick={() => handleCardClick(card.id, card.href)}
            className="block h-full"
          >
            <SoftCard className="h-full rounded-3xl p-5 sm:p-6 flex flex-col">
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <AppIcon
                  name={card.icon}
                  size={24}
                  variant="brand"
                  decorative
                />
              </div>

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
          </Link>
        ))}
      </div>
    </PageTemplate>
  )
}
