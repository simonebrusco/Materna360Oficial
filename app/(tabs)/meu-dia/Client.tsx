'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { useProfile } from '@/app/hooks/useProfile'
import { getWeekStartKey, buildWeekLabels } from '@/app/lib/weekLabels'
import { getBrazilDateKey } from '@/app/lib/dateKey'

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

// Focus query param to section ID mapping
const FOCUS_TO_ID: Record<string, string> = {
  planner: 'meu-dia-planner',
  humor: 'meu-dia-humor',
  conexao: 'meu-dia-conexao',
  resumo: 'meu-dia-resumo',
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
  __fallbackGreeting__ = 'Hoje é um presente para você.',
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

  const searchParams = useSearchParams()

  const [showPlannerSheet, setShowPlannerSheet] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([])
  const [notes, setNotes] = useState<string[]>([])

  const { name } = useProfile() || { name: finalProfile.motherName }

  // Handle focus query param and smooth scroll
  useEffect(() => {
    const focus = searchParams.get('focus')
    if (!focus) return

    const targetId = FOCUS_TO_ID[focus]
    if (!targetId) return

    // Small timeout to ensure layout is ready before scrolling
    const timeout = setTimeout(() => {
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [searchParams])

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
      title: draft.title,
      done: false,
      createdAt: Date.now(),
      note: draft.note,
      time: draft.time,
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

  const firstName = name ? name.split(' ')[0] : ''
  const pageTitle = firstName ? `${firstName}, como está seu dia hoje?` : 'Meu dia'
  const pageSubtitle =
    'Planeje pequenas tarefas, acompanhe o humor e celebre suas conquistas. Cada marca registrada aqui é um lembrete: você está fazendo o melhor possível.'

  return (
    <PageTemplate
      label="MEU DIA"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <div className="max-w-[1160px] mx-auto px-4 md:px-6 space-y-4 md:space-y-5">
        {/* Daily Planner - Only Component */}
        <div id="meu-dia-print-area" className="print-card">
          <Reveal delay={0}>
            <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 transition-all duration-200 hover:shadow-[0_16px_40px_rgba(255,0,94,0.08)]">
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
        </div>
      </div>
    </PageTemplate>
  )
}
