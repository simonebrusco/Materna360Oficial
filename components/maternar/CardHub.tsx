'use client';

import HubCard, { type HubCardProps } from './HubCard';

const HUB_CARDS: Omit<HubCardProps, 'cardId'>[] = [
  {
    icon: 'heart',
    title: 'Cuidar de mim',
    subtitle: 'Bem-estar e evolução pessoal',
    href: '/eu360',
  },
  {
    icon: 'care',
    title: 'Cuidar do meu filho',
    subtitle: 'Saúde e desenvolvimento',
    href: '/cuidar',
  },
  {
    icon: 'calendar',
    title: 'Organizar minha rotina',
    subtitle: 'Planejamento diário',
    href: '/meu-dia',
  },
  {
    icon: 'sparkles',
    title: 'Aprender & Brincar',
    subtitle: 'Ideias criativas e atividades',
    href: '/descobrir',
  },
  {
    icon: 'crown',
    title: 'Minha Evolução',
    subtitle: 'Conquistas e progresso',
    href: '/eu360/conquistas',
  },
  {
    icon: 'star',
    title: 'Planos & Premium',
    subtitle: 'Desbloqueie todos os recursos',
    href: '/planos',
  },
];

export default function CardHub() {
  return (
    <div className="px-4 pb-12 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
        {HUB_CARDS.map((card, idx) => (
          <HubCard
            key={card.href}
            {...card}
            cardId={`card_${idx + 1}_${card.href.replace(/\//g, '_')}`}
          />
        ))}
      </div>
    </div>
  );
}
