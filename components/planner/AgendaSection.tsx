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
          <h3 className="text-lg md:text-base font-semibold text-[#2f3a56] flex items-center gap-2">
            <AppIcon name="clock" className="w-4 h-4 text-[#ff005e]" />
            Agenda & compromissos
          </h3>
          <p className="text-xs md:text-sm text-[#545454]/70 mt-0.5">
            Horários importantes do seu dia.
          </p>
        </div>
      )}

      <SoftCard className="space-y-3 p-5 md:p-6 h-full flex flex-col">
        {sortedItems.length === 0 ? (
          <div className="text-center py-6 flex-1 flex flex-col justify-center">
            <AppIcon name="calendar" className="w-8 h-8 text-[#ddd] mx-auto mb-2" />
            <p className="text-sm text-[#545454]/60">Ainda não há compromissos para hoje. Que tal adicionar o primeiro?</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-0">
            {sortedItems.map(item => (
              <div key={item.id} className="flex gap-3 py-2.5 border-b border-[#f0f0f0] last:border-0">
                <div className="flex-shrink-0 w-12 py-1">
                  <span className="text-xs font-bold text-[#ff005e]">{item.time}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2f3a56]">{item.title}</p>
                  {item.tag && (
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#545454]/70">
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
            className="mt-3 pt-3 border-t border-[#f0f0f0] inline-flex items-center gap-2 text-sm font-medium text-[#ff005e] hover:text-[#ff005e]/80 transition-colors"
          >
            <AppIcon name="plus" className="w-4 h-4" />
            Adicionar compromisso
          </button>
        ) : (
          <div className="mt-3 pt-3 border-t border-[#f0f0f0] space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                placeholder="HH:MM"
                className="col-span-1 px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
              />
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Novo compromisso..."
                className="col-span-2 px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
                onKeyDown={e => e.key === 'Enter' && handleAddAppointment()}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={formData.tag}
                onChange={e => setFormData({ ...formData, tag: e.target.value })}
                className="px-3 py-2 rounded-lg border border-[#ddd] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
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
                  className="flex-1 px-3 py-2 bg-[#ff005e] text-white rounded-lg text-xs font-semibold hover:bg-[#ff005e]/90 transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsAddingForm(false)
                    setFormData({ time: '', title: '', tag: 'Casa' })
                  }}
                  className="px-3 py-2 bg-[#f5f5f5] text-[#545454] rounded-lg text-xs font-semibold hover:bg-[#e5e5e5] transition-colors"
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
