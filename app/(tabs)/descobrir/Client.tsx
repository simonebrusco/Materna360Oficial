'use client';

import * as React from 'react';
import HScroll from '@/components/common/HScroll';
import AppIcon from '@/components/ui/AppIcon';
import { SectionWrapper } from '@/components/common/SectionWrapper';
import GridRhythm from '@/components/common/GridRhythm';
import { Button } from '@/components/ui/Button';
import { Empty } from '@/components/ui/Empty';
import { PageTemplate } from '@/components/common/PageTemplate';
import { PageGrid } from '@/components/common/PageGrid';
import { Card } from '@/components/ui/card';
import { FilterPill } from '@/components/ui/FilterPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  DISCOVER_CATALOG, 
  filterAndRankSuggestions, 
  shouldShowSaveForLater,
  type FilterInputs,
  type TimeWindow,
  type Location,
  type Mood,
} from './utils';

type MoodOption = {
  id: Mood;
  label: string;
  icon: 'heart' | 'star' | 'idea' | 'time' | 'care';
};

const MOODS: MoodOption[] = [
  { id: 'calm',   label: 'Calma',   icon: 'care' },
  { id: 'focused',label: 'Foco',    icon: 'star' },
  { id: 'playful',label:'Leve',    icon: 'heart' },
  { id: 'energetic',label: 'Energia', icon: 'idea' },
];

const TIME_OPTIONS: { id: TimeWindow; label: string }[] = [
  { id: 'now-5', label: '5 min' },
  { id: 'now-15', label: '15 min' },
  { id: 'now-30', label: '30 min' },
  { id: 'later', label: 'Depois' },
];

const LOCATION_OPTIONS: { id: Location; label: string; icon: 'place' | 'leaf' }[] = [
  { id: 'indoor', label: 'Em casa', icon: 'place' },
  { id: 'outdoor', label: 'Ao ar livre', icon: 'leaf' },
];

