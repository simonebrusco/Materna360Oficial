'use client'

import { useProfile } from '@/app/hooks/useProfile'
import AppIcon from '@/components/ui/AppIcon'

type MotivationalFooterProps = {
  hubName?: string
}

const MOTIVATIONAL_PHRASES: Record<string, string[]> = {
  'meu-dia': [
    'Seu dia de hoje é uma chance de reescrever sua história.',
    'Cada pequeno passo é uma vitória que merece ser celebrada.',
    'Cuidar de você também é cuidar de quem você ama.',
  ],
  maternar: [
    'Ser mãe é um exercício diário de amor e coragem.',
    'Sua jornada de maternidade merece ser honrada.',
    'Você está fazendo um trabalho melhor do que imagina.',
  ],
  descobrir: [
    'Explorar com seu filho é semear possibilidades.',
    'Cada descoberta é um presente para sua história juntos.',
    'As brincadeiras de hoje moldam o amanhã.',
  ],
  cuidar: [
    'Cuidar de você também é cuidar de quem você ama.',
    'Seu bem-estar é prioridade, não luxo.',
    'Pequenos cuidados trazem grandes mudanças.',
  ],
  eu360: [
    'Sua evolução é única e digna de celebração.',
    'Conhecer a si mesma é o primeiro passo para tudo.',
    'Você merece toda a sua própria compaixão.',
  ],
  'biblioteca-materna': [
    'O conhecimento é um abraço que nos fortalece.',
    'Aprender é um ato de amor por você e por seu filho.',
    'Cada leitura é um momento de conexão e crescimento.',
  ],
}

export function MotivationalFooter({ hubName = 'meu-dia' }: MotivationalFooterProps) {
  const { name, isLoading } = useProfile()
  
  const phrases = MOTIVATIONAL_PHRASES[hubName] || MOTIVATIONAL_PHRASES['meu-dia']
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
  
  const displayName = name && name.trim() ? name.split(' ')[0] : null

  if (isLoading || !displayName) {
    return null
  }

  return (
    <div className="mt-12 md:mt-16 text-center space-y-3">
      <div className="flex items-center justify-center gap-2">
        <AppIcon
          name="heart"
          size={16}
          className="text-[#9B4D96]"
          decorative
        />
        <p className="text-sm md:text-base text-[#6A6A6A] leading-relaxed max-w-xl mx-auto">
          <span className="font-semibold text-[#3A3A3A]">{displayName},</span>{' '}
          {randomPhrase}
        </p>
        <AppIcon
          name="heart"
          size={16}
          className="text-[#9B4D96]"
          decorative
        />
      </div>
    </div>
  )
}
