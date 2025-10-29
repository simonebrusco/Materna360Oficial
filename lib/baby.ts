export type BabyProfile = {
  babyAgeMonths: number | null
  babyName?: string | null
}

export async function getBabyProfile(): Promise<BabyProfile> {
  try {
    const response = await fetch('/api/eu360/profile', {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      return { babyAgeMonths: null }
    }

    const data = await response.json()
    return {
      babyAgeMonths: data?.babyAgeMonths ?? null,
      babyName: data?.name ?? null,
    }
  } catch (error) {
    console.error('Failed to get baby profile:', error)
    return { babyAgeMonths: null }
  }
}
