'use client'

import React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import type { PlannerTask } from './MeuDiaPremium'

interface CuidarDeMimSectionProps {
  tasks: PlannerTask[]
  onToggle: (taskId: string) => void
  onTogglePriority: (taskId: string) => void
  onAddTask: (title: string) => void
}

export default function CuidarDeMimSection({
  tasks,
  onToggle,
  onTogglePriority,
  onAddTask,
}: CuidarDeMimSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AppIcon name="heart" className="w-5 h-5 text-[var(--color-brand)]" />
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-main)]">Cuidar de Mim</h2>
        <span className="text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Soft Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`rounded-[16px] border border-black/5 p-4 transition-all ${
              task.done
                ? 'bg-[#f5f5f5] shadow-sm'
                : 'bg-gradient-to-br from-pink-50 to-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]'
            }`}
          >
            <div className="space-y-3">
              {/* Checkbox + Title */}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(task.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                    task.done
                      ? 'bg-[var(--color-brand)] border-[var(--color-brand)]'
                      : 'border-[#ddd] hover:border-[var(--color-brand)]'
                  }`}
                >
                  {task.done && <AppIcon name="check" className="w-4 h-4 text-white" />}
                </button>
                <span
                  className={`text-sm font-medium transition-all ${
                    task.done
                      ? 'text-[var(--color-text-muted)]/50 line-through'
                      : 'text-[var(--color-text-main)]'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {/* Priority Toggle */}
              <div className="flex justify-end">
                <button
                  onClick={() => onTogglePriority(task.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    task.priority === 'alta'
                      ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                      : 'bg-white border border-[#ddd] text-[var(--color-text-muted)]/60 hover:border-[var(--color-brand)]'
                  }`}
                >
                  {task.priority === 'alta' ? 'Essencial' : 'Bônus'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Task */}
      <button
        onClick={() => onAddTask('Nova atividade de autocuidado')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors mt-2"
      >
        <AppIcon name="plus" className="w-4 h-4" />
        Adicionar atividade
      </button>
    </div>
  )
}
