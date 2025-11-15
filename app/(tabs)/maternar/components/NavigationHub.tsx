'use client'

import React from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

interface NavCard {
  title: string
  subtitle: string
  icon: string
  href: string
  cardId: string
}

const NAV_CARDS: NavCard[] = [
  {
    title: 'Cuidar de Mim',
    subtitle: 'Bem-estar e evolução pessoal',
    icon: 'heart',
    href: '/eu360',
    cardId: 'nav_cuidar_mim',
  },
  {
    title: 'Cuidar do Filho',
    subtitle: 'Saúde e desenvolvimento',
    icon: 'care',
    href: '/cuidar',
    cardId: 'nav_cuidar_filho',
  },
  {
    title: 'Organizar Rotina',
    subtitle: 'Planejamento diário',
    icon: 'calendar',
    href: '/meu-dia',
    cardId: 'nav_rotina',
  },
  {
    title: 'Aprender & Brincar',
    subtitle: 'Ideias criativas e atividades',
    icon: 'sparkles',
    href: '/descobrir',
    cardId: 'nav_aprender',
  },
  {
    title: 'Minhas Conquistas',
    subtitle: 'Progresso e evolução',
    icon: 'crown',
    href: '/eu360/conquistas',
    cardId: 'nav_conquistas',
  },
  {
    title: 'Planos Premium',
    subtitle: 'Desbloqueie recursos',
    icon: 'star',
    href: '/planos',
    cardId: 'nav_premium',
  },
]

export function NavigationHub() {
  const handleClick = (cardId: string, href: string) => {
    track('nav.click', {
      tab: 'maternar',
      card: cardId,
      dest: href,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">Explore o App</h2>
        <p className="text-sm text-support-2">
          Acesse todos os recursos disponíveis
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_CARDS.map(card => (
          <Link
            key={card.cardId}
            href={card.href}
            onClick={() => handleClick(card.cardId, card.href)}
            className="group relative block rounded-2xl overflow-hidden border border-white/60 bg-white/80 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 p-5 sm:p-6 min-h-[160px] sm:min-h-[180px]"
          >
            <div className="flex flex-col h-full relative z-0">
              <div className="mb-3 sm:mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <AppIcon
                    name={card.icon}
                    size={28}
                    variant="brand"
                    decorative
                  />
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-support-1 mb-1 line-clamp-2">
                {card.title}
              </h3>

              {card.subtitle && (
                <p className="text-sm text-support-2 line-clamp-2 flex-1">
                  {card.subtitle}
                </p>
              )}

              <div className="mt-auto pt-3 text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Acessar →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
