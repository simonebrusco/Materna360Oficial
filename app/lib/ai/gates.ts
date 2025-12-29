// app/lib/ai/gates.ts
import 'server-only'
import type { AIOrchestratorInput } from './orchestrator.types'

export function passesEmotionalGates(input: AIOrchestratorInput): boolean {
  // Gate 1 — intenção explícita
  if (!input.intent) return false
  return true
}
