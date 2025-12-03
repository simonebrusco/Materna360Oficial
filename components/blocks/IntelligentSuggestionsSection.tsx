'use client'

import React, { useEffect, useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { toast } from '@/app/lib/toast'
import { updateXP } from '@/app/lib/xp'
import { track } from '@/app/lib/telemetry'

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
    try {
      track('meu_dia.intelligent_suggestions.requested', {
        origin: 'meu-dia',
        mood,
        intention,
      })
    } catch {
      // telemetria nunca quebra UX
    }

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
      .filter((item: ApiSuggestion) => {
        if (typeof item.title !== 'string') return false
        return item.title.trim().length > 0
      })
      .map((item: ApiSuggestion, index: number) => {
        const title = (item.title as string).trim()
        const description =
          typeof item.description === 'string'
            ? item.description.trim()
            : undefined

        return {
          id: item.id || `ai-suggestion-${index}`,
          title,
          description,
        }
      })

    if (!mapped.length) {
      throw new Error('Sugestões da IA inválidas')
    }

    try {
      track('meu_dia.intelligent_suggestions.generated', {
        origin: 'meu-dia',
        count: mapped.length,
      })
    } catch {
      // ignora
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

  const { addItem } = usePlannerSavedContents()

  useEffect(() => {
    if (!hasSelection) {
      setSuggestions([])
      return
    }

    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      try {
        const aiSuggestions = await fetchAISuggestions(mood, intention)

        const finalSuggestions =
          aiSuggestions.length > 0
            ? aiSuggestions
            : generateLocalSuggestions(mood, intention)

        if (isMounted) {
          setSuggestions(finalSuggestions)
        }
      } catch {
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

  const handleSaveSuggestionToPlanner = (suggestion: Suggestion) => {
    try {
      addItem({
        origin: 'meu-dia', // origin válido
        type: 'insight',
        title: suggestion.title,
        payload: {
          description: suggestion.description ?? null,
          source: 'intelligent_suggestions',
        },
      })

      try {
        void updateXP(8)
      } catch (e) {
        console.error(
          '[Meu Dia] Erro ao atualizar XP (intelligent suggestions):',
          e,
        )
      }

      try {
        track('meu_dia.intelligent_suggestion.saved', {
          origin: 'meu-dia',
          suggestionId: suggestion.id,
        })
      } catch {
        // ignora
      }

      toast.success('Sugestão salva no planner 💗')
    } catch (error) {
      console.error(
        '[Meu Dia] Erro ao salvar sugestão no planner:',
        error,
      )
      toast.danger('Não foi possível salvar a sugestão agora.')
    }
  }

  return (
    <div className="w-full h-full">
      <SoftCard className="h-full flex flex-col rounded-3xl bg-white/95 border border-[var(--color-soft-strong)] shadow-[0_16px_40px_rgba(0,0,0,0.08)] p-4 md:p-6">
        <div className="space-y-1.5">
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
            Sugestões inteligentes para o seu dia
          </p>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
            Ideias rápidas pensadas para o seu momento.
          </p>
        </div>

        <div className="mt-3 md:mt-4 flex-1 flex">
          {!hasSelection ? (
            <div className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
              Comece contando como você está e que tipo de dia você quer
              ter. Assim eu consigo sugerir algo que faça sentido pra você.
            </div>
          ) : isLoading ? (
            <div className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
              Estou pensando em algumas sugestões que combinam com o seu
              momento de hoje…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
              Hoje, talvez o mais importante seja apenas respeitar o seu
              ritmo. Se quiser, defina uma única prioridade e deixe o resto
              mais leve.
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex flex-col gap-2 rounded-2xl bg-white/90 border border-[var(--color-soft-strong)]/70 px-3 py-3 md:px-4 md:py-3"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <AppIcon
                        name="idea"
                        className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-brand)]"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
                        {suggestion.title}
                      </p>
                      {suggestion.description && (
                        <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm" // <-- ajuste aqui: de "xs" para "sm"
                      onClick={() => handleSaveSuggestionToPlanner(suggestion)}
                      className="text-[11px] md:text-xs px-3 py-1 rounded-full border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white transition-colors"
                    >
                      Salvar no planner
                    </Button>
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

