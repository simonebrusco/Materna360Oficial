'use client'

import { useState } from 'react'
import { runAIOrchestrator } from '@/app/lib/ai/orchestrator'
import type { AISuggestion } from '@/app/lib/ai/orchestrator.types'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: AISuggestion[] }

export default function QuickIdeaAI() {
  const [state, setState] = useState<State>({ status: 'idle' })

  async function handleClick() {
    setState({ status: 'loading' })

    const res = await runAIOrchestrator({ intent: 'quick_idea' })

    setState({
      status: 'done',
      items: res.suggestions,
    })
  }

  return (
    <SoftCard>
      {state.status === 'idle' && (
        <Button onClick={handleClick} variant="ghost">
          Me dá uma ideia rápida
        </Button>
      )}

      {state.status === 'loading' && (
        <p className="text-sm text-muted-foreground">
          Pensando em algo simples…
        </p>
      )}

      {state.status === 'done' && (
        <div className="space-y-2">
          {state.items.map(item => (
            <SoftCard key={item.id}>
              <p className="font-medium">{item.title}</p>
              {item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </SoftCard>
          ))}
        </div>
      )}
    </SoftCard>
  )
}
