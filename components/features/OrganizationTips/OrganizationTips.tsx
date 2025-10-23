import { getDailyOrganizationTips } from '@/app/lib/organizationTips'
import { Reveal } from '@/components/ui/Reveal'

import { OrganizationTipsClient } from './OrganizationTipsClient'

export function OrganizationTips() {
  const tips = getDailyOrganizationTips()

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-support-1 md:text-2xl">💡 Dicas de Organização</h2>
          <p className="max-w-2xl text-sm text-support-2 md:text-base">
            Pequenas ações diárias que trazem leveza para a rotina. Escolha o que cabe hoje, respire e celebre cada passo.
          </p>
        </div>
      </Reveal>

      <OrganizationTipsClient tips={tips} />
    </div>
  )
}
