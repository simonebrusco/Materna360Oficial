'use client'

import { useState } from 'react'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { CheckInCard } from '@/components/blocks/CheckInCard'
import { Checklist } from '@/components/blocks/Checklist'
import DailyMessageCard from '@/components/blocks/DailyMessageCard'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import GridRhythm from '@/components/common/GridRhythm'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

type MeuDiaClientProps = {
  dailyGreeting: string
  currentDateKey: string
  weekStartKey: string
  weekLabels: { key: string; shortLabel: string; longLabel: string; chipLabel: string }[]
  plannerTitle: string
  profile: Profile
  dateKey: string
  allActivities: ChildActivity[]
  recommendations: ChildRecommendation[]
  initialBuckets: AgeRange[]
}

const quickActions = [
  { emoji: '🏡', title: 'Rotina da Casa', description: 'Organize as tarefas do lar' },
  { emoji: '📸', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { emoji: '🎯', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { emoji: '☕', title: 'Pausa para Mim', description: 'Seu momento especial' },
] as const

const NOTES_LABEL = 'Notas Rápidas'
const NOTES_DESCRIPTION = 'Capture ideias e lembretes em instantes.'
const NOTES_EMPTY_TEXT = 'Nenhuma nota registrada ainda.'

const safeUtf = (value?: string | null): string => {
  if (!value) {
    return ''
  }

  try {
    return decodeURIComponent(escape(value))
  } catch {
    return value ?? ''
  }
}

export function MeuDiaClient({
  dailyGreeting,
  currentDateKey,
  weekStartKey,
  weekLabels,
  plannerTitle,
  profile,
  dateKey,
  allActivities,
  recommendations,
  initialBuckets,
}: MeuDiaClientProps) {
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  const notesLabel = safeUtf(NOTES_LABEL)
  const notesDescription = safeUtf(NOTES_DESCRIPTION)
  const emptyNotesText = safeUtf(NOTES_EMPTY_TEXT)

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes([noteText, ...notes])
      setNoteText('')
      setShowNoteModal(false)
    }
  }

  return (
    <>
      <SectionWrapper>
        <Reveal delay={100}>
          <DailyMessageCard greeting={dailyGreeting} />
        </Reveal>
      </SectionWrapper>

      <SectionWrapper>
        <Reveal delay={160}>
          <CheckInCard />
        </Reveal>
      </SectionWrapper>

      <SectionWrapper>
        <Reveal delay={220}>
          <ActivityOfDay dateKey={dateKey} profile={profile} activities={allActivities} />
        </Reveal>
      </SectionWrapper>

      <SectionWrapper>
        <GridRhythm className="GridRhythm grid-cols-1 sm:grid-cols-2">
          {quickActions.map((action, index) => (
            <Reveal key={action.title} delay={index * 80} className="h-full">
              <Card className="h-full">
                <div className="mb-3 text-2xl">{action.emoji}</div>
                <h3 className="text-base font-semibold text-support-1 md:text-lg">{action.title}</h3>
                <p className="mb-4 text-xs text-support-2 md:text-sm">{action.description}</p>
                <Button variant="primary" size="sm" className="w-full">
                  Acessar
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridRhythm>
      </SectionWrapper>

      <SectionWrapper>
        <Reveal delay={280}>
          <FamilyPlanner
            currentDateKey={currentDateKey}
            weekStartKey={weekStartKey}
            weekLabels={weekLabels}
            plannerTitle={plannerTitle}
            profile={profile}
            dateKey={dateKey}
            recommendations={recommendations}
            initialBuckets={initialBuckets}
          />
        </Reveal>
      </SectionWrapper>

      <SectionWrapper>
        <Reveal delay={320}>
          <Checklist currentDateKey={currentDateKey} />
        </Reveal>
      </SectionWrapper>

      <SectionWrapper>
        <Reveal delay={360}>
          <Card className="notesCard">
            <div className="notesCard-header mb-4 flex items-start justify-between gap-3 sm:items-center">
              <div className="notesCard-text">
                <h2 className="notesCard-title title title--clamp text-lg font-semibold text-support-1 md:text-xl">
                  <span aria-hidden="true" className="mr-1">
                    📝
                  </span>
                  {notesLabel}
                </h2>
                <p className="notesCard-meta meta text-xs text-support-2/80">{notesDescription}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowNoteModal(true)}
              >
                + Adicionar
              </Button>
            </div>

            {notes.length === 0 ? (
              <p className="text-center text-xs text-support-2/60">{emptyNotesText}</p>
            ) : (
              <div className="notesCard-list space-y-2">
                {notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="notesCard-item rounded-soft-lg border border-support-3/20 bg-support-3/5 p-3"
                  >
                    <p className="text-xs text-support-2">{note}</p>
                  </div>
                ))}
              </div>
            )}

            {showNoteModal && (
              <div className="modal-overlay fixed inset-0 z-50 flex items-end bg-black/30">
                <div className="modal-container w-full rounded-t-2xl bg-white p-6 sm:w-96">
                  <h3 className="mb-4 text-lg font-semibold text-support-1">Adicionar Nota</h3>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Escreva sua nota aqui..."
                    className="mb-4 w-full rounded-lg border border-support-3/20 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowNoteModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={handleAddNote}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Reveal>
      </SectionWrapper>
    </>
  )
}
