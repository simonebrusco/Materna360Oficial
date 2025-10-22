'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type JourneyId = 'amor-proprio' | 'calma' | 'energia-positiva' | 'gratidao' | 'descanso' | 'confianca'

type Journey = {
  id: JourneyId
  title: string
  emoji: string
  description: string
  challenges: string[]
  finalMessage: string
}

type JourneyProgress = Record<JourneyId, boolean[]>

type ActiveJourneyState = {
  journey: Journey
  progress: boolean[]
}

const journeys: Journey[] = [
  {
    id: 'amor-proprio',
    title: 'Amor-Próprio',
    emoji: '💗',
    description: '7 days to look at yourself with kindness.',
    challenges: [
      'Look in the mirror and say something kind about yourself.',
      'Do something that makes you happy, without guilt.',
      'Take 5 minutes to breathe in silence.',
      'Write down three things you did well today.',
      'Remember a moment that made you proud.',
      'Treat yourself as patiently and lovingly as you treat your child.',
      'Write a short, kind note to yourself.',
    ],
    finalMessage: '"You are your best companion. Care for yourself with the same love you offer others."',
  },
  {
    id: 'calma',
    title: 'Calma',
    emoji: '🌿',
    description: '7 days to slow down.',
    challenges: [
      'Take three deep breaths before checking your phone.',
      'Drink your coffee slowly, enjoying the taste.',
      'Take a short walk, even indoors.',
      'Tidy up a small space and enjoy the calm it brings.',
      'Take 10 minutes to do absolutely nothing.',
      'Say “no” to something that overwhelms you.',
      'Listen to soft music and just breathe.',
    ],
    finalMessage: '"The peace you seek lives in the same place where you breathe."',
  },
  {
    id: 'energia-positiva',
    title: 'Energia Positiva',
    emoji: '☀️',
    description: '7 days of lightness and joy.',
    challenges: [
      'Open the window and feel the sunlight on your face.',
      'Dance to a cheerful song with your child.',
      'Do something fun outside your routine.',
      'Write down five good things that happened today.',
      'Send a kind message to someone you care about.',
      'Take a smiling photo of yourself.',
      'Watch something that makes you laugh.',
    ],
    finalMessage: '"Lightness has arrived — and it’s here to stay within you."',
  },
  {
    id: 'gratidao',
    title: 'Gratidão',
    emoji: '🌸',
    description: '7 days to see what blooms.',
    challenges: [
      'Be thankful for something simple in your day.',
      'Write three reasons you feel grateful.',
      'Say “thank you” while looking someone in the eyes.',
      'Notice something beautiful around you.',
      'Remember a challenge you overcame.',
      'Take a pause to enjoy the silence.',
      'Reread your notes from the week.',
    ],
    finalMessage: '"You bloom when you choose gratitude, even in the small things."',
  },
  {
    id: 'descanso',
    title: 'Descanso',
    emoji: '🌙',
    description: '7 days to care for body and mind.',
    challenges: [
      'Go to bed 15 minutes earlier.',
      'Turn off your phone 10 minutes before sleeping.',
      'Have a relaxing tea or drink before bedtime.',
      'Stretch lightly before lying down.',
      'Create a small nighttime ritual: low lights, deep breathing.',
      'Take a nap without guilt.',
      'Recall what makes you feel at peace.',
    ],
    finalMessage: '"Resting is an act of love. You deserve silence and stillness."',
  },
  {
    id: 'confianca',
    title: 'Confiança',
    emoji: '🌺',
    description: '7 days to believe in yourself again.',
    challenges: [
      'Remember a challenge you’ve already overcome — and celebrate it.',
      'Do something today that feels slightly out of your comfort zone.',
      'Say to yourself: "I am capable, even when I doubt."',
      'Write down a small goal and take the first step toward it.',
      'Reflect on something valuable you learned from a mistake.',
      'Ask for help when needed — that’s strength, not weakness.',
      'Thank yourself for the woman you are becoming.',
    ],
    finalMessage: '"Confidence grows when you choose to move forward, even without certainties."',
  },
]

const initialProgress = journeys.reduce<JourneyProgress>((acc, journey) => {
  acc[journey.id] = journey.challenges.map(() => false)
  return acc
}, {} as JourneyProgress)

