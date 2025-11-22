// app/lib/ai/rotina.ts

import { callAI } from './client'
import type { BaseAIResponse } from './types'

export type RotinaMode = 'ideias_rapidas' | 'receitas' | 'inspiracoes'

export interface RotinaDayContext {
  weekday?: string
  timeOfDay?: 'manha' | 'tarde' | 'noite'
  energyLevel?: 'baixa' | 'media' | 'alta'
  hasKids?: boolean
}

export interface RotinaPreferences {
  quickMeals?: boolean
  lowBudget?: boolean
}

export interface RotinaAIRequestPayload {
  userId?: string | null
  locale?: 'pt-BR' | string
  mode: RotinaMode
  dayContext?: RotinaDayContext
  preferences?: RotinaPreferences
}

export interface RotinaAIItem {
  id: string
  label?: string
  text: string
}

export interface RotinaPlannerSuggestion {
  id: string
  label?: string
  text: string
  tag?: string
}

export interface RotinaAIResponse extends BaseAIResponse {
  type: 'rotina'
  items?: RotinaAIItem[]
  plannerSuggestions?: RotinaPlannerSuggestion[]
}

/**
 * Helper seguro para chamar a IA de Rotina Leve.
 * Ainda não está acoplado a nenhum componente de UI.
 */
export async function getRotinaAISuggestions(
  payload: RotinaAIRequestPayload,
): Promise<RotinaAIResponse> {
  return await callAI<RotinaAIResponse, RotinaAIRequestPayload>({
    type: 'rotina',
    payload,
  })
}
