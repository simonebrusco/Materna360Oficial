// app/page.tsx
import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'

// Wrappers/componentes base já padronizados
import SectionWrapper from '@/components/common/SectionWrapper'
import SectionBoundary from '@/components/common/SectionBoundary'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Home, Heart, Compass, User } from 'lucide-react'

type HomeFeature = {
  title: string
  description: string
  icon: React.ReactNode
  href: Route
}

const FEATURES: HomeFeature[] = [
  {
    title: 'Meu Dia',
    description: 'Seu resumo diário: humor, atividade do dia, planner e checklist.',
    icon: <Home className="size-5" aria-hidden="true" />,
    href: '/meu-dia',
  },
  {
    title: 'Cuidar',
    description: 'Mindfulness, respiração guiada, jornadas e autocuidado.',
    icon: <Heart className="size-5" aria-hidden="true" />,
    href: '/cuidar',
  },
  {
    title: 'Descobrir',
    description: 'Ideias inteligentes por idade/tempo/energia + livros e brinquedos.',
    icon: <Compass className="size-5" aria-hidden="true" />,
    href: '/descobrir',
  },
  {
    title: 'Eu360',
    description: 'Perfil, plano, KPIs semanais, conquistas e exportar PDF (Plus+).',
    icon: <User className="size-5" aria-hidden="true" />,
    href: '/eu360',
  },
] as const

export default function HomePage() {
  return (
    <SectionBoundary withPageGradient>
      <SectionWrapper className="pb-24">
        {/* Hero */}
        <div className="mx-auto max-w-screen-lg text-center mb-10">
          <p className="text-[13px] tracking-wide text-[#2f3a56] opacity-90 mb-2">
            Bem-vinda ao Materna360
          </p>
          <h1 className="font-semibold text-2xl md:text-3xl text-[#2f3a56]">
            Organização familiar, bem-estar e desenvolvimento infantil — sem culpa.
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#545454]">
            Escolha um caminho para começar. Você pode voltar aqui quando quiser.
          </p>
        </div>

        {/* Grid 2×2 das abas */}
        <div className="mx-auto max-w-screen-lg grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="flex flex-col h-full">
              <CardHeader className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center rounded-xl bg-[#ffd8e6] text-[#ff005e] p-2"
                >
                  {feature.icon}
                </span>
                <div className="flex-1">
                  <CardTitle className="text-[#2f3a56]">{feature.title}</CardTitle>
                </div>
              </CardHeader>

              <CardContent className="text-[#545454]">
                <p className="text-sm">{feature.description}</p>
              </CardContent>

              <CardFooter className="mt-auto">
                <div className="flex items-center justify-between w-full">
                  <div aria-hidden="true" className="text-xs text-[#545454] opacity-70">
                    Acesse para começar
                  </div>

                  {/* typedRoutes: href tipado como Route */}
                  <Link href={feature.href} className="inline-flex">
                    <Button variant="secondary" size="md" aria-label={`Acessar ${feature.title}`}>
                      Acessar
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </SectionWrapper>
    </SectionBoundary>
  )
}
