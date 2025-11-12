'use client'

import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { renderPremiumDoc } from './PdfPremium'

type Props = {
  weekRange?: string
  moodSummary?: string
  coachTips?: string[]
}

export function PremiumExportButton({
  weekRange = 'Esta semana',
  moodSummary = 'Semana equilibrada com progresso consistente',
  coachTips = [
    'Reserve tempo para autocuidado diariamente',
    'Pratique respiração consciente antes de dormir',
    'Compartilhe um momento de qualidade com seus filhos',
  ],
}: Props) {
  const handleExport = () => {
    renderPremiumDoc({
      weekRange,
      moodSummary,
      coachTips,
    })
  }

  return (
    <Button
      variant="primary"
      onClick={handleExport}
      className="inline-flex items-center gap-2"
    >
      <AppIcon name="download" size={16} decorative />
      Premium PDF
    </Button>
  )
}
