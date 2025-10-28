import { unstable_cache } from 'next/cache'

import { monthsFromBirthdate } from './age'
import { tryCreateServerSupabase } from './supabase'

type BabyProfile = {
  babyAgeMonths: number | null
}

export async function getBabyProfile(): Promise<BabyProfile> {
  try {
    const supabase = tryCreateServerSupabase()
    if (!supabase) {
      return { babyAgeMonths: null }
    }

    // Add timeout to prevent hanging
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('User fetch timeout')), 5000)
    )

    const {
      data: { user },
      error: authError,
    } = await Promise.race([userPromise, timeoutPromise as any])

    if (authError) {
      console.error('[BabyProfile] Failed to verify user:', authError.message)
      return { babyAgeMonths: null }
    }

    if (!user) {
      return { babyAgeMonths: null }
    }

    const readBabyProfile = unstable_cache(
      async () => {
        try {
          const { data, error } = await supabase
            .from('babies')
            .select('birthdate, age_months')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            console.error('[BabyProfile] Failed to load baby profile:', error.message)
            return { babyAgeMonths: null }
          }

          const computedMonths = monthsFromBirthdate(data?.birthdate ?? null)
          if (computedMonths !== null) {
            return { babyAgeMonths: computedMonths }
          }

          const storedMonths =
            typeof data?.age_months === 'number' && Number.isFinite(data.age_months) && data.age_months >= 0
              ? Math.floor(data.age_months)
              : null

          return { babyAgeMonths: storedMonths }
        } catch (error) {
          console.error('[BabyProfile] Query error:', error)
          return { babyAgeMonths: null }
        }
      },
      ['baby:read', user.id],
      {
        tags: ['baby'],
        revalidate: 60,
      }
    )

    return readBabyProfile()
  } catch (error) {
    console.error('[BabyProfile] Unexpected error:', error)
    return { babyAgeMonths: null }
  }
}
