import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

import { monthsFromBirthdate } from '@/app/lib/age'
import { tryCreateServerSupabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

type Eu360ProfilePayload = {
  name?: unknown
  birthdate?: unknown
  age_months?: unknown
  userPreferredName?: unknown
  userRole?: unknown
  userEmotionalBaseline?: unknown
  userMainChallenges?: unknown
  userEnergyPeakTime?: unknown
  routineChaosMoments?: unknown
  routineScreenTime?: unknown
  routineDesiredSupport?: unknown
  supportNetwork?: unknown
  supportAvailability?: unknown
  userContentPreferences?: unknown
  userGuidanceStyle?: unknown
  userSelfcareFrequency?: unknown
  figurinha?: unknown
  children?: unknown
}

type Eu360ProfileResponse = {
  name: string
  birthdate: string | null
  age_months: number | null
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string[]
  userEnergyPeakTime?: string
  routineChaosMoments?: string[]
  routineScreenTime?: string
  routineDesiredSupport?: string[]
  supportNetwork?: string[]
  supportAvailability?: string
  userContentPreferences?: string[]
  userGuidanceStyle?: string
  userSelfcareFrequency?: string
  figurinha?: string
  children?: any[]
}

const invalidResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })

const successResponse = (payload: Eu360ProfileResponse, useCache = false) =>
  NextResponse.json(payload, {
    status: 200,
    headers: useCache ? CACHE_HEADERS : NO_STORE_HEADERS
  })

function normalizeName(raw: unknown): string {
  if (typeof raw !== 'string') {
    return ''
  }
  return raw.trim().replace(/\s+/g, ' ')
}

function normalizeBirthdate(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  const now = new Date()
  if (parsed > now) {
    return null
  }
  return trimmed
}

function normalizeAgeMonths(raw: unknown): number | null {
  if (typeof raw !== 'number') {
    return null
  }
  if (!Number.isFinite(raw) || raw < 0) {
    return null
  }
  return Math.floor(raw)
}

export async function GET() {
  try {
    const supabase = tryCreateServerSupabase()
    if (!supabase) {
      console.error('[Eu360] Supabase client unavailable. Returning empty profile.')
      return successResponse({ name: '', birthdate: null, age_months: null }, true)
    }

    // Add a timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
    )

    const fetchPromise = (async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error('[Eu360] Failed to verify user:', authError.message)
      }

      if (!user) {
        return { name: '', birthdate: null, age_months: null }
      }

      const [profileResult, babyResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, user_preferred_name, user_role, user_emotional_baseline, user_main_challenges, user_energy_peak_time, routine_chaos_moments, routine_screen_time, routine_desired_support, support_network, support_availability, user_content_preferences, user_guidance_style, user_selfcare_frequency, figurinha, children')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('babies').select('birthdate, age_months').eq('user_id', user.id).maybeSingle(),
      ])

      if (profileResult.error) {
        console.error('[Eu360] Failed to load profile:', profileResult.error.message)
      }

      if (babyResult.error) {
        console.error('[Eu360] Failed to load baby profile:', babyResult.error.message)
      }

      const name = normalizeName(profileResult.data?.name ?? '')
      const birthdate = typeof babyResult.data?.birthdate === 'string' ? babyResult.data.birthdate : null
      const ageMonthsFromBirthdate = monthsFromBirthdate(birthdate)
      const ageMonths =
        ageMonthsFromBirthdate !== null
          ? ageMonthsFromBirthdate
          : typeof babyResult.data?.age_months === 'number'
            ? babyResult.data.age_months
            : null

      return {
        name,
        birthdate,
        age_months: ageMonths,
        userPreferredName: profileResult.data?.user_preferred_name,
        userRole: profileResult.data?.user_role,
        userEmotionalBaseline: profileResult.data?.user_emotional_baseline,
        userMainChallenges: profileResult.data?.user_main_challenges,
        userEnergyPeakTime: profileResult.data?.user_energy_peak_time,
        routineChaosMoments: profileResult.data?.routine_chaos_moments,
        routineScreenTime: profileResult.data?.routine_screen_time,
        routineDesiredSupport: profileResult.data?.routine_desired_support,
        supportNetwork: profileResult.data?.support_network,
        supportAvailability: profileResult.data?.support_availability,
        userContentPreferences: profileResult.data?.user_content_preferences,
        userGuidanceStyle: profileResult.data?.user_guidance_style,
        userSelfcareFrequency: profileResult.data?.user_selfcare_frequency,
        figurinha: profileResult.data?.figurinha,
        children: profileResult.data?.children,
      }
    })()

    const result = await Promise.race([fetchPromise, timeoutPromise])
    return successResponse(result as Eu360ProfileResponse, true)
  } catch (error) {
    console.error('[Eu360] Error in GET (returning cached default):', error instanceof Error ? error.message : error)
    return successResponse({ name: '', birthdate: null, age_months: null }, true)
  }
}

