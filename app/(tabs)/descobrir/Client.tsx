'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { toast } from '@/app/lib/toast';
import { save, load, getCurrentDateKey } from '@/app/lib/persist';
import { track, trackTelemetry } from '@/app/lib/telemetry-track';
import { SectionH2, BlockH3 } from '@/components/common/Headings';
import { SuggestionCover } from './components/SuggestionCover';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { gate } from '@/app/lib/gate';
import { canSaveMore, incTodayCount, readTodayCount, resetIfNewDay } from './lib/quota';
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

const IDEA_QUOTA_LIMIT = 5; // Free tier limit: 5 ideas per day

export default function DiscoverClient() {
  const router = useRouter();
  const [childAgeMonths, setChildAgeMonths] = React.useState<number | undefined>(24);
  const [selectedTimeWindow, setSelectedTimeWindow] = React.useState<TimeWindow | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = React.useState<Location | undefined>(undefined);
  const [selectedMood, setSelectedMood] = React.useState<Mood | undefined>(undefined);
  const [savedItems, setSavedItems] = React.useState<Set<string>>(new Set());
  const [ideaCount, setIdeaCount] = React.useState(0);
  const [quotaLimitReached, setQuotaLimitReached] = React.useState(false);

  // Helper: Get today's idea view count
  const getTodayIdeaCount = React.useCallback(() => {
    const dateKey = getCurrentDateKey();
    const count = load<number>(`ideas:${dateKey}`, 0);
    return typeof count === 'number' ? count : 0;
  }, []);

  // Helper: Increment idea count and check limit
  const incrementIdeaCount = React.useCallback(() => {
    const dateKey = getCurrentDateKey();
    const currentCount = getTodayIdeaCount();
    const newCount = currentCount + 1;

    // Persist new count
    save(`ideas:${dateKey}`, newCount);
    setIdeaCount(newCount);

    // Check if limit reached (emit telemetry when reached)
    if (newCount === IDEA_QUOTA_LIMIT) {
      setQuotaLimitReached(true);
      trackTelemetry('paywall.view', {
        context: 'ideas_quota_limit_reached',
        count: newCount,
        limit: IDEA_QUOTA_LIMIT,
      });
    }

    return newCount;
  }, [getTodayIdeaCount]);

  // Page-view telemetry on mount
  React.useEffect(() => {
    track('nav.click', { tab: 'descobrir', dest: '/descobrir' });
  }, []);

  // Load saved items and quota on mount
  React.useEffect(() => {
    const saved = load<string[]>('saved:discover', []);
    if (saved && Array.isArray(saved)) {
      setSavedItems(new Set(saved));
    }

    // Load today's idea count
    const todayCount = getTodayIdeaCount();
    setIdeaCount(todayCount);
    if (todayCount >= IDEA_QUOTA_LIMIT) {
      setQuotaLimitReached(true);
      trackTelemetry('paywall.view', {
        context: 'page_load_quota_limit',
        count: todayCount,
        limit: IDEA_QUOTA_LIMIT,
      });
    }
  }, [getTodayIdeaCount]);

  // Compute filtered suggestions in real time
  const filters: FilterInputs = {
    childAgeMonths,
    timeWindow: selectedTimeWindow,
    location: selectedLocation,
    mood: selectedMood,
  };

  const filteredSuggestions = filterAndRankSuggestions(DISCOVER_CATALOG, filters);

  // Compute quota info - using daily save count
  const quota = gate('ideas.dailyQuota');
  const { count: dailySaveCount } = readTodayCount();
  const { count: _, limit: dailyLimit } = canSaveMore();
  const showQuotaWarning =
    quota.enabled &&
    Number.isFinite(dailyLimit) &&
    dailySaveCount >= Math.max(0, (dailyLimit as number) - 1);

  // Handlers
  const handleStartSuggestion = (id: string) => {
    // Increment idea count (quota tracking)
    incrementIdeaCount();

    // Fire telemetry event
    track('discover.suggestion_started', {
      tab: 'descobrir',
      component: 'DiscoverClient',
      id,
      suggestionId: id,
    });
  };

  const handleSaveSuggestion = (id: string) => {
    // Check if this is a new save (not an unsave)
    const isCurrenlySaved = savedItems.has(id);

    if (!isCurrenlySaved) {
      // This is a new save attempt - check quota first
      const q = canSaveMore();
      if (!q.allowed) {
        toast.danger('Limite diário atingido.');
        return;
      }
    }

    setSavedItems((prev) => {
      const updated = new Set(prev);
      const isSaved = updated.has(id);

      if (isSaved) {
        updated.delete(id);
      } else {
        updated.add(id);
        // Increment daily save count after successful save
        incTodayCount();
      }

      // Persist to localStorage
      save('saved:discover', Array.from(updated));

      // Show toast
      if (!isSaved) {
        toast.success("Ideia salva com sucesso! Você pode acessá-la mais tarde em 'Salvos'.");
      }

      // Fire telemetry
      track('discover.suggestion_saved', {
        tab: 'descobrir',
        component: 'DiscoverClient',
        action: isSaved ? 'unsave' : 'save',
        id,
        isSaved: !isSaved,
      });

      return updated;
    });
  };

  const handleFilterChange = (filterType: string, value?: string) => {
    track('discover.filter_changed', {
      tab: 'descobrir',
      component: 'DiscoverClient',
      action: 'filter',
      filter: filterType,
      value,
    });
  };

  const handleClearFilters = () => {
    setSelectedTimeWindow(undefined);
    setSelectedLocation(undefined);
    setSelectedMood(undefined);
    handleFilterChange('clear_all');
  };

  const handlePaywallCTA = () => {
    trackTelemetry('paywall.click', {
      context: 'ideas_quota_limit',
      action: 'upgrade_click',
    });
    // Navigate to plans page
    router.push('/planos');
  };

  return (
    <PageTemplate
      title="Descobrir"
      subtitle="Brincadeiras e ideias inteligentes, por idade e objetivo"
    >

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
                <AppIcon name="x" size={14} decorative className="ml-1" />
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
                <AppIcon name="x" size={14} decorative className="ml-1" />
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
                <AppIcon name="x" size={14} decorative className="ml-1" />
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
      <Card>
        <div className="mb-4">
          <SectionH2 className="mb-1">Quanto tempo você tem agora?</SectionH2>
          <p className="text-sm text-support-2">Escolha o tempo disponível para adaptar as sugestões.</p>
        </div>
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
      </Card>

      {/* Location Section */}
      <Card>
        <div className="mb-4">
          <SectionH2 className="mb-1">Onde você está?</SectionH2>
          <p className="text-sm text-support-2">Escolha o local para ideias relevantes.</p>
        </div>
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
      </Card>

      {/* Mood Section */}
      <Card>
        <div className="mb-4">
          <SectionH2 className="mb-1">Como você está agora?</SectionH2>
          <p className="text-sm text-support-2">Escolha um humor para adaptar as sugest��es.</p>
        </div>
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
      </Card>

      {/* Quota Limit Banner */}
      {showQuotaWarning && (
        <div className="mb-4">
          <PaywallBanner
            message={`Está perto do limite diário de ideias salvas (${dailyLimit}). Faça upgrade para ampliar.`}
          />
        </div>
      )}

      {/* Suggestions Grid */}
      {filteredSuggestions.length > 0 ? (
        <PageGrid cols={2}>
          {filteredSuggestions.map((suggestion) => {
            const isSaved = savedItems.has(suggestion.id);
            const showSaveForLater = shouldShowSaveForLater(suggestion, filters);
            const q = canSaveMore();
            const saveDisabled = !isSaved && !q.allowed; // Disable save buttons when quota reached

            return (
              <Card key={suggestion.id}>
                <SuggestionCover
                  src={suggestion.coverUrl}
                  alt={suggestion.title}
                  className="mb-3"
                />
                <header className="mb-2 flex items-center gap-2">
                  <AppIcon name={suggestion.icon} decorative />
                  <BlockH3 className="text-base">{suggestion.title}</BlockH3>
                </header>
                <p className="mb-3 text-sm text-support-2">
                  {suggestion.description}
                </p>
                <p className="mb-4 text-xs text-support-3 flex items-center gap-1">
                  <AppIcon name="time" size={14} decorative />
                  {suggestion.durationMin} minutos
                </p>
                <div className="flex gap-2 items-center">
                  {showSaveForLater ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveSuggestion(suggestion.id)}
                      disabled={saveDisabled}
                      className="flex-1"
                    >
                      Salvar para depois
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
                    onClick={() => handleSaveSuggestion(suggestion.id)}
                    disabled={saveDisabled}
                    className={[
                      'p-2 rounded-lg transition-colors',
                      saveDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-primary/10',
                    ].join(' ')}
                    aria-label={isSaved ? `Remover "${suggestion.title}" de Salvos` : `Salvar "${suggestion.title}"`}
                    title={isSaved ? 'Remover de Salvos' : 'Salvar para depois'}
                  >
                    <AppIcon
                      name="bookmark"
                      size={20}
                      variant={isSaved ? 'brand' : 'default'}
                    />
                  </button>
                </div>
              </Card>
            );
          })}
        </PageGrid>
      ) : (
        <EmptyState
          title="Nenhum resultado encontrado."
          text="Ajuste os filtros e tente novamente."
          cta={<Button variant="primary" onClick={handleClearFilters}>Limpar filtros</Button>}
        />
      )}
    </PageTemplate>
  );
}

export const Client = DiscoverClient;
