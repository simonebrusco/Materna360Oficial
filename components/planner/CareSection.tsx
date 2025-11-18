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
}

export default function CareSection({
  title,
  subtitle,
  icon,
  items,
  onToggle,
  onAdd,
  placeholder = 'Nova ação...',
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
    <div className="space-y-3">
      <div>
        <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
          <AppIcon name={icon as any} className="w-4 h-4 text-[#ff005e]" />
          {title}
        </h3>
        <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">{subtitle}</p>
      </div>

      <SoftCard className="p-4 md:p-5 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#545454]/60">Nenhuma ação ainda</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
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
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    item.done
                      ? 'text-[#545454]/50 line-through'
                      : 'text-[#2f3a56]'
                  }`}
                >
                  {item.title}
                </p>
                {item.source === 'from_hub' && item.origin && (
                  <p className="text-xs text-[#ff005e]/60 mt-1">
                    Origem: {item.origin}
                  </p>
                )}
              </div>
            </div>
          ))
        )}

        {!isAddingForm ? (
          <button
            onClick={() => setIsAddingForm(true)}
            className="mt-2 pt-2 border-t border-[#f0f0f0] inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar
          </button>
        ) : (
          <div className="mt-2 pt-2 border-t border-[#f0f0f0] space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={placeholder}
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
        )}
      </SoftCard>
    </div>
  )
}
