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
  tag: string
}

const HUB_CARDS: CardConfig[] = [
  {
    id: 'planner-do-dia',
    icon: 'calendar',
    title: 'Planner do Dia',
    subtitle: 'Organize suas tarefas sem se sobrecarregar.',
    href: '/meu-dia',
    ctaText: 'Planejar agora',
    tag: 'Você',
  },
  {
    id: 'cuidar-de-mim',
    icon: 'heart',
    title: 'Autocuidado Inteligente',
    subtitle: 'Cuidar de você também é cuidar da sua família.',
    href: '/cuidar/autocuidado-inteligente',
    ctaText: 'Explorar',
    tag: 'Você',
  },
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar com Amor',
    subtitle: 'Pequenos gestos que fortalecem o vínculo com seu filho.',
    href: '/cuidar/cuidar-com-amor',
    ctaText: 'Explorar',
    tag: 'Seu filho',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Rotina Leve',
    subtitle: 'Organize o dia sem se sobrecarregar.',
    href: '/meu-dia/rotina-leve',
    ctaText: 'Começar',
    tag: 'Rotina',
  },
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Como Estou Hoje',
    subtitle: 'Um check-in honesto com você mesma.',
    href: '/meu-dia/como-estou-hoje',
    ctaText: 'Começar',
    tag: 'Você',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender Brincando',
    subtitle: 'Ideias rápidas de brincar e ensinar.',
    href: '/descobrir/aprender-brincando',
    ctaText: 'Explorar',
    tag: 'Seu filho',
  },
  {
    id: 'biblioteca-materna',
    icon: 'book-open',
    title: 'Biblioteca Materna',
    subtitle: 'Conteúdos inteligentes para sua jornada.',
    href: '/biblioteca-materna',
    ctaText: 'Explorar',
    tag: 'Aprender',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha Jornada',
    subtitle: 'Acompanhe sua evolução e os momentos especiais da sua maternidade.',
    href: '/eu360/minha-jornada',
    ctaText: 'Explorar',
    tag: 'Você',
  },
  {
    id: 'minhas-conquistas-hub',
    icon: 'star',
    title: 'Minhas Conquistas',
    subtitle: 'Celebre seus pequenos progressos todos os dias.',
    href: '/meu-dia/minhas-conquistas',
    ctaText: 'Começar',
    tag: 'Você',
  },
  {
    id: 'planos-premium',
    icon: 'star',
    title: 'Materna+',
    subtitle: 'Conteúdos guiados para ir mais fundo.',
    href: '/planos',
    ctaText: 'Ver planos',
    tag: 'Premium',
  },
]

export default function CardHub() {
  return (
    <section className="mt-8 md:mt-10">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-4 md:gap-x-6 md:gap-y-6 px-2 md:px-4 max-w-full mx-auto">
        {HUB_CARDS.map((card, index) => (
          <div
            key={card.id}
            className={clsx(
              'h-full',
              card.id === 'planos-premium' && 'md:order-first'
            )}
            suppressHydrationWarning
          >
            <MaternarFeatureCard
              icon={card.icon}
              title={card.title}
              subtitle={card.subtitle}
              href={card.href}
              cardId={card.id}
              ctaText={card.ctaText}
              index={index}
              tag={card.tag}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
