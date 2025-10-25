'use client'

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

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 md:gap-8">
          {moods.map((mood) => {
            const isActive = selectedMood === mood.value

            return (
              <button
                key={mood.value}
                type="button"
                onClick={() => void handleMoodSelect(mood.value)}
                className={`group inline-flex h-[130px] w-[148px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.10)] focus:outline-none focus:ring-2 focus:ring-primary/30 md:h-[140px] md:w-[156px] ${
                  isActive ? 'scale-[1.02] ring-2 ring-primary/40 shadow-[0_18px_40px_rgba(233,46,129,0.18)]' : ''
                }`}
                aria-label={mood.label}
                title={mood.label}
                data-testid={mood.value === 'sobrecarregada' ? 'mood-sobrecarregada' : undefined}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_6px_18px_rgba(0,0,0,0.06)] md:h-16 md:w-16">
                  <span className="text-[32px] leading-none">{mood.emoji}</span>
                </span>
                <span className="mt-2 max-w-[11ch] text-center text-[15px] font-semibold leading-snug text-support-1 md:text-base line-clamp-2">
                  {mood.label}
                </span>
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
