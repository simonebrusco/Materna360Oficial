'use client';

import React from 'react';
import { track } from '@/app/lib/telemetry';
import AppIcon from '@/components/ui/AppIcon';

interface ScrollCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  targetId: string;
}

const SCROLL_CARDS: ScrollCard[] = [
  {
    id: 'resumo',
    icon: 'calendar',
    title: 'Resumo da semana',
    subtitle: 'Visão geral do seu progresso',
    targetId: 'maternar-resumo-semana',
  },
  {
    id: 'habitos',
    icon: 'heart',
    title: 'Hábitos maternos',
    subtitle: 'Pequenos gestos que transformam',
    targetId: 'maternar-habitos-maternos',
  },
  {
    id: 'momentos',
    icon: 'sparkles',
    title: 'Momentos com seu filho',
    subtitle: 'Cenas que valem a pena guardar',
    targetId: 'maternar-momentos-filho',
  },
  {
    id: 'evolucao',
    icon: 'trending',
    title: 'Sua evolução emocional',
    subtitle: 'Acompanhe seu crescimento',
    targetId: 'maternar-evolucao-emocional',
  },
  {
    id: 'diario',
    icon: 'edit',
    title: 'Diário da mãe',
    subtitle: 'Espaço para seus pensamentos',
    targetId: 'maternar-diario-mae',
  },
  {
    id: 'trilhas',
    icon: 'crown',
    title: 'Trilhas premium',
    subtitle: 'Caminhos guiados e exclusivos',
    targetId: 'maternar-trilhas-premium',
  },
];

function handleNavigate(targetId: string, cardId: string) {
  if (typeof window === 'undefined') return;

  // Track the navigation
  track('maternar_hub_scroll', {
    cardId,
    targetId,
  });

  // Find target element
  const el = document.getElementById(targetId);
  if (!el) return;

  // Calculate position with offset for header
  const offset = 80;
  const y = el.getBoundingClientRect().top + window.scrollY - offset;

  // Smooth scroll
  window.scrollTo({
    top: y,
    behavior: 'smooth',
  });
}

export default function MaternarScrollHub() {
  return (
    <section className="px-4 py-6 sm:px-6 md:py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
          Navegação rápida
        </p>
        <h2 className="text-lg sm:text-xl font-semibold text-support-1">
          Por onde você quer começar?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {SCROLL_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleNavigate(card.targetId, card.id)}
            className="
              group relative block rounded-2xl overflow-hidden
              border border-white/60 bg-white/80 backdrop-blur-sm
              shadow-[0_4px_24px_rgba(47,58,86,0.08)]
              hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
              p-4 sm:p-5
              min-h-[140px] sm:min-h-[160px]
              text-left
              ui-press ui-ring
            "
            aria-label={`${card.title}: ${card.subtitle}`}
          >
            <div className="flex flex-col h-full">
              <div className="mb-2 sm:mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <AppIcon
                    name={card.icon as any}
                    size={24}
                    variant="brand"
                    decorative
                  />
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-semibold text-support-1 line-clamp-2 mb-1">
                {card.title}
              </h3>

              <p className="text-xs text-support-2 line-clamp-2 flex-1">
                {card.subtitle}
              </p>

              <div className="mt-2 text-primary text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all opacity-0 group-hover:opacity-100">
                Ir →
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
