import { type AgeRange } from '@/app/lib/ageRange'

type BaseContent = {
  id: string
  title: string
  ageRange: AgeRange
  description?: string
  refId?: string
  link?: string
}

export type ChildActivity = BaseContent & {
  emoji?: string
  durationMin?: number
  materials?: string[]
  steps?: string[]
}

export type RecommendationType = 'Brincadeira' | 'Receita' | 'Livro'

export type ChildRecommendation = BaseContent & {
  type: RecommendationType
  durationMin?: number
}

export const CHILD_ACTIVITIES: ChildActivity[] = [
  {
    id: 'massagem-afetuosa',
    title: 'Massagem afetuosa',
    emoji: '💞',
    durationMin: 10,
    ageRange: '0-1',
    materials: ['Óleo vegetal morno', 'Toalha macia'],
    steps: [
      'Escolha um ambiente tranquilo e aconchegante.',
      'Massageie braços e pernas com movimentos suaves e circulares.',
      'Finalize com carinho no rosto enquanto conversa com o bebê.',
    ],
  },
  {
    id: 'mobile-contraste',
    title: 'Explorar móbile de contraste',
    emoji: '🎠',
    durationMin: 8,
    ageRange: '0-1',
    materials: ['Móbile de alto contraste', 'Berço ou tapete de atividades'],
    steps: [
      'Posicione o móbile a cerca de 30 cm do bebê.',
      'Movimente lentamente para estimular o foco visual.',
      'Converse descrevendo cores e formas para criar vínculo.',
    ],
  },
  {
    id: 'sons-da-casa',
    title: 'Sons da casa',
    emoji: '🎶',
    durationMin: 12,
    ageRange: '0-1',
    materials: ['Objetos sonoros seguros', 'Colchonete ou mantinha'],
    steps: [
      'Deixe o bebê confortável de barriga para cima.',
      'Apresente sons suaves como chocalhos ou guizos.',
      'Observe as reações e repita os sons preferidos.',
    ],
  },
  {
    id: 'pintura-com-dedos',
    title: 'Pintura com dedos colorida',
    emoji: '🎨',
    durationMin: 20,
    ageRange: '2-3',
    materials: ['Papel grosso', 'Tinta atóxica lavável', 'Avental'],
    steps: [
      'Proteja a área com jornal ou toalha plástica.',
      'Mostre como espalhar tinta com as mãos.',
      'Crie desenhos livres conversando sobre as cores.',
    ],
  },
  {
    id: 'exploracao-na-cozinha',
    title: 'Exploração sensorial na cozinha',
    emoji: '🥣',
    durationMin: 18,
    ageRange: '2-3',
    materials: ['Panelas pequenas', 'Colheres de madeira', 'Potes vazios'],
    steps: [
      'Separe utensílios seguros e limpos.',
      'Mostre diferentes sons batendo suavemente.',
      'Incentive a criança a experimentar combinações.',
    ],
  },
  {
    id: 'danca-com-paninhos',
    title: 'Dança com paninhos coloridos',
    emoji: '🎏',
    durationMin: 15,
    ageRange: '2-3',
    materials: ['Tecidos leves coloridos', 'Playlist animada'],
    steps: [
      'Coloque uma música alegre.',
      'Demonstre movimentos com os paninhos no ar.',
      'Convide a criança a acompanhar mexendo o corpo.',
    ],
  },
  {
    id: 'contacao-de-historias',
    title: 'Contação de histórias com fantoches',
    emoji: '🧸',
    durationMin: 25,
    ageRange: '4-5',
    materials: ['Fantoches de mão', 'Tapete confortável'],
    steps: [
      'Escolha uma história curta e divertida.',
      'Dê voz aos fantoches e envolva a criança na narrativa.',
      'Convide-a a segurar um fantoche e inventar falas.',
    ],
  },
  {
    id: 'jardim-de-copos',
    title: 'Jardim de copos coloridos',
    emoji: '🌈',
    durationMin: 20,
    ageRange: '4-5',
    materials: ['Copos plásticos coloridos', 'Água', 'Conta-gotas'],
    steps: [
      'Encha alguns copos com água e deixe outros vazios.',
      'Mostre como usar o conta-gotas para transferir água.',
      'Misturem cores e inventem histórias sobre o jardim.',
    ],
  },
  {
    id: 'oficina-de-colagem',
    title: 'Oficina de colagem criativa',
    emoji: '✂️',
    durationMin: 30,
    ageRange: '4-5',
    materials: ['Papéis coloridos', 'Revistas', 'Tesoura sem ponta', 'Cola'],
    steps: [
      'Recorte figuras simples e separe retalhos.',
      'Ajude a planejar uma cena ou desenho.',
      'Cole as peças conversando sobre formas e cores.',
    ],
  },
  {
    id: 'roteiro-de-aventura',
    title: 'Roteiro de aventura no quintal',
    emoji: '🗺️',
    durationMin: 35,
    ageRange: '6-7',
    materials: ['Mapa desenhado', 'Objetos para pistas', 'Mochila pequena'],
    steps: [
      'Desenhe um mapa simples com pontos de interesse.',
      'Esconda pistas em locais seguros.',
      'Siga o mapa com a criança até o tesouro final.',
    ],
  },
  {
    id: 'laboratorio-de-sombras',
    title: 'Laboratório de sombras',
    emoji: '🔦',
    durationMin: 25,
    ageRange: '6-7',
    materials: ['Lanterna', 'Objetos translúcidos', 'Papel sulfite'],
    steps: [
      'Apague as luzes e ilumine objetos com a lanterna.',
      'Observe como as sombras mudam de tamanho.',
      'Desenhem as sombras em uma folha de papel.',
    ],
  },
  {
    id: 'historia-em-quadrinhos',
    title: 'História em quadrinhos em família',
    emoji: '🖍️',
    durationMin: 40,
    ageRange: '6-7',
    materials: ['Folhas em branco', 'Lápis de cor', 'Régua'],
    steps: [
      'Divida a folha em quadrinhos com a régua.',
      'Inventem juntos personagens e um enredo curto.',
      'Desenhem cada cena e leiam a história em voz alta.',
    ],
  },
  {
    id: 'jornal-da-semana',
    title: 'Jornal da semana em família',
    emoji: '📰',
    durationMin: 45,
    ageRange: '8+',
    materials: ['Folhas A3', 'Revistas velhas', 'Cola', 'Canetinhas'],
    steps: [
      'Escolham notícias ou acontecimentos marcantes da semana.',
      'Monte colagens com títulos, fotos e ilustrações.',
      'Apresentem o jornal para a família em voz alta.',
    ],
  },
  {
    id: 'oficina-maker-sucata',
    title: 'Oficina maker com sucata',
    emoji: '🛠️',
    durationMin: 50,
    ageRange: '8+',
    materials: ['Caixas de papelão', 'Elásticos', 'Fitas coloridas', 'Tesoura'],
    steps: [
      'Separem materiais recicláveis limpos.',
      'Definam juntos um projeto (robô, maquete, carro).',
      'Construam acrescentando detalhes criativos.',
    ],
  },
  {
    id: 'desafio-ciencia-caseira',
    title: 'Desafio de ciência caseira',
    emoji: '🧪',
    durationMin: 35,
    ageRange: '8+',
    materials: ['Vinagre', 'Bicarbonato', 'Corante alimentício', 'Garrafas pequenas'],
    steps: [
      'Monte uma estação protegendo a superfície.',
      'Misture ingredientes para criar mini vulcões.',
      'Registrem observações e hipóteses.',
    ],
  },
]

