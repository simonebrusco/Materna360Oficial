// app/lib/ai/prompts.ts
import 'server-only'
import type { AIOrchestratorInput } from './orchestrator.types'

export function buildPrompt(input: AIOrchestratorInput): string {
  if (input.intent === 'quick_idea') {
    return `
Sugira 3 ideias simples e rápidas.
Regras:
- Sem cobrança
- Sem metas
- Sem menção a tempo passado ou futuro
- Tom acolhedor e neutro
- Frases curtas
`
  }

  return `
Sugira opções simples.
Regras:
- Tom neutro
- Sem julgamento
`
}
