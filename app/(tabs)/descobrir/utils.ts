/**
 * Client-side filtering and ranking logic for Discover suggestions.
 * All filtering is pure function based; no server calls.
 */

export type TimeWindow = 'now-5' | 'now-15' | 'now-30' | 'later';
export type Location = 'indoor' | 'outdoor' | 'noisy' | 'quiet';
export type Mood = 'calm' | 'playful' | 'focused' | 'energetic';
export type Energy = 'low' | 'medium' | 'high';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: 'sparkles' | 'care' | 'idea' | 'heart' | 'star' | 'place' | 'crown' | 'leaf';
  minAgeMonths: number;
  maxAgeMonths: number;
  durationMin: number;
  location: Location[];
  energy: Energy;
  tags: string[];
  saveable?: boolean;
  coverUrl?: string;
}

export interface FilterInputs {
  childAgeMonths?: number;
  timeWindow?: TimeWindow;
  location?: Location;
  mood?: Mood;
}

/**
 * Curated suggestion catalog for Discover.
 * Age in months: 0-12 months (0-1), 12-36 months (2-3), 36-60 months (4-5), 60+ months (6-7, 8+)
 */
export const DISCOVER_CATALOG: Suggestion[] = [
  {
    id: 'brincadeira-sensorial',
    title: 'Brincadeira Sensorial: Exploração Tátil',
    description: 'Atividade para estimular os sentidos. Use texturas diferentes (algodão, papel, plástico) para exploração segura.',
    icon: 'sparkles',
    minAgeMonths: 0,
    maxAgeMonths: 24,
    durationMin: 10,
    location: ['indoor'],
    energy: 'low',
    tags: ['sensorial', 'vínculo', 'calm'],
    saveable: false,
  },
  {
    id: 'respiracao-calma',
    title: 'Respiração em 4 Tempos',
    description: 'Técnica simples para acalmar você e as crianças. Inspire por 4, segure por 4, expire por 4.',
    icon: 'care',
    minAgeMonths: 12,
    maxAgeMonths: 120,
    durationMin: 5,
    location: ['indoor', 'outdoor'],
    energy: 'low',
    tags: ['respiração', 'calma', 'quick'],
    saveable: false,
  },
  {
    id: 'receita-rapida',
    title: 'Receita Rápida: Papinha Caseira',
    description: 'Prepare uma papinha nutritiva em menos de 15 minutos com ingredientes que você tem em casa.',
    icon: 'idea',
    minAgeMonths: 0,
    maxAgeMonths: 36,
    durationMin: 15,
    location: ['indoor'],
    energy: 'medium',
    tags: ['receita', 'rápido', 'alimentação'],
    saveable: false,
  },
  {
    id: 'momento-conexao',
    title: 'Momento de Conexão: 10 Minutos',
    description: 'Um ritual simples e afetuoso para fortalecer o vínculo com seus filhos todo dia.',
    icon: 'heart',
    minAgeMonths: 0,
    maxAgeMonths: 120,
    durationMin: 10,
    location: ['indoor', 'outdoor'],
    energy: 'low',
    tags: ['vínculo', 'conexão', 'calm'],
    saveable: false,
  },
  {
    id: 'danca-energia',
    title: 'Dança Energia',
    description: 'Escolha 2 músicas alegres, crie movimentos simples e finalize com respiração profunda.',
    icon: 'star',
    minAgeMonths: 12,
    maxAgeMonths: 84,
    durationMin: 6,
    location: ['indoor'],
    energy: 'high',
    tags: ['movimento', 'música', 'energetic', 'playful'],
    saveable: false,
  },
  {
    id: 'mapa-tesouros',
    title: 'Mapa de Tesouros do Quarto',
    description: 'Desenhe um mini mapa do quarto e marque pontos com objetos especiais. Uma jornada guiada.',
    icon: 'place',
    minAgeMonths: 12,
    maxAgeMonths: 84,
    durationMin: 15,
    location: ['indoor'],
    energy: 'medium',
    tags: ['criatividade', 'organização', 'playful'],
    saveable: false,
  },
  {
    id: 'exploracao-natureza',
    title: 'Exploração Natureza: Missão Folhas',
    description: 'Busque 3 folhas com cores diferentes, observe cheiros e texturas. Organize por preferência.',
    icon: 'leaf',
    minAgeMonths: 24,
    maxAgeMonths: 120,
    durationMin: 20,
    location: ['outdoor'],
    energy: 'medium',
    tags: ['natureza', 'sensorial', 'curiosidade'],
    saveable: false,
  },
  {
    id: 'historia-respiracao',
    title: 'Histórias Curtas com Respiração',
    description: 'Respirem juntos contando até quatro. Conte uma história em 3 frases e pergunte o que acharam.',
    icon: 'heart',
    minAgeMonths: 12,
    maxAgeMonths: 120,
    durationMin: 8,
    location: ['indoor'],
    energy: 'low',
    tags: ['vínculo', 'linguagem', 'calm'],
    saveable: false,
  },
  {
    id: 'circuito-movimento',
    title: 'Circuito Mini Equilíbrio',
    description: 'Crie um pequeno percurso com almofadas e móveis seguros para exploração motora.',
    icon: 'crown',
    minAgeMonths: 12,
    maxAgeMonths: 60,
    durationMin: 15,
    location: ['indoor'],
    energy: 'high',
    tags: ['movimento', 'equilíbrio', 'playful'],
    saveable: false,
  },
  {
    id: 'pintura-dedos',
    title: 'Pintura com Dedos Colorida',
    description: 'Mostre como espalhar tinta com as mãos. Crie desenhos livres e converse sobre cores.',
    icon: 'sparkles',
    minAgeMonths: 12,
    maxAgeMonths: 84,
    durationMin: 20,
    location: ['indoor'],
    energy: 'medium',
    tags: ['criatividade', 'sensorial', 'playful'],
    saveable: false,
  },
  {
    id: 'massagem-afetuosa',
    title: 'Massagem Afetuosa',
    description: 'Massageie braços e pernas com movimentos suaves. Finalize com carinho no rosto.',
    icon: 'care',
    minAgeMonths: 0,
    maxAgeMonths: 48,
    durationMin: 10,
    location: ['indoor'],
    energy: 'low',
    tags: ['vínculo', 'sensorial', 'calm'],
    saveable: false,
  },
];

