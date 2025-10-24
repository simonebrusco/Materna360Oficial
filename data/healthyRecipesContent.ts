export type RecipeStageKey = '6-8m' | '9-12m' | '12+m'

export type StageRecipe = {
  id: string
  stage: RecipeStageKey
  title: string
  prepTime: string
  keyIngredients: string[]
  summary: string
}

export type FamilyRecipeSuggestion = {
  id: string
  title: string
  prepTime: string
  description: string
  keyIngredients: string[]
}

export const RECIPE_STAGE_ORDER: RecipeStageKey[] = ['6-8m', '9-12m', '12+m']

export const RECIPE_STAGE_INFO: Record<RecipeStageKey, { label: string; tagline: string }> = {
  '6-8m': {
    label: '6–8 meses',
    tagline: 'Purês suaves com um ingrediente principal por vez.'
  },
  '9-12m': {
    label: '9–12 meses',
    tagline: 'Combinações de 2–3 ingredientes e texturas progressivas.'
  },
  '12+m': {
    label: '12+ meses',
    tagline: 'Receitas da família adaptadas com menos sal e sem ultraprocessados.'
  }
}

export const BABY_STAGE_RECIPES: Record<RecipeStageKey, StageRecipe[]> = {
  '6-8m': [
    {
      id: 'pure-batatadoce-suave',
      stage: '6-8m',
      title: 'Purê suave de batata-doce',
      prepTime: '15 min',
      keyIngredients: ['Batata-doce cozida', 'Água morna filtrada', 'Gotas de azeite extravirgem'],
      summary: 'Batata-doce amassada até ficar sedosa e finalizada com gotinhas de azeite para oferecer energia gentil.'
    },
    {
      id: 'pure-abobora-cabotia',
      stage: '6-8m',
      title: 'Purê cremoso de abóbora cabotiá',
      prepTime: '18 min',
      keyIngredients: ['Abóbora cabotiá cozida no vapor', 'Água do cozimento', 'Azeite suave'],
      summary: 'Textura lisa com sabor naturalmente adocicado da abóbora, perfeito para treinar a aceitação de cores novas.'
    },
    {
      id: 'pure-pera-cozida',
      stage: '6-8m',
      title: 'Purê de pera cozida',
      prepTime: '10 min',
      keyIngredients: ['Pera madura descascada', 'Água filtrada', 'Raspas de casca de laranja (opcional)'],
      summary: 'Fruta cozida rapidamente, amassada com garfo para uma textura macia e levemente aromática.'
    }
  ],
  '9-12m': [
    {
      id: 'mandioquinha-lentilha-amassada',
      stage: '9-12m',
      title: 'Mandioquinha com lentilha amassada',
      prepTime: '25 min',
      keyIngredients: ['Mandioquinha cozida', 'Lentilha vermelha cozida', 'Salsinha bem picada'],
      summary: 'Textura amassada com pedacinhos macios que ajudam na mastigação e oferecem ferro vegetal.'
    },
    {
      id: 'quinoa-abobrinha-frango',
      stage: '9-12m',
      title: 'Quinoa cremosa com abobrinha e frango',
      prepTime: '30 min',
      keyIngredients: ['Quinoa cozida', 'Abobrinha ralada no vapor', 'Frango desfiado bem macio'],
      summary: 'Mistura úmida com proteína suave, ideal para treinar mastigação com pedaços pequenos.'
    },
    {
      id: 'cuscuz-ovo-macio',
      stage: '9-12m',
      title: 'Cuscuz de milho com ovo mexido macio',
      prepTime: '20 min',
      keyIngredients: ['Cuscuz de milho hidratado', 'Ovo mexido cremoso', 'Cenoura ralada fininha'],
      summary: 'Cuscuz hidratado com ovo mexido bem úmido e cenoura, trabalhando texturas sem perder segurança.'
    }
  ],
  '12+m': [
    {
      id: 'arroz-cremoso-legumes',
      stage: '12+m',
      title: 'Arroz cremoso com legumes ao vapor',
      prepTime: '35 min',
      keyIngredients: ['Arroz integral cozido', 'Legumes no vapor (brócolis, cenoura, ervilha)', 'Iogurte natural sem açúcar'],
      summary: 'Arroz da família finalizado com iogurte para ficar cremoso e legumes em pedaços pequenos, com pouco sal.'
    },
    {
      id: 'panqueca-integral-banana',
      stage: '12+m',
      title: 'Panquequinha integral de banana',
      prepTime: '15 min',
      keyIngredients: ['Banana amassada', 'Farinha de aveia', 'Ovo batido'],
      summary: 'Mini panquecas douradas em frigideira antiaderente, macias e fáceis de segurar com as mãos.'
    },
    {
      id: 'sopa-feijao-suave',
      stage: '12+m',
      title: 'Sopa suave de feijão com legumes',
      prepTime: '40 min',
      keyIngredients: ['Feijão carioca cozido e batido', 'Abóbora em cubinhos', 'Cebolinha fresca'],
      summary: 'Caldo encorpado com feijão peneirado, legumes macios e tempero natural, sem ultraprocessados.'
    }
  ]
}

export const FAMILY_RECIPES_SUGGESTIONS: FamilyRecipeSuggestion[] = [
  {
    id: 'bowl-quinoa-energizante',
    title: 'Bowl energizante de quinoa',
    prepTime: '20 min',
    description: 'Quinoa cozida com folhas verdes salteadas, grão-de-bico crocante e molho de limão com tahine.',
    keyIngredients: ['Quinoa cozida', 'Grão-de-bico assado', 'Couve baby', 'Molho de tahine com limão']
  },
  {
    id: 'smoothie-frutas-vermelhas',
    title: 'Smoothie cremoso de frutas vermelhas',
    prepTime: '5 min',
    description: 'Mistura refrescante de frutas vermelhas congeladas, iogurte natural e semente de chia para saciedade.',
    keyIngredients: ['Frutas vermelhas', 'Iogurte natural', 'Semente de chia', 'Mel opcional']
  },
  {
    id: 'creme-abobora-gengibre',
    title: 'Creme aveludado de abóbora com gengibre',
    prepTime: '30 min',
    description: 'Abóbora assada batida com caldo de legumes caseiro e toque de gengibre, finalizada com sementes tostadas.',
    keyIngredients: ['Abóbora assada', 'Caldo de legumes caseiro', 'Gengibre fresco', 'Sementes de abóbora tostadas']
  },
  {
    id: 'wrap-integral-frango',
    title: 'Wrap integral de frango e avocado',
    prepTime: '15 min',
    description: 'Tortilha integral recheada com frango desfiado, creme de avocado e folhas crocantes.',
    keyIngredients: ['Tortilha integral', 'Frango desfiado', 'Avocado amassado', 'Folhas verdes crocantes']
  }
]
