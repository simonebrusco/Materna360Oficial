'use client';

import type { CoachSuggestion } from '@/components/coach/CoachSuggestionCard';
import { getMoodEntries } from '@/app/lib/moodStore.client';

export function generateCoachSuggestion(): CoachSuggestion {
  const entries = getMoodEntries().slice(-7);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const avgMood = avg(entries.map(e => e.mood));
  const lowStreak = entries.slice(-3).every(e => e.mood <= 2);

  if (lowStreak) {
    return {
      id: `coach-${Date.now()}`,
      title: 'Respiração + alongamento',
      subtitle: '5 min para regular o sistema nervoso',
      actionLabel: 'Fazer agora (5 min)',
      saveLabel: 'Salvar para depois',
      reason: 'Humor baixo em sequência nos últimos 3 dias.',
    };
  }

  if (avgMood >= 4) {
    return {
      id: `coach-${Date.now()}`,
      title: 'Microvitórias',
      subtitle: 'Aproveite a maré positiva e planeje 1 passo pequeno',
      actionLabel: 'Planejar 1 passo',
      saveLabel: 'Salvar',
      reason: 'Humor alto na média da semana.',
    };
  }

  return {
    id: `coach-${Date.now()}`,
    title: 'Pausa de hidratação',
    subtitle: '2 minutos de água + 3 respirações profundas',
    actionLabel: 'Fazer agora',
    saveLabel: 'Salvar para depois',
    reason: 'Manter o ritmo com autocuidado simples.',
  };
}

// Backward compatibility for export page
export function getSavedCoachFocus(): string | null {
  return null;
}

// Backward compatibility - kept for potential future use
export function getSavedCoachTone(): string | null {
  return null;
}

export function setCoachTone(t: string) {
  // No-op in simplified version
}
