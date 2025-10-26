import { Reveal } from '@/components/ui/Reveal'

import ProfessionalsSectionClient from './ProfessionalsSectionClient'

export default function ProfessionalsSection() {
  return (
    <section
      id="profissionais-apoio"
      className="SectionWrapper CardElevate rounded-3xl border-2 border-primary bg-white px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      aria-labelledby="professionals-support-title"
    >
      <header className="space-y-2 md:space-y-3">
        <span className="eyebrow-capsule">Rede Materna</span>
        <h2 id="professionals-support-title" className="text-[20px] font-bold leading-[1.28] text-support-1 md:text-[22px]">
          Profissionais de Apoio
        </h2>
        <p className="max-w-2xl text-sm leading-[1.45] text-support-2/85 md:text-base">
          Use os filtros para encontrar especialistas em formato online que combinam com as necessidades da sua família.
        </p>
      </header>

      <div className="mt-4 md:mt-5">
        <ProfessionalsSectionClient />
      </div>
    </section>
  )
}

export { ProfessionalsSection }
