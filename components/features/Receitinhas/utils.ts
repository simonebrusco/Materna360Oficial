export type RecipeCategory = 'refeicao' | 'cafe_lanche' | 'sobremesa' | 'bebida'
export type RecipeEnergy = 'exausta' | 'normal' | 'animada'
export type RecipeBudget = '$' | '$$' | '$$$'
export type PlanTier = 'free' | 'essencial' | 'premium'
export type AgeBucket = '0-6m' | '7-12m' | '1-2a' | '3-4a' | '5-6a'

export type RecipeIngredient = {
  item: string
  qty?: number
  unit?: string
  notes?: string
  optional?: boolean
  allergens?: string[]
  subs?: string[]
}

export type RecipeSuggestion = {
  id: string
  title: string
  badges: string[]
  summary: string
  time_total_min: number
  effort: string
  cost_tier: RecipeBudget
  equipment: string[]
  servings: number
  ingredients: RecipeIngredient[]
  steps: string[]
  age_adaptations?: Record<string, string>
  safety_notes?: string[]
  shopping_list?: string[]
  microcopy?: string
  racional?: string
}

export type RecipesApiResponse = {
  access: {
    denied: boolean
    limited_to_one: boolean
    message: string
  }
  query_echo: unknown
  suggestions: RecipeSuggestion[]
  aggregates: {
    consolidated_shopping_list: string[]
  }
}

export const mapMonthsToBucket = (ageMonths: number | null | undefined): AgeBucket => {
  if (ageMonths === null || ageMonths === undefined || Number.isNaN(ageMonths)) {
    return '1-2a'
  }
  if (ageMonths <= 6) {
    return '0-6m'
  }
  if (ageMonths <= 12) {
    return '7-12m'
  }
  if (ageMonths <= 24) {
    return '1-2a'
  }
  if (ageMonths <= 48) {
    return '3-4a'
  }
  return '5-6a'
}

export const formatBadgeLabel = (badge: string): string => {
  switch (badge) {
    case 'mais_rapida':
      return 'Mais rápida'
    case 'mais_economica':
      return 'Mais econômica'
    case 'kids_friendly':
      return 'Kids friendly'
    default:
      return badge
  }
}
