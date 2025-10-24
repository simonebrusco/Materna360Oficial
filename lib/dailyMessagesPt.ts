export type DailyMessageTemplate = {
  id: string
  text: string
}

export const DAILY_MESSAGES_PT: ReadonlyArray<DailyMessageTemplate> = [
  { id: 'm1', text: '{name}, respire fundo — você está fazendo o seu melhor hoje.' },
  { id: 'm2', text: 'Lembre-se: o amor que você dá é o que seu filho mais precisa agora, {name}.' },
  { id: 'm3', text: 'Você não precisa ser perfeita, {name}. Só precisa estar presente.' },
  { id: 'm4', text: 'Pequenos gestos de carinho criam grandes memórias — continue, {name}.' },
  { id: 'm5', text: 'Nos dias corridos, abrace devagar. Seu abraço é casa, {name}.' },
  { id: 'm6', text: '{name}, confie no seu instinto. Ninguém conhece seu filho como você.' },
  { id: 'm7', text: 'Cuidar de você também é cuidar deles. Dê um passo gentil hoje, {name}.' },
  { id: 'm8', text: 'Você é a calma no meio do caos — e isso já é muito, {name}.' },
  { id: 'm9', text: 'Cada sorriso do seu filho é um “você está no caminho certo”, {name}.' },
  { id: 'm10', text: 'Quando a dúvida vier, escolha a conexão. Ela nunca erra, {name}.' },
]
