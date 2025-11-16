'use client'

import React from 'react'
import AppIcon, { type KnownIconName } from '@/components/ui/AppIcon'
import { MaternarFeatureCard } from './MaternarFeatureCard'

type CardConfig = {
  id: string
  icon: KnownIconName
  title: string
  subtitle: string
  href: string
}

const MATERNAR_FEATURES: CardConfig[] = [
  {
    id: 'cuidar-de-mim',
    icon: 'heart',
    title: 'Meu bem-estar',
    subtitle: 'Cuidar de você sem culpa',
    href: '/cuidar?focus=mae',
  },
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar do meu filho',
    subtitle: 'Saúde e desenvolvimento',
    href: '/cuidar?focus=filho',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Organizar minha rotina',
    subtitle: 'Planejamento diário',
    href: '/meu-dia?focus=planner',
  },
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Humor & energia',
    subtitle: 'Como você está se sentindo hoje',
    href: '/meu-dia?focus=humor',
  },
  {
    id: 'conexao-com-meu-filho',
    icon: 'sparkles',
    title: 'Momentos com meu filho',
    subtitle: 'Momentos especiais que importam',
    href: '/meu-dia?focus=conexao',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender & brincar',
    subtitle: 'Ideias criativas e atividades',
    href: '/descobrir?focus=atividades',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha evolução',
    subtitle: 'Conquistas e progresso',
    href: '/eu360?focus=evolucao',
  },
  {
    id: 'comecar-com-leveza',
    icon: 'sun',
    title: 'Meu dia em resumo',
    subtitle: 'Veja rapidamente o que importa hoje',
    href: '/meu-dia',
  },
  {
    id: 'planos-premium',
    icon: 'star',
    title: 'Planos & Premium',
    subtitle: 'Desbloqueie todos os recursos',
    href: '/planos',
  },
]

function createIconComponent(iconName: KnownIconName) {
  return React.forwardRef<SVGSVGElement>((props, ref) => (
    <AppIcon name={iconName} size={24} variant="brand" decorative {...props} />
  ))
}

export function CardHub() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {MATERNAR_FEATURES.map((feature) => {
          const IconComponent = createIconComponent(feature.icon)
          return (
            <MaternarFeatureCard
              key={feature.id}
              title={feature.title}
              subtitle={feature.subtitle}
              icon={IconComponent}
              href={feature.href}
            />
          )
        })}
      </div>
    </section>
  )
}

export default CardHub
