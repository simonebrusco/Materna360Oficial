'use client'

import * as React from 'react'
import { printElementById } from '@/app/lib/print'
import { track } from '@/app/lib/telemetry'
import { canAccess } from '@/app/lib/premiumGate'
import UpgradeSheet from '@/components/premium/UpgradeSheet'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'


/**
 * Export block for PDF with premium gating
 * Shows upgrade modal if user doesn't have access
 */
export function ExportBlock() {

  const [hasAccess, setHasAccess] = React.useState(false)
  const [showUpgradeSheet, setShowUpgradeSheet] = React.useState(false)

  React.useEffect(() => {
    const access = canAccess('export.pdf')
    setHasAccess(access)

    if (!access) {
      track('paywall_open', {
        feature: 'export.pdf',
        context: 'eu360_export_block',
        timestamp: new Date().toISOString(),
      })
    }
  }, [])

  const handleExportClick = () => {
    if (!hasAccess) {
      setShowUpgradeSheet(true)
      return
    }

    track('plan_feature_accessed', {
      feature: 'export.pdf',
      context: 'eu360',
      timestamp: new Date().toISOString(),
    })

    printElementById('eu360-print-area')
  }

  return (
    <>
      <div className="rounded-[var(--radius-card)] border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppIcon name="download" size={20} variant="brand" />
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-support-1">
                Exportar Semana em PDF
              </h2>
              <p className="text-xs text-support-2 mt-0.5">
                {hasAccess
                  ? 'Gere um resumo em PDF com todos os dados da semana'
                  : 'Disponível no plano Plus e acima'}
              </p>
            </div>
          </div>
          <Button
            variant={hasAccess ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleExportClick}
            className="flex-shrink-0"
          >
            {hasAccess ? 'Exportar' : 'Desbloquear'}
          </Button>
        </div>
      </div>

      {/* Upgrade modal if user doesn't have access */}
      <UpgradeSheet open={showUpgradeSheet} onOpenChange={setShowUpgradeSheet} />
    </>
  )
}
