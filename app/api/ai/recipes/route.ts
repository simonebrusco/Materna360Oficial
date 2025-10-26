import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { plan } = body ?? {}

  if (plan === 'free') {
    return NextResponse.json({
      access: {
        denied: true,
        limited_to_one: false,
        message:
          'Receitinhas IA is part of paid plans. Try Essencial (1 recipe/day) or Premium (unlimited).',
      },
      query_echo: body,
      suggestions: [],
      aggregates: { consolidated_shopping_list: [] },
    })
  }

  const demo = {
    access: { denied: false, limited_to_one: false, message: '' },
    query_echo: {
      ingredient: 'abobrinha',
      category: 'refeicao',
      filters_applied: {
        time_max_minutes: 20,
        equipment: ['airfryer'],
        diet: ['vegetariano'],
        energy: 'exausta',
        servings: 2,
        budget: '$',
      },
      child_age_bucket: '1-2a',
      plan: 'premium',
    },
    suggestions: [
      {
        id: 'panquequinha-abobrinha-airfryer',
        title: 'Panquequinha de Abobrinha na Airfryer',
        badges: ['mais_rapida', 'kids_friendly'],
        summary: '1 tigela, poucos ingredientes, assa em 10–12 min.',
        time_total_min: 15,
        effort: '1-panela',
        cost_tier: '$',
        equipment: ['airfryer'],
        servings: 2,
        ingredients: [
          { item: 'abobrinha ralada e espremida', qty: 1, unit: 'xícara' },
          { item: 'ovo', qty: 1, unit: 'un', allergens: ['ovo'], subs: ['1 cs linhaça hidratada (vegano)'] },
          {
            item: 'farelo/farinha de aveia',
            qty: 3,
            unit: 'cs',
            allergens: ['gluten*'],
            subs: ['farinha de arroz (sem_gluten)'],
          },
          {
            item: 'queijo ralado',
            qty: 2,
            unit: 'cs',
            optional: true,
            allergens: ['leite'],
            subs: ['omitido ou levedura nutricional'],
          },
          { item: 'azeite', qty: 1, unit: 'cs' },
          { item: 'pitada de sal', qty: 1, unit: 'pitada', notes: 'mínimo; ajustar para adultos' },
        ],
        steps: [
          'Misture abobrinha, ovo, aveia, queijo (opcional), azeite e uma pitada de sal até formar massa grossa.',
          'Forre a cesta com papel manteiga untado, porcione discos e asse a 180 °C por 10–12 min, virando na metade.',
        ],
        age_adaptations: {
          '1-2a': 'Sirva em tiras grandes e macias; sal mínimo; queijo opcional.',
          '3-4a': 'Em mini-discos; acompanhar iogurte natural.',
          '5-6a': 'Deixe a criança ajudar a modelar os discos.',
        },
        safety_notes: [
          'Atenção a alergênicos: ovo, leite e glúten (se aveia não certificada).',
          'Evite excesso de sal; para <2 anos, sirva sem molhos salgados.',
        ],
        shopping_list: ['abobrinha', 'ovo', 'aveia/farinha', 'azeite', 'queijo (opcional)'],
        microcopy: 'Você merece praticidade hoje 💛',
        racional: 'Selecionada por rapidez, 1 tigela, airfryer e orçamento $.',
      },
      {
        id: 'bolinho-abobrinha-aveia-airfryer',
        title: 'Bolinho Crocante de Abobrinha e Aveia',
        badges: ['kids_friendly'],
        summary: 'Fora crocante, dentro macio; bom para lanche.',
        time_total_min: 20,
        effort: '1-panela',
        cost_tier: '$',
        equipment: ['airfryer'],
        servings: 2,
        ingredients: [
          { item: 'abobrinha ralada e espremida', qty: 1, unit: 'xícara' },
          { item: 'ovo', qty: 1, unit: 'un', allergens: ['ovo'], subs: ['1 cs chia hidratada (vegano)'] },
          {
            item: 'aveia em flocos finos',
            qty: 4,
            unit: 'cs',
            allergens: ['gluten*'],
            subs: ['farinha de arroz (sem_gluten)'],
          },
          { item: 'cebolinha picada', qty: 1, unit: 'cs', optional: true },
          { item: 'azeite', qty: 1, unit: 'cs' },
          { item: 'pitada de sal', qty: 1, unit: 'pitada', notes: 'mínimo; ajustar para adultos' },
        ],
        steps: [
          'Misture tudo até dar liga; modele bolinhos com colher.',
          'Pincele com azeite e asse a 190 °C por 12–14 min, virando na metade.',
        ],
        age_adaptations: {
          '1-2a': 'Ofereça em metades para fácil pega; textura macia por dentro.',
          '3-4a': 'Sirva com molho de iogurte natural.',
          '5-6a': 'Deixe a criança misturar e porcionar com colher.',
        },
        safety_notes: [
          'Alergênicos potenciais: ovo, glúten (aveia não certificada).',
          'Evitar pedaços duros grandes de temperos para 1–2 anos.',
        ],
        shopping_list: ['abobrinha', 'ovo', 'aveia', 'cebolinha', 'azeite'],
        microcopy: 'Texturinha que agrada!',
        racional: 'Textura crocante + ingredientes baratos; encaixa nos filtros.',
      },
      {
        id: 'omelete-abobrinha-sanduicheira-airfryer',
        title: 'Omelete de Abobrinha na Airfryer/Sanduicheira',
        badges: ['mais_economica'],
        summary: 'Zero forno, quase sem louça, 8–10 min.',
        time_total_min: 10,
        effort: '1-panela',
        cost_tier: '$',
        equipment: ['airfryer'],
        servings: 2,
        ingredients: [
          { item: 'ovos', qty: 3, unit: 'un', allergens: ['ovo'] },
          { item: 'abobrinha ralada fina', qty: 0.75, unit: 'xícara' },
          {
            item: 'farelo de aveia',
            qty: 2,
            unit: 'cs',
            allergens: ['gluten*'],
            subs: ['farinha de arroz (sem_gluten)'],
          },
          { item: 'azeite', qty: 1, unit: 'cc' },
          { item: 'pitada de sal', qty: 1, unit: 'pitada', notes: 'mínimo; ajustar para adultos' },
        ],
        steps: [
          'Bata ovos rapidamente, some abobrinha, aveia, sal e azeite.',
          'Despeje em forma pequena (ou assadeira de sanduicheira forrada) e asse a 180 °C por 8–10 min.',
        ],
        age_adaptations: {
          '1-2a': 'Corte em tiras largas; sirva morno.',
          '3-4a': 'Corte em quadradinhos; ofereça com tomate sem pele.',
          '5-6a': 'A criança pode quebrar os ovos com supervisão.',
        },
        safety_notes: ['Verifique cocção completa do ovo.', 'Atenção ao sal para <2 anos.'],
        shopping_list: ['ovos', 'abobrinha', 'aveia/farinha', 'azeite'],
        microcopy: 'Rapidinha que salva!',
        racional: 'Menor custo e tempo; mínima louça; atende equipamento e tempo.',
      },
    ],
    aggregates: {
      consolidated_shopping_list: [
        'abobrinha',
        'ovos',
        'aveia/farinha (ou opção sem glúten)',
        'azeite',
        'queijo (opcional)',
        'cebolinha (opcional)',
      ],
    },
  }

  if (plan === 'essencial') {
    return NextResponse.json({
      ...demo,
      access: {
        denied: false,
        limited_to_one: true,
        message: 'Essencial plan: 1 recipe per day.',
      },
      suggestions: [demo.suggestions[0]],
    })
  }

  return NextResponse.json(demo)
}
