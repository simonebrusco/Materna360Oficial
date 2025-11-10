'use client'

import { useState, useEffect } from 'react'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { isEnabled } from '@/app/lib/flags'
import AppIcon from '@/components/ui/AppIcon'

import { ActivityOfDay } from '@/components/blocks/ActivityOfDay'
import { CheckInCard } from '@/components/blocks/CheckInCard'
import { Checklist } from '@/components/blocks/Checklist'
import DailyMessageCard from '@/components/blocks/DailyMessageCard'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { SimplePlannerSheet, type PlannerItem, type PlannerDraft } from '@/components/blocks/SimplePlannerSheet'
import { SimplePlannerList } from '@/components/blocks/SimplePlannerList'
import { MoodQuickSelector } from '@/components/blocks/MoodQuickSelector'
import { MoodSparkline } from '@/components/blocks/MoodSparkline'
import { MomInMotion } from './components/MomInMotion'
import { MoodEnergyCheckin } from './components/MoodEnergyCheckin'
import { Reminders } from './components/Reminders'
import { ExportPlanner } from './components/ExportPlanner'
import GridRhythm from '@/components/common/GridRhythm'
import GridStable from '@/components/common/GridStable'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import SoftCard from '@/components/ui/SoftCard'
import { Badge } from '@/components/ui/Badge'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SectionH2, BlockH3 } from '@/components/common/Headings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { toast } from '@/app/lib/toast'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track, trackTelemetry } from '@/app/lib/telemetry'
import { isEnabled as isClientFlagEnabled } from '@/app/lib/flags.client'
import EmotionTrendDrawer from '@/components/ui/EmotionTrendDrawer'
import { getMoodEntries, seedIfEmpty } from '@/app/lib/moodStore.client'
import CoachSuggestionCard from '@/components/coach/CoachSuggestionCard'
import { generateCoachSuggestion } from '@/app/lib/coachMaterno.client'

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
  { iconName: 'books', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { iconName: 'star', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { iconName: 'care', title: 'Pausa para Mim', description: 'Seu momento especial' },
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

  const [showPlannerSheet, setShowPlannerSheet] = useState(false)
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])

  const [trendOpen, setTrendOpen] = useState(false)
  const canShowTrends = isClientFlagEnabled('FF_EMOTION_TRENDS')

  const notesLabel = safeUtf(NOTES_LABEL)
  const notesDescription = safeUtf(NOTES_DESCRIPTION)
  const emptyNotesText = safeUtf(NOTES_EMPTY_TEXT)

  // Page-view telemetry on mount
  useEffect(() => {
    track('nav.click', { tab: 'meu-dia', dest: '/meu-dia' })
  }, [])

  // Seed demo mood data in dev/preview mode
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        seedIfEmpty()
      } catch {
        // silently fail
      }
    }
  }, [])

  // Load planner items from persistence on mount
  useEffect(() => {
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    const savedItems = load<PlannerItem[]>(persistKey, [])
    setPlannerItems(savedItems || [])
  }, [])

  const handleAddNote = () => {
    if (noteText.trim()) {
      setNotes([noteText, ...notes])
      setNoteText('')
      setShowNoteModal(false)
    }
  }

  const handleAddPlannerItem = (draft: PlannerDraft) => {
    const newItem: PlannerItem = {
      id: globalThis.crypto?.randomUUID?.() ?? `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      title: draft.title,
      note: draft.note,
      time: draft.time,
      done: draft.done ?? false,
    }

    const updated = [...plannerItems, newItem]
    setPlannerItems(updated)

    // Persist the updated list
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    save(persistKey, updated)

    // Fire telemetry
    track('planner.item_add', {
      tab: 'meu-dia',
      component: 'SimplePlannerSheet',
      action: 'add',
      title: draft.title,
      hasNote: !!draft.note,
      hasTime: !!draft.time,
    })

    // Show toast
    toast.success('Alterações salvas!')
  }

  const handleTogglePlannerItem = (id: string) => {
    const updated = plannerItems.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    )
    setPlannerItems(updated)

    // Persist the updated list
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    save(persistKey, updated)

    // Fire telemetry
    const item = plannerItems.find(i => i.id === id)
    track('planner.item_done', {
      tab: 'meu-dia',
      component: 'SimplePlannerList',
      action: 'toggle',
      done: !item?.done,
    })
  }

  return (
    <PageTemplate title="Seu dia, no seu ritmo." subtitle="Planeje pequenas tarefas, acompanhe o humor e celebre suas conquistas. Cada marca registrada aqui é um lembrete: você está fazendo o melhor possível.">
      <SoftCard className="mb-4">
        <Reveal delay={100}>
          <DailyMessageCard greeting={dailyGreeting} />
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={160}>
          <div>
            <Badge className="mb-2">Humor e Energia</Badge>
            <h3 className="m360-card-title">Registre seu humor e energia de hoje.</h3>
            <div className="mt-4 space-y-6">
              <MoodQuickSelector />
              <div className="border-t border-white/40 pt-4">
                <MoodSparkline />
              </div>
            </div>
          </div>
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={210}>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="mb-2">Resumo da semana</Badge>
              <p className="m360-body">Humor diário registrado — 3× Feliz · 2× Neutra · 2× Cansada</p>
            </div>
            <button
              type="button"
              onClick={() => setTrendOpen(true)}
              className="rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all whitespace-nowrap ml-4"
              data-event="meu-dia.trend_view"
            >
              Ver tend��ncia
            </button>
          </div>
        </Reveal>
      </SoftCard>

      <ClientOnly>
        {isClientFlagEnabled('FF_COACH_V1') && (
          <CoachSuggestionCard
            resolve={() => Promise.resolve(generateCoachSuggestion())}
            onView={(id: string) => {
              try {
                trackTelemetry('coach.card_view', { id, tab: 'meu-dia' });
              } catch {}
            }}
            onApply={(id: string) => {
              try {
                trackTelemetry('coach.suggestion_apply', { id, tab: 'meu-dia' });
              } catch {}
            }}
            onSave={(id: string) => {
              try {
                trackTelemetry('coach.save_for_later', { id, tab: 'meu-dia' });
              } catch {}
            }}
            onWhyOpen={(id: string) => {
              try {
                trackTelemetry('coach.why_seen_open', { id, tab: 'meu-dia' });
              } catch {}
            }}
          />
        )}
      </ClientOnly>

      <SoftCard className="mb-4">
        <Reveal delay={230}>
          <div>
            <Badge className="mb-2">Rotina da Casa</Badge>
            <h3 className="m360-card-title">Organize as tarefas do lar</h3>
            <div className="mt-4">
              <MomInMotion enabled storageKey={`meu-dia:${dateKey}:todos`} />
            </div>
          </div>
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={240}>
          <ExportPlanner />
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={250}>
          <div>
            <Badge className="mb-2">Lembretes</Badge>
            <h3 className="m360-card-title">Avisos suaves para o seu dia</h3>
            <div className="mt-4">
              <Reminders storageKey={`meu-dia:${dateKey}:reminders`} />
            </div>
          </div>
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={270}>
          <div>
            <Badge className="mb-2">Atividade do dia</Badge>
            <ActivityOfDay dateKey={dateKey} profile={profile} activities={allActivities} />
          </div>
        </Reveal>
      </SoftCard>

      <SoftCard className="mb-4">
        <Reveal delay={260}>
          <div>
            <Badge className="mb-4">Ações Rápidas</Badge>
            <GridStable>
              {quickActions.map((action, index) => (
                <Reveal key={action.title} delay={index * 80} className="h-full">
                  <div className="h-full rounded-xl bg-white/70 p-3 border border-white/40">
                    <div className="mb-3">
                      <AppIcon name={action.iconName as any} size={28} decorative />
                    </div>
                    <BlockH3 className="text-base md:text-lg">{action.title}</BlockH3>
                    <p className="mb-4 text-xs text-support-2 md:text-sm">{action.description}</p>
                    <Button variant="primary" size="sm" className="w-full">
                      Acessar
                    </Button>
                  </div>
                </Reveal>
              ))}
            </GridStable>
          </div>
        </Reveal>
      </SoftCard>

      <div id="meu-dia-print-area" className="print-card space-y-4">
        <Card>
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
        </Card>

        <SoftCard className="mb-4">
          <Reveal delay={300}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className="mb-2">Planejamento</Badge>
                <h3 className="m360-card-title">Itens da Semana</h3>
                <p className="text-xs text-support-2/80 mt-1">Organize suas tarefas semanais</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPlannerSheet(true)}
                className="flex items-center gap-1"
              >
                <AppIcon name="plus" size={16} decorative />
                Adicionar item
              </Button>
            </div>
            <SimplePlannerList items={plannerItems} onToggleDone={handleTogglePlannerItem} />
          </Reveal>
        </SoftCard>

        <SimplePlannerSheet
          isOpen={showPlannerSheet}
          onClose={() => setShowPlannerSheet(false)}
          onAdd={handleAddPlannerItem}
        />

        <SoftCard className="mb-4">
          <Reveal delay={320}>
            <Badge className="mb-2">Checklist</Badge>
            <h3 className="m360-card-title mb-4">Marque suas conquistas</h3>
            <Checklist currentDateKey={currentDateKey} />
          </Reveal>
        </SoftCard>
      </div>

      <SoftCard className="notesCard mb-4">
        <Reveal delay={360}>
          <div className="notesCard-header mb-4 flex items-start justify-between gap-3 sm:items-center">
            <div className="notesCard-text">
              <Badge className="mb-2">Anotações</Badge>
              <h3 className="m360-card-title">
                <span className="mr-1">
                  <AppIcon name="edit" size={16} aria-hidden />
                </span>
                {notesLabel}
              </h3>
              <p className="notesCard-meta meta text-xs text-support-2/80">{notesDescription}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowNoteModal(true)}
              className="notesCard-action"
            >
              ��� Adicionar
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
        </Reveal>
      </SoftCard>

      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
            <SoftCard className="w-full notesCard-modal">
              <h3 className="m360-card-title mb-2">Adicionar Nota</h3>
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
            </SoftCard>
          </div>
        </div>
      )}

      <ClientOnly>
        {canShowTrends && (
          <EmotionTrendDrawer
            open={trendOpen}
            onClose={() => setTrendOpen(false)}
            resolveData={() => getMoodEntries()}
          />
        )}
      </ClientOnly>
    </PageTemplate>
  )
}
