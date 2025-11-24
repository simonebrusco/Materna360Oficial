// app/api/ai/meu-dia/route.ts

import { NextResponse } from 'next/server'
import {
  callMaternaAI,
  type MaternaProfile,
  type MaternaChildProfile,
} from '@/app/lib/ai/maternaCore'
import { loadMaternaContextFromRequest } from '@/app/lib/ai/profileAdapter'
import { assertRateLimit, RateLimitError } from '@/app/lib/ai/rateLimit'

export const runtime = 'nodejs'

type MeuDiaRequestBody = {
  mood?: 'happy' | 'okay' | 'stressed' | null
  intention?: 'leve' | 'focado' | 'produtivo' | 'slow' | 'automático' | null
  origin?: string | null
}

type SmartPriority = {
  id: string
  title: string
  description: string
}

type SmartPrioritiesResponse = {
  priorities: SmartPriority[]
  selfCare: {
    title: string
    description: string
  }
  connection: {
    title: string
    description: string
  }
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

/**
 * Gera um "foco do dia" simplificado a partir de humor + intenção,
 * apenas como dica para o núcleo de IA emocional.
 */
function deriveFocusFromMoodAndIntention(
  mood: MeuDiaRequestBody['mood'],
  intention: MeuDiaRequestBody['intention'],
): string | null {
  if (mood === 'stressed' && intention === 'slow') return 'descanso'
  if (mood === 'stressed' && intention === 'produtivo') return 'organizacao'
  if (mood === 'happy' && intention === 'leve') return 'conexao'
  if (intention === 'automático') return 'automatico'
  if (mood === 'stressed') return 'cansaco'
  if (mood === 'happy') return 'leveza'
  if (intention === 'focado' || intention === 'produtivo') return 'foco'
  return null
}

/**
 * Constrói as prioridades inteligentes a partir de:
 * - humor
 * - intenção
 * - e, quando disponível, a inspiração emocional vinda da IA
 *
 * Se a IA falhar, caímos em textos totalmente editoriais.
 */
function buildSmartPrioritiesPayload(
  mood: MeuDiaRequestBody['mood'],
  intention: MeuDiaRequestBody['intention'],
  inspiration: {
    phrase?: string | null
    care?: string | null
    ritual?: string | null
  } | null,
): SmartPrioritiesResponse {
  const basePhrase =
    inspiration?.phrase ??
    'Hoje não precisa ser perfeito, só precisa ser possível.'
  const baseCare =
    inspiration?.care ??
    'Reserve alguns minutos para respirar fundo, alongar o corpo ou simplesmente ficar em silêncio.'
  const baseRitual =
    inspiration?.ritual ??
    'Encontre um momento curto para olhar nos olhos do seu filho, dar um abraço longo ou rir de algo juntos.'

  // PRIORIDADE ESSENCIAL
  let essentialTitle = 'Prioridade essencial do dia'
  let essentialDescription =
    'Escolha uma única coisa que, se estiver feita até o fim do dia, já vai fazer você sentir que valeu a pena.'

  if (intention === 'produtivo') {
    essentialTitle = 'Prioridade nº 1'
    essentialDescription =
      'Defina qual é a entrega mais importante de hoje (pessoal, profissional ou com a família) e foque nela primeiro.'
  } else if (intention === 'leve') {
    essentialDescription =
      'Escolha uma coisa simples que traga leveza: terminar uma tarefa pendente, organizar um cantinho da casa ou criar um momento gostoso com seu filho.'
  } else if (intention === 'slow') {
    essentialDescription =
      'Escolha algo pequeno e possível, respeitando seu ritmo. Hoje o objetivo é fazer menos, com mais presença.'
  }

  if (mood === 'stressed') {
    essentialDescription +=
      ' Lembre-se: não é sobre dar conta de tudo, é sobre dar conta do que importa hoje.'
  } else if (mood === 'happy') {
    essentialDescription +=
      ' Aproveite a sua energia para tirar da frente o que anda te travando há dias.'
  }

  // PRIORIDADE 2
  let secondTitle = 'Organização mínima do dia'
  let secondDescription =
    'Olhe para sua lista mental de tarefas e agrupe o que puder. Talvez você consiga resolver 2 ou 3 coisas em um mesmo bloco de tempo.'

  if (intention === 'focado') {
    secondTitle = 'Proteja seus blocos de foco'
    secondDescription =
      'Separe blocos de 60 a 90 minutos para tarefas importantes e tente reduzir interrupções nesse período (telas, notificações, múltiplas demandas).'
  } else if (intention === 'produtivo') {
    secondDescription =
      'Agrupe tarefas por contexto (tudo de celular, tudo de computador, tudo da casa) para não desperdiçar energia trocando de foco o tempo todo.'
  } else if (intention === 'leve' || intention === 'slow') {
    secondDescription =
      'Veja se há pequenas coisas que podem ser simplificadas ou adiadas sem culpa. Às vezes, tirar peso da lista já é uma prioridade.'
  }

  // PRIORIDADE 3
  let thirdTitle = 'Algo que facilite o amanhã'
  let thirdDescription =
    'Escolha uma ação pequena que torne o dia de amanhã mais leve: separar a roupa, adiantar algo da casa ou combinar expectativas com alguém.'

  if (mood === 'stressed') {
    thirdDescription =
      'Escolha uma coisa que você possa fazer hoje para reduzir a ansiedade de amanhã: organizar um cantinho, alinhar uma expectativa ou pedir ajuda com antecedência.'
  } else if (mood === 'happy') {
    thirdDescription =
      'Aproveite a boa fase para plantar uma semente para amanhã: organizar algo que vem te incomodando ou avançar em um projeto pessoal.'
  }

  // CUIDADO PESSOAL
  let selfCareTitle = 'Cuidado com você hoje'
  let selfCareDescription = baseCare

  if (mood === 'stressed') {
    selfCareDescription =
      'Seu corpo e sua mente estão pedindo uma pausa. Tente separar alguns minutos para respirar fundo, alongar o corpo ou tomar um banho mais demorado, se possível.'
  } else if (mood === 'happy') {
    selfCareDescription =
      'Use a sua boa energia também a seu favor: faça algo que você gosta (mesmo que por pouco tempo), sem culpa e sem justificativas.'
  } else if (intention === 'slow') {
    selfCareDescription =
      'Permita-se andar um pouco mais devagar hoje. Um café tomado sentada, uma caminhada curta, alguns minutos sem tela já podem fazer diferença.'
  }

  // CONEXÃO COM O FILHO
  let connectionTitle = 'Momento de conexão com seu filho'
  let connectionDescription = baseRitual

  if (intention === 'leve') {
    connectionDescription =
      'Inclua um momento leve com seu filho: uma brincadeira rápida, uma história curta, um abraço demorado ou uma conversa na cama antes de dormir.'
  } else if (intention === 'produtivo') {
    connectionDescription =
      'Mesmo em dias cheios, tente separar 10 a 15 minutos só para ele: um jogo rápido, uma conversa sobre o dia ou uma refeição juntos, sem telas.'
  } else if (intention === 'automático') {
    connectionDescription =
      'Quando o dia entra no piloto automático, um momento de olhar nos olhos, ouvir o que ele tem a dizer e dar um abraço pode mudar tudo.'
  }

  return {
    priorities: [
      {
        id: 'essential',
        title: essentialTitle,
        description: essentialDescription,
      },
      {
        id: 'second',
        title: secondTitle,
        description: secondDescription,
      },
      {
        id: 'third',
        title: thirdTitle,
        description: thirdDescription,
      },
    ],
    selfCare: {
      title: selfCareTitle,
      description: selfCareDescription,
    },
    connection: {
      title: connectionTitle,
      description: connectionDescription,
    },
  }
}

export async function POST(req: Request) {
  try {
    // Proteção básica de uso da IA para o eixo "Meu Dia"
    assertRateLimit(req, 'ai-meu-dia', {
      limit: 30,
      windowMs: 5 * 60_000, // 30 chamadas a cada 5 minutos
    })

    let body: MeuDiaRequestBody | null = null

    try {
      body = (await req.json()) as MeuDiaRequestBody
    } catch {
      body = null
    }

    const mood = body?.mood ?? null
    const intention = body?.intention ?? null

    // Carrega perfil + criança principal via Eu360 (com fallback neutro)
    const { profile, child } = (await loadMaternaContextFromRequest(
      req,
    )) as { profile: MaternaProfile | null; child: MaternaChildProfile | null }

    // Tentamos puxar uma inspiração do núcleo emocional para enriquecer o texto
    let inspiration: { phrase?: string | null; care?: string | null; ritual?: string | null } | null =
      null

    try {
      const focusOfDay = deriveFocusFromMoodAndIntention(mood, intention)

      const result = await callMaternaAI({
        mode: 'daily-inspiration',
        profile,
        child,
        context: {
          focusOfDay,
        },
      })

      if (result && typeof result === 'object' && result.inspiration) {
        inspiration = result.inspiration as typeof inspiration
      }
    } catch (innerError) {
      console.error(
        '[API /api/ai/meu-dia] Falha ao chamar núcleo emocional, seguindo com texto editorial:',
        innerError,
      )
      // Segue com inspiration = null (fallback total editorial)
    }

    const payload = buildSmartPrioritiesPayload(mood, intention, inspiration)

    return NextResponse.json(payload, {
      status: 200,
      headers: NO_STORE_HEADERS,
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.warn('[API /api/ai/meu-dia] Rate limit atingido:', error.message)
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: error.status ?? 429,
          headers: NO_STORE_HEADERS,
        },
      )
    }

    console.error('[API /api/ai/meu-dia] Erro ao gerar prioridades:', error)

    return NextResponse.json(
      {
        error:
          'Não consegui montar suas prioridades inteligentes agora, tente novamente em instantes.',
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
