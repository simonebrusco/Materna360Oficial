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
          <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
            <AppIcon name="target" className="w-4 h-4 text-[#ff005e]" />
            Top 3 do dia
          </h3>
          <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">
            As três coisas que realmente importam hoje.
          </p>
        </div>
      )}

      <SoftCard className="p-5 md:p-6 space-y-3 h-full flex flex-col">
        <div className="flex-1 flex flex-col space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.done
                  ? 'bg-[#f5f5f5] border-[#ddd]'
                  : 'bg-white border-[#f0f0f0] hover:border-[#ff005e]/20'
              }`}
            >
              <button
                onClick={() => onToggle(item.id)}
                className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5"
                style={{
                  borderColor: item.done ? '#ff005e' : '#ddd',
                  backgroundColor: item.done ? '#ff005e' : 'transparent',
                }}
              >
                {item.done && <AppIcon name="check" className="w-3 h-3 text-white" />}
              </button>
              <span
                className={`flex-1 text-sm font-medium ${
                  item.done
                    ? 'text-[#545454]/50 line-through'
                    : 'text-[#2f3a56]'
                }`}
              >
                {item.title}
              </span>
              <span className="text-xs font-bold text-[#ff005e]/60">{idx + 1}.</span>
            </div>
          ))}

          {emptySlots > 0 &&
            Array.from({ length: emptySlots }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[#ddd] bg-[#fafafa]"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#ddd] opacity-40" />
                <span className="flex-1 text-sm text-[#545454]/40">
                  Espaço {items.length + idx + 1}
                </span>
                <span className="text-xs font-bold text-[#545454]/20">
                  {items.length + idx + 1}.
                </span>
              </div>
            ))}
        </div>

        {allComplete && (
          <div className="mt-auto p-3 rounded-lg bg-gradient-to-r from-[#ffe3f0] to-[#fff] border border-[#ff005e]/20 text-center">
            <p className="text-sm font-semibold text-[#ff005e]">
              Parabéns! Você concluiu seus 3 focos principais
            </p>
          </div>
        )}

        {!isAddingForm && items.length < 3 ? (
          <button
            onClick={() => setIsAddingForm(true)}
            className="mt-2 pt-3 border-t border-[#f0f0f0] inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar foco
          </button>
        ) : isAddingForm ? (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Novo foco do dia..."
              className="w-full px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                className="flex-1 px-3 py-2 bg-[#ff005e] text-white rounded-lg text-xs font-semibold hover:bg-[#ff005e]/90 transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setIsAddingForm(false)
                  setNewTitle('')
                }}
                className="px-3 py-2 bg-[#f5f5f5] text-[#545454] rounded-lg text-xs font-semibold hover:bg-[#e5e5e5] transition-colors"
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
