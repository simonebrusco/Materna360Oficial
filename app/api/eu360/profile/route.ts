import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isProfileStickerId, DEFAULT_STICKER_ID } from '@/app/lib/stickers'

export const runtime = 'nodejs'

const COOKIE = 'm360_profile'
const ONE_YEAR = 60 * 60 * 24 * 365

type Eu360Profile = {
  name?: string
  birthdate?: string | null
  age_months?: number | null
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  routineChaosMoments?: string[]
  routineScreenTime?: 'nada' | 'ate1h' | '1-2h' | 'mais2h'
  routineDesiredSupport?: string[]
  supportNetwork?: string[]
  supportAvailability?: 'sempre' | 'as-vezes' | 'raramente'
  userContentPreferences?: string[]
  userGuidanceStyle?: 'diretas' | 'explicacao' | 'motivacionais'
  userSelfcareFrequency?: 'diario' | 'semana' | 'pedido'
  figurinha?: string
  children?: unknown[]
}

type CookiePayload = {
  motherName?: string
  nomeMae?: string
  figurinha?: string
  eu360?: Eu360Profile
}

const safeParse = (value: string | undefined): CookiePayload => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as CookiePayload
    }
  } catch (error) {
    console.error('[Eu360ProfileAPI] Failed to parse cookie:', error)
  }

  return {}
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Eu360Profile

    const jar = cookies()
    const prev = safeParse(jar.get(COOKIE)?.value)

    const effectiveName = (body.name ?? '').trim()
    const figurinhaToPersist = isProfileStickerId(body.figurinha)
      ? body.figurinha
      : prev.figurinha || DEFAULT_STICKER_ID

    const prevEu360: Eu360Profile = prev.eu360 || {}

    const mergedEu360: Eu360Profile = {
      ...prevEu360,
      ...body,
      name: effectiveName || body.name || prevEu360.name || '',
      figurinha: figurinhaToPersist,
    }

    const next: CookiePayload = {
      ...prev,
      ...(mergedEu360.name
        ? {
            motherName: mergedEu360.name,
            nomeMae: mergedEu360.name,
          }
        : {}),
      figurinha: figurinhaToPersist,
      eu360: mergedEu360,
    }

    jar.set({
      name: COOKIE,
      value: JSON.stringify(next),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
      maxAge: ONE_YEAR,
    })

    return NextResponse.json(
      { ok: true, profile: next },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[Eu360ProfileAPI] POST error:', error)

    return NextResponse.json(
      {
        error: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}

export async function GET() {
  try {
    const raw = cookies().get(COOKIE)?.value
    const data = safeParse(raw)

    const eu360: Eu360Profile = data.eu360 || {}

    const response: Eu360Profile & { figurinha: string } = {
      name:
        eu360.name ||
        data.motherName ||
        data.nomeMae ||
        '',
      birthdate: eu360.birthdate ?? null,
      age_months:
        typeof eu360.age_months === 'number' ? eu360.age_months : null,
      userPreferredName: eu360.userPreferredName || '',
      userRole: eu360.userRole,
      userEmotionalBaseline: eu360.userEmotionalBaseline,
      userMainChallenges: Array.isArray(eu360.userMainChallenges)
        ? eu360.userMainChallenges
        : [],
      userEnergyPeakTime: eu360.userEnergyPeakTime,
      routineChaosMoments: Array.isArray(eu360.routineChaosMoments)
        ? eu360.routineChaosMoments
        : [],
      routineScreenTime: eu360.routineScreenTime,
      routineDesiredSupport: Array.isArray(eu360.routineDesiredSupport)
        ? eu360.routineDesiredSupport
        : [],
      supportNetwork: Array.isArray(eu360.supportNetwork)
        ? eu360.supportNetwork
        : [],
      supportAvailability: eu360.supportAvailability,
      userContentPreferences: Array.isArray(eu360.userContentPreferences)
        ? eu360.userContentPreferences
        : [],
      userGuidanceStyle: eu360.userGuidanceStyle,
      userSelfcareFrequency: eu360.userSelfcareFrequency,
      figurinha:
        (typeof eu360.figurinha === 'string' && eu360.figurinha) ||
        data.figurinha ||
        DEFAULT_STICKER_ID,
      children: Array.isArray(eu360.children) ? eu360.children : [],
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error(
      '[Eu360ProfileAPI] GET error:',
      error instanceof Error ? error.message : error
    )

    return NextResponse.json(
      {
        name: '',
        birthdate: null,
        age_months: null,
        userMainChallenges: [],
        routineChaosMoments: [],
        routineDesiredSupport: [],
        supportNetwork: [],
        userContentPreferences: [],
        figurinha: DEFAULT_STICKER_ID,
        children: [],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
