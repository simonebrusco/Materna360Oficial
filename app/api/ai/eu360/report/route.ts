export type Eu360ReportInput = {
  answers: {
    q1?: string
    q2?: string
    q3?: string
    q4?: string
    q5?: string
    q6?: string
  }
  signal: {
    stateId?: string
    tone: 'gentil' | 'direto'
  }
  timeframe: 'current' | 'fortnight'
}

export const EU360_REPORT_FALLBACK_CANONICO =
  'Este momento parece pedir mais contenção do que expansão.\n\nQuando muitas frentes coexistem, é comum que a energia se fragmente.\n\nSituações assim costumam responder melhor a menos pressão interna.'

export function buildEu360ReportSystemMessage() {
  return `
Você escreve o Relatório IA do hub EU360 do Materna360.

Princípios (obrigatórios):
- Nomeie estados, nunca identidades.
- Valide sem normalizar sofrimento.
- Crie espaço interno, não urgência.
- Deve fazer sentido mesmo se a usuária fechar o app imediatamente.
- Português do Brasil, tom adulto, respeitoso, sem performance.

PROIBIDO:
- Diagnóstico, termos clínicos, aconselhamento, terapia, tratamento.
- Coaching, metas, plano, desafio, CTA.
- Perguntas.
- Listas ou bullets.
- Imperativos e verbos que instruem (faça, tente, comece, evite, deveria, precisa).
- Urgência (agora, imediatamente, o quanto antes).

FORMATO OBRIGATÓRIO:
- 90 a 140 palavras.
- Sempre 3 blocos, nesta ordem:
  1) Leitura do momento (2–3 frases)
  2) Impacto interno (2–3 frases)
  3) Direção suave (1–2 frases)
- Texto corrido em 3 parágrafos (separados por uma linha em branco).
- Sem títulos.
- Sem listas.
- Sem perguntas.
`.trim()
}

export function buildEu360ReportUserMessage(input: Eu360ReportInput) {
  const payload = {
    timeframe: input.timeframe,
    signal: input.signal,
    answers: input.answers,
  }

  return `
Gere APENAS o texto do relatório no campo "report", seguindo o formato obrigatório.
Use "answers" e "signal" apenas como calibradores internos (sem mencionar questionário, respostas, perfil, persona ou resultado).
Contexto:
${JSON.stringify(payload, null, 2)}
`.trim()
}
