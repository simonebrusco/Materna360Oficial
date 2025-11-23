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

const safeParse = (value: string | undefined): Record<string, unknown> => {
  if (!value) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch (error) {
    console.error('[Eu360ProfileAPI] Failed to parse cookie:', error)
  }

  return {}
}

export async function POST(req: Request) {
  const body = (await req.json()) as Eu360Profile

  const jar = cookies()
  const prev = safeParse(jar.get(COOKIE)?.value)

  const effectiveName = (body.name ?? '').trim()
  const figurinhaToPersist = isProfileStickerId(body.figurinha)
    ? body.figurinha
    : (prev.figurinha as string) || DEFAULT_STICKER_ID

  const next: Record<string, unknown> = {
    ...prev,
    // Garantir compatibilidade com /api/profile e useProfile
    ...(effectiveName
      ? { motherName: effectiveName, nomeMae: effectiveName, name: effectiveName }
      : {}),
    birthdate: body.birthdate ?? (prev.birthdate as string | null) ?? null,
    age_months:
      typeof body.age_months === 'number'
        ? body.age_months
        : (typeof prev.age_months === 'number' ? prev.age_months : null),
    userPreferredName: body.userPreferredName ?? (prev.userPreferredName as string | undefined),
    userRole: body.userRole ?? (prev.userRole as Eu360Profile['userRole']),
    userEmotionalBaseline:
      body.userEmotionalBaseline ??
      (prev.userEmotionalBaseline as Eu360Profile['userEmotionalBaseline']),
    userMainChallenges:
      Array.isArray(body.userMainChallenges)
        ? body.userMainChallenges
        : (Array.isArray(prev.userMainChallenges)
            ? (prev.userMainChallenges as string[])
            : []),
    userEnergyPeakTime:
      body.userEnergyPeakTime ?? (prev.userEnergyPeakTime as Eu360Profile['userEnergyPeakTime']),
    routineChaosMoments:
      Array.isArray(body.routineChaosMoments)
        ? body.routineChaosMoments
        : (Array.isArray(prev.routineChaosMoments)
            ? (prev.routineChaosMoments as string[])
            : []),
    routineScreenTime:
      body.routineScreenTime ?? (prev.routineScreenTime as Eu360Profile['routineScreenTime']),
    routineDesiredSupport:
      Array.isArray(body.routineDesiredSupport)
        ? body.routineDesiredSupport
        : (Array.isArray(prev.routineDesiredSupport)
            ? (prev.routineDesiredSupport as string[])
            : []),
    supportNetwork:
      Array.isArray(body.supportNetwork)
        ? body.supportNetwork
        : (Array.isArray(prev.supportNetwork) ? (prev.supportNetwork as string[]) : []),
    supportAvailability:
      body.supportAvailability ??
      (prev.supportAvailability as Eu360Profile['supportAvailability']),
    userContentPreferences:
      Array.isArray(body.userContentPreferences)
        ? body.userContentPreferences
        : (Array.isArray(prev.userContentPreferences)
            ? (prev.userContentPreferences as string[])
            : []),
    userGuidanceStyle:
      body.userGuidanceStyle ?? (prev.userGuidanceStyle as Eu360Profile['userGuidanceStyle']),
    userSelfcareFrequency:
      body.userSelfcareFrequency ??
      (prev.userSelfcareFrequency as Eu360Profile['userSelfcareFrequency']),
    figurinha: figurinhaToPersist,
    children:
      Array.isArray(body.children) && body.children.length > 0
        ? body.children
        : (Array.isArray(prev.children) ? prev.children : []),
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
}

export async function GET() {
  try {
    const raw = cookies().get(COOKIE)?.value
    const data = safeParse(raw)

    const response: Eu360Profile & { figurinha: string } = {
      name:
        (data.name as string) ||
        (data.motherName as string) ||
        (data.nomeMae as string) ||
        '',
      birthdate: (data.birthdate as string) ?? null,
      age_months:
        typeof data.age_months === 'number' ? (data.age_months as number) : null,
      userPreferredName: (data.userPreferredName as string) ?? '',
      userRole: data.userRole as Eu360Profile['userRole'],
      userEmotionalBaseline:
        data.userEmotionalBaseline as Eu360Profile['userEmotionalBaseline'],
      userMainChallenges: Array.isArray(data.userMainChallenges)
        ? (data.userMainChallenges as string[])
        : [],
      userEnergyPeakTime:
        data.userEnergyPeakTime as Eu360Profile['userEnergyPeakTime'],
      routineChaosMoments: Array.isArray(data.routineChaosMoments)
        ? (data.routineChaosMoments as string[])
        : [],
      routineScreenTime:
        data.routineScreenTime as Eu360Profile['routineScreenTime'],
      routineDesiredSupport: Array.isArray(data.routineDesiredSupport)
        ? (data.routineDesiredSupport as string[])
        : [],
      supportNetwork: Array.isArray(data.supportNetwork)
        ? (data.supportNetwork as string[])
        : [],
      supportAvailability:
        data.supportAvailability as Eu360Profile['supportAvailability'],
      userContentPreferences: Array.isArray(data.userContentPreferences)
        ? (data.userContentPreferences as string[])
        : [],
      userGuidanceStyle:
        data.userGuidanceStyle as Eu360Profile['userGuidanceStyle'],
      userSelfcareFrequency:
        data.userSelfcareFrequency as Eu360Profile['userSelfcareFrequency'],
      figurinha:
        (typeof data.figurinha === 'string' && data.figurinha) ||
        DEFAULT_STICKER_ID,
      children: Array.isArray(data.children) ? data.children : [],
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.debug(
      '[Eu360ProfileAPI] Error in GET:',
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
