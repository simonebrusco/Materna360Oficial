'use client'

import React, { useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import { track } from '@/app/lib/telemetry'

type PriorityItem = {
  id: number
  text: string
  completed: boolean
}

export function DailyPriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([
    { id: 1, text: '', completed: false },
    { id: 2, text: '', completed: false },
    { id: 3, text: '', completed: false },
  ])

  const { addItem } = usePlannerSavedContents()

  const handleTextChange = (id: number, value: string) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, text: value } : p)),
    )
  }

  const handleToggleCompleted = (id: number) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p)),
    )
  }

  const handleSaveToPlanner = () => {
    const filled = priorities.filter((p) => p.text.trim().length > 0)

    if (filled.length === 0) {
      return
    }

    filled.forEach((p) => {
      addItem({
        origin: 'meu-dia',
        type: 'task',
        title: 'Prioridade do dia',
        payload: {
          text: p.text.trim(),
          completed: p.completed,
        },
      })
    })

    try {
      track('daily_priorities.saved', {
        count: filled.length,
        origin: 'meu-dia',
      })
    } catch {}
  }

  return (
    <SoftCard className="rounded-3xl border border-[#FFE8F2] bg-white p-5 md:p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs md:text-sm font-semibold uppercase tracking-wide text-[#ff005e]">
            Prioridades do Dia
          </p>
          <p className="mt-1 text-xs md:text-sm text-[#545454]">
            Escolha até três coisas que realmente importam para hoje.
          </p>
        </div>
        <AppIcon
          name="checklist"
          className="h-5 w-5 text-[#ff005e] md:h-6 md:w-6"
          decorative
        />
      </div>

      <div className="space-y-3">
        {priorities.map((priority) => (
          <div
            key={priority.id}
            className="flex items-center gap-3 rounded-2xl border border-[#FFE8F2] bg-[#fff] px-3 py-2.5 md:px-4 md:py-3"
          >
            {/* Checkbox estilizado */}
            <button
              type="button"
              onClick={() => handleToggleCompleted(priority.id)}
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs transition-colors ${
                priority.completed
                  ? 'border-[#ff005e] bg-[#ff005e] text-white'
                  : 'border-[#ffd8e6] bg-white text-transparent'
              }`}
            >
              ✓
            </button>

            {/* Campo de texto */}
            <input
              type="text"
              value={priority.text}
              onChange={(e) => handleTextChange(priority.id, e.target.value)}
              placeholder={`Prioridade ${priority.id}`}
              className="flex-1 border-none bg-transparent text-xs md:text-sm text-[#2f3a56] placeholder:text-[#545454]/40 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col items-end gap-2">
        <p className="text-[11px] text-[#545454]">
          Dica: se tudo for prioridade, nada é. Comece pelo que vai realmente
          aliviar seu dia.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveToPlanner}
          className="mt-1"
        >
          Salvar prioridades no planner
        </Button>
      </div>
    </SoftCard>
  )
}
