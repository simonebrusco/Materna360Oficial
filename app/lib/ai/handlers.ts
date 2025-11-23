// lib/ai/handlers.ts

import type { AIType, BaseAIResponse } from './types'

export function createStubAIResponse(type: AIType): BaseAIResponse {
  const defaultTitleMap: Record<AIType, string> = {
    rotina: 'IA de Rotina inicializada',
    emocional: 'IA Emocional inicializada',
    autocuidado: 'IA de Autocuidado inicializada',
    biblioteca: 'IA da Biblioteca inicializada',
    planner: 'IA do Planner inicializada',
  }

  const defaultBodyMap: Record<AIType, string> = {
    rotina:
      'Este endpoint de IA para Rotina Leve está pronto. A lógica inteligente será adicionada nas próximas PRs.',
    emocional:
      'Este endpoint de IA Emocional está pronto. Os insights reais serão adicionados nas próximas PRs.',
    autocuidado:
      'Este endpoint de IA para Autocuidado está pronto. As sugestões inteligentes serão adicionadas nas próximas PRs.',
    biblioteca:
      'Este endpoint de IA da Biblioteca Materna está pronto. As recomendações de conteúdo virão nas próximas PRs.',
    planner:
      'Este endpoint de IA para o Planner está pronto. As sugestões integradas serão adicionadas nas próximas PRs.',
  }

  return {
    version: 'p2',
    type,
    tone: 'materna360',
    title: defaultTitleMap[type],
    body: defaultBodyMap[type],
    meta: {
      safety: 'ok',
      disclaimer:
        'Conteúdo de IA em modo inicial (stub). Nenhuma recomendação real está sendo feita neste estágio.',
    },
  }
}
