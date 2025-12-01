// app/api/ai/cuidar-com-amor/route.ts
// Rota de IA para o hub "Cuidar com Amor"
// Aqui usamos respostas mockadas, seguras e genéricas.
// No futuro, esta camada pode chamar um provedor de IA real.

import { NextRequest, NextResponse } from 'next/server';
import {
  CuidarComAmorFeature,
  CuidarComAmorRequest,
  CuidarComAmorResponse,
  CuidarComAmorSuggestion,
} from '@/app/lib/ai/cuidarComAmorClient';

function buildAlimentacaoSuggestion(
  _req: CuidarComAmorRequest,
): CuidarComAmorSuggestion {
  return {
    headline: 'Alimentação com menos culpa e mais calma',
    description:
      'Aqui o foco não é dieta perfeita, e sim pequenas escolhas que deixam as refeições mais leves para vocês.',
    tips: [
      'Quando possível, ofereça uma refeição simples com pelo menos um alimento que seu filho costuma aceitar bem.',
      'Convide seu filho para participar de algo pequeno da preparação, como mexer a massa ou escolher a cor do prato.',
      'Evite transformar a refeição em campo de batalha: se hoje não fluiu como você queria, tudo bem recomeçar em outro dia.',
    ],
    disclaimer:
      'As sugestões de alimentação do Materna360 são gerais e não substituem a orientação de um pediatra ou nutricionista. Em dúvidas específicas sobre peso, alergias ou restrições, converse sempre com profissionais de confiança.',
  };
}

function buildSonoSuggestion(_req: CuidarComAmorRequest): CuidarComAmorSuggestion {
  return {
    headline: 'Uma noite um pouco mais tranquila',
    description:
      'O objetivo aqui não é resolver o sono de uma vez, e sim criar pequenos pontos de calma na rotina da noite.',
    tips: [
      'Tente repetir um mini-ritual simples nas noites possíveis, como sempre a mesma música suave ou a mesma frase de boa noite.',
      'Reduza estímulos intensos perto da hora de dormir, como telas muito brilhantes ou brincadeiras muito agitadas.',
      'Se os despertares estiverem muito frequentes ou preocupantes, vale sempre conversar com o pediatra para avaliar juntos.',
    ],
    disclaimer:
      'As orientações sobre sono são gerais e não substituem avaliação médica. Em casos de sono muito difícil, roncos intensos ou qualquer sinal que te preocupe, procure o pediatra de confiança.',
  };
}

function buildConexaoSuggestion(
  _req: CuidarComAmorRequest,
): CuidarComAmorSuggestion {
  return {
    headline: 'Conexão que cabe no seu dia real',
    description:
      'Você não precisa de grandes programas para fortalecer o vínculo. Momentos pequenos e verdadeiros contam muito.',
    tips: [
      'Escolha um micro-momento do dia para olhar nos olhos do seu filho e dizer algo simples como “eu gosto muito de você”.',
      'Transforme uma tarefa do dia (como guardar brinquedos ou preparar a mochila) em parceria rápida, mesmo que não fique perfeito.',
      'Ao fim do dia, se quiser, relembre em voz alta um momento gostoso que vocês viveram juntos, mesmo que tenha durado poucos minutos.',
    ],
    disclaimer:
      'As sugestões de conexão são afetivas e não substituem acompanhamento psicológico quando necessário. Se você sentir que precisa de mais apoio emocional, busque profissionais ou redes de apoio que façam sentido para você.',
  };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CuidarComAmorResponse>> {
  try {
    const body = (await request.json()) as CuidarComAmorRequest | undefined;

    const feature = (body?.feature ?? 'conexao') as CuidarComAmorFeature;

    let data: CuidarComAmorSuggestion;

    switch (feature) {
      case 'alimentacao':
        data = buildAlimentacaoSuggestion(body ?? { feature });
        break;
      case 'sono':
        data = buildSonoSuggestion(body ?? { feature });
        break;
      case 'conexao':
      default:
        data = buildConexaoSuggestion(body ?? { feature });
        break;
    }

    const response: CuidarComAmorResponse = {
      ok: true,
      feature,
      data,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[api/ai/cuidar-com-amor] Erro:', error);

    const fallback: CuidarComAmorResponse = {
      ok: false,
      feature: 'conexao',
      data: {
        headline: 'Hoje já foi muita coisa',
        description:
          'Quando o dia está pesado, às vezes o melhor cuidado é ser gentil com você mesma. Amanhã vocês podem tentar de novo, com calma.',
        tips: [
          'Escolha um pequeno gesto que caiba na sua energia de hoje, como um abraço mais demorado ou uma conversa de dois minutos.',
          'Se nada fluir, tudo bem. Dias difíceis também fazem parte da maternidade real.',
        ],
        disclaimer:
          'As sugestões do Materna360 são apenas apoio emocional e não substituem acompanhamento médico ou psicológico.',
      },
    };

    return NextResponse.json(fallback, { status: 500 });
  }
}
