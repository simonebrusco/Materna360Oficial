'use client'

import React, { useEffect, useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export interface Suggestion {
  id: string
  title: string
  description?: string
}

/**
 * Sugestões editoriais padrão (fallback)
 * — usadas quando a IA não responder ou quando vier vazio.
 */
function generateSuggestions(mood: string | null, intention: string | null): Suggestion[] {
  if (!mood && !intention) {
    return []
  }

  if (intention === 'automático') {
    return [
      {
        id: 'automatico-1',
        title: 'Observe como você se sente ao longo do dia.',
        description: 'Talvez seja hora de retomar o controle com pequenas escolhas.',
      },
      {
        id: 'automatico-2',
        title: 'Comece anotando uma coisa que é realmente importante pra você hoje.',
        description: '',
      },
    ]
  }

  if (mood === 'stressed' && intention === 'slow') {
    return [
      {
        id: 'stressed-slow-1',
        title: 'Separe 5 minutos para respirar fundo e alongar o corpo.',
        description: '',
      },
      {
        id: 'stressed-slow-2',
        title: 'Que tal uma pausa sem telas agora, só você e um copo de água?',
        description: '',
      },
    ]
  }

  if (mood === 'stressed' && intention === 'produtivo') {
    return [
      {
        id: 'stressed-prod-1',
        title: 'Antes de mergulhar nas tarefas, escolha UMA prioridade principal.',
        description: '',
      },
      {
        id: 'stressed-prod-2',
        title: 'Inclua uma pequena pausa entre os compromissos para evitar sobrecarga.',
        description: '',
      },
    ]
  }

  if (mood === 'happy' && intention === 'leve') {
    return [
      {
        id: 'happy-leve-1',
        title: 'Aproveite para brincar ou conversar um pouco com seu filho hoje.',
        description: '',
      },
      {
        id: 'happy-leve-2',
        title: 'Inclua um momento só seu, nem que sejam 10 min com algo que você gosta.',
        description: '',
      },
    ]
  }

  if (mood === 'happy' && intention === 'produtivo') {
    return [
      {
        id: 'happy-prod-1',
        title: 'Use essa energia para tirar da frente uma tarefa que você vem adiando.',
        description: '',
      },
      {
        id: 'happy-prod-2',
        title: 'Defina claramente as suas 3 prioridades do dia.',
        description: '',
      },
    ]
  }

  if (mood === 'stressed') {
    return [
      {
        id: 'stressed-generic-1',
        title: 'Comece o dia com uma ação pequena e alcançável.',
        description: 'Isso cria momentum e reduz a sensação de sobrecarga.',
      },
      {
        id: 'stressed-generic-2',
        title: 'Reserve um tempo para uma atividade que te acalme.',
        description: '',
      },
    ]
  }

  if (mood === 'happy') {
    return [
      {
        id: 'happy-generic-1',
        title: 'Use essa boa energia para conectar com as pessoas que você ama.',
        description: '',
      },
      {
        id: 'happy-generic-2',
        title: 'Que tal tentar algo novo hoje com essa disposição?',
        description: '',
      },
    ]
  }

  if (intention === 'focado') {
    return [
      {
        id: 'focado-1',
        title: 'Elimine as distrações: desligue notificações por um tempo.',
        description: '',
      },
      {
        id: 'focado-2',
        title: 'Escolha uma única tarefa importante para as próximas horas.',
        description: '',
      },
    ]
  }

  if (intention === 'produtivo') {
    return [
      {
        id: 'prod-1',
        title: 'Defina suas 3 prioridades principais agora.',
        description: '',
      },
      {
        id: 'prod-2',
        title: 'Organize o seu tempo em blocos de 90 minutos com pausas curtas.',
        description: '',
      },
    ]
  }

  if (intention === 'leve') {
    return [
      {
        id: 'leve-1',
        title: 'Deixe espaço para o improviso e para as surpresas do dia.',
        description: '',
      },
      {
        id: 'leve-2',
        title: 'Lembre-se: você não precisa fazer tudo hoje.',
        description: '',
      },
    ]
  }

  if (intention === 'slow') {
    return [
      {
        id: 'slow-1',
        title: 'Curta os pequenos momentos do dia com atenção.',
        description: '',
      },
      {
        id: 'slow-2',
        title: 'Faça menos, mas com mais presença e propósito.',
        description: '',
      },
    ]
  }

  return []
}

interface IntelligentSuggestionsSectionProps {
  mood: string | null
  intention: string | null
}

type ApiSuggestion = {
  id?: string
  title?: string
  description?: string
}

export function IntelligentSuggestionsSection({
  mood,
  intention,
}: IntelligentSuggestionsSectionProps) {
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const hasSelection = Boolean(mood || intention)

  // Chama a IA de Meu Dia sempre que humor/intenção mudarem,
  // com fallback automático para as sugestões editoriais.
  useEffect(() => {
    // Se não tem nada selecionado, limpamos estado e não chamamos IA
    if (!mood && !intention) {
      setAiSuggestions(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/ai/meu-dia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feature: 'intelligent_suggestions',
            mood,
            dayIntention: intention,
          }),
        })

        if (!res.ok) {
          throw new Error('Resposta inválida da IA')
        }

        const data = await res.json()
        const raw = data?.suggestions

        if (!Array.isArray(raw) || raw.length === 0) {
          if (!cancelled) {
            setAiSuggestions(null)
          }
          return
        }

        const mapped: Suggestion[] = raw
          .map((item: ApiSuggestion, index: number) => {
            const title = typeof item.title === 'string' ? item.title.trim() : ''
            const description =
              typeof item.description === 'string' ? item.description.trim() : ''

            if (!title) return null

            return {
              id: item.id || `ai-suggestion-${index}`,
              title,
              description,
            }
          })
          .filter((s): s is Suggestion => s !== null)

        if (!cancelled) {
          setAiSuggestions(mapped.length > 0 ? mapped : null)
        }
      } catch (error) {
        console.error('[Meu Dia] Erro ao buscar sugestões inteligentes:', error)
        if (!cancelled) {
          setAiSuggestions(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [mood, intention])

  // Decidimos aqui qual fonte usar:
  // 1) IA (quando veio algo válido)
  // 2) Fallback editorial (quando IA falha ou volta vazia)
  const effectiveSuggestions =
    aiSuggestions && aiSuggestions.length > 0
      ? aiSuggestions
      : generateSuggestions(mood, intention)

  return (
    <div className="w-full">
      <SoftCard className="p-5 md:p-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs md:text-sm font-semibold text-[#ff005e] uppercase tracking-wide mb-1 font-poppins">
              Sugestões inteligentes para o seu dia
            </p>
            <p className="text-xs md:text-sm text-[#545454]/70 font-poppins">
              Ideias rápidas pensadas para o seu momento.
            </p>
          </div>

          {!hasSelection ? (
            <div className="text-sm md:text-base text-[#545454] font-poppins leading-relaxed">
              Comece contando como você está e que tipo de dia você quer ter. Assim eu consigo
              sugerir algo que faça sentido pra você.
            </div>
          ) : (
            <div className="space-y-3">
              {isLoading && (!effectiveSuggestions || effectiveSuggestions.length === 0) && (
                <p className="text-xs md:text-sm text-[#545454] font-poppins">
                  Estou pensando em algumas ideias que combinam com o seu momento de hoje…
                </p>
              )}

              {effectiveSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <AppIcon
                      name="idea"
                      className="w-4 h-4 md:w-5 md:h-5 text-[#ff005e]"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm md:text-base font-semibold text-[#2f3a56] font-poppins">
                      {suggestion.title}
                    </p>
                    {suggestion.description && (
                      <p className="text-xs md:text-sm text-[#545454] font-poppins mt-1">
                        {suggestion.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {!isLoading && effectiveSuggestions.length === 0 && (
                <p className="text-xs md:text-sm text-[#545454] font-poppins">
                  Hoje eu não trouxe sugestões específicas, mas você sempre pode começar escolhendo
                  uma pequena ação que te faça bem agora.
                </p>
              )}
            </div>
          )}
        </div>
      </SoftCard>
    </div>
  )
}
