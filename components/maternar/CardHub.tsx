'use client';

import HubCard, { type HubCardProps } from './HubCard';

type CardConfig = Omit<HubCardProps, 'cardId'> & { id: string };

const HUB_CARDS: CardConfig[] = [
  {
    id: 'cuidar-de-mim',
    icon: 'heart',
    title: 'Cuidar de mim',
    subtitle: 'Bem-estar e evolução pessoal',
    href: '/eu360',
  },
  {
    id: 'cuidar-do-meu-filho',
    icon: 'care',
    title: 'Cuidar do meu filho',
    subtitle: 'Saúde e desenvolvimento',
    href: '/cuidar',
  },
  {
    id: 'organizar-minha-rotina',
    icon: 'calendar',
    title: 'Organizar minha rotina',
    subtitle: 'Planejamento diário',
    href: '/meu-dia',
  },
  {
    id: 'humor-energia',
    icon: 'smile',
    title: 'Humor & energia',
    subtitle: 'Como você está se sentindo hoje',
    href: '/meu-dia',
  },
  {
    id: 'conexao-com-meu-filho',
    icon: 'sparkles',
    title: 'Conexão com meu filho',
    subtitle: 'Momentos especiais que importam',
    href: '/meu-dia',
  },
  {
    id: 'aprender-brincar',
    icon: 'idea',
    title: 'Aprender & Brincar',
    subtitle: 'Ideias criativas e atividades',
    href: '/descobrir',
  },
  {
    id: 'minha-evolucao',
    icon: 'crown',
    title: 'Minha Evolução',
    subtitle: 'Conquistas e progresso',
    href: '/eu360/conquistas',
  },
  {
    id: 'comecar-com-leveza',
    icon: 'sun',
    title: 'Começar com leveza',
    subtitle: 'Primeiros passos para um dia mais leve',
    href: '/meu-dia?focus=leveza',
  },
  {
    id: 'planos-premium',
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
        {HUB_CARDS.map((card) => (
          <HubCard
            key={card.id}
            {...card}
            cardId={card.id}
          />
        ))}
      </div>
    </div>
  );
}
