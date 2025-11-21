'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

type Top3Item = {
  id: string
  title: string
  done: boolean
}

type Top3SectionProps = {
  items: Top3Item[]
  onToggle: (id: string) => void
  onAdd: (title: string) => void
  hideTitle?: boolean
}

export default function Top3Section({
  items,
  onToggle,
  onAdd,
  hideTitle = false,
}: Top3SectionProps) {
  const [isAddingForm, setIsAddingForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAddItem = () => {
    if (newTitle.trim() && items.length < 3) {
      onAdd(newTitle)
      setNewTitle('')
      setIsAddingForm(false)
    }
  }

  const allComplete = items.length === 3 && items.every(item => item.done)
  const emptySlots = 3 - items.length

  return (
    <div className="space-y-3 flex-1 flex flex-col">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-base font-semibold text-[var(--color-text-main)] flex items-center gap-2 font-poppins">
            <AppIcon name="target" className="w-4 h-4 text-[var(--color-brand)]" />
            Top 3 do dia
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-0.5 font-poppins">
            As três coisas que realmente importam hoje.
          </p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6 space-y-3 h-full flex flex-col">
        <div className="flex-1 flex flex-col space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
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
              <span
                className={`flex-1 text-sm font-medium ${
                  item.done
                    ? 'text-[var(--color-text-muted)]/50 line-through'
                    : 'text-[var(--color-text-main)]'
                }`}
              >
                {item.title}
              </span>
              <span className="text-xs font-bold text-[var(--color-brand)]/60">{idx + 1}.</span>
            </div>
          ))}

          {emptySlots > 0 &&
            Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-[var(--color-border-soft)] bg-[var(--color-soft-bg)]"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[var(--color-border-muted)] opacity-40" />
                <span className="flex-1 text-sm text-[var(--color-text-muted)]/40">
                  Espaço {items.length + idx + 1}
                </span>
                <span className="text-xs font-bold text-[var(--color-text-muted)]/20">
                  {items.length + idx + 1}.
                </span>
              </div>
            ))}
        </div>

        {allComplete && (
          <div className="mt-auto p-3 rounded-lg bg-gradient-to-r from-[var(--color-soft-strong)] to-[var(--color-page-bg)] border border-[var(--color-brand)]/20 text-center">
            <p className="text-sm font-semibold text-[var(--color-brand)]">
              Parabéns! Você concluiu seus 3 focos principais
            </p>
          </div>
        )}

        {!isAddingForm && items.length < 3 ? (
          <button
            onClick={() => setIsAddingForm(true)}
            className="mt-2 pt-3 border-t border-[#F0F0F0] inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar foco
          </button>
        ) : isAddingForm ? (
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Novo foco do dia..."
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
        ) : null}
      </SoftCard>
    </div>
  )
}
