// app/lib/ai/orchestrator.types.ts
import 'server-only'

export type AIIntent = 'quick_idea' | 'help_choose'

export type AIOrchestratorInput = {
  intent: AIIntent
  context?: {
    energy?: 'low' | 'medium' | 'high'
    availableMinutes?: number
  }
}

export type AISuggestion = {
  id: string
  title: string
  description?: string
}

export type AIOrchestratorResult =
  | { type: 'success'; suggestions: AISuggestion[] }
  | {
      type: 'fallback'
      reason: 'no_intent' | 'gate_blocked' | 'error'
      suggestions: AISuggestion[]
    }
