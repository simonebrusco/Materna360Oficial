'use client'

import { useState } from 'react'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { isEnabled } from '@/app/lib/flags'
import AppIcon from '@/components/ui/AppIcon'
import Emoji from '@/components/ui/Emoji'
import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { CheckInCard } from '@/components/blocks/CheckInCard'
import { Checklist } from '@/components/blocks/Checklist'
import DailyMessageCard from '@/components/blocks/DailyMessageCard'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import GridRhythm from '@/components/common/GridRhythm'
import GridStable from '@/components/common/GridStable'
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
  { iconName: 'place', title: 'Rotina da Casa', description: 'Organize as tarefas do lar' },
  { iconName: 'camera', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { iconName: 'target', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { iconName: 'coffee', title: 'Pausa para Mim', description: 'Seu momento especial' },
] as const

const NOTES_LABEL = 'Notas R\u00E1pidas'
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
        <GridStable>
          {quickActions.map((action, index) => (
            <Reveal key={action.title} delay={index * 80} className="h-full">
              <Card className="h-full">
                <div className="mb-3">
                  {isEnabled('FF_LAYOUT_V1') && action.iconName ? (
                    <AppIcon name={action.iconName as any} size={28} />
                  ) : (
                    <span className="text-2xl">{action.emoji}</span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-support-1 md:text-lg">{action.title}</h3>
                <p className="mb-4 text-xs text-support-2 md:text-sm">{action.description}</p>
                <Button variant="primary" size="sm" className="w-full">
                  Acessar
                </Button>
              </Card>
            </Reveal>
          ))}
        </GridStable>
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
                  <span className="mr-1">
                    {isEnabled('FF_LAYOUT_V1') ? (
                      <AppIcon name="edit" size={16} aria-hidden />
                    ) : (
                      <Emoji char="📝" size={14} />
                    )}
                  </span>
                  {notesLabel}
                </h2>
                <p className="notesCard-meta meta text-xs text-support-2/80">{notesDescription}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowNoteModal(true)}
                className="notesCard-action"
              >
                ＋ Adicionar
              </Button>
            </div>

            {notes.length > 0 ? (
              <div className="notesCard-list space-y-2">
                {notes.map((note, idx) => (
                  <div key={idx} className="notesCard-item rounded-2xl bg-secondary/60 p-3 text-sm text-support-1 shadow-soft">
                    {note}
                  </div>
                ))}
              </div>
            ) : (
              <p className="notesCard-empty empty text-sm text-support-2">{emptyNotesText}</p>
            )}
          </Card>
        </Reveal>
      </SectionWrapper>

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <Card className="w-full notesCard-modal">
              <h3 className="mb-2 text-lg font-semibold text-support-1">Adicionar Nota</h3>
              <p className="mb-4 text-sm text-support-2">Anote um pensamento, uma tarefa ou uma gratidão.</p>
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Escreva sua nota aqui..."
                className="min-h-[140px] w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={4}
              />
              <div className="mt-4 flex items-center gap-3">
                <Button variant="primary" size="sm" onClick={handleAddNote} className="flex-1">
                  Salvar
                </Button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="text-sm font-medium text-primary underline hover:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}
