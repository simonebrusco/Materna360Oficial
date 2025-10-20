import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="min-h-screen p-6 pb-32 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">🌸 Materna360</h1>
          <p className="text-lg text-support-2">
            Um ecossistema digital de bem-estar, organização familiar e desenvolvimento infantil
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link href="/meu-dia">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-2">🏡 Meu Dia</h2>
                  <p className="text-sm text-support-2 mb-4">Organize sua rotina e planeje com sua família</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/cuidar">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-2">🌿 Cuidar</h2>
                  <p className="text-sm text-support-2 mb-4">Meditações, respiração e dicas de autocuidado</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/descobrir">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-2">🎨 Descobrir</h2>
                  <p className="text-sm text-support-2 mb-4">Atividades e brincadeiras para seus filhos</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/eu360">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-2">💛 Eu360</h2>
                  <p className="text-sm text-support-2 mb-4">Check-in emocional, progresso e conquistas</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  )
}
