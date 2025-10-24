'use server'

import { monthsFromBirthdate } from './age'
import { supabaseServer } from './supabase'

type BabyProfile = {
  babyAgeMonths: number | null
}

export async function getBabyProfile(): Promise<BabyProfile> {
  const supabase = supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { babyAgeMonths: null }
  }

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

  const storedMonths = typeof data?.age_months === 'number' ? data.age_months : null
  return { babyAgeMonths: storedMonths }
}