export function CareJourneys() {
  const [progressMap, setProgressMap] = useState<JourneyProgress>(initialProgress)
  const [activeJourneyId, setActiveJourneyId] = useState<JourneyId | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const activeJourneyState: ActiveJourneyState | null = useMemo(() => {
    if (!activeJourneyId) return null
    const journey = journeys.find((item) => item.id === activeJourneyId)
    if (!journey) return null
    return {
      journey,
      progress: progressMap[journey.id],
    }
  }, [activeJourneyId, progressMap])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !activeJourneyId) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [activeJourneyId, isMounted])

  const handleToggleChallenge = (journeyId: JourneyId, index: number) => {
    setProgressMap((prev) => {
      const journeyProgress = prev[journeyId]
      const nextProgress = journeyProgress.map((completed, idx) => (idx === index ? !completed : completed))
      return {
        ...prev,
        [journeyId]: nextProgress,
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-support-1 md:text-2xl">🌼 Jornadas do Cuidar</h2>
          <p className="mt-1 text-sm text-support-2">
            Escolha uma jornada de 7 dias e acompanhe desafios curtos para nutrir mente e coração.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {journeys.map((journey) => {
          const journeyProgress = progressMap[journey.id]
          const completedCount = journeyProgress.filter(Boolean).length
          const isCompleted = completedCount === journey.challenges.length

          return (
            <Card
              key={journey.id}
              className="flex h-full cursor-pointer flex-col justify-between rounded-3xl border border-white/60 bg-white/80 p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
              onClick={() => setActiveJourneyId(journey.id)}
            >
              <div className="space-y-3">
                <span className="text-3xl">{journey.emoji}</span>
                <h3 className="text-lg font-semibold text-support-1">{journey.title}</h3>
                <p className="text-sm text-support-2">{journey.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                <span>{completedCount}/7 CONCLUÍDOS</span>
                {isCompleted ? <span>✨ CONCLUÍDO</span> : <span>VER JORNADA</span>}
              </div>
            </Card>
          )
        })}
      </div>

      {isMounted &&
        activeJourneyState &&
        createPortal(
          <div className="journey-layer">
            <div
              className="journey-overlay fixed inset-0 z-[2147483647] bg-black/25 backdrop-blur-sm"
              onClick={() => setActiveJourneyId(null)}
              aria-hidden="true"
            />
            <div className="journey-modal fixed inset-0 z-[2147483647] flex items-center justify-center px-4 py-10">
              <Card className="pointer-events-auto relative w-full max-w-xl space-y-6 rounded-3xl bg-white/95 p-7 shadow-elevated">
                <button
                  type="button"
                  aria-label="Fechar jornada"
                  className="absolute right-5 top-5 text-sm font-semibold uppercase tracking-[0.28em] text-primary/70 transition-opacity hover:opacity-70"
                  onClick={() => setActiveJourneyId(null)}
                >
                  Fechar
                </button>

                <div className="space-y-2 pr-14">
                  <span className="text-3xl">{activeJourneyState.journey.emoji}</span>
                  <h3 className="text-2xl font-semibold text-support-1">{activeJourneyState.journey.title}</h3>
                  <p className="text-sm text-support-2">{activeJourneyState.journey.description}</p>
                </div>

                {activeJourneyState.progress.every(Boolean) ? (
                  <div className="rounded-3xl border border-primary/20 bg-primary/10 px-6 py-12 text-center shadow-soft">
                    <p className="text-lg font-semibold leading-relaxed text-primary">
                      {activeJourneyState.journey.finalMessage}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeJourneyState.journey.challenges.map((challenge, index) => {
                      const isDone = activeJourneyState.progress[index]
                      return (
                        <div
                          key={challenge}
                          className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-200 ${
                            isDone
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-white/60 bg-white/90 text-support-2'
                          }`}
                        >
                          <p className={`text-sm ${isDone ? 'text-primary/90 line-through' : 'text-support-1'}`}>{challenge}</p>
                          <Button
                            variant={isDone ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleChallenge(activeJourneyState.journey.id, index)}
                            className="ml-4 whitespace-nowrap"
                          >
                            {isDone ? 'Concluído' : 'Marcar'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
