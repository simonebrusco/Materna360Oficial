'use client'

import { useState, useEffect } from 'react'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { isEnabled } from '@/app/lib/flags'
import AppIcon from '@/components/ui/AppIcon'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDayIndex } from '@/app/lib/dailyMessage'

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
import { InactivityReminder } from './components/InactivityReminder'
import { ExportPlanner } from './components/ExportPlanner'
import ExportButton from '@/components/pdf/ExportButton'
import MaternaHeroDecoration from '@/components/blocks/MaternaHeroDecoration'
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
import { isPremium } from '@/app/lib/plan'
import { toast } from '@/app/lib/toast'
import { save, load, getCurrentWeekKey } from '@/app/lib/persist'
import { track, trackTelemetry } from '@/app/lib/telemetry'
import { isEnabled as isClientFlagEnabled } from '@/app/lib/flags.client'
import { getWeekStartKey, buildWeekLabels } from '@/app/lib/weekLabels'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import EmotionTrendDrawer from '@/components/ui/EmotionTrendDrawer'
import { getMoodEntries, seedIfEmpty } from '@/app/lib/moodStore.client'
import CoachSuggestionCard from '@/components/coach/CoachSuggestionCard'
import { generateCoachSuggestion } from '@/app/lib/coachMaterno.client'
import { useProfile } from '@/app/hooks/useProfile'
import { PremiumPaywallCard } from '@/components/premium/PremiumPaywallCard'

type MeuDiaClientProps = {
  dailyGreeting?: string
  currentDateKey?: string
  weekStartKey?: string
  weekLabels?: { key: string; shortLabel: string; longLabel: string; chipLabel: string }[]
  plannerTitle?: string
  profile?: Profile
  dateKey?: string
  allActivities?: ChildActivity[]
  recommendations?: ChildRecommendation[]
  initialBuckets?: AgeRange[]
  // Builder preview fallbacks
  __builderPreview__?: boolean
  __fallbackProfile__?: Profile
  __fallbackGreeting__?: string
  __fallbackWeekLabels__?: { key: string; shortLabel: string; longLabel: string; chipLabel: string }[]
  __fallbackCurrentDateKey__?: string
  __fallbackWeekStartKey__?: string
  __fallbackPlannerTitle__?: string
  // Hard disable heavy features (charts/pdf/timers) in iframe
  __disableHeavy__?: boolean
}

const quickActions = [
  { iconName: 'place', title: 'Rotina da Casa', description: 'Organize as tarefas do lar' },
  { iconName: 'books', title: 'Momentos com os Filhos', description: 'Registre e celebre' },
  { iconName: 'star', title: 'Atividade do Dia', description: 'Faça com as crianças' },
  { iconName: 'care', title: 'Pausa para Mim', description: 'Seu momento especial' },
] as const

const NOTES_LABEL = 'Notas Rápidas'
const NOTES_DESCRIPTION = 'Capture ideias e lembretes em instantes.'

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

// Default values for Builder preview
const DEFAULT_PROFILE: Profile = {
  motherName: 'Mãe',
  children: [{ name: 'Seu filho' } as any], // age in months
}

