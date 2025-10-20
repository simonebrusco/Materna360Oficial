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
            Combine tecnologia, autocuidado e parentalidade consciente em uma experiência integrada e acolhedora. Organize sua rotina, cuide de si mesma e acompanhe o crescimento de seus filhos com propósito.
          </p>
          <Link href="/meu-dia">
            <Button variant="primary" size="sm" className="md:size-md">
              Começar Agora →
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
          <Link href="/meu-dia">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🏡</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">Meu Dia</h3>
                  <p className="text-sm text-support-2 mb-4">
                    Saudação dinâmica, planejador familiar, rotina, checklist e notas. Celebre cada momento.
                  </p>
                  <Button size="sm" variant="secondary">
                    Acessar
                  </Button>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/cuidar">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🌿</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">Cuidar</h3>
                  <p className="text-sm text-support-2 mb-4">
                    Meditações, respiração guiada, dicas de organização e acesso a profissionais.
                  </p>
                  <Button size="sm" variant="secondary">
                    Acessar
                  </Button>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/descobrir">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🧸</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">Descobrir</h3>
                  <p className="text-sm text-support-2 mb-4">
                    Atividades por idade, brincadeiras, livros e produtos recomendados.
                  </p>
                  <Button size="sm" variant="secondary">
                    Acessar
                  </Button>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/eu360">
            <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💛</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-2">Eu360</h3>
                  <p className="text-sm text-support-2 mb-4">
                    Check-in emocional, conquistas, gratidão e resumo semanal de progresso.
                  </p>
                  <Button size="sm" variant="secondary">
                    Acessar
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          <div className="text-center">
            <div className="text-5xl mb-4">💪</div>
            <h3 className="font-bold text-support-1 mb-2">Empoderada</h3>
            <p className="text-sm text-support-2">
              Tenha controle total da sua rotina e bem-estar
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="font-bold text-support-1 mb-2">Consciente</h3>
            <p className="text-sm text-support-2">
              Viva com intenção e autenticidade
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="font-bold text-support-1 mb-2">Conectada</h3>
            <p className="text-sm text-support-2">
              Com sua família, com você mesma
            </p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-gradient-to-t from-secondary to-white py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-support-1 mb-6">
          Pronta para começar?
        </h2>
        <p className="text-support-2 mb-8 max-w-xl mx-auto">
          Sua jornada de bem-estar, organização e conexão começa agora
        </p>
        <Link href="/meu-dia">
          <Button variant="primary" size="sm" className="md:size-md">
            Entrar no Materna360 →
          </Button>
        </Link>
      </div>
    </main>
  )
}
