'use client'

import React, { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

type Appointment = {
  id: string
  time: string
  title: string
  tag?: string
  notes?: string
}

type AgendaSectionProps = {
  items: Appointment[]
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void
  hideTitle?: boolean
}

export default function AgendaSection({
  items,
  onAddAppointment,
  hideTitle = false,
}: AgendaSectionProps) {
  const [isAddingForm, setIsAddingForm] = useState(false)
  const [formData, setFormData] = useState({
    time: '',
    title: '',
    tag: 'Casa' as string,
  })

  const tagOptions = ['Casa', 'Trabalho', 'Filho', 'Saúde', 'Outro']

  const handleAddAppointment = () => {
    if (formData.time.trim() && formData.title.trim()) {
      onAddAppointment({
        time: formData.time,
        title: formData.title,
        tag: formData.tag || undefined,
      })
      setFormData({ time: '', title: '', tag: 'Casa' })
      setIsAddingForm(false)
    }
  }

  const sortedItems = [...items].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="space-y-3 flex-1 flex flex-col">
      {!hideTitle && (
        <div>
          <h3 className="text-lg md:text-base font-semibold text-[var(--color-text-main)] flex items-center gap-2 font-poppins">
            <AppIcon name="clock" className="w-4 h-4 text-[var(--color-brand)]" />
            Agenda & compromissos
          </h3>
          <p className="text-xs md:text-sm text-[var(--color-text-muted)] mt-0.5 font-poppins">
            Horários importantes do seu dia.
          </p>
        </div>
      )}

      <SoftCard className="space-y-3 p-5 md:p-6 h-full flex flex-col">
        {sortedItems.length === 0 ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <AppIcon name="calendar" className="w-8 h-8 text-[var(--color-border-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]/60">Ainda não há compromissos para hoje. Que tal adicionar o primeiro?</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-0">
            {sortedItems.map(item => (
              <div key={item.id} className="flex gap-3 py-2.5 border-b border-[var(--color-border-soft)] last:border-0">
                <div className="flex-shrink-0 w-12 py-1">
                  <span className="text-xs font-bold text-[var(--color-brand)]">{item.time}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-main)]">{item.title}</p>
                  {item.tag && (
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]/70">
                      {item.tag}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isAddingForm ? (
          <button
            onClick={() => setIsAddingForm(true)}
            className="mt-3 pt-3 border-t border-[var(--color-border-soft)] inline-flex items-center gap-2 text-sm font-medium text-[var(--color-brand)] hover:text-[var(--color-brand)]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar compromisso
          </button>
        ) : (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-soft)] space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                placeholder="HH:MM"
                className="col-span-1 px-3 py-2 rounded-lg border border-[var(--color-border-soft)] bg-white text-sm text-[var(--color-text-main)] placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              />
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Novo compromisso..."
                className="col-span-2 px-3 py-2 rounded-lg border border-[var(--color-border-soft)] bg-white text-sm text-[var(--color-text-main)] placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
                onKeyDown={e => e.key === 'Enter' && handleAddAppointment()}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={formData.tag}
                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[var(--color-border-soft)] bg-white text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
              >
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAppointment}
                  className="flex-1 px-3 py-2 bg-[var(--color-brand)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand)]/90 transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAddingForm(false)
                    setFormData({ time: '', title: '', tag: 'Casa' })
                  }}
                  className="px-3 py-2 bg-[var(--color-soft-bg)] text-[var(--color-text-muted)] rounded-lg text-xs font-semibold hover:bg-[var(--color-soft-bg)]/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </SoftCard>
    </div>
  )
}
