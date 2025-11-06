
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export default function Page() { redirect('/meu-dia') }

import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

const featureCards = [
  {
    href: '/meu-dia',
    title: 'Meu Dia',
    description: 'Organize sua rotina familiar com leveza e carinho.',
    emoji: '���',
  },
  {
    href: '/cuidar',
    title: 'Cuide-se',
    description: 'Guias de autocuidado, respiração e meditação para você.',
    emoji: '🌿',
  },
  {
    href: '/descobrir',
    title: 'Descobrir',
    description: 'Atividades lúdicas e educativas para os pequenos.',
    emoji: '🧸',
  },
  {
    href: '/eu360',
    title: 'Eu360',
    description: 'Registre emoções, conquistas e acompanhe seu bem-estar.',
    emoji: '💛',
  },
]

export default function Home() {
  return (
    <main className="relative min-h-screen pb-24 bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)]">
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="hero-gradient">
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6 md:py-24 animate-fade-up">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">
              Bem-vinda
            </span>
            <div className="flex flex-col items-center gap-3">
              <Image
                src="https://cdn.builder.io/api/v1/image/assets%2F7d9c3331dcd74ab1a9d29c625c41f24c%2F5b7e725c13924063a116efc21a335af1"
                alt="Flor de cerejeira Materna360"
                width={72}
                height={72}
                priority
                className="object-contain"
                style={{ width: 72, height: 72 }}
              />
              <h1 className="text-4xl font-bold text-support-1 sm:text-5xl md:text-6xl">Materna360</h1>
            </div>
            <p className="mt-4 max-w-2xl text-base text-support-2 sm:text-lg md:text-xl">
              Uma experiência digital pensada para cuidar de você, da sua família e dos seus sonhos com tecnologia, carinho e serenidade.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link href="/meu-dia">
                <Button size="lg" variant="primary">
                  Começar Agora
                </Button>
              </Link>
              <span className="text-xs font-medium uppercase tracking-[0.28em] text-support-2/70">
                Experiência imersiva Materna360
              </span>
            </div>
            <span className="absolute left-8 top-16 hidden h-16 w-16 rounded-3xl bg-white/30 blur-2xl sm:block" aria-hidden />
            <span className="absolute right-4 bottom-6 hidden h-24 w-24 rounded-full bg-primary/10 blur-3xl md:block" aria-hidden />
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold text-support-1 sm:text-3xl">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-sm text-support-2 sm:text-base">
            Explore espaços feitos para acolher sua rotina, oferecer apoio e inspirar novos caminhos.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:gap-8">
          {featureCards.map((feature, index) => (
            <Reveal key={feature.href} delay={index * 80} className="h-full">
              <Card className="h-full p-7">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex flex-col gap-3">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-soft transition-transform duration-500 group-hover/card:-translate-y-1 group-hover/card:shadow-elevated"
                      aria-hidden
                    >
                      {feature.emoji}
                    </span>
                    <h3 className="text-2xl font-semibold text-support-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-support-2 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Link href={feature.href} className="inline-flex">
                      <Button variant="secondary" size="md">
                        Acessar
                      </Button>
                    </Link>
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mt-24 overflow-hidden">
        <Reveal className="mx-auto max-w-5xl rounded-soft-3xl bg-gradient-to-br from-secondary/80 via-white/90 to-white px-6 py-16 text-center shadow-soft sm:px-10">
          <h2 className="text-2xl font-semibold text-support-1 sm:text-3xl">
            Pronta para viver o cuidado que você merece?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-support-2 sm:text-base">
            Descubra uma jornada pensada para equilibrar tecnologia, bem-estar e afeto. Materna360 acompanha cada passo com presença e acolhimento.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/meu-dia">
              <Button variant="primary" size="lg">
                Entrar no Materna360
              </Button>
            </Link>
          </div>
        </Reveal>
        <span className="pointer-events-none absolute -left-8 top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-6 bottom-6 h-36 w-36 rounded-full bg-secondary/70 blur-3xl" aria-hidden />
      </section>
    </main>
  )
}

