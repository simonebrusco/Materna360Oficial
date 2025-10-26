import { Reveal } from '@/components/ui/Reveal'

import { Reveal } from '@/components/ui/Reveal'

import ProfessionalsSectionClient from './ProfessionalsSectionClient'

export default function ProfessionalsSection() {
  return (
    <section
      id="profissionais-apoio"
      className="mt-4 rounded-3xl border-2 border-primary/40 bg-white/92 px-6 py-8 shadow-[0_30px_68px_-32px_rgba(255,0,94,0.32)] backdrop-blur md:px-8 md:py-10"
      aria-labelledby="professionals-support-title"
    >
      <Reveal>
        <header className="space-y-2.5">
          <span className="text-sm font-semibold text-support-2/80">Rede Materna</span>
          <h2 id="professionals-support-title" className="text-[22px] font-semibold text-support-1">
            Profissionais de Apoio
          </h2>
          <p className="max-w-2xl text-sm text-support-2/80 md:text-base">
            Use os filtros para encontrar especialistas em formato online que combinam com as necessidades da sua família.
          </p>
        </header>
      </Reveal>

      <div className="mt-6">
        <ProfessionalsSectionClient />
      </div>
    </section>
  )
}

export { ProfessionalsSection }
