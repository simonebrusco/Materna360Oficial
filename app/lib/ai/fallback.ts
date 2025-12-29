// app/lib/ai/fallback.ts
import 'server-only'
import type { AISuggestion } from './orchestrator.types'

export function getSafeFallbackSuggestions(): AISuggestion[] {
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Uma pausa curta já ajuda a reorganizar.' },
    { id: 'fallback-2', title: 'Escolher só uma prioridade', description: 'O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer algo simples', description: 'Algo pequeno já é suficiente por agora.' },
  ]
}
