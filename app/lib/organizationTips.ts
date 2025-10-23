import { getDailyIndex } from '@/app/lib/dailyMessage'

export type OrganizationTip = {
  id: string
  icon: string
  title: string
  description: string
  checklist: [string, string, string]
}

const TIPS: OrganizationTip[] = [
  {
    id: 'organize-night-before',
    icon: '🪶',
    title: 'Organize a Noite Anterior',
    description: 'Deixe tudo pronto para amanhã com 15 minutos de foco.',
    checklist: [
      'Separar roupa e mochila das crianças.',
      'Deixar lanche e garrafinha prontos.',
      'Conferir compromissos do dia seguinte.',
    ],
  },
  {
    id: 'use-checklists',
    icon: '📝',
    title: 'Use Listas de Verificação',
    description: 'Listas simples evitam esquecimentos e aliviam a mente.',
    checklist: [
      'Criar lista “Manhã” (3 itens essenciais).',
      'Criar lista “Saída de casa”.',
      'Fixar a lista em um lugar visível.',
    ],
  },
  {
    id: 'care-15-minutes',
    icon: '⏳',
    title: '15 Minutos de Cuidado',
    description: 'Pequenas sessões mantêm a casa andando sem sobrecarga.',
    checklist: [
      'Escolher 1 microárea (ex.: bancada).',
      'Ligar o timer de 15 minutos.',
      'Parar quando o tempo acabar — sem culpa.',
    ],
  },
  {
    id: 'lost-items-basket',
    icon: '🧺',
    title: 'Cesta de Itens Perdidos',
    description: 'Uma cesta para recolher e redistribuir rápido.',
    checklist: [
      'Separar uma cesta ou sacola.',
      'Recolher o que estiver fora do lugar.',
      'Devolver por cômodo em 5 minutos.',
    ],
  },
  {
    id: 'launch-zone',
    icon: '🚪',
    title: 'Zona de Saída',
    description: 'Crie um ponto fixo para chaves, mochilas e garrafinhas.',
    checklist: [
      'Escolher o local (próximo à porta).',
      'Colocar ganchos ou bandeja simples.',
      'Ensinar a família a usar.',
    ],
  },
  {
    id: 'morning-visual-routine',
    icon: '🌅',
    title: 'Rotina Visual da Manhã',
    description: 'Um passo a passo visível reduz o estresse matinal.',
    checklist: [
      'Listar 4 passos (acordar, higiene, vestir, sair).',
      'Imprimir ou escrever e colar na altura da criança.',
      'Marcar concluído com adesivo ou caneta.',
    ],
  },
  {
    id: 'heart-of-home',
    icon: '🏡',
    title: 'Coração da Casa',
    description: 'Tenha um cantinho sempre em ordem para recarregar a energia.',
    checklist: [
      'Escolher um espaço pequeno (mesa, aparador).',
      'Guardar o que não pertence ali.',
      'Colocar um item que te faça bem (vela, flor, foto).',
    ],
  },
  {
    id: 'paper-control',
    icon: '📂',
    title: 'Papéis Sob Controle',
    description: 'Pare de perder bilhetes e comunicados da escola.',
    checklist: [
      'Ter uma pasta “Esta Semana”.',
      'Guardar tudo lá assim que chegar.',
      'Revisar na sexta e descartar o que não for mais útil.',
    ],
  },
  {
    id: 'quick-meal-planning',
    icon: '🍲',
    title: 'Planeje o Cardápio Rápido',
    description: 'Decidir antes evita correria na hora da fome.',
    checklist: [
      'Anotar 3 ideias simples de refeição.',
      'Verificar o que já tem na despensa.',
      'Acrescentar o que falta à lista de compras.',
    ],
  },
  {
    id: 'donation-box',
    icon: '🎁',
    title: 'Caixa de Doações',
    description: 'Deixe o desapego sempre à vista.',
    checklist: [
      'Reservar uma caixa ou sacola de doações.',
      'Quando algo não servir, colocar direto nela.',
      'Quando encher, doar — sem pensar demais.',
    ],
  },
  {
    id: 'ten-minutes-of-silence',
    icon: '🧘',
    title: '10 Minutos de Silêncio',
    description: 'Organizar também é dar espaço à mente.',
    checklist: [
      'Escolher um horário do dia para pausar.',
      'Silenciar notificações.',
      'Respirar profundamente por alguns minutos.',
    ],
  },
  {
    id: 'weekly-review',
    icon: '📆',
    title: 'Revisão da Semana',
    description: 'Domingo é dia de fechar ciclos e recomeçar leve.',
    checklist: [
      'Revisar o que funcionou bem.',
      'Planejar o essencial da próxima semana.',
      'Agradecer pelo que conseguiu — mesmo que não seja tudo.',
    ],
  },
]

export function getDailyOrganizationTips(date: Date = new Date()): OrganizationTip[] {
  const { length } = TIPS
  if (length === 0) {
    return []
  }

  const startIndex = getDailyIndex(date, length)
  const result: OrganizationTip[] = []

  for (let i = 0; i < Math.min(3, length); i += 1) {
    const tip = TIPS[(startIndex + i) % length]
    result.push(tip)
  }

  return result
}

export function getOrganizationTipById(id: string): OrganizationTip | undefined {
  return TIPS.find((tip) => tip.id === id)
}

export const ORGANIZATION_TIPS = TIPS