/**
 * Filters and re-ranks suggestions based on user inputs.
 * Returns a filtered, sorted array of suggestions.
 */
export function filterAndRankSuggestions(
  suggestions: Suggestion[],
  filters: FilterInputs
): Suggestion[] {
  // Start with all suggestions
  let filtered = [...suggestions];

  // 1. Age filtering: prioritize perfect age fit, then allow near-fit
  if (filters.childAgeMonths !== undefined) {
    const ageMonths = filters.childAgeMonths;
    filtered = filtered.filter(
      (s) => ageMonths >= s.minAgeMonths && ageMonths <= s.maxAgeMonths
    );
  }

  // 2. Time window filtering
  if (filters.timeWindow && filters.timeWindow !== 'later') {
    const durationLimit: Record<string, number> = {
      'now-5': 5,
      'now-15': 15,
      'now-30': 30,
    };
    const limit = durationLimit[filters.timeWindow];
    if (limit) {
      // Filter to items within time window, but keep saveable items for "Save for later" CTA
      filtered = filtered.map((s) => ({
        ...s,
        saveable: s.durationMin > limit, // Mark as saveable if it's too long for this window
      }));
    }
  }

  // 3. Location filtering: boost matching items
  let ranked = filtered;
  if (filters.location) {
    ranked = ranked.sort((a, b) => {
      const aMatch = a.location.includes(filters.location!);
      const bMatch = b.location.includes(filters.location!);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  // 4. Mood/energy filtering: light re-rank toward matching energy
  if (filters.mood) {
    const moodToEnergy: Record<Mood, Energy[]> = {
      calm: ['low'],
      playful: ['medium', 'high'],
      focused: ['medium'],
      energetic: ['high'],
    };
    const targetEnergies = moodToEnergy[filters.mood];
    ranked = ranked.sort((a, b) => {
      const aMatch = targetEnergies.includes(a.energy);
      const bMatch = targetEnergies.includes(b.energy);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return ranked;
}

/**
 * Helper to check if a suggestion should show "Save for later" vs "Começar agora".
 */
export function shouldShowSaveForLater(suggestion: Suggestion, filters: FilterInputs): boolean {
  if (!filters.timeWindow || filters.timeWindow === 'later') return false;
  const durationLimit: Record<string, number> = {
    'now-5': 5,
    'now-15': 15,
    'now-30': 30,
    'later': Infinity,
  };
  const limit = durationLimit[filters.timeWindow];
  return suggestion.durationMin > limit;
}
