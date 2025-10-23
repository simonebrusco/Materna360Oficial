import { NextResponse } from 'next/server'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MESSAGE_POOL = [
  'Você está fazendo um ótimo trabalho!',
  'Cada dia é uma nova oportunidade para recomeçar.',
  'O amor nos pequenos gestos transforma rotinas.',
  'Respire fundo: você não precisa dar conta de tudo hoje.',
  'Pequenos momentos criam grandes memórias.',
  'Confie no seu ritmo: você sabe o que é melhor para a sua família.',
  'Permita-se descansar; o cuidado começa por você.',
  'Celebre as pequenas vitórias do seu dia.',
  'Você é motivo de aconchego para quem ama.',
  'Tudo bem pedir ajuda e dividir o peso.',
  'Sua presença é o maior presente.',
  'Respirar, sentir e seguir: um passo de cada vez.',
  'Lembre-se de olhar com carinho para si hoje.',
  'Sua força está também na sua delicadeza.',
  'O afeto que você espalha volta em forma de calma.',
  'Hoje é um bom dia para escolher leveza.',
  'Você está cercada de amor, mesmo nos dias corridos.',
  'Dar uma pausa também é um gesto de cuidado.',
  'Ouça seu coração: ele conhece o caminho.',
  'Ser mãe é construir memórias com ternura a cada dia.',
] as const

const FALLBACK_MESSAGE = MESSAGE_POOL[0]

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type DailyMessageResponse = {
  message: string
  generatedAt: string
}

const shouldUseAI = () => process.env.USE_AI_DAILY_MESSAGE === '1' && Boolean(process.env.OPENAI_API_KEY)

const hashDateKeyToIndex = (dateKey: string) => {
  const hash = createHash('sha256').update(dateKey).digest('hex')
  const numeric = parseInt(hash.slice(0, 8), 16)
  return numeric % MESSAGE_POOL.length
}

const getDateKey = (inputDate: Date) => {
  return DATE_FORMATTER.format(inputDate)
}

const deterministicMessageFor = (dateKey: string) => {
  const index = hashDateKeyToIndex(dateKey)
  return MESSAGE_POOL[index] ?? FALLBACK_MESSAGE
}

const sanitizeName = (rawName: string | null): string | null => {
  if (!rawName) {
    return null
  }

  const trimmed = rawName.trim()
  if (!trimmed) {
    return null
  }

  return trimmed
}

async function generateMessageWithAI(dateKey: string, name: string | null): Promise<string | null> {
  if (!shouldUseAI()) {
    return null
  }

  const target = name ?? 'a mãe usuária do Materna360'
  const systemPrompt = `Você é a voz acolhedora do app Materna360. Gere UMA frase curta, em português (Brasil), positiva e realista para uma mãe ocupada, incentivando leveza, presença e autocuidado. Até ~140 caracteres, sem hashtags. Fale diretamente com ${target}.`
  const userPrompt = name
    ? `Data: ${dateKey}. Preciso de uma mensagem curta e acolhedora falando diretamente com ${name}.`
    : `Data: ${dateKey}. Preciso de uma mensagem curta e acolhedora para uma mãe.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 80,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI provider returned status ${response.status}`)
    }

    const data: any = await response.json()
    const aiMessage: string | undefined = data?.choices?.[0]?.message?.content?.trim()

    if (!aiMessage) {
      throw new Error('AI response missing content')
    }

    return aiMessage
  } catch (error) {
    console.error('AI daily message generation failed:', error)
    return null
  }
}

export async function GET(request: Request): Promise<NextResponse<DailyMessageResponse>> {
  const now = new Date()
  const dateKey = getDateKey(now)
  const url = new URL(request.url)
  const providedName = sanitizeName(url.searchParams.get('name'))

  try {
    const candidate = await generateMessageWithAI(dateKey, providedName)
    const message = candidate ?? deterministicMessageFor(dateKey)

    return NextResponse.json(
      {
        message,
        generatedAt: now.toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=86400',
        },
      }
    )
  } catch (error) {
    console.error('Failed to generate daily message:', error)

    return NextResponse.json(
      {
        message: deterministicMessageFor(dateKey),
        generatedAt: now.toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=86400',
        },
      }
    )
  }
}