export async function POST(request: Request) {
  try {
    let body: Eu360ProfilePayload
    try {
      body = (await request.json()) as Eu360ProfilePayload
    } catch {
      return invalidResponse('Corpo da requisição inválido.')
    }

    const supabase = tryCreateServerSupabase()
    if (!supabase) {
      return invalidResponse('Serviço temporariamente indisponível. Tente novamente em instantes.', 503)
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return invalidResponse('Usuário não autenticado.', 401)
    }

    const name = normalizeName(body.name)
    if (!name || name.length < 2) {
      return invalidResponse('Informe um nome válido com pelo menos 2 caracteres.')
    }

    const birthdate = normalizeBirthdate(body.birthdate)
    const ageMonthsRaw = normalizeAgeMonths(body.age_months)
    const ageMonths = birthdate ? null : ageMonthsRaw

    // Prepare profile data with EU360 2.0 fields
    const profileData = {
      user_id: user.id,
      name,
      user_preferred_name: body.userPreferredName,
      user_role: body.userRole,
      user_emotional_baseline: body.userEmotionalBaseline,
      user_main_challenges: body.userMainChallenges,
      user_energy_peak_time: body.userEnergyPeakTime,
      routine_chaos_moments: body.routineChaosMoments,
      routine_screen_time: body.routineScreenTime,
      routine_desired_support: body.routineDesiredSupport,
      support_network: body.supportNetwork,
      support_availability: body.supportAvailability,
      user_content_preferences: body.userContentPreferences,
      user_guidance_style: body.userGuidanceStyle,
      user_selfcare_frequency: body.userSelfcareFrequency,
      figurinha: body.figurinha,
      children: body.children,
    }

    const {
      data: profileUpsertData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select('name')
      .maybeSingle()

    if (profileError) {
      console.error('[Eu360] Failed to persist Eu360 profile:', profileError)
      return invalidResponse('Não foi possível salvar agora. Tente novamente em instantes.', 500)
    }

    if (birthdate || ageMonths !== null) {
      const {
        data: babyData,
        error: babyError,
      } = await supabase
        .from('babies')
        .upsert({
          user_id: user.id,
          birthdate,
          age_months: ageMonths,
        })
        .select('birthdate, age_months')
        .maybeSingle()

      if (babyError) {
        console.error('[Eu360] Failed to persist baby profile:', babyError)
        return invalidResponse('Não foi possível salvar agora. Tente novamente em instantes.', 500)
      }
    }

    revalidateTag('profile')
    revalidateTag('baby')

    const responsePayload: Eu360ProfileResponse = {
      name,
      birthdate,
      age_months: birthdate ? monthsFromBirthdate(birthdate) : ageMonths,
    }

    return successResponse(responsePayload)
  } catch (error) {
    console.error('[Eu360] Unexpected error in POST:', error)
    return invalidResponse('Erro ao processar requisição. Tente novamente em instantes.', 500)
  }
}
