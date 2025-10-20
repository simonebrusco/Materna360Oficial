import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-secondary to-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4">
            🌸 Materna360
          </h1>
          <p className="text-lg md:text-xl text-support-1 mb-2 font-medium">
            Seu ecossistema de bem-estar, organização e desenvolvimento
          </p>
          <p className="text-support-2 mb-8 max-w-2xl mx-auto">
            Combine tecnologia, autocuidado e parentalidade consciente em uma experiência integrada e acolhedora.
          </p>
          <Link href="/meu-dia" className="inline-block">
            <Button variant="primary" size="sm">
              Começar Agora
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-support-1 text-center mb-12">
          Tudo que você precisa em um só lugar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-md transition-all">
            <h3 className="text-3xl font-bold text-primary mb-2">🏡 Meu Dia</h3>
            <p className="text-sm text-support-2 mb-4">
              Organize sua rotina e planeje com sua família.
            </p>
            <Link href="/meu-dia" className="inline-block">
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <h3 className="text-3xl font-bold text-primary mb-2">🌿 Cuidar</h3>
            <p className="text-sm text-support-2 mb-4">
              Meditações, respiração e autocuidado.
            </p>
            <Link href="/cuidar" className="inline-block">
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <h3 className="text-3xl font-bold text-primary mb-2">🧸 Descobrir</h3>
            <p className="text-sm text-support-2 mb-4">
              Atividades e brincadeiras para seus filhos.
            </p>
            <Link href="/descobrir" className="inline-block">
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-all">
            <h3 className="text-3xl font-bold text-primary mb-2">💛 Eu360</h3>
            <p className="text-sm text-support-2 mb-4">
              Check-in emocional e progresso.
            </p>
            <Link href="/eu360" className="inline-block">
              <Button size="sm" variant="secondary">
                Acessar
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-t from-secondary to-white py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-support-1 mb-6">
          Pronta para começar?
        </h2>
        <Link href="/meu-dia" className="inline-block">
          <Button variant="primary" size="sm">
            Entrar no Materna360
          </Button>
        </Link>
      </div>
    </main>
  )
}
