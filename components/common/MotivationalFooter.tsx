'use client'

import { useProfile } from '@/app/hooks/useProfile'
import AppIcon from '@/components/ui/AppIcon'

type MotivationalFooterProps = {
  routeKey?: string
}

const MOTIVATIONAL_PHRASES: Record<string, string> = {
  'meu-dia': 'cada pequeno passo que você dá hoje já é um avanço para amanhã.',
  'meu-dia-como-estou-hoje': 'sentir é viver. Obrigada por se escutar com carinho hoje.',
  'meu-dia-rotina-leve': 'leveza é construída com gentileza — uma escolha por vez.',
  'meu-dia-planner-do-dia': 'você está organizando não só o dia… mas sua paz.',
  'meu-dia-minhas-conquistas': 'celebre cada vitória — você está indo muito melhor do que imagina.',
  'cuidar-autocuidado-inteligente': 'cuidar de você também é um gesto de amor com quem você ama.',
  'cuidar-cuidar-com-amor': 'você está construindo memórias que seu filho vai guardar para sempre.',
  'descobrir-aprender-brincando': 'cada brincadeira que você oferece abre uma janela nova no mundo do seu filho.',
  'biblioteca-materna': 'aprender transforma — e você está criando novas possibilidades para sua família.',
  'maternar-minha-jornada': 'sua história importa. Você está evoluindo, e isso é lindo.',
}

export function MotivationalFooter({ routeKey = 'meu-dia' }: MotivationalFooterProps) {
  const { name, isLoading } = useProfile()

  const displayName = name && name.trim() ? name.split(' ')[0] : null

  // P33.4 — Meu Dia (contrato canônico):
  // - sem CTA, sem progresso, sem aprofundamento, sem parentalidade
  // Portanto, este footer nunca deve renderizar em qualquer rota do Meu Dia.
  if (routeKey.startsWith('meu-dia')) return null

  const phrase = MOTIVATIONAL_PHRASES[routeKey] || MOTIVATIONAL_PHRASES['meu-dia']

  if (isLoading || !displayName) return null

  return (
    <div className="mt-10 text-center">
      <div className="flex items-center justify-center gap-2">
        <AppIcon name="heart" size={14} className="text-[#9B4D96]" decorative />
        <p className="text-sm text-gray-500">
          <span className="font-semibold">{displayName},</span> {phrase}
        </p>
        <AppIcon name="heart" size={14} className="text-[#9B4D96]" decorative />
      </div>
    </div>
  )
}
