'use client'

import React from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { upgradeToPremium, setPlan, getPlan } from '@/app/lib/plan'
import UpgradeSheet from '@/components/premium/UpgradeSheet'

export default function PlansPage() {
  const [open, setOpen] = React.useState(false)
  const plan = typeof window !== 'undefined' ? getPlan() : 'free'

  return (
    <SectionWrapper className="max-w-screen-md mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-support-1">Planos</h1>
        <p className="text-sm text-support-2 mt-1">
          Escolha o plano ideal para você. Seu plano atual: <strong>{plan}</strong>.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <SoftCard className="p-4 sm:p-5 min-h-[140px]">
          <h3 className="font-semibold text-support-1">Free</h3>
          <p className="text-sm text-support-2 mt-1">Recursos essenciais.</p>
          <div className="mt-3">
            <Button variant="secondary" size="md" onClick={() => setPlan('free')}>
              Continuar no Free
            </Button>
          </div>
        </SoftCard>

        <SoftCard className="p-4 sm:p-5 min-h-[140px]">
          <h3 className="font-semibold text-support-1">Trial 7 dias</h3>
          <p className="text-sm text-support-2 mt-1">Experimente recursos Premium.</p>
          <div className="mt-3">
            <Button variant="primary" size="md" onClick={() => setPlan('premium')}>
              Iniciar Teste
            </Button>
          </div>
        </SoftCard>

        <SoftCard className="p-4 sm:p-5 min-h-[140px] sm:col-span-2">
          <div className="flex items-start justify-between w-full gap-3">
            <div>
              <h3 className="font-semibold text-support-1">Premium</h3>
              <p className="text-sm text-support-2 mt-1">Tudo liberado + PDF avançado.</p>
            </div>
            <Button variant="primary" size="md" onClick={() => setOpen(true)}>
              Upgrade
            </Button>
          </div>
        </SoftCard>
      </div>

      <UpgradeSheet open={open} onOpenChange={setOpen} />
    </SectionWrapper>
  )
}
