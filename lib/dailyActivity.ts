export type AgeBand = '0-6m' | '7-12m' | '1-2a' | '3-4a' | '5-6a'

export type DailyActivity = {
  id: string
  title: string
  emoji?: string
  durationMin?: number
  ageBand?: AgeBand
  materials?: string[]
  steps?: string[]
  refId?: string
}

type StoredDailyActivity = {
  dateKey: string
  band: AgeBand
  activity: DailyActivity
}

type DailyActivityResult = {
  dateKey: string
  activity: DailyActivity
  ageBand: AgeBand
}

const DAILY_STORAGE_KEY = 'daily_activity_v1'
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
const DEFAULT_AGE_BAND: AgeBand = '1-2a'
const AGE_BAND_ORDER: AgeBand[] = ['0-6m', '7-12m', '1-2a', '3-4a', '5-6a']

const ACTIVITIES_CATALOG: DailyActivity[] = [
  {
    id: 'massagem-afetuosa',
    title: 'Massagem afetuosa',
    emoji: '💞',
    durationMin: 10,
    ageBand: '0-6m',
    materials: ['Óleo vegetal morno', 'Toalha macia'],
    steps: [
      'Coloque o bebê em uma superfície firme e confortável',
      'Massageie braços e pernas com movimentos circulares',
      'Finalize com carinhos suaves no rosto',
    ],
  },
  {
    id: 'mobile-contraste',
    title: 'Explorar móbile de contraste',
    emoji: '🎠',
    durationMin: 8,
    ageBand: '0-6m',
    materials: ['Móbile de alto contraste', 'Berço ou tapete de atividades'],
    steps: [
      'Posicione o móbile a cerca de 30 cm do bebê',
      'Movimente lentamente para estimular o olhar',
      'Converse com o bebê descrevendo as cores e formas',
    ],
  },
  {
    id: 'sons-da-casa',
    title: 'Sons da casa',
    emoji: '🎶',
    durationMin: 12,
    ageBand: '0-6m',
    materials: ['Objetos sonoros seguros', 'Colchonete ou mantinha'],
    steps: [
      'Deixe o bebê confortável de barriga para cima',
      'Apresente sons suaves como chocalhos ou guizos',
      'Observe as reações e repita os sons que agradarem',
    ],
  },
  {
    id: 'caixa-de-tesouros',
    title: 'Caixa de tesouros sensoriais',
    emoji: '🪄',
    durationMin: 15,
    ageBand: '7-12m',
    materials: ['Caixa rasa', 'Objetos seguros de diferentes texturas'],
    steps: [
      'Disponha objetos variados dentro da caixa',
      'Sente o bebê e apresente cada item com calma',
      'Deixe-o explorar livremente com supervisão',
    ],
  },
  {
    id: 'brincar-de-imitar',
    title: 'Brincar de imitar',
    emoji: '🐒',
    durationMin: 10,
    ageBand: '7-12m',
    materials: ['Espaço livre para brincar'],
    steps: [
      'Mostre gestos simples como bater palmas ou dar tchau',
      'Convide o bebê a repetir os movimentos',
      'Celebre cada tentativa com elogios e sorrisos',
    ],
  },
  {
    id: 'esconde-objetos',
    title: 'Esconde-esconde com objetos',
    emoji: '🙈',
    durationMin: 12,
    ageBand: '7-12m',
    materials: ['Pano leve ou fralda de tecido', 'Brinquedo favorito'],
    steps: [
      'Mostre o brinquedo ao bebê e cubra com o pano',
      'Pergunte onde está e incentive a puxar o pano',
      'Repita escondendo em locais próximos e seguros',
    ],
  },
  {
    id: 'pintura-com-dedos',
    title: 'Pintura com dedos colorida',
    emoji: '🎨',
    durationMin: 20,
    ageBand: '1-2a',
    materials: ['Papel grosso', 'Tinta atóxica lavável', 'Avental ou camiseta velha'],
    steps: [
      'Proteja a área com jornal ou toalha plástica',
      'Mostre como espalhar tinta com as mãos',
      'Crie desenhos livres juntos e converse sobre as cores',
    ],
  },
  {
    id: 'exploracao-na-cozinha',
    title: 'Exploração sensorial na cozinha',
    emoji: '🥣',
    durationMin: 18,
    ageBand: '1-2a',
    materials: ['Panelas pequenas', 'Colheres de madeira', 'Potes vazios'],
    steps: [
      'Separe utensílios seguros e limpos',
      'Mostre diferentes sons batendo suavemente',
      'Deixe a criança experimentar combinações livremente',
    ],
  },
  {
    id: 'dança-com-paninhos',
    title: 'Dança com paninhos coloridos',
    emoji: '🎏',
    durationMin: 15,
    ageBand: '1-2a',
    materials: ['Tecidos leves coloridos', 'Playlist alegre'],
    steps: [
      'Coloque uma música animada',
      'Demonstre movimentos com os paninhos no ar',
      'Convide a criança a acompanhar mexendo o corpo',
    ],
  },
  {
    id: 'contacao-de-historias',
    title: 'Contação de histórias com fantoches',
    emoji: '🧸',
    durationMin: 25,
    ageBand: '3-4a',
    materials: ['Fantoches de mão', 'Tapete confortável'],
    steps: [
      'Escolha uma história curta com personagens divertidos',
      'Dê voz aos fantoches e envolva a criança na narrativa',
      'Convide-a a segurar um fantoche e inventar falas',
    ],
  },
  {
    id: 'jardim-de-copos',
    title: 'Jardim de copos coloridos',
    emoji: '🌈',
    durationMin: 20,
    ageBand: '3-4a',
    materials: ['Copos plásticos coloridos', 'Água', 'Conta-gotas'],
    steps: [
      'Encha alguns copos com água e deixe outros vazios',
      'Mostre como usar o conta-gotas para transferir a água',
      'Misturem cores e contem histórias sobre as "plantinhas"',
    ],
  },
  {
    id: 'oficina-de-colagem',
    title: 'Oficina de colagem criativa',
    emoji: '✂️',
    durationMin: 30,
    ageBand: '3-4a',
    materials: ['Papéis coloridos', 'Revistas velhas', 'Tesoura sem ponta', 'Cola branca'],
    steps: [
      'Recorte figuras simples e separe pedaços de papel',
      'Ajude a criança a planejar uma cena ou desenho',
      'Cole as peças conversando sobre formas e cores',
    ],
  },
  {
    id: 'roteiro-de-aventura',
    title: 'Roteiro de aventura no quintal',
    emoji: '🗺️',
    durationMin: 35,
    ageBand: '5-6a',
    materials: ['Mapa desenhado à mão', 'Objetos para pistas', 'Bolsa ou mochila pequena'],
    steps: [
      'Desenhe um mapa simples com pontos de interesse',
      'Esconda pistas pequenas pelo espaço seguro',
      'Siga o mapa com a criança até o "tesouro" final',
    ],
  },
  {
    id: 'laboratorio-de-sombras',
    title: 'Laboratório de sombras',
    emoji: '🔦',
    durationMin: 25,
    ageBand: '5-6a',
    materials: ['Lanterna', 'Objetos translúcidos', 'Papel sulfite', 'Lápis'],
    steps: [
      'Apague as luzes e ilumine objetos com a lanterna',
      'Observe com a criança como as sombras mudam',
      'Desenhem as sombras em uma folha de papel',
    ],
  },
  {
    id: 'historia-em-quadrinhos',
    title: 'História em quadrinhos em família',
    emoji: '🖍️',
    durationMin: 40,
    ageBand: '5-6a',
    materials: ['Folhas em branco', 'Lápis de cor', 'Régua'],
    steps: [
      'Divida a folha em quadrinhos usando a régua',
      'Inventem juntos personagens e um enredo curto',
      'Desenhem cada cena e leiam a história em voz alta',
    ],
  },
]

