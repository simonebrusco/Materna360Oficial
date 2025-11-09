'use client'

import { useState, useEffect } from 'react'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry-track'
import { toast } from '@/app/lib/toast'
import { Skeleton } from '@/components/ui/feedback/Skeleton'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'

interface DiaryEntry {
  text: string
  intensity: number
  ts: number
}

export function EmotionalDiary() {
  const [text, setText] = useState('')
  const [intensity, setIntensity] = useState(2)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load entries on mount
  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `diary:${weekKey}`
    const loaded = load<DiaryEntry[]>(persistKey, [])
    setEntries(loaded || [])
    setIsLoading(false)
  }, [])

  const handleSave = async () => {
    if (!text.trim()) {
      toast.warning('Escreva algo antes de salvar.')
      return
    }

    setIsSaving(true)

    try {
      const newEntry: DiaryEntry = {
        text: text.trim(),
        intensity,
        ts: Date.now(),
      }

      const weekKey = getCurrentWeekKey()
      const persistKey = `diary:${weekKey}`
      const updated = [...entries, newEntry]

      // Persist to localStorage
      save(persistKey, updated)
      setEntries(updated)

      // Fire telemetry
      track({
        event: 'eu360.diary_add',
        tab: 'eu360',
        component: 'EmotionalDiary',
        action: 'save',
        payload: {
          intensity,
          chars: text.length,
        },
      })

      // Show toast
      toast({
        description: 'Diário atualizado! Este é um momento só seu.',
      })

      // Reset form
      setText('')
      setIntensity(2)
    } finally {
      setIsSaving(false)
    }
  }

  const getIntensityLabel = (value: number) => {
    const labels = ['Muito triste', 'Triste', 'Neutro', 'Feliz', 'Muito feliz']
    return labels[value] || 'Neutro'
  }

  const getIntensityColor = (value: number) => {
    if (value <= 1) return 'text-red-600'
    if (value === 2) return 'text-yellow-600'
    if (value === 3) return 'text-green-600'
    return 'text-primary'
  }

  // Get last 7 entries for history
  const historyEntries = entries.slice(-7).reverse()

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-support-1 block mb-2">
            Como você est�� se sentindo?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="Escreva aqui como se sente hoje..."
            maxLength={280}
            rows={4}
            className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm text-support-1 shadow-soft placeholder:text-support-3 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="mt-1 text-xs text-support-3 text-right">
            {text.length}/280
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-support-1 block">
            Intensidade emocional
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="4"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="flex-1 h-2 bg-white/40 rounded-full appearance-none cursor-pointer accent-primary"
              aria-label="Intensidade emocional: 0 muito triste a 4 muito feliz"
            />
            <div
              className={`text-sm font-medium min-w-fit ${getIntensityColor(intensity)}`}
            >
              {getIntensityLabel(intensity)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-support-3">
            <span>Muito triste</span>
            <span>Muito feliz</span>
          </div>
        </div>

        {/* Save Button */}
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!text.trim() || isSaving}
          className="w-full"
        >
          {isSaving ? 'Salvando...' : 'Salvar registro'}
        </Button>
      </div>

      {/* History Section */}
      {isLoading ? (
        <div className="space-y-3 border-t border-white/40 pt-4">
          <Skeleton className="h-4 w-20" />
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      ) : historyEntries.length > 0 ? (
        <div className="border-t border-white/40 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-support-1">Histórico</h4>
          <div className="space-y-2">
            {historyEntries.map((entry, idx) => {
              const date = new Date(entry.ts)
              const dayLabel =
                date.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).charAt(0).toUpperCase() +
                date.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }).slice(1)

              const preview = entry.text.substring(0, 60) + (entry.text.length > 60 ? '...' : '')

              return (
                <div
                  key={`${entry.ts}-${idx}`}
                  className="rounded-lg bg-white/40 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-support-1">{dayLabel}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(entry.intensity + 1)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${getIntensityColor(entry.intensity)}`}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-support-2 text-xs line-clamp-1">{preview}</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
