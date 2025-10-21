import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const PROFILE_COOKIE = 'materna360-profile'

const STICKER_IDS = [
  'mae-carinhosa',
  'mae-leve',
  'mae-determinada',
  'mae-criativa',
  'mae-tranquila',
] as const

type StickerId = (typeof STICKER_IDS)[number]

type ChildProfile = {
  id: string
  genero: 'menino' | 'menina'
  idadeMeses: number
  nome: string
}

type ProfilePayload = {
  nomeMae: string
  filhos: ChildProfile[]
  figurinha: StickerId | ''
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

const defaultProfile = (): ProfilePayload => ({
  nomeMae: '',
  filhos: [
    {
      id: createId(),
      genero: 'menino',
      idadeMeses: 0,
      nome: '',
    },
  ],
  figurinha: '',
})

const sanitizeChild = (child: any): ChildProfile => ({
  id: typeof child?.id === 'string' && child.id.trim() ? child.id : createId(),
  genero: child?.genero === 'menina' ? 'menina' : 'menino',
  idadeMeses: Number.isFinite(Number(child?.idadeMeses)) && Number(child?.idadeMeses) >= 0 ? Number(child.idadeMeses) : 0,
  nome: typeof child?.nome === 'string' ? child.nome.trim() : '',
})

const sanitizeProfile = (value: any): ProfilePayload => {
  const nomeMae = typeof value?.nomeMae === 'string' ? value.nomeMae.trim() : ''
  const children = Array.isArray(value?.filhos) ? value.filhos.map(sanitizeChild) : []
  const figurinha = STICKER_IDS.includes(value?.figurinha) ? (value.figurinha as StickerId) : ''

  return {
    nomeMae,
    filhos: children.length > 0 ? children : defaultProfile().filhos,
    figurinha,
  }
}

const validateProfile = (payload: ProfilePayload) => {
  if (!payload.nomeMae) {
    return { valid: false, message: 'Mother name is required.' }
  }

  if (!Array.isArray(payload.filhos) || payload.filhos.length === 0) {
    return { valid: false, message: 'At least one child is required.' }
  }

  const hasInvalidChild = payload.filhos.some((child) => child.idadeMeses < 0)

  if (hasInvalidChild) {
    return { valid: false, message: 'Child age must be zero or greater.' }
  }

  if (payload.figurinha && !STICKER_IDS.includes(payload.figurinha)) {
    return { valid: false, message: 'Invalid sticker selection.' }
  }

  return { valid: true as const }
}

export async function GET() {
  const cookieStore = cookies()
  const storedProfile = cookieStore.get(PROFILE_COOKIE)

  if (!storedProfile?.value) {
    return NextResponse.json(defaultProfile(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  try {
    const parsed = JSON.parse(storedProfile.value)
    const sanitized = sanitizeProfile(parsed)

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to parse stored profile:', error)
    return NextResponse.json(defaultProfile(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const sanitized = sanitizeProfile(body)
    const validation = validateProfile(sanitized)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.message,
        },
        {
          status: 400,
        }
      )
    }

    const cookieStore = cookies()

    cookieStore.set({
      name: PROFILE_COOKIE,
      value: JSON.stringify(sanitized),
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to save profile:', error)
    return NextResponse.json(
      {
        error: 'Invalid request body.',
      },
      {
        status: 400,
      }
    )
  }
}