export const FALLBACK_ACTIVITY: DailyActivity = {
  id: 'contato-afetuoso',
  title: 'Momento de contato afetuoso',
  emoji: '🤗',
  durationMin: 10,
  ageBand: DEFAULT_AGE_BAND,
  materials: ['Cobertor macio', 'Música calma'],
  steps: [
    'Reserve um espaço tranquilo e silencioso',
    'Segure a criança no colo e cante suavemente',
    'Respirem juntos por alguns instantes em silêncio',
  ],
}

const safeHash = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const selectActivity = (dateKey: string, preferredBand: AgeBand): DailyActivity => {
  const targetIndex = AGE_BAND_ORDER.indexOf(preferredBand)
  const prioritizedBands = AGE_BAND_ORDER
    .map((band, index) => ({ band, distance: targetIndex >= 0 ? Math.abs(index - targetIndex) : index }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.band)

  for (const band of prioritizedBands) {
    const pool = ACTIVITIES_CATALOG.filter((activity) => activity.ageBand === band)
    if (pool.length === 0) {
      continue
    }
    const index = safeHash(`${dateKey}:${band}`) % pool.length
    return pool[index]
  }

  return FALLBACK_ACTIVITY
}

const buildStorageKey = (band: AgeBand) => `${DAILY_STORAGE_KEY}:${band}`

const sanitizeStoredActivity = (value: unknown, fallbackBand: AgeBand): StoredDailyActivity | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const raw = value as Record<string, unknown>
  const dateKey = typeof raw.dateKey === 'string' ? raw.dateKey : null
  const activity = raw.activity
  const rawBand = typeof raw.band === 'string' ? (raw.band as AgeBand) : undefined

  if (!dateKey || !activity || typeof activity !== 'object') {
    return null
  }

  const resolvedBand = AGE_BAND_ORDER.includes(rawBand as AgeBand) ? (rawBand as AgeBand) : fallbackBand

  return {
    dateKey,
    band: resolvedBand,
    activity: activity as DailyActivity,
  }
}

