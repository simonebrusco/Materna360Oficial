// app/lib/ai/emocionalSuggestions.ts

import { callAI } from './client'
import type { BaseAIResponse } from './types'
import type { MoodEntry } from './emocional'

export interface EmotionalSuggestionsPayload {
  locale?: string
  moodEntries: MoodEntry[]
}

export interface EmotionalSuggestion {
  tag: string
  title: string
  text: string
}

export interface EmotionalSuggestionsResponse extends BaseAIResponse {
  type: 'emocional'
  suggestions?: EmotionalSuggestion[]
}

/**
 * Endpoint dedicado para gerar sugestões semanais personalizadas.
 * Reutiliza o mesmo /api/ai/emocional (stub) através de callAI.
 */
export async function getWeeklySuggestions(
  payload: EmotionalSuggestionsPayload,
): Promise<EmotionalSuggestionsResponse> {
  return await callAI<EmotionalSuggestionsResponse, EmotionalSuggestionsPayload>({
    type: 'emocional',
    payload,
  })
}
