// app/lib/ai/orchestrator.ts
import 'server-only'
import { passesEmotionalGates } from './gates'
import { getSafeFallbackSuggestions } from './fallback'
import { buildPrompt } from './prompts'
import type { AIOrchestratorInput, AIOrchestratorResult, AISuggestion } from './orchestrator.types'

// ⚠️ Stub de IA — nesta PR NÃO chamamos nenhum provider real
async function callAI(_prompt: string): Promise<AISuggestion[]> {
  return [
    { id: 'ai-1', title: 'Escolher uma tarefa pequena' },
    { id: 'ai-2', title: 'Organizar apenas o essencial' },
    { id: 'ai-3', title: 'Cuidar de você por 5 minutos' },
  ]
}

export async function runAIOrchestrator(input: AIOrchestratorInput): Promise<AIOrchestratorResult> {
  try {
    if (!passesEmotionalGates(input)) {
      return { type: 'fallback', reason: 'gate_blocked', suggestions: getSafeFallbackSuggestions() }
    }

    const prompt = buildPrompt(input)
    const suggestions = await callAI(prompt)
    return { type: 'success', suggestions }
  } catch {
    return { type: 'fallback', reason: 'error', suggestions: getSafeFallbackSuggestions() }
  }
}
