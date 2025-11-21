'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

type CareItem = {
  id: string
  title: string
  done: boolean
  source?: 'manual' | 'from_hub'
  origin?: string
}

type CareSectionProps = {
  title: string
  subtitle: string
  icon: string
  items: CareItem[]
  onToggle: (id: string) => void
  onAdd: (title: string) => void
  placeholder?: string
  hideTitle?: boolean
}

export default function CareSection({
  title,
  subtitle,
  icon,
  items,
  onToggle,
  onAdd,
  placeholder = 'Nova ação...',
  hideTitle = false,
}: CareSectionProps) {
  const [isAddingForm, setIsAddingForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAddItem = () => {
    if (newTitle.trim()) {
      onAdd(newTitle)
      setNewTitle('')
      setIsAddingForm(false)
    }
  }

  return (
    <div className="space-y-3 flex-1 flex flex-col">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-base font-semibold text-[var(--color-text-main)] flex items-center gap-2 font-poppins">
            <AppIcon name={icon as any} className="w-4 h-4 text-[var(--color-brand)]" />
            {title}
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-0.5 font-poppins">{subtitle}</p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6 space-y-2 h-full flex flex-col">
        {items.length === 0 && !isAddingForm ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <p className="text-sm text-[var(--color-text-muted)]/60">
              {title === 'Cuidar de mim'
                ? 'Use este espaço para registrar pequenas pausas, respirações e gestos por você.'
                : 'Tarefas que aproximam sua família e organizam a rotina.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-0">
            {items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                item.done
                  ? 'bg-[var(--color-soft-bg)] border-[var(--color-border-soft)]'
                  : 'bg-white border-[var(--color-border-soft)] hover:border-[var(--color-brand)]/30'
              }`}
            >
              <button
                onClick={() => onToggle(item.id)}
                className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5"
                style={{
                  borderColor: item.done ? 'var(--color-brand)' : 'var(--color-border-muted)',
                  backgroundColor: item.done ? 'var(--color-brand)' : 'transparent',
                }}
              >
                {item.done && <AppIcon name="check" className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    item.done
                      ? 'text-[var(--color-text-muted)]/50 line-through'
                      : 'text-[var(--color-text-main)]'
                  }`}
                >
                  {item.title}
                </p>
                {item.source === 'from_hub' && item.origin && (
                  <p className="text-xs text-[var(--color-brand)]/60 mt-1">
                    Origem: {item.origin}
                  </p>
                )}
              </div>
              </div>
            ))}
          </div>
        )}

        {!isAddingForm ? (
          <button
            onClick={() => setIsAddingForm(true)}
            className="mt-2 pt-2 border-t border-[var(--color-border-soft)] inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar
          </button>
        ) : (
          <div className="mt-2 pt-2 border-t border-[var(--color-border-soft)] space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg border border-[#EDEDED] text-sm text-[var(--color-text-main)] placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                className="flex-1 px-3 py-2 bg-[var(--color-brand)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand)]/90 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setIsAddingForm(false)
                  setNewTitle('')
                }}
                className="px-3 py-2 bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] rounded-lg text-xs font-semibold hover:bg-[var(--color-soft-bg)]/80 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </SoftCard>
    </div>
  )
}
