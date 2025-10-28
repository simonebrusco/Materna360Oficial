import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="relative min-h-screen pb-20">
      <section className="relative overflow-hidden pb-20 pt-16">
        <div className="hero-gradient">
          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center">
            <h1 className="text-4xl font-bold text-support-1">Materna360</h1>
            <p className="mt-4 text-base text-support-2">
              Uma experiência digital pensada para cuidar de você, da sua família e dos seus sonhos.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/meu-dia">
                <Button size="lg" variant="primary">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
