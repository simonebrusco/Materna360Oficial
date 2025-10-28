'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Copy, Play, Share2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

import SectionBoundary from '@/components/common/SectionBoundary'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import GridRhythm from '@/components/common/GridRhythm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'

import { trackTelemetry, sample } from '@/app/lib/telemetry'

import {
  friendlyEnergyLabel,
  friendlyLocationLabel,
} from '@/app/lib/quickIdeasCatalog'
import type {
  QuickIdea,
  QuickIdeasAgeBucket,
  QuickIdeasBadge,
  QuickIdeasEnergy,
  QuickIdeasLocation,
  QuickIdeasTimeWindow,
} from '@/app/types/quickIdeas'
import type { RecShelfGroup, RecShelfItem } from '@/app/lib/recShelf'
import type { RecProductKind } from '@/app/types/recProducts'
import type { SelfCareEnergy } from '@/app/types/selfCare'
import type { ProfileChildSummary } from '@/app/lib/profileTypes'
import { getClientFlags, type DiscoverFlags } from '@/app/lib/flags'
import type { FlashRoutineT, ProfileSummaryT, SelfCareT } from '@/app/lib/discoverSchemas'

type ToastState = {
  message: string
  type: 'success' | 'error' | 'info'
} | null

type DescobrirClientProps = {
  initialRecipesQuery?: { stage: string }
  recommendationShelves?: unknown[]
  shelves?: unknown[]
  flags: DiscoverFlags
}

export default function DescobrirClient({
  initialRecipesQuery = { stage: 'baby' },
  recommendationShelves = [],
  shelves = [],
  flags,
}: DescobrirClientProps) {
  const [toast, setToast] = useState<ToastState>(null)
  const discoverFlags = getClientFlags(flags)
  const showRecShelf = discoverFlags.recShelf && shelves.length > 0
  const showFlashRoutine = discoverFlags.flashRoutine
  const showSelfCare = discoverFlags.selfCare

  return (
    <div className="min-h-screen space-y-8 bg-[#FFF9FB] py-8">
      <SectionWrapper>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-support-1">Descobrir</h1>
          <p className="text-support-2/80">Explore sugestões para sua família.</p>
        </div>
      </SectionWrapper>

      {showRecShelf && (
        <SectionBoundary>
          <SectionWrapper>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-support-1">Produtos Recomendados</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shelves.length === 0 && (
                  <p className="text-support-2/80">Nenhum produto disponível no momento.</p>
                )}
              </div>
            </div>
          </SectionWrapper>
        </SectionBoundary>
      )}

      {showFlashRoutine && (
        <SectionBoundary>
          <SectionWrapper>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-support-2/80">
              Rotina em breve...
            </div>
          </SectionWrapper>
        </SectionBoundary>
      )}

      {showSelfCare && (
        <SectionBoundary>
          <SectionWrapper>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 text-sm text-support-2/80">
              Cuidados consigo mesmo em breve...
            </div>
          </SectionWrapper>
        </SectionBoundary>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
