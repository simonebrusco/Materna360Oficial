'use client'

import { Button } from '@/components/ui/Button'

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
    <div className="bg-gradient-to-br from-secondary to-pink-100 rounded-[20px] p-4 md:p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-2">✨ Mensagem do Dia</h2>
        <p className="text-sm md:text-base text-support-1 italic leading-relaxed">"{message}"</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleNewMessage}
        className="w-full"
      >
        Nova Mensagem
      </Button>
    </div>
  )
}
