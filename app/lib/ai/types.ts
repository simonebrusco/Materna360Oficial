// lib/ai/types.ts

export type AIType = 'rotina' | 'emocional' | 'autocuidado' | 'biblioteca' | 'planner'

export type AISafetyStatus = 'ok' | 'blocked'

export interface BaseAIRequest {
  userId?: string | null
  locale?: 'pt-BR' | string
}

export interface BaseAIResponse {
  version: 'p2'
  type: AIType
  tone: 'materna360'
  title: string
  body: string
  meta?: {
    safety: AISafetyStatus
    disclaimer?: string
  }
}
