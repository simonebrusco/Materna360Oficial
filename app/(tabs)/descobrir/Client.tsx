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

      {/* Grade de resultados */}
      <GridRhythm className="grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            id: 'brincadeira-sensorial',
            title: 'Brincadeira Sensorial: Exploração Tátil',
            description: 'Atividade para estimular os sentidos. Use texturas diferentes (algodão, papel, plástico) para exploração segura.',
            icon: 'sparkles' as const,
          },
          {
            id: 'respiracao-calma',
            title: 'Respiração em 4 Tempos',
            description: 'Técnica simples para acalmar você e as crianças. Inspire por 4, segure por 4, expire por 4.',
            icon: 'care' as const,
          },
          {
            id: 'receita-rapida',
            title: 'Receita Rápida: Papinha Caseira',
            description: 'Prepare uma papinha nutritiva em menos de 15 minutos com ingredientes que você tem em casa.',
            icon: 'idea' as const,
          },
          {
            id: 'momento-conexao',
            title: 'Momento de Conexão: 10 Minutos',
            description: 'Um ritual simples e afetuoso para fortalecer o vínculo com seus filhos todo dia.',
            icon: 'heart' as const,
          },
        ].map((suggestion) => (
          <article
            key={suggestion.id}
            className="rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(47,58,86,0.08)]"
          >
            <header className="mb-2 flex items-center gap-2">
              <AppIcon name={suggestion.icon} decorative />
              <h2 className="text-base font-semibold text-support-1">{suggestion.title}</h2>
            </header>
            <p className="mb-4 text-sm text-support-2">
              {suggestion.description}
            </p>
            <div className="flex gap-2 items-center">
              <button className="flex-1 rounded-lg bg-primary text-white px-3 py-2 text-sm font-medium hover:bg-primary/90 transition-colors" aria-label={`Começar ${suggestion.title}`}>
                Começar agora
              </button>
              <button className="text-primary text-sm font-medium hover:underline" aria-label={`Detalhes de ${suggestion.title}`}>
                Detalhes
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
