export async function safeFetch(
  url: string,
  opts: RequestInit = {},
  retries = 2,
  timeoutMs = 5000
): Promise<Response> {
  let lastErr: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...opts,
        signal: controller.signal,
      })
      clearTimeout(t)

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res
    } catch (err) {
      clearTimeout(t)
      lastErr = err
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 150 * (attempt + 1))) // 150ms, 300ms
        continue
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('safeFetch failed')
}
