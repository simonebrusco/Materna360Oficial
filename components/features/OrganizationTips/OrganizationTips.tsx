import { getDailyOrganizationTips } from '@/app/lib/organizationTips'
import { Reveal } from '@/components/ui/Reveal'

import { OrganizationTipsClient } from './OrganizationTipsClient'

export function OrganizationTips() {
  const tips = getDailyOrganizationTips()

  return (
    <section className="space-y-6">
      <Reveal>
        <div className="space-y-2">
          <h2 className="section-title">Dicas de Organização</h2>
          <p className="section-subtitle max-w-2xl text-support-2">
            Pequenas ações diárias que trazem leveza para a rotina. Escolha o que cabe hoje, respire e celebre cada passo.
          </p>
        </div>
      </Reveal>

      <OrganizationTipsClient tips={tips} />
    </section>
  )
}
