import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function MeuDia() {
  const hour = new Date().getHours()
  const greeting = 
    hour < 12 ? 'Bom dia' : 
    hour < 18 ? 'Boa tarde' : 
    'Boa noite'

  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">{greeting}! 👋</h1>
          <p className="text-support-2">Vamos organizar seu dia?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">🏡 Casa</h2>
            <p className="text-sm text-support-2 mb-4">Tarefas e rotina da casa</p>
            <Button size="sm" variant="secondary">
              Acessar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">👶 Filhos</h2>
            <p className="text-sm text-support-2 mb-4">Cuidados e atividades das crianças</p>
            <Button size="sm" variant="secondary">
              Acessar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">💆 Eu</h2>
            <p className="text-sm text-support-2 mb-4">Seu autocuidado e bem-estar</p>
            <Button size="sm" variant="secondary">
              Acessar
            </Button>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-support-1 mb-2">📝 Notas</h2>
            <p className="text-sm text-support-2 mb-4">Anotações rápidas do dia</p>
            <Button size="sm" variant="secondary">
              Acessar
            </Button>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-support-1 mb-4">✨ Mensagem do Dia</h2>
          <p className="text-support-2 italic">
            "Você está fazendo um ótimo trabalho. Lembre-se de respirar e apreciar os pequenos momentos."
          </p>
        </Card>
      </div>
    </main>
  )
}
