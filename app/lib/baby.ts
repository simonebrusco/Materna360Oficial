import { unstable_cache } from 'next/cache'

import { monthsFromBirthdate } from './age'
import { createServerSupabase } from './supabase'

type BabyProfile = {
  babyAgeMonths: number | null
}

export async function getBabyProfile(): Promise<BabyProfile> {
  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[BabyProfile] Failed to verify user:', authError.message)
  }

  if (!user) {
    return { babyAgeMonths: null }
  }

  const readBabyProfile = unstable_cache(
    async () => {
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
    },
    ['baby:read', user.id],
    {
      tags: ['baby'],
      revalidate: false,
    }
  )

  return readBabyProfile()
}
