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
  // Row 1
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Como Estou Hoje',
    subtitle: 'Seu espaço para reconhecer seu humor e energia do dia.',
    href: '/meu-dia/como-estou-hoje',
    ctaText: 'Começar agora',
    tag: 'Você',
  },
  {
    id: 'planner-do-dia',
    icon: 'calendar',
    title: 'Planner do Dia',
    subtitle: 'Organize suas tarefas sem peso e com leveza.',
    href: '/meu-dia',
    ctaText: 'Começar agora',
    tag: 'Você',
  },
  {
    id: 'cuidar-de-mim',
    icon: 'heart',
    title: 'Autocuidado Inteligente',
    subtitle: 'Cuidados que ajudam você a recarregar e se ouvir.',
    href: '/cuidar/autocuidado-inteligente',
    ctaText: 'Explorar',
    tag: 'Você',
  },
  // Row 2
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar com Amor',
    subtitle: 'Orientações práticas para cuidar do seu filho com presença.',
    href: '/cuidar/cuidar-com-amor',
    ctaText: 'Explorar',
    tag: 'Seu filho',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Rotina Leve',
    subtitle: 'Ideias e inspirações rápidas para simplificar seu dia.',
    href: '/meu-dia/rotina-leve',
    ctaText: 'Começar agora',
    tag: 'Rotina',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender Brincando',
    subtitle: 'Brincadeiras inteligentes para aprender e se conectar.',
    href: '/descobrir/aprender-brincando',
    ctaText: 'Explorar',
    tag: 'Seu filho',
  },
  // Row 3
  {
    id: 'biblioteca-materna',
    icon: 'book-open',
    title: 'Biblioteca Materna',
    subtitle: 'Conteúdos escolhidos para apoiar sua rotina.',
    href: '/biblioteca-materna',
    ctaText: 'Ver conteúdos',
    tag: 'Aprender',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha Jornada',
    subtitle: 'Um retrato carinhoso da sua evolução emocional.',
    href: '/eu360/minha-jornada',
    ctaText: 'Ver minha jornada',
    tag: 'Você',
  },
  {
    id: 'minhas-conquistas-hub',
    icon: 'star',
    title: 'Minhas Conquistas',
    subtitle: 'Celebre pequenos passos que fazem grandes mudanças.',
    href: '/meu-dia/minhas-conquistas',
    ctaText: 'Ver conquistas',
    tag: 'Você',
  },
  // Row 4
  {
    id: 'planos-premium',
    icon: 'star',
    title: 'Materna+',
    subtitle: 'Conteúdos guiados para ir mais fundo no seu bem-estar.',
    href: '/planos',
    ctaText: 'Ver planos →',
    tag: 'Premium',
  },
]

export default function CardHub() {
  return (
    <section className="mt-8 md:mt-10">
      {/* All cards: 2 columns on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch max-w-full mx-auto">
        {HUB_CARDS.map((card, index) => (
          <div key={card.id} className="h-full">
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
