'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProfile } from '@/app/hooks/useProfile'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard as Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageGrid } from '@/components/common/PageGrid'
import { FilterPill } from '@/components/ui/FilterPill'
import { Badge } from '@/components/ui/Badge'
import { ChildDiary } from './components/ChildDiary'
import { ChildDiaryCard } from './components/ChildDiaryCard'
import { AppointmentsMVP } from './components/AppointmentsMVP'
import { BreathAudios } from './components/BreathAudios'
import { SectionH2 } from '@/components/common/Headings'

type Props = {
  recipesSection?: React.ReactNode
}

// Focus query param to section ID mapping
const FOCUS_TO_ID: Record<string, string> = {
  mae: 'cuidar-mae',
  filho: 'cuidar-filho',
}

export default function CuidarClient({ recipesSection }: Props) {
  const { name } = useProfile();
  const searchParams = useSearchParams()
  const firstName = name ? name.split(' ')[0] : '';
  const pageTitle = firstName ? `${firstName}, vamos cuidar do que importa agora?` : 'Cuidar';
  const pageSubtitle = 'Saúde física, emocional e segurança — no ritmo da vida real.';

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

  return (
    <PageTemplate
      label="CUIDAR"
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <Card>
        <div className="flex flex-wrap gap-2">
          <FilterPill active>Hoje</FilterPill>
          <FilterPill>Semana</FilterPill>
          <FilterPill>Bem-estar</FilterPill>
          <FilterPill>Sono</FilterPill>
          <FilterPill>Consultas</FilterPill>
        </div>
      </Card>

      <ChildDiaryCard />

      <PageGrid>
        <Card>
          <Badge className="mb-2">Bem-estar</Badge>
          <EmptyState
            title="Check-in de bem-estar"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>

        <ChildDiary />

        <Card>
          <Badge className="mb-2">Saúde</Badge>
          <EmptyState
            title="Saúde & Vacinas"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        </Card>
      </PageGrid>

      <Card>
        <Badge className="mb-2">Consultas</Badge>
        <AppointmentsMVP storageKey="cuidar:appointments" />
      </Card>

      <Card>
        <Badge className="mb-2">Receitas</Badge>
        {recipesSection ?? (
          <EmptyState
            title="Receitas saudáveis"
            text="Nenhum registro adicionado hoje. Que tal começar anotando como foi a alimentação ou o sono?"
          />
        )}
      </Card>

      <BreathAudios />
    </PageTemplate>
  )
}
