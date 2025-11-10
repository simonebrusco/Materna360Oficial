'use client';

import { getMoodEntries } from '@/app/lib/moodStore.client';

export type CoachSuggestion = {
  id: string;
  title: string; // short headline
  body: string; // 1–2 lines
  actionLabel: string; // main CTA
  secondaryLabel?: string; // Save for later
  why: string; // transparency text
};

export function generateCoachSuggestion(): CoachSuggestion | null {
  const data = getMoodEntries().slice(-7); // last 7 days
  if (data.length === 0) {
    return {
      id: 'coach:no-data',
      title: 'Começar com leveza',
      body: 'Sem registros por aqui ainda. Que tal um check-in rápido hoje?',
      actionLabel: 'Registrar agora',
      secondaryLabel: 'Ver depois',
      why: 'Sugerido porque não encontramos registros recentes de humor/energia.',
    };
  }

  const avgMood = Math.round((data.reduce((s, d) => s + (d.mood || 0), 0) / data.length) * 10) / 10;
  const avgEnergy =
    Math.round((data.reduce((s, d) => s + (d.energy || 0), 0) / data.length) * 10) / 10;
  const lows = data.filter((d) => d.mood <= 2).length;
  const highs = data.filter((d) => d.mood >= 4).length;

  // Heuristic rules
  if (lows >= 3) {
    return {
      id: 'coach:low-mood-streak',
      title: 'Um passo de cuidado por dia',
      body: 'Se os dias têm sido pesados, experimente 5 minutos de respiração + alongamento suave.',
      actionLabel: 'Fazer agora (5 min)',
      secondaryLabel: 'Salvar para depois',
      why: 'Detectamos 3+ dias recentes com humor mais baixo.',
    };
  }

  if (avgEnergy <= 2.5) {
    return {
      id: 'coach:low-energy',
      title: 'Recarregar a energia',
      body: 'Hidratação + pausa breve podem ajudar. Separe 10 minutos para você.',
      actionLabel: 'Pausa de 10 min',
      secondaryLabel: 'Salvar para depois',
      why: 'Sua média de energia recente está mais baixa.',
    };
  }

  if (highs >= 3) {
    return {
      id: 'coach:high-mood',
      title: 'Consolidar bons momentos',
      body: 'Aproveite a maré boa: planeje duas microvitórias para amanhã.',
      actionLabel: 'Planejar 2 microvitórias',
      secondaryLabel: 'Salvar para depois',
      why: 'Vários dias com humor alto na semana.',
    };
  }

  // Default balanced
  return {
    id: 'coach:balanced',
    title: 'Seguir no ritmo certo',
    body: 'Mantenha o equilíbrio com 1 pequena ação para você hoje.',
    actionLabel: 'Escolher 1 ação',
    secondaryLabel: 'Salvar para depois',
    why: 'Humor e energia em faixa equilibrada nos últimos dias.',
  };
}
