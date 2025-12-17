export type WeeklyInsight = {
  title: string
  summary: string
  suggestions: string[]
}

export type WeeklyInsightContext = {
  firstName?: string
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }
  persona?: {
    id?: string
    label?: string
    microCopy?: string
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function num(v: unknown, fallback = 0) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function pickTone(ctx: WeeklyInsightContext) {
  const moodCheckins = num(ctx.stats?.moodCheckins, 0)
  const daysWithPlanner = num(ctx.stats?.daysWithPlanner, 0)

  // heurística simples (progressiva) para calibrar o “tom”
  if (moodCheckins <= 1 && daysWithPlanner <= 1) return 'baixo'
  if (moodCheckins <= 3 || daysWithPlanner <= 3) return 'medio'
  return 'alto'
}

function personaBucket(personaId?: string) {
  // não clínico, só calibragem de linguagem
  if (!personaId) return 'neutro'
  if (personaId.includes('sobreviv')) return 'sobrevivencia'
  if (personaId.includes('organiz')) return 'organizacao'
  if (personaId.includes('conexa')) return 'conexao'
  if (personaId.includes('equilib')) return 'equilibrio'
  if (personaId.includes('expans')) return 'expansao'
  return 'neutro'
}

export function buildWeeklyInsight(ctx: WeeklyInsightContext): WeeklyInsight {
  const firstName = (ctx.firstName || 'Você').trim() || 'Você'
  const tone = pickTone(ctx)
  const bucket = personaBucket(ctx.persona?.id)
  const days = clamp(num(ctx.stats?.daysWithPlanner, 0), 0, 7)
  const checkins = clamp(num(ctx.stats?.moodCheckins, 0), 0, 14)
  const missions = clamp(num(ctx.stats?.todayMissionsDone, 0), 0, 20)

  const title =
    bucket === 'sobrevivencia'
      ? 'Seu resumo da semana (com gentileza)'
      : bucket === 'organizacao'
        ? 'Seu resumo da semana (com clareza)'
        : bucket === 'conexao'
          ? 'Seu resumo da semana (com presença)'
          : bucket === 'equilibrio'
            ? 'Seu resumo da semana (com constância)'
            : bucket === 'expansao'
              ? 'Seu resumo da semana (para avançar sem pesar)'
              : 'Seu resumo emocional da semana'

  // Summary calibrado pelo “tom”
  const summaryBase =
    tone === 'baixo'
      ? `${firstName}, seu corpo e sua cabeça parecem estar pedindo menos peso. Nesta semana, o foco não é “dar conta de tudo”, e sim manter o essencial de pé.`
      : tone === 'medio'
        ? `${firstName}, sua semana mostra esforço real: você tem se organizado em partes e, mesmo com dias corridos, houve sinais de consistência.`
        : `${firstName}, dá para ver mais ritmo: quando você escolhe um próximo passo por vez, o dia flui melhor e a cobrança diminui.`

  // Ajuste por indicadores (sem julgamento)
  const evidenceLine =
    days === 0 && checkins === 0
      ? 'Mesmo sem registrar muita coisa, você pode usar este espaço como um “ponto de apoio” rápido.'
      : `Você teve ${days} dia(s) com planner e ${checkins} check-in(s) de humor — o suficiente para o Materna360 calibrar melhor o ritmo.`

  const summary = `${summaryBase} ${evidenceLine}`

  // Sugestões leves e práticas (sem prescrever; sempre “convite”)
  const suggestions: string[] = []

  if (bucket === 'sobrevivencia') {
    suggestions.push('Escolha 1 prioridade mínima por dia (a menor que ainda traz alívio).')
    suggestions.push('Se algo não for para hoje, adie sem culpa: “não é pra hoje” também é autocuidado.')
    suggestions.push('Proteja 10 minutos de pausa real (sem tarefa e sem cobrança).')
  } else if (bucket === 'organizacao') {
    suggestions.push('Transforme “tudo” em 3 blocos: agora / depois / não é pra hoje.')
    suggestions.push('Feche o dia com 1 pequena vitória visível (mesmo simples).')
    suggestions.push('Quando travar, escolha o próximo passo — não o dia inteiro.')
  } else if (bucket === 'conexao') {
    suggestions.push('Faça 5 minutos intencionais com seu filho (uma pergunta + ouvir de verdade).')
    suggestions.push('Troque “quantidade” por “qualidade possível”: um gesto pequeno já conta.')
    suggestions.push('Se o dia estiver pesado, reduza o resto e mantenha a presença.')
  } else if (bucket === 'equilibrio') {
    suggestions.push('Mantenha a constância gentil: um bloco por vez, sem acelerar o ritmo.')
    suggestions.push('Use o Meu Dia como eixo: escolha 1 tarefa essencial + 1 tarefa de cuidado.')
    suggestions.push('Se sobrar energia, organize o amanhã em 2 linhas (só o essencial).')
  } else if (bucket === 'expansao') {
    suggestions.push('Aproveite a energia para simplificar o sistema: retire 1 exigência que não ajuda.')
    suggestions.push('Crie 1 rotina curta “que se repete” (3 a 5 min) para dar estabilidade ao dia.')
    suggestions.push('Avance em pequenas decisões: constância vale mais do que intensidade.')
  } else {
    suggestions.push('Escolha apenas 1 prioridade por dia para aliviar a sensação de cobrança.')
    suggestions.push('Se algo estiver pesado, reduza o escopo: “um passo por vez” é estratégia.')
    suggestions.push('Proteja um pequeno momento bom (mesmo 5 minutos) para mudar o clima do dia.')
  }

  // Ajuste por “missões” (sem gamificar demais)
  if (missions >= 3) {
    suggestions.unshift('Você já fez coisas suficientes hoje. Agora é sobre manter leveza e ritmo.')
  }

  return { title, summary, suggestions }
}
