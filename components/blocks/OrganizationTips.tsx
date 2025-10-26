'use client'

import { OrgTipsGrid } from '@/components/features/OrgTips/OrgTipsGrid'

export default function OrganizationTips() {
  return (
    <section className="CardElevate rounded-3xl border border-white/70 bg-white px-6 py-7 backdrop-blur-sm md:px-8 md:py-9">
      <header className="space-y-2 md:space-y-3">
        <span className="eyebrow-capsule">Rotina leve</span>
        <h2 className="flex items-center gap-2 text-[20px] font-bold leading-[1.28] text-support-1 md:text-[22px]">
          <span aria-hidden="true">💡</span>
          <span>Dicas de Organização</span>
        </h2>
        <p className="max-w-2xl text-sm leading-[1.45] text-support-2/85 md:text-base">
          Sugestões rápidas para organizar a rotina com gentileza e criar espaços de respiro no dia a dia.
        </p>
        <div className="h-px w-full bg-support-2/15" />
      </header>

      <div className="mt-4 md:mt-5">
        <OrgTipsGrid />
      </div>
    </section>
  )
}