const readStoredActivity = (band: AgeBand): StoredDailyActivity | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(buildStorageKey(band))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    const sanitized = sanitizeStoredActivity(parsed, band)
    if (sanitized && sanitized.band === band) {
      return sanitized
    }
  } catch (error) {
    console.error('Falha ao ler atividade diária do armazenamento:', error)
  }

  return null
}

const readLegacyStoredActivity = (): StoredDailyActivity | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(DAILY_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    const activityBand =
      typeof parsed?.activity?.ageBand === 'string' && AGE_BAND_ORDER.includes(parsed.activity.ageBand as AgeBand)
        ? (parsed.activity.ageBand as AgeBand)
        : DEFAULT_AGE_BAND

    const sanitized = sanitizeStoredActivity({ ...parsed, band: parsed?.band ?? activityBand }, activityBand)
    if (sanitized) {
      return sanitized
    }
  } catch (error) {
    console.error('Falha ao ler atividade diária legada do armazenamento:', error)
  }

  return null
}

const writeStoredActivity = (band: AgeBand, record: StoredDailyActivity) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload: StoredDailyActivity = {
    dateKey: record.dateKey,
    band,
    activity: {
      ...record.activity,
      ageBand: record.activity.ageBand ?? band,
    },
  }

  try {
    window.localStorage.setItem(buildStorageKey(band), JSON.stringify(payload))
    window.localStorage.removeItem(DAILY_STORAGE_KEY)
  } catch (error) {
    console.error('Falha ao salvar atividade diária no armazenamento:', error)
  }
}

const findCachedActivityForDate = (dateKey: string): StoredDailyActivity | null => {
  if (typeof window === 'undefined') {
    return null
  }

  for (const band of AGE_BAND_ORDER) {
    const record = readStoredActivity(band)
    if (record?.dateKey === dateKey) {
      return record
    }
  }

  const legacy = readLegacyStoredActivity()
  if (legacy?.dateKey === dateKey) {
    return legacy
  }

  return null
}

const createResultFromRecord = (record: StoredDailyActivity): DailyActivityResult => ({
  dateKey: record.dateKey,
  activity: record.activity,
  ageBand: record.band,
})

const getBrazilDateKey = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value ?? '0000'
  const month = parts.find((part) => part.type === 'month')?.value ?? '00'
  const day = parts.find((part) => part.type === 'day')?.value ?? '00'

  return `${year}-${month}-${day}`
}

export const mapMonthsToAgeBand = (months: number): AgeBand => {
  if (months <= 6) {
    return '0-6m'
  }
  if (months <= 12) {
    return '7-12m'
  }
  if (months <= 24) {
    return '1-2a'
  }
  if (months <= 48) {
    return '3-4a'
  }
  return '5-6a'
}

const fetchProfileAgeBand = async (): Promise<AgeBand> => {
  try {
    const response = await fetch('/api/profile', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Falha ao carregar perfil')
    }

    const data = await response.json()
    const children = Array.isArray(data?.filhos) ? data.filhos : []
    const firstChild = children.find((child: any) => Number.isFinite(Number(child?.idadeMeses)))

    if (firstChild) {
      return mapMonthsToAgeBand(Number(firstChild.idadeMeses))
    }
  } catch (error) {
    console.error('Não foi possível determinar faixa etária do perfil:', error)
  }

  return DEFAULT_AGE_BAND
}

export const resolveDailyActivity = async (): Promise<DailyActivityResult> => {
  const todayKey = getBrazilDateKey()
  const cached = readStoredActivity()

  if (cached?.dateKey === todayKey && cached.activity) {
    return {
      dateKey: cached.dateKey,
      activity: cached.activity,
      ageBand: cached.activity.ageBand ?? DEFAULT_AGE_BAND,
    }
  }

  const ageBand = await fetchProfileAgeBand()
  const activity = selectActivity(todayKey, ageBand)
  const record = { dateKey: todayKey, activity }

  writeStoredActivity(record)

  return {
    dateKey: todayKey,
    activity,
    ageBand,
  }
}

export const getInitialDailyActivity = (): DailyActivityResult => {
  const todayKey = getBrazilDateKey()
  const cached = readStoredActivity()

  if (cached?.dateKey === todayKey && cached.activity) {
    return {
      dateKey: cached.dateKey,
      activity: cached.activity,
      ageBand: cached.activity.ageBand ?? DEFAULT_AGE_BAND,
    }
  }

  return {
    dateKey: todayKey,
    activity: FALLBACK_ACTIVITY,
    ageBand: DEFAULT_AGE_BAND,
  }
}

export const getTodayDateKey = getBrazilDateKey
