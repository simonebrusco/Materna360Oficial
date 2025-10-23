export type RecipeTimeOption = '<=15' | '<=30' | '<=45' | '>45'
export type RecipeCourseOption =
  | 'prato_quente'
  | 'sopas_caldo'
  | 'saladas'
  | 'lanches_rapidos'
  | 'sobremesas'
  | 'sucos_smoothies'
export type RecipeDietaryOption = 'vegetariano' | 'vegano' | 'sem_lactose' | 'sem_gluten' | 'sem_acucar_adicionado'
export type RecipeAgeBand = '6-8m' | '9-12m' | '1-2y' | '2-6y'

export type RecipePlannerSuggestion = {
  suggestedCategory: 'Café da manhã' | 'Almoço' | 'Jantar' | 'Lanche'
  suggestedWindow: RecipeTimeOption
  tags: string[]
}

export type RecipeIngredient = {
  name: string
  quantity?: string
  usesPantry?: boolean
  providedByUser?: boolean
}

export type HealthyRecipe = {
  title: string
  readyInMinutes: number
  servings: number
  ageBand: RecipeAgeBand
  rationale: string[]
  ingredients: RecipeIngredient[]
  steps: string[]
  textureNote?: string
  safetyNotes?: string[]
  nutritionBadge?: string[]
  planner: RecipePlannerSuggestion
}

export type RecipeGenerationResponse = {
  educationalMessage: string | null
  noResultMessage: string | null
  recipes: HealthyRecipe[]
}

export type RecipeGenerationRequest = {
  ingredients: string[]
  filters: {
    courses?: RecipeCourseOption[]
    dietary?: RecipeDietaryOption[]
    time?: RecipeTimeOption
  }
  servings: number
  child: {
    months: number
    allergies?: string[]
  }
  variationOf?: string | null
}

export const MAX_RECIPE_RESULTS = 3

export const BREASTFEEDING_MESSAGE =
  'Até os 6 meses, o Ministério da Saúde recomenda amamentação exclusiva. Converse com seu pediatra antes de introduzir novos alimentos.'

export function mapMonthsToRecipeBand(months: number): RecipeAgeBand {
  if (!Number.isFinite(months) || months < 6) {
    return '6-8m'
  }

  if (months <= 8) {
    return '6-8m'
  }

  if (months <= 12) {
    return '9-12m'
  }

  if (months <= 24) {
    return '1-2y'
  }

  return '2-6y'
}

export function normalizeList(values: string[]): string[] {
  const seen = new Set<string>()

  return values
    .map((value) => value.trim())
    .filter((value) => {
      if (!value) {
        return false
      }
      const key = value.toLocaleLowerCase('pt-BR')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
}

export function sanitizeAllergies(raw?: string[] | null): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return normalizeList(raw)
}

export function sanitizeIngredients(raw?: string[] | null): string[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return normalizeList(raw)
}

export function isUnderSixMonths(months: number): boolean {
  return Number.isFinite(months) && months < 6
}

export function applyAllergyFilter(recipe: HealthyRecipe, allergies: string[]): HealthyRecipe {
  if (!allergies.length) {
    return recipe
  }

  const loweredAllergies = allergies.map((item) => item.toLocaleLowerCase('pt-BR'))
  const removed: string[] = []

  const safeIngredients = recipe.ingredients.filter((ingredient) => {
    const ingredientName = ingredient.name.toLocaleLowerCase('pt-BR')
    const containsAllergen = loweredAllergies.some((allergen) => ingredientName.includes(allergen))
    if (containsAllergen) {
      removed.push(ingredient.name)
      return false
    }
    return true
  })

  const nextSafetyNotes = Array.isArray(recipe.safetyNotes) ? [...recipe.safetyNotes] : []

  if (removed.length > 0) {
    const formatted = removed.map((item) => `Ingrediente removido devido à alergia registrada: ${item}.`)
    nextSafetyNotes.push(...formatted)
  }

  return {
    ...recipe,
    ingredients: safeIngredients,
    safetyNotes: nextSafetyNotes,
  }
}

export function ensureRecipeCompliance(
  payload: RecipeGenerationResponse,
  allergies: string[]
): RecipeGenerationResponse {
  const recipes = Array.isArray(payload.recipes) ? payload.recipes.slice(0, MAX_RECIPE_RESULTS) : []

  const sanitizedRecipes = recipes.map((recipe) => {
    const rationale = Array.isArray(recipe.rationale) ? recipe.rationale.filter(Boolean) : []
    const steps = Array.isArray(recipe.steps) ? recipe.steps.filter(Boolean) : []
    const ingredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
          .map((ingredient) => ({
            ...ingredient,
            name: ingredient.name.trim(),
          }))
          .filter((ingredient) => ingredient.name.length > 0)
      : []

    const filtered = applyAllergyFilter(
      {
        ...recipe,
        rationale,
        steps,
        ingredients,
        safetyNotes: Array.isArray(recipe.safetyNotes) ? recipe.safetyNotes.filter(Boolean) : [],
        nutritionBadge: Array.isArray(recipe.nutritionBadge) ? recipe.nutritionBadge.filter(Boolean) : [],
      },
      allergies
    )

    return {
      ...filtered,
      planner: {
        suggestedCategory: filtered.planner?.suggestedCategory ?? 'Almoço',
        suggestedWindow: filtered.planner?.suggestedWindow ?? '<=30',
        tags: Array.isArray(filtered.planner?.tags) ? filtered.planner.tags : ['receita'],
      },
    }
  })

  return {
    educationalMessage: payload.educationalMessage ?? null,
    noResultMessage: payload.noResultMessage ?? null,
    recipes: sanitizedRecipes,
  }
}

export function validateRecipeResponseShape(payload: unknown): asserts payload is RecipeGenerationResponse {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Resposta inesperada do gerador de receitas')
  }

  const typed = payload as Record<string, unknown>
  if (!('recipes' in typed)) {
    throw new Error('Campo "recipes" ausente na resposta')
  }

  const recipes = Array.isArray(typed.recipes) ? typed.recipes : []
  if (recipes.length > MAX_RECIPE_RESULTS) {
    throw new Error('Quantidade de receitas acima do permitido')
  }

  for (const recipe of recipes) {
    const item = recipe as Record<string, unknown>
    if (typeof item.title !== 'string' || !item.title.trim()) {
      throw new Error('Receita sem título válido')
    }
    if (!Number.isFinite(item.readyInMinutes)) {
      throw new Error(`Receita "${item.title}" sem tempo válido`)
    }
    if (!Number.isFinite(item.servings)) {
      throw new Error(`Receita "${item.title}" sem porções válidas`)
    }
    if (typeof item.ageBand !== 'string') {
      throw new Error(`Receita "${item.title}" sem faixa etária definida`)
    }
    if (!Array.isArray(item.ingredients)) {
      throw new Error(`Receita "${item.title}" sem ingredientes válidos`)
    }
    if (!Array.isArray(item.steps)) {
      throw new Error(`Receita "${item.title}" sem passos válidos`)
    }
    if (!item.planner || typeof item.planner !== 'object') {
      throw new Error(`Receita "${item.title}" sem sugestão de planner`)
    }
  }
}
