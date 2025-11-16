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
    subtitle: 'Seu momento',
    href: '/cuidar/meu-bem-estar',
    ctaText: 'Explorar',
  },
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar com Amor',
    subtitle: 'Para o seu filho',
    href: '/cuidar?focus=filho',
    ctaText: 'Explorar',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Rotina Leve',
    subtitle: 'Organize o dia',
    href: '/meu-dia?focus=planner',
    ctaText: 'Organizar',
  },
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Como Estou Hoje',
    subtitle: 'Humor & energia',
    href: '/meu-dia?focus=humor',
    ctaText: 'Ver agora',
  },
  {
    id: 'conexao-com-meu-filho',
    icon: 'sparkles',
    title: 'Momentos que Contam',
    subtitle: 'Conexão diária',
    href: '/meu-dia?focus=conexao',
    ctaText: 'Explorar',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender Brincando',
    subtitle: 'Ideias rápidas',
    href: '/descobrir?focus=atividades',
    ctaText: 'Descobrir',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha Jornada',
    subtitle: 'Seu progresso',
    href: '/eu360?focus=evolucao',
    ctaText: 'Ver progresso',
  },
  {
    id: 'comecar-com-leveza',
    icon: 'clock',
    title: 'Meu Dia em 1 Minuto',
    subtitle: 'Resumo rápido',
    href: '/meu-dia',
    ctaText: 'Resumo',
  },
  {
    id: 'planos-premium',
    icon: 'star',
    title: 'Materna+',
    subtitle: 'Acesso premium',
    href: '/planos',
    ctaText: 'Acessar',
  },
]

export default function CardHub() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 px-2 md:px-4 max-w-7xl mx-auto">
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
            />
          </div>
        ))}
      </div>
    </section>
  )
}