export default function DiscoverClient() {
  const [childAgeMonths, setChildAgeMonths] = React.useState<number | undefined>(24);
  const [selectedTimeWindow, setSelectedTimeWindow] = React.useState<TimeWindow | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = React.useState<Location | undefined>(undefined);
  const [selectedMood, setSelectedMood] = React.useState<Mood | undefined>(undefined);
  const [savedItems, setSavedItems] = React.useState<Set<string>>(new Set());

  // Compute filtered suggestions in real time
  const filters: FilterInputs = {
    childAgeMonths,
    timeWindow: selectedTimeWindow,
    location: selectedLocation,
    mood: selectedMood,
  };

  const filteredSuggestions = filterAndRankSuggestions(DISCOVER_CATALOG, filters);

  // Handlers
  const handleStartSuggestion = (id: string) => {
    // Fire telemetry event (reuse existing helpers if available)
    console.log('[telemetry] discover.suggestion_started', { suggestionId: id });
  };

  const handleSaveSuggestion = (id: string) => {
    setSavedItems((prev) => new Set(prev).add(id));
    console.log('[telemetry] discover.suggestion_saved', { suggestionId: id });
  };

  const handleFilterChange = (filterType: string) => {
    console.log('[telemetry] discover.filter_changed', { filterType });
  };

  const handleClearFilters = () => {
    setSelectedTimeWindow(undefined);
    setSelectedLocation(undefined);
    setSelectedMood(undefined);
    handleFilterChange('clear_all');
  };

  return (
    <main className="PageSafeBottom relative mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6 md:px-8">
      <div className="mb-6">
        <h1 className="text-display font-bold text-support-1">
          Descobrir
        </h1>
        <p className="mt-1 text-base-md text-support-2">
          Encontre ideias rápidas e conteúdos para agora.
        </p>
      </div>

      {/* Filter Pills: Time Window */}
      {selectedTimeWindow || selectedLocation || selectedMood ? (
        <div className="mb-6">
          <div className="mb-3 text-sm text-support-2">Filtros ativos:</div>
          <div className="flex flex-wrap gap-2">
            {selectedTimeWindow && (
              <button
                onClick={() => {
                  setSelectedTimeWindow(undefined);
                  handleFilterChange('time_cleared');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                aria-label={`Remover filtro: ${TIME_OPTIONS.find(t => t.id === selectedTimeWindow)?.label}`}
              >
                <AppIcon name="time" size={14} decorative />
                {TIME_OPTIONS.find(t => t.id === selectedTimeWindow)?.label}
                <span className="ml-1">✕</span>
              </button>
            )}
            {selectedLocation && (
              <button
                onClick={() => {
                  setSelectedLocation(undefined);
                  handleFilterChange('location_cleared');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                aria-label={`Remover filtro: ${LOCATION_OPTIONS.find(l => l.id === selectedLocation)?.label}`}
              >
                <AppIcon name="place" size={14} decorative />
                {LOCATION_OPTIONS.find(l => l.id === selectedLocation)?.label}
                <span className="ml-1">✕</span>
              </button>
            )}
            {selectedMood && (
              <button
                onClick={() => {
                  setSelectedMood(undefined);
                  handleFilterChange('mood_cleared');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                aria-label={`Remover filtro: ${MOODS.find(m => m.id === selectedMood)?.label}`}
              >
                <AppIcon name="heart" size={14} decorative />
                {MOODS.find(m => m.id === selectedMood)?.label}
                <span className="ml-1">✕</span>
              </button>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm font-medium text-support-2 hover:text-support-1 underline"
              aria-label="Limpar todos os filtros"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      ) : null}

      {/* Time Window Section */}
      <SectionWrapper
        title="Quanto tempo você tem agora?"
        description="Escolha o tempo disponível para adaptar as sugestões."
        className="mb-8"
      >
        <HScroll aria-label="Opções de tempo disponível">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedTimeWindow(option.id);
                handleFilterChange(`time_${option.id}`);
              }}
              className={[
                'rounded-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap min-w-fit',
                'shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-all',
                selectedTimeWindow === option.id
                  ? 'ring-2 ring-primary bg-white'
                  : 'ring-1 ring-gray-200 bg-white hover:ring-primary/50',
              ].join(' ')}
              aria-pressed={selectedTimeWindow === option.id}
              aria-label={`Selecionar: ${option.label}`}
            >
              <AppIcon name="time" size={16} decorative />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </HScroll>
      </SectionWrapper>

      {/* Location Section */}
      <SectionWrapper
        title="Onde você está?"
        description="Escolha o local para ideias relevantes."
        className="mb-8"
      >
        <HScroll aria-label="Opções de local">
          {LOCATION_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setSelectedLocation(option.id);
                handleFilterChange(`location_${option.id}`);
              }}
              className={[
                'rounded-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap min-w-fit',
                'shadow-[0_4px_24px_rgba(47,58,86,0.08)] transition-all',
                selectedLocation === option.id
                  ? 'ring-2 ring-primary bg-white'
                  : 'ring-1 ring-gray-200 bg-white hover:ring-primary/50',
              ].join(' ')}
              aria-pressed={selectedLocation === option.id}
              aria-label={`Selecionar: ${option.label}`}
            >
              <AppIcon name={option.icon} size={16} decorative />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </HScroll>
      </SectionWrapper>

      {/* Mood Section */}
      <SectionWrapper
        title="Como você está agora?"
        description="Escolha um humor para adaptar as sugestões."
        className="mb-8"
      >
        <HScroll aria-label="Opções de humor">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMood(m.id);
                handleFilterChange(`mood_${m.id}`);
              }}
              className={[
                'rounded-xl bg-white px-4 py-3 shadow-[0_4px_24px_rgba(47,58,86,0.08)]',
                'flex items-center gap-2 whitespace-nowrap min-w-fit transition-all',
                selectedMood === m.id ? 'ring-2 ring-primary' : 'ring-1 ring-gray-200 hover:ring-primary/50',
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

      {/* Suggestions Grid */}
      {filteredSuggestions.length > 0 ? (
        <GridRhythm className="grid-cols-1 gap-4 md:grid-cols-2">
          {filteredSuggestions.map((suggestion) => {
            const isSaved = savedItems.has(suggestion.id);
            const showSaveForLater = shouldShowSaveForLater(suggestion, filters);
            return (
              <article
                key={suggestion.id}
                className="rounded-2xl bg-white p-4 shadow-[0_4px_24px_rgba(47,58,86,0.08)]"
              >
                <header className="mb-2 flex items-center gap-2">
                  <AppIcon name={suggestion.icon} decorative />
                  <h2 className="text-base font-semibold text-support-1">{suggestion.title}</h2>
                </header>
                <p className="mb-3 text-sm text-support-2">
                  {suggestion.description}
                </p>
                <p className="mb-4 text-xs text-support-3">
                  ⏱️ {suggestion.durationMin} minutos
                </p>
                <div className="flex gap-2">
                  {showSaveForLater ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveSuggestion(suggestion.id)}
                      className="flex-1"
                    >
                      {isSaved ? '✓ Salvo' : 'Salvar para depois'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartSuggestion(suggestion.id)}
                      className="flex-1"
                    >
                      Começar agora
                    </Button>
                  )}
                  <button
                    className="text-primary text-sm font-medium hover:underline px-2 py-2"
                    aria-label={`Detalhes de ${suggestion.title}`}
                  >
                    Detalhes
                  </button>
                </div>
              </article>
            );
          })}
        </GridRhythm>
      ) : (
        <Empty
          icon="sparkles"
          title="Nenhuma ideia encontrada"
          subtitle="Tente ajustar os filtros para ver mais sugestões."
          actionLabel="Limpar filtros"
          onAction={handleClearFilters}
        />
      )}
    </main>
  );
}

export const Client = DiscoverClient;
