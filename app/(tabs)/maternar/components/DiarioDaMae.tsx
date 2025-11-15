'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import SoftCard from '@/components/ui/SoftCard'
import { save, load } from '@/app/lib/persist'
import { toast } from '@/app/lib/toast'

export interface DiaryEntry {
  id: string
  date: string
  title?: string
  content: string
  category?: 'reflection' | 'gratitude' | 'memory' | 'thought'
  createdAt: string
}

interface DiarioDaMaeProps {
  storageKey?: string
}

export function DiarioDaMae({ storageKey = 'maternar:diary_entries' }: DiarioDaMaeProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [showModal, setShowModal] = useState(false)
  const [entryText, setEntryText] = useState('')
  const [entryTitle, setEntryTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DiaryEntry['category']>('reflection')

  useEffect(() => {
    const saved = load<DiaryEntry[]>(storageKey)
    if (Array.isArray(saved)) {
      setEntries(saved)
    }
  }, [storageKey])

  const handleAddEntry = () => {
    if (!entryText.trim()) {
      toast.error('Por favor, escreva algo antes de salvar.')
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

    const updated = [newEntry, ...entries]
    setEntries(updated)
    save(storageKey, updated)
    
    setEntryText('')
    setEntryTitle('')
    setSelectedCategory('reflection')
    setShowModal(false)
    toast.success('Reflexão salva com carinho!')
  }

  const getCategoryIcon = (category?: DiaryEntry['category']) => {
    switch (category) {
      case 'gratitude':
        return 'heart'
      case 'memory':
        return 'book'
      case 'thought':
        return 'lightbulb'
      case 'reflection':
      default:
        return 'edit'
    }
  }

  const getCategoryLabel = (category?: DiaryEntry['category']) => {
    switch (category) {
      case 'gratitude':
        return 'Gratidão'
      case 'memory':
        return 'Memória'
      case 'thought':
        return 'Pensamento'
      case 'reflection':
      default:
        return 'Reflexão'
    }
  }

  return (
    <>
      <div>
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-white/50 border border-white/40 p-4 shadow-soft hover:shadow-elevated transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                      <AppIcon
                        name={getCategoryIcon(entry.category)}
                        size={16}
                        className="text-primary"
                        decorative
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.title && (
                      <h4 className="font-semibold text-sm text-support-1 mb-1">
                        {entry.title}
                      </h4>
                    )}
                    <p className="text-sm text-support-2 line-clamp-2">
                      {entry.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-support-3 bg-support-3/10 rounded-full px-2 py-0.5">
                        {getCategoryLabel(entry.category)}
                      </span>
                      <span className="text-xs text-support-3">
                        {new Date(entry.date).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {entries.length > 5 && (
              <p className="text-xs text-support-3 text-center pt-2">
                +{entries.length - 5} registros anteriores
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-support-3/40 bg-white/40 px-6 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/30">
                <AppIcon name="edit" size={24} className="text-primary" decorative />
              </div>
              <div>
                <p className="font-semibold text-support-1">Seu diário está vazio.</p>
                <p className="mt-1 text-xs text-support-2">
                  Comece a escrever reflexões, gratidões e memórias especiais.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="w-full mt-4 flex items-center justify-center gap-2"
        >
          <AppIcon name="plus" size={16} decorative />
          Nova Reflexão
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <SoftCard className="w-full">
              <h3 className="m360-card-title mb-2">Novo Registro</h3>
              <p className="mb-4 text-sm text-support-2">
                Compartilhe reflexões, gratidão, memórias e pensamentos.
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  placeholder="Título (opcional)"
                  className="w-full rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <div className="flex gap-2 flex-wrap">
                  {(['reflection', 'gratitude', 'memory', 'thought'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all ${
                        selectedCategory === cat
                          ? 'bg-primary text-white'
                          : 'bg-support-3/10 text-support-2 hover:bg-support-3/20'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                <textarea
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="Escreva sua reflexão aqui..."
                  className="min-h-[160px] w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={6}
                />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddEntry}
                  className="flex-1"
                >
                  Salvar
                </Button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-sm font-medium text-primary underline hover:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </SoftCard>
          </div>
        </div>
      )}
    </>
  )
}
