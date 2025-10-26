'use client'

import { OrgTipsGrid } from '@/components/features/OrgTips/OrgTipsGrid'

export default function OrganizationTips() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <span aria-hidden="true">💡</span>
          <span>Dicas de Organização</span>
        </h2>
        <p className="section-subtitle max-w-2xl text-support-2">
          Sugestões rápidas para organizar a rotina com gentileza e criar espaços de respiro no dia a dia.
        </p>
      </div>

      <OrgTipsGrid />
    </section>
  )
}
