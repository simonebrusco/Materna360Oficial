export type CareGuidanceInput = {
  ritmo: 'leve' | 'cansada' | 'confusa' | 'ok'
  savedCount: number
}

export type CareGuidanceOutput = {
  title: string
  text: string
}

export function getCareGuidance({
  ritmo,
  savedCount,
}: CareGuidanceInput): CareGuidanceOutput {
  if (savedCount === 0) {
    return {
      title: 'Hoje, um norte simples',
      text: 'Hoje pode ser um dia mais leve do que parece.',
    }
  }

  if (ritmo === 'confusa') {
    return {
      title: 'Hoje, um norte simples',
      text: 'Seu dia já está em movimento. Não precisa decidir tudo agora.',
    }
  }

  if (ritmo === 'cansada') {
    return {
      title: 'Hoje, um norte simples',
      text: 'Manter o básico já é suficiente hoje.',
    }
  }

  return {
    title: 'Hoje, um norte simples',
    text: 'Seu dia já existe. Você pode seguir sem se cobrar.',
  }
}
