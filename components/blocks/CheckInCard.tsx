'use client'

import { useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const moods = [
  { emoji: '😔', label: 'Triste', value: 'triste' },
  { emoji: '😐', label: 'Neutra', value: 'neutra' },
  { emoji: '🙂', label: 'Leve', value: 'leve' },
  { emoji: '😊', label: 'Feliz', value: 'feliz' },
  { emoji: '😵‍💫', label: 'Sobrecarregada', value: 'sobrecarregada' },
] as const

type MoodValue = (typeof moods)[number]['value']

export function CheckInCard() {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null)
  const [quote, setQuote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)

  const moodLabelMap = useMemo(() => {
    return moods.reduce<Record<MoodValue, string>>((accumulator, mood) => {
      accumulator[mood.value] = mood.label
      return accumulator
    }, {} as Record<MoodValue, string>)
  }, [])

  const handleMoodSelect = async (moodValue: MoodValue) => {
    const isSame = selectedMood === moodValue
    const nextMood = isSame ? null : moodValue

    setSelectedMood(nextMood)
    setQuote('')

    if (!nextMood) {
      requestIdRef.current += 1
      setIsLoading(false)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)

    try {
      const today = new Date().toISOString().slice(0, 10)
      const response = await fetch(`/api/mood-message?mood=${encodeURIComponent(nextMood)}&date=${today}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (requestIdRef.current !== requestId) {
        return
      }

      if (typeof data?.quote === 'string' && data.quote.trim().length > 0) {
        setQuote(data.quote)
      } else {
        setQuote('')
      }
    } catch (error) {
      console.error('Não foi possível carregar a mensagem motivacional:', error)
      if (requestIdRef.current === requestId) {
        setQuote('')
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = () => {
    if (selectedMood) {
      const label = moodLabelMap[selectedMood]
      alert(`Check-in registrado com sucesso! ${label} 💛`)
      setSelectedMood(null)
      setQuote('')
      setIsLoading(false)
      requestIdRef.current += 1
    }
  }

  return (
    <section data-testid="checkin-card">
      <Card className="p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-support-1 md:text-xl">😊 Como você está agora?</h2>
            <p className="text-sm text-support-2">Escolha um mood para acompanhar seu bem-estar emocional.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {moods.map((mood) => {
            const isActive = selectedMood === mood.value

            return (
              <button
                key={mood.value}
                type="button"
                onClick={() => void handleMoodSelect(mood.value)}
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

        <div aria-live="polite">
          {isLoading ? (
            <p className="mt-4 text-sm text-support-2">Gerando uma mensagem para você…</p>
          ) : null}
          {!isLoading && quote ? (
            <p data-testid="mood-quote" className="mt-4 text-sm text-support-2">
              {quote}
            </p>
          ) : null}
        </div>

        <Button variant="primary" size="sm" onClick={handleSubmit} disabled={!selectedMood} className="mt-6 w-full">
          Registrar Mood
        </Button>
      </Card>
    </section>
  )
}
