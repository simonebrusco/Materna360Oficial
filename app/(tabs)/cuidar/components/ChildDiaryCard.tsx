'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/useToast'
import { Button } from '@/components/ui/Button'
import { FilterPill } from '@/components/ui/FilterPill'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { useChildDiary, type ChildDiary } from '../hooks/useChildDiary'

const MOOD_OPTIONS = [
  { value: 'low' as const, label: 'Baixo' },
  { value: 'ok' as const, label: 'Ok' },
  { value: 'high' as const, label: 'Alto' },
]

const AVAILABLE_TAGS = ['sonolento', 'ativo', 'tranquilo', 'agitado', 'bem-alimentado', 'irritado']

type ChildDiaryCardProps = {
  dateKey?: string
}

export function ChildDiaryCard({ dateKey: providedDateKey }: ChildDiaryCardProps) {
  const { toast } = useToast()
  const { entries, isLoaded, upsert, remove } = useChildDiary()

  const [notes, setNotes] = React.useState('')
  const [mood, setMood] = React.useState<'low' | 'ok' | 'high' | null>(null)
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [isSaving, setIsSaving] = React.useState(false)

  const dateKey = React.useMemo(() => {
    return providedDateKey || getBrazilDateKey(new Date())
  }, [providedDateKey])

  // Load existing entry for this date
  React.useEffect(() => {
    if (!isLoaded) return
    const existing = entries.find((e) => e.dateKey === dateKey)
    if (existing) {
      setNotes(existing.notes)
      setMood(existing.mood || null)
      setSelectedTags(existing.tags || [])
    } else {
      setNotes('')
      setMood(null)
      setSelectedTags([])
    }
  }, [dateKey, entries, isLoaded])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const handleSave = async () => {
    if (!notes.trim()) {
      toast({
        kind: 'warning',
        title: 'Notas vazias',
        description: 'Adicione algumas notas sobre a criança.',
      })
      return
    }

    setIsSaving(true)
    try {
      const entry: ChildDiary = {
        dateKey,
        notes: notes.trim(),
        mood: mood || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }

      upsert(entry)

      // Telemetry event
      track('child_diary_save', {
        dateKey,
        mood: mood || null,
        tagsCount: selectedTags.length,
        notesLength: notes.length,
      })

      toast({
        kind: 'success',
        title: 'Diário salvo',
        description: 'As anotações foram registradas com sucesso.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    const confirmed = window.confirm('Tem certeza que deseja deletar este registro?')
    if (!confirmed) return

    try {
      remove(dateKey)

      // Telemetry
      track('child_diary_delete', { dateKey })

      // Clear form
      setNotes('')
      setMood(null)
      setSelectedTags([])

      toast({
        kind: 'success',
        title: 'Registro deletado',
        description: 'O registro foi removido com sucesso.',
      })
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      toast({
        kind: 'danger',
        title: 'Erro',
        description: 'Não foi possível deletar o registro.',
      })
    }
  }

  const hasExistingEntry = entries.some((e) => e.dateKey === dateKey)

  if (!isLoaded) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
        <div className="text-center text-support-2">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <h3 className="text-base font-semibold mb-4">Anotações do dia</h3>

      {/* Notes Textarea */}
      <div className="mb-4">
        <label htmlFor="diary-notes" className="block text-xs font-medium text-ink-1 mb-2">
          Notas sobre a criança
        </label>
        <textarea
          id="diary-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Como foi o dia? O que observou sobre a criança? Anotações importantes..."
          className="w-full rounded-xl border border-white/60 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none"
          rows={4}
        />
        <div className="text-xs text-support-2 mt-1">{notes.length} caracteres</div>
      </div>

      {/* Mood Select */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-ink-1 mb-2">Humor da criança</label>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMood(mood === option.value ? null : option.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all ${
                mood === option.value
                  ? 'border-primary bg-primary/10 text-ink-1'
                  : 'border-white/60 bg-white text-support-2 hover:bg-primary/5'
              }`}
              aria-pressed={mood === option.value}
            >
              {/* Icon - use AppIcon if it supports the icon name, else use a simple indicator */}
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tag Pills */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-ink-1 mb-2">Tags (opcional)</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <FilterPill
              key={tag}
              active={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-white/60">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={isSaving || !notes.trim()}
          className="flex-1"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>

        {hasExistingEntry && (
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            className="px-3"
            title="Deletar este registro"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
