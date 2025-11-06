'use client';

import * as React from 'react';
import HScroll from '@/components/common/HScroll';
import AppIcon from '@/components/ui/AppIcon';
// If your project uses SectionWrapper / GridRhythm, keep these imports;
// otherwise they can be removed without breaking the page render.
import { SectionWrapper } from '@/components/common/SectionWrapper';
import GridRhythm from '@/components/common/GridRhythm';

type Mood = {
  id: string;
  label: string;
  icon: 'heart' | 'star' | 'idea' | 'time' | 'care';
};

const MOODS: Mood[] = [
  { id: 'calm',   label: 'Calma',   icon: 'care' },
  { id: 'focused',label: 'Foco',    icon: 'star' },
  { id: 'creative',label:'Criativa',icon: 'idea' },
  { id: 'quick',  label: 'Sem tempo', icon: 'time' },
  { id: 'light',  label: 'Leve',    icon: 'heart' },
];

export default function DiscoverClient() {
  const [selectedMood, setSelectedMood] = React.useState<string | null>(null);

  return (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-strong,#2f3a56)]">
          Descobrir
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted,#4b5563)]">
          Encontre ideias rápidas e conteúdos para agora.
        </p>
      </div>

      {/* Filtros básicos (placeholders, não quebram nada) */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
          aria-label="Filtrar por idade"
        >
          <AppIcon name="filters" decorative />
          Idade
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
          aria-label="Filtrar por local"
        >
          <AppIcon name="place" decorative />
          Local
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
          aria-label="Filtrar por tempo"
        >
          <AppIcon name="time" decorative />
          Tempo
        </button>
      </div>

      {/* Bloco: Como você está agora?  (HScroll + snap) */}
      <SectionWrapper
        title="Como você está agora?"
        description="Escolha um humor para adaptar as sugestões."
        className="mb-8"
      >
        <HScroll aria-label="Opções de humor">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id)}
              className={[
                'rounded-xl bg-white px-4 py-3 shadow-[0_4px_24px_rgba(47,58,86,0.08)]',
                'flex items-center gap-2',
                selectedMood === m.id ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200',
              ].join(' ')}
              aria-pressed={selectedMood === m.id}
              aria-label={`Selecionar humor: ${m.label}`}
            >
              <AppIcon name={m.icon} decorative />
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </HScroll>
      </SectionWrapper>

      {/* Grade de resultados (placeholder seguro) */}
      <GridRhythm className="grid-cols-1 gap-4 md:grid-cols-2">
        {[1,2,3,4].map((i) => (
          <article
            key={i}
            className="rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(47,58,86,0.08)]"
          >
            <header className="mb-2 flex items-center gap-2">
              <AppIcon name="idea" decorative />
              <h2 className="text-base font-semibold">Sugestão #{i}</h2>
            </header>
            <p className="text-sm text-[var(--text-muted,#4b5563)]">
              Conteúdo de exemplo. A integração com IA/telemetria virá no Batch 6/4.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="rounded-md border px-3 py-1 text-sm" aria-label="Salvar no planner">
                Salvar
              </button>
              <button className="rounded-md border px-3 py-1 text-sm" aria-label="Abrir detalhes">
                Abrir
              </button>
            </div>
          </article>
        ))}
      </GridRhythm>
    </main>
  );
}

// Optional named export for compatibility if `page.tsx` imports { Client } from './Client'
export const Client = DiscoverClient;
