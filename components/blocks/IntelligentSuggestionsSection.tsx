'use client'

import React, { useEffect, useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export interface Suggestion {
  id: string
  title: string
  description?: string
}

type ApiSuggestion = {
  id?: string
  title?: string
  description?: string
}

interface IntelligentSuggestionsSectionProps {
  mood: string | null
  intention: string | null
}

// ---------- FALLBACK LOCAL (regra simples) ----------

function generateLocalSuggestions(
  mood: string | null,
  intention: string | null,
): Suggestion[] {
  if (!mood && !intention) {
    return []
  }

  if (intention === 'automático') {
    return [
      {
        id: 'automatico-1',
        title: 'Observe como você se sente ao longo do dia.',
        description:
          'Talvez seja hora de retomar o controle com pequenas escolhas.',
      },
      {
        id: 'automatico-2',
        title:
          'Comece anotando uma coisa que é realmente importante pra você hoje.',
      },
    ]
  }

  if (mood === 'stressed' && intention === 'slow') {
    return [
      {
        id: 'stressed-slow-1',
        title: 'Separe 5 minutos para respirar fundo e alongar o corpo.',
      },
      {
        id: 'stressed-slow-2',
        title:
          'Que tal uma pausa sem telas agora, só você e um copo de água?',
      },
    ]
  }

  if (mood === 'stressed' && intention === 'produtivo') {
    return [
      {
        id: 'stressed-prod-1',
        title:
          'Antes de mergulhar nas tarefas, escolha UMA prioridade principal.',
      },
      {
        id: 'stressed-prod-2',
        title:
          'Inclua uma pequena pausa entre os compromissos para evitar sobrecarga.',
      },
    ]
  }

  if (mood === 'happy' && intention === 'leve') {
    return [
      {
        id: 'happy-leve-1',
        title:
          'Aproveite para brincar ou conversar um pouco com seu filho hoje.',
      },
      {
        id: 'happy-leve-2',
        title:
          'Inclua um momento só seu, nem que sejam 10 min com algo que você gosta.',
      },
    ]
  }

  if (mood === 'happy' && intention === 'produtivo') {
    return [
      {
        id: 'happy-prod-1',
        title:
          'Use essa energia para tirar da frente uma tarefa que você vem adiando.',
      },
      {
        id: 'happy-prod-2',
        title: 'Defina claramente as suas 3 prioridades do dia.',
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
      },
    ]
  }

  if (mood === 'happy') {
    return [
      {
        id: 'happy-generic-1',
        title:
          'Use essa boa energia para conectar com as pessoas que você ama.',
      },
      {
        id: 'happy-generic-2',
        title: 'Que tal tentar algo novo hoje com essa disposição?',
      },
    ]
  }

  if (intention === 'focado') {
    return [
      {
        id: 'focado-1',
        title: 'Elimine as distrações: desligue notificações por um tempo.',
      },
      {
        id: 'focado-2',
        title:
          'Escolha uma única tarefa importante para as próximas horas.',
      },
    ]
  }

  if (intention === 'produtivo') {
    return [
      {
        id: 'prod-1',
        title: 'Defina suas 3 prioridades principais agora.',
      },
      {
        id: 'prod-2',
        title:
          'Organize o seu tempo em blocos de 90 minutos com pausas curtas.',
      },
    ]
  }

  if (intention === 'leve') {
    return [
      {
        id: 'leve-1',
        title:
          'Deixe espaço para o improviso e para as surpresas do dia.',
      },
      {
        id: 'leve-2',
        title: 'Lembre-se: você não precisa fazer tudo hoje.',
      },
    ]
  }

  if (intention === 'slow') {
    return [
      {
        id: 'slow-1',
        title: 'Curta os pequenos momentos do dia com atenção.',
      },
      {
        id: 'slow-2',
        title: 'Faça menos, mas com mais presença e propósito.',
      },
    ]
  }

  return []
}

// ---------- CHAMADA DE IA PARA SUGESTÕES DO DIA ----------

async function fetchAISuggestions(
  mood: string | null,
  intention: string | null,
): Promise<Suggestion[]> {
  try {
    const res = await fetch('/api/ai/meu-dia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'daily_suggestions',
        origin: 'meu-dia',
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
      throw new Error('Nenhuma sugestão recebida da IA')
    }

    const mapped: Suggestion[] = raw
      .map((item: ApiSuggestion, index: number) => {
        const title =
          typeof item.title === 'string' ? item.title.trim() : ''
        const description =
          typeof item.description === 'string'
            ? item.description.trim()
            : undefined

        if (!title) {
          return null
        }

        return {
          id: item.id || `ai-suggestion-${index}`,
          title,
          description,
        }
      })
      .filter((s): s is Suggestion => s !== null)

    if (!mapped.length) {
      throw new Error('Sugestões da IA inválidas')
    }

    return mapped
  } catch (error) {
    console.error(
      '[Meu Dia] Erro ao buscar sugestões inteligentes de IA, usando fallback local:',
      error,
    )
    return []
  }
}

// ---------- COMPONENTE PRINCIPAL ----------

export function IntelligentSuggestionsSection({
  mood,
  intention,
}: IntelligentSuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const hasSelection = Boolean(mood || intention)

  useEffect(() => {
    if (!hasSelection) {
      setSuggestions([])
      return
    }

    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      try {
        // 1) tenta IA
        const aiSuggestions = await fetchAISuggestions(mood, intention)

        // 2) se IA vier vazia, usa fallback local
        const finalSuggestions =
          aiSuggestions.length > 0
            ? aiSuggestions
            : generateLocalSuggestions(mood, intention)

        if (isMounted) {
          setSuggestions(finalSuggestions)
        }
      } catch {
        // fallback hard, se der algum erro inesperado
        if (isMounted) {
          setSuggestions(generateLocalSuggestions(mood, intention))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [mood, intention, hasSelection])

  return (
    <div className="w-full">
      <SoftCard className="p-5 md:p-6 rounded-3xl border border-[#ffd8e6] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
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
              Comece contando como você está e que tipo de dia você quer ter.
              Assim eu consigo sugerir algo que faça sentido pra você.
            </div>
          ) : isLoading ? (
            <div className="text-sm text-[#545454] font-poppins leading-relaxed">
              Estou pensando em algumas sugestões que combinam com o seu
              momento de hoje…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-sm text-[#545454] font-poppins leading-relaxed">
              Hoje, talvez o mais importante seja apenas respeitar o seu
              ritmo. Se quiser, defina uma única prioridade e deixe o resto
              mais leve.
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
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
            </div>
          )}
        </div>
      </SoftCard>
    </div>
  )
}
