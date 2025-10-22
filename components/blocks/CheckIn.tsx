'use client'

'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const moods = [
  { emoji: '😔', label: 'Triste', value: 'sad' },
  { emoji: '😐', label: 'Neutro', value: 'neutral' },
  { emoji: '🙂', label: 'OK', value: 'ok' },
  { emoji: '😊', label: 'Feliz', value: 'happy' },
  { emoji: '😄', label: 'Muito Feliz', value: 'very-happy' },
]

export function CheckIn() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const handleSubmit = () => {
    if (selectedMood) {
      alert(`Check-in registrado com sucesso! ${selectedMood} 💛`)
      setSelectedMood(null)
    }
  }

  return (
    <Card className="p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-lg font-semibold text-support-1 md:text-xl">😊 Como você está agora?</h2>
          <p className="text-sm text-support-2">
            Escolha um mood para acompanhar seu bem-estar emocional.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {moods.map((mood) => {
          const isActive = selectedMood === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(isActive ? null : mood.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl border border-white/50 px-4 py-3 text-support-1 shadow-soft transition-all duration-300 hover:shadow-elevated ${
                isActive ? 'bg-gradient-to-br from-primary/20 via-white/80 to-white text-primary scale-105' : 'bg-white/80'
              }`}
              aria-label={mood.label}
              title={mood.label}
            >
              <span className="text-2xl md:text-3xl">{mood.emoji}</span>
              <span className="hidden text-xs md:block">{mood.label}</span>
            </button>
          )
        })}
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={!selectedMood}
        className="mt-6 w-full"
      >
        Registrar Mood
      </Button>
    </Card>
  )
}
