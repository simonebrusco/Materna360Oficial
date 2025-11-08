'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';
import { load, getCurrentDateKey } from '@/app/lib/persist';
import { trackTelemetry } from '@/app/lib/telemetry';

export interface Highlight {
  id: string;
  slot: 'A' | 'B';
  type: 'recipe' | 'idea' | 'mindfulness';
  title: string;
  subtitle: string;
  icon: string;
  href: string;
}

/**
 * Deterministic daily pick for highlights
 * Based on weekday and slot position
 */
function getDeterministicHighlight(weekday: number, slot: 'A' | 'B'): { type: 'recipe' | 'idea' | 'mindfulness'; id: string } | null {
  // Slot B always returns mindfulness stub
  if (slot === 'B') {
    return { type: 'mindfulness', id: `mindfulness-${weekday}` };
  }

  // Slot A: alternate between recipe (weekday 0-2) and idea (weekday 3-6)
  if (weekday < 3) {
    return { type: 'recipe', id: `recipe-${weekday}` };
  } else {
    return { type: 'idea', id: `idea-${weekday}` };
  }
}

/**
 * Get mock recipe data for deterministic pick
 */
function getMockRecipe(weekday: number): Omit<Highlight, 'slot'> {
  const recipes = [
    {
      title: 'Purê Cremoso de Abóbora',
      subtitle: 'Receita pronta em 12 min',
      icon: 'sparkles',
    },
    {
      title: 'Iogurte com Frutas Vermelhas',
      subtitle: 'Receita pronta em 5 min',
      icon: 'heart',
    },
    {
      title: 'Brócolis ao Vapor com Ricota',
      subtitle: 'Receita pronta em 10 min',
      icon: 'leaf',
    },
  ];

  const recipe = recipes[weekday % recipes.length];
  return {
    id: `recipe-${weekday}`,
    type: 'recipe',
    title: recipe.title,
    subtitle: recipe.subtitle,
    icon: recipe.icon,
    href: '/descobrir',
  };
}

/**
 * Get mock idea data for deterministic pick
 */
function getMockIdea(weekday: number): Omit<Highlight, 'slot'> {
  const ideas = [
    {
      title: 'Brincadeira Sensorial',
      subtitle: 'Exploração de texturas',
      icon: 'sparkles',
    },
    {
      title: 'Momento de Conexão',
      subtitle: '10 minutos para fortalecer o vínculo',
      icon: 'heart',
    },
    {
      title: 'Respiração em 4 Tempos',
      subtitle: 'Calmar você e seu filho',
      icon: 'care',
    },
    {
      title: 'Dança Energia',
      subtitle: 'Movimento e diversão',
      icon: 'star',
    },
  ];

  const idea = ideas[weekday % ideas.length];
  return {
    id: `idea-${weekday}`,
    type: 'idea',
    title: idea.title,
    subtitle: idea.subtitle,
    icon: idea.icon,
    href: '/descobrir',
  };
}

/**
 * Get mock mindfulness data
 */
function getMockMindfulness(weekday: number): Omit<Highlight, 'slot'> {
  const tracks = [
    {
      title: 'Acalme Sua Mente',
      subtitle: 'Áudio: 8 min',
      icon: 'care',
    },
    {
      title: 'Conexão com o Presente',
      subtitle: 'Áudio: 6 min',
      icon: 'heart',
    },
    {
      title: 'Respire Profundamente',
      subtitle: 'Áudio: 5 min',
      icon: 'sparkles',
    },
  ];

  const track = tracks[weekday % tracks.length];
  return {
    id: `mindfulness-${weekday}`,
    type: 'mindfulness',
    title: track.title,
    subtitle: track.subtitle,
    icon: track.icon,
    href: '/cuidar',
  };
}

/**
 * Get highlight data based on type
 */
function getHighlightData(type: 'recipe' | 'idea' | 'mindfulness', weekday: number): Omit<Highlight, 'slot'> {
  switch (type) {
    case 'recipe':
      return getMockRecipe(weekday);
    case 'idea':
      return getMockIdea(weekday);
    case 'mindfulness':
      return getMockMindfulness(weekday);
  }
}

export default function DestaquesDodia() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get current weekday (0 = Sunday, 6 = Saturday)
    const today = new Date();
    const weekday = today.getDay();

    // Get deterministic highlights for today
    const slotAData = getDeterministicHighlight(weekday, 'A');
    const slotBData = getDeterministicHighlight(weekday, 'B');

    const highlights: Highlight[] = [];

    // Add Slot A if available
    if (slotAData) {
      const baseData = getHighlightData(slotAData.type, weekday);
      highlights.push({
        ...baseData,
        slot: 'A',
      });
    }

    // Add Slot B if available
    if (slotBData) {
      const baseData = getHighlightData(slotBData.type, weekday);
      highlights.push({
        ...baseData,
        slot: 'B',
      });
    }

    setHighlights(highlights);
    setIsLoaded(true);
  }, []);

  const handleHighlightClick = (highlight: Highlight) => {
    trackTelemetry('maternar.highlight_click', {
      slot: highlight.slot,
      type: highlight.type,
      id: highlight.id,
    });
  };

  // Only render if loaded and we have highlights
  if (!isLoaded || highlights.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-8 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-support-1 uppercase tracking-wide">
            Destaques do dia
          </h3>
        </div>

        {/* Horizontal Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {highlights.map((highlight) => (
            <Link
              key={highlight.id}
              href={highlight.href}
              onClick={() => handleHighlightClick(highlight)}
            >
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/60 bg-white/80 shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-shadow hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] cursor-pointer h-full">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <AppIcon
                    name={highlight.icon}
                    size={24}
                    decorative
                    variant="brand"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-support-1 line-clamp-1">
                    {highlight.title}
                  </p>
                  <p className="text-xs text-support-2 mt-0.5 line-clamp-1">
                    {highlight.subtitle}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex-shrink-0 text-primary font-semibold text-sm">
                  Acessar →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
