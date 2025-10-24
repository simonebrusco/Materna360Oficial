export function getMindfulnessAudioUrl(filename: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BASE

  if (!base) {
    console.warn('[mindfulness] NEXT_PUBLIC_SUPABASE_AUDIO_BASE is not configured.')
    return filename
  }

  const normalizedBase = base.replace(/\/$/, '')
  return `${normalizedBase}/mindfulness/${filename}`
}

export async function headOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-store' })

    if (response.status === 403) {
      console.warn('[mindfulness] Forbidden fetching', url)
    }

    if (response.status === 405 || response.status === 501) {
      const rangeResponse = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        cache: 'no-store',
      })

      if (rangeResponse.status === 403) {
        console.warn('[mindfulness] Forbidden fetching', url)
      }

      return rangeResponse.ok || rangeResponse.status === 206
    }

    return response.ok
  } catch (error) {
    console.warn('[mindfulness] HEAD request failed', { url, error })
    return false
  }
}
