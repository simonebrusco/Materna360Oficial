import { cache } from 'react'
import { supabaseServer } from './supabaseServer'
import { withTimeout } from './timeout'

type BabyProfile = { babyAgeMonths: number | null }

export const getBabyProfile = cache(async (): Promise<BabyProfile> => {
  try {
    const supabase = supabaseServer()
    const { data, error } = await withTimeout(
      supabase.from('baby_profiles').select('babyAgeMonths').single(),
      5000
    )
    if (error) return { babyAgeMonths: null }
    return { babyAgeMonths: (data as any)?.babyAgeMonths ?? null }
  } catch {
    return { babyAgeMonths: null }
  }
})
