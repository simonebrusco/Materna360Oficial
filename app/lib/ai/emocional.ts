// app/lib/ai/emocional.ts

import { callAI } from './client'
import type { BaseAIResponse } from './types'

export interface MoodEntry {
  date: string
  mood: string
  energy?: 'baixa' | 'media' | 'alta' | string
}

export interface EmotionalAIRequestPayload {
  userId?: string | null
  locale?: 'pt-BR' | string
  moodEntries: MoodEntry[]
  timeRange?: 'last_7_days' | 'last_30_days' | string
}

export interface EmotionalHighlight {
  label: string
  text: string
}

export interface EmotionalAction {
  id: string
  label: string
  target?: string
}

export interface EmotionalAIResponse extends BaseAIResponse {
  type: 'emocional'
  highlights?: EmotionalHighlight[]
  actions?: EmotionalAction[]
}

export async function getEmotionalInsights(
  payload: EmotionalAIRequestPayload,
): Promise<EmotionalAIResponse> {
  return await callAI<EmotionalAIResponse, EmotionalAIRequestPayload>({
    type: 'emocional',
    payload,
  })
}
