'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { useEscapeToClose } from '@/components/hooks/useEscapeToClose'
import { track } from '@/app/lib/telemetry'
import { setCurrentPlanId } from '@/app/lib/planClient'

interface UpgradeSheetProps {
  feature?: string
  onClose: () => void
  onUpgrade?: () => void
}

/**
 * Modal sheet for premium upgrade with trial and direct upgrade options
 */
export function UpgradeSheet({
  feature = 'Exportar relatórios em PDF',
  onClose,
  onUpgrade,
}: UpgradeSheetProps) {
  const [loading, setLoading] = useState(false)

  // Escape key handling
  useEscapeToClose(true, onClose)

  const handleStartTrial = async () => {
    try {
      setLoading(true)
      track('plan_start_trial', {
        source: 'upgrade_sheet',
        feature,
        timestamp: new Date().toISOString(),
      })
      
      // Set plan to premium for trial
      setCurrentPlanId('premium')
      
      // Emit success event
      track('plan_upgrade_success', {
        type: 'trial',
        feature,
        timestamp: new Date().toISOString(),
      })
      
      onClose()
      onUpgrade?.()
    } catch (error) {
      console.error('Failed to start trial:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeClick = () => {
    track('paywall_open', {
      source: 'upgrade_sheet',
      feature,
      timestamp: new Date().toISOString(),
    })
    
    // Navigate to plans page
    window.location.href = '/planos'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <Card className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-10">
        <div className="space-y-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-support-2 hover:text-support-1 transition-colors"
            aria-label="Fechar"
          >
            <AppIcon name="x" size={20} decorative />
          </button>

          {/* Header */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
              Desbloquear recurso
            </p>
            <h2 className="mt-2 text-2xl font-bold text-support-1">
              {feature}
            </h2>
            <p className="mt-2 text-sm text-support-2">
              Experimente a versão Premium gratuitamente por 7 dias, ou faça upgrade agora.
            </p>
          </div>

          {/* Trial highlight */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-start gap-3">
              <AppIcon name="sparkles" size={20} variant="brand" className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">
                  Teste grátis por 7 dias
                </p>
                <p className="text-xs text-support-2 mt-1">
                  Acesso completo ao plano Premium. Sem cartão de crédito. Cancele a qualquer momento.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Iniciando...' : 'Começar teste de 7 dias'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleUpgradeClick}
              className="w-full"
            >
              Ver planos e fazer upgrade
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              className="w-full"
            >
              Talvez depois
            </Button>
          </div>

          {/* Footer info */}
          <p className="text-xs text-center text-support-2">
            Oferecemos 30 dias de garantia. Se não ficar satisfeita, reembolsamos tudo.
          </p>
        </div>
      </Card>
    </div>
  )
}
