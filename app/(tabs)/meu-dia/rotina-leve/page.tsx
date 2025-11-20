'use client'

import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

interface Card {
  id: string
  title: string
  subtitle: string
}

// TODO: In the next phase, these cards will expand inline with AI-powered content
// without navigating away from /meu-dia/rotina-leve. For now, they remain as
// non-interactive cards to avoid 404 errors from non-existent routes.
const CARDS: Card[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    subtitle: 'Inspirações simples para deixar o dia mais leve.',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    subtitle: 'Você diz o ingrediente, eu te ajudo com o resto.',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    subtitle: 'Uma frase e um pequeno cuidado para hoje.',
  },
]

export default function RotinaLevePage() {
  let cardIndex = 0

  return (
    <PageTemplate
      label="MEU DIA"
      title="Rotina Leve"
      subtitle="Organize o seu dia com leveza e clareza."
    >
      <div className="space-y-12 md:space-y-16">
        <Reveal delay={0}>
          <div className="pt-2">
            <div className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#2f3a56] mb-3 font-poppins">
                Inspire o seu dia
              </h2>
              <p className="text-base text-[#545454] leading-relaxed font-poppins">
                Comece trazendo leveza antes de organizar tudo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {CARDS.map((card) => {
                const currentIndex = cardIndex
                cardIndex += 1

                return (
                  <Reveal key={card.id} delay={currentIndex * 25}>
                    <div className="h-full">
                      <SoftCard className="flex flex-col h-full hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 transition-all duration-200">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-[#2f3a56] mb-3 font-poppins">
                            {card.title}
                          </h3>
                          <p className="text-sm text-[#545454]/85 leading-relaxed font-poppins">
                            {card.subtitle}
                          </p>
                        </div>
                        <div className="flex justify-end mt-6 pt-2 border-t border-[#ececec]/30">
                          <span className="text-sm font-semibold text-primary tracking-wide font-poppins">
                            Ver mais →
                          </span>
                        </div>
                      </SoftCard>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* Closing message */}
        <div className="mt-12 pt-12 border-t border-[#ececec]/50">
          <p className="text-center text-base text-[#545454] leading-relaxed font-poppins">
            Organize seu dia com leveza. Pequenos passos fazem a grande diferença. <span className="text-[#ff005e] text-xl">❤️</span>
          </p>
        </div>
      </div>
    </PageTemplate>
  )
}
