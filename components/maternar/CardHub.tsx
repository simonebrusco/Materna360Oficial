'use client'

import { clsx } from 'clsx'
import { MaternarFeatureCard } from './MaternarFeatureCard'
import type { KnownIconName } from '@/components/ui/AppIcon'

type CardConfig = {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
  ctaText?: string
}

const HUB_CARDS: CardConfig[] = [
  {
    id: 'cuidar-de-mim',
    icon: 'heart',
    title: 'Meu Bem-estar',
    subtitle: 'Seu momento de respirar sem culpa.',
    href: '/cuidar/meu-bem-estar',
    ctaText: 'Explorar',
  },
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar com Amor',
    subtitle: 'Para o seu filho, no ritmo da vida real.',
    href: '/cuidar/cuidar-com-amor',
    ctaText: 'Explorar',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Rotina Leve',
    subtitle: 'Organize o dia sem se sobrecarregar.',
    href: '/meu-dia/rotina-leve',
    ctaText: 'Começar',
  },
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Como Estou Hoje',
    subtitle: 'Um check-in honesto com você mesma.',
    href: '/meu-dia/como-estou-hoje',
    ctaText: 'Começar',
  },
  {
    id: 'conexao-com-meu-filho',
    icon: 'sparkles',
    title: 'Momentos que Contam',
    subtitle: 'Guarde as pequenas grandes memórias.',
    href: '/meu-dia/momentos-que-contam',
    ctaText: 'Explorar',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender Brincando',
    subtitle: 'Ideias rápidas de brincar e ensinar.',
    href: '/descobrir/aprender-brincar',
    ctaText: 'Explorar',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha Jornada',
    subtitle: 'Veja o quanto vocês já caminharam.',
    href: '/eu360/minha-jornada',
    ctaText: 'Explorar',
  },
  {
    id: 'comecar-com-leveza',
    icon: 'clock',
    title: 'Meu Dia em 1 Minuto',
    subtitle: 'Feche o dia com um resumo leve.',
    href: '/meu-dia/meu-dia-em-1-minuto',
    ctaText: 'Começar',
  },
  {
    id: 'planos-premium',
    icon: 'star',
    title: 'Materna+',
    subtitle: 'Conteúdos guiados para ir mais fundo.',
    href: '/planos',
    ctaText: 'Ver planos',
  },
]

export default function CardHub() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4 md:gap-x-4 md:gap-y-6 px-2 md:px-4 max-w-7xl mx-auto">
        {HUB_CARDS.map((card, index) => (
          <div
            key={card.id}
            className={clsx(
              'h-full',
              index === HUB_CARDS.length - 1 && 'col-span-2 md:col-span-1'
            )}
          >
            <MaternarFeatureCard
              icon={card.icon}
              title={card.title}
              subtitle={card.subtitle}
              href={card.href}
              cardId={card.id}
              ctaText={card.ctaText}
              index={index}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
