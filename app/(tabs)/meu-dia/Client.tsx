'use client'


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

export function MeuDiaClient({
  currentDateKey,
  weekStartKey,
  weekLabels,
  plannerTitle,
  profile,
  allActivities = [],
  recommendations = [],
  initialBuckets = [],
  __builderPreview__ = false,
  __fallbackProfile__ = DEFAULT_PROFILE,
  __fallbackWeekLabels__ = [],
  __fallbackCurrentDateKey__ = getBrazilDateKey(),
  __fallbackWeekStartKey__ = getWeekStartKey(getBrazilDateKey()),
  __fallbackPlannerTitle__ = 'Semana',
}: MeuDiaClientProps) {
  const finalProfile = profile || __fallbackProfile__
  const finalCurrentDateKey = currentDateKey || __fallbackCurrentDateKey__
  const finalWeekStartKey = weekStartKey || __fallbackWeekStartKey__
  const finalWeekLabels = weekLabels || __fallbackWeekLabels__
  const finalPlannerTitle = plannerTitle || __fallbackPlannerTitle__

  const { name } = useProfile() || { name: finalProfile.motherName }

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
