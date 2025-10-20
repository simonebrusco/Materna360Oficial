'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function CheckIn() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const moods = [
    { emoji: '😔', label: 'Triste', value: 'sad' },
    { emoji: '😐', label: 'Neutro', value: 'neutral' },
    { emoji: '🙂', label: 'OK', value: 'ok' },
    { emoji: '😊', label: 'Feliz', value: 'happy' },
    { emoji: '😄', label: 'Muito Feliz', value: 'very-happy' },
  ]

  const handleSubmit = () => {
    if (selectedMood) {
      alert(`Check-in registrado com sucesso! ${selectedMood} 💛`)
      setSelectedMood(null)
    }
  }

  return (
    <Card>
      <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-4">😊 Como você está agora?</h2>

      <div className="flex justify-around gap-2 mb-6">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-lg transition-all ${
              selectedMood === mood.value
                ? 'bg-primary text-white scale-110'
                : 'bg-secondary text-support-1 hover:bg-pink-200'
            }`}
            aria-label={mood.label}
            title={mood.label}
          >
            <span className="text-2xl md:text-3xl">{mood.emoji}</span>
            <span className="text-xs hidden md:block">{mood.label}</span>
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={!selectedMood}
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Registrar Mood
      </Button>
    </Card>
  )
}
