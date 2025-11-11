'use client'

import * as React from 'react'
import { MeuDiaClient } from '@/app/(tabs)/meu-dia/Client'
import { PageHeader } from '@/components/common/PageHeader'
import { BottomNav } from '@/components/common/BottomNav'

const isBuilder =
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).has('builder.preview') ||
    /builder\.io/.test(document.referrer || ''))

// Fallback data used when cookies/localStorage are blocked in iframe
const fallbackProfile = {
  motherName: 'Mãe',
  children: [{ name: 'Seu filho', ageMonths: 36 }],
}

const fallbackGreeting = 'Olá, Mãe!'

const fallbackWeekLabels = [
  { key: '2024-W01-Mon', shortLabel: 'Seg', longLabel: 'Segunda', chipLabel: 'Seg' },
  { key: '2024-W01-Tue', shortLabel: 'Ter', longLabel: 'Terça', chipLabel: 'Ter' },
  { key: '2024-W01-Wed', shortLabel: 'Qua', longLabel: 'Quarta', chipLabel: 'Qua' },
  { key: '2024-W01-Thu', shortLabel: 'Qui', longLabel: 'Quinta', chipLabel: 'Qui' },
  { key: '2024-W01-Fri', shortLabel: 'Sex', longLabel: 'Sexta', chipLabel: 'Sex' },
  { key: '2024-W01-Sat', shortLabel: 'Sab', longLabel: 'Sábado', chipLabel: 'Sab' },
  { key: '2024-W01-Sun', shortLabel: 'Dom', longLabel: 'Domingo', chipLabel: 'Dom' },
]

export default function BuilderEmbedPage() {
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])
  if (!ready) return null

  return (
    <main
      className="min-h-screen pb-24"
      style={{ backgroundColor: '#fff7fb' }}
    >
      <PageHeader
        title="Meu Dia (Builder Preview)"
        subtitle="Visualização segura para editor"
      />

      <MeuDiaClient
        __builderPreview__={isBuilder}
        __fallbackProfile__={fallbackProfile}
        __fallbackGreeting__={fallbackGreeting}
        __fallbackWeekLabels__={fallbackWeekLabels}
        __fallbackCurrentDateKey__={new Date().toISOString().slice(0, 10)}
        __fallbackWeekStartKey__={`${new Date().getFullYear()}-W01`}
        __fallbackPlannerTitle__="Planner do Dia"
      />

      <BottomNav />
    </main>
  )
}
