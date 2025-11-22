'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { PlannerTask } from './MeuDiaPremium'

interface CuidarDoMeuFilhoSectionProps {
  tasks: PlannerTask[]
  onToggle: (taskId: string) => void
  onTogglePriority: (taskId: string) => void
  onAddTask: (title: string) => void
}

export default function CuidarDoMeuFilhoSection({
  tasks,
  onToggle,
  onTogglePriority,
  onAddTask,
}: CuidarDoMeuFilhoSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AppIcon name="smile" className="w-5 h-5 text-[var(--color-brand)]" />
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-main)]">Cuidar do Meu Filho</h2>
        <span className="text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Compact Cards Grid - 3 columns on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`rounded-[14px] border border-black/5 p-3 transition-all ${
              task.done
                ? 'bg-[var(--color-soft-bg)] shadow-sm'
                : 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
            }`}
          >
            {/* Checkbox - Larger hit area */}
            <button
              onClick={() => onToggle(task.id)}
              className={`w-full flex items-center gap-2 mb-2 ${
                task.done ? 'opacity-50' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  task.done
                    ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
                    : 'border-[var(--color-border-muted)] hover:border-[var(--color-brand)]'
                }`}
              >
                {task.done && <AppIcon name="check" className="w-3 h-3 text-white" />}
              </div>
              <span
                className={`text-xs font-medium transition-all line-clamp-2 ${
                  task.done
                    ? 'text-[var(--color-text-muted)]/40 line-through'
                    : 'text-[var(--color-text-main)]'
                }`}
              >
                {task.title}
              </span>
            </button>

            {/* Priority Badge */}
            <button
              onClick={() => onTogglePriority(task.id)}
              className={`w-full text-center px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                task.priority === 'alta'
                  ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                  : 'bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]/50 text-[10px]'
              }`}
            >
              {task.priority === 'alta' ? '★ Prioridade' : 'Normal'}
            </button>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <button
        onClick={() => onAddTask('Nova atividade com a criança')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors mt-2"
      >
        <AppIcon name="plus" className="w-4 h-4" />
        Adicionar atividade
      </button>
    </div>
  )
}
