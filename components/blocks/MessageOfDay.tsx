'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function MessageOfDay() {
  const messages = [
    'Você está fazendo um ótimo trabalho. Lembre-se de respirar e apreciar os pequenos momentos.',
    'Sua paciência é sua força. Você merece descanso e cuidado.',
    'Cada dia é uma nova oportunidade para ser gentil com você mesma.',
    'Seus filhos têm sorte de ter uma mãe tão dedicada como você.',
    'Lembre-se: você não precisa ser perfeita, apenas presente.',
  ]

  const today = new Date().getDate()
  const message = messages[today % messages.length]

  const handleNewMessage = () => {
    alert('Nova mensagem carregada! ✨')
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/80 via-white/95 to-white">
      <div className="mb-5 flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✨ Mensagem do Dia</h2>
        <p className="text-sm italic leading-relaxed text-support-1/90 md:text-base">“{message}”</p>
      </div>
      <Button variant="primary" size="sm" onClick={handleNewMessage} className="w-full">
        Nova Mensagem
      </Button>
      <span className="pointer-events-none absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <span className="pointer-events-none absolute -left-8 top-2 h-16 w-16 rounded-3xl bg-white/60 blur-2xl" aria-hidden />
    </Card>
  )
}
