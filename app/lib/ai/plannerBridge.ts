// app/lib/ai/plannerBridge.ts
// Ponte entre respostas de IA e o Planner (usePlannerSavedContents).
// Aqui padronizamos como Ideias, Receitas e Inspirações são salvas,
// sem precisar repetir lógica em cada tela.

'use client'

export type PlannerOrigin =
  | 'rotina-leve'
  | 'como-estou-hoje'
  | 'autocuidado-inteligente'
  | 'cuidar-com-amor'
  | 'minhas-conquistas'
  | 'biblioteca-materna'

export type PlannerContentType =
  | 'note'
  | 'checklist'
  | 'task'
  | 'recipe'
  | 'goal'
  | 'insight'
  | 'event'

type PlannerAddItemFn = (input: {
  origin: PlannerOrigin
  type: PlannerContentType
  title: string
  payload: any
}) => any

// Tipos mínimos para não engessar a IA (podem ter mais campos)
export type QuickIdeaSuggestion = {
  title?: string
  description?: string
  [key: string]: any
}

export type SmartRecipe = {
  title?: string
  ingredientePrincipal?: string
  tipoRefeicao?: string
  tempoPreparo?: number | string | null
  [key: string]: any
}

export type EmotionalInspiration = {
  phrase?: string
  care?: string
  ritual?: string
  [key: string]: any
}

/**
 * Salva uma sugestão de Ideia Rápida no planner.
 *
 * origin: normalmente 'rotina-leve'
 * type: 'task' (ou 'note', se você preferir depois)
 */
export function saveQuickIdeaToPlanner(
  addItem: PlannerAddItemFn,
  suggestion: QuickIdeaSuggestion,
  origin: PlannerOrigin = 'rotina-leve',
) {
  const title =
    (typeof suggestion.title === 'string' && suggestion.title.trim()) ||
    'Ideia para deixar o dia mais leve'

  return addItem({
    origin,
    type: 'task',
    title,
    payload: suggestion,
  })
}

/**
 * Salva uma Receita Inteligente no planner.
 *
 * origin: normalmente 'rotina-leve'
 * type: 'recipe'
 */
export function saveRecipeToPlanner(
  addItem: PlannerAddItemFn,
  recipe: SmartRecipe,
  origin: PlannerOrigin = 'rotina-leve',
) {
  const title =
    (typeof recipe.title === 'string' && recipe.title.trim()) ||
    'Receita sugerida pela IA'

  return addItem({
    origin,
    type: 'recipe',
    title,
    payload: recipe,
  })
}

/**
 * Salva uma Inspiração do Dia / Insight emocional no planner.
 *
 * origin: normalmente 'como-estou-hoje'
 * type: 'insight'
 */
export function saveInspirationToPlanner(
  addItem: PlannerAddItemFn,
  inspiration: EmotionalInspiration,
  origin: PlannerOrigin = 'como-estou-hoje',
) {
  const title =
    (typeof inspiration.phrase === 'string' && inspiration.phrase.trim()) ||
    'Inspiração do dia'

  return addItem({
    origin,
    type: 'insight',
    title,
    payload: inspiration,
  })
}
