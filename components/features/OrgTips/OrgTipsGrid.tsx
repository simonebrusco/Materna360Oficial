'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { ORG_TIPS, type OrgTip } from '@/data/org-tips'

import { OrgTipModal } from './OrgTipModal'

type ToastState = {
  message: string
  type?: 'success' | 'error' | 'info'
}

export function OrgTipsGrid() {
  const [selectedTip, setSelectedTip] = useState<OrgTip | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    ORG_TIPS.forEach((tip) => {
      console.debug('org_tip_card_view', { id: tip.id })
    })
  }, [])

  const cards = useMemo(() => ORG_TIPS, [])

  const handleViewMore = (tip: OrgTip) => {
    setSelectedTip(tip)
    setIsModalOpen(true)
    console.debug('org_tip_modal_open', { id: tip.id })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTip(null)
  }

  const handleComplete = (tip: OrgTip) => {
    console.debug('org_tip_complete', { id: tip.id })
    handleCloseModal()
  }

  const handleAddToPlanner = (tip: OrgTip) => {
    console.debug('planner:add:not-implemented', { id: tip.id })
    setToast({ message: 'Em breve você poderá salvar no planner ❤️', type: 'info' })
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-y-4 gap-x-3 md:grid-cols-2 md:gap-y-5 md:gap-x-4 lg:grid-cols-3 lg:gap-y-6 lg:gap-x-6">
        {cards.map((tip) => (
          <article
            key={tip.id}
            data-testid={tip.testId}
            className="group flex h-full min-h-[168px] flex-col justify-between rounded-3xl border border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-secondary/15 p-6 shadow-[0_22px_48px_-26px_rgba(47,58,86,0.3)] transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-26px_rgba(255,0,94,0.26)]"
          >
            <div className="space-y-3">
              <span aria-hidden="true" className="text-3xl">
                {tip.icon}
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-support-1 md:text-xl">{tip.title}</h3>
                <p className="text-sm text-support-2/80 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
                  {tip.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
                  <span aria-hidden="true">⏱</span>
                  {tip.duration}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-support-2/10 px-3 py-1 text-xs font-semibold text-support-2">
                  <span aria-hidden="true">🧩</span>
                  {tip.category}
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="primary" className="min-w-[120px]" onClick={() => handleViewMore(tip)}>
                Ver mais
              </Button>
              <Button size="sm" variant="outline" className="min-w-[140px]" onClick={() => handleAddToPlanner(tip)}>
                Adicionar ao planner
              </Button>
            </div>
          </article>
        ))}
      </div>

      {selectedTip && (
        <OrgTipModal tip={selectedTip} open={isModalOpen} onClose={handleCloseModal} onComplete={handleComplete} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
