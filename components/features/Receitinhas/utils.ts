// components/features/Receitinhas/utils.ts

// Tipos base
export type RecipeCategory = 'refeicao' | 'cafe_lanche' | 'sobremesa' | 'bebida'
export type RecipeEnergy = 'exausta' | 'normal' | 'animada'
export type RecipeBudget = '$' | '$$' | '$$$'
export type PlanTier = 'free' | 'essencial' | 'premium'
export type AgeBucket = '0-6m' | '7-12m' | '1-2a' | '3-4a' | '5-6a'

// Ingrediente
export type RecipeIngredient = {
  item: string
  qty?: number | string
  unit?: string
  notes?: string
  optional?: boolean
  allergens?: string[]
  subs?: string[]
}

// Sugestão de receita
export type RecipeSuggestion = {
  id: string
  title: string
  summary: string
  time_total_min: number
  servings: number
  cost_tier: RecipeBudget
  // Campos opcionais para compatibilidade entre versões
  effort?: string
  equipment?: string[]
  badges?: string[]
  ingredients: RecipeIngredient[]
  steps: string[]
  // Em algumas versões é Record<string, string>; em outras é Partial<Record<AgeBucket, string>>
  age_adaptations?: Partial<Record<AgeBucket, string>> | Record<string, string>
  safety_notes?: string[]
  tips?: string[]
  shopping_list?: string[]
  microcopy?: string
  racional?: string
}

// Resposta da API de receitas
export type RecipesApiResponse = {
  access: {
    denied: boolean
    limited_to_one?: boolean
    message?: string
  }
  // Presentes em algumas versões
  query_echo?: unknown
  suggestions?: RecipeSuggestion[]
  aggregates?: {
    consolidated_shopping_list?: string[]
  }
}

// Mapeia meses para faixas etárias usadas nos badges e adaptações
export const mapMonthsToBucket = (ageMonths: number | null | undefined): AgeBucket => {
  if (ageMonths === null || ageMonths === undefined || Number.isNaN(ageMonths)) {
    return '1-2a'
  }
  const m = Math.max(0, Math.floor(ageMonths))
  if (m <= 6) return '0-6m'
  if (m <= 12) return '7-12m'
  if (m <= 24) return '1-2a'
  if (m <= 48) return '3-4a'
  return '5-6a'
}

// Normaliza labels de badges vindos da API (várias convenções possíveis)
export const formatBadgeLabel = (badge: string): string => {
  switch (badge) {
    // Convenções da sua versão no GitHub
    case 'mais_rapida':
      return 'Mais rápida'
    case 'mais_economica':
      return 'Mais econômica'
    case 'kids_friendly':
      return 'Kids friendly'
    // Convenções vistas em outras versões
    case 'rapida':
      return 'Rápida'
    case 'barata':
      return 'Barata'
    case 'pratica':
      return 'Prática'
    default:
      return badge.charAt(0).toUpperCase() + badge.slice(1)
  }
}
