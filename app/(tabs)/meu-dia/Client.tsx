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

const DEFAULT_ACTIVITIES: ChildActivity[] = []
const DEFAULT_RECOMMENDATIONS: ChildRecommendation[] = []
const DEFAULT_BUCKETS: AgeRange[] = [] as any;

export function MeuDiaClient(props?: MeuDiaClientProps) {
  const isBuilder = props?.__builderPreview__ === true
  const { name } = useProfile()

  // Hard disable heavy features (charts/pdf/timers/observers) in iframe
  const builderMode =
    props?.__disableHeavy__ === true ||
    (typeof window !== 'undefined' && (window as any).__BUILDER_MODE__)

  // SSR-stable date defaults (compute in useEffect)
  const [ssrDateKey, setSsrDateKey] = useState('2025-01-01')
  const [ssrWeekKey, setSsrWeekKey] = useState('2025-01-01')
  const [ssrWeekLabels, setSsrWeekLabels] = useState<{ key: string; shortLabel: string; longLabel: string; chipLabel: string }[]>([])

  useEffect(() => {
    try {
      const dateKey = getBrazilDateKey()
      setSsrDateKey(dateKey)
      const weekStart = getWeekStartKey(dateKey)
      setSsrWeekKey(weekStart)
      const { labels } = buildWeekLabels(weekStart)
      setSsrWeekLabels(labels)
    } catch (error) {
      console.error('Failed to compute week labels on mount:', error)
    }
  }, [])

  // Use fallbacks in builder mode, otherwise use provided props
  const dateKeyForMessage = getBrazilDateKey()
  const dayIndex = getDayIndex(dateKeyForMessage, DAILY_MESSAGES.length)
  const dailyGreeting = isBuilder
    ? props?.__fallbackGreeting__ || DAILY_MESSAGES[dayIndex] || 'Olá, Mãe!'
    : props?.dailyGreeting || DAILY_MESSAGES[dayIndex] || 'Olá, Mãe!'
  const currentDateKey = isBuilder
    ? props?.__fallbackCurrentDateKey__ || ssrDateKey
    : props?.currentDateKey || ssrDateKey
  const weekStartKey = isBuilder
    ? props?.__fallbackWeekStartKey__ || ssrWeekKey
    : props?.weekStartKey || ssrWeekKey
  const weekLabels = isBuilder
    ? props?.__fallbackWeekLabels__ || []
    : props?.weekLabels || ssrWeekLabels
  const plannerTitle = isBuilder
    ? props?.__fallbackPlannerTitle__ || 'Planner'
    : props?.plannerTitle || 'Planner'
  const profile = isBuilder
    ? props?.__fallbackProfile__ || DEFAULT_PROFILE
    : props?.profile || DEFAULT_PROFILE
  const dateKey = currentDateKey
  const allActivities = props?.allActivities || DEFAULT_ACTIVITIES
  const recommendations = props?.recommendations || DEFAULT_RECOMMENDATIONS
  const initialBuckets = props?.initialBuckets || DEFAULT_BUCKETS

  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  const [showPlannerSheet, setShowPlannerSheet] = useState(false)
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])

  const [trendOpen, setTrendOpen] = useState(false)
  const canShowTrends = builderMode ? false : (isBuilder ? false : isClientFlagEnabled('FF_EMOTION_TRENDS'))

  const notesLabel = safeUtf(NOTES_LABEL)
  const notesDescription = safeUtf(NOTES_DESCRIPTION)

  // Page-view telemetry on mount (guarded for iframe)
  useEffect(() => {
    if (builderMode) return
    try {
      track('nav.click', { tab: 'meu-dia', dest: '/meu-dia' })
    } catch {
      // Silently fail if telemetry unavailable
    }
  }, [builderMode])

  // Seed demo mood data in dev/preview mode (guarded for iframe)
  useEffect(() => {
    if (builderMode) return
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        seedIfEmpty()
      } catch {
        // silently fail
      }
    }
  }, [builderMode])

  // Load planner items from persistence on mount (guarded for iframe)
  useEffect(() => {
    if (builderMode) return // Skip heavy operations in builder mode
    try {
      const weekKey = getCurrentWeekKey()
      const persistKey = `planner:${weekKey}`
      const savedItems = load<PlannerItem[]>(persistKey, [])
      setPlannerItems(savedItems || [])
    } catch {
      // Silently fail if localStorage unavailable
    }
  }, [builderMode])

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

  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = firstName ? `${firstName}, como está seu dia hoje?` : 'Meu dia';
  const pageSubtitle = 'Planeje pequenas tarefas, acompanhe o humor e celebre suas conquistas. Cada marca registrada aqui é um lembrete: você está fazendo o melhor possível.';

  return (
    <PageTemplate
      label="MEU DIA"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      {/* MACRO BLOCK 1: EMOTIONAL HEADER (Hoje) */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-support-1 mb-2">Hoje</h2>
        <p className="text-xs text-support-2/70 mb-4">Comece registrando como você está se sentindo hoje.</p>

        {/* Message of the Day Card */}
        <SoftCard className="mb-4">
          <Reveal delay={100}>
            <div>
              <Badge className="mb-2">Mensagem de Hoje</Badge>
              <DailyMessageCard greeting={dailyGreeting} />
            </div>
          </Reveal>
        </SoftCard>

        {/* Greeting Text */}
        <div className="mb-4">
          <InactivityReminder />
        </div>

        {/* Mood & Energy Card */}
        <SoftCard className="mb-4" data-section="mood">
          <Reveal delay={160}>
            <div>
              <Badge className="mb-2">Humor e Energia</Badge>
              <h3 className="m360-card-title">Registre seu <strong>humor</strong> e <strong>energia</strong> de hoje.</h3>
              <p className="text-xs text-support-2/70 mt-1">Escolha como você está se sentindo agora. Isso vai ajudar a acompanhar sua semana.</p>
              <div className="mt-4 space-y-6">
                <MoodQuickSelector />
                <div className="border-t border-white/40 pt-4">
                  <MoodSparkline />
                </div>
              </div>
            </div>
          </Reveal>
        </SoftCard>

        {/* Weekly Mood Summary */}
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
                Ver tendência
              </button>
            </div>
          </Reveal>
        </SoftCard>
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

      {/* MACRO BLOCK 2: ROUTINE & ORGANIZATION (Rotina & Organização) */}
      <div className="mb-8">
        <SectionH2 className="mb-2">Rotina & Organização</SectionH2>
        <p className="text-xs text-support-2/70 mb-4">Organize as tarefas da casa, compromissos e o que é prioridade hoje.</p>

        {/* House Routine Card */}
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

        {/* Export Planner & Wellness Card */}
        {!builderMode && (
          <SoftCard className="mb-4">
            <Reveal delay={240}>
              <div className="space-y-3">
                <ExportPlanner />
                <div className="border-t border-white/60 pt-3">
                  <ExportButton variant="wellness" />
                </div>
              </div>
            </Reveal>
          </SoftCard>
        )}

        {/* Premium Banner Card */}
        {!isPremium() && (
          <Reveal delay={245}>
            <PremiumPaywallCard
              title="Desbloqueie recursos premium"
              description="Exportar PDFs, insights avançados e muito mais."
              ctaLabel="Ver planos"
              onClick={() => {
                track('paywall_banner_click', { source: 'meu-dia', feature: 'premium_features' })
                window.location.href = '/planos'
              }}
            />
          </Reveal>
        )}

        {/* Reminders Card */}
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

        {/* Family Planner / Balance Card */}
        <div id="meu-dia-print-area" className="print-card space-y-4">
          <SoftCard>
            <Reveal delay={280}>
              <div>
                <Badge className="mb-2">Equilíbrio</Badge>
                <h3 className="m360-card-title">Semana em foco</h3>
                <p className="text-xs text-support-2/70 mt-1">Veja seus compromissos da semana e ajuste o que for necessário hoje.</p>
                <div className="mt-4">
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
                </div>
              </div>
            </Reveal>
          </SoftCard>

          {/* Weekly Items / Planner Card */}
          <SoftCard className="mb-4">
            <Reveal delay={300}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className="mb-2">Planejamento</Badge>
                  <h3 className="m360-card-title">Itens da <strong>Semana</strong></h3>
                  <p className="text-xs text-support-2/70 mt-1">Deixe visível o que você não quer esquecer ao longo da semana.</p>
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

          {/* Checklist Card */}
          <SoftCard className="mb-4">
            <Reveal delay={320}>
              <Badge className="mb-2">Checklist</Badge>
              <h3 className="m360-card-title">Marque suas <strong>conquistas</strong></h3>
              <p className="text-xs text-support-2/70 mt-1 mb-4">Marque pequenos passos. Cada tarefa concluída é uma conquista.</p>
              <Checklist currentDateKey={currentDateKey} />
            </Reveal>
          </SoftCard>
        </div>
      </div>

      {/* MACRO BLOCK 3: CONNECTION & CARE (Conexão & Cuidado) */}
      <div className="mb-8">
        <SectionH2 className="mb-2">Conexão & Cuidado</SectionH2>
        <p className="text-xs text-support-2/70 mb-4">Encontre momentos de conexão com seu filho e cuide também de você.</p>

        {/* Activity of the Day Card */}
        <SoftCard className="mb-4">
          <Reveal delay={270}>
            <div>
              <Badge className="mb-2">Atividade do dia</Badge>
              <h3 className="m360-card-title">Uma ideia para <strong>hoje</strong></h3>
              <p className="text-xs text-support-2/70 mt-1 mb-4">Uma sugestão simples para criar um momento especial com seu filho hoje.</p>
              <ActivityOfDay dateKey={dateKey} profile={profile} activities={allActivities} />
            </div>
          </Reveal>
        </SoftCard>

        {/* Quick Actions Grid */}
        <SoftCard className="mb-4">
          <Reveal delay={260}>
            <div>
              <Badge className="mb-4">Ações Rápidas</Badge>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {quickActions.map((action, index) => (
                  <Reveal key={action.title} delay={index * 80} className="h-full">
                    <button
                      type="button"
                      className="h-full rounded-2xl bg-white border border-white/60 p-4 shadow-soft transition-all duration-150 ease-out hover:shadow-elevated hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                      aria-label={`${action.title} - ${action.description}`}
                    >
                      <div className="flex flex-col items-start gap-2 h-full">
                        <div className="flex-shrink-0">
                          <AppIcon name={action.iconName as any} size={24} decorative className="text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm text-support-1">{action.title}</p>
                          <p className="mt-1 text-xs text-support-2">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </SoftCard>

        {/* Quick Notes / Notes Card */}
        <SoftCard className="notesCard mb-4">
          <Reveal delay={360}>
            <Badge className="mb-2">Anotações</Badge>
            <div className="notesCard-header mb-4 flex items-start justify-between gap-4">
              <div className="notesCard-text flex-1">
                <h3 className="m360-card-title">
                  <span className="mr-1">
                    <AppIcon name="edit" size={16} aria-hidden />
                  </span>
                  {notesLabel}
                </h3>
                <p className="notesCard-meta meta text-xs text-support-2/70">Anote <strong>pensamentos</strong>, ideias ou momentos importantes para lembrar depois.</p>
              </div>
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
          </Reveal>
        </SoftCard>
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
