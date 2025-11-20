'use client'

import Link from 'next/link'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

interface Card {
  id: string
  title: string
  subtitle: string
  href: string
}

const CARDS: Card[] = [
  {
    id: 'ideias-rapidas',
    title: 'Ideias Rápidas',
    subtitle: 'Inspirações simples para deixar o dia mais leve.',
    href: '/meu-dia/rotina-leve/ideias-rapidas',
  },
  {
    id: 'receitas-inteligentes',
    title: 'Receitas Inteligentes',
    subtitle: 'Você diz o ingrediente, eu te ajudo com o resto.',
    href: '/meu-dia/rotina-leve/receitas-inteligentes',
  },
  {
    id: 'inspiracoes-do-dia',
    title: 'Inspirações do Dia',
    subtitle: 'Uma frase e um pequeno cuidado para hoje.',
    href: '/meu-dia/rotina-leve/inspiracoes-do-dia',
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
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#2f3a56] mb-3">
                Inspire o seu dia
              </h2>
              <p className="text-base text-[#545454] leading-relaxed">
                Comece trazendo leveza antes de organizar tudo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {CARDS.map((card) => {
                const currentIndex = cardIndex
                cardIndex += 1

                return (
                  <Reveal key={card.id} delay={currentIndex * 25}>
                    <Link href={card.href}>
                      <SoftCard className="flex flex-col h-full hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)] active:scale-95 cursor-pointer transition-all duration-200">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-[#2f3a56] mb-2">
                            {card.title}
                          </h3>
                          <p className="text-sm text-[#545454]/85 leading-relaxed">
                            {card.subtitle}
                          </p>
                        </div>
                        <div className="flex justify-end mt-4">
                          <span className="text-sm font-semibold text-primary tracking-wide">
                            Ver mais →
                          </span>
                        </div>
                      </SoftCard>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* Closing message */}
        <div className="mt-12 pt-12 border-t border-[#ececec]/50">
          <p className="text-center text-base text-[#545454] leading-relaxed">
            Organize seu dia com leveza. Pequenos passos fazem a grande diferença. <span className="text-[#ff005e] text-xl">❤️</span>
          </p>
        </div>
      </div>
    </PageTemplate>
  )
}
