'use client'

import type { ChildActivity, ChildRecommendation } from '@/app/data/childContent'
import type { Profile, AgeRange } from '@/app/lib/ageRange'
import { FamilyPlanner } from '@/components/blocks/FamilyPlanner'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { useProfile } from '@/app/hooks/useProfile'
import { getWeekStartKey, buildWeekLabels } from '@/app/lib/weekLabels'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { ClientOnly } from '@/components/common/ClientOnly'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { PlannerItem } from '@/lib/plannerData'

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
  __builderPreview__?: boolean
  __fallbackProfile__?: Profile
  __fallbackGreeting__?: string
  __fallbackWeekLabels__?: { key: string; shortLabel: string; longLabel: string; chipLabel: string }[]
  __fallbackCurrentDateKey__?: string
  __fallbackWeekStartKey__?: string
  __fallbackPlannerTitle__?: string
  __disableHeavy__?: boolean
}

const DEFAULT_PROFILE: Profile = {
  motherName: 'Mãe',
  children: [{ name: 'Seu filho' } as any],
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

  return (
    <PageTemplate
      label="MEU DIA"
      title="Seu Dia Organizado"
      subtitle="Um espaço para planejar com leveza e clareza."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* Premium Planner */}
          <Reveal delay={0}>
            <div id="meu-dia-print-area" className="print-card" suppressHydrationWarning>
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
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
