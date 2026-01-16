import OpenAI from 'openai'
import type { RotinaQuickSuggestion } from './types'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const MODEL = process.env.MATERNA360_AI_MODEL || 'gpt-4.1-mini'

type CallArgs = {
  mode: 'quick-ideas'
  profile: any
  child: any
  context: Record<string, any>
}

export async function callMaternaAI(args: CallArgs): Promise<{
  suggestions: RotinaQuickSuggestion[]
}> {
  try {
    const prompt = `
Você é a IA do Materna360.
Gere uma única sugestão curta, prática e acolhedora.
Sem conselhos normativos.
Sem linguagem de cobrança.
Máximo 3 frases.
A atividade deve ser possível agora.
    `.trim()

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: JSON.stringify(args.context),
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ''

    return {
      suggestions: [
        {
          id: 'raw',
          category: 'ideia-rapida',
          title: '',
          description: content,
          estimatedMinutes: args.context.tempoDisponivel ?? 5,
          withChild: true,
          moodImpact: 'neutro',
        },
      ],
    }
  } catch (err) {
    console.error('Erro na OpenAI', err)
    throw new Error('Erro na OpenAI')
  }
}