export function MeuDiaClient({
  dailyGreeting,
  currentDateKey,
  weekStartKey,
  weekLabels,
  plannerTitle,
  profile,
  dateKey,
  allActivities = [],
  recommendations = [],
  initialBuckets = [],
  __builderPreview__ = false,
  __fallbackProfile__ = DEFAULT_PROFILE,
  __fallbackGreeting__ = 'Today is a gift to yourself.',
  __fallbackWeekLabels__ = [],
  __fallbackCurrentDateKey__ = getBrazilDateKey(),
  __fallbackWeekStartKey__ = getWeekStartKey(getBrazilDateKey()),
  __fallbackPlannerTitle__ = 'Semana',
  __disableHeavy__ = false,
}: MeuDiaClientProps) {
  const builderMode = __builderPreview__
  const finalProfile = profile || __fallbackProfile__
  const finalDailyGreeting = safeUtf(dailyGreeting) || __fallbackGreeting__
  const finalCurrentDateKey = currentDateKey || __fallbackCurrentDateKey__
  const finalWeekStartKey = weekStartKey || __fallbackWeekStartKey__
  const finalWeekLabels = weekLabels || __fallbackWeekLabels__
  const finalPlannerTitle = plannerTitle || __fallbackPlannerTitle__

  const [trendOpen, setTrendOpen] = useState(false)
  const [showPlannerSheet, setShowPlannerSheet] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [canShowTrends, setCanShowTrends] = useState(false)

  const { name } = useProfile() || { name: finalProfile.motherName }

  useEffect(() => {
    setCanShowTrends(!__disableHeavy__ && isClientFlagEnabled('FF_EMOTION_TRENDS'))
  }, [__disableHeavy__])

  useEffect(() => {
    seedIfEmpty()
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    const saved = load(persistKey)
    if (Array.isArray(saved)) {
      setPlannerItems(saved)
    }
  }, [])

  useEffect(() => {
    const storageKey = `meu-dia:${finalCurrentDateKey}:notes`
    const savedNotes = load(storageKey)
    if (Array.isArray(savedNotes)) {
      setNotes(savedNotes)
    }
  }, [dateKey])

  const handleAddPlannerItem = (draft: PlannerDraft) => {
    const newItem: PlannerItem = {
      id: Date.now().toString(),
      text: draft.text,
      category: draft.category,
      done: false,
      createdAt: new Date().toISOString(),
      dueDate: draft.dueDate || null,
      note: draft.note,
    }

    const updated = [...plannerItems, newItem]
    setPlannerItems(updated)

    // Persist
    const weekKey = getCurrentWeekKey()
    const persistKey = `planner:${weekKey}`
    save(persistKey, updated)

    // Fire telemetry
    try {
      track('planner.item_added', {
        tab: 'meu-dia',
        component: 'SimplePlannerSheet',
        category: draft.category,
        hasNote: !!draft.note,
        hasTime: !!draft.time,
      })
    } catch {}

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

  const handleAddNote = () => {
    if (!noteText.trim()) return

    const updated = [...notes, noteText]
    setNotes(updated)
    setNoteText('')
    setShowNoteModal(false)

    // Persist notes
    const storageKey = `meu-dia:${finalCurrentDateKey}:notes`
    save(storageKey, updated)

    // Fire telemetry
    try {
      track('notes.note_added', {
        tab: 'meu-dia',
        component: 'NoteModal',
      })
    } catch {}

    // Show toast
    toast.success('Nota salva!')
  }

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = firstName ? `${firstName}, como está seu dia hoje?` : 'Meu dia';
  const pageSubtitle = 'Planeje pequenas tarefas, acompanhe o humor e celebre suas conquistas. Cada marca registrada aqui é um lembrete: você está fazendo o melhor possível.';

  return (
    <PageTemplate
      label="MEU DIA"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <div className="max-w-[1160px] mx-auto px-4 md:px-6">
        {/* MACRO BLOCK 1: EMOTIONAL START */}
        <div className="mb-16">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Começar com Leveza</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">Comece o dia com calma. Este espaço está aqui para apoiar você.</p>

          {/* Message of the Day - Premium Hero Card */}
          <Reveal delay={100}>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] relative overflow-hidden mb-6">
              {/* Subtle gradient accent blob - top-right corner */}
              <div className="pointer-events-none select-none absolute -top-8 right-0 h-32 w-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full" />

              {/* Content wrapper with tight spacing - positioned above accent */}
              <div className="flex flex-col gap-2 md:gap-3 relative z-10">
                {/* Pill header */}
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm w-fit">
                  Mensagem de Hoje
                </div>

                {/* Message title */}
                <h2 className="m360-title">"{finalDailyGreeting}"</h2>

                {/* Subtitle */}
                <p className="text-gray-600 m360-body-sm">
                  Uma mensagem especial para começar seu dia com leveza.
                </p>

                {/* Helper text */}
                <p className="m360-label-sm text-gray-500">
                  Atualizada automaticamente a cada novo dia.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Greeting Text */}
          <div className="mb-6">
            <InactivityReminder />
          </div>

          {/* Humor & Energia - Premium Card */}
          <Reveal delay={160}>
            {/* Pink pill label above the card */}
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Humor e Energia
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-6">
              {/* Header */}
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="m360-subtitle">Como você está hoje?</h3>
                <p className="m360-label-sm text-gray-600">
                  Tracking your mood is a small act of self-care.
                </p>
              </div>

              {/* Mood Pills */}
              <div className="mb-4">
                <MoodQuickSelector />
              </div>

              {/* Weekly Summary Analytics Card */}
              <div className="mt-4 rounded-2xl bg-gray-50/80 px-4 py-3 flex flex-col gap-2 mb-4">
                <p className="m360-label-sm text-gray-600">Sua semana até agora</p>
                <div>
                  <MoodSparkline />
                </div>
              </div>

              {/* View Trend Button */}
              <button
                type="button"
                onClick={() => setTrendOpen(true)}
                className="mt-2 w-full rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium text-sm hover:opacity-95 active:scale-[0.99] transition-all"
                data-event="meu-dia.trend_view"
              >
                Ver tendência
              </button>
            </div>
          </Reveal>
        </div>

        {/* Coach Suggestion Card */}
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

        {/* MACRO BLOCK 2: DAILY ORGANIZATION */}
        <div className="mb-16">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Organização do Dia</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">Organize seu dia com leveza — um passo de cada vez.</p>

          {/* House Routine Card */}
          <Reveal delay={230}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Rotina da Casa
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="m360-subtitle">Organize as tarefas do lar</h3>
              </div>
              <div>
                <MomInMotion enabled storageKey={`meu-dia:${finalCurrentDateKey}:todos`} />
              </div>
            </div>
          </Reveal>



          {/* Family Planner / Balance Card */}
          <div id="meu-dia-print-area" className="print-card space-y-8">
            {/* Planner da Mãe Card */}
            <Reveal delay={250}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Planner da Mãe
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="m360-subtitle">O que é prioridade hoje?</h3>
                  <p className="m360-label-sm text-gray-600">
                    Veja seus compromissos do dia e ajuste o que for necessário.
                  </p>
                </div>
                <div>
                  <FamilyPlanner
                  currentDateKey={finalCurrentDateKey}
                  weekStartKey={finalWeekStartKey}
                  weekLabels={finalWeekLabels}
                  plannerTitle={finalPlannerTitle}
                  profile={finalProfile}
                  dateKey={finalCurrentDateKey}
                    recommendations={recommendations}
                    initialBuckets={initialBuckets}
                  />
                </div>
              </div>
            </Reveal>

            {/* Weekly Items / Planner Card */}
            <Reveal delay={270}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Itens da Semana
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="m360-subtitle">O que você não quer esquecer esta semana?</h3>
                  <p className="m360-label-sm text-gray-600">
                    Mantenha visíveis os itens importantes da sua semana.
                  </p>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1" />
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
              </div>
            </Reveal>

            <SimplePlannerSheet
              isOpen={showPlannerSheet}
              onClose={() => setShowPlannerSheet(false)}
              onAdd={handleAddPlannerItem}
            />

            {/* Checklist Card */}
            <Reveal delay={290}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Checklist da Mãe
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015]">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="m360-subtitle">Pequenas tarefas, grandes conquistas.</h3>
                  <p className="m360-label-sm text-gray-600">
                    Marque o que você j�� fez e celebre cada avanço.
                  </p>
                </div>
                <Checklist currentDateKey={finalCurrentDateKey} />
              </div>
            </Reveal>

            {/* Notes Card */}
            <Reveal delay={310}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
                Notas Rápidas
              </div>
              <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] notesCard">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="m360-subtitle">Um espaço só seu para anotar o que importa.</h3>
                  <p className="m360-label-sm text-gray-600">
                    A safe place to keep important thoughts and moments.
                  </p>
                </div>
                <div className="notesCard-header flex items-start justify-between gap-4 mb-4">
                  <div className="notesCard-text flex-1" />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowNoteModal(true)}
                    className="notesCard-action flex-shrink-0"
                  >
                    + Adicionar
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
                  <div className="notesCard-empty rounded-2xl border border-dashed border-support-3/40 bg-white/40 px-6 py-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/30">
                        <AppIcon name="edit" size={24} className="text-primary" decorative />
                      </div>
                      <div>
                        <p className="font-semibold text-support-1">Nenhuma anotação ainda.</p>
                        <p className="mt-1 text-xs text-support-2">Use este espaço para registrar pensamentos, ideias ou momentos especiais.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>

        {/* MACRO BLOCK 3: CONNECTION & CARE (Conexão & Cuidado) */}
        <div className="mb-16">
          <h2 className="text-[22px] font-semibold text-gray-800 tracking-tight mb-2">Conexão & Cuidado</h2>
          <p className="text-[15px] text-gray-500 leading-relaxed mb-6">Ideias simples para tornar o dia mais especial.</p>

          {/* Activity of the Day Card */}
          <Reveal delay={330}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Atividade do Dia
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="m360-subtitle">Uma ideia para hoje</h3>
                <p className="m360-label-sm text-gray-600">Uma sugestão simples para criar um momento especial com seu filho hoje.</p>
              </div>
              <ActivityOfDay dateKey={finalCurrentDateKey} profile={finalProfile} activities={allActivities} />
            </div>
          </Reveal>

          {/* Quick Actions Grid */}
          <Reveal delay={350}>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-tight shadow-sm mb-6">
              Ações Rápidas
            </div>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)] hover:scale-[1.015] mb-8">
              <div className="flex flex-col gap-1 mb-6">
                <h3 className="m360-subtitle">Acesso rápido a suas funções favoritas</h3>
              </div>
              <div className="w-full md:max-w-[900px] lg:max-w-[1280px] mx-auto">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-4 items-stretch">
                  {quickActions.map((action, index) => (
                    <Reveal key={action.title} delay={index * 80} className="h-full">
                      <button
                        type="button"
                        className="h-full flex flex-col items-start gap-2 rounded-2xl bg-white border border-white/60 p-4 md:p-2 md:min-w-[220px] lg:min-w-[240px] shadow-soft transition-all duration-150 ease-out hover:shadow-elevated hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                        aria-label={`${action.title} - ${action.description}`}
                      >
                        <div className="flex-shrink-0">
                          <AppIcon name={action.iconName as any} size={24} decorative className="text-primary hover:opacity-80 transition-opacity" />
                        </div>
                        <div className="flex-1 w-full text-left">
                          <p className="font-semibold text-sm text-support-1">{action.title}</p>
                          <p className="mt-1 text-xs text-support-2">{action.description}</p>
                        </div>
                      </button>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Note Modal */}
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

      {/* Emotion Trend Drawer */}
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
