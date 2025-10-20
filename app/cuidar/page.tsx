import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Cuidar() {
  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">🌿 Cuidar</h1>
          <p className="text-support-2">Seu bem-estar começa aqui</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">🧘 Meditação</h2>
            <p className="text-sm text-support-2 mb-4">Momentos de paz e mindfulness</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">💨 Respiração Guiada</h2>
            <p className="text-sm text-support-2 mb-4">Técnicas para acalmar e focar</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">😊 Pílulas Positivas</h2>
            <p className="text-sm text-support-2 mb-4">Inspiração e motivação diária</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">💡 Dicas de Organização</h2>
            <p className="text-sm text-support-2 mb-4">Estratégias práticas para o dia a dia</p>
            <Button size="sm" variant="secondary">
              Explorar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">👥 Mentoria & Profissionais</h2>
            <p className="text-sm text-support-2 mb-4">Apoio especializado via WhatsApp</p>
            <Button size="sm" variant="secondary">
              Conectar
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
