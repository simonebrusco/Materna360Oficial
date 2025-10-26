'use client'

import { OrgTipsGrid } from '@/components/features/OrgTips/OrgTipsGrid'

export default function OrganizationTips() {
  return (
    <section className="rounded-3xl border border-white/60 bg-white/85 px-6 py-8 shadow-[0_24px_50px_-28px_rgba(47,58,86,0.3)] backdrop-blur md:px-8 md:py-10">
      <header className="sr-only">
        <span className="text-sm font-semibold text-support-2/80">Rotina leve</span>
        <h2 className="flex items-center gap-2 text-[22px] font-semibold text-support-1">
          <span aria-hidden="true">💡</span>
          <span>Dicas de Organização</span>
        </h2>
        <p className="max-w-2xl text-sm text-support-2/80 md:text-base">
          Sugestões rápidas para organizar a rotina com gentileza e criar espaços de respiro no dia a dia.
        </p>
      </header>

      <div>
        <OrgTipsGrid />
      </div>
    </section>
  )
}
