import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'

export default function Eu360() {
  return (
    <main className="min-h-screen p-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">💛 Eu360</h1>
          <p className="text-support-2">Seu progresso e bem-estar em perspectiva</p>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-secondary to-pink-100">
          <h2 className="text-2xl font-bold text-support-1 mb-4">Seu Progresso</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-support-2 mb-2">Nível 5 • 450/500 XP</p>
              <Progress value={450} max={500} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="text-center">
            <p className="text-3xl mb-2">🔥</p>
            <p className="text-sm text-support-2 mb-2">Sequência</p>
            <p className="text-2xl font-bold text-primary">7 dias</p>
          </Card>
          <Card className="text-center">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-sm text-support-2 mb-2">Selos</p>
            <p className="text-2xl font-bold text-primary">12</p>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">😊 Como Você Está?</h2>
          <div className="flex justify-between gap-2 mb-6">
            {['😔', '😐', '🙂', '😊', '😄'].map((emoji, index) => (
              <button
                key={index}
                className="text-3xl hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="w-full">
            Fazer Check-in
          </Button>
        </Card>

        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-support-1 mb-4">🏅 Conquistas</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl mb-2">👣</p>
              <p className="text-xs text-support-2">Primeiro Passo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-2">🧘</p>
              <p className="text-xs text-support-2">Meditação</p>
            </div>
            <div className="text-center">
              <p className="text-2xl mb-2">🏡</p>
              <p className="text-xs text-support-2">Casa</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-support-1 mb-4">📊 Resumo da Semana</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-support-2">Autocuidado</span>
              <Progress value={75} max={100} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-support-2">Atividades Filhos</span>
              <Progress value={60} max={100} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-support-2">Rotina Casa</span>
              <Progress value={85} max={100} />
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
