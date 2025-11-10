'use client';

import { getMoodEntries } from '@/app/lib/moodStore.client';

export type CoachFocus = 'Autocuidado' | 'Paciência' | 'Organização' | 'Rotina de Sono' | 'Energia';
export type CoachTone = 'acolhedor' | 'prático' | 'motivador';

export type CoachSuggestion = {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  secondaryLabel?: string;
  why: string;
  focus: CoachFocus;
  tone: CoachTone;
};

const STORAGE_KEY = 'm360_coach_focus';
const TONE_KEY = 'm360_coach_tone';

function pick<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error('empty array');
  if (seed == null) return arr[Math.floor(Math.random() * arr.length)];
  return arr[seed % arr.length];
}

function last7() {
  return getMoodEntries().slice(-7);
}

function computeStats() {
  const data = last7();
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return {
    data,
    avgMood: +avg(data.map((d) => d.mood)).toFixed(1),
    avgEnergy: +avg(data.map((d) => d.energy)).toFixed(1),
    lows: data.filter((d) => d.mood <= 2).length,
    highs: data.filter((d) => d.mood >= 4).length,
  };
}

function loadFocus(): CoachFocus | null {
  try {
    return (localStorage.getItem(STORAGE_KEY) as CoachFocus) || null;
  } catch {
    return null;
  }
}

function saveFocus(f: CoachFocus) {
  try {
    localStorage.setItem(STORAGE_KEY, f);
  } catch {}
}

function loadTone(): CoachTone | null {
  try {
    return (localStorage.getItem(TONE_KEY) as CoachTone) || null;
  } catch {
    return null;
  }
}

function saveTone(t: CoachTone) {
  try {
    localStorage.setItem(TONE_KEY, t);
  } catch {}
}

const FOCUSES: CoachFocus[] = ['Autocuidado', 'Paciência', 'Organização', 'Rotina de Sono', 'Energia'];
const TONES: CoachTone[] = ['acolhedor', 'prático', 'motivador'];

function variantCopy(
  base: { title: string; body: string },
  tone: CoachTone
): { title: string; body: string } {
  if (tone === 'prático') {
    return {
      title: base.title,
      body: base.body
        .replace('experimente', 'faça')
        .replace('Que tal', 'Comece com')
        .replace('pequenas', 'duas'),
    };
  }
  if (tone === 'motivador') {
    return {
      title: `Agora é a hora — ${base.title}`,
      body: base.body + ' Você consegue! Uma ação pequena hoje muda o seu amanhã.',
    };
  }
  return base; // acolhedor (default)
}

export function generateCoachSuggestion(): CoachSuggestion | null {
  const { data, avgMood, avgEnergy, lows, highs } = computeStats();

  // Tone & Focus persistence
  const lastFocus = loadFocus();
  const lastTone = loadTone();
  const tone = lastTone || pick(TONES);
  let focus: CoachFocus = lastFocus || pick(FOCUSES);

  let sug: CoachSuggestion | null = null;

  if (data.length === 0) {
    focus = 'Organização';
    sug = {
      id: 'coach:no-data',
      title: 'Começar com leveza',
      body: 'Sem registros por aqui ainda. Que tal um check-in rápido hoje?',
      actionLabel: 'Registrar agora',
      secondaryLabel: 'Ver depois',
      why: 'Sugerido porque não encontramos registros recentes de humor/energia.',
      focus,
      tone,
    };
  } else if (lows >= 3) {
    focus = 'Autocuidado';
    const base = {
      title: 'Um passo de cuidado por dia',
      body: 'Se os dias têm sido pesados, experimente 5 minutos de respiração + alongamento suave.',
    };
    const v = variantCopy(base, tone);
    sug = {
      id: 'coach:low-mood-streak',
      title: v.title,
      body: v.body,
      actionLabel: 'Fazer agora (5 min)',
      secondaryLabel: 'Salvar para depois',
      why: 'Detectamos 3+ dias recentes com humor mais baixo.',
      focus,
      tone,
    };
  } else if (avgEnergy <= 2.5) {
    focus = 'Energia';
    const base = {
      title: 'Recarregar a energia',
      body: 'Hidratação + pausa breve podem ajudar. Que tal 10 minutos só para você?',
    };
    const v = variantCopy(base, tone);
    sug = {
      id: 'coach:low-energy',
      title: v.title,
      body: v.body,
      actionLabel: 'Pausa de 10 min',
      secondaryLabel: 'Salvar para depois',
      why: 'Sua média de energia recente está mais baixa.',
      focus,
      tone,
    };
  } else if (highs >= 3) {
    focus = 'Paciência';
    const base = {
      title: 'Consolidar bons momentos',
      body: 'Aproveite a maré boa: planeje duas microvitórias para amanhã.',
    };
    const v = variantCopy(base, tone);
    sug = {
      id: 'coach:high-mood',
      title: v.title,
      body: v.body,
      actionLabel: 'Planejar 2 microvitórias',
      secondaryLabel: 'Salvar para depois',
      why: 'Vários dias com humor alto na semana.',
      focus,
      tone,
    };
  } else {
    focus = 'Organização';
    const base = {
      title: 'Seguir no ritmo certo',
      body: 'Mantenha o equilíbrio com 1 pequena ação para você hoje.',
    };
    const v = variantCopy(base, tone);
    sug = {
      id: 'coach:balanced',
      title: v.title,
      body: v.body,
      actionLabel: 'Escolher 1 ação',
      secondaryLabel: 'Salvar para depois',
      why: 'Humor e energia em faixa equilibrada nos últimos dias.',
      focus,
      tone,
    };
  }

  // Persist chosen focus & tone for continuity
  if (sug) {
    saveFocus(focus);
    saveTone(tone);
  }
  return sug;
}

export function getSavedCoachFocus(): CoachFocus | null {
  return loadFocus();
}

export function getSavedCoachTone(): CoachTone | null {
  return loadTone();
}

export function setCoachTone(t: CoachTone) {
  saveTone(t);
}