export const CHILD_RECOMMENDATIONS: ChildRecommendation[] = [
  // Brincadeiras 0-1
  {
    id: 'brincadeira-toca-sensorial',
    type: 'Brincadeira',
    title: 'Toca de lençol sensorial',
    ageRange: '0-1',
    description: 'Monte uma cabaninha macia e explore texturas com o bebê.',
  },
  {
    id: 'brincadeira-bolhas-no-colo',
    type: 'Brincadeira',
    title: 'Bolhas de colo',
    ageRange: '0-1',
    description: 'Assopre bolhas enquanto o bebê está no colo para estimular o olhar.',
  },
  {
    id: 'brincadeira-sons-suaves',
    type: 'Brincadeira',
    title: 'Caixa de sons suaves',
    ageRange: '0-1',
    description: 'Use chocalhos e sinos macios para explorar ritmos diferentes.',
  },
  // Brincadeiras 2-3
  {
    id: 'brincadeira-corrida-almofadas',
    type: 'Brincadeira',
    title: 'Corrida de almofadas',
    ageRange: '2-3',
    description: 'Crie um circuito de almofadas para pular e equilibrar.',
  },
  {
    id: 'brincadeira-caca-cores',
    type: 'Brincadeira',
    title: 'Caça-cores pela casa',
    ageRange: '2-3',
    description: 'Procurem objetos de uma cor escolhida e façam uma coleção.',
  },
  {
    id: 'brincadeira-pista-carrinhos',
    type: 'Brincadeira',
    title: 'Mini pista de carrinhos',
    ageRange: '2-3',
    description: 'Monte uma pista com fita adesiva e obstáculos simples.',
  },
  // Brincadeiras 4-5
  {
    id: 'brincadeira-teatro-sombras',
    type: 'Brincadeira',
    title: 'Teatro de sombras',
    ageRange: '4-5',
    description: 'Crie personagens com papel recortado e conte histórias na parede.',
  },
  {
    id: 'brincadeira-circuito-fita',
    type: 'Brincadeira',
    title: 'Circuito com fita colorida',
    ageRange: '4-5',
    description: 'Desenhe caminhos no chão para pular, girar e equilibrar.',
  },
  {
    id: 'brincadeira-emocoes-cards',
    type: 'Brincadeira',
    title: 'Cards das emoções',
    ageRange: '4-5',
    description: 'Explore expressões faciais com cartões e histórias rápidas.',
  },
  // Brincadeiras 6-7
  {
    id: 'brincadeira-caca-tesouro',
    type: 'Brincadeira',
    title: 'Caça ao tesouro em pistas',
    ageRange: '6-7',
    description: 'Escreva charadas simples levando a pequenos tesouros.',
  },
  {
    id: 'brincadeira-cidade-caixas',
    type: 'Brincadeira',
    title: 'Cidade com caixas',
    ageRange: '6-7',
    description: 'Construa uma cidade usando caixas, fitas e muita imaginação.',
  },
  {
    id: 'brincadeira-laboratorio-emocoes',
    type: 'Brincadeira',
    title: 'Laboratório das emoções',
    ageRange: '6-7',
    description: 'Associe emoções a cores e crie desenhos sobre cada sensação.',
  },
  // Brincadeiras 8+
  {
    id: 'brincadeira-escape-casa',
    type: 'Brincadeira',
    title: 'Escape room em casa',
    ageRange: '8+',
    description: 'Monte desafios com pistas e enigmas colaborativos.',
  },
  {
    id: 'brincadeira-quiz-curiosidades',
    type: 'Brincadeira',
    title: 'Quiz de curiosidades',
    ageRange: '8+',
    description: 'Crie perguntas sobre temas favoritos com pontuação divertida.',
  },
  {
    id: 'brincadeira-desafio-maker',
    type: 'Brincadeira',
    title: 'Desafio maker com papelão',
    ageRange: '8+',
    description: 'Planeje uma invenção usando materiais recicláveis.',
  },
  // Receitas 0-1
  {
    id: 'receita-pure-batatadoce',
    type: 'Receita',
    title: 'Purê de batata-doce suave',
    ageRange: '0-1',
    durationMin: 20,
    description: 'Purê leve com toque de azeite para introdução alimentar.',
  },
  {
    id: 'receita-pure-pera',
    type: 'Receita',
    title: 'Puré de pera com aveia',
    ageRange: '0-1',
    durationMin: 15,
    description: 'Combinação nutritiva para novas texturas.',
  },
  {
    id: 'receita-creme-abobora',
    type: 'Receita',
    title: 'Creme de abóbora delicado',
    ageRange: '0-1',
    durationMin: 18,
    description: 'Textura cremosa com caldo de legumes caseiro.',
  },
  // Receitas 2-3
  {
    id: 'receita-panqueca-banana',
    type: 'Receita',
    title: 'Panquecas de banana e aveia',
    ageRange: '2-3',
    durationMin: 25,
    description: 'Mini panquecas fofas sem açúcar refinado.',
  },
  {
    id: 'receita-bolinhos-legumes',
    type: 'Receita',
    title: 'Bolinhos de legumes no forno',
    ageRange: '2-3',
    durationMin: 30,
    description: 'Assados crocantes com vegetais variados.',
  },
  {
    id: 'receita-sanduiche-colorido',
    type: 'Receita',
    title: 'Sanduíche arco-íris',
    ageRange: '2-3',
    durationMin: 15,
    description: 'Camadas coloridas com pastas naturais.',
  },
  // Receitas 4-5
  {
    id: 'receita-wrap-divertido',
    type: 'Receita',
    title: 'Wrap divertido de frango',
    ageRange: '4-5',
    durationMin: 20,
    description: 'Enrolado recheado com tirinhas e vegetais.',
  },
  {
    id: 'receita-salada-arcoiris',
    type: 'Receita',
    title: 'Salada arco-íris crocante',
    ageRange: '4-5',
    durationMin: 15,
    description: 'Montagem colorida com molho leve.',
  },
  {
    id: 'receita-smoothie-cremoso',
    type: 'Receita',
    title: 'Smoothie cremoso de frutas',
    ageRange: '4-5',
    durationMin: 10,
    description: 'Bebida energética com iogurte natural.',
  },
  // Receitas 6-7
  {
    id: 'receita-pizza-frigideira',
    type: 'Receita',
    title: 'Pizza de frigideira',
    ageRange: '6-7',
    durationMin: 25,
    description: 'Base integral com cobertura colorida.',
  },
  {
    id: 'receita-espetinho-frutas',
    type: 'Receita',
    title: 'Espetinho de frutas com iogurte',
    ageRange: '6-7',
    durationMin: 15,
    description: 'Montagem divertida com calda de mel opcional.',
  },
  {
    id: 'receita-macarrao-arcoiris',
    type: 'Receita',
    title: 'Macarrão arco-íris de legumes',
    ageRange: '6-7',
    durationMin: 30,
    description: 'Molho leve com vegetais ralados coloridos.',
  },
  // Receitas 8+
  {
    id: 'receita-tacos-leves',
    type: 'Receita',
    title: 'Tacos leves de frango',
    ageRange: '8+',
    durationMin: 30,
    description: 'Montagem colaborativa com recheios variados.',
  },
  {
    id: 'receita-sushi-sanduiche',
    type: 'Receita',
    title: 'Sushi de sanduíche',
    ageRange: '8+',
    durationMin: 25,
    description: 'Rolinho recheado com pastas e vegetais.',
  },
  {
    id: 'receita-cookies-integrais',
    type: 'Receita',
    title: 'Cookies integrais com chocolate meio amargo',
    ageRange: '8+',
    durationMin: 35,
    description: 'Massa fácil com participação das crianças.',
  },
  // Livros 0-1
  {
    id: 'livro-contraste',
    type: 'Livro',
    title: 'Amigos de alto contraste',
    ageRange: '0-1',
    description: 'Páginas em preto e branco com palavras simples.',
  },
  {
    id: 'livro-poemas-cantados',
    type: 'Livro',
    title: 'Poemas cantados para o colo',
    ageRange: '0-1',
    description: 'Rimas curtas para embalar momentos de cuidado.',
  },
  {
    id: 'livro-primeiras-palavras',
    type: 'Livro',
    title: 'Primeiras palavras ilustradas',
    ageRange: '0-1',
    description: 'Figuras grandes com texturas para tocar.',
  },
  // Livros 2-3
  {
    id: 'livro-animais-quintal',
    type: 'Livro',
    title: 'Animais do quintal',
    ageRange: '2-3',
    description: 'História rimada sobre bichinhos curiosos.',
  },
  {
    id: 'livro-chuva',
    type: 'Livro',
    title: 'A história da chuva',
    ageRange: '2-3',
    description: 'Descubra o ciclo da água com ilustrações delicadas.',
  },
  {
    id: 'livro-sensacoes',
    type: 'Livro',
    title: 'O livro das sensações',
    ageRange: '2-3',
    description: 'Paginas interativas que exploram sentimentos.',
  },
  // Livros 4-5
  {
    id: 'livro-aventuras-jardim',
    type: 'Livro',
    title: 'Aventuras no jardim encantado',
    ageRange: '4-5',
    description: 'Narrativa sobre amizade e imaginação.',
  },
  {
    id: 'livro-trem-cores',
    type: 'Livro',
    title: 'O trem das cores',
    ageRange: '4-5',
    description: 'Viagem pelas cores com lições de cooperação.',
  },
  {
    id: 'livro-espaco',
    type: 'Livro',
    title: 'Um dia no espaço',
    ageRange: '4-5',
    description: 'Exploração das estrelas com linguagem acessível.',
  },
  // Livros 6-7
  {
    id: 'livro-clube-inventores',
    type: 'Livro',
    title: 'Clube dos inventores mirins',
    ageRange: '6-7',
    description: 'História sobre criatividade e experiências.',
  },
  {
    id: 'livro-ilha-desafios',
    type: 'Livro',
    title: 'A ilha dos desafios',
    ageRange: '6-7',
    description: 'Narrativa cheia de enigmas e cooperação.',
  },
  {
    id: 'livro-floresta',
    type: 'Livro',
    title: 'Jornada ao centro da floresta',
    ageRange: '6-7',
    description: 'Mistura aventura e cuidado com a natureza.',
  },
  // Livros 8+
  {
    id: 'livro-misterio-biblioteca',
    type: 'Livro',
    title: 'Mistério na biblioteca antiga',
    ageRange: '8+',
    description: 'História investigativa com pistas escondidas.',
  },
  {
    id: 'livro-atlas-descobertas',
    type: 'Livro',
    title: 'Atlas das grandes descobertas',
    ageRange: '8+',
    description: 'Curiosidades históricas com mapas ilustrados.',
  },
  {
    id: 'livro-manual-experimentos',
    type: 'Livro',
    title: 'Manual de experimentos em casa',
    ageRange: '8+',
    description: 'Sugestões práticas para pequenos cientistas.',
  },
]
