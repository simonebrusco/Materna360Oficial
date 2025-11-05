'use client'

'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import TrailHeader, { type JourneySummary } from '@/components/blocks/MindfulnessJourneysTrail/TrailHeader'
import { CompleteButton } from '@/components/features/Journeys/CompleteButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import Emoji from '@/components/ui/Emoji'

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
    description: '7 dias para se olhar com carinho.',
    challenges: [
      'Olhe no espelho e diga algo gentil sobre você.',
      'Faça algo que te deixe feliz, sem culpa.',
      'Reserve 5 minutos para respirar em silêncio.',
      'Anote três coisas que você fez bem hoje.',
      'Lembre-se de um momento que te deixou orgulhosa.',
      'Trate-se com a mesma paciência e amor que oferece ao seu filho.',
      'Escreva um bilhete curto e carinhoso para você mesma.',
    ],
    finalMessage: '“Você é sua melhor companhia. Cuide de si com o mesmo amor que oferece aos outros.”',
  },
  {
    id: 'calma',
    title: 'Calma',
    emoji: '🌿',
    description: '7 dias para diminuir o ritmo.',
    challenges: [
      'Respire fundo três vezes antes de olhar o celular.',
      'Beba seu café devagar, saboreando cada gole.',
      'Faça uma caminhada curta, mesmo dentro de casa.',
      'Organize um pequeno espaço e aprecie a calma que isso traz.',
      'Separe 10 minutos para simplesmente não fazer nada.',
      'Diga “não” a algo que esteja te sobrecarregando.',
      'Ouça uma música suave e apenas respire.',
    ],
    finalMessage: '“A paz que você busca vive no mesmo lugar em que você respira.”',
  },
  {
    id: 'energia-positiva',
    title: 'Energia Positiva',
    emoji: '☀️',
    description: '7 dias de leveza e alegria.',
    challenges: [
      'Abra a janela e sinta a luz do sol no rosto.',
      'Dance com seu filho ao som de uma música animada.',
      'Faça algo divertido fora da rotina.',
      'Anote cinco coisas boas que aconteceram hoje.',
      'Envie uma mensagem carinhosa para alguém que você ama.',
      'Tire uma foto sorrindo de você mesma.',
      'Assista a algo que te faça rir.',
    ],
    finalMessage: '“A leveza chegou — e veio para ficar dentro de você.”',
  },
  {
    id: 'gratidao',
    title: 'Gratidão',
    emoji: '🌸',
    description: '7 dias para perceber o que floresce.',
    challenges: [
      'Agradeça por algo simples do seu dia.',
      'Escreva três motivos pelos quais você se sente grata.',
      'Diga "obrigada" olhando alguém nos olhos.',
      'Observe algo bonito ao seu redor.',
      'Lembre-se de um desafio que você superou.',
      'Faça uma pausa para apreciar o silêncio.',
      'Releia suas anotações da semana.',
    ],
    finalMessage: '“Você floresce quando escolhe a gratidão, até nas pequenas coisas.”',
  },
  {
    id: 'descanso',
    title: 'Descanso',
    emoji: '🌙',
    description: '7 dias para cuidar do corpo e da mente.',
    challenges: [
      'Vá dormir 15 minutos mais cedo.',
      'Desligue o celular 10 minutos antes de dormir.',
      'Tome um chá ou bebida relaxante antes de deitar.',
      'Alongue-se suavemente antes de deitar.',
      'Crie um pequeno ritual noturno: luzes baixas e respiração profunda.',
      'Tire um cochilo sem culpa.',
      'Recorde algo que te traz paz.',
    ],
    finalMessage: '“Descansar é um ato de amor. Você merece silêncio e quietude.”',
  },
  {
    id: 'confianca',
    title: 'Confiança',
    emoji: '🌺',
    description: '7 dias para voltar a acreditar em você.',
    challenges: [
      'Lembre-se de um desafio que você já superou — e celebre.',
      'Faça hoje algo que esteja um pouco fora da sua zona de conforto.',
      'Diga para si mesma: "Eu sou capaz, mesmo quando duvido."',
      'Anote uma meta pequena e dê o primeiro passo rumo a ela.',
      'Reflita sobre algo valioso que você aprendeu com um erro.',
      'Peça ajuda quando precisar — isso é força, não fraqueza.',
      'Agradeça a si mesma pela mulher que você está se tornando.',
    ],
    finalMessage: '“A confiança cresce quando você escolhe seguir em frente, mesmo sem todas as certezas.”',
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

  const journeySummary = useMemo<JourneySummary>(() => {
    return journeys.reduce<JourneySummary>((acc, journey) => {
      const journeyProgress = progressMap[journey.id] ?? []
      const completedCount = journeyProgress.filter(Boolean).length
      acc[journey.id] = {
        completed: completedCount,
        total: journeyProgress.length,
      }
      return acc
    }, {} as JourneySummary)
  }, [progressMap])

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
    <section className="rounded-3xl border border-white/70 bg-white/92 px-6 py-7 shadow-[0_18px_42px_-26px_rgba(47,58,86,0.28)] backdrop-blur-sm transition-shadow duration-300 md:px-8 md:py-9">
      <header className="space-y-2 md:space-y-3">
        <span className="eyebrow-capsule">Autocuidado guiado</span>
        <h2 className="flex items-center gap-2 text-[20px] font-bold leading-[1.28] text-support-1 md:text-[22px]">
          <span aria-hidden="true">🌼</span>
          <span>Jornadas do Cuidar</span>
        </h2>
        <p className="max-w-2xl text-sm leading-[1.45] text-support-2/85 md:text-base">
          Escolha uma jornada de 7 dias e acompanhe desafios curtos para nutrir mente e coração.
        </p>
        <div className="h-px w-full bg-support-2/15" />
      </header>

      <div className="mt-4 space-y-5 md:mt-5 md:space-y-6">
        <TrailHeader journeySummary={journeySummary} />
        <div className="grid grid-cols-1 gap-y-4 gap-x-3 md:grid-cols-2 md:gap-y-5 md:gap-x-4 lg:grid-cols-3 lg:gap-y-6 lg:gap-x-6">
          {journeys.map((journey) => {
            const journeyProgress = progressMap[journey.id]
            const completedCount = Number(journeySummary[journey.id]?.completed ?? journeyProgress.filter(Boolean).length)

            return (
              <Card
                key={journey.id}
                className="CardElevate flex h-full min-h-[176px] cursor-pointer flex-col justify-between rounded-3xl border border-support-2/20 bg-white/97 p-5 md:p-6"
                onClick={() => setActiveJourneyId(journey.id)}
              >
                <div className="space-y-2.5">
                  <span className="text-3xl" aria-hidden="true">
                    {journey.emoji}
                  </span>
                  <h3 className="text-lg font-semibold text-support-1">{journey.title}</h3>
                  <p className="text-sm text-support-2/80 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                    {journey.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 md:mt-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                    {completedCount}/7
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    aria-label={`Ver mais – ${journey.title}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveJourneyId(journey.id)
                    }}
                    className="shrink-0"
                  >
                    Ver mais
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {isMounted &&
        activeJourneyState &&
        createPortal(
          <div className="journey-layer">
            <div
              className="modal-overlay"
              onClick={() => setActiveJourneyId(null)}
              aria-hidden="true"
            />
            <div className="modal-container items-center justify-center px-4 py-10">
              <Card className="section-card pointer-events-auto relative mx-auto w-full max-w-xl space-y-6 bg-white/95 shadow-elevated">
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
                          className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                            isDone
                              ? 'border-primary/40 bg-primary/10 text-primary'
                              : 'border-white/60 bg-white/90 text-support-2'
                          }`}
                        >
                          <p className={`text-sm ${isDone ? 'text-primary/90 line-through' : 'text-support-1'}`}>{challenge}</p>
                          <CompleteButton
                            done={isDone}
                            onClick={() => handleToggleChallenge(activeJourneyState.journey.id, index)}
                            data-testid="journey-complete-btn"
                          />
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
    </section>
  )
}
