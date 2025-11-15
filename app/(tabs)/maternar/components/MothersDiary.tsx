'use client'

import React, { useState, useEffect } from 'react'
import { load, save } from '@/app/lib/persist'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { toast } from '@/app/lib/toast'

interface DiaryEntry {
  id: string
  date: string
  title?: string
  content: string
  category?: 'reflection' | 'gratitude' | 'memory' | 'thought'
  createdAt: string
}

export function MothersDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [showInput, setShowInput] = useState(false)
  const [entryText, setEntryText] = useState('')
  const [entryTitle, setEntryTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DiaryEntry['category']>('reflection')

  useEffect(() => {
    const saved = load<DiaryEntry[]>('maternar:diary_entries')
    if (Array.isArray(saved)) {
      setEntries(saved)
    }
  }, [])

  const handleAddEntry = () => {
    if (!entryText.trim()) {
      toast.danger('Por favor, escreva algo antes de salvar.', 'Atenção')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: today,
      title: entryTitle || undefined,
      content: entryText,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
    }

    const updatedEntries = [newEntry, ...entries]
    setEntries(updatedEntries)
    save('maternar:diary_entries', updatedEntries)
    setEntryText('')
    setEntryTitle('')
    setShowInput(false)
    toast.success('Registro salvo com sucesso!')
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">Diário da Mãe</h2>
        <p className="text-sm text-support-2">
          Registre seus sentimentos, pensamentos e reflexões
        </p>
      </div>

      {!showInput ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setShowInput(true)}
        >
          <AppIcon name="plus" size={16} decorative />
          Nova anotação
        </Button>
      ) : (
        <div className="space-y-3 border-t pt-4">
          <input
            type="text"
            placeholder="Título (opcional)"
            value={entryTitle}
            onChange={e => setEntryTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            placeholder="O que você quer registrar hoje?"
            value={entryText}
            onChange={e => setEntryText(e.target.value)}
            className="w-full h-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as DiaryEntry['category'])}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="reflection">Reflexão</option>
            <option value="gratitude">Gratidão</option>
            <option value="memory">Memória</option>
            <option value="thought">Pensamento</option>
          </select>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleAddEntry} className="flex-1">
              Salvar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowInput(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-6 space-y-3 border-t pt-4 max-h-64 overflow-y-auto">
          {entries.slice(0, 3).map(entry => (
            <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
              {entry.title && (
                <p className="font-semibold text-sm text-support-1 mb-1">{entry.title}</p>
              )}
              <p className="text-xs text-support-2 mb-2">
                {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-sm text-support-1 line-clamp-2">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
