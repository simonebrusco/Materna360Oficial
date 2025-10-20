import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Descobrir() {
  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🎨 Descobrir</h1>
          <p className="text-support-2">Ideias de atividades e aprendizado para seus filhos</p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button className="px-4 py-2 bg-primary text-white rounded-full whitespace-nowrap">
              Todas
            </button>
            <button className="px-4 py-2 bg-secondary text-support-1 rounded-full whitespace-nowrap hover:bg-pink-100">
              0-2 anos
            </button>
            <button className="px-4 py-2 bg-secondary text-support-1 rounded-full whitespace-nowrap hover:bg-pink-100">
              3-5 anos
            </button>
            <button className="px-4 py-2 bg-secondary text-support-1 rounded-full whitespace-nowrap hover:bg-pink-100">
              6+ anos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">🎯 Atividades por Idade</h2>
            <p className="text-sm text-support-2 mb-4">Sugestões personalizadas para cada fase</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">🎭 Brincadeiras em Casa</h2>
            <p className="text-sm text-support-2 mb-4">Ideias criativas para aproveitar o tempo junto</p>
            <Button size="sm" variant="secondary">
              Descobrir
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">📚 Livros Recomendados</h2>
            <p className="text-sm text-support-2 mb-4">Histórias para inspirar e aprender</p>
            <Button size="sm" variant="secondary">
              Ver Livros
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">🛍️ Produtos Afiliados</h2>
            <p className="text-sm text-support-2 mb-4">Brinquedos e materiais curados</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
