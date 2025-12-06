// Cliente da IA para o hub "Cuidar com Amor"
// Mantém respostas seguras, leves e focadas em apoio à rotina.

export type CuidarComAmorFeature =
  | 'alimentacao'
  | 'sono'
  | 'conexao';

export type CuidarComAmorRequest = {
  feature: CuidarComAmorFeature;
  origin?: string; // ex.: 'cuidar-com-amor'
  ageRange?: 'bebe' | 'crianca-pequena' | 'crianca-maior';
  mainConcern?: string; // ex.: 'refusa comer', 'acordando à noite'
};

export type CuidarComAmorSuggestion = {
  headline: string;
  description: string;
  tips: string[];
  disclaimer?: string;
};

export type CuidarComAmorResponse = {
  ok: boolean;
  feature: CuidarComAmorFeature;
  data: CuidarComAmorSuggestion;
};

export async function fetchCuidarComAmorSuggestion(
  payload: CuidarComAmorRequest,
): Promise<CuidarComAmorSuggestion> {
  try {
    const res = await fetch('/api/ai/cuidar-com-amor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Erro ao buscar sugestão de cuidado.');
    }

    const json = (await res.json()) as CuidarComAmorResponse;

    if (!json.ok || !json.data) {
      throw new Error('Resposta inesperada da sugestão de cuidado.');
    }

    return json.data;
  } catch (error) {
    console.error('[CuidarComAmorClient] Erro na requisição:', error);
    // Fallback carinhoso – nunca deixa a mãe sem nada
    return {
      headline: 'Pequenos gestos já fazem diferença',
      description:
        'Mesmo nos dias puxados, o que conta é a intenção de cuidar. Um passo de cada vez já é muito.',
      tips: [
        'Escolha um gesto simples para hoje e lembre-se de que você não precisa dar conta de tudo.',
        'Observe um momento em que seu filho pareceu mais tranquilo e tente repetir algo parecido amanhã.',
        'Se algo não saiu como você esperava, se acolha: você já está fazendo o seu melhor.',
      ],
      disclaimer:
        'As sugestões do Materna360 não substituem acompanhamento médico, nutricional ou psicológico. Sempre que sentir necessidade, converse com profissionais de confiança.',
    };
  }
}
